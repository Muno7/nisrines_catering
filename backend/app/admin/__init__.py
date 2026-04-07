from flask import jsonify
from sqlalchemy.exc import SQLAlchemyError
from .routes import bp as admin_bp
from ..exceptions import AppError


@admin_bp.errorhandler(AppError)
def handle_app_error(e: AppError):
    return jsonify({"ok": False, "message": str(e)}), e.status_code

@admin_bp.errorhandler(SQLAlchemyError)
def handle_db_error(_):
    return jsonify({"ok": False, "message": "Database error."}), 500

@admin_bp.errorhandler(500)
def server_error(_):
    return jsonify({"ok": False, "message": "An unexpected error occurred."}), 500


__all__ = ["admin_bp"]
