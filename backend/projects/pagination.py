from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class ProjectPagination(PageNumberPagination):
    page_size = 10

    def get_paginated_response(self, data):
        # En plus du format DRF standard, on donne le nombre de pages
        # pour que le frontend affiche « page X sur Y » sans refaire le calcul
        return Response(
            {
                "count": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )
