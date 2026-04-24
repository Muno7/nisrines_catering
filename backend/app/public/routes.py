from flask import Blueprint, jsonify

from ..models import Category, SlideshowImage, CateringMenuImage, SubscriptionPlan
from ..services import ProductService

bp = Blueprint("public", __name__)


@bp.get("/products")
def get_products():
    products = ProductService.list_public()
    return jsonify([ProductService.serialize_public(p) for p in products])


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
