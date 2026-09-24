from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .serializers import CurrentUserSerializer, RegisterSerializer


class CurrentUserView(APIView):
    """Renvoie l'utilisateur connecté (le token JWT ne contient que son id)."""

    # Explicite : la route reste protégée même si le défaut global change
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)


class RegisterView(generics.CreateAPIView):
    """Crée un compte. Le frontend enchaîne ensuite sur /api/token/."""

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    # Pas d'authentification : un token expiré resté dans le navigateur
    # ne doit pas faire échouer l'inscription avec un 401
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"
