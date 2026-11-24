from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class InvoiceItemCreate(BaseModel):
    product_name: str = Field(min_length=1, max_length=255)
    quantity: Decimal = Field(gt=0, max_digits=12, decimal_places=3)
    unit_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    total_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class InvoiceItemUpdate(BaseModel):
    product_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )
    quantity: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=12,
        decimal_places=3,
    )
    unit_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    total_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )


class InvoiceItemResponse(BaseModel):
    id: UUID
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal

    model_config = {"from_attributes": True}