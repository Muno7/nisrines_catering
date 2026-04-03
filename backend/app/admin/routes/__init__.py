from flask import Blueprint

bp = Blueprint("admin", __name__, template_folder="../../templates/admin")

from . import auth, products, categories, slideshow, catering, subscriptions  # noqa: E402, F401
