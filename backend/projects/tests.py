from datetime import timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .management.commands.seed_demo import DEMO_PROJECTS
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
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Étude pilote")
        self.assertEqual(response.data["results"][0]["owner"], self.user.id)

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
        self.assertEqual(len(projects_response.data["results"]), 1)

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
        ids = [project["id"] for project in response.data["results"]]
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


class ProjectFilterTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="secret")
        self.bob = User.objects.create_user(username="bob", password="secret")
        self.client.force_authenticate(self.alice)

        Project.objects.create(
            title="Cohorte sommeil", status=Project.Status.ACTIVE, owner=self.alice
        )
        Project.objects.create(
            title="Attention visuelle",
            description="Protocole oculométrie",
            status=Project.Status.DRAFT,
            owner=self.alice,
        )
        Project.objects.create(
            title="Bilan mémoire", status=Project.Status.CLOSED, owner=self.alice
        )
        Project.objects.create(
            title="Sommeil de Bob", status=Project.Status.ACTIVE, owner=self.bob
        )
        self.list_url = reverse("project-list")
        self.stats_url = reverse("project-stats")

    def titles(self, response):
        return [project["title"] for project in response.data["results"]]

    def test_filter_by_status(self):
        response = self.client.get(self.list_url, {"status": "active"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.titles(response), ["Cohorte sommeil"])

    def test_invalid_status_filter_returns_400(self):
        response = self.client.get(self.list_url, {"status": "invalide"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search_in_title_and_description(self):
        by_title = self.client.get(self.list_url, {"search": "sommeil"})
        by_description = self.client.get(self.list_url, {"search": "oculo"})

        # La recherche ignore la casse et ne renvoie pas le projet de bob
        self.assertEqual(self.titles(by_title), ["Cohorte sommeil"])
        self.assertEqual(self.titles(by_description), ["Attention visuelle"])

    def test_ordering_by_title(self):
        ascending = self.client.get(self.list_url, {"ordering": "title"})
        descending = self.client.get(self.list_url, {"ordering": "-title"})

        expected = ["Attention visuelle", "Bilan mémoire", "Cohorte sommeil"]
        self.assertEqual(self.titles(ascending), expected)
        self.assertEqual(self.titles(descending), expected[::-1])

    def test_default_ordering_is_newest_first(self):
        # Dates fixées : ne dépend pas de la précision de l'horloge
        for days, title in enumerate(["Bilan mémoire", "Cohorte sommeil"]):
            Project.objects.filter(title=title).update(
                created_at=timezone.now() + timedelta(days=days + 1)
            )

        response = self.client.get(self.list_url)

        self.assertEqual(
            self.titles(response),
            ["Cohorte sommeil", "Bilan mémoire", "Attention visuelle"],
        )

    def test_disallowed_ordering_field_is_ignored(self):
        default = self.client.get(self.list_url)

        for field in ("owner__username", "description"):
            with self.subTest(field=field):
                response = self.client.get(self.list_url, {"ordering": field})
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(self.titles(response), self.titles(default))

    def test_pagination_is_stable_with_equal_sort_values(self):
        for index in range(12):
            Project.objects.create(title=f"Étude {index}", owner=self.alice)

        ids = []
        for page in (1, 2):
            response = self.client.get(
                self.list_url, {"ordering": "status", "page": page}
            )
            ids += [project["id"] for project in response.data["results"]]

        # 15 projets au total : chacun apparaît exactement une fois
        self.assertEqual(len(ids), 15)
        self.assertEqual(len(set(ids)), 15)

    def test_pagination(self):
        for index in range(9):
            Project.objects.create(title=f"Étude {index}", owner=self.alice)

        first_page = self.client.get(self.list_url)
        second_page = self.client.get(self.list_url, {"page": 2})
        out_of_range = self.client.get(self.list_url, {"page": 99})

        self.assertEqual(first_page.data["count"], 12)
        self.assertEqual(first_page.data["total_pages"], 2)
        self.assertEqual(len(first_page.data["results"]), 10)
        self.assertIsNotNone(first_page.data["next"])
        self.assertEqual(len(second_page.data["results"]), 2)
        self.assertIsNone(second_page.data["next"])
        self.assertIsNotNone(second_page.data["previous"])
        self.assertEqual(out_of_range.status_code, status.HTTP_404_NOT_FOUND)
        invalid = self.client.get(self.list_url, {"page": "abc"})
        self.assertEqual(invalid.status_code, status.HTTP_404_NOT_FOUND)

    def test_stats_count_only_own_projects(self):
        # Deux projets actifs : vérifie que le GROUP BY regroupe bien par statut
        Project.objects.create(
            title="Deuxième étude active", status=Project.Status.ACTIVE, owner=self.alice
        )

        with self.assertNumQueries(1):
            response = self.client.get(self.stats_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data, {"draft": 1, "active": 2, "closed": 1, "total": 4}
        )

    def test_stats_ignore_list_filters(self):
        response = self.client.get(
            self.stats_url, {"status": "active", "search": "sommeil"}
        )

        self.assertEqual(
            response.data, {"draft": 1, "active": 1, "closed": 1, "total": 3}
        )

    def test_stats_for_user_without_projects(self):
        carol = User.objects.create_user(username="carol", password="secret")
        self.client.force_authenticate(carol)

        response = self.client.get(self.stats_url)

        self.assertEqual(
            response.data, {"draft": 0, "active": 0, "closed": 0, "total": 0}
        )

    def test_stats_requires_authentication(self):
        self.client.force_authenticate(None)

        response = self.client.get(self.stats_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SeedDemoCommandTests(APITestCase):
    def test_creates_demo_user_and_projects(self):
        call_command("seed_demo", stdout=StringIO())

        user = User.objects.get(username="demo")
        self.assertTrue(user.check_password("labtrack-demo"))
        self.assertEqual(user.projects.count(), len(DEMO_PROJECTS))

    def test_is_idempotent_and_keeps_other_users_projects(self):
        other = User.objects.create_user(username="alice", password="secret")
        Project.objects.create(title="Projet d'Alice", owner=other)

        call_command("seed_demo", stdout=StringIO())
        call_command("seed_demo", "--password", "autre-mot-de-passe", stdout=StringIO())

        demo = User.objects.get(username="demo")
        self.assertEqual(demo.projects.count(), len(DEMO_PROJECTS))
        self.assertTrue(demo.check_password("autre-mot-de-passe"))
        self.assertTrue(Project.objects.filter(owner=other).exists())
