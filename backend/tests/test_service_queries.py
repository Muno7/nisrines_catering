import pytest

from app.exceptions import NotFoundError, ValidationError
from app.models import Category
from app.services import (
    AdminService,
    CateringService,
    CategoryService,
    ImageService,
    ProductService,
    SlideshowService,
    SubscriptionService,
)


class TestAdminServiceAuthentication:

    def test_authenticate_valid_credentials_returns_admin(self, make_admin):
        admin = make_admin(username="  owner  ", password="secret123")

        result = AdminService.authenticate(" owner ", "secret123")

        assert result.id == admin.id

    def test_authenticate_missing_user_raises_generic_validation_error(self, db):
        with pytest.raises(ValidationError, match="Invalid credentials"):
            AdminService.authenticate("missing", "secret123")

    def test_authenticate_wrong_password_raises_generic_validation_error(self, make_admin):
        make_admin(username="owner", password="secret123")

        with pytest.raises(ValidationError, match="Invalid credentials"):
            AdminService.authenticate("owner", "wrong")


class TestCategoryServiceQueries:

    def test_list_all_returns_sort_order_then_name(self, make_category):
        b = make_category("B")
        a = make_category("A")
        CategoryService.update(b, sort_order=2)
        CategoryService.update(a, sort_order=1)

        result = CategoryService.list_all()

        assert [category.id for category in result] == [a.id, b.id]

    def test_list_active_excludes_inactive_categories(self, make_category):
        active = make_category("Active")
        inactive = make_category("Inactive")
        CategoryService.set_active(inactive, False)

        result = CategoryService.list_active()

        assert [category.id for category in result] == [active.id]

    def test_choices_can_include_or_omit_placeholder(self, make_category):
        category = make_category("Mains")

        with_placeholder = CategoryService.choices()
        without_placeholder = CategoryService.choices(include_placeholder=False)

        assert with_placeholder == [(0, "Select category"), (category.id, "Mains")]
        assert without_placeholder == [(category.id, "Mains")]

    def test_get_by_id_returns_none_for_missing_category(self, db):
        assert CategoryService.get_by_id(999) is None

    def test_get_or_raise_raises_for_missing_category(self, db):
        with pytest.raises(NotFoundError):
            CategoryService._get_or_raise(999)

    def test_ensure_returns_existing_category_case_insensitively(self, make_category):
        category = make_category("Mains")

        result = CategoryService.ensure("mains")

        assert result.id == category.id
        assert Category.query.count() == 1

    def test_ensure_creates_without_committing(self, db):
        category = CategoryService.ensure("Desserts")

        assert category.id is not None
        assert Category.query.filter_by(name="Desserts").one().id == category.id

    def test_product_counts_groups_by_category_id(self, make_category, make_product):
        mains = make_category("Mains")
        desserts = make_category("Desserts")
        make_product(category=mains)
        make_product(category=mains)
        make_product(category=desserts)
        make_product(without_category=True)

        result = CategoryService.product_counts()

        assert result[mains.id] == 2
        assert result[desserts.id] == 1
        assert result[None] == 1

    def test_reorder_ignores_missing_ids(self, make_category):
        first = make_category("First")
        second = make_category("Second")

        CategoryService.reorder([second.id, 99999, first.id])

        assert [(item.id, item.sort_order) for item in CategoryService.list_all()] == [
            (second.id, 0),
            (first.id, 2),
        ]


class TestProductServiceQueries:

    def test_stats_counts_statuses_and_categories(self, make_category, make_product):
        mains = make_category("Mains")
        active = make_product(category=mains, status="active")
        inactive = make_product(category=mains, status="inactive")
        uncategorized = make_product(without_category=True)

        result = ProductService.stats([active, inactive, uncategorized])

        assert result["total"] == 3
        assert result["active"] == 2
        assert result["inactive"] == 1
        assert result["category_counts"]["Mains"] == 2

    def test_get_or_raise_raises_for_missing_product(self, db):
        with pytest.raises(NotFoundError):
            ProductService._get_or_raise("missing-product")

    def test_update_can_clear_family_price(self, make_product):
        product = make_product(price_family=3000)

        ProductService.update(
            product,
            name=product.name,
            name_ar=product.name_ar,
            price_single=product.priceSingleCents,
            price_family=None,
            image=product.image,
            category_id=product.category_id,
            ingredients=product.ingredients,
            day=product.day,
            status=product.status,
        )

        assert product.priceFamilyCents is None

    def test_update_rejects_negative_family_price(self, make_product):
        product = make_product()

        with pytest.raises(ValidationError):
            ProductService.update(
                product,
                name=product.name,
                name_ar=product.name_ar,
                price_single=product.priceSingleCents,
                price_family=-1,
                image=product.image,
                category_id=product.category_id,
                ingredients=product.ingredients,
                day=product.day,
                status=product.status,
            )

    def test_duplicate_copies_product_fields_and_forces_inactive(self, make_category, make_product):
        category = make_category("Mains")
        product = make_product(
            name="Family Meal",
            name_ar="وجبة",
            price_single=2000,
            price_family=3500,
            image="http://example.com/meal.jpg",
            category=category,
            ingredients="rice, chicken",
            day="friday",
            status="active",
        )

        copy = ProductService.duplicate(product)

        assert copy.id != product.id
        assert copy.name == "Family meal (copy)"
        assert copy.name_ar == product.name_ar
        assert copy.priceSingleCents == product.priceSingleCents
        assert copy.priceFamilyCents == product.priceFamilyCents
        assert copy.image == product.image
        assert copy.category_id == category.id
        assert copy.ingredients == product.ingredients
        assert copy.day == product.day
        assert copy.status == "inactive"

    def test_list_filtered_filters_by_search_status_category_day_and_missing_image(self, make_category, make_product):
        mains = make_category("Mains")
        desserts = make_category("Desserts")
        target = make_product(
            name="Chicken Plate",
            name_ar="دجاج",
            category=mains,
            day="monday",
            image=None,
            status="active",
        )
        make_product(name="Chicken Dessert", category=desserts, day="monday", image=None)
        make_product(name="Fish Plate", category=mains, day="monday", image=None)
        make_product(name="Chicken Friday", category=mains, day="friday", image=None)
        make_product(name="Chicken Hidden", category=mains, day="monday", status="inactive", image=None)
        make_product(name="Chicken Photo", category=mains, day="monday", image="http://example.com/img.jpg")

        result = ProductService.list_filtered(
            q="chicken",
            category_id=mains.id,
            status="active",
            day="monday",
            missing_image=True,
        )

        assert [product.id for product in result] == [target.id]

    def test_list_filtered_can_search_arabic_name(self, make_product):
        target = make_product(name="Soup", name_ar="شوربة")
        make_product(name="Salad", name_ar="سلطة")

        result = ProductService.list_filtered(q="شوربة")

        assert [product.id for product in result] == [target.id]

    def test_bulk_update_updates_found_products_and_ignores_missing_ids(self, make_product):
        first = make_product(day="monday")
        second = make_product(day="tuesday")

        updated = ProductService.bulk_update(
            product_ids=[first.id, "missing-id", second.id],
            status="inactive",
            price_single=1800,
            price_family=2800,
            day="clear",
        )

        assert updated == 2
        assert first.status == "inactive"
        assert second.status == "inactive"
        assert first.priceSingleCents == 1800
        assert second.priceFamilyCents == 2800
        assert first.day is None
        assert second.day is None

    def test_bulk_update_empty_id_list_updates_nothing(self, db):
        assert ProductService.bulk_update(product_ids=[], status="inactive") == 0

    def test_list_public_excludes_inactive_products_and_inactive_categories(self, make_category, make_product):
        active_category = make_category("Active")
        inactive_category = make_category("Inactive")
        CategoryService.set_active(inactive_category, False)
        visible = make_product(category=active_category)
        uncategorized = make_product(without_category=True)
        make_product(category=active_category, status="inactive")
        make_product(category=inactive_category)

        result = ProductService.list_public()

        assert {product.id for product in result} == {visible.id, uncategorized.id}

    def test_product_to_dict_keeps_legacy_and_new_price_formats(self, make_product):
        single = make_product(price_single=1200, price_family=None)
        zero_family = make_product(price_single=1300, price_family=0)
        family = make_product(price_single=2000, price_family=3500)

        assert single.to_dict()["priceCents"] == 1200
        assert zero_family.to_dict()["priceCents"] == 1300
        assert family.to_dict()["price"] == {"single": 2000, "family": 3500}


class TestMediaServices:

    def test_slideshow_default_sort_order_uses_next_position(self, make_slide):
        first = make_slide(sort_order=3)
        second = SlideshowService.create("http://example.com/next.jpg")

        assert first.sort_order == 3
        assert second.sort_order == 4

    def test_slideshow_get_or_raise_raises_for_missing_slide(self, db):
        with pytest.raises(NotFoundError):
            SlideshowService._get_or_raise("missing-slide")

    def test_slideshow_reorder_updates_existing_ids_only(self, make_slide):
        first = make_slide(sort_order=1)
        second = make_slide(sort_order=2)

        SlideshowService.reorder([second.id, "missing-slide", first.id])

        assert [(item.id, item.sort_order) for item in SlideshowService.list_all()] == [
            (second.id, 0),
            (first.id, 2),
        ]

    def test_catering_default_sort_order_uses_next_position(self, make_catering_menu):
        first = make_catering_menu(sort_order=2)
        second = CateringService.create("http://example.com/next.jpg")

        assert first.sort_order == 2
        assert second.sort_order == 3

    def test_catering_get_or_raise_raises_for_missing_menu(self, db):
        with pytest.raises(NotFoundError):
            CateringService._get_or_raise("missing-menu")

    def test_catering_reorder_updates_existing_ids_only(self, make_catering_menu):
        first = make_catering_menu(sort_order=1)
        second = make_catering_menu(sort_order=2)

        CateringService.reorder([second.id, "missing-menu", first.id])

        assert [(item.id, item.sort_order) for item in CateringService.list_all()] == [
            (second.id, 0),
            (first.id, 2),
        ]


class TestSubscriptionServiceQueries:

    def test_list_all_returns_audience_then_days_order(self, make_subscription_plan):
        person = make_subscription_plan(audience="person", days_per_month=8)
        family = make_subscription_plan(audience="family", days_per_month=12)

        result = SubscriptionService.list_all()

        assert [plan.id for plan in result] == [family.id, person.id]

    def test_get_or_raise_raises_for_missing_plan(self, db):
        with pytest.raises(NotFoundError):
            SubscriptionService._get_or_raise("missing-plan")

    def test_same_days_are_allowed_for_different_audiences(self, make_subscription_plan):
        person = make_subscription_plan(audience="person", days_per_month=20)
        family = make_subscription_plan(audience="family", days_per_month=20)

        assert person.days_per_month == family.days_per_month

    def test_update_rejects_invalid_audience(self, make_subscription_plan):
        plan = make_subscription_plan()

        with pytest.raises(ValidationError):
            SubscriptionService.update(
                plan,
                audience="vip",
                days_per_month=20,
                price_plat_du_jour=5000,
                price_with_salad=6000,
            )


class TestImageService:

    def test_upload_returns_url_from_s3_upload(self, monkeypatch, db):
        monkeypatch.setattr("app.s3.upload_file", lambda file_storage: (True, "http://example.com/image.jpg"))

        result = ImageService.upload(object())

        assert result == "http://example.com/image.jpg"

    def test_upload_failure_raises_validation_error(self, monkeypatch, db):
        monkeypatch.setattr("app.s3.upload_file", lambda file_storage: (False, "Invalid file type."))

        with pytest.raises(ValidationError, match="Invalid file type"):
            ImageService.upload(object())
