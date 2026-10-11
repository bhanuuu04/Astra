from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import TenantContext, get_current_tenant_context
from app.db.models import Brand, Campaign, Sighting
from app.db.session import get_session
from app.schemas.overview import OverviewResponse

router = APIRouter(prefix="/api/v1", tags=["overview"])


@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> OverviewResponse:
    tenant_id = context.tenant_id

    brands_count = session.scalar(
        select(func.count()).select_from(Brand).where(Brand.tenant_id == tenant_id)
    ) or 0

    sightings_count = session.scalar(
        select(func.count()).select_from(Sighting).where(Sighting.tenant_id == tenant_id)
    ) or 0

    active_campaigns = session.scalar(
        select(func.count())
        .select_from(Campaign)
        .where(Campaign.tenant_id == tenant_id, Campaign.status.notin_(["closed", "rejected"]))
    ) or 0

    high_risk = session.scalar(
        select(func.count())
        .select_from(Campaign)
        .where(Campaign.tenant_id == tenant_id, Campaign.risk_score >= 70)
    ) or 0

    return OverviewResponse(
        brands=int(brands_count),
        sightings=int(sightings_count),
        active_campaigns=int(active_campaigns),
        high_risk_campaigns=int(high_risk),
        environment=get_settings().app_env,
    )
