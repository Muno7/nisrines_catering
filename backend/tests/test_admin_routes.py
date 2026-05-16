"""
Admin route tests.

S3 uploads are mocked — no real AWS calls are made.
Every test gets a fresh DB (via the db fixture in conftest.py).
"""
from io import BytesIO
from unittest.mock import patch

from app.services import CategoryService, ProductService, SubscriptionService, SlideshowService, CateringService


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

    def test_edit_product_can_clear_day(self, logged_in_client, product, category, db):
        ProductService.update(product, day="monday")

        response = logged_in_client.post(
            f"/admin/products/{product.id}/edit",
            data={
                "name": product.name,
                "priceSingleCents": product.priceSingleCents,
                "category_id": category.id,
                "ingredients": product.ingredients,
                "day": "",
                "status": product.status,
            },
            follow_redirects=True,
        )

        db.session.refresh(product)
        assert response.status_code == 200
        assert product.day is None

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

    def test_update_category_name(self, logged_in_client, category):
        response = logged_in_client.post(
            "/admin/categories",
            data={
                "action": "update",
                "category_id": category.id,
                "name": "Updated Category",
            },
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"category updated" in response.data.lower()

        updated = CategoryService._get_or_raise(category.id)
        assert updated.name == "Updated Category"

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

    def test_reorder_categories(self, logged_in_client, db):
        c1 = CategoryService.create("Mains")
        c2 = CategoryService.create("Desserts")
        c3 = CategoryService.create("Drinks")

        response = logged_in_client.post(
            "/admin/categories",
            data={"action": "reorder", "item_ids": [c3.id, c1.id, c2.id]},
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"updated" in response.data.lower()

        categories = CategoryService.list_all()
        assert categories[0].id == c3.id
        assert categories[1].id == c1.id
        assert categories[2].id == c2.id

    def test_set_category_status(self, logged_in_client, category):
        response = logged_in_client.post(
            f"/admin/categories/{category.id}/set-status",
            json={"status": "inactive"},
        )
        assert response.status_code == 200
        assert response.get_json()["ok"] is True


# ---------------------------------------------------------------------------
# Catering routes
# ---------------------------------------------------------------------------

class TestCateringRoutes:

    def test_reorder_catering_menus(self, logged_in_client, db):
        m1 = CateringService.create("http://example.com/1.jpg", 1)
        m2 = CateringService.create("http://example.com/2.jpg", 2)
        m3 = CateringService.create("http://example.com/3.jpg", 3)

        response = logged_in_client.post(
            "/admin/catering/reorder",
            data={"item_ids": [m3.id, m1.id, m2.id]},
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"updated" in response.data.lower()

        menus = CateringService.list_all()
        assert menus[0].id == m3.id
        assert menus[1].id == m1.id
        assert menus[2].id == m2.id


# ---------------------------------------------------------------------------
# Slideshow routes
# ---------------------------------------------------------------------------

class TestSlideshowRoutes:

    def test_upload_slideshow(self, logged_in_client, db):
        with patch("app.services.ImageService.upload", return_value="http://example.com/slide.jpg"):
            response = logged_in_client.post(
                "/admin/slideshow",
                data={"images": (BytesIO(b"fake image data"), "slide.jpg")},
                content_type="multipart/form-data",
                follow_redirects=True,
            )
        assert response.status_code == 200
        assert b"added" in response.data.lower()
        assert len(SlideshowService.list_all()) == 1

    def test_upload_slideshow_multiple_files(self, logged_in_client, db):
        with patch("app.services.ImageService.upload", side_effect=[
            "http://example.com/1.jpg",
            "http://example.com/2.jpg",
        ]):
            response = logged_in_client.post(
                "/admin/slideshow",
                data={"images": [
                    (BytesIO(b"img1"), "slide1.jpg"),
                    (BytesIO(b"img2"), "slide2.jpg"),
                ]},
                content_type="multipart/form-data",
                follow_redirects=True,
            )
        assert response.status_code == 200
        assert len(SlideshowService.list_all()) == 2

    def test_upload_slideshow_no_files(self, logged_in_client, db):
        response = logged_in_client.post(
            "/admin/slideshow",
            data={},
            content_type="multipart/form-data",
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"select" in response.data.lower()
        assert len(SlideshowService.list_all()) == 0

    def test_reorder_slideshow(self, logged_in_client, db):
        s1 = SlideshowService.create("http://example.com/1.jpg", 1)
        s2 = SlideshowService.create("http://example.com/2.jpg", 2)
        s3 = SlideshowService.create("http://example.com/3.jpg", 3)

        response = logged_in_client.post(
            "/admin/slideshow/reorder",
            data={"item_ids": [s3.id, s1.id, s2.id]},
            follow_redirects=True,
        )
        assert response.status_code == 200
        assert b"updated" in response.data.lower()

        slides = SlideshowService.list_all()
        assert slides[0].id == s3.id
        assert slides[1].id == s1.id
        assert slides[2].id == s2.id


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
