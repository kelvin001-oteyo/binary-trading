from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.serializers import (
    ChangePasswordSerializer,
    DeactivateAccountSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = UpdateProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"detail": "Password updated successfully."},
            status=status.HTTP_200_OK,
        )


class DeactivateAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeactivateAccountSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "detail": (
                    "Account deactivated. "
                    "An admin can reactivate it."
                )
            },
            status=status.HTTP_200_OK,
        )


class TemporaryAdminResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        reset_key = request.data.get("reset_key")
        username = request.data.get("username")
        password = request.data.get("password")

        expected_key = getattr(settings, "ADMIN_RESET_KEY", "")

        if not expected_key or reset_key != expected_key:
            return Response(
                {"detail": "Invalid reset key."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not username or not password:
            return Response(
                {"detail": "username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 8:
            return Response(
                {"detail": "Password must contain at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        User = get_user_model()

        user = User.objects.filter(
            email="oteyikelvin@gmail.com"
        ).first()

        if not user:
            user = User.objects.filter(
                username=username
            ).first()

        if not user:
            return Response(
                {"detail": "Admin user was not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.username = username
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        return Response(
            {
                "detail": "Admin account reset successfully.",
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )