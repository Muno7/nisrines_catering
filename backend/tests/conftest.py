import pytest

from app import create_app
from app.config import TestingConfig
from app.extensions import db as _db


@pytest.fixture(scope="session")
def app():
    """Create the Flask app once for the entire test session."""
    app = create_app(TestingConfig)
    return app


@pytest.fixture(scope="function", autouse=True)
def db(app):
    """
    For every test function:
      - Push an app context so SQLAlchemy can talk to the DB
      - Create all tables fresh
      - Yield the db object so tests can use it
      - Drop all tables after the test so the next test starts clean
    """
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()
