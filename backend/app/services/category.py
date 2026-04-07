from sqlalchemy import func, or_
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import Category, Product, slugify
from ..exceptions import ValidationError, ConflictError, NotFoundError


class CategoryService:

    @staticmethod
    def list_all() -> list[Category]:
        return Category.query.order_by(Category.sort_order, Category.name).all()

    @staticmethod
    def choices(include_placeholder: bool = True) -> list[tuple[int, str]]:
        """Return WTForms-compatible choices list for category select fields."""
        categories = Category.query.order_by(Category.sort_order, Category.name).all()
        result: list[tuple[int, str]] = []
        if include_placeholder:
            result.append((0, "Select category"))
        result.extend([(c.id, c.name) for c in categories])
        return result

    @staticmethod
    def get_by_id(category_id: int) -> "Category | None":
        return db.session.get(Category, category_id)

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
    def product_counts() -> dict[int, int]:
        rows = (
            db.session.query(Product.category_id, func.count(Product.id))
            .group_by(Product.category_id)
            .all()
        )
        return {category_id: n for category_id, n in rows}

    @staticmethod
    def reorder(ids: list[int]) -> None:
        try:
            for i, category_id in enumerate(ids):
                category = db.session.get(Category, category_id)
                if category:
                    category.sort_order = i
            db.session.commit()
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
