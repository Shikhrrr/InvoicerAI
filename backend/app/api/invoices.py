from fastapi.responses import JSONResponse
from app.repositories.invoice_repository import InvoiceRepository
import hashlib
from app.db.enums import AITaskType
from PIL.ImageFile import logger
from celery.utils.time import timezone
from datetime import datetime
from app.db.enums import AITaskStatus
from app.db.models import AITask
from app.workers.tasks.extraction import extract_invoice
from decimal import Decimal
from app.db.enums import InvoiceStatus
from app.schemas import InvoiceItemCreate
from app.schemas import InvoiceItemUpdate
from app.core.errors import ResourceNotFoundError
from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.db.models.user import User
from app.db.models.invoice import Invoice
from app.db.session import get_db
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceListResponse,
    InvoiceResponse,
    InvoiceUpdate,
)
from app.services.server.invoice_service import InvoiceService
from app.core.errors import IdempotencyConflictError
from fastapi import File, UploadFile
from app.services.server.upload_service import UploadService
from sqlalchemy import select
from app.db.models.extraction import RawExtraction
from app.schemas.invoice_review import InvoiceReviewResponse
from app.schemas.invoice_review import InvoiceReviewUpdate
from app.schemas.invoice_review import (
    InvoiceItemReviewCreate,
    InvoiceItemReviewUpdate,
)

router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"],
)


@router.post(
    "",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_invoice(
    data: InvoiceCreate,
    idempotency_key: str = Header(
        ...,
        alias="Idempotency-Key",
        min_length=1,
        max_length=128,
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InvoiceService(db)

    try:
        return await service.create_invoice(
            user_id=current_user.id,
            data=data,
            idempotency_key=idempotency_key,
        )

    except IdempotencyConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=InvoiceListResponse,
)
async def get_invoices(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: InvoiceStatus | None = Query(default=None),
    customer_name: str | None = Query(default=None, min_length=1, max_length=100),
    search: str | None = Query(default=None, min_length=1, max_length=100),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    min_amount: Decimal | None = Query(default=None, ge=0),
    max_amount: Decimal | None = Query(default=None, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if date_from is not None and date_to is not None:
        if date_from > date_to:
            raise HTTPException(
                status_code=422,
                detail="date_from must be on or before date_to",
            )

    if min_amount is not None and max_amount is not None:
        if min_amount > max_amount:
            raise HTTPException(
                status_code=422,
                detail="min_amount must be less than or equal to max_amount",
            )

    service = InvoiceService(db)

    invoices, total = await service.get_invoices(
        user_id=current_user.id,
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

    pages = (total + page_size - 1) // page_size

    return InvoiceListResponse(
        items=invoices,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.patch(
    "/{invoice_id}/review/items/{item_id}",
    response_model=InvoiceResponse,
)
async def update_review_item(
    invoice_id: UUID,
    item_id: UUID,
    data: InvoiceItemReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InvoiceService(db)

    try:
        return await service.update_review_item(
            user_id=current_user.id,
            invoice_id=invoice_id,
            item_id=item_id,
            data=data,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete(
    "/{invoice_id}/review/items/{item_id}",
    response_model=InvoiceResponse,
)
async def delete_review_item(
    invoice_id: UUID,
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InvoiceService(db)

    try:
        return await service.delete_review_item(
            user_id=current_user.id,
            invoice_id=invoice_id,
            item_id=item_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{invoice_id}/review/items", response_model=InvoiceResponse)
async def add_review_item(
    invoice_id: UUID,
    data: InvoiceItemReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InvoiceService(db)

    try:
        return await service.add_review_item(
            user_id=current_user.id,
            invoice_id=invoice_id,
            data=data,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{invoice_id}/confirm", response_model=InvoiceResponse)
async def confirm_invoice(
    invoice_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InvoiceService(db)

    try:
        return await service.confirm_invoice(
            user_id=current_user.id,
            invoice_id=invoice_id,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/{invoice_id}/review",
    response_model=InvoiceReviewResponse,
)
async def get_invoice_review(
    invoice_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InvoiceService(db)

    invoice = await service.get_invoice(
        invoice_id=invoice_id,
        user_id=current_user.id,
    )

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft invoices can be reviewed",
        )

    result = await db.execute(
        select(RawExtraction)
        .where(
            RawExtraction.invoice_id == invoice_id,
        )
        .order_by(RawExtraction.created_at.desc())
        .limit(1)
    )

    extraction = result.scalar_one_or_none()

    return InvoiceReviewResponse(
        invoice=invoice,
        extraction=extraction,
    )

@router.patch("/{invoice_id}/review", response_model=InvoiceResponse)
async def update_invoice_review(
    invoice_id: UUID,
    payload: InvoiceReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InvoiceService(db)

    invoice = await service.get_invoice(
        invoice_id=invoice_id,
        user_id=current_user.id,
    )

    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(
            status_code=400,
            detail="Only draft invoices can be edited during review",
        )

    update_data = payload.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update",
        )

    for field, value in update_data.items():
        setattr(invoice, field, value)

    await db.commit()

    updated_invoice = await service.get_invoice(
        invoice_id=invoice_id,
        user_id=current_user.id,
    )

    return updated_invoice

@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
async def get_invoice(
    invoice_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InvoiceService(db)

    invoice = await service.get_invoice(
        invoice_id=invoice_id,
        user_id=current_user.id,
    )

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    return invoice


@router.patch(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
async def update_invoice(
    invoice_id: UUID,
    data: InvoiceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InvoiceService(db)

    invoice = await service.update_invoice(
        invoice_id=invoice_id,
        user_id=current_user.id,
        data=data,
    )

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    return invoice


@router.delete(
    "/{invoice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_invoice(
    invoice_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InvoiceService(db)

    deleted = await service.delete_invoice(
        invoice_id=invoice_id,
        user_id=current_user.id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    return None


@router.post(
    "/{invoice_id}/items",
    status_code=status.HTTP_201_CREATED,
)
async def add_invoice_item(
    invoice_id: UUID,
    data: InvoiceItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = InvoiceService(db)

    try:
        return await service.add_item(
            current_user.id,
            invoice_id,
            data,
        )
    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.patch("/{invoice_id}/items/{item_id}")
async def update_invoice_item(
    invoice_id: UUID,
    item_id: UUID,
    data: InvoiceItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = InvoiceService(db)

    try:
        return await service.update_item(
            current_user.id,
            invoice_id,
            item_id,
            data,
        )
    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.delete("/{invoice_id}/items/{item_id}")
async def delete_invoice_item(
    invoice_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = InvoiceService(db)

    try:
        return await service.delete_item(
            current_user.id,
            invoice_id,
            item_id,
        )
    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post("/upload", status_code=201)
async def upload_invoice(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    allow_duplicate: bool = Query(default=False),
):
    upload_service = UploadService()
    invoice_repository = InvoiceRepository(db)

    try:
        # 1. Validate image and read its bytes
        content = await upload_service.validate_image(file)

        # 2. Calculate SHA-256
        image_hash = hashlib.sha256(content).hexdigest()

        # 3. Check for an existing invoice with the same image
        existing_invoice = (
            await invoice_repository.find_by_image_hash(
                user_id=current_user.id,
                image_hash=image_hash,
            )
        )

        # 4. Return duplicate warning if override wasn't requested
        if existing_invoice and not allow_duplicate:
            return JSONResponse(
                status_code=409,
                content={
                    "duplicate_detected": True,
                    "duplicate_type": "image_hash",
                    "existing_invoice_id": str(existing_invoice.id),
                    "message": "This image has already been uploaded.",
                },
            )

        # 5. Upload validated bytes to ImageKit
        uploaded = await upload_service.upload_image(
            content=content,
            user_id=str(current_user.id),
        )

        # 6. Create invoice
        invoice = Invoice(
            user_id=current_user.id,
            image_url=uploaded["url"],
            image_file_id=uploaded["file_id"],
            image_hash=image_hash,
            is_duplicate=existing_invoice is not None,
            duplicate_of_invoice_id=(
                existing_invoice.id
                if existing_invoice
                else None
            ),
            status=InvoiceStatus.DRAFT,
        )

        # 7. Create AI task
        ai_task = AITask(
            user_id=current_user.id,
            task_type=AITaskType.INVOICE_EXTRACTION,
            status=AITaskStatus.PENDING,
        )

        db.add_all([invoice, ai_task])
        await db.commit()

        await db.refresh(invoice)
        await db.refresh(ai_task)

        # 8. Dispatch extraction task
        try:
            celery_result = extract_invoice.delay(
                invoice_id=str(invoice.id),
                user_id=str(current_user.id),
                ai_task_id=str(ai_task.id),
            )

            ai_task.celery_task_id = celery_result.id
            await db.commit()

        except Exception as exc:
            ai_task.status = AITaskStatus.FAILED
            ai_task.error_message = (
                "Failed to dispatch extraction task"
            )
            ai_task.completed_at = datetime.now(timezone.utc)

            await db.commit()

            raise HTTPException(
                status_code=503,
                detail=(
                    "Invoice uploaded, but extraction "
                    "task could not be queued"
                ),
            ) from exc

        return {
            "invoice_id": str(invoice.id),
            "ai_task_id": str(ai_task.id),
            "image_url": invoice.image_url,
            "status": invoice.status,
            "task_status": ai_task.status,
            "duplicate_detected": invoice.is_duplicate,
            "duplicate_of_invoice_id": (
                str(invoice.duplicate_of_invoice_id)
                if invoice.duplicate_of_invoice_id
                else None
            ),
            "message": "Invoice uploaded. Extraction queued successfully.",
        }

    except ValueError as exc:
        await db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except HTTPException:
        raise

    except Exception:
        await db.rollback()

        logger.exception("Invoice upload failed")

        raise HTTPException(
            status_code=500,
            detail="Invoice upload failed",
        )