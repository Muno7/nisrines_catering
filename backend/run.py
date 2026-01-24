from dotenv import load_dotenv

# Load environment variables from .env for local/dev runs (gunicorn/flask)
load_dotenv()

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=False)
