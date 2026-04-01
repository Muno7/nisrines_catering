import pytest

from app.models import User, Product, Category, SlideshowImage, CateringMenuImage, SubscriptionPlan
from app.exceptions import ValidationError, ConflictError, NotFoundError


# ===========================================================================
# User
# ===========================================================================

class TestUser:

    def test_create_user(self, db):
        user = User.create("muhammad", "securepass")
        assert user.id is not None
        assert user.username == "muhammad"

    def test_create_user_hashes_password(self, db):
        user = User.create("muhammad", "securepass")
        assert user.password_hash != "securepass"
        assert user.check_password("securepass") is True

    def test_create_user_wrong_password(self, db):
        user = User.create("muhammad", "securepass")
        assert user.check_password("wrongpass") is False

    def test_create_user_duplicate_raises_conflict(self, db):
        User.create("muhammad", "pass1")
        with pytest.raises(ConflictError):
            User.create("muhammad", "pass2")

    def test_create_user_blank_username_raises_validation(self, db):
        with pytest.raises(ValidationError):
            User.create("", "pass")

    def test_create_user_whitespace_username_raises_validation(self, db):
        with pytest.raises(ValidationError):
            User.create("   ", "pass")

    def test_create_user_blank_password_raises_validation(self, db):
        with pytest.raises(ValidationError):
            User.create("muhammad", "")

    def test_get_by_username(self, db):
        User.create("muhammad", "pass")
        user = User.get_by_username("muhammad")
        assert user.username == "muhammad"

    def test_get_by_username_not_found_raises(self, db):
        with pytest.raises(NotFoundError):
            User.get_by_username("nobody")


# ===========================================================================
# Category
# ===========================================================================

class TestCategory:

    def test_create_category(self, db):
        cat = Category.create("Salads")
        assert cat.id is not None
        assert cat.name == "Salads"
        assert cat.slug == "salads"
        assert cat.active is True

    def test_create_category_blank_raises_validation(self, db):
        with pytest.raises(ValidationError):
            Category.create("")

    def test_create_category_whitespace_raises_validation(self, db):
        with pytest.raises(ValidationError):
            Category.create("   ")

    def test_create_duplicate_category_raises_conflict(self, db):
        Category.create("Salads")
        with pytest.raises(ConflictError):
            Category.create("Salads")

    def test_create_duplicate_case_insensitive_raises_conflict(self, db):
        Category.create("Salads")
        with pytest.raises(ConflictError):
            Category.create("salads")

    def test_update_category_name(self, db):
        cat = Category.create("Salads")
        cat.update(name="Soups")
        assert cat.name == "Soups"
        assert cat.slug == "soups"

    def test_update_category_name_conflict_raises(self, db):
        Category.create("Salads")
        cat = Category.create("Soups")
        with pytest.raises(ConflictError):
            cat.update(name="Salads")

    def test_update_sort_order(self, db):
        cat = Category.create("Salads")
        cat.update(sort_order=5)
        assert cat.sort_order == 5

    def test_set_active(self, db):
        cat = Category.create("Salads")
        cat.set_active(False)
        assert cat.active is False

    def test_set_active_toggle_back(self, db):
        cat = Category.create("Salads")
        cat.set_active(False)
        cat.set_active(True)
        assert cat.active is True

    def test_delete_empty_category(self, db):
        cat = Category.create("Salads")
        cat.delete()
        assert Category.query.get(cat.id) is None

    def test_delete_category_with_products_raises(self, db):
        cat = Category.create("Salads")
        Product.create(
            name="Caesar",
            price_single=1000,
            category=cat.name,
            category_id=cat.id,
        )
        with pytest.raises(ValidationError):
            cat.delete()


# ===========================================================================
# Product
# ===========================================================================

class TestProduct:

    def _make_category(self):
        return Category.create("Mains")

    def test_create_product(self, db):
        cat = self._make_category()
        p = Product.create(
            name="grilled chicken",
            price_single=1500,
            category=cat.name,
            category_id=cat.id,
        )
        assert p.id is not None
        assert p.name == "Grilled chicken"  # normalized
        assert p.priceSingleCents == 1500
        assert p.status == "active"
        assert p.is_active is True

    def test_create_product_blank_name_raises(self, db):
        with pytest.raises(ValidationError):
            Product.create(name="", price_single=1000, category="Mains")

    def test_create_product_negative_price_raises(self, db):
        with pytest.raises(ValidationError):
            Product.create(name="Chicken", price_single=-1, category="Mains")

    def test_create_product_negative_family_price_raises(self, db):
        with pytest.raises(ValidationError):
            Product.create(name="Chicken", price_single=1000, price_family=-1, category="Mains")

    def test_create_product_zero_family_price_is_valid(self, db):
        # 0 means no family size option — should be allowed
        cat = self._make_category()
        p = Product.create(name="Chicken", price_single=1000, price_family=0, category=cat.name, category_id=cat.id)
        assert p.priceFamilyCents == 0

    def test_create_product_name_normalised(self, db):
        cat = self._make_category()
        p = Product.create(name="GRILLED CHICKEN", price_single=1000, category=cat.name, category_id=cat.id)
        assert p.name == "Grilled chicken"

    def test_create_product_invalid_status_raises(self, db):
        with pytest.raises(ValidationError):
            Product.create(name="Chicken", price_single=1000, category="Mains", status="draft")

    def test_update_product(self, db):
        cat = self._make_category()
        p = Product.create(name="Chicken", price_single=1000, category=cat.name, category_id=cat.id)
        p.update(name="Fish", price_single=2000)
        assert p.name == "Fish"
        assert p.priceSingleCents == 2000

    def test_update_blank_name_raises(self, db):
        cat = self._make_category()
        p = Product.create(name="Chicken", price_single=1000, category=cat.name, category_id=cat.id)
        with pytest.raises(ValidationError):
            p.update(name="")

    def test_set_status(self, db):
        cat = self._make_category()
        p = Product.create(name="Chicken", price_single=1000, category=cat.name, category_id=cat.id)
        p.set_status("inactive")
        assert p.status == "inactive"
        assert p.is_active is False

    def test_set_invalid_status_raises(self, db):
        cat = self._make_category()
        p = Product.create(name="Chicken", price_single=1000, category=cat.name, category_id=cat.id)
        with pytest.raises(ValidationError):
            p.set_status("draft")

    def test_duplicate_product(self, db):
        cat = self._make_category()
        p = Product.create(name="Chicken", price_single=1000, category=cat.name, category_id=cat.id)
        copy = p.duplicate()
        assert copy.id != p.id
        assert copy.name == "Chicken (copy)"
        assert copy.status == "inactive"
        assert copy.is_active is False

    def test_delete_product(self, db):
        cat = self._make_category()
        p = Product.create(name="Chicken", price_single=1000, category=cat.name, category_id=cat.id)
        pid = p.id
        p.delete()
        assert Product.query.get(pid) is None


# ===========================================================================
# SlideshowImage
# ===========================================================================

class TestSlideshowImage:

    def test_create_slide(self, db):
        slide = SlideshowImage.create("https://example.com/img.jpg", sort_order=1)
        assert slide.id is not None
        assert slide.image == "https://example.com/img.jpg"
        assert slide.sort_order == 1

    def test_create_slide_blank_url_raises(self, db):
        with pytest.raises(ValidationError):
            SlideshowImage.create("", sort_order=1)

    def test_delete_slide(self, db):
        slide = SlideshowImage.create("https://example.com/img.jpg", sort_order=1)
        sid = slide.id
        slide.delete()
        assert SlideshowImage.query.get(sid) is None


# ===========================================================================
# CateringMenuImage
# ===========================================================================

class TestCateringMenuImage:

    def test_create_menu(self, db):
        menu = CateringMenuImage.create("https://example.com/menu.jpg", sort_order=1)
        assert menu.id is not None

    def test_create_menu_blank_url_raises(self, db):
        with pytest.raises(ValidationError):
            CateringMenuImage.create("", sort_order=1)

    def test_delete_menu(self, db):
        menu = CateringMenuImage.create("https://example.com/menu.jpg", sort_order=1)
        mid = menu.id
        menu.delete()
        assert CateringMenuImage.query.get(mid) is None


# ===========================================================================
# SubscriptionPlan
# ===========================================================================

class TestSubscriptionPlan:

    def test_create_plan(self, db):
        plan = SubscriptionPlan.create(
            audience="person",
            days_per_month=20,
            price_plat_du_jour=5000,
            price_with_salad=6000,
        )
        assert plan.id is not None
        assert plan.audience == "person"
        assert plan.days_per_month == 20

    def test_create_duplicate_plan_raises_conflict(self, db):
        SubscriptionPlan.create(
            audience="person", days_per_month=20,
            price_plat_du_jour=5000, price_with_salad=6000,
        )
        with pytest.raises(ConflictError):
            SubscriptionPlan.create(
                audience="person", days_per_month=20,
                price_plat_du_jour=5500, price_with_salad=6500,
            )

    def test_create_plan_invalid_audience_raises(self, db):
        with pytest.raises(ValidationError):
            SubscriptionPlan.create(
                audience="vip", days_per_month=20,
                price_plat_du_jour=5000, price_with_salad=6000,
            )

    def test_create_plan_zero_days_raises(self, db):
        with pytest.raises(ValidationError):
            SubscriptionPlan.create(
                audience="person", days_per_month=0,
                price_plat_du_jour=5000, price_with_salad=6000,
            )

    def test_create_plan_negative_plat_du_jour_raises(self, db):
        with pytest.raises(ValidationError):
            SubscriptionPlan.create(
                audience="person", days_per_month=20,
                price_plat_du_jour=-1, price_with_salad=6000,
            )

    def test_create_plan_negative_with_salad_raises(self, db):
        with pytest.raises(ValidationError):
            SubscriptionPlan.create(
                audience="person", days_per_month=20,
                price_plat_du_jour=5000, price_with_salad=-1,
            )

    def test_update_plan(self, db):
        plan = SubscriptionPlan.create(
            audience="person", days_per_month=20,
            price_plat_du_jour=5000, price_with_salad=6000,
        )
        plan.update(
            audience="person", days_per_month=20,
            price_plat_du_jour=5500, price_with_salad=6500,
        )
        assert plan.price_plat_du_jour == 5500
        assert plan.price_with_salad == 6500

    def test_update_plan_conflict_raises(self, db):
        SubscriptionPlan.create(
            audience="person", days_per_month=20,
            price_plat_du_jour=5000, price_with_salad=6000,
        )
        plan2 = SubscriptionPlan.create(
            audience="person", days_per_month=15,
            price_plat_du_jour=4000, price_with_salad=5000,
        )
        with pytest.raises(ConflictError):
            plan2.update(
                audience="person", days_per_month=20,
                price_plat_du_jour=4000, price_with_salad=5000,
            )

    def test_delete_plan(self, db):
        plan = SubscriptionPlan.create(
            audience="person", days_per_month=20,
            price_plat_du_jour=5000, price_with_salad=6000,
        )
        pid = plan.id
        plan.delete()
        assert SubscriptionPlan.query.get(pid) is None
