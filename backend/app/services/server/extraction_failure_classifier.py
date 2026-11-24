
from dataclasses import dataclass


@dataclass
class FailureClassification:
    category: str
    retryable: bool
    message: str


class ExtractionFailureClassifier:

    TRANSIENT_KEYWORDS = (
        "timeout",
        "timed out",
        "rate limit",
        "429",
        "503",
        "502",
        "504",
        "temporarily unavailable",
        "connection reset",
        "connection error",
        "network error",
        "server error",
    )

    PERMANENT_KEYWORDS = (
        "invalid api key",
        "authentication failed",
        "unauthorized",
        "permission denied",
        "invalid image",
        "unsupported image",
        "image format",
        "invoice not found",
        "ai task not found",
    )

    # Exception class names (lowercased) that indicate a schema/validation
    # problem. These are permanent — retrying will produce the same bad output.
    SCHEMA_ERROR_CLASS_NAMES = (
        "groqschemavalidationerror",
        "geminischemavalidationerror",
    )

    def classify(
        self,
        exception: Exception,
    ) -> FailureClassification:

        error_message = str(exception).lower()
        exception_name = type(exception).__name__.lower()

        # Schema validation failures are permanent — the model produced a
        # structurally wrong response; retrying with the same prompt and image
        # would very likely fail again.
        if exception_name in self.SCHEMA_ERROR_CLASS_NAMES:
            return FailureClassification(
                category="SCHEMA_VALIDATION",
                retryable=False,
                message=str(exception),
            )

        # Permanent/configuration failures
        if any(
            keyword in error_message
            for keyword in self.PERMANENT_KEYWORDS
        ):
            return FailureClassification(
                category="PERMANENT",
                retryable=False,
                message=str(exception),
            )

        # Transient failures
        if any(
            keyword in error_message
            for keyword in self.TRANSIENT_KEYWORDS
        ):
            return FailureClassification(
                category="TRANSIENT",
                retryable=True,
                message=str(exception),
            )

        # Common exception types associated with temporary failures
        transient_exception_names = (
            "timeout",
            "connection",
            "ratelimit",
            "serviceunavailable",
            "internalserver",
        )

        if any(
            keyword in exception_name
            for keyword in transient_exception_names
        ):
            return FailureClassification(
                category="TRANSIENT",
                retryable=True,
                message=str(exception),
            )

        return FailureClassification(
            category="UNKNOWN",
            retryable=False,
            message=str(exception),
        )
