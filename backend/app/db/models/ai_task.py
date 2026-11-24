import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Enum as SQLEnum

from app.db.base import Base
from app.db.enums import AITaskStatus, AITaskType

class AITask(Base):
    __tablename__ = "ai_tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    task_type: Mapped[AITaskType] = mapped_column(
        SQLEnum(
            AITaskType,
            name="ai_task_type",
            native_enum=True,
        ),
        nullable=False,
    )

    status: Mapped[AITaskStatus] = mapped_column(
        SQLEnum(
            AITaskStatus,
            name="ai_task_status",
            native_enum=True,
        ),
        nullable=False,
        default=AITaskStatus.PENDING,
    )

    celery_task_id: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    user = relationship(
        "User",
        back_populates="ai_tasks",
    )

    __table_args__ = (
        Index(
            "ix_ai_tasks_user_created",
            "user_id",
            "created_at",
        ),
    )