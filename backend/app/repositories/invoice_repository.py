from decimal import Decimal
from app.db.enums import InvoiceStatus
from datetime import date
from uuid import UUID

from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.invoice import Invoice
from app.db.models.invoice_item import InvoiceItem


class InvoiceRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def create(
        self,
        *,
        user_id: UUID,
        invoice_data: dict,
        items_data: list[dict],
    ) -> Invoice:
        invoice = Invoice(
            user_id=user_id,
            **invoice_data,
        )

        self.db.add(invoice)
        await self.db.flush()

        for item_data in items_data:
            item = InvoiceItem(
                invoice_id=invoice.id,
                **item_data,
            )
            self.db.add(item)

        await self.db.flush()

        result = await self.db.execute(
            select(Invoice)
            .options(selectinload(Invoice.items))
            .where(Invoice.id == invoice.id)
        )

        return result.scalar_one()



    async def get_by_id(
        self,
        invoice_id,
        user_id,
    ):
        statement = (
            select(Invoice)
            .where(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id,
            )
            .options(selectinload(Invoice.items))
            .execution_options(populate_existing=True)
        )

        result = await self.db.execute(statement)
        return result.scalar_one_or_none()

    
    async def get_all_for_user(
        self,
        user_id: UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        status: InvoiceStatus | None = None,
        customer_name: str | None = None,
        search: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        min_amount: Decimal | None = None,
        max_amount: Decimal | None = None,
    ) -> tuple[list[Invoice], int]:
        conditions = [Invoice.user_id == user_id]

        if status is not None:
            conditions.append(Invoice.status == status)

        if customer_name and customer_name.strip():
            conditions.append(
                Invoice.customer_name.ilike(
                    f"%{customer_name.strip()}%"
                )
            )

        if search and search.strip():
            pattern = f"%{search.strip()}%"
            conditions.append(
                or_(
                    Invoice.customer_name.ilike(pattern),
                    Invoice.invoice_number.ilike(pattern),
                    cast(Invoice.id, String).ilike(pattern),
                )
            )

        if date_from is not None:
            conditions.append(Invoice.invoice_date >= date_from)

        if date_to is not None:
            conditions.append(Invoice.invoice_date <= date_to)

        if min_amount is not None:
            conditions.append(Invoice.total_amount >= min_amount)

        if max_amount is not None:
            conditions.append(Invoice.total_amount <= max_amount)

        offset = (page - 1) * page_size

        count_result = await self.db.execute(
            select(func.count())
            .select_from(Invoice)
            .where(*conditions)
        )
        total = count_result.scalar_one()

        result = await self.db.execute(
            select(Invoice)
            .options(selectinload(Invoice.items))
            .where(*conditions)
            .order_by(
                Invoice.invoice_date.desc(),
                Invoice.created_at.desc(),
            )
            .offset(offset)
            .limit(page_size)
        )

        invoices = list(result.scalars().all())

        return invoices, total


    async def update(
        self,
        invoice: Invoice,
        update_data: dict,
    ) -> Invoice:

        for field, value in update_data.items():
            setattr(invoice, field, value)

        await self.db.flush()
        await self.db.refresh(invoice)

        return invoice


    async def delete(
        self,
        invoice: Invoice,
    ) -> None:

        await self.db.delete(invoice)
        await self.db.flush()


    async def get_revenue(
        self,
        user_id: UUID,
        *,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> dict:
        conditions = [
            Invoice.user_id == user_id,
            Invoice.status == InvoiceStatus.CONFIRMED,
        ]

        if start_date is not None:
            conditions.append(Invoice.invoice_date >= start_date)

        if end_date is not None:
            conditions.append(Invoice.invoice_date <= end_date)

        query = select(
            func.coalesce(
                func.sum(Invoice.total_amount),
                0,
            ).label("total_revenue"),
            func.count(Invoice.id).label("invoice_count"),
            func.coalesce(
                func.avg(Invoice.total_amount),
                0,
            ).label("average_invoice_value"),
        ).where(*conditions)

        result = await self.db.execute(query)
        row = result.one()

        return {
            "total_revenue": row.total_revenue,
            "invoice_count": row.invoice_count,
            "average_invoice_value": row.average_invoice_value,
        }

    
    async def get_daily_revenue(
        self,
        user_id: UUID,
        *,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> list[dict]:
        conditions = [
            Invoice.user_id == user_id,
            Invoice.status == InvoiceStatus.CONFIRMED,
        ]

        if start_date is not None:
            conditions.append(Invoice.invoice_date >= start_date)

        if end_date is not None:
            conditions.append(Invoice.invoice_date <= end_date)

        query = (
            select(
                Invoice.invoice_date.label("date"),
                func.sum(Invoice.total_amount).label("revenue"),
            )
            .where(*conditions)
            .group_by(Invoice.invoice_date)
            .order_by(Invoice.invoice_date.asc())
        )

        result = await self.db.execute(query)

        return [
            {
                "date": row.date,
                "revenue": row.revenue,
            }
            for row in result.all()
        ]

        
    async def get_by_id_for_update(
        self,
        invoice_id,
        user_id,
    ) -> Invoice | None:
        statement = (
            select(Invoice)
            .where(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id,
            )
            .options(selectinload(Invoice.items))
            .with_for_update()
        )

        result = await self.db.execute(statement)
        return result.scalar_one_or_none()

    async def recalculate_subtotal(
        self,
        invoice: Invoice,
    ) -> None:
        result = await self.db.execute(
            select(
                func.coalesce(
                    func.sum(InvoiceItem.total_price),
                    0,
                )
            ).where(
                InvoiceItem.invoice_id == invoice.id
            )
        )

        invoice.subtotal = result.scalar_one()
        tax = invoice.tax if invoice.tax is not None else Decimal("0.00")
        discount = (
            invoice.discount
            if invoice.discount is not None
            else Decimal("0.00")
        )
        invoice.total_amount = invoice.subtotal + tax - discount

        await self.db.flush()


    async def find_by_image_hash(
        self,
        user_id: UUID,
        image_hash: str,
    ) -> Invoice | None:

        stmt = (
            select(Invoice)
            .where(
                Invoice.user_id == user_id,
                Invoice.image_hash == image_hash,
                Invoice.status != InvoiceStatus.CANCELLED,
            )
            .limit(1)
        )

        result = await self.db.execute(stmt)

        return result.scalar_one_or_none()

    async def find_by_invoice_number(
        self,
        user_id: UUID,
        invoice_number: str,
    ) -> Invoice | None:

        normalized_number = invoice_number.strip().lower()

        stmt = (
            select(Invoice)
            .where(
                Invoice.user_id == user_id,
                Invoice.invoice_number.is_not(None),
                Invoice.status != InvoiceStatus.CANCELLED,
            )
        )

        result = await self.db.execute(stmt)

        invoices = result.scalars().all()

        for invoice in invoices:
            existing_number = invoice.invoice_number

            if (
                existing_number
                and existing_number.strip().lower()
                == normalized_number
            ):
                return invoice

        return None