import os
from datetime import timedelta


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REMEMBER_COOKIE_DURATION = timedelta(days=7)

    # File upload limits
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024   # 50 MB per request
    MAX_FILE_SIZE = 15 * 1024 * 1024         # 15 MB per individual file

    # AWS / S3
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION = os.getenv("AWS_REGION")
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
    S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL")

    # CORS — comma-separated list of allowed origins
    CORS_ALLOW_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
        if origin.strip()
    ]


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    CORS_ALLOW_ORIGINS: list[str] = BaseConfig.CORS_ALLOW_ORIGINS or [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


class ProductionConfig(BaseConfig):
    DEBUG = False


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
    WTF_CSRF_ENABLED = False


config_by_name: dict[str, type[BaseConfig]] = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
