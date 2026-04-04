import re
import uuid
from datetime import datetime

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from .extensions import db
from .exceptions import ValidationError


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(value: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9\s-]", "", value or "").strip().lower()
    base = re.sub(r"[\s_-]+", "-", base)
    return base or str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

class Admin(UserMixin, db.Model):
    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<Admin id={self.id} username={self.username!r}>"

    def set_username(self, username: str) -> None:
        username = (username or "").strip()
        if not username:
            raise ValidationError("Username is required.")
        self.username = username

    def set_password(self, password: str) -> None:
        if not password:
            raise ValidationError("Password is required.")
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    name_ar = db.Column(db.String(255), nullable=True)
    priceSingleCents = db.Column(db.Integer, nullable=False)
    priceFamilyCents = db.Column(db.Integer, nullable=False)
    image = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    ingredients = db.Column(db.Text, nullable=False)
    day = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    status = db.Column(db.String(20), default="active", nullable=False)
    is_ramadan = db.Column(db.Boolean, default=False, nullable=False)
    is_seasonal = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name!r} status={self.status!r}>"

    def set_name(self, name: str) -> None:
        text = (name or "").strip()
        if not text:
            raise ValidationError("Product name is required.")
        self.name = text[:1].upper() + text[1:].lower()

    def set_name_ar(self, name_ar: str | None) -> None:
        self.name_ar = (name_ar or "").strip() or None

    def set_price_single(self, price: int) -> None:
        if price < 0:
            raise ValidationError("Single price cannot be negative.")
        self.priceSingleCents = price

    def set_price_family(self, price: int) -> None:
        if price < 0:
            raise ValidationError("Family price cannot be negative.")
        self.priceFamilyCents = price

    def set_status(self, status: str) -> None:
        if status not in {"active", "inactive"}:
            raise ValidationError(f"Invalid status '{status}'.")
        self.status = status
        self.is_active = status == "active"

    def set_category(self, category_id: int | None) -> None:
        self.category_id = category_id

    def set_ingredients(self, ingredients: str) -> None:
        self.ingredients = (ingredients or "").strip()

    def set_day(self, day: str | None) -> None:
        self.day = (day or "").strip() or None


# ---------------------------------------------------------------------------
# SlideshowImage
# ---------------------------------------------------------------------------

class SlideshowImage(db.Model):
    __tablename__ = "slideshow_images"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    image = db.Column(db.Text, nullable=False)
    sort_order = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<SlideshowImage id={self.id} sort_order={self.sort_order}>"

    def set_image(self, url: str) -> None:
        if not (url or "").strip():
            raise ValidationError("Image URL is required.")
        self.image = url


# ---------------------------------------------------------------------------
# CateringMenuImage
# ---------------------------------------------------------------------------

class CateringMenuImage(db.Model):
    __tablename__ = "catering_menu_images"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    image = db.Column(db.Text, nullable=False)
    sort_order = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<CateringMenuImage id={self.id} sort_order={self.sort_order}>"

    def set_image(self, url: str) -> None:
        if not (url or "").strip():
            raise ValidationError("Image URL is required.")
        self.image = url


# ---------------------------------------------------------------------------
# SubscriptionPlan
# ---------------------------------------------------------------------------

class SubscriptionPlan(db.Model):
    __tablename__ = "subscription_plans"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    audience = db.Column(db.String(20), nullable=False)
    days_per_month = db.Column(db.Integer, nullable=False)
    price_plat_du_jour = db.Column(db.Integer, nullable=False)
    price_with_salad = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (
        db.UniqueConstraint(
            "audience",
            "days_per_month",
            name="uq_subscription_plans_audience_days",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<SubscriptionPlan id={self.id} audience={self.audience!r} "
            f"days={self.days_per_month}>"
        )

    def set_audience(self, audience: str) -> None:
        if audience not in {"person", "family"}:
            raise ValidationError(f"Invalid audience '{audience}'. Must be 'person' or 'family'.")
        self.audience = audience

    def set_days_per_month(self, days: int) -> None:
        if days < 1:
            raise ValidationError("Days per month must be at least 1.")
        self.days_per_month = days

    def set_price_plat_du_jour(self, price: int) -> None:
        if price < 0:
            raise ValidationError("Plat du jour price cannot be negative.")
        self.price_plat_du_jour = price

    def set_price_with_salad(self, price: int) -> None:
        if price < 0:
            raise ValidationError("With-salad price cannot be negative.")
        self.price_with_salad = price


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    slug = db.Column(db.String(140), nullable=False, unique=True, index=True)
    sort_order = db.Column(db.Integer, default=0, nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    products = db.relationship(
        "Product",
        backref="category_rel",
        lazy=True,
        cascade="save-update",
    )

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name!r} active={self.active}>"

    def set_name(self, name: str) -> None:
        name = (name or "").strip()
        if not name:
            raise ValidationError("Category name is required.")
        self.name = name
        self.slug = slugify(name)


# ---------------------------------------------------------------------------
# Setting
# ---------------------------------------------------------------------------

class Setting(db.Model):
    __tablename__ = "settings"

    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Setting key={self.key!r}>"

    @staticmethod
    def get(key: str, default: str | None = None) -> str | None:
        record = Setting.query.filter_by(key=key).first()
        return record.value if record else default

    @staticmethod
    def set(key: str, value: str | None) -> None:
        record = Setting.query.filter_by(key=key).first()
        if not record:
            record = Setting(key=key, value=value)
            db.session.add(record)
        else:
            record.value = value
