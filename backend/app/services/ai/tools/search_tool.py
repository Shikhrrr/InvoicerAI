from typing import Optional

from langchain.tools import tool, ToolRuntime
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.services.ai.context import InvoiceAgentContext
from app.db.models.invoice import Invoice


@tool
async def search_invoices(
    query: Optional[str] = None,
    customer_name: Optional[str] = None,
    invoice_number: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 10,
    runtime: ToolRuntime[InvoiceAgentContext] = None,
) -> dict:
    """
    Search the authenticated user's invoices.

    Use this tool to find invoices by customer name, invoice number,
    text query, or invoice status.

    Examples:
    - Find invoices for Rahul
    - Search invoice INV-1002
    - Show my draft invoices

    Returns matching invoices with their line items.
    """

    context = runtime.context

    # Enforce a reasonable limit
    limit = max(1, min(limit, 50))

    async with context.session_factory() as session:

        statement = (
            select(Invoice)
            .where(Invoice.user_id == context.user_id)
            .options(selectinload(Invoice.items))
        )

        # General text search
        if query:
            search_pattern = f"%{query}%"

            statement = statement.where(
                or_(
                    Invoice.invoice_number.ilike(search_pattern),
                    Invoice.customer_name.ilike(search_pattern),
                    Invoice.customer_phone.ilike(search_pattern),
                )
            )

        # Customer name
        if customer_name:
            statement = statement.where(
                Invoice.customer_name.ilike(
                    f"%{customer_name}%"
                )
            )

        # Invoice number
        if invoice_number:
            statement = statement.where(
                Invoice.invoice_number.ilike(
                    f"%{invoice_number}%"
                )
            )

        # Status
        if status:
            statement = statement.where(
                Invoice.status == status
            )

        statement = (
            statement
            .order_by(Invoice.created_at.desc())
            .limit(limit)
        )

        result = await session.execute(statement)

        invoices = result.scalars().all()

        # Serialize the results
        invoice_results = []

        for invoice in invoices:
            invoice_results.append(
                {
                    "id": str(invoice.id),
                    "invoice_number": invoice.invoice_number,
                    "invoice_date": (
                        invoice.invoice_date.isoformat()
                        if invoice.invoice_date
                        else None
                    ),
                    "customer_name": invoice.customer_name,
                    "customer_phone": invoice.customer_phone,
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
                            "product_name": item.product_name,
                            "quantity": item.quantity,
                            "unit_price": str(item.unit_price),
                            "total_price": str(item.total_price),
                        }
                        for item in invoice.items
                    ],
                }
            )

        return {
            "success": True,
            "count": len(invoice_results),
            "invoices": invoice_results,
        }