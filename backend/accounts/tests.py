from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

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
