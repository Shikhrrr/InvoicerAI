from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.db.models.invoice import Currency, InvoiceStatus
from app.schemas.invoice_item import (
    InvoiceItemCreate,
    InvoiceItemResponse,
)


class InvoiceCreate(BaseModel):
    invoice_number: str | None = Field(
        default=None,
        max_length=100,
    )
    invoice_date: date
    customer_name: str | None = Field(
        default=None,
        max_length=255,
    )
    customer_phone: str | None = Field(
        default=None,
        max_length=30,
    )

    subtotal: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    tax: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    discount: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    total_amount: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    currency: Currency = Currency.INR

    items: list[InvoiceItemCreate] = Field(
        default_factory=list
    )


class InvoiceUpdate(BaseModel):
    invoice_number: str | None = Field(
        default=None,
        max_length=100,
    )
    invoice_date: date | None = None
    customer_name: str | None = Field(
        default=None,
        max_length=255,
    )
    customer_phone: str | None = Field(
        default=None,
        max_length=30,
    )

    subtotal: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    tax: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    discount: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    total_amount: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    currency: Currency | None = None
    status: InvoiceStatus | None = None


class InvoiceResponse(BaseModel):
    id: UUID
    user_id: UUID

    invoice_number: str | None
    invoice_date: date | None
    customer_name: str | None
    customer_phone: str | None

    subtotal: Decimal | None
    tax: Decimal | None
    discount: Decimal | None
    total_amount: Decimal | None

    currency: Currency | None
    status: InvoiceStatus | None

    image_url: str | None

    image_file_id: str | None = None

    created_at: datetime
    updated_at: datetime

    items: list[InvoiceItemResponse]

    model_config = {"from_attributes": True}

    is_duplicate: bool
    duplicate_of_invoice_id: UUID | None


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int
    page: int
    page_size: int
    pages: int