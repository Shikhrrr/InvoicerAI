
from datetime import date
from decimal import Decimal
from uuid import UUID

from app.core.errors import InvalidInvoiceDataError
from app.repositories.invoice_repository import InvoiceRepository


class AnalyticsService:
    def __init__(self, repository: InvoiceRepository):
        self.repository = repository

    @staticmethod
    def validate_date_range(
        start_date: date | None,
        end_date: date | None,
    ) -> None:
        if (
            start_date is not None
            and end_date is not None
            and start_date > end_date
        ):
            raise InvalidInvoiceDataError(
                "start_date must be on or before end_date"
            )

    async def get_revenue_summary(
        self,
        user_id: UUID,
        *,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> dict:
        self.validate_date_range(start_date, end_date)

        return await self.repository.get_revenue(
            user_id,
            start_date=start_date,
            end_date=end_date,
        )

    async def get_daily_revenue(
        self,
        user_id: UUID,
        *,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> list[dict]:
        self.validate_date_range(start_date, end_date)

        return await self.repository.get_daily_revenue(
            user_id,
            start_date=start_date,
            end_date=end_date,
        )
