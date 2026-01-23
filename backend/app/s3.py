import mimetypes
import os
import uuid
from typing import Tuple

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from flask import current_app


ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
ALLOWED_MIME = {"image/jpeg", "image/png"}


def allowed_file(filename: str, content_type: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower()
    return ext in ALLOWED_EXTENSIONS and content_type in ALLOWED_MIME


def build_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=current_app.config["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=current_app.config["AWS_SECRET_ACCESS_KEY"],
        region_name=current_app.config["AWS_REGION"],
    )


def upload_file(file_storage) -> Tuple[bool, str]:
    """Upload file to S3 and return (success, url or error)."""
    filename = file_storage.filename or ""
    content_type = file_storage.mimetype or mimetypes.guess_type(filename)[0] or ""

    max_file_size = current_app.config.get("MAX_FILE_SIZE", 5 * 1024 * 1024)
    # Try to determine file size without consuming the stream
    size = getattr(file_storage, "content_length", None)
    if size is None:
        try:
            pos = file_storage.stream.tell()
            file_storage.stream.seek(0, os.SEEK_END)
            size = file_storage.stream.tell()
            file_storage.stream.seek(pos)
        except Exception:
            size = None

    if size is not None and size > max_file_size:
        return False, f"File is too large. Max size is {max_file_size // (1024*1024)}MB."

    if not allowed_file(filename, content_type):
        return False, "Invalid file type. Please upload JPG or PNG."

    ext = filename.rsplit(".", 1)[-1].lower()
    key = f"products/{uuid.uuid4()}.{ext}"

    bucket = current_app.config.get("S3_BUCKET_NAME")
    base_url = current_app.config.get("S3_PUBLIC_BASE_URL")
    if not bucket:
        return False, "S3 bucket not configured."

    client = build_s3_client()

    try:
        client.upload_fileobj(
            file_storage,
            bucket,
            key,
            ExtraArgs={
                "ContentType": content_type,
            },
        )
    except (BotoCoreError, ClientError) as exc:
        return False, f"S3 upload failed: {exc}"

    if base_url:
        url = f"{base_url.rstrip('/')}/{key}"
    else:
        region = current_app.config.get("AWS_REGION") or "us-east-1"
        url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
    return True, url
