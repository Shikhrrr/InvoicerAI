import json

from redis.asyncio import Redis

from app.config.settings import get_settings

settings = get_settings()


async def publish_task_event(task_id: str, data: dict):
    redis = Redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
    )

    try:
        await redis.publish(
            f"ai_task:{task_id}",
            json.dumps(data),
        )
    finally:
        await redis.aclose()