from flask import jsonify
from .routes import bp
from ..exceptions import AppError


@bp.errorhandler(AppError)
def handle_app_error(e: AppError):
    return jsonify({"ok": False, "message": str(e)}), e.status_code

@bp.errorhandler(404)
def not_found(_):
    return jsonify({"ok": False, "message": "Not found."}), 404

@bp.errorhandler(500)
def server_error(_):
    return jsonify({"ok": False, "message": "An unexpected error occurred."}), 500


__all__ = ["bp"]
