import re
import uuid
from datetime import datetime

from flask_login import UserMixin
from sqlalchemy import func, or_
from werkzeug.security import generate_password_hash, check_password_hash

from .extensions import db


def slugify(value: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9\s-]", "", value or "").strip().lower()
    base = re.sub(r"[\s_-]+", "-", base)
    return base or str(uuid.uuid4())


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    priceSingleCents = db.Column(db.Integer, nullable=False)
    priceFamilyCents = db.Column(db.Integer, nullable=False)
    image = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)
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


class SlideshowImage(db.Model):
    __tablename__ = "slideshow_images"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    image = db.Column(db.Text, nullable=False)
    sort_order = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


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

    @classmethod
    def ensure(cls, name: str) -> "Category":
        slug = slugify(name)
        existing = cls.query.filter(
            or_(cls.name.ilike(name), cls.slug == slug)
        ).first()
        if existing:
            return existing
        next_order = db.session.query(func.coalesce(func.max(cls.sort_order), 0)).scalar() or 0
        category = cls(name=name.strip(), slug=slug, sort_order=next_order + 1, active=True)
        db.session.add(category)
        db.session.flush()
        return category


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
