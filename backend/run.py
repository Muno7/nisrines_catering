import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.config import config_by_name

env = os.getenv("FLASK_ENV", "development")
app = create_app(config_by_name[env])

if __name__ == "__main__":
    app.run()
