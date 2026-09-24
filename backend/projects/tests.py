from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Project

User = get_user_model()


class ProjectAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="secret")
        self.other_user = User.objects.create_user(username="bob", password="secret")
        self.client.force_authenticate(self.user)

        self.project = Project.objects.create(
            title="Étude pilote", status=Project.Status.ACTIVE, owner=self.user
        )
        self.other_project = Project.objects.create(
            title="Étude de Bob", owner=self.other_user
        )
        self.list_url = reverse("project-list")
        self.detail_url = reverse("project-detail", args=[self.project.id])
        self.other_detail_url = reverse(
            "project-detail", args=[self.other_project.id]
        )

    def test_list(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Étude pilote")
        self.assertEqual(response.data[0]["owner"], self.user.id)

    def test_create(self):
        response = self.client.post(
            self.list_url, {"id": 999, "title": "Nouvelle étude"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data["id"], 999)
        self.assertEqual(response.data["status"], Project.Status.DRAFT)
        self.assertTrue(Project.objects.filter(title="Nouvelle étude").exists())

    def test_create_assigns_current_user_as_owner(self):
        response = self.client.post(
            self.list_url,
            {"title": "Étude usurpée", "owner": self.other_user.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["owner"], self.user.id)
        project = Project.objects.get(title="Étude usurpée")
        self.assertEqual(project.owner, self.user)

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

    def test_update_cannot_change_owner(self):
        response = self.client.patch(
            self.detail_url, {"owner": self.other_user.id}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.owner, self.user)

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

    def test_other_users_project_returns_404(self):
        for method in ("get", "put", "patch", "delete"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(
                    self.other_detail_url, {"title": "Piratage"}, format="json"
                )
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        self.other_project.refresh_from_db()
        self.assertEqual(self.other_project.title, "Étude de Bob")

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(None)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TokenAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="secret")
        Project.objects.create(title="Étude pilote", owner=self.user)

    def test_obtain_refresh_and_use_token(self):
        response = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "alice", "password": "secret"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        refresh_response = self.client.post(
            reverse("token_refresh"),
            {"refresh": response.data["refresh"]},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh_response.data['access']}"
        )
        projects_response = self.client.get(reverse("project-list"))
        self.assertEqual(projects_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(projects_response.data), 1)

    def test_wrong_password_returns_401(self):
        response = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "alice", "password": "mauvais"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProjectIsolationTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="secret")
        self.bob = User.objects.create_user(username="bob", password="secret")

        self.alice_project = Project.objects.create(
            title="Étude d'Alice", owner=self.alice
        )
        self.bob_project = Project.objects.create(
            title="Étude de Bob",
            description="Protocole confidentiel",
            status=Project.Status.ACTIVE,
            owner=self.bob,
        )
        self.list_url = reverse("project-list")
        self.alice_detail_url = reverse(
            "project-detail", args=[self.alice_project.id]
        )
        self.bob_detail_url = reverse("project-detail", args=[self.bob_project.id])

        self.client.force_authenticate(self.alice)

    def test_list_excludes_other_users_projects(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [project["id"] for project in response.data]
        self.assertIn(self.alice_project.id, ids)
        self.assertNotIn(self.bob_project.id, ids)

    def test_retrieve_other_users_project_returns_404(self):
        response = self.client.get(self.bob_detail_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_other_users_project_returns_404_and_leaves_it_unchanged(self):
        response = self.client.patch(
            self.bob_detail_url,
            {"title": "Piratage", "status": Project.Status.CLOSED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.bob_project.refresh_from_db()
        self.assertEqual(self.bob_project.title, "Étude de Bob")
        self.assertEqual(self.bob_project.status, Project.Status.ACTIVE)
        self.assertEqual(self.bob_project.owner, self.bob)

    def test_delete_other_users_project_returns_404_and_keeps_it(self):
        response = self.client.delete(self.bob_detail_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Project.objects.filter(id=self.bob_project.id).exists())

    def test_unauthenticated_list_returns_401(self):
        self.client.force_authenticate(None)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_detail_returns_401(self):
        self.client.force_authenticate(None)

        response = self.client.get(self.alice_detail_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
