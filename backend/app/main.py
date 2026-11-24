from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import router
from app.config.settings import get_settings
from app.services.ai.checkpointer import create_checkpointer
from app.services.ai.graph.graph import build_invoice_graph
from fastapi.middleware.cors import CORSMiddleware

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    pool, checkpointer = await create_checkpointer()

    app.state.checkpointer = checkpointer
    app.state.invoice_graph = build_invoice_graph(checkpointer)
    yield

    await pool.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

origins = [
    "http://localhost:3000",  
    "http://localhost:5173",  
    "http://localhost:5174",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)