from typing import Optional
from uuid import UUID

from langchain.tools import tool, ToolRuntime
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.services.ai.context import InvoiceAgentContext
from app.db.models.invoice import Invoice


@tool
async def get_invoice_details(
    invoice_id: Optional[str] = None,
    invoice_number: Optional[str] = None,
    runtime: ToolRuntime[InvoiceAgentContext] = None,
) -> dict:
    """
    Retrieve the complete details of a specific invoice.

    Use this tool when the user wants detailed information about
    a particular invoice, including its items, quantities, prices,
    customer details, totals, and status.

    Identify the invoice using either its UUID or invoice number.
    """

    if not invoice_id and not invoice_number:
        return {
            "success": False,
            "error": "Missing identifier",
            "message": "Provide either an invoice ID or invoice number.",
        }

    context = runtime.context

    async with context.session_factory() as session:

        statement = (
            select(Invoice)
            .where(Invoice.user_id == context.user_id)
            .options(selectinload(Invoice.items))
        )

        # ----------------------------------------------------
        # Search by UUID
        # ----------------------------------------------------

        if invoice_id:
            try:
                parsed_invoice_id = UUID(invoice_id)
            except ValueError:
                return {
                    "success": False,
                    "error": "Invalid invoice ID",
                    "message": "The provided invoice ID is not a valid UUID.",
                }

            statement = statement.where(
                Invoice.id == parsed_invoice_id
            )

        # ----------------------------------------------------
        # Search by invoice number
        # ----------------------------------------------------

        elif invoice_number:
            statement = statement.where(
                Invoice.invoice_number == invoice_number
            )

        result = await session.execute(statement)

        invoice = result.scalar_one_or_none()

        # ----------------------------------------------------
        # Invoice not found
        # ----------------------------------------------------

        if invoice is None:
            return {
                "success": False,
                "error": "Invoice not found",
                "message": "No matching invoice was found for this user.",
            }

        # ----------------------------------------------------
        # Serialize invoice
        # ----------------------------------------------------

        return {
            "success": True,
            "invoice": {
                "id": str(invoice.id),
                "invoice_number": invoice.invoice_number,
                "invoice_date": (
                    invoice.invoice_date.isoformat()
                    if invoice.invoice_date
                    else None
                ),
                "customer_name": invoice.customer_name,
                "customer_phone": invoice.customer_phone,
                "subtotal": str(invoice.subtotal),
                "tax": str(invoice.tax),
                "discount": str(invoice.discount),
                "total_amount": str(invoice.total_amount),
                "currency": (
                    invoice.currency.value
                    if hasattr(invoice.currency, "value")
                    else invoice.currency
                ),
                "status": (
                    invoice.status.value
                    if hasattr(invoice.status, "value")
                    else invoice.status
                ),
                "items": [
                    {
                        "id": str(item.id),
                        "product_name": item.product_name,
                        "quantity": item.quantity,
                        "unit_price": str(item.unit_price),
                        "total_price": str(item.total_price),
                    }
                    for item in invoice.items
                ],
            },
        }