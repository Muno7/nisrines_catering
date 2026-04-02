from sqlalchemy import func, or_
from sqlalchemy.exc import SQLAlchemyError

from .extensions import db
from .models import (
    User, Product, Category, SlideshowImage,
    CateringMenuImage, SubscriptionPlan, slugify,
)
from .exceptions import ValidationError, ConflictError, NotFoundError


# ---------------------------------------------------------------------------
# UserService
# ---------------------------------------------------------------------------

class UserService:

    @staticmethod
    def create(username: str, password: str) -> User:
        # Conflict check — needs the DB, so it lives here
        if User.query.filter_by(username=(username or "").strip()).first():
            raise ConflictError(f"User '{username}' already exists.")

        user = User()
        user.set_username(username)   # raises ValueError if blank
        user.set_password(password)   # raises ValueError if blank

        try:
            db.session.add(user)
            db.session.commit()
            return user
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def get_by_username(username: str) -> User:
        user = User.query.filter_by(username=username).first()
        if not user:
            raise NotFoundError(f"User '{username}' not found.")
        return user


# ---------------------------------------------------------------------------
# ProductService
# ---------------------------------------------------------------------------

class ProductService:

    @staticmethod
    def _get_or_raise(product_id: str) -> Product:
        product = db.session.get(Product, product_id)
        if not product:
            raise NotFoundError("Product not found.")
        return product

    @staticmethod
    def create(
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
    ) -> Product:
        product = Product()
        product.set_name(name)
        product.set_name_ar(name_ar)
        product.set_price_single(price_single)
        product.set_price_family(price_family)
        product.set_category(category, category_id)
        product.set_ingredients(ingredients)
        product.set_day(day)
        product.set_status(status)
        product.image = image

        try:
            db.session.add(product)
            db.session.commit()
            return product
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def update(
        product: Product,
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
    ) -> Product:
        if name is not None:
            product.set_name(name)
        if name_ar is not None:
            product.set_name_ar(name_ar)
        if price_single is not None:
            product.set_price_single(price_single)
        if price_family is not None:
            product.set_price_family(price_family)
        if image is not None:
            product.image = image
        if category is not None:
            product.set_category(category, category_id if category_id is not None else product.category_id)
        if ingredients is not None:
            product.set_ingredients(ingredients)
        if day is not None:
            product.set_day(day)
        if status is not None:
            product.set_status(status)

        try:
            db.session.commit()
            return product
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def set_status(product: Product, status: str) -> Product:
        product.set_status(status)  # raises ValueError if invalid
        try:
            db.session.commit()
            return product
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def duplicate(product: Product) -> Product:
        copy = Product()
        copy.set_name(f"{product.name} (copy)")
        copy.set_name_ar(product.name_ar)
        copy.set_price_single(product.priceSingleCents)
        copy.set_price_family(product.priceFamilyCents)
        copy.set_category(product.category, product.category_id)
        copy.set_ingredients(product.ingredients)
        copy.set_day(product.day)
        copy.set_status("inactive")
        copy.image = product.image

        try:
            db.session.add(copy)
            db.session.commit()
            return copy
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def delete(product: Product) -> None:
        try:
            db.session.delete(product)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise


# ---------------------------------------------------------------------------
# CategoryService
# ---------------------------------------------------------------------------

class CategoryService:

    @staticmethod
    def _get_or_raise(category_id: int) -> Category:
        category = db.session.get(Category, category_id)
        if not category:
            raise NotFoundError("Category not found.")
        return category

    @staticmethod
    def create(name: str) -> Category:
        name = (name or "").strip()
        slug = slugify(name)

        # Conflict check — needs the DB
        if Category.query.filter(
            or_(Category.name.ilike(name), Category.slug == slug)
        ).first():
            raise ConflictError(f"Category '{name}' already exists.")

        next_order = (
            db.session.query(func.coalesce(func.max(Category.sort_order), 0)).scalar() or 0
        )
        category = Category(sort_order=next_order + 1, active=True)
        category.set_name(name)  # raises ValueError if blank

        try:
            db.session.add(category)
            db.session.commit()
            return category
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def ensure(name: str) -> Category:
        """Return existing category or create it — used during product creation."""
        slug = slugify(name)
        existing = Category.query.filter(
            or_(Category.name.ilike(name), Category.slug == slug)
        ).first()
        if existing:
            return existing

        next_order = (
            db.session.query(func.coalesce(func.max(Category.sort_order), 0)).scalar() or 0
        )
        category = Category(sort_order=next_order + 1, active=True)
        category.set_name(name)
        db.session.add(category)
        db.session.flush()
        return category

    @staticmethod
    def update(
        category: Category,
        *,
        name: str | None = None,
        sort_order: int | None = None,
    ) -> Category:
        if name is not None:
            name = name.strip()
            slug = slugify(name)

            # Conflict check — another category using this name
            conflict = (
                Category.query.filter(or_(Category.slug == slug, Category.name.ilike(name)))
                .filter(Category.id != category.id)
                .first()
            )
            if conflict:
                raise ConflictError(f"Another category already uses the name '{name}'.")

            category.set_name(name)  # raises ValueError if blank

        if sort_order is not None:
            category.sort_order = sort_order

        try:
            db.session.commit()
            return category
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def set_active(category: Category, active: bool) -> Category:
        category.active = active
        try:
            db.session.commit()
            return category
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def delete(category: Category) -> None:
        product_count = Product.query.filter_by(category_id=category.id).count()
        if product_count:
            raise ValidationError(
                "Cannot delete a category that still has products. "
                "Move or delete its products first."
            )
        try:
            db.session.delete(category)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise


# ---------------------------------------------------------------------------
# SlideshowService
# ---------------------------------------------------------------------------

class SlideshowService:

    @staticmethod
    def _get_or_raise(slide_id: str) -> SlideshowImage:
        slide = db.session.get(SlideshowImage, slide_id)
        if not slide:
            raise NotFoundError("Slide not found.")
        return slide

    @staticmethod
    def next_order() -> int:
        return (
            db.session.query(func.coalesce(func.max(SlideshowImage.sort_order), 0)).scalar() or 0
        ) + 1

    @staticmethod
    def create(image_url: str, sort_order: int) -> SlideshowImage:
        slide = SlideshowImage(sort_order=sort_order)
        slide.set_image(image_url)  # raises ValueError if blank

        try:
            db.session.add(slide)
            db.session.commit()
            return slide
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def delete(slide: SlideshowImage) -> None:
        try:
            db.session.delete(slide)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def reorder(updates: dict[str, int]) -> None:
        try:
            for slide_id, order in updates.items():
                slide = db.session.get(SlideshowImage, slide_id)
                if slide:
                    slide.sort_order = order
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise


# ---------------------------------------------------------------------------
# CateringService
# ---------------------------------------------------------------------------

class CateringService:

    @staticmethod
    def _get_or_raise(menu_id: str) -> CateringMenuImage:
        menu = db.session.get(CateringMenuImage, menu_id)
        if not menu:
            raise NotFoundError("Catering menu image not found.")
        return menu

    @staticmethod
    def next_order() -> int:
        return (
            db.session.query(func.coalesce(func.max(CateringMenuImage.sort_order), 0)).scalar() or 0
        ) + 1

    @staticmethod
    def create(image_url: str, sort_order: int) -> CateringMenuImage:
        menu = CateringMenuImage(sort_order=sort_order)
        menu.set_image(image_url)  # raises ValueError if blank

        try:
            db.session.add(menu)
            db.session.commit()
            return menu
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def delete(menu: CateringMenuImage) -> None:
        try:
            db.session.delete(menu)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def reorder(updates: dict[str, int]) -> None:
        try:
            for menu_id, order in updates.items():
                menu = db.session.get(CateringMenuImage, menu_id)
                if menu:
                    menu.sort_order = order
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise


# ---------------------------------------------------------------------------
# SubscriptionService
# ---------------------------------------------------------------------------

class SubscriptionService:

    @staticmethod
    def _get_or_raise(plan_id: str) -> SubscriptionPlan:
        plan = db.session.get(SubscriptionPlan, plan_id)
        if not plan:
            raise NotFoundError("Subscription plan not found.")
        return plan

    @staticmethod
    def create(
        *,
        audience: str,
        days_per_month: int,
        price_plat_du_jour: int,
        price_with_salad: int,
    ) -> SubscriptionPlan:
        # Conflict check — needs the DB
        if SubscriptionPlan.query.filter_by(
            audience=audience, days_per_month=days_per_month
        ).first():
            raise ConflictError(
                f"A plan for '{audience}' with {days_per_month} days/month already exists."
            )

        plan = SubscriptionPlan()
        plan.set_audience(audience)
        plan.set_days_per_month(days_per_month)
        plan.set_price_plat_du_jour(price_plat_du_jour)
        plan.set_price_with_salad(price_with_salad)

        try:
            db.session.add(plan)
            db.session.commit()
            return plan
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def update(
        plan: SubscriptionPlan,
        *,
        audience: str,
        days_per_month: int,
        price_plat_du_jour: int,
        price_with_salad: int,
    ) -> SubscriptionPlan:
        # Conflict check — another plan occupying the same slot
        conflict = (
            SubscriptionPlan.query.filter_by(audience=audience, days_per_month=days_per_month)
            .filter(SubscriptionPlan.id != plan.id)
            .first()
        )
        if conflict:
            raise ConflictError(
                f"Another plan for '{audience}' with {days_per_month} days/month already exists."
            )

        plan.set_audience(audience)
        plan.set_days_per_month(days_per_month)
        plan.set_price_plat_du_jour(price_plat_du_jour)
        plan.set_price_with_salad(price_with_salad)

        try:
            db.session.commit()
            return plan
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def delete(plan: SubscriptionPlan) -> None:
        try:
            db.session.delete(plan)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            raise
