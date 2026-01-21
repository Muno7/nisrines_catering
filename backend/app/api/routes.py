from flask import Blueprint, jsonify

from ..models import Product

api_bp = Blueprint("api", __name__)


@api_bp.route("/products", methods=["GET"])
def get_products():
    products = (
        Product.query.filter_by(is_active=True)
        .order_by(Product.created_at.desc())
        .all()
    )

    payload = []

    for p in products:
        product_json = {
            "id": p.id,
            "name": p.name,
            "image": p.image,
            "category": p.category,
            "ingridients": p.ingridients,
            "is_active": p.is_active,
        }

        # PRICE LOGIC (IMPORTANT PART)
        # Case 1: legacy single price
        if hasattr(p, "priceCents") and p.priceCents is not None:
            product_json["priceCents"] = p.priceCents

        # Case 2: new single + family price
        elif (
            hasattr(p, "price_single_cents")
            and hasattr(p, "price_family_cents")
            and p.price_single_cents is not None
            and p.price_family_cents is not None
        ):
            product_json["price"] = {
                "single": p.price_single_cents,
                "family": p.price_family_cents,
            }

        payload.append(product_json)

    return jsonify(payload)

