import hashlib
import mimetypes
import os
from typing import Tuple

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from flask import current_app


ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "tiff",
    "tif",
    "bmp",
}
ALLOWED_MIME = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/tiff",
    "image/bmp",
}


def allowed_file(filename: str, content_type: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower()
    # Browser-provided MIME values can vary, so extension allow-listing remains
    # the main guardrail while still accepting valid `image/*` uploads.
    return ext in ALLOWED_EXTENSIONS and (
        content_type in ALLOWED_MIME or content_type.startswith("image/")
    )


def build_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=current_app.config["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=current_app.config["AWS_SECRET_ACCESS_KEY"],
        region_name=current_app.config["AWS_REGION"],
    )


def _object_url(bucket: str, key: str) -> str:
    """
    Build the URL stored in the database and sent to the frontend/admin UI.

    `S3_PUBLIC_BASE_URL` lets production use a CDN or custom asset hostname
    without changing existing upload records or response shapes.
    """
    base_url = current_app.config.get("S3_PUBLIC_BASE_URL")
    if base_url:
        return f"{base_url.rstrip('/')}/{key}"
    region = current_app.config.get("AWS_REGION")
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"


def _hash_stream(stream) -> str:
    """Return hex sha256 of stream without consuming it."""
    stream.seek(0)
    sha = hashlib.sha256()
    for chunk in iter(lambda: stream.read(8192), b""):
        sha.update(chunk)
    stream.seek(0)
    return sha.hexdigest()


def upload_file(file_storage) -> Tuple[bool, str]:
    """Return a public URL on success, or a route-displayable error on failure."""
    filename = file_storage.filename or ""
    content_type = file_storage.mimetype or mimetypes.guess_type(filename)[0] or ""

    if not allowed_file(filename, content_type):
        return False, "Invalid file type. Please upload a valid image."

    try:
        file_storage.stream.seek(0, os.SEEK_END)
        buffer_size = file_storage.stream.tell()
        file_storage.stream.seek(0)
    except Exception:
        buffer_size = file_storage.content_length or 0

    max_file_size = current_app.config.get("MAX_FILE_SIZE", 5 * 1024 * 1024)
    if buffer_size > max_file_size:
        return False, f"Processed file is too large. Max size is {max_file_size // (1024*1024)}MB."

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"

    bucket = current_app.config.get("S3_BUCKET_NAME")
    if not bucket:
        return False, "S3 bucket not configured."

    client = build_s3_client()
    digest = _hash_stream(file_storage.stream)
    # Hash-based keys deduplicate exact uploads. NOTE: this helper currently
    # serves product, slideshow, and catering uploads; changing the shared prefix
    # may require migrating stored image URLs already consumed by clients.
    key = f"products/{digest}.{ext}"

    try:
        client.head_object(Bucket=bucket, Key=key)
        return True, _object_url(bucket, key)
    except ClientError as exc:
        error_code = getattr(exc, "response", {}).get("Error", {}).get("Code")
        if error_code not in ("404", "NoSuchKey", "NotFound"):
            return False, f"S3 check failed: {exc}"

    try:
        client.upload_fileobj(
            file_storage.stream,
            bucket,
            key,
            ExtraArgs={
                "ContentType": content_type,
            },
        )
    except (BotoCoreError, ClientError) as exc:
        return False, f"S3 upload failed: {exc}"

    return True, _object_url(bucket, key)
