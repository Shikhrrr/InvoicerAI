
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.errors import InvalidInvoiceDataError
from app.db.models.user import User
from app.db.session import get_db
from app.repositories.invoice_repository import InvoiceRepository
from app.schemas.analytics import (
    DailyRevenueResponse,
    RevenueSummaryResponse,
)
from app.services.server.analytics_service import AnalyticsService


router = APIRouter(prefix="/analytics", tags=["Analytics"])


def get_analytics_service(
    db: AsyncSession = Depends(get_db),
) -> AnalyticsService:
    repository = InvoiceRepository(db)
    return AnalyticsService(repository)


@router.get("/summary", response_model=RevenueSummaryResponse)
async def get_revenue_summary(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    try:
        return await service.get_revenue_summary(
            current_user.id,
            start_date=start_date,
            end_date=end_date,
        )
    except InvalidInvoiceDataError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/daily-revenue", response_model=DailyRevenueResponse)
async def get_daily_revenue(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service),
):
    try:
        items = await service.get_daily_revenue(
            current_user.id,
            start_date=start_date,
            end_date=end_date,
        )
        return {"items": items}
    except InvalidInvoiceDataError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
