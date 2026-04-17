from flask import Blueprint, jsonify
from sqlalchemy import or_

from ..models import Product, Category, SlideshowImage, CateringMenuImage, SubscriptionPlan

bp = Blueprint("public", __name__)


@bp.get("/products")
def get_products():
    query = Product.query.outerjoin(Category, Product.category_id == Category.id).filter(
        Product.status == "active",
        or_(Category.active.is_(True), Product.category_id.is_(None)),
    )

    products = query.order_by(Product.updated_at.desc()).all()

    payload = []

    for p in products:
        single_price = p.priceSingleCents
        family_price = p.priceFamilyCents
        category_slug = p.category_rel.slug if p.category_rel else None

        product_json = {
            "id": p.id,
            "name": p.name,
            "name_ar": p.name_ar,
            "image": p.image,
            "category": category_slug,
            "ingredients": p.ingredients,
            "day": p.day,
            "status": p.status,
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


@bp.get("/categories")
def get_categories():
    categories = Category.query.filter_by(active=True).order_by(Category.sort_order, Category.name).all()
    payload = [
        {"id": c.id, "name": c.name, "slug": c.slug, "sort_order": c.sort_order}
        for c in categories
    ]
    return jsonify(payload)


@bp.get("/slideshow")
def get_slideshow():
    slides = SlideshowImage.query.order_by(SlideshowImage.sort_order, SlideshowImage.created_at).all()
    payload = [{"id": s.id, "image": s.image, "sort_order": s.sort_order} for s in slides]
    return jsonify(payload)


@bp.get("/catering-menus")
def get_catering_menus():
    menus = CateringMenuImage.query.order_by(
        CateringMenuImage.sort_order,
        CateringMenuImage.created_at
    ).all()
    payload = [{"id": m.id, "image": m.image, "sort_order": m.sort_order} for m in menus]
    return jsonify(payload)


@bp.get("/subscriptions")
def get_subscriptions():
    plans = SubscriptionPlan.query.order_by(
        SubscriptionPlan.audience,
        SubscriptionPlan.days_per_month,
    ).all()
    payload = [
        {
            "id": plan.id,
            "audience": plan.audience,
            "daysPerMonth": plan.days_per_month,
            "platDuJour": plan.price_plat_du_jour,
            "withSalad": plan.price_with_salad,
        }
        for plan in plans
    ]
    return jsonify(payload)
