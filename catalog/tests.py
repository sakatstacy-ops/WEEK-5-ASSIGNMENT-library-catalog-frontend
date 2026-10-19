from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class LibraryAuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def register(self, email="reader@example.com", password="LeafyRiver482!", name="Reader"):
        return self.client.post(
            "/api/auth/register",
            {"email": email, "password": password, "name": name},
            format="json",
        )

    def test_register_creates_account_and_token(self):
        response = self.register()

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["token"])
        self.assertEqual(response.data["user"]["email"], "reader@example.com")

    def test_register_rejects_duplicate_email_case_insensitively(self):
        self.register()

        response = self.register(email="READER@example.com")

        self.assertEqual(response.status_code, 400)
        self.assertIn("already exists", response.data["email"][0])
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_login_rejects_wrong_password(self):
        self.register()

        response = self.client.post(
            "/api/auth/login",
            {"email": "reader@example.com", "password": "not-the-password"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertIn("incorrect", response.data["detail"])

    def test_login_returns_token_for_valid_credentials(self):
        self.register()

        response = self.client.post(
            "/api/auth/login",
            {"email": "reader@example.com", "password": "LeafyRiver482!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["token"])

    def test_current_user_requires_token(self):
        response = self.client.get("/api/auth/me")

        self.assertEqual(response.status_code, 401)

    def test_current_user_accepts_token(self):
        registration = self.register()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {registration.data['token']}")

        response = self.client.get("/api/auth/me")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["email"], "reader@example.com")

    def test_catalog_is_public(self):
        response = self.client.get("/api/books/")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 4)

    def test_frontend_routes_load_on_direct_navigation(self):
        for route in ("/", "/login", "/register", "/reading-list", "/booking"):
            with self.subTest(route=route):
                response = self.client.get(route)
                self.assertEqual(response.status_code, 200)
                self.assertContains(response, 'id="root"')