import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.db.models.ai_task import AITask
from app.db.session import get_db
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

settings = get_settings()


@router.get("/{task_id}")
async def get_task_status(
    task_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await db.scalar(
        select(AITask).where(
            AITask.id == task_id,
            AITask.user_id == current_user.id,
        )
    )

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "task_id": str(task.id),
        "task_type": task.task_type.value,
        "status": task.status.value,
        "error_message": task.error_message,
        "created_at": task.created_at,
        "started_at": task.started_at,
        "completed_at": task.completed_at,
    }


@router.get("/{task_id}/stream")
async def stream_task_status(
    task_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await db.scalar(
        select(AITask).where(
            AITask.id == task_id,
            AITask.user_id == current_user.id,
        )
    )

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    async def event_generator():
        redis = Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
        )
        pubsub = redis.pubsub()

        channel = f"ai_task:{task_id}"

        try:
            # Subscribe before reading PostgreSQL to avoid missing
            # an event between the initial status read and subscription.
            await pubsub.subscribe(channel)

            initial_status = {
                "task_id": str(task.id),
                "task_type": task.task_type.value,
                "status": task.status.value,
                "error_message": task.error_message,
            }

            yield f"event: task_status\ndata: {json.dumps(initial_status)}\n\n"

            if task.status.value in {"COMPLETED", "FAILED"}:
                return

            while True:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=15.0,
                )

                if message is None:
                    yield ": keep-alive\n\n"
                    continue

                data = json.loads(message["data"])

                yield (
                    f"event: task_status\n"
                    f"data: {json.dumps(data)}\n\n"
                )

                if data.get("status") in {"COMPLETED", "FAILED"}:
                    break

        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.aclose()
            await redis.aclose()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )