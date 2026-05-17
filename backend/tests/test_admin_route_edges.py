from io import BytesIO
from unittest.mock import patch

from app.exceptions import ValidationError
from app.models import Product, SubscriptionPlan
from app.services import CateringService, ProductService, SlideshowService


class TestAdminProductRouteEdges:

    def test_create_product_accepts_zero_single_price(self, logged_in_client, product_form_data):
        response = logged_in_client.post(
            "/admin/products/new",
            data=product_form_data(name="Free Sample", priceSingleCents=0),
            follow_redirects=True,
        )

        assert response.status_code == 200
        product = Product.query.filter_by(name="Free sample").one()
        assert product.priceSingleCents == 0

    def test_create_product_upload_validation_error_does_not_create_product(
        self, logged_in_client, product_form_data
    ):
        with patch("app.services.ImageService.upload", side_effect=ValidationError("Bad image.")):
            response = logged_in_client.post(
                "/admin/products/new",
                data={
                    **product_form_data(name="Image Product"),
                    "image": (BytesIO(b"bad"), "bad.txt"),
                },
                content_type="multipart/form-data",
                follow_redirects=True,
            )

        assert response.status_code == 200
        assert b"Bad image" in response.data
        assert Product.query.filter_by(name="Image product").count() == 0

    def test_edit_product_can_clear_family_price(
        self, logged_in_client, product, category, product_form_data, db
    ):
        product.set_price_family(3500)
        db.session.commit()

        response = logged_in_client.post(
            f"/admin/products/{product.id}/edit",
            data=product_form_data(
                name=product.name,
                priceSingleCents=product.priceSingleCents,
                priceFamilyCents="",
                category_id=category.id,
                ingredients=product.ingredients,
                status=product.status,
            ),
            follow_redirects=True,
        )

        db.session.refresh(product)
        assert response.status_code == 200
        assert product.priceFamilyCents is None

    def test_edit_product_status_badge_uses_status_field(self, logged_in_client, product):
        active_response = logged_in_client.get(f"/admin/products/{product.id}/edit")
        ProductService.set_status(product, "inactive")
        inactive_response = logged_in_client.get(f"/admin/products/{product.id}/edit")

        assert b"Live" in active_response.data
        assert b"Paused" in inactive_response.data

    def test_duplicate_product_not_found_flashes_error(self, logged_in_client, db):
        response = logged_in_client.post(
            "/admin/products/missing-id/duplicate",
            follow_redirects=True,
        )

        assert response.status_code == 200
        assert b"Product not found" in response.data

    def test_unauthenticated_product_delete_does_not_mutate(self, client, product, db):
        response = client.post(f"/admin/products/{product.id}/delete")

        assert response.status_code == 302
        assert "/login" in response.headers["Location"]
        assert db.session.get(Product, product.id) is not None


class TestAdminCategoryRouteEdges:

    def test_set_category_status_invalid_value_returns_json_error(self, logged_in_client, category):
        response = logged_in_client.post(
            f"/admin/categories/{category.id}/set-status",
            json={"status": "draft"},
        )

        assert response.status_code == 400
        assert response.get_json() == {"ok": False, "message": "Invalid status."}

    def test_set_category_status_not_found_returns_json_error(self, logged_in_client, db):
        response = logged_in_client.post(
            "/admin/categories/9999/set-status",
            json={"status": "inactive"},
        )

        assert response.status_code == 404
        assert response.get_json()["ok"] is False

    def test_malformed_category_reorder_shows_validation_error(self, logged_in_client, db):
        response = logged_in_client.post(
            "/admin/categories",
            data={"action": "reorder", "item_ids": ["not-an-int"]},
            follow_redirects=True,
        )

        assert response.status_code == 200
        assert b"Invalid category order" in response.data

    def test_unauthenticated_category_delete_does_not_mutate(self, client, category, db):
        response = client.post(f"/admin/categories/{category.id}/delete")

        assert response.status_code == 302
        assert db.session.get(type(category), category.id) is not None


class TestAdminSlideshowRouteEdges:

    def test_slideshow_page_loads_empty_state(self, logged_in_client, db):
        response = logged_in_client.get("/admin/slideshow")

        assert response.status_code == 200
        assert b"No slides yet" in response.data

    def test_delete_slide_removes_record(self, logged_in_client, make_slide, db):
        slide = make_slide()

        response = logged_in_client.post(
            f"/admin/slideshow/{slide.id}/delete",
            follow_redirects=True,
        )

        assert response.status_code == 200
        assert b"Slide removed" in response.data
        assert db.session.get(type(slide), slide.id) is None

    def test_delete_slide_not_found_flashes_error(self, logged_in_client, db):
        response = logged_in_client.post(
            "/admin/slideshow/missing-slide/delete",
            follow_redirects=True,
        )

        assert response.status_code == 200
        assert b"Slide not found" in response.data

    def test_upload_slideshow_partial_failure_saves_successful_rows(self, logged_in_client, db):
        with patch(
            "app.services.ImageService.upload",
            side_effect=["http://example.com/ok.jpg", ValidationError("Bad slide.")],
        ):
            response = logged_in_client.post(
                "/admin/slideshow",
                data={
                    "images": [
                        (BytesIO(b"ok"), "ok.jpg"),
                        (BytesIO(b"bad"), "bad.jpg"),
                    ]
                },
                content_type="multipart/form-data",
                follow_redirects=True,
            )

        assert response.status_code == 200
        assert b"Added 1 slideshow" in response.data
        assert b"Failed to upload" in response.data
        assert len(SlideshowService.list_all()) == 1


class TestAdminCateringRouteEdges:

    def test_catering_page_loads_empty_state(self, logged_in_client, db):
        response = logged_in_client.get("/admin/catering")

        assert response.status_code == 200
        assert b"No catering menus yet" in response.data

    def test_upload_catering_menu(self, logged_in_client, db):
        with patch("app.services.ImageService.upload", return_value="http://example.com/menu.jpg"):
            response = logged_in_client.post(
                "/admin/catering",
                data={"images": (BytesIO(b"menu"), "menu.jpg")},
                content_type="multipart/form-data",
                follow_redirects=True,
            )

        assert response.status_code == 200
        assert b"Added 1 catering menu" in response.data
        assert len(CateringService.list_all()) == 1

    def test_upload_catering_partial_failure_saves_successful_rows(self, logged_in_client, db):
        with patch(
            "app.services.ImageService.upload",
            side_effect=["http://example.com/ok.jpg", ValidationError("Bad menu.")],
        ):
            response = logged_in_client.post(
                "/admin/catering",
                data={
                    "images": [
                        (BytesIO(b"ok"), "ok.jpg"),
                        (BytesIO(b"bad"), "bad.jpg"),
                    ]
                },
                content_type="multipart/form-data",
                follow_redirects=True,
            )

        assert response.status_code == 200
        assert b"Added 1 catering menu" in response.data
        assert b"Failed to upload" in response.data
        assert len(CateringService.list_all()) == 1

    def test_upload_catering_no_files(self, logged_in_client, db):
        response = logged_in_client.post(
            "/admin/catering",
            data={},
            content_type="multipart/form-data",
            follow_redirects=True,
        )

        assert response.status_code == 200
        assert b"select at least one image" in response.data.lower()
        assert len(CateringService.list_all()) == 0

    def test_delete_catering_menu_removes_record(self, logged_in_client, make_catering_menu, db):
        menu = make_catering_menu()

        response = logged_in_client.post(
            f"/admin/catering/{menu.id}/delete",
            follow_redirects=True,
        )

        assert response.status_code == 200
        assert b"removed" in response.data.lower()
        assert db.session.get(type(menu), menu.id) is None

    def test_delete_catering_menu_not_found_flashes_error(self, logged_in_client, db):
        response = logged_in_client.post(
            "/admin/catering/missing-menu/delete",
            follow_redirects=True,
        )

        assert response.status_code == 200
        assert b"Image not found" in response.data


class TestAdminSubscriptionRouteEdges:

    def test_edit_subscription_page_loads(self, logged_in_client, make_subscription_plan):
        plan = make_subscription_plan()

        response = logged_in_client.get(f"/admin/subscriptions/{plan.id}/edit")

        assert response.status_code == 200
        assert bytes(str(plan.days_per_month), "utf-8") in response.data

    def test_update_subscription_plan(self, logged_in_client, make_subscription_plan, subscription_form_data, db):
        plan = make_subscription_plan()

        response = logged_in_client.post(
            f"/admin/subscriptions/{plan.id}/edit",
            data=subscription_form_data(days_per_month=24, price_with_salad=6500),
            follow_redirects=True,
        )

        db.session.refresh(plan)
        assert response.status_code == 200
        assert b"updated" in response.data.lower()
        assert plan.days_per_month == 24
        assert plan.price_with_salad == 6500

    def test_update_subscription_accepts_zero_prices(
        self, logged_in_client, make_subscription_plan, subscription_form_data, db
    ):
        plan = make_subscription_plan()

        response = logged_in_client.post(
            f"/admin/subscriptions/{plan.id}/edit",
            data=subscription_form_data(price_plat_du_jour=0, price_with_salad=0),
            follow_redirects=True,
        )

        db.session.refresh(plan)
        assert response.status_code == 200
        assert plan.price_plat_du_jour == 0
        assert plan.price_with_salad == 0

    def test_edit_subscription_not_found_redirects_with_error(self, logged_in_client, db):
        response = logged_in_client.get(
            "/admin/subscriptions/missing-plan/edit",
            follow_redirects=True,
        )

        assert response.status_code == 200
        assert b"Subscription plan not found" in response.data

    def test_update_subscription_not_found_redirects_with_error(
        self, logged_in_client, subscription_form_data, db
    ):
        response = logged_in_client.post(
            "/admin/subscriptions/missing-plan/edit",
            data=subscription_form_data(),
            follow_redirects=True,
        )

        assert response.status_code == 200
        assert b"Subscription plan not found" in response.data

    def test_unauthenticated_subscription_create_does_not_mutate(
        self, client, subscription_form_data, db
    ):
        response = client.post("/admin/subscriptions/new", data=subscription_form_data())

        assert response.status_code == 302
        assert SubscriptionPlan.query.count() == 0
