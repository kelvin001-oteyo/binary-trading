from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from accounts.views import (
    ChangePasswordView,
    CurrentUserView,
    DeactivateAccountView,
    RegisterView,
    UpdateProfileView,
)


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path(
        "update-profile/",
        UpdateProfileView.as_view(),
        name="update-profile",
    ),
    path(
        "change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),
    path(
        "deactivate/",
        DeactivateAccountView.as_view(),
        name="deactivate-account",
    ),
]