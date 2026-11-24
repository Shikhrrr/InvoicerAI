# app/services/conversation_service.py

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ResourceNotFoundError
from app.db.enums import MessageRole
from app.repositories.conversation_repository import ConversationRepository
from app.schemas.conversation import ConversationCreate, ConversationUpdate


class ConversationService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ConversationRepository(db)
        

    async def create_conversation(
        self,
        user_id: UUID,
        data: ConversationCreate,
    ):
        try:
            conversation = await self.repository.create(
                user_id=user_id,
                title=data.title,
            )

            await self.db.commit()

            return conversation

        except Exception:
            await self.db.rollback()
            raise


    async def get_conversations(
        self,
        user_id: UUID,
        *,
        limit: int = 20,
        offset: int = 0,
    ):
        return await self.repository.get_all_for_user(
            user_id=user_id,
            limit=limit,
            offset=offset,
        )


    async def get_conversation(
        self,
        conversation_id: UUID,
        user_id: UUID,
    ):
        return await self.repository.get_by_id(
            conversation_id=conversation_id,
            user_id=user_id,
        )


    async def update_conversation(
        self,
        conversation_id: UUID,
        user_id: UUID,
        data: ConversationUpdate,
    ):
        try:
            conversation = await self.repository.get_by_id(
                conversation_id=conversation_id,
                user_id=user_id,
            )

            if conversation is None:
                return None

            update_data = data.model_dump(
                exclude_unset=True,
            )

            if not update_data:
                return conversation

            conversation = await self.repository.update(
                conversation,
                update_data,
            )

            await self.db.commit()

            return conversation

        except Exception:
            await self.db.rollback()
            raise


    async def delete_conversation(
        self,
        conversation_id: UUID,
        user_id: UUID,
    ) -> bool:
        try:
            conversation = await self.repository.get_by_id(
                conversation_id=conversation_id,
                user_id=user_id,
            )

            if conversation is None:
                return False

            await self.repository.delete(conversation)

            await self.db.commit()

            return True

        except Exception:
            await self.db.rollback()
            raise


    # --------------------------------------------------
    # MESSAGES
    # --------------------------------------------------

    async def get_message_history(
        self,
        conversation_id: UUID,
        user_id: UUID,
        *,
        limit: int = 50,
        offset: int = 0,
    ):
        conversation = await self.repository.get_by_id(
            conversation_id=conversation_id,
            user_id=user_id,
        )

        if conversation is None:
            return None

        return await self.repository.get_messages(
            conversation_id=conversation_id,
            limit=limit,
            offset=offset,
        )


    async def add_message(
        self,
        conversation_id: UUID,
        user_id: UUID,
        *,
        role: MessageRole,
        content: str,
        metadata: dict | None = None,
    ):
        try:
            conversation = await self.repository.get_by_id(
                conversation_id=conversation_id,
                user_id=user_id,
            )

            if conversation is None:
                raise ResourceNotFoundError(
                    "Conversation not found"
                )

            message = await self.repository.add_message(
                conversation_id=conversation_id,
                user_id=user_id,
                role=role,
                content=content,
                metadata=metadata,
            )

            await self.db.commit()

            return message

        except Exception:
            await self.db.rollback()
            raise