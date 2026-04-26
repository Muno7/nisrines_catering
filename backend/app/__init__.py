from flask import Flask, request, render_template, jsonify
from flask_login import LoginManager
from .config import BaseConfig, DevelopmentConfig
from .extensions import db, migrate, login_manager, csrf
from .models import Admin
from .admin import admin_bp
from .public import bp as public_bp


def create_app(config_object: type[BaseConfig] = DevelopmentConfig) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    csrf.init_app(app)

    login_manager.login_view = "admin.login"
    login_manager.login_message_category = "warning"

    @login_manager.user_loader
    def load_user(user_id: str) -> Admin | None:
        return Admin.query.get(user_id)

    register_cli_commands(app)

    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(public_bp, url_prefix="/api")

    @app.errorhandler(404)
    def not_found(e):
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def server_error(e):
        if request.path.startswith("/api/"):
            return jsonify({"ok": False, "error": "An unexpected error occurred."}), 500
        return render_template("errors/500.html"), 500

    @app.after_request
    def add_cors_headers(response):
        """Allow frontends to call the API based on configured origins."""
        if request.path.startswith("/api/"):
            origin = request.headers.get("Origin", "")
            allowed = set(app.config.get("CORS_ALLOW_ORIGINS", []))
            if origin in allowed:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Vary"] = "Origin"
                response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    return app


def register_cli_commands(app: Flask) -> None:
    import click

    @app.cli.command("create-admin")
    @click.option("--username", prompt=True, help="Admin username")
    @click.option(
        "--password",
        prompt=True,
        hide_input=True,
        confirmation_prompt=True,
        help="Admin password",
    )
    def create_admin(username: str, password: str) -> None:
        """Create an admin user if it does not already exist."""
        from .services import AdminService
        from .exceptions import ValidationError, ConflictError

        try:
            AdminService.create(username, password)
            click.echo("Admin user created.")
        except ConflictError:
            click.echo("Admin already exists.")
        except ValidationError as e:
            click.echo(f"Error: {e}")
