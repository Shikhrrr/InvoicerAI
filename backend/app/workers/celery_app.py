from celery import Celery

from app.config.settings import get_settings

settings = get_settings()

celery_app = Celery(
    "invoicerai",
    broker=settings.REDIS_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.tasks.test_tasks",
        "app.workers.tasks.extraction"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    broker_connection_retry_on_startup=True,
)