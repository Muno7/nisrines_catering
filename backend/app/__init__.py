from flask import Flask
from flask_login import LoginManager
from .config import Config
from .extensions import db, migrate, login_manager, csrf
from .models import User
from .admin import admin_bp
from .api import api_bp


def create_app(config_object: type | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object or Config)

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
