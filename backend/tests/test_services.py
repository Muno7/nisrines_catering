import pytest

from app.models import Product, Category, SlideshowImage, CateringMenuImage, SubscriptionPlan
from app.services import (
    AdminService,
    ProductService,
    CategoryService,
    SlideshowService,
    CateringService,
    SubscriptionService,
)
from app.exceptions import ValidationError, ConflictError, NotFoundError


# ===========================================================================
# AdminService
# ===========================================================================

class TestAdminService:

    def test_create_admin(self, db):
        admin = AdminService.create("muhammad", "securepass")
        assert admin.id is not None
        assert admin.username == "muhammad"

    def test_create_admin_hashes_password(self, db):
        admin = AdminService.create("muhammad", "securepass")
        assert admin.password_hash != "securepass"
        assert admin.check_password("securepass") is True

    def test_create_admin_wrong_password(self, db):
        admin = AdminService.create("muhammad", "securepass")
        assert admin.check_password("wrongpass") is False

    def test_create_admin_duplicate_raises_conflict(self, db):
        AdminService.create("muhammad", "pass1")
        with pytest.raises(ConflictError):
            AdminService.create("muhammad", "pass2")

    def test_create_admin_blank_username_raises_validation(self, db):
        with pytest.raises(ValidationError):
            AdminService.create("", "pass")

    def test_create_admin_whitespace_username_raises_validation(self, db):
        with pytest.raises(ValidationError):
            AdminService.create("   ", "pass")

    def test_create_admin_blank_password_raises_validation(self, db):
        with pytest.raises(ValidationError):
            AdminService.create("muhammad", "")

    def test_get_by_username(self, db):
        AdminService.create("muhammad", "pass")
        admin = AdminService.get_by_username("muhammad")
        assert admin.username == "muhammad"

    def test_get_by_username_not_found_raises(self, db):
        with pytest.raises(NotFoundError):
            AdminService.get_by_username("nobody")


# ===========================================================================
# CategoryService
# ===========================================================================

class TestCategoryService:

    def test_create_category(self, db):
        cat = CategoryService.create("Salads")
        assert cat.id is not None
        assert cat.name == "Salads"
        assert cat.slug == "salads"
        assert cat.active is True

    def test_create_category_blank_raises_validation(self, db):
        with pytest.raises(ValidationError):
            CategoryService.create("")

    def test_create_category_whitespace_raises_validation(self, db):
        with pytest.raises(ValidationError):
            CategoryService.create("   ")

    def test_create_duplicate_category_raises_conflict(self, db):
        CategoryService.create("Salads")
        with pytest.raises(ConflictError):
            CategoryService.create("Salads")

    def test_create_duplicate_case_insensitive_raises_conflict(self, db):
        CategoryService.create("Salads")
        with pytest.raises(ConflictError):
            CategoryService.create("salads")

    def test_update_category_name(self, db):
        cat = CategoryService.create("Salads")
        CategoryService.update(cat, name="Soups")
        assert cat.name == "Soups"
        assert cat.slug == "soups"

    def test_update_category_name_conflict_raises(self, db):
        CategoryService.create("Salads")
        cat = CategoryService.create("Soups")
        with pytest.raises(ConflictError):
            CategoryService.update(cat, name="Salads")

    def test_update_sort_order(self, db):
        cat = CategoryService.create("Salads")
        CategoryService.update(cat, sort_order=5)
        assert cat.sort_order == 5

    def test_set_active(self, db):
        cat = CategoryService.create("Salads")
        CategoryService.set_active(cat, False)
        assert cat.active is False

    def test_set_active_toggle_back(self, db):
        cat = CategoryService.create("Salads")
        CategoryService.set_active(cat, False)
        CategoryService.set_active(cat, True)
        assert cat.active is True

    def test_delete_empty_category(self, db):
        cat = CategoryService.create("Salads")
        cat_id = cat.id
        CategoryService.delete(cat)
        assert db.session.get(Category, cat_id) is None

    def test_delete_category_with_products_raises(self, db):
        cat = CategoryService.create("Salads")
        ProductService.create(
            name="Caesar",
            price_single=1000,
            category_id=cat.id,
        )
        with pytest.raises(ValidationError):
            CategoryService.delete(cat)


# ===========================================================================
# ProductService
# ===========================================================================

class TestProductService:

    def _make_category(self):
        return CategoryService.create("Mains")

    def test_create_product(self, db):
        cat = self._make_category()
        p = ProductService.create(
            name="grilled chicken",
            price_single=1500,
            category_id=cat.id,
        )
        assert p.id is not None
        assert p.name == "Grilled chicken"
        assert p.priceSingleCents == 1500
        assert p.status == "active"

    def test_create_product_blank_name_raises(self, db):
        cat = self._make_category()
        with pytest.raises(ValidationError):
            ProductService.create(name="", price_single=1000, category_id=cat.id)

    def test_create_product_negative_price_raises(self, db):
        cat = self._make_category()
        with pytest.raises(ValidationError):
            ProductService.create(name="Chicken", price_single=-1, category_id=cat.id)

    def test_create_product_negative_family_price_raises(self, db):
        cat = self._make_category()
        with pytest.raises(ValidationError):
            ProductService.create(name="Chicken", price_single=1000, price_family=-1, category_id=cat.id)

    def test_create_product_without_category_raises(self, db):
        with pytest.raises(ValidationError, match="category"):
            ProductService.create(name="Chicken", price_single=1000, category_id=None)

    def test_create_product_missing_category_raises(self, db):
        with pytest.raises(ValidationError, match="does not exist"):
            ProductService.create(name="Chicken", price_single=1000, category_id=999)

    def test_create_product_zero_family_price_is_valid(self, db):
        cat = self._make_category()
        p = ProductService.create(name="Chicken", price_single=1000, price_family=0, category_id=cat.id)
        assert p.priceFamilyCents == 0

    def test_create_product_name_normalised(self, db):
        cat = self._make_category()
        p = ProductService.create(name="GRILLED CHICKEN", price_single=1000, category_id=cat.id)
        assert p.name == "Grilled chicken"

    def test_create_product_invalid_status_raises(self, db):
        cat = self._make_category()
        with pytest.raises(ValidationError):
            ProductService.create(name="Chicken", price_single=1000, category_id=cat.id, status="draft")

    def test_update_product(self, db):
        cat = self._make_category()
        p = ProductService.create(name="Chicken", price_single=1000, category_id=cat.id)
        ProductService.update(
            p,
            name="Fish",
            name_ar=p.name_ar,
            price_single=2000,
            price_family=p.priceFamilyCents,
            image=p.image,
            category_id=p.category_id,
            ingredients=p.ingredients,
            day=p.day,
            status=p.status,
        )
        assert p.name == "Fish"
        assert p.priceSingleCents == 2000

    def test_update_blank_name_raises(self, db):
        cat = self._make_category()
        p = ProductService.create(name="Chicken", price_single=1000, category_id=cat.id)
        with pytest.raises(ValidationError):
            ProductService.update(
                p,
                name="",
                name_ar=p.name_ar,
                price_single=p.priceSingleCents,
                price_family=p.priceFamilyCents,
                image=p.image,
                category_id=p.category_id,
                ingredients=p.ingredients,
                day=p.day,
                status=p.status,
            )

    def test_set_status(self, db):
        cat = self._make_category()
        p = ProductService.create(name="Chicken", price_single=1000, category_id=cat.id)
        ProductService.set_status(p, "inactive")
        assert p.status == "inactive"

    def test_set_invalid_status_raises(self, db):
        cat = self._make_category()
        p = ProductService.create(name="Chicken", price_single=1000, category_id=cat.id)
        with pytest.raises(ValidationError):
            ProductService.set_status(p, "draft")

    def test_duplicate_product(self, db):
        cat = self._make_category()
        p = ProductService.create(name="Chicken", price_single=1000, category_id=cat.id)
        copy = ProductService.duplicate(p)
        assert copy.id != p.id
        assert copy.name == "Chicken (copy)"
        assert copy.status == "inactive"

    def test_delete_product(self, db):
        cat = self._make_category()
        p = ProductService.create(name="Chicken", price_single=1000, category_id=cat.id)
        pid = p.id
        ProductService.delete(p)
        assert db.session.get(Product, pid) is None


# ===========================================================================
# SlideshowService
# ===========================================================================

class TestSlideshowService:

    def test_create_slide(self, db):
        slide = SlideshowService.create("https://example.com/img.jpg", sort_order=1)
        assert slide.id is not None
        assert slide.image == "https://example.com/img.jpg"
        assert slide.sort_order == 1

    def test_create_slide_blank_url_raises(self, db):
        with pytest.raises(ValidationError):
            SlideshowService.create("", sort_order=1)

    def test_delete_slide(self, db):
        slide = SlideshowService.create("https://example.com/img.jpg", sort_order=1)
        sid = slide.id
        SlideshowService.delete(slide)
        assert db.session.get(SlideshowImage, sid) is None


# ===========================================================================
# CateringService
# ===========================================================================

class TestCateringService:

    def test_create_menu(self, db):
        menu = CateringService.create("https://example.com/menu.jpg", sort_order=1)
        assert menu.id is not None

    def test_create_menu_blank_url_raises(self, db):
        with pytest.raises(ValidationError):
            CateringService.create("", sort_order=1)

    def test_delete_menu(self, db):
        menu = CateringService.create("https://example.com/menu.jpg", sort_order=1)
        mid = menu.id
        CateringService.delete(menu)
        assert db.session.get(CateringMenuImage, mid) is None


# ===========================================================================
# SubscriptionService
# ===========================================================================

class TestSubscriptionService:

    def test_create_plan(self, db):
        plan = SubscriptionService.create(
            audience="person",
            days_per_month=20,
            price_plat_du_jour=5000,
            price_with_salad=6000,
        )
        assert plan.id is not None
        assert plan.audience == "person"
        assert plan.days_per_month == 20

    def test_create_duplicate_plan_raises_conflict(self, db):
        SubscriptionService.create(
            audience="person", days_per_month=20,
            price_plat_du_jour=5000, price_with_salad=6000,
        )
        with pytest.raises(ConflictError):
            SubscriptionService.create(
                audience="person", days_per_month=20,
                price_plat_du_jour=5500, price_with_salad=6500,
            )

    def test_create_plan_invalid_audience_raises(self, db):
        with pytest.raises(ValidationError):
            SubscriptionService.create(
                audience="vip", days_per_month=20,
                price_plat_du_jour=5000, price_with_salad=6000,
            )

    def test_create_plan_zero_days_raises(self, db):
        with pytest.raises(ValidationError):
            SubscriptionService.create(
                audience="person", days_per_month=0,
                price_plat_du_jour=5000, price_with_salad=6000,
            )

    def test_create_plan_negative_plat_du_jour_raises(self, db):
        with pytest.raises(ValidationError):
            SubscriptionService.create(
                audience="person", days_per_month=20,
                price_plat_du_jour=-1, price_with_salad=6000,
            )

    def test_create_plan_negative_with_salad_raises(self, db):
        with pytest.raises(ValidationError):
            SubscriptionService.create(
                audience="person", days_per_month=20,
                price_plat_du_jour=5000, price_with_salad=-1,
            )

    def test_update_plan(self, db):
        plan = SubscriptionService.create(
            audience="person", days_per_month=20,
            price_plat_du_jour=5000, price_with_salad=6000,
        )
        SubscriptionService.update(
            plan,
            audience="person", days_per_month=20,
            price_plat_du_jour=5500, price_with_salad=6500,
        )
        assert plan.price_plat_du_jour == 5500
        assert plan.price_with_salad == 6500

    def test_update_plan_conflict_raises(self, db):
        SubscriptionService.create(
            audience="person", days_per_month=20,
            price_plat_du_jour=5000, price_with_salad=6000,
        )
        plan2 = SubscriptionService.create(
            audience="person", days_per_month=15,
            price_plat_du_jour=4000, price_with_salad=5000,
        )
        with pytest.raises(ConflictError):
            SubscriptionService.update(
                plan2,
                audience="person", days_per_month=20,
                price_plat_du_jour=4000, price_with_salad=5000,
            )

    def test_delete_plan(self, db):
        plan = SubscriptionService.create(
            audience="person", days_per_month=20,
            price_plat_du_jour=5000, price_with_salad=6000,
        )
        pid = plan.id
        SubscriptionService.delete(plan)
        assert db.session.get(SubscriptionPlan, pid) is None
