from dotenv import load_dotenv

# Ensure env vars from .env are loaded when gunicorn imports this module locally
load_dotenv()

from run import app

# Expose `app` for Gunicorn: gunicorn --bind 0.0.0.0:8000 wsgi:app
