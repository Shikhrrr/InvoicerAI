from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.invoice import InvoiceResponse


class ExtractionReviewResponse(BaseModel):
    id: UUID
    raw_json: dict
    model_name: str | None
    prompt_version: str | None
    confidence_score: float | None
    quality_score: int | None
    validation_results: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceReviewResponse(BaseModel):
    invoice: InvoiceResponse
    extraction: ExtractionReviewResponse | None


class InvoiceReviewUpdate(BaseModel):
    invoice_number: str | None = None
    invoice_date: date | None = None
    customer_name: str | None = None
    customer_phone: str | None = None

    subtotal: Decimal | None = Field(default=None, ge=0)
    tax: Decimal | None = Field(default=None, ge=0)
    discount: Decimal | None = Field(default=None, ge=0)
    total_amount: Decimal | None = Field(default=None, ge=0)


class InvoiceItemReviewCreate(BaseModel):
    product_name: str = Field(min_length=1, max_length=255)
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    total_price: Decimal = Field(ge=0)


class InvoiceItemReviewUpdate(BaseModel):
    product_name: str | None = Field(default=None, min_length=1, max_length=255)
    quantity: Decimal | None = Field(default=None, gt=0)
    unit_price: Decimal | None = Field(default=None, ge=0)
    total_price: Decimal | None = Field(default=None, ge=0)