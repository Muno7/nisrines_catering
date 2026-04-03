from ..exceptions import ValidationError


class ImageService:

    @staticmethod
    def upload(file_storage) -> str:
        """Validate and upload an image to S3.

        Raises:
            ValidationError: if the file type is invalid or file is too large.
            RuntimeError: if the S3 upload fails.

        Returns:
            The public URL of the uploaded image.
        """
        from ..s3 import upload_file  # local import to avoid circular dependency at module level

        ok, result = upload_file(file_storage)
        if not ok:
            # s3.upload_file returns (False, error_message) for validation AND upload failures
            # treat all failures as ValidationError so routes can catch them uniformly
            raise ValidationError(result)
        return result
