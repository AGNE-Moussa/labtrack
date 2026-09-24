from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import CurrentUserSerializer


class CurrentUserView(APIView):
    """Renvoie l'utilisateur connecté (le token JWT ne contient que son id)."""

    # Explicite : la route reste protégée même si le défaut global change
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)
