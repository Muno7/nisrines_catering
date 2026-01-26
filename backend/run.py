import os
from dotenv import load_dotenv

# Load environment variables from .env for local/dev runs (gunicorn/flask)
load_dotenv()

from app import create_app

app = create_app()

if __name__ == "__main__":
    debug_flag = os.getenv("DEBUG", "False").lower() in {"1", "true", "yes", "on"}
    app.run(debug=debug_flag)
