
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class RevenueSummaryResponse(BaseModel):
    total_revenue: Decimal = Field(ge=0)
    invoice_count: int = Field(ge=0)
    average_invoice_value: Decimal = Field(ge=0)


class DailyRevenueItem(BaseModel):
    date: date
    revenue: Decimal = Field(ge=0)


class DailyRevenueResponse(BaseModel):
    items: list[DailyRevenueItem]
