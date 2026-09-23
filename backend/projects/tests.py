from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Project


class ProjectAPITests(APITestCase):
    def setUp(self):
        self.project = Project.objects.create(
            title="Étude pilote", status=Project.Status.ACTIVE
        )
        self.list_url = reverse("project-list")
        self.detail_url = reverse("project-detail", args=[self.project.id])

    def test_list(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Étude pilote")

    def test_create(self):
        response = self.client.post(
            self.list_url, {"id": 999, "title": "Nouvelle étude"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data["id"], 999)
        self.assertEqual(response.data["status"], Project.Status.DRAFT)
        self.assertTrue(Project.objects.filter(title="Nouvelle étude").exists())

    def test_retrieve(self):
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.project.id)
        self.assertEqual(response.data["title"], "Étude pilote")
        self.assertEqual(response.data["status"], Project.Status.ACTIVE)

    def test_update(self):
        response = self.client.put(
            self.detail_url,
            {"title": "Étude pilote v2", "status": Project.Status.CLOSED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.title, "Étude pilote v2")
        self.assertEqual(self.project.status, Project.Status.CLOSED)

    def test_delete(self):
        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(id=self.project.id).exists())

    def test_invalid_status_returns_400(self):
        response = self.client.post(
            self.list_url,
            {"title": "Étude invalide", "status": "invalide"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)
        self.assertFalse(Project.objects.filter(title="Étude invalide").exists())
