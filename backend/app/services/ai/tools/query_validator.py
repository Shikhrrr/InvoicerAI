from datetime import date
from typing import Any

from app.services.ai.tools.query_schema import InvoiceQueryPlan
from app.services.ai.tools.semantic_registry import (
    METRICS,
    DIMENSIONS,
    FILTER_FIELDS,
)


class QueryValidationError(ValueError):
    """Raised when an AI-generated query plan is invalid."""


def validate_query_plan(plan: InvoiceQueryPlan) -> InvoiceQueryPlan:
    """
    Validate an invoice query plan against the semantic registry.

    Returns the validated plan.
    Raises QueryValidationError if any component is unsupported.
    """

    # --------------------------------------------------------
    # 1. Validate metrics
    # --------------------------------------------------------

    if not plan.metrics:
        raise QueryValidationError("At least one metric is required.")

    for metric in plan.metrics:
        if metric not in METRICS:
            raise QueryValidationError(
                f"Unsupported metric: '{metric}'. "
                f"Available metrics: {list(METRICS.keys())}"
            )

    # --------------------------------------------------------
    # 2. Validate dimensions
    # --------------------------------------------------------

    for dimension in plan.dimensions:
        if dimension not in DIMENSIONS:
            raise QueryValidationError(
                f"Unsupported dimension: '{dimension}'. "
                f"Available dimensions: {list(DIMENSIONS.keys())}"
            )

    # --------------------------------------------------------
    # 3. Validate filters
    # --------------------------------------------------------

    for query_filter in plan.filters:
        field_name = query_filter.field

        if field_name not in FILTER_FIELDS:
            raise QueryValidationError(
                f"Unsupported filter field: '{field_name}'."
            )

        field_config = FILTER_FIELDS[field_name]

        operator = query_filter.operator

        if operator not in field_config["operators"]:
            raise QueryValidationError(
                f"Operator '{operator}' is not allowed for "
                f"field '{field_name}'."
            )

        _validate_filter_value(
            field_name=field_name,
            field_type=field_config["type"],
            operator=operator,
            value=query_filter.value,
        )

    # --------------------------------------------------------
    # 4. Validate sorting
    # --------------------------------------------------------

    allowed_sort_fields = set(METRICS.keys()) | set(DIMENSIONS.keys())

    for sort_rule in plan.sort:
        if sort_rule.field not in allowed_sort_fields:
            raise QueryValidationError(
                f"Unsupported sort field: '{sort_rule.field}'."
            )

    # --------------------------------------------------------
    # 5. Validate limit
    # --------------------------------------------------------

    if not 1 <= plan.limit <= 500:
        raise QueryValidationError(
            "Query limit must be between 1 and 500."
        )

    return plan


# ============================================================
# FILTER VALUE VALIDATION
# ============================================================

def _validate_filter_value(
    field_name: str,
    field_type: str,
    operator: str,
    value: Any,
) -> None:

    if value is None:
        raise QueryValidationError(
            f"Filter value for '{field_name}' cannot be null."
        )

    # --------------------------------------------------------
    # BETWEEN
    # --------------------------------------------------------

    if operator == "between":
        if not isinstance(value, list) or len(value) != 2:
            raise QueryValidationError(
                f"'between' requires exactly two values for '{field_name}'."
            )

        _validate_single_value(field_name, field_type, value[0])
        _validate_single_value(field_name, field_type, value[1])

        if field_type in {"number", "date"}:
            if value[0] > value[1]:
                raise QueryValidationError(
                    f"Invalid range for '{field_name}': "
                    "start value must not exceed end value."
                )

        return

    # --------------------------------------------------------
    # IN
    # --------------------------------------------------------

    if operator == "in":
        if not isinstance(value, list) or not value:
            raise QueryValidationError(
                f"'in' requires a non-empty list for '{field_name}'."
            )

        if len(value) > 100:
            raise QueryValidationError(
                f"'in' filter for '{field_name}' cannot contain "
                "more than 100 values."
            )

        for item in value:
            _validate_single_value(field_name, field_type, item)

        return

    # --------------------------------------------------------
    # Regular operators
    # --------------------------------------------------------

    _validate_single_value(field_name, field_type, value)


def _validate_single_value(
    field_name: str,
    field_type: str,
    value: Any,
) -> None:

    if value is None:
        raise QueryValidationError(
            f"Value for '{field_name}' cannot be null."
        )

    # STRING
    if field_type == "string":
        if not isinstance(value, str):
            raise QueryValidationError(
                f"'{field_name}' requires a string value."
            )

        if len(value) > 500:
            raise QueryValidationError(
                f"Value for '{field_name}' is too long."
            )

        return

    # NUMBER
    if field_type == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise QueryValidationError(
                f"'{field_name}' requires a numeric value."
            )

        return

    # DATE
    if field_type == "date":
        if not isinstance(value, str):
            raise QueryValidationError(
                f"'{field_name}' requires a date string."
            )

        try:
            date.fromisoformat(value)
        except ValueError:
            raise QueryValidationError(
                f"Invalid date '{value}'. Expected YYYY-MM-DD."
            )

        return

    # ENUM
    if field_type == "enum":
        if not isinstance(value, str):
            raise QueryValidationError(
                f"'{field_name}' requires a string value."
            )

        return