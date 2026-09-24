from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

User = get_user_model()


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    # write_only : le mot de passe n'apparaît jamais dans la réponse
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        # Validateurs de AUTH_PASSWORD_VALIDATORS ; l'utilisateur non enregistré
        # permet de refuser un mot de passe trop proche de l'identifiant
        candidate = User(username=attrs["username"], email=attrs.get("email", ""))
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": list(error.messages)})
        return attrs

    def create(self, validated_data):
        # create_user hache le mot de passe (jamais stocké en clair)
        return User.objects.create_user(**validated_data)
