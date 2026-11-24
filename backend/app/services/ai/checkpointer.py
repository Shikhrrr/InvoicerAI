from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from app.config.settings import get_settings


def get_psycopg_database_url() -> str:
    settings = get_settings()

    return settings.DATABASE_URL.replace(
        "postgresql+asyncpg://",
        "postgresql://",
    )


async def create_checkpointer():
    pool = AsyncConnectionPool(
        conninfo=get_psycopg_database_url(),
        min_size=2,
        max_size=10,
        kwargs={
            "autocommit": True,
            "row_factory": dict_row,
        },
        open=False,
    )

    await pool.open()

    checkpointer = AsyncPostgresSaver(pool)

    await checkpointer.setup()

    return pool, checkpointer