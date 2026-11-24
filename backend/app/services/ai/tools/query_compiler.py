from app.db.enums import InvoiceStatus
from datetime import date
from typing import Any

from sqlalchemy import func, select, and_

from app.db.models.invoice import Invoice
from app.db.models.invoice_item import InvoiceItem

from app.services.ai.tools.query_schema import InvoiceQueryPlan
from app.services.ai.tools.semantic_registry import (
    METRICS,
    DIMENSIONS,
    FILTER_FIELDS,
)


class QueryCompilationError(ValueError):
    """Raised when a validated query cannot be safely compiled."""


# ============================================================
# COLUMN REGISTRY
# ============================================================

COLUMN_MAP = {
    "invoice": {
        "id": Invoice.id,
        "invoice_number": Invoice.invoice_number,
        "invoice_date": Invoice.invoice_date,
        "customer_name": Invoice.customer_name,
        "customer_phone": Invoice.customer_phone,
        "total_amount": Invoice.total_amount,
        "status": Invoice.status,
        "currency": Invoice.currency,
    },
    "invoice_item": {
        "id": InvoiceItem.id,
        "product_name": InvoiceItem.product_name,
        "quantity": InvoiceItem.quantity,
        "unit_price": InvoiceItem.unit_price,
        "total_price": InvoiceItem.total_price,
    },
}


# ============================================================
# METRIC COMPILATION
# ============================================================

def compile_metric(metric_name: str):
    config = METRICS[metric_name]

    entity = config["entity"]
    field = config["field"]
    aggregation = config["aggregation"]

    column = COLUMN_MAP[entity][field]

    if aggregation == "sum":
        expression = func.sum(column)

    elif aggregation == "avg":
        expression = func.avg(column)

    elif aggregation == "count_distinct":
        expression = func.count(column.distinct())

    else:
        raise QueryCompilationError(
            f"Unsupported aggregation: {aggregation}"
        )

    return expression.label(metric_name)


# ============================================================
# DIMENSION COMPILATION
# ============================================================

def compile_dimension(dimension_name: str):
    config = DIMENSIONS[dimension_name]

    entity = config["entity"]
    field = config["field"]

    column = COLUMN_MAP[entity][field]

    if config["type"] == "month":
        return func.date_trunc("month", column).label(dimension_name)

    return column.label(dimension_name)


# ============================================================
# FILTER COMPILATION
# ============================================================

def compile_filter(query_filter):
    config = FILTER_FIELDS[query_filter.field]

    entity = config["entity"]
    field = config["field"]

    column = COLUMN_MAP[entity][field]

    operator = query_filter.operator
    value = query_filter.value

    if operator == "eq":
        return column == value

    if operator == "neq":
        return column != value

    if operator == "gt":
        return column > value

    if operator == "gte":
        return column >= value

    if operator == "lt":
        return column < value

    if operator == "lte":
        return column <= value

    if operator == "contains":
        return column.ilike(f"%{value}%")

    if operator == "in":
        return column.in_(value)

    if operator == "between":
        start, end = value

        if config["type"] == "date":
            start = date.fromisoformat(start)
            end = date.fromisoformat(end)

        return column.between(start, end)

    raise QueryCompilationError(
        f"Unsupported filter operator: {operator}"
    )


# ============================================================
# QUERY COMPILATION
# ============================================================

def compile_invoice_query(
    plan: InvoiceQueryPlan,
    user_id: str,
):
    """
    Compile a validated InvoiceQueryPlan into a SQLAlchemy SELECT query.

    The query is always restricted to the authenticated user's invoices.
    """

    # --------------------------------------------------------
    # Determine whether invoice_items table is required
    # --------------------------------------------------------

    required_entities = set()

    for metric in plan.metrics:
        required_entities.add(METRICS[metric]["entity"])

    for dimension in plan.dimensions:
        required_entities.add(DIMENSIONS[dimension]["entity"])

    for query_filter in plan.filters:
        required_entities.add(
            FILTER_FIELDS[query_filter.field]["entity"]
        )

    requires_items = "invoice_item" in required_entities

    # --------------------------------------------------------
    # Prevent incorrect aggregation across different grains
    # --------------------------------------------------------

    has_invoice_metrics = any(
        METRICS[metric]["entity"] == "invoice"
        and METRICS[metric]["aggregation"] != "count_distinct"
        for metric in plan.metrics
    )

    has_item_dimensions = any(
        DIMENSIONS[dimension]["entity"] == "invoice_item"
        for dimension in plan.dimensions
    )

    if has_invoice_metrics and has_item_dimensions:
        raise QueryCompilationError(
            "Invoice-level aggregate metrics cannot be grouped "
            "by item-level dimensions because joining invoice items "
            "would duplicate invoice values."
        )

    # --------------------------------------------------------
    # Build SELECT
    # --------------------------------------------------------

    selected_columns = []

    for metric in plan.metrics:
        selected_columns.append(
            compile_metric(metric)
        )

    for dimension in plan.dimensions:
        selected_columns.append(
            compile_dimension(dimension)
        )

    query = select(*selected_columns)

    # --------------------------------------------------------
    # Join invoice_items when required
    # --------------------------------------------------------

    if requires_items:
        query = query.join(
            InvoiceItem,
            InvoiceItem.invoice_id == Invoice.id,
        )

    # --------------------------------------------------------
    # User isolation
    # --------------------------------------------------------

    query = query.where(
        Invoice.user_id == user_id
    )

    # --------------------------------------------------------
    # Confirmed invoices for financial metrics
    # --------------------------------------------------------

    requires_confirmed = any(
        METRICS[metric]["requires_confirmed"]
        for metric in plan.metrics
    )

    if requires_confirmed:
        query = query.where(
            Invoice.status == InvoiceStatus.CONFIRMED
        )

    # --------------------------------------------------------
    # Filters
    # --------------------------------------------------------

    filter_conditions = [
        compile_filter(query_filter)
        for query_filter in plan.filters
    ]

    if filter_conditions:
        query = query.where(
            and_(*filter_conditions)
        )

    # --------------------------------------------------------
    # GROUP BY
    # --------------------------------------------------------

    if plan.dimensions:
        group_by_columns = [
            compile_dimension(dimension)
            for dimension in plan.dimensions
        ]

        query = query.group_by(*group_by_columns)

    # --------------------------------------------------------
    # ORDER BY
    # --------------------------------------------------------

    for sort_rule in plan.sort:
        if sort_rule.field in METRICS:
            sort_expression = compile_metric(sort_rule.field)

        elif sort_rule.field in DIMENSIONS:
            sort_expression = compile_dimension(sort_rule.field)

        else:
            raise QueryCompilationError(
                f"Invalid sort field: {sort_rule.field}"
            )

        if sort_rule.direction == "desc":
            query = query.order_by(sort_expression.desc())
        else:
            query = query.order_by(sort_expression.asc())

    # --------------------------------------------------------
    # LIMIT
    # --------------------------------------------------------

    query = query.limit(plan.limit)

    return query