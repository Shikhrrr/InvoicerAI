from datetime import timezone
from _pytest import pytester_assertions
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.refresh_session import RefreshSession


class RefreshSessionRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshSession:

        session = RefreshSession(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )

        self.db.add(session)

        await self.db.flush()
        await self.db.refresh(session)

        return session

    async def get_by_token_hash(
        self,
        token_hash: str,
    ) -> RefreshSession | None:

        result = await self.db.execute(
            select(RefreshSession).where(
                RefreshSession.token_hash == token_hash
            )
        )

        return result.scalar_one_or_none()

    async def revoke(
        self,
        session: RefreshSession,
    ) -> None:
        session.revoked_at = datetime.now(timezone.utc)
        session.last_used_at = datetime.now(timezone.utc)

        await self.db.flush()

    async def revoke_by_token_hash(
        self,
        token_hash: str,
    ) -> RefreshSession | None:

        session = await self.get_by_token_hash(
            token_hash
        )

        if not session:
            return None

        if session.revoked_at is None:
            await self.revoke(session)

        return session