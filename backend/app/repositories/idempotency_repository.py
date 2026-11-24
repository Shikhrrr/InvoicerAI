
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.idempotency_record import IdempotencyRecord


class IdempotencyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def reserve(
        self,
        *,
        user_id: UUID,
        idempotency_key: str,
        request_hash: str,
    ) -> bool:
        statement = (
            insert(IdempotencyRecord)
            .values(
                user_id=user_id,
                idempotency_key=idempotency_key,
                request_hash=request_hash,
            )
            .on_conflict_do_nothing(
                constraint="uq_idempotency_user_key"
            )
            .returning(IdempotencyRecord.id)
        )

        result = await self.db.execute(statement)
        return result.scalar_one_or_none() is not None

    async def get_by_key(
        self,
        *,
        user_id: UUID,
        idempotency_key: str,
    ) -> IdempotencyRecord | None:
        result = await self.db.execute(
            select(IdempotencyRecord).where(
                IdempotencyRecord.user_id == user_id,
                IdempotencyRecord.idempotency_key == idempotency_key,
            )
        )

        return result.scalar_one_or_none()

    async def complete(
        self,
        record: IdempotencyRecord,
        *,
        invoice_id: UUID,
        response_json: dict,
    ) -> None:
        record.invoice_id = invoice_id
        record.response_json = response_json
        await self.db.flush()
