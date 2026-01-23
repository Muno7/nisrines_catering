import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REMEMBER_COOKIE_DURATION = timedelta(days=7)
    # Request cap (allows multiple images in one POST), per-file limit enforced in s3.upload_file
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB per request
    MAX_FILE_SIZE = 5 * 1024 * 1024        # 5MB per individual file

    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION = os.getenv("AWS_REGION")
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
    S3_PUBLIC_BASE_URL = os.getenv("S3_PUBLIC_BASE_URL")
