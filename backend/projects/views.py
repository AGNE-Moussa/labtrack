from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import StableOrderingFilter
from .models import Project
from .pagination import ProjectPagination
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    pagination_class = ProjectPagination

    # Appliqués après get_queryset : ils ne voient que les projets de l'utilisateur
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        StableOrderingFilter,
    ]
    filterset_fields = ["status"]  # ?status=active
    search_fields = ["title", "description"]  # ?search=pilote
    ordering_fields = ["title", "created_at", "start_date", "status"]  # ?ordering=-title
    ordering = ["-created_at"]

    def get_queryset(self):
        # Un utilisateur ne voit que ses projets : ceux des autres renvoient 404.
        return Project.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False)
    def stats(self, request):
        """GET /api/projects/stats/ : nombre de projets par statut (sans les filtres)."""
        counts = dict(
            self.get_queryset()
            .order_by()
            .values_list("status")
            .annotate(total=Count("id"))
        )
        data = {status: counts.get(status, 0) for status in Project.Status.values}
        data["total"] = sum(data.values())
        return Response(data)
