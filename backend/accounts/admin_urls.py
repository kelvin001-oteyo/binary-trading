from django.urls import path

from accounts.admin_views import (
    AdminAIConfigurationView,
    AdminDashboardView,
    AdminReportsView,
    AdminTradesView,
    AdminUserDetailView,
    AdminUserStatusView,
    AdminUsersView,
    AdminWalletView,
)
urlpatterns = [
    path(
        "dashboard/",
        AdminDashboardView.as_view(),
        name="admin-dashboard",
    ),

    path(
        "users/",
        AdminUsersView.as_view(),
        name="admin-users",
    ),

    path(
        "users/<int:pk>/",
        AdminUserDetailView.as_view(),
        name="admin-user-detail",
    ),

    path(
        "users/<int:pk>/status/",
        AdminUserStatusView.as_view(),
        name="admin-user-status",
    ),

    path(
        "users/<int:pk>/wallet/",
        AdminWalletView.as_view(),
        name="admin-user-wallet",
    ),

    path(
        "trades/",
        AdminTradesView.as_view(),
        name="admin-trades",
    ),

path(
    "ai/",
    AdminAIConfigurationView.as_view(),
    name="admin-ai",
),

path(
    "reports/",
    AdminReportsView.as_view(),
    name="admin-reports",
),
]