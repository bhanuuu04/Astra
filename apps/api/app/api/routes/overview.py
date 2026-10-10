from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Brand, Campaign, Sighting
from app.db.session import get_session
from app.schemas.overview import OverviewResponse

router = APIRouter(prefix="/api/v1", tags=["overview"])


def count_rows(session: Session, model: type) -> int:
    return int(session.scalar(select(func.count()).select_from(model)) or 0)


@router.get("/overview", response_model=OverviewResponse)
def get_overview(session: Session = Depends(get_session)) -> OverviewResponse:
    active_campaigns = session.scalar(
        select(func.count()).select_from(Campaign).where(Campaign.status.notin_(["closed", "rejected"]))
    ) or 0
    high_risk = session.scalar(
        select(func.count()).select_from(Campaign).where(Campaign.risk_score >= 70)
    ) or 0
    return OverviewResponse(
        brands=count_rows(session, Brand),
        sightings=count_rows(session, Sighting),
        active_campaigns=int(active_campaigns),
        high_risk_campaigns=int(high_risk),
        environment=get_settings().app_env,
    )
