import re
import uuid
from datetime import datetime

from flask_login import UserMixin
from sqlalchemy import func, or_
from werkzeug.security import generate_password_hash, check_password_hash

from .extensions import db
from .exceptions import ConflictError, NotFoundError, ValidationError


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(value: str) -> str:
    base = re.sub(r"[^a-zA-Z0-9\s-]", "", value or "").strip().lower()
    base = re.sub(r"[\s_-]+", "-", base)
    return base or str(uuid.uuid4())


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r}>"

    # ------------------------------------------------------------------
    # Password helpers
    # ------------------------------------------------------------------

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    # ------------------------------------------------------------------
    # Class methods
    # ------------------------------------------------------------------

    @classmethod
    def create(cls, username: str, password: str) -> "User":
        """Create and persist a new admin user.

        Raises:
            ValidationError: if username or password is blank.
            ConflictError: if the username is already taken.
        """
        if not username or not username.strip():
            raise ValidationError("Username is required.")
        if not password:
            raise ValidationError("Password is required.")

        if cls.query.filter_by(username=username).first():
            raise ConflictError(f"User '{username}' already exists.")

        user = cls(username=username.strip())
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    @classmethod
    def get_by_username(cls, username: str) -> "User":
        """Return a user by username.

        Raises:
            NotFoundError: if no user with that username exists.
        """
        user = cls.query.filter_by(username=username).first()
        if not user:
            raise NotFoundError(f"User '{username}' not found.")
        return user


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

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name!r} status={self.status!r}>"

    # ------------------------------------------------------------------
    # Private helpers (previously scattered across admin/routes.py)
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_name(raw: str | None) -> str:
        text = (raw or "").strip()
        if not text:
            return ""
        return text[:1].upper() + text[1:].lower()

    @staticmethod
    def _normalize_arabic_name(raw: str | None) -> str | None:
        text = (raw or "").strip()
        return text or None

    def _apply_status(self, status: str) -> None:
        self.status = status
        self.is_active = status == "active"

    # ------------------------------------------------------------------
    # Class methods
    # ------------------------------------------------------------------

    @classmethod
    def create(
        cls,
        *,
        name: str,
        name_ar: str | None = None,
        price_single: int,
        price_family: int = 0,
        image: str | None = None,
        category: str,
        category_id: int | None = None,
        ingredients: str = "",
        day: str | None = None,
        status: str = "active",
    ) -> "Product":
        """Validate and persist a new product.

        Raises:
            ValidationError: if required fields are missing or invalid.
        """
        name = cls._normalize_name(name)
        if not name:
            raise ValidationError("Product name is required.")
        if price_single < 0:
            raise ValidationError("Single price cannot be negative.")
        if price_family < 0:
            raise ValidationError("Family price cannot be negative.")
        if status not in {"active", "inactive"}:
            raise ValidationError(f"Invalid status '{status}'.")

        product = cls(
            name=name,
            name_ar=cls._normalize_arabic_name(name_ar),
            priceSingleCents=price_single,
            priceFamilyCents=price_family,
            image=image,
            category=category.lower() if category else "uncategorized",
            category_id=category_id,
            ingredients=ingredients.strip(),
            day=day or None,
        )
        product._apply_status(status)
        db.session.add(product)
        db.session.commit()
        return product

    # ------------------------------------------------------------------
    # Instance methods
    # ------------------------------------------------------------------

    def update(
        self,
        *,
        name: str | None = None,
        name_ar: str | None = None,
        price_single: int | None = None,
        price_family: int | None = None,
        image: str | None = None,
        category: str | None = None,
        category_id: int | None = None,
        ingredients: str | None = None,
        day: str | None = None,
        status: str | None = None,
    ) -> None:
        """Apply updates and persist.

        Raises:
            ValidationError: if any supplied value is invalid.
        """
        if name is not None:
            name = self._normalize_name(name)
            if not name:
                raise ValidationError("Product name cannot be blank.")
            self.name = name

        if name_ar is not None:
            self.name_ar = self._normalize_arabic_name(name_ar)

        if price_single is not None:
            if price_single < 0:
                raise ValidationError("Single price cannot be negative.")
            self.priceSingleCents = price_single

        if price_family is not None:
            if price_family < 0:
                raise ValidationError("Family price cannot be negative.")
            self.priceFamilyCents = price_family

        if image is not None:
            self.image = image

        if category is not None:
            self.category = category.lower()

        if category_id is not None:
            self.category_id = category_id

        if ingredients is not None:
            self.ingredients = ingredients.strip()

        if day is not None:
            self.day = day or None

        if status is not None:
            if status not in {"active", "inactive"}:
                raise ValidationError(f"Invalid status '{status}'.")
            self._apply_status(status)

        db.session.commit()

    def delete(self) -> None:
        """Delete this product from the database."""
        db.session.delete(self)
        db.session.commit()

    def set_status(self, status: str) -> None:
        """Set active/inactive status and persist.

        Raises:
            ValidationError: if the status value is not valid.
        """
        if status not in {"active", "inactive"}:
            raise ValidationError(f"Invalid status '{status}'.")
        self._apply_status(status)
        db.session.commit()

    def duplicate(self) -> "Product":
        """Return a persisted inactive copy of this product."""
        copy = Product(
            name=f"{self.name} (copy)",
            name_ar=self.name_ar,
            priceSingleCents=self.priceSingleCents,
            priceFamilyCents=self.priceFamilyCents,
            image=self.image,
            category=self.category,
            category_id=self.category_id,
            ingredients=self.ingredients,
            day=self.day,
        )
        copy._apply_status("inactive")
        db.session.add(copy)
        db.session.commit()
        return copy


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

    @classmethod
    def create(cls, image_url: str, sort_order: int) -> "SlideshowImage":
        """Persist a new slideshow image.

        Raises:
            ValidationError: if image_url is blank.
        """
        if not image_url:
            raise ValidationError("Image URL is required.")
        slide = cls(image=image_url, sort_order=sort_order)
        db.session.add(slide)
        db.session.commit()
        return slide

    def delete(self) -> None:
        """Delete this slide from the database."""
        db.session.delete(self)
        db.session.commit()


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

    @classmethod
    def create(cls, image_url: str, sort_order: int) -> "CateringMenuImage":
        """Persist a new catering menu image.

        Raises:
            ValidationError: if image_url is blank.
        """
        if not image_url:
            raise ValidationError("Image URL is required.")
        menu = cls(image=image_url, sort_order=sort_order)
        db.session.add(menu)
        db.session.commit()
        return menu

    def delete(self) -> None:
        """Delete this catering menu image from the database."""
        db.session.delete(self)
        db.session.commit()


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

    @classmethod
    def create(
        cls,
        *,
        audience: str,
        days_per_month: int,
        price_plat_du_jour: int,
        price_with_salad: int,
    ) -> "SubscriptionPlan":
        """Create a new subscription plan.

        Raises:
            ValidationError: if any value is invalid.
            ConflictError: if a plan for this audience + days already exists.
        """
        cls._validate(audience, days_per_month, price_plat_du_jour, price_with_salad)

        if cls.query.filter_by(audience=audience, days_per_month=days_per_month).first():
            raise ConflictError(
                f"A plan for '{audience}' with {days_per_month} days/month already exists."
            )

        plan = cls(
            audience=audience,
            days_per_month=days_per_month,
            price_plat_du_jour=price_plat_du_jour,
            price_with_salad=price_with_salad,
        )
        db.session.add(plan)
        db.session.commit()
        return plan

    def update(
        self,
        *,
        audience: str,
        days_per_month: int,
        price_plat_du_jour: int,
        price_with_salad: int,
    ) -> None:
        """Update this plan's fields and persist.

        Raises:
            ValidationError: if any value is invalid.
            ConflictError: if another plan already occupies the new audience + days slot.
        """
        self._validate(audience, days_per_month, price_plat_du_jour, price_with_salad)

        conflict = (
            SubscriptionPlan.query.filter_by(audience=audience, days_per_month=days_per_month)
            .filter(SubscriptionPlan.id != self.id)
            .first()
        )
        if conflict:
            raise ConflictError(
                f"Another plan for '{audience}' with {days_per_month} days/month already exists."
            )

        self.audience = audience
        self.days_per_month = days_per_month
        self.price_plat_du_jour = price_plat_du_jour
        self.price_with_salad = price_with_salad
        db.session.commit()

    def delete(self) -> None:
        """Delete this subscription plan from the database."""
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def _validate(
        audience: str,
        days_per_month: int,
        price_plat_du_jour: int,
        price_with_salad: int,
    ) -> None:
        if audience not in {"person", "family"}:
            raise ValidationError(f"Invalid audience '{audience}'. Must be 'person' or 'family'.")
        if days_per_month < 1:
            raise ValidationError("Days per month must be at least 1.")
        if price_plat_du_jour < 0:
            raise ValidationError("Plat du jour price cannot be negative.")
        if price_with_salad < 0:
            raise ValidationError("With-salad price cannot be negative.")


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

    # ------------------------------------------------------------------
    # Class methods
    # ------------------------------------------------------------------

    @classmethod
    def create(cls, name: str) -> "Category":
        """Create a new category.

        Raises:
            ValidationError: if name is blank.
            ConflictError: if a category with that name or slug already exists.
        """
        name = (name or "").strip()
        if not name:
            raise ValidationError("Category name is required.")

        slug = slugify(name)
        if cls.query.filter(or_(cls.name.ilike(name), cls.slug == slug)).first():
            raise ConflictError(f"Category '{name}' already exists.")

        next_order = (
            db.session.query(func.coalesce(func.max(cls.sort_order), 0)).scalar() or 0
        )
        category = cls(name=name, slug=slug, sort_order=next_order + 1, active=True)
        db.session.add(category)
        db.session.commit()
        return category

    @classmethod
    def ensure(cls, name: str) -> "Category":
        """Return an existing category or create it — used during bulk imports."""
        slug = slugify(name)
        existing = cls.query.filter(
            or_(cls.name.ilike(name), cls.slug == slug)
        ).first()
        if existing:
            return existing
        next_order = (
            db.session.query(func.coalesce(func.max(cls.sort_order), 0)).scalar() or 0
        )
        category = cls(name=name.strip(), slug=slug, sort_order=next_order + 1, active=True)
        db.session.add(category)
        db.session.flush()
        return category

    # ------------------------------------------------------------------
    # Instance methods
    # ------------------------------------------------------------------

    def update(self, *, name: str | None = None, sort_order: int | None = None) -> None:
        """Update name and/or sort order and persist.

        Raises:
            ValidationError: if the new name is blank.
            ConflictError: if another category already uses that name or slug.
        """
        if name is not None:
            name = name.strip()
            if not name:
                raise ValidationError("Category name cannot be blank.")
            slug = slugify(name)
            conflict = (
                Category.query.filter(or_(Category.slug == slug, Category.name.ilike(name)))
                .filter(Category.id != self.id)
                .first()
            )
            if conflict:
                raise ConflictError(f"Another category already uses the name '{name}'.")
            self.name = name
            self.slug = slug

        if sort_order is not None:
            self.sort_order = sort_order

        db.session.commit()

    def set_active(self, active: bool) -> None:
        """Toggle the active flag and persist."""
        self.active = active
        db.session.commit()

    def delete(self) -> None:
        """Delete this category.

        Raises:
            ValidationError: if the category still has products assigned to it.
        """
        product_count = Product.query.filter_by(category_id=self.id).count()
        if product_count:
            raise ValidationError(
                "Cannot delete a category that still has products. "
                "Move or delete its products first."
            )
        db.session.delete(self)
        db.session.commit()


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
        db.session.commit()
