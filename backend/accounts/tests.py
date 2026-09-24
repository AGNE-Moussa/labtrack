from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class CurrentUserAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="secret")
        self.url = reverse("current-user")

    def test_returns_current_user(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"id": self.user.id, "username": "alice"})

    def test_unauthenticated_returns_401(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_current_user_with_jwt(self):
        access = RefreshToken.for_user(self.user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "alice")

    def test_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalide")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_only_get_is_allowed(self):
        self.client.force_authenticate(self.user)

        for method in ("post", "put", "patch", "delete"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(self.url)
                self.assertEqual(
                    response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED
                )


class RegisterAPITests(APITestCase):
    def setUp(self):
        # Le compteur du throttle vit dans le cache : on repart de zéro
        cache.clear()
        self.url = reverse("register")
        self.payload = {
            "username": "carol",
            "email": "carol@example.com",
            "password": "Labo-Recherche-2026",
        }

    def test_register_creates_user_with_hashed_password(self):
        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "carol")
        self.assertNotIn("password", response.data)
        user = User.objects.get(username="carol")
        self.assertNotEqual(user.password, "Labo-Recherche-2026")
        self.assertTrue(user.check_password("Labo-Recherche-2026"))

    def test_registered_user_can_obtain_token(self):
        self.client.post(self.url, self.payload, format="json")

        response = self.client.post(
            reverse("token_obtain_pair"),
            {"username": "carol", "password": "Labo-Recherche-2026"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_duplicate_username_returns_400(self):
        User.objects.create_user(username="carol", password="secret")

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_weak_password_returns_400(self):
        for password in ("court", "12345678901", "password123", "carol2026"):
            with self.subTest(password=password):
                response = self.client.post(
                    self.url, {**self.payload, "password": password}, format="json"
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("password", response.data)

        self.assertFalse(User.objects.filter(username="carol").exists())

    def test_cannot_register_as_superuser(self):
        response = self.client.post(
            self.url,
            {**self.payload, "is_superuser": True, "is_staff": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="carol")
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_staff)

    def test_expired_token_does_not_block_registration(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalide")

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_registration_is_throttled(self):
        for index in range(10):
            self.client.post(
                self.url, {**self.payload, "username": f"user{index}"}, format="json"
            )

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
