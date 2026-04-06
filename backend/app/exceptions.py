class AppError(Exception):
    """Base class for all application-level errors."""
    status_code = 400

    def __init__(self, message: str, *, status_code: int | None = None):
        super().__init__(message)
        if status_code is not None:
            self.status_code = status_code


class ValidationError(AppError):
    status_code = 400


class ConflictError(AppError):
    status_code = 409


class NotFoundError(AppError):
    status_code = 404