from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta
import os
from collections import defaultdict
from datetime import datetime

from . import lichess_client
from .lichess_client import fetch_rating_history, fetch_user_profile
from .rating_predictor import RatingPredictor
from .lichess_opening_stats import analyze_openings
from .serializers import (
    UserSerializer, RegisterSerializer, UserManagementSerializer, 
    AnalyticsLogSerializer, UserProfileSerializer
)
from .models import UserProfile, AnalyticsLog


# Middleware to log user activity
def log_analysis(user, action, details=''):
    AnalyticsLog.objects.create(
        user=user,
        action=action,
        details=details
    )
    if user.is_authenticated:
        profile = user.profile
        profile.total_analyses += 1
        profile.last_login = timezone.now()
        profile.save()


# ========== Basic API Endpoints ==========

@api_view(['GET'])
def health(request):
    return Response({'ok': True})


@api_view(['GET'])
def account(request):
    token = request.query_params.get('token') or os.environ.get('LICHESS_TOKEN')
    if not token:
        return Response({'error':'No token provided'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        data = lichess_client.fetch_account(token)
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def user_games(request, username):
    token = request.query_params.get('token') or os.environ.get('LICHESS_TOKEN')
    maxg = request.query_params.get('max') or 10
    try:
        data = lichess_client.fetch_user_games(username, token, maxg)
        return Response({'games': data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def export_pgn(request, game_id):
    token = request.query_params.get('token') or os.environ.get('LICHESS_TOKEN')
    try:
        pgn = lichess_client.export_game(game_id, token)
        return Response(pgn, content_type='text/plain')
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== Lichess Data Endpoints ==========

@api_view(['GET'])
def rating_history(request, username):
    try:
        data = fetch_rating_history(username)
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def user_profile(request, username):
    try:
        data = fetch_user_profile(username)
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def predict_future_ratings(request, username):
    # Create profile if doesn't exist
    if not hasattr(request.user, 'profile'):
        UserProfile.objects.create(user=request.user)
    
    # Check if user is premium or superuser
    if not request.user.is_superuser and not request.user.profile.is_premium:
        return Response({
            'error': 'Premium feature',
            'message': 'Upgrade to premium to access rating predictions'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Log the analysis
    log_analysis(request.user, 'RATING_PREDICTION', f'Predicted ratings for {username}')

    try:
        rating_history_data = fetch_rating_history(username)
        variants_to_predict = ['bullet', 'blitz', 'rapid']
        predictions = {}

        for variant in variants_to_predict:
            variant_data = next((v for v in rating_history_data if v['name'].lower() == variant), None)
            if not variant_data or not variant_data.get('points'):
                predictions[variant] = []
                continue

            predictor = RatingPredictor()
            predictor.train(variant_data['points'])
            pred = predictor.predict_next_n(n_months=60)
            predictions[variant] = pred

        return Response(predictions)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def opening_repertoire_view(request, username):
    try:
        stats = analyze_openings(username)
        # Convert defaultdict structure to regular dict for JSON serialization
        stats = {color: dict(openings) for color, openings in stats.items()}
        return Response(stats)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== Authentication Endpoints ==========

# Register View
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


# Login View
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


# Get Current User
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# Logout View
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ========== Admin Endpoints ==========

# Admin: Get all users
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_all_users(request):
    users = User.objects.all().select_related('profile')
    serializer = UserManagementSerializer(users, many=True)
    return Response(serializer.data)


# Admin: Toggle premium status
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def toggle_premium(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        
        # Create profile if it doesn't exist
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user)
        
        profile = user.profile
        profile.is_premium = not profile.is_premium
        if profile.is_premium:
            profile.premium_since = timezone.now()
        else:
            profile.premium_since = None
        profile.save()
        
        # Log action
        AnalyticsLog.objects.create(
            user=request.user,
            action='PREMIUM_TOGGLE',
            details=f"Set {user.username} premium status to {profile.is_premium}"
        )
        
        return Response({
            'success': True,
            'user': UserManagementSerializer(user).data
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# Admin: Toggle user active status
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def toggle_user_active(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        if user.is_superuser:
            return Response({'error': 'Cannot deactivate superuser'}, status=status.HTTP_403_FORBIDDEN)
        
        user.is_active = not user.is_active
        user.save()
        
        AnalyticsLog.objects.create(
            user=request.user,
            action='USER_ACTIVE_TOGGLE',
            details=f"Set {user.username} active status to {user.is_active}"
        )
        
        return Response({
            'success': True,
            'user': UserManagementSerializer(user).data
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# Admin: Get website analytics
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_analytics(request):
    total_users = User.objects.count()
    premium_users = UserProfile.objects.filter(is_premium=True).count()
    active_users = User.objects.filter(is_active=True).count()
    
    # Users joined in last 30 days
    thirty_days_ago = timezone.now() - timedelta(days=30)
    new_users = User.objects.filter(date_joined__gte=thirty_days_ago).count()
    
    # Recent activity logs
    recent_logs = AnalyticsLog.objects.all()[:50]
    
    # User growth over time (last 12 months)
    user_growth = []
    for i in range(12, 0, -1):
        month_start = timezone.now() - timedelta(days=30*i)
        month_end = timezone.now() - timedelta(days=30*(i-1))
        count = User.objects.filter(date_joined__range=[month_start, month_end]).count()
        user_growth.append({
            'month': month_start.strftime('%b %Y'),
            'count': count
        })
    
    return Response({
        'total_users': total_users,
        'premium_users': premium_users,
        'active_users': active_users,
        'new_users_30d': new_users,
        'user_growth': user_growth,
        'recent_logs': AnalyticsLogSerializer(recent_logs, many=True).data
    })


# User: Request premium upgrade
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_premium(request):
    user = request.user
    
    # Log the request
    AnalyticsLog.objects.create(
        user=user,
        action='PREMIUM_REQUEST',
        details=f"{user.username} requested premium upgrade"
    )
    
    return Response({
        'success': True,
        'message': 'Premium upgrade request submitted. An admin will review it soon.'
    })