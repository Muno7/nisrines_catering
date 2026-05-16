from io import BytesIO
import hashlib

import pytest
from botocore.exceptions import ClientError
from werkzeug.datastructures import FileStorage

from app.s3 import allowed_file, upload_file


def _file_storage(filename="image.jpg", content_type="image/jpeg", body=b"image-bytes"):
    return FileStorage(
        stream=BytesIO(body),
        filename=filename,
        content_type=content_type,
    )


def _client_error(code: str):
    return ClientError({"Error": {"Code": code, "Message": code}}, "HeadObject")


@pytest.fixture(autouse=True)
def s3_config(app):
    app.config.update(
        MAX_FILE_SIZE=15 * 1024 * 1024,
        S3_BUCKET_NAME="bucket",
        AWS_REGION="us-east-1",
        S3_PUBLIC_BASE_URL=None,
    )


class FakeS3Client:

    def __init__(self, *, head_error=None, upload_error=None):
        self.head_error = head_error
        self.upload_error = upload_error
        self.uploaded = []

    def head_object(self, Bucket, Key):
        if self.head_error:
            raise self.head_error
        return {}

    def upload_fileobj(self, fileobj, bucket, key, ExtraArgs=None):
        if self.upload_error:
            raise self.upload_error
        self.uploaded.append((bucket, key, ExtraArgs))


class TestAllowedFile:

    def test_allowed_file_accepts_supported_image(self):
        assert allowed_file("photo.jpg", "image/jpeg") is True

    def test_allowed_file_rejects_invalid_extension(self):
        assert allowed_file("photo.txt", "image/jpeg") is False

    def test_allowed_file_rejects_invalid_mimetype(self):
        assert allowed_file("photo.jpg", "text/plain") is False


class TestUploadFile:

    def test_invalid_extension_returns_validation_error(self, app):
        with app.app_context():
            ok, result = upload_file(_file_storage(filename="photo.txt", content_type="text/plain"))

        assert ok is False
        assert "Invalid file type" in result

    def test_oversized_file_returns_validation_error(self, app):
        app.config["MAX_FILE_SIZE"] = 3
        with app.app_context():
            ok, result = upload_file(_file_storage(body=b"1234"))

        assert ok is False
        assert "too large" in result

    def test_missing_bucket_returns_configuration_error(self, app):
        app.config["S3_BUCKET_NAME"] = None
        with app.app_context():
            ok, result = upload_file(_file_storage())

        assert ok is False
        assert result == "S3 bucket not configured."

    def test_existing_s3_object_returns_deterministic_public_url(self, app, monkeypatch):
        body = b"same image"
        digest = hashlib.sha256(body).hexdigest()
        fake_client = FakeS3Client()
        app.config["S3_BUCKET_NAME"] = "bucket"
        app.config["S3_PUBLIC_BASE_URL"] = "https://cdn.example.com/assets/"
        monkeypatch.setattr("app.s3.build_s3_client", lambda: fake_client)

        with app.app_context():
            ok, result = upload_file(_file_storage(body=body))

        assert ok is True
        assert result == f"https://cdn.example.com/assets/products/{digest}.jpg"
        assert fake_client.uploaded == []

    def test_non_404_head_failure_returns_error_without_uploading(self, app, monkeypatch):
        fake_client = FakeS3Client(head_error=_client_error("403"))
        app.config["S3_BUCKET_NAME"] = "bucket"
        monkeypatch.setattr("app.s3.build_s3_client", lambda: fake_client)

        with app.app_context():
            ok, result = upload_file(_file_storage())

        assert ok is False
        assert "S3 check failed" in result
        assert fake_client.uploaded == []

    def test_upload_failure_returns_error(self, app, monkeypatch):
        fake_client = FakeS3Client(
            head_error=_client_error("404"),
            upload_error=_client_error("500"),
        )
        app.config["S3_BUCKET_NAME"] = "bucket"
        monkeypatch.setattr("app.s3.build_s3_client", lambda: fake_client)

        with app.app_context():
            ok, result = upload_file(_file_storage())

        assert ok is False
        assert "S3 upload failed" in result

    def test_new_upload_uses_bucket_region_url_when_no_public_base_url(self, app, monkeypatch):
        body = b"new image"
        digest = hashlib.sha256(body).hexdigest()
        fake_client = FakeS3Client(head_error=_client_error("404"))
        app.config["S3_BUCKET_NAME"] = "bucket"
        app.config["AWS_REGION"] = "eu-north-1"
        app.config["S3_PUBLIC_BASE_URL"] = None
        monkeypatch.setattr("app.s3.build_s3_client", lambda: fake_client)

        with app.app_context():
            ok, result = upload_file(_file_storage(body=body))

        assert ok is True
        assert result == f"https://bucket.s3.eu-north-1.amazonaws.com/products/{digest}.jpg"
        assert fake_client.uploaded == [
            ("bucket", f"products/{digest}.jpg", {"ContentType": "image/jpeg"})
        ]
