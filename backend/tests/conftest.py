import pytest

from app import create_app
from app.config import TestingConfig
from app.extensions import db as _db
from app.services import (
    AdminService,
    CateringService,
    CategoryService,
    ProductService,
    SlideshowService,
    SubscriptionService,
)


ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "password123"


@pytest.fixture(scope="session")
def app():
    """Create the Flask app once for the entire test session."""
    app = create_app(TestingConfig)
    return app


@pytest.fixture(scope="function", autouse=True)
def db(app):
    """
    For every test function:
      - Push an app context so SQLAlchemy can talk to the DB
      - Create all tables fresh
      - Yield the db object so tests can use it
      - Drop all tables after the test so the next test starts clean
    """
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def make_admin(db):
    def _make_admin(username: str = ADMIN_USERNAME, password: str = ADMIN_PASSWORD):
        return AdminService.create(username, password)

    return _make_admin


@pytest.fixture
def admin(make_admin):
    return make_admin()


@pytest.fixture
def logged_in_client(client, admin):
    client.post(
        "/admin/login",
        data={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
    )
    return client


@pytest.fixture
def make_category(db):
    counter = {"value": 0}

    def _make_category(name: str | None = None):
        counter["value"] += 1
        return CategoryService.create(name or f"Category {counter['value']}")

    return _make_category


@pytest.fixture
def category(make_category):
    return make_category("Mains")


@pytest.fixture
def make_product(db, make_category):
    counter = {"value": 0}

    def _make_product(**overrides):
        counter["value"] += 1
        category = overrides.pop("category", None)
        category_id = overrides.pop("category_id", None)
        if category_id is None and category is not None:
            category_id = category.id
        if category_id is None:
            category_id = make_category(f"Product Category {counter['value']}").id

        values = {
            "name": f"Product {counter['value']}",
            "price_single": 1500,
            "price_family": None,
            "image": None,
            "category_id": category_id,
            "ingredients": "salt, pepper",
            "day": None,
            "order_unit": "each",
            "status": "active",
        }
        values.update(overrides)
        return ProductService.create(**values)

    return _make_product


@pytest.fixture
def product(make_product, category):
    return make_product(name="Grilled Chicken", category=category)


@pytest.fixture
def make_subscription_plan(db):
    def _make_subscription_plan(**overrides):
        values = {
            "audience": "person",
            "days_per_month": 20,
            "price_plat_du_jour": 5000,
            "price_with_salad": 6000,
        }
        values.update(overrides)
        return SubscriptionService.create(**values)

    return _make_subscription_plan


@pytest.fixture
def make_slide(db):
    counter = {"value": 0}

    def _make_slide(image: str | None = None, sort_order: int | None = None):
        counter["value"] += 1
        return SlideshowService.create(
            image or f"http://example.com/slide-{counter['value']}.jpg",
            sort_order=sort_order,
        )

    return _make_slide


@pytest.fixture
def make_catering_menu(db):
    counter = {"value": 0}

    def _make_catering_menu(image: str | None = None, sort_order: int | None = None):
        counter["value"] += 1
        return CateringService.create(
            image or f"http://example.com/menu-{counter['value']}.jpg",
            sort_order=sort_order,
        )

    return _make_catering_menu


@pytest.fixture
def product_form_data(make_category):
    def _product_form_data(**overrides):
        category_id = overrides.pop("category_id", None)
        if category_id is None:
            category_id = make_category().id

        data = {
            "name": "New Dish",
            "priceSingleCents": 2000,
            "priceFamilyCents": "",
            "category_id": category_id,
            "ingredients": "salt, pepper",
            "day": "",
            "order_unit": "each",
            "status": "active",
        }
        data.update(overrides)
        return data

    return _product_form_data


@pytest.fixture
def subscription_form_data():
    def _subscription_form_data(**overrides):
        data = {
            "audience": "person",
            "days_per_month": 20,
            "price_plat_du_jour": 5000,
            "price_with_salad": 6000,
        }
        data.update(overrides)
        return data

    return _subscription_form_data
