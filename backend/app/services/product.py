from collections import Counter

from sqlalchemy import func, or_
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import Product, Category
from ..exceptions import ValidationError, NotFoundError


class ProductService:

    @staticmethod
    def stats(items: list[Product]) -> dict:
        return {
            "total": len(items),
            "active": sum(1 for p in items if p.status == "active"),
            "inactive": sum(1 for p in items if p.status == "inactive"),
            "category_counts": Counter(p.category_rel.name for p in items if p.category_rel),
        }

    @staticmethod
    def _get_or_raise(product_id: str) -> Product:
        product = db.session.get(Product, product_id)
        if not product:
            raise NotFoundError("Product not found.")
        return product

    @staticmethod
    def _require_category_id(category_id: int | None) -> int:
        if not category_id:
            raise ValidationError("Product category is required.")
        if not db.session.get(Category, category_id):
            raise ValidationError("Product category does not exist.")
        return category_id

    @staticmethod
    def create(
        *,
        name: str,
        name_ar: str | None = None,
        price_single: int,
        price_family: int | None = None,
        image: str | None = None,
        category_id: int,
        ingredients: str = "",
        day: str | None = None,
        order_unit: str = "each",
        status: str = "active",
    ) -> Product:
        product = Product()
        product.set_name(name)
        product.set_name_ar(name_ar)
        product.set_price_single(price_single)
        product.set_price_family(price_family)
        product.set_category(ProductService._require_category_id(category_id))
        product.set_ingredients(ingredients)
        product.set_day(day)
        product.set_order_unit(order_unit)
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
        name: str,
        name_ar: str | None,
        price_single: int,
        price_family: int | None,
        image: str | None,
        category_id: int,
        ingredients: str,
        day: str | None,
        order_unit: str,
        status: str,
    ) -> Product:
        product.set_name(name)
        product.set_name_ar(name_ar)
        product.set_price_single(price_single)
        product.set_price_family(price_family)
        product.image = image
        product.set_category(ProductService._require_category_id(category_id))
        product.set_ingredients(ingredients)
        product.set_day(day)
        product.set_order_unit(order_unit)
        product.set_status(status)

        try:
            db.session.commit()
            return product
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def set_status(product: Product, status: str) -> Product:
        product.set_status(status)
        try:
            db.session.commit()
            return product
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def duplicate(product: Product) -> Product:
        """
        Create a copy that reuses the source product's setup fields.
        """
        copy = Product()
        copy.set_name(f"{product.name} (copy)")
        copy.set_name_ar(product.name_ar)
        copy.set_price_single(product.priceSingleCents)
        copy.set_price_family(product.priceFamilyCents)
        copy.set_category(product.category_id)
        copy.set_ingredients(product.ingredients)
        copy.set_day(product.day)
        copy.set_order_unit(product.order_unit)
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
    def list_filtered(
        *,
        q: str = "",
        category_id: int | None = None,
        status: str = "all",
        day: str = "",
        missing_image: bool = False,
    ) -> list[Product]:
        query = Product.query

        if q:
            query = query.filter(
                or_(
                    Product.name.ilike(f"%{q}%"),
                    Product.name_ar.ilike(f"%{q}%"),
                )
            )
        if category_id:
            query = query.filter(Product.category_id == category_id)
        if status in {"active", "inactive"}:
            query = query.filter(Product.status == status)
        if missing_image:
            query = query.filter(
                or_(Product.image == "", Product.image.is_(None))
            )
        if day:
            query = query.filter(func.lower(Product.day) == day.lower())

        return query.order_by(Product.updated_at.desc()).all()

    @staticmethod
    def bulk_update(
        *,
        product_ids: list[str],
        status: str | None = None,
        category_id: int | None = None,
        price_single: int | None = None,
        price_family: int | None = None,
        day: str | None = None,
        order_unit: str | None = None,
    ) -> int:
        updated = 0
        products = Product.query.filter(Product.id.in_(product_ids)).all()

        for product in products:
            if status in {"active", "inactive"}:
                product.set_status(status)
            if category_id is not None:
                product.set_category(ProductService._require_category_id(category_id))
            if price_single is not None:
                product.set_price_single(price_single)
            if price_family is not None:
                product.set_price_family(price_family)
            if day is not None:
                if day == "clear":
                    product.set_day(None)
                else:
                    product.set_day(day)
            if order_unit in {"each", "dozen"}:
                product.set_order_unit(order_unit)
            updated += 1

        try:
            db.session.commit()
            return updated
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

    @staticmethod
    def list_public() -> list[Product]:
        """
        Return only products that should appear on the public menu.

        Products must belong to an active category to appear publicly.
        """
        return (
            Product.query
            .join(Category, Product.category_id == Category.id)
            .filter(
                Product.status == "active",
                Category.active.is_(True),
            )
            .order_by(Product.updated_at.desc())
            .all()
        )
