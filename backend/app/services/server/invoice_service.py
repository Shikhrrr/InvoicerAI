from app.db.enums import InvoiceStatus
from app.db.models import InvoiceItem
from app.schemas import InvoiceItemCreate
from app.schemas import InvoiceItemUpdate
from app.core.errors import IdempotencyConflictError, ResourceNotFoundError
import hashlib
from decimal import Decimal
from uuid import UUID
import json
from datetime import date 

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.invoice import Invoice
from app.repositories.invoice_repository import InvoiceRepository
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
)

from app.repositories.idempotency_repository import IdempotencyRepository
from app.schemas.invoice_review import InvoiceItemReviewCreate, InvoiceItemReviewUpdate

class InvoiceService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = InvoiceRepository(db)


    async def create_invoice(
        self,
        user_id: UUID,
        data: InvoiceCreate,
        idempotency_key: str,
    ) -> InvoiceResponse:
        idempotency_repository = IdempotencyRepository(self.db)

        try:
            # 1. Hash a canonical representation of the request.
            request_payload = {
                "operation": "create_invoice_v1",
                "payload": data.model_dump(mode="json"),
            }

            canonical_payload = json.dumps(
                request_payload,
                sort_keys=True,
                separators=(",", ":"),
            )

            request_hash = hashlib.sha256(
                canonical_payload.encode("utf-8")
            ).hexdigest()

            # 2. Atomically reserve the idempotency key.
            reserved = await idempotency_repository.reserve(
                user_id=user_id,
                idempotency_key=idempotency_key,
                request_hash=request_hash,
            )

            if not reserved:
                existing = await idempotency_repository.get_by_key(
                    user_id=user_id,
                    idempotency_key=idempotency_key,
                )

                if existing is None:
                    raise ResourceNotFoundError(
                        "Idempotency record not found after conflict."
                    )

                if existing.request_hash != request_hash:
                    raise IdempotencyConflictError(
                        "This Idempotency-Key was already used "
                        "with a different request payload."
                    )

                if existing.response_json is None:
                    raise IdempotencyConflictError(
                        "A request with this Idempotency-Key is already in progress."
                    )

                response = InvoiceResponse.model_validate(
                    existing.response_json
                )

                await self.db.rollback()
                return response

            idempotency_record = await idempotency_repository.get_by_key(
                user_id=user_id,
                idempotency_key=idempotency_key,
            )

            if idempotency_record is None:
                raise ResourceNotFoundError(
                    "Failed to retrieve the idempotency reservation."
                )

            # 3. Validate item totals.
            items_data = []
            calculated_subtotal = Decimal("0.00")

            for item in data.items:
                calculated_total = (
                    item.quantity * item.unit_price
                ).quantize(Decimal("0.01"))

                if calculated_total != item.total_price:
                    raise ValueError(
                        f"Invalid total for item '{item.product_name}'."
                    )

                calculated_subtotal += calculated_total

                items_data.append(
                    {
                        "product_name": item.product_name,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "total_price": calculated_total,
                    }
                )

            calculated_subtotal = calculated_subtotal.quantize(
                Decimal("0.01")
            )

            if calculated_subtotal != data.subtotal:
                raise ValueError(
                    "Invoice subtotal does not match invoice items."
                )

            calculated_total = (
                data.subtotal + data.tax - data.discount
            ).quantize(Decimal("0.01"))

            if calculated_total != data.total_amount:
                raise ValueError(
                    "Invoice total does not match subtotal, tax, and discount."
                )

            # 4. Prepare the invoice fields.
            invoice_data = {
                "invoice_number": data.invoice_number,
                "invoice_date": data.invoice_date,
                "customer_name": data.customer_name,
                "customer_phone": data.customer_phone,
                "subtotal": data.subtotal,
                "tax": data.tax,
                "discount": data.discount,
                "total_amount": data.total_amount,
                "currency": data.currency,
            }

            # 5. Insert the invoice and items.
            invoice = await self.repository.create(
                user_id=user_id,
                invoice_data=invoice_data,
                items_data=items_data,
            )

            # 6. Prepare the response before committing.
            response = InvoiceResponse.model_validate(invoice)
            response_json = response.model_dump(mode="json")

            # 7. Complete the idempotency record in this transaction.
            await idempotency_repository.complete(
                record=idempotency_record,
                invoice_id=invoice.id,
                response_json=response_json,
            )

            await self.db.commit()

            return response

        except Exception:
            await self.db.rollback()
            raise


    async def get_invoice(
        self,
        invoice_id: UUID,
        user_id: UUID,
    ) -> Invoice | None:

        return await self.repository.get_by_id(
            invoice_id=invoice_id,
            user_id=user_id,
        )


    async def get_invoices(
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
    ):
        invoices, total = await self.repository.get_all_for_user(
            user_id=user_id,
            page=page,
            page_size=page_size,
            status=status,
            customer_name=customer_name,
            search=search,
            date_from=date_from,
            date_to=date_to,
            min_amount=min_amount,
            max_amount=max_amount,
        )

        return invoices, total



    async def update_invoice(
        self,
        invoice_id: UUID,
        user_id: UUID,
        data: InvoiceUpdate,
    ) -> Invoice | None:

        invoice = await self.repository.get_by_id(
            invoice_id=invoice_id,
            user_id=user_id,
        )

        if invoice is None:
            return None

        update_data = data.model_dump(
            exclude_unset=True
        )

        if not update_data:
            return invoice

        invoice = await self.repository.update(
            invoice,
            update_data,
        )

        await self.db.commit()

        return invoice


    async def delete_invoice(
        self,
        invoice_id: UUID,
        user_id: UUID,
    ) -> bool:

        invoice = await self.repository.get_by_id(
            invoice_id=invoice_id,
            user_id=user_id,
        )

        if invoice is None:
            return False

        await self.repository.delete(invoice)

        await self.db.commit()

        return True



    async def add_item(
        self,
        user_id: UUID,
        invoice_id: UUID,
        data: InvoiceItemCreate,
    ):
        try:
            invoice = await self.repository.get_by_id_for_update(
                invoice_id,
                user_id,
            )

            if invoice is None:
                raise ResourceNotFoundError("Invoice not found")

            expected_total = data.quantity * data.unit_price
            if expected_total != data.total_price:
                raise ValueError(
                    "Item total must equal quantity multiplied by unit price"
                )

            item = InvoiceItem(
                invoice_id=invoice.id,
                product_name=data.product_name,
                quantity=data.quantity,
                unit_price=data.unit_price,
                total_price=data.total_price,
            )

            self.db.add(item)
            await self.db.flush()

            await self.repository.recalculate_subtotal(invoice)
            await self.db.commit()

            return await self.repository.get_by_id(
                invoice_id,
                user_id,
            )

        except Exception:
            await self.db.rollback()
            raise

    async def update_item(
        self,
        user_id: UUID,
        invoice_id: UUID,
        item_id: UUID,
        data: InvoiceItemUpdate,
    ):
        try:
            invoice = await self.repository.get_by_id_for_update(
                invoice_id,
                user_id,
            )

            if invoice is None:
                raise ResourceNotFoundError("Invoice not found")

            item = next(
                (item for item in invoice.items if item.id == item_id),
                None,
            )

            if item is None:
                raise ResourceNotFoundError("Invoice item not found")

            changes = data.model_dump(exclude_unset=True)

            for field, value in changes.items():
                if value is not None:
                    setattr(item, field, value)

            if item.quantity <= 0:
                raise ValueError("Quantity must be greater than zero")

            if item.unit_price < 0:
                raise ValueError("Unit price cannot be negative")

            item.total_price = item.quantity * item.unit_price

            await self.db.flush()
            await self.repository.recalculate_subtotal(invoice)
            await self.db.commit()

            return await self.repository.get_by_id(
                invoice_id,
                user_id,
            )

        except Exception:
            await self.db.rollback()
            raise

    async def delete_item(
        self,
        user_id: UUID,
        invoice_id: UUID,
        item_id: UUID,
    ):
        try:
            invoice = await self.repository.get_by_id_for_update(
                invoice_id,
                user_id,
            )

            if invoice is None:
                raise ResourceNotFoundError("Invoice not found")

            item = next(
                (item for item in invoice.items if item.id == item_id),
                None,
            )

            if item is None:
                raise ResourceNotFoundError("Invoice item not found")

            await self.db.delete(item)
            await self.db.flush()

            await self.repository.recalculate_subtotal(invoice)
            await self.db.commit()

            return await self.repository.get_by_id(
                invoice_id,
                user_id,
            )

        except Exception:
            await self.db.rollback()
            raise

    async def add_review_item(
        self,
        user_id: UUID,
        invoice_id: UUID,
        data: InvoiceItemReviewCreate,
    ):
        try:
            invoice = await self.repository.get_by_id_for_update(
                invoice_id,
                user_id,
            )

            if invoice is None:
                raise ResourceNotFoundError("Invoice not found")

            if invoice.status != InvoiceStatus.DRAFT:
                raise ValueError(
                    "Items can only be added to draft invoices during review"
                )

            expected_total = (
                data.quantity * data.unit_price
            ).quantize(Decimal("0.01"))

            if expected_total != data.total_price:
                raise ValueError(
                    "Item total must equal quantity multiplied by unit price"
                )

            item = InvoiceItem(
                invoice_id=invoice.id,
                product_name=data.product_name.strip(),
                quantity=data.quantity,
                unit_price=data.unit_price,
                total_price=expected_total,
            )

            self.db.add(item)
            await self.db.flush()

            await self.repository.recalculate_subtotal(invoice)

            await self.db.commit()

            return await self.repository.get_by_id(
                invoice_id,
                user_id,
            )

        except Exception:
            await self.db.rollback()
            raise

    async def update_review_item(
        self,
        user_id: UUID,
        invoice_id: UUID,
        item_id: UUID,
        data: InvoiceItemReviewUpdate,
    ):
        try:
            invoice = await self.repository.get_by_id_for_update(
                invoice_id,
                user_id,
            )

            if invoice is None:
                raise ResourceNotFoundError("Invoice not found")

            if invoice.status != InvoiceStatus.DRAFT:
                raise ValueError(
                    "Items can only be edited in draft invoices during review"
                )

            item = next(
                (item for item in invoice.items if item.id == item_id),
                None,
            )

            if item is None:
                raise ResourceNotFoundError("Invoice item not found")

            changes = data.model_dump(exclude_unset=True)

            for field, value in changes.items():
                if value is not None:
                    setattr(item, field, value)

            if item.quantity <= 0:
                raise ValueError("Quantity must be greater than zero")

            if item.unit_price < 0:
                raise ValueError("Unit price cannot be negative")

            if not item.product_name.strip():
                raise ValueError("Product name cannot be empty")

            item.total_price = (
                item.quantity * item.unit_price
            ).quantize(Decimal("0.01"))

            await self.db.flush()

            await self.repository.recalculate_subtotal(invoice)

            await self.db.commit()

            return await self.repository.get_by_id(
                invoice_id,
                user_id,
            )

        except Exception:
            await self.db.rollback()
            raise


    async def delete_review_item(
        self,
        user_id: UUID,
        invoice_id: UUID,
        item_id: UUID,
    ):
        try:
            invoice = await self.repository.get_by_id_for_update(
                invoice_id,
                user_id,
            )

            if invoice is None:
                raise ResourceNotFoundError("Invoice not found")

            if invoice.status != InvoiceStatus.DRAFT:
                raise ValueError(
                    "Items can only be deleted from draft invoices during review"
                )

            item = next(
                (item for item in invoice.items if item.id == item_id),
                None,
            )

            if item is None:
                raise ResourceNotFoundError("Invoice item not found")

            await self.db.delete(item)
            await self.db.flush()

            await self.repository.recalculate_subtotal(invoice)

            await self.db.commit()

            return await self.repository.get_by_id(
                invoice_id,
                user_id,
            )

        except Exception:
            await self.db.rollback()
            raise

    async def confirm_invoice(
        self,
        user_id: UUID,
        invoice_id: UUID,
    ):
        try:
            invoice = await self.repository.get_by_id_for_update(
                invoice_id,
                user_id,
            )

            if invoice is None:
                raise ResourceNotFoundError("Invoice not found")

            if invoice.status != InvoiceStatus.DRAFT:
                raise ValueError("Only draft invoices can be confirmed")

            if not invoice.items:
                raise ValueError("Invoice must contain at least one item")

            for item in invoice.items:
                if not item.product_name.strip():
                    raise ValueError("Product name cannot be empty")

                if item.quantity <= 0:
                    raise ValueError("Item quantity must be greater than zero")

                if item.unit_price < 0:
                    raise ValueError("Item unit price cannot be negative")

                expected_total = (
                    item.quantity * item.unit_price
                ).quantize(Decimal("0.01"))

                if item.total_price != expected_total:
                    raise ValueError(
                        f"Invalid total for item: {item.product_name}"
                    )

            # Recalculate invoice totals before confirmation
            await self.repository.recalculate_subtotal(invoice)

            invoice.status = InvoiceStatus.CONFIRMED

            await self.db.flush()
            await self.db.commit()

            return await self.repository.get_by_id(
                invoice_id,
                user_id,
            )

        except Exception:
            await self.db.rollback()
            raise