from flask import Blueprint, jsonify

from ..services import ProductService, CategoryService, SlideshowService, CateringService, SubscriptionService

bp = Blueprint("public", __name__)


def ok(data=None, status: int = 200):
    body = {"ok": True}
    if data is not None:
        body["data"] = data
    return jsonify(body), status


def error(message: str, status: int = 400):
    return jsonify({"ok": False, "error": message}), status


@bp.get("/products")
def get_products():
    products = ProductService.list_public()
    return ok([p.to_dict() for p in products])


@bp.get("/categories")
def get_categories():
    categories = CategoryService.list_active()
    return ok([c.to_dict() for c in categories])


@bp.get("/slideshow")
def get_slideshow():
    slides = SlideshowService.list_all()
    return ok([s.to_dict() for s in slides])


@bp.get("/catering-menus")
def get_catering_menus():
    menus = CateringService.list_all()
    return ok([m.to_dict() for m in menus])


@bp.get("/subscriptions")
def get_subscriptions():
    plans = SubscriptionService.list_all()
    return ok([p.to_dict() for p in plans])
