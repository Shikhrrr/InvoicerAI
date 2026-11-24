
import asyncio
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, delete

from app.db.enums import AITaskStatus
from app.db.models.ai_task import AITask
from app.db.models.invoice import Invoice
from app.db.models.invoice_item import InvoiceItem
from app.db.models.extraction import RawExtraction
from app.db.session import AsyncSessionLocal, engine

from app.services.server.invoice_extraction_service import (
    InvoiceExtractionService,
)
from app.services.server.extraction_validator import ExtractionValidator
from app.services.server.extraction_quality_scorer import (
    ExtractionQualityScorer,
)
from app.services.server.extraction_failure_classifier import (
    ExtractionFailureClassifier,
)
from app.repositories.invoice_repository import InvoiceRepository

from app.workers.celery_app import celery_app
from app.services.server.task_events import publish_task_event


logger = logging.getLogger(__name__)


async def process_invoice(
    invoice_id: str,
    user_id: str,
    ai_task_id: str,
):
    try:
        async with AsyncSessionLocal() as db:

            # 1. Load AI task
            ai_task = await db.scalar(
                select(AITask).where(
                    AITask.id == UUID(ai_task_id),
                    AITask.user_id == UUID(user_id),
                )
            )

            if ai_task is None:
                raise ValueError("AI task not found")

            # Prevent reprocessing completed tasks
            if ai_task.status == AITaskStatus.COMPLETED:
                return

            # 2. Mark task as processing
            ai_task.status = AITaskStatus.PROCESSING
            ai_task.started_at = datetime.now(timezone.utc)
            ai_task.error_message = None

            await db.commit()

            # Publish processing event
            try:
                await publish_task_event(
                    ai_task_id,
                    {
                        "task_id": ai_task_id,
                        "status": "PROCESSING",
                    },
                )
            except Exception:
                logger.exception(
                    "Failed to publish PROCESSING event for task %s",
                    ai_task_id,
                )

            # 3. Load invoice
            invoice = await db.scalar(
                select(Invoice).where(
                    Invoice.id == UUID(invoice_id),
                    Invoice.user_id == UUID(user_id),
                )
            )

            if invoice is None:
                raise ValueError("Invoice not found")

            # 4. Initialize extraction service and repository
            extraction_service = InvoiceExtractionService()
            invoice_repository = InvoiceRepository(db)

            # 5. Perform extraction and duplicate detection
            extracted_invoice, extraction_metadata = (
                await extraction_service.extract_invoice(
                    image_url=invoice.image_url,
                    user_id=user_id,
                    invoice_id=invoice_id,
                    invoice_repository=invoice_repository,
                )
            )

            # 6. Validate extracted data
            validator = ExtractionValidator()

            validation_result = validator.validate(
                extracted_invoice
            )

            # 7. Calculate extraction quality score
            scorer = ExtractionQualityScorer()

            quality_result = scorer.calculate(
                validation_result
            )

            validation_data = {
                "is_valid": validation_result.is_valid,
                "issues": [
                    {
                        "code": issue.code,
                        "message": issue.message,
                        "severity": issue.severity,
                    }
                    for issue in validation_result.issues
                ],
                "warnings": [
                    {
                        "code": warning.code,
                        "message": warning.message,
                        "severity": warning.severity,
                    }
                    for warning in validation_result.warnings
                ],
                "quality_score": quality_result.score,
                "quality_label": quality_result.label,
            }

            logger.info(
                "Extraction validation completed. "
                "Invoice ID: %s, Quality score: %s, Label: %s",
                invoice_id,
                quality_result.score,
                quality_result.label,
            )

            # 8. Persist extracted invoice fields
            invoice.invoice_number = (
                extracted_invoice.invoice_number
            )

            invoice.invoice_date = (
                extracted_invoice.invoice_date
            )

            invoice.customer_name = (
                extracted_invoice.customer_name
            )

            invoice.customer_phone = (
                extracted_invoice.customer_phone
            )

            invoice.subtotal = extracted_invoice.subtotal
            invoice.tax = extracted_invoice.tax
            invoice.discount = extracted_invoice.discount

            invoice.total_amount = (
                extracted_invoice.total_amount
            )

            invoice.currency = extracted_invoice.currency

            # 9. Persist duplicate detection results
            invoice.is_duplicate = (
                extraction_metadata["is_duplicate"]
            )

            duplicate_invoice_id = (
                extraction_metadata[
                    "duplicate_of_invoice_id"
                ]
            )

            invoice.duplicate_of_invoice_id = (
                UUID(duplicate_invoice_id)
                if duplicate_invoice_id
                else None
            )

            # Preserve image hash if it wasn't saved previously
            if not invoice.image_hash:
                invoice.image_hash = (
                    extraction_metadata["image_hash"]
                )

            # 10. Persist invoice line items
            # Delete existing items to make reprocessing safe.
            await db.execute(
                delete(InvoiceItem).where(
                    InvoiceItem.invoice_id == invoice.id
                )
            )

            invoice_items = [
                InvoiceItem(
                    invoice_id=invoice.id,
                    product_name=item.product_name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total_price=item.total_price,
                )
                for item in extracted_invoice.items
            ]

            db.add_all(invoice_items)

            # 11. Persist raw extraction data
            extracted_data = extracted_invoice.model_dump(
                mode="json"
            )

            raw_extraction = RawExtraction(
                invoice_id=invoice.id,
                raw_json={
                    "extracted_data": extracted_data,
                    "raw_response": extraction_metadata.get(
                        "raw_text"
                    ),
                    "provider": extraction_metadata.get(
                        "provider"
                    ),
                    "image_hash": extraction_metadata.get(
                        "image_hash"
                    ),
                    "is_duplicate": extraction_metadata.get(
                        "is_duplicate"
                    ),
                    "duplicate_of_invoice_id": (
                        extraction_metadata.get(
                            "duplicate_of_invoice_id"
                        )
                    ),
                },
                model_name=extraction_metadata.get("model"),
                prompt_version="invoice-extraction-v1",
                confidence_score=None,
                validation_results=validation_data,
                quality_score=quality_result.score,
            )

            db.add(raw_extraction)

            # 12. Mark task completed
            ai_task.status = AITaskStatus.COMPLETED
            ai_task.completed_at = datetime.now(timezone.utc)
            ai_task.error_message = None

            # Commit all extraction data atomically
            await db.commit()

            # 13. Publish completion event AFTER commit
            try:
                await publish_task_event(
                    ai_task_id,
                    {
                        "task_id": ai_task_id,
                        "status": "COMPLETED",
                        "invoice_id": invoice_id,
                        "is_duplicate": invoice.is_duplicate,
                        "duplicate_of_invoice_id": (
                            str(invoice.duplicate_of_invoice_id)
                            if invoice.duplicate_of_invoice_id
                            else None
                        ),
                        "items_count": len(invoice_items),
                        "quality_score": quality_result.score,
                        "quality_label": quality_result.label,
                        "validation_warnings_count": len(
                            validation_result.warnings
                        ),
                        "validation_issues_count": len(
                            validation_result.issues
                        ),
                    },
                )
            except Exception:
                logger.exception(
                    "Failed to publish COMPLETED event for task %s",
                    ai_task_id,
                )

    finally:
        await engine.dispose()


async def mark_task_failed(
    ai_task_id: str,
    user_id: str,
    error_message: str,
):
    async with AsyncSessionLocal() as db:

        ai_task = await db.scalar(
            select(AITask).where(
                AITask.id == UUID(ai_task_id),
                AITask.user_id == UUID(user_id),
            )
        )

        if ai_task is not None:

            ai_task.status = AITaskStatus.FAILED
            ai_task.error_message = error_message
            ai_task.completed_at = datetime.now(timezone.utc)

            await db.commit()

            try:
                await publish_task_event(
                    ai_task_id,
                    {
                        "task_id": ai_task_id,
                        "status": "FAILED",
                        "error_message": error_message,
                    },
                )
            except Exception:
                logger.exception(
                    "Failed to publish FAILED event for task %s",
                    ai_task_id,
                )


@celery_app.task(
    bind=True,
    name="app.workers.tasks.extraction.extract_invoice",
    max_retries=4,
)
def extract_invoice(
    self,
    invoice_id: str,
    user_id: str,
    ai_task_id: str,
):
    try:
        asyncio.run(
            process_invoice(
                invoice_id=invoice_id,
                user_id=user_id,
                ai_task_id=ai_task_id,
            )
        )

    except Exception as exc:

        classifier = ExtractionFailureClassifier()
        classification = classifier.classify(exc)

        logger.exception(
            "Invoice extraction failed. "
            "Category: %s, Retryable: %s, Attempt: %s",
            classification.category,
            classification.retryable,
            self.request.retries,
        )

        # Retry only transient failures
        if classification.retryable:

            if self.request.retries < self.max_retries:

                countdown = 5 * (2 ** self.request.retries)

                logger.warning(
                    "Retrying extraction task %s in %s seconds. "
                    "Retry attempt %s/%s",
                    ai_task_id,
                    countdown,
                    self.request.retries + 1,
                    self.max_retries,
                )

                raise self.retry(
                    exc=exc,
                    countdown=countdown,
                )

        # Permanent failure or retries exhausted
        asyncio.run(
            mark_task_failed(
                ai_task_id=ai_task_id,
                user_id=user_id,
                error_message=str(exc),
            )
        )

        raise
