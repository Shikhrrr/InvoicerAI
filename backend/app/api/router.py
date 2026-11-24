from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.invoices import router as invoice_router
from app.api.health import router as health_router 
from app.api.analytics import router as analytics_router
from app.api.tasks import router as tasks_router
from app.api.conversations import router as conversations_router
from app.api.chat import router as chat_router

router = APIRouter()

router.include_router(health_router)
router.include_router(auth_router)
router.include_router(invoice_router)
router.include_router(analytics_router) 
router.include_router(tasks_router)
router.include_router(conversations_router)
router.include_router(chat_router)