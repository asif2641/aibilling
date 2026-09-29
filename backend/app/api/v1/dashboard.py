from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.analytics_service import AnalyticsService
from app.schemas.dashboard import DashboardSummaryResponse

router = APIRouter()

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_dashboard_summary(user_id=user_id, db=db)
