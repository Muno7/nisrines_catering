class AppError(Exception):
    """Base class for all application-level errors."""


class ValidationError(AppError):
    """Raised when input data fails a business rule or constraint."""


class ConflictError(AppError):
    """Raised when a resource already exists and a duplicate is not allowed."""


class NotFoundError(AppError):
    """Raised when a requested resource does not exist."""

# Not nesseccary for now since we only use API get requests
#  so no need for status codes, raising exceptions is enough
#  and we handle different ones based on the route