from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.test_tasks.add")
def add(x: int, y: int) -> int:
    return x + y