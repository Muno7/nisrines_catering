from flask import Flask, request
from flask_login import LoginManager
from .config import BaseConfig, DevelopmentConfig
from .extensions import db, migrate, login_manager, csrf
from .models import User
from .admin import admin_bp
from .api import api_bp


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
    def load_user(user_id: str) -> User | None:
        return User.query.get(user_id)

    register_cli_commands(app)

    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(api_bp, url_prefix="/api")

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
    from werkzeug.security import generate_password_hash

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
        from .models import User

        existing = User.query.filter_by(username=username).first()
        if existing:
            click.echo("User already exists.")
            return

        user = User(
            username=username,
            password_hash=generate_password_hash(password),
        )
        db.session.add(user)
        db.session.commit()
        click.echo("Admin user created.")
