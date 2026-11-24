from typing import Any, Literal

from pydantic import BaseModel, Field


class QueryFilter(BaseModel):
    field: str = Field(
        description="Field to filter on, such as customer, product, invoice_date, or revenue."
    )

    operator: Literal[
        "eq",
        "neq",
        "gt",
        "gte",
        "lt",
        "lte",
        "contains",
        "in",
        "between",
    ] = Field(
        description="Comparison operator."
    )

    value: Any = Field(
        description="Value used for filtering."
    )


class SortRule(BaseModel):
    field: str = Field(
        description="Metric or dimension to sort by."
    )

    direction: Literal["asc", "desc"] = Field(
        default="desc",
        description="Sort direction."
    )


class InvoiceQueryPlan(BaseModel):
    metrics: list[str] = Field(
        description=(
            "Metrics to calculate, such as revenue, invoice_count, "
            "average_invoice_value, quantity_sold."
        ),
        min_length=1,
    )

    dimensions: list[str] = Field(
        default_factory=list,
        description=(
            "Dimensions to group results by, such as customer, "
            "product, month, or status."
        ),
    )

    filters: list[QueryFilter] = Field(
        default_factory=list,
        description="Filters to apply to the data.",
    )

    sort: list[SortRule] = Field(
        default_factory=list,
        description="Sorting rules for the returned results.",
    )

    limit: int = Field(
        default=100,
        ge=1,
        le=500,
        description="Maximum number of result rows.",
    )