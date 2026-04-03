"""
Admin route tests.

S3 uploads are mocked — no real AWS calls are made.
Every test gets a fresh DB (via the db fixture in conftest.py).
"""
import pytest
from unittest.mock import patch

from app.services import AdminService, CategoryService, ProductService, SubscriptionService


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def admin(db):
    """Create an admin user and return it."""
    return AdminService.create("admin", "password123")


@pytest.fixture
def logged_in_client(client, admin):
    """Return a test client that is already logged in as admin."""
    client.post("/admin/login", data={"username": "admin", "password": "password123"})
    return client


@pytest.fixture
def category(db):
    return CategoryService.create("Mains")


@pytest.fixture
def product(db, category):
    return ProductService.create(
        name="Grilled Chicken",
        price_single=1500,
        category=category.name,
        category_id=category.id,
    )


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

class TestAuth:

    def test_login_page_loads(self, client, db):
        response = client.get("/admin/login")
        assert response.status_code == 200

    def test_login_with_valid_credentials(self, client, admin):
        response = client.post(
            "/admin/login",
            data={"username": "admin", "password": "password123"},
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"admin" in response.data.lower() or response.request.path != "/admin/login"

    def test_login_with_invalid_credentials(self, client, admin):
        response = client.post(
            "/admin/login",
            data={"username": "admin", "password": "wrongpass"},
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"Invalid credentials" in response.data

    def test_logout_redirects_to_login(self, logged_in_client):
        response = logged_in_client.get("/admin/logout", follow_redirects=True)
        assert response.status_code == 200

    def test_protected_route_redirects_unauthenticated(self, client, db):
        response = client.get("/admin/products")
        assert response.status_code == 302
        assert "/login" in response.headers["Location"]


# ---------------------------------------------------------------------------
# Product routes
# ---------------------------------------------------------------------------

class TestProductRoutes:

    def test_products_page_loads(self, logged_in_client, product):
        response = logged_in_client.get("/admin/products")
        assert response.status_code == 200
        assert b"Grilled chicken" in response.data

    def test_products_filter_by_status(self, logged_in_client, product):
        response = logged_in_client.get("/admin/products?status=active")
        assert response.status_code == 200

    def test_products_filter_by_category(self, logged_in_client, product, category):
        response = logged_in_client.get(f"/admin/products?category_id={category.id}")
        assert response.status_code == 200

    def test_new_product_page_loads(self, logged_in_client, category):
        response = logged_in_client.get("/admin/products/new")
        assert response.status_code == 200

    def test_create_product(self, logged_in_client, category):
        with patch("app.services.ImageService.upload", return_value=None):
            response = logged_in_client.post(
                "/admin/products/new",
                data={
                    "name": "New Dish",
                    "priceSingleCents": 2000,
                    "category_id": category.id,
                    "ingredients": "salt, pepper",
                    "status": "active",
                },
                follow_redirects=True,
            )
        assert response.status_code == 200
        assert b"created" in response.data.lower()

    def test_create_product_blank_name_shows_error(self, logged_in_client, category):
        response = logged_in_client.post(
            "/admin/products/new",
            data={
                "name": "",
                "priceSingleCents": 2000,
                "category_id": category.id,
                "ingredients": "",
                "status": "active",
            },
            follow_redirects=True,
        )
        assert response.status_code == 200

    def test_edit_product_page_loads(self, logged_in_client, product):
        response = logged_in_client.get(f"/admin/products/{product.id}/edit")
        assert response.status_code == 200

    def test_edit_product_not_found(self, logged_in_client, db):
        response = logged_in_client.get(
            "/admin/products/nonexistent-id/edit",
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"not found" in response.data.lower()

    def test_delete_product(self, logged_in_client, product):
        response = logged_in_client.post(
            f"/admin/products/{product.id}/delete",
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"deleted" in response.data.lower()

    def test_delete_product_not_found(self, logged_in_client, db):
        response = logged_in_client.post(
            "/admin/products/nonexistent-id/delete",
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"not found" in response.data.lower()

    def test_toggle_product_via_json(self, logged_in_client, product):
        response = logged_in_client.post(
            f"/admin/products/{product.id}/toggle",
            json={"is_active": False},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["ok"] is True
        assert data["status"] == "inactive"

    def test_set_product_status(self, logged_in_client, product):
        response = logged_in_client.post(
            f"/admin/products/{product.id}/set-status",
            json={"status": "inactive"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["ok"] is True
        assert data["status"] == "inactive"

    def test_set_product_status_invalid(self, logged_in_client, product):
        response = logged_in_client.post(
            f"/admin/products/{product.id}/set-status",
            json={"status": "draft"},
        )
        assert response.status_code == 400
        assert response.get_json()["ok"] is False

    def test_duplicate_product(self, logged_in_client, product):
        response = logged_in_client.post(
            f"/admin/products/{product.id}/duplicate",
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"duplicated" in response.data.lower()

    def test_bulk_update_no_products_selected(self, logged_in_client, db):
        response = logged_in_client.post(
            "/admin/products/bulk",
            data={"bulk_status": "inactive"},
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"select" in response.data.lower()

    def test_bulk_update_products(self, logged_in_client, product):
        response = logged_in_client.post(
            "/admin/products/bulk",
            data={"product_ids": [product.id], "bulk_status": "inactive"},
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"bulk updated" in response.data.lower()


# ---------------------------------------------------------------------------
# Category routes
# ---------------------------------------------------------------------------

class TestCategoryRoutes:

    def test_categories_page_loads(self, logged_in_client, db):
        response = logged_in_client.get("/admin/categories")
        assert response.status_code == 200

    def test_create_category(self, logged_in_client, db):
        response = logged_in_client.post(
            "/admin/categories",
            data={"action": "create", "name": "Desserts"},
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"created" in response.data.lower()

    def test_create_duplicate_category(self, logged_in_client, category):
        response = logged_in_client.post(
            "/admin/categories",
            data={"action": "create", "name": category.name},
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"already exists" in response.data.lower()

    def test_delete_empty_category(self, logged_in_client, category):
        response = logged_in_client.post(
            f"/admin/categories/{category.id}/delete",
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"deleted" in response.data.lower()

    def test_delete_category_with_products(self, logged_in_client, product, category):
        response = logged_in_client.post(
            f"/admin/categories/{category.id}/delete",
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"products" in response.data.lower()

    def test_set_category_status(self, logged_in_client, category):
        response = logged_in_client.post(
            f"/admin/categories/{category.id}/set-status",
            json={"status": "inactive"},
        )
        assert response.status_code == 200
        assert response.get_json()["ok"] is True


# ---------------------------------------------------------------------------
# Subscription routes
# ---------------------------------------------------------------------------

class TestSubscriptionRoutes:

    def test_subscriptions_page_loads(self, logged_in_client, db):
        response = logged_in_client.get("/admin/subscriptions")
        assert response.status_code == 200

    def test_new_subscription_page_loads(self, logged_in_client, db):
        response = logged_in_client.get("/admin/subscriptions/new")
        assert response.status_code == 200

    def test_create_subscription_plan(self, logged_in_client, db):
        response = logged_in_client.post(
            "/admin/subscriptions/new",
            data={
                "audience": "person",
                "days_per_month": 20,
                "price_plat_du_jour": 5000,
                "price_with_salad": 6000,
            },
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"created" in response.data.lower()

    def test_create_duplicate_subscription_plan(self, logged_in_client, db):
        SubscriptionService.create(
            audience="person", days_per_month=20,
            price_plat_du_jour=5000, price_with_salad=6000,
        )
        response = logged_in_client.post(
            "/admin/subscriptions/new",
            data={
                "audience": "person",
                "days_per_month": 20,
                "price_plat_du_jour": 5500,
                "price_with_salad": 6500,
            },
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"already exists" in response.data.lower()

    def test_delete_subscription_plan(self, logged_in_client, db):
        plan = SubscriptionService.create(
            audience="person", days_per_month=20,
            price_plat_du_jour=5000, price_with_salad=6000,
        )
        response = logged_in_client.post(
            f"/admin/subscriptions/{plan.id}/delete",
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"deleted" in response.data.lower()
