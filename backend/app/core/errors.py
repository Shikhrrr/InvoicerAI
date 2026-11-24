
class InvoicerAIError(Exception):
    """Base exception for application-specific errors."""


class IdempotencyConflictError(InvoicerAIError):
    """Raised when an idempotency key is reused with a different request."""


class ResourceNotFoundError(InvoicerAIError):
    """Raised when a requested resource does not exist or is not accessible."""


class InvalidInvoiceDataError(InvoicerAIError):
    """Raised when invoice data fails business validation."""


class AuthenticationError(InvoicerAIError):
    """Raised when authentication fails."""


class AuthorizationError(InvoicerAIError):
    """Raised when a user is not permitted to perform an action."""
