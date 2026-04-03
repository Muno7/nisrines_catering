from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import Admin
from ..exceptions import ValidationError, ConflictError, NotFoundError


class AdminService:

    @staticmethod
    def create(username: str, password: str) -> Admin:
        # Conflict check — needs the DB, so it lives here
        if Admin.query.filter_by(username=(username or "").strip()).first():
            raise ConflictError(f"Admin '{username}' already exists.")

        admin = Admin()
        admin.set_username(username)   # raises ValueError if blank
        admin.set_password(password)   # raises ValueError if blank

        try:
            db.session.add(admin)
            db.session.commit()
            return admin
        except SQLAlchemyError:
            db.session.rollback()
            raise

    @staticmethod
    def get_by_username(username: str) -> Admin:
        admin = Admin.query.filter_by(username=username).first()
        if not admin:
            raise NotFoundError(f"Admin '{username}' not found.")
        return admin

    @staticmethod
    def authenticate(username: str, password: str) -> Admin:
        """Look up admin and verify password.

        Raises ValidationError for both bad username and bad password
        with the same message — prevents username enumeration attacks.
        """
        admin = Admin.query.filter_by(username=(username or "").strip()).first()
        if not admin or not admin.check_password(password):
            raise ValidationError("Invalid credentials.")
        return admin
