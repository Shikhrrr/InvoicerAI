from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.conversation import Conversation
from app.db.models.message import Message


class ConversationRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def create(
        self,
        *,
        user_id: UUID,
        title: str | None = None,
    ) -> Conversation:

        conversation = Conversation(
            user_id=user_id,
            title=title,
        )

        self.db.add(conversation)
        await self.db.flush()
        await self.db.refresh(conversation)

        return conversation


    async def get_by_id(
        self,
        conversation_id: UUID,
        user_id: UUID,
    ) -> Conversation | None:

        result = await self.db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )

        return result.scalar_one_or_none()


    async def get_all_for_user(
        self,
        user_id: UUID,
        *,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Conversation], int]:

        conditions = [
            Conversation.user_id == user_id,
        ]

        count_result = await self.db.execute(
            select(func.count())
            .select_from(Conversation)
            .where(*conditions)
        )

        total = count_result.scalar_one()

        result = await self.db.execute(
            select(Conversation)
            .where(*conditions)
            .order_by(
                Conversation.updated_at.desc(),
                Conversation.created_at.desc(),
            )
            .offset(offset)
            .limit(limit)
        )

        conversations = list(result.scalars().all())

        return conversations, total


    async def update(
        self,
        conversation: Conversation,
        update_data: dict,
    ) -> Conversation:

        for field, value in update_data.items():
            setattr(conversation, field, value)

        await self.db.flush()
        await self.db.refresh(conversation)

        return conversation


    async def delete(
        self,
        conversation: Conversation,
    ) -> None:

        await self.db.delete(conversation)
        await self.db.flush()


    async def update_last_activity(
        self,
        conversation_id: UUID,
        user_id: UUID,
    ) -> None:

        await self.db.execute(
            update(Conversation)
            .where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
            .values(updated_at=func.now())
        )

        await self.db.flush()


    async def add_message(
        self,
        *,
        conversation_id: UUID,
        user_id: UUID,
        role,
        content: str,
        metadata: dict | None = None,
    ) -> Message:

        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata_=metadata,
        )

        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)

        await self.update_last_activity(
            conversation_id=conversation_id,
            user_id=user_id,
        )

        return message


    async def get_messages(
        self,
        conversation_id: UUID,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Message], int]:

        conditions = [
            Message.conversation_id == conversation_id,
        ]

        count_result = await self.db.execute(
            select(func.count())
            .select_from(Message)
            .where(*conditions)
        )

        total = count_result.scalar_one()

        result = await self.db.execute(
            select(Message)
            .where(*conditions)
            .order_by(
                Message.created_at.asc(),
                Message.id.asc(),
            )
            .offset(offset)
            .limit(limit)
        )

        messages = list(result.scalars().all())

        return messages, total