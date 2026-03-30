import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.config import config_by_name

env = os.getenv("FLASK_ENV", "production")
app = create_app(config_by_name[env])

# Expose `app` for Gunicorn: gunicorn --bind 0.0.0.0:8000 wsgi:app
