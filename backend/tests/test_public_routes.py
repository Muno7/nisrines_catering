from unittest.mock import patch

from app.services import CategoryService


class TestPublicProductApi:

    def test_health_returns_ok(self, client, db):
        response = client.get("/health")

        assert response.status_code == 200
        assert response.get_json() == {"ok": True}

    def test_products_returns_active_products_with_price_shape(self, client, make_category, make_product):
        active_category = make_category("Lunch")
        inactive_category = make_category("Hidden")
        CategoryService.set_active(inactive_category, False)

        make_product(
            name="Single Price Dish",
            name_ar="طبق",
            price_single=1200,
            category=active_category,
            ingredients="rice",
            image="http://example.com/single.jpg",
        )
        make_product(
            name="Family Price Dish",
            price_single=2000,
            price_family=3500,
            category=active_category,
            order_unit="dozen",
        )
        make_product(name="Inactive Dish", status="inactive", category=active_category)
        make_product(name="Hidden Category Dish", category=inactive_category)

        response = client.get("/api/products")

        assert response.status_code == 200
        data = response.get_json()
        assert data["ok"] is True
        products = data["data"]
        assert {item["name"] for item in products} == {
            "Single price dish",
            "Family price dish",
        }

        single = next(item for item in products if item["name"] == "Single price dish")
        family = next(item for item in products if item["name"] == "Family price dish")
        assert single["price"] == {"single": 1200, "family": None}
        assert "priceCents" not in single
        assert single["name_ar"] == "طبق"
        assert single["category"] == "lunch"
        assert single["order_unit"] == "each"
        assert family["price"] == {"single": 2000, "family": 3500}
        assert "priceCents" not in family
        assert family["category"] == "lunch"
        assert family["order_unit"] == "dozen"

    def test_products_empty_database_returns_empty_list(self, client, db):
        response = client.get("/api/products")

        assert response.status_code == 200
        assert response.get_json() == {"ok": True, "data": []}


class TestPublicLookupApis:

    def test_categories_returns_only_active_categories(self, client, make_category):
        active = make_category("Mains")
        inactive = make_category("Archived")
        CategoryService.set_active(inactive, False)

        response = client.get("/api/categories")

        assert response.status_code == 200
        assert response.get_json()["data"] == [active.to_dict()]

    def test_slideshow_returns_ordered_slides(self, client, make_slide):
        second = make_slide("http://example.com/2.jpg", sort_order=2)
        first = make_slide("http://example.com/1.jpg", sort_order=1)

        response = client.get("/api/slideshow")

        assert response.status_code == 200
        assert [item["id"] for item in response.get_json()["data"]] == [first.id, second.id]

    def test_catering_menus_returns_ordered_menus(self, client, make_catering_menu):
        second = make_catering_menu("http://example.com/2.jpg", sort_order=2)
        first = make_catering_menu("http://example.com/1.jpg", sort_order=1)

        response = client.get("/api/catering-menus")

        assert response.status_code == 200
        assert [item["id"] for item in response.get_json()["data"]] == [first.id, second.id]

    def test_subscriptions_returns_ordered_plans(self, client, make_subscription_plan):
        family = make_subscription_plan(audience="family", days_per_month=12)
        person = make_subscription_plan(audience="person", days_per_month=8)

        response = client.get("/api/subscriptions")

        assert response.status_code == 200
        assert [item["id"] for item in response.get_json()["data"]] == [family.id, person.id]


class TestPublicApiErrorsAndCors:

    def test_api_404_returns_json_error(self, client, db):
        response = client.get("/api/does-not-exist")

        assert response.status_code == 404
        assert response.get_json() == {"ok": False, "error": "Not found."}

    def test_api_500_returns_json_error(self, app, client, db):
        app.config["PROPAGATE_EXCEPTIONS"] = False
        with patch("app.public.routes.ProductService.list_public", side_effect=RuntimeError("boom")):
            response = client.get("/api/products")

        assert response.status_code == 500
        assert response.get_json() == {"ok": False, "error": "An unexpected error occurred."}

    def test_cors_header_is_added_for_allowed_api_origin(self, app, client, db):
        app.config["CORS_ALLOW_ORIGINS"] = ["http://localhost:5173"]

        response = client.get("/api/products", headers={"Origin": "http://localhost:5173"})

        assert response.status_code == 200
        assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
        assert response.headers["Vary"] == "Origin"

    def test_cors_header_is_not_added_for_disallowed_origin(self, app, client, db):
        app.config["CORS_ALLOW_ORIGINS"] = ["http://localhost:5173"]

        response = client.get("/api/products", headers={"Origin": "https://example.com"})

        assert response.status_code == 200
        assert "Access-Control-Allow-Origin" not in response.headers
