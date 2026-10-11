from datetime import datetime, timezone
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    TenantContext,
    get_current_tenant_context,
    require_analyst_review,
    require_write_permission,
)
from app.db.models import (
    AnalystDecision,
    AuditEvent,
    Campaign,
    CampaignEdgeLegacy as CampaignEdge,
    CampaignMember,
    Sighting,
    Signal,
)
from app.db.session import get_session
from app.schemas.analysis import SignalResponse
from app.schemas.campaign import (
    CampaignDecisionRequest,
    CampaignDetailResponse,
    CampaignEdgeResponse,
    CampaignResponse,
    EdgeDecisionRequest,
)
from app.schemas.sighting import SightingResponse

router = APIRouter(prefix="/api/v1/campaigns", tags=["campaigns"])


@router.get("", response_model=List[CampaignResponse])
def handle_list_campaigns(
    brand_id: Optional[uuid.UUID] = Query(None, description="Filter by brand"),
    status: Optional[str] = Query(None, description="Filter by status"),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> List[CampaignResponse]:
    stmt = select(Campaign).where(Campaign.tenant_id == context.tenant_id)
    if brand_id:
        stmt = stmt.where(Campaign.brand_id == brand_id)
    if status:
        stmt = stmt.where(Campaign.status == status)

    campaigns = list(session.scalars(stmt.order_by(Campaign.risk_score.desc())).all())
    result = []
    for c in campaigns:
        member_count = len(list(session.scalars(
            select(CampaignMember).where(CampaignMember.campaign_id == c.id)
        ).all()))
        resp = CampaignResponse.model_validate(c)
        resp.member_count = member_count
        result.append(resp)
    return result


@router.get("/{campaign_id}", response_model=CampaignDetailResponse)
def handle_get_campaign(
    campaign_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> CampaignDetailResponse:
    campaign = session.scalar(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.tenant_id == context.tenant_id)
    )
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    members = list(session.scalars(
        select(Sighting)
        .join(CampaignMember, CampaignMember.sighting_id == Sighting.id)
        .where(CampaignMember.campaign_id == campaign_id)
    ).all())

    edges = list(session.scalars(
        select(CampaignEdge).where(CampaignEdge.campaign_id == campaign_id)
    ).all())

    member_ids = [m.id for m in members]
    signals = list(session.scalars(
        select(Signal).where(Signal.sighting_id.in_(member_ids))
    ).all()) if member_ids else []

    camp_resp = CampaignResponse.model_validate(campaign)
    camp_resp.member_count = len(members)

    return CampaignDetailResponse(
        campaign=camp_resp,
        members=[SightingResponse.model_validate(m) for m in members],
        edges=[CampaignEdgeResponse.model_validate(e) for e in edges],
        signals=[SignalResponse.model_validate(s) for s in signals],
    )


@router.post("/{campaign_id}/decisions", response_model=CampaignResponse)
def handle_campaign_decision(
    campaign_id: uuid.UUID,
    data: CampaignDecisionRequest,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_analyst_review),
) -> CampaignResponse:
    campaign = session.scalar(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.tenant_id == context.tenant_id)
    )
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # Update status
    if data.decision == "accept":
        campaign.status = "confirmed"
    elif data.decision == "reject":
        campaign.status = "rejected"
    elif data.decision == "benign":
        campaign.status = "closed"

    # Server-verified actor
    effective_actor = context.actor

    # Record decision
    decision = AnalystDecision(
        id=uuid.uuid4(),
        tenant_id=campaign.tenant_id,
        campaign_id=campaign.id,
        actor=effective_actor,
        decision=data.decision,
        reason=data.reason,
    )
    session.add(decision)

    # Record audit event
    audit = AuditEvent(
        id=uuid.uuid4(),
        tenant_id=campaign.tenant_id,
        actor=effective_actor,
        event_type="analyst.campaign_decision",
        entity_type="campaign",
        entity_id=str(campaign.id),
        safe_metadata={"decision": data.decision, "reason": data.reason},
    )
    session.add(audit)
    session.commit()

    return CampaignResponse.model_validate(campaign)


@router.post("/{campaign_id}/edges/{edge_id}/decisions", response_model=CampaignEdgeResponse)
def handle_edge_decision(
    campaign_id: uuid.UUID,
    edge_id: uuid.UUID,
    data: EdgeDecisionRequest,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_analyst_review),
) -> CampaignEdgeResponse:
    campaign = session.scalar(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.tenant_id == context.tenant_id)
    )
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    edge = session.scalar(
        select(CampaignEdge).where(
            CampaignEdge.id == edge_id,
            CampaignEdge.campaign_id == campaign_id,
        )
    )
    if not edge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign edge not found")

    edge.review_status = "confirmed" if data.decision == "confirm" else "rejected"

    effective_actor = context.actor

    decision = AnalystDecision(
        id=uuid.uuid4(),
        tenant_id=campaign.tenant_id,
        campaign_id=campaign_id,
        edge_id=edge.id,
        actor=effective_actor,
        decision=f"edge_{data.decision}",
        reason=data.reason,
    )
    session.add(decision)
    session.commit()

    return CampaignEdgeResponse.model_validate(edge)
