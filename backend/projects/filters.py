from rest_framework import filters


class StableOrderingFilter(filters.OrderingFilter):
    """OrderingFilter qui départage toujours les égalités par id.

    Sans ce départage, deux projets de même statut (ou même titre) peuvent
    s'échanger entre deux requêtes LIMIT/OFFSET : un projet apparaît alors
    sur deux pages et un autre sur aucune.
    """

    def get_ordering(self, request, queryset, view):
        ordering = list(super().get_ordering(request, queryset, view) or [])
        if not any(field.lstrip("-") in ("id", "pk") for field in ordering):
            ordering.append("-id")
        return ordering
