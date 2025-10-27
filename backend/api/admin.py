from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import UserProfile, AnalyticsLog

# Inline admin for UserProfile
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('is_premium', 'premium_since', 'lichess_username', 'total_analyses')

# Extend the User admin
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_premium', 'total_analyses')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'profile__is_premium')
    
    def is_premium(self, obj):
        return obj.profile.is_premium
    is_premium.boolean = True
    is_premium.short_description = 'Premium'
    
    def total_analyses(self, obj):
        return obj.profile.total_analyses
    total_analyses.short_description = 'Analyses'

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Register other models
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_premium', 'premium_since', 'total_analyses', 'created_at')
    list_filter = ('is_premium', 'created_at')
    search_fields = ('user__username', 'user__email', 'lichess_username')

@admin.register(AnalyticsLog)
class AnalyticsLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'timestamp', 'ip_address')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__username', 'action', 'details')
    readonly_fields = ('timestamp',)
