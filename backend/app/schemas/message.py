from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    metadata: dict | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageHistoryResponse(BaseModel):
    messages: list[MessageResponse]
    total: int
    limit: int
    offset: int