from rest_framework import serializers

from accounts.models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "phone_number",
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            phone_number=validated_data.get("phone_number", ""),
        )

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone_number",
            "role",
        ]
        read_only_fields = [
            "id",
            "role",
        ]


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "email",
            "phone_number",
            "first_name",
            "last_name",
        ]

    def validate_email(self, value):
        user = self.context["request"].user

        if (
            User.objects.exclude(pk=user.pk)
            .filter(email__iexact=value)
            .exists()
        ):
            raise serializers.ValidationError(
                "That email is already in use."
            )

        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    def validate_current_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "Current password is incorrect."
            )

        return value

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError(
                "New password must be at least 8 characters."
            )

        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class DeactivateAccountSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "Password is incorrect."
            )

        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.is_active = False
        user.save(update_fields=["is_active"])
        return user