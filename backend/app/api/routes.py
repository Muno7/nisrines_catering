from flask import Blueprint, jsonify
from sqlalchemy import or_

from ..models import Product, Category

api_bp = Blueprint("api", __name__)


@api_bp.route("/products", methods=["GET"])
def get_products():
    query = Product.query.outerjoin(Category, Product.category_id == Category.id).filter(
        or_(Product.status == "active", Product.status.is_(None)),
        Product.is_active.is_(True),
        or_(Category.active.is_(True), Product.category_id.is_(None)),
    )

    products = query.order_by(Product.updated_at.desc()).all()

    payload = []

    for p in products:
        single_price = getattr(p, "priceSingleCents", None) or getattr(p, "priceCents", None)
        family_price = getattr(p, "priceFamilyCents", None)
        status = p.status or ("active" if p.is_active else "inactive")
        category_slug = p.category_rel.slug if getattr(p, "category_rel", None) else p.category

        product_json = {
            "id": p.id,
            "name": p.name,
            "image": p.image,
            "category": category_slug,
            "ingridients": p.ingridients,
            "status": status,
        }

        if family_price is not None and family_price > 0 and single_price is not None:
            product_json["price"] = {
                "single": single_price,
                "family": family_price,
            }
        elif single_price is not None:
            product_json["priceCents"] = single_price

        payload.append(product_json)

    return jsonify(payload)


@api_bp.route("/categories", methods=["GET"])
def get_categories():
    categories = Category.query.filter_by(active=True).order_by(Category.sort_order, Category.name).all()
    payload = [
        {"id": c.id, "name": c.name, "slug": c.slug, "sort_order": c.sort_order}
        for c in categories
    ]
    return jsonify(payload)
