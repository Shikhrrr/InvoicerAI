from datetime import date
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.db.enums import Currency


class ExtractedInvoiceItem(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    product_name: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal


class ExtractedInvoice(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    invoice_number: str | None = None
    invoice_date: date | None = None
    customer_name: str | None = None
    customer_phone: str | None = None

    subtotal: Decimal | None = None
    tax: Decimal | None = None
    discount: Decimal | None = None
    total_amount: Decimal | None = None

    # Bug fix: was `Currency = Currency.INR | None` (TypeError at class definition).
    # Correct annotation: type is `Currency | None`, default value is `Currency.INR`.
    currency: Currency | None = Currency.INR

    items: list[ExtractedInvoiceItem] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Provider-compatible JSON Schema
# ---------------------------------------------------------------------------
# Pydantic's model_json_schema() generates a schema that is correct per the
# JSON Schema spec but has two compatibility problems with LLM provider APIs:
#
#   1. Decimal fields are rendered as anyOf[{number}, {string+pattern}].
#      Gemini's response_json_schema does not support anyOf and rejects the
#      schema entirely.
#
#   2. Nested models are placed in $defs and referenced via $ref.
#      Gemini's response_json_schema does not resolve $ref; every object must
#      be fully inline.
#
# This helper produces a hand-written, fully-inlined schema that is accepted
# by both Groq (json_schema mode) and Gemini (response_json_schema mode).
# Decimal/numeric fields are typed as "number" only — both providers return
# plain numbers which Pydantic correctly coerces to Decimal on validation.
# ---------------------------------------------------------------------------

def _nullable_number() -> dict[str, Any]:
    """JSON Schema for an optional Decimal field (number or null)."""
    return {"type": ["number", "null"]}


def _nullable_string() -> dict[str, Any]:
    """JSON Schema for an optional string field (string or null)."""
    return {"type": ["string", "null"]}


def build_provider_schema() -> dict[str, Any]:
    """
    Return a fully-inlined, provider-compatible JSON Schema for
    ExtractedInvoice. This schema is safe for both Groq structured output
    and Gemini response_json_schema.
    """
    item_schema: dict[str, Any] = {
        "type": "object",
        "properties": {
            "product_name": {"type": "string"},
            "quantity": {"type": "number"},
            "unit_price": {"type": "number"},
            "total_price": {"type": "number"},
        },
        "required": ["product_name", "quantity", "unit_price", "total_price"],
        # Do not set additionalProperties:false here — some providers add
        # internal fields; Pydantic will reject them via extra="forbid" only
        # after we control the parsed object ourselves.
    }

    return {
        "type": "object",
        "properties": {
            "invoice_number": _nullable_string(),
            "invoice_date": {
                "anyOf": [
                    {"type": "string", "format": "date"},
                    {"type": "null"},
                ],
            },
            "customer_name": _nullable_string(),
            "customer_phone": _nullable_string(),
            "subtotal": _nullable_number(),
            "tax": _nullable_number(),
            "discount": _nullable_number(),
            "total_amount": _nullable_number(),
            "currency": {
                "anyOf": [
                    {
                        "type": "string",
                        "enum": [c.value for c in Currency],
                    },
                    {"type": "null"},
                ],
            },
            "items": {
                "type": "array",
                "items": item_schema,
            },
        },
        "required": [
            "invoice_number",
            "invoice_date",
            "customer_name",
            "customer_phone",
            "subtotal",
            "tax",
            "discount",
            "total_amount",
            "currency",
            "items",
        ],
    }