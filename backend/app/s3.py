import io
import mimetypes
import os
import uuid
from typing import Tuple

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from flask import current_app
from PIL import Image


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
    # Accept broader set of common image types; Pillow will convert them to JPEG
    return ext in ALLOWED_EXTENSIONS and (
        content_type in ALLOWED_MIME or content_type.startswith("image/")
    )


def compress_image(file_storage) -> Tuple[bool, str, str, io.BytesIO | None]:
    """
    Compress and resize the image to a reasonable size before upload.
    Returns (success, extension, content_type, buffer_or_none)
    """
    try:
        file_storage.stream.seek(0)
        img = Image.open(file_storage.stream)
    except Exception:
        return False, "", "", None

    # Convert to RGB to ensure JPEG compatibility and reduce size
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # Resize with max dimension
    max_dim = 1600
    img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

    buffer = io.BytesIO()
    target_ext = "jpg"
    target_format = "JPEG"
    img.save(buffer, format=target_format, quality=82, optimize=True)
    buffer.seek(0)
    content_type = "image/jpeg"
    return True, target_ext, content_type, buffer


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

    if not allowed_file(filename, content_type):
        return False, "Invalid file type. Please upload a valid image."

    # Compress image to reduce upload size
    ok_compress, ext, content_type, buffer = compress_image(file_storage)
    if not ok_compress or buffer is None:
        return False, "Could not process image. Please try a different file."

    max_file_size = current_app.config.get("MAX_FILE_SIZE", 5 * 1024 * 1024)
    buffer_size = buffer.getbuffer().nbytes
    if buffer_size > max_file_size:
        return False, f"Processed file is too large. Max size is {max_file_size // (1024*1024)}MB."

    key = f"products/{uuid.uuid4()}.{ext}"

    bucket = current_app.config.get("S3_BUCKET_NAME")
    base_url = current_app.config.get("S3_PUBLIC_BASE_URL")
    if not bucket:
        return False, "S3 bucket not configured."

    client = build_s3_client()

    try:
        client.upload_fileobj(
            buffer,
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
