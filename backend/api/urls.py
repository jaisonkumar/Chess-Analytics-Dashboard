from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', views.get_current_user, name='current_user'),
    path('logout/', views.logout_view, name='logout'),
    
    # Admin endpoints
    path('admin/users/', views.get_all_users, name='admin_users'),
    path('admin/users/<int:user_id>/toggle-premium/', views.toggle_premium, name='toggle_premium'),
    path('admin/users/<int:user_id>/toggle-active/', views.toggle_user_active, name='toggle_active'),
    path('admin/analytics/', views.get_analytics, name='analytics'),
    
    # User endpoints
    path('request-premium/', views.request_premium, name='request_premium'),
    
    # Lichess data endpoints (your existing ones)
    path('user-profile/<str:username>/', views.user_profile, name='user_profile'),
    path('rating-history/<str:username>/', views.rating_history, name='rating_history'),
    path('predict-future-ratings/<str:username>/', views.predict_future_ratings, name='predict_future_ratings'),
    path('opening-repertoire/<str:username>/', views.opening_repertoire_view, name='opening_repertoire'),

]
