import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    TenantContext,
    get_current_tenant_context,
    require_analyst_review,
    require_write_permission,
)
from app.db.models import Campaign, ResponseAction
from app.db.session import get_session
from app.domain.response_service import (
    generate_campaign_response_packet,
    simulate_response_action,
)
from app.schemas.response import (
    ResponsePacketResponse,
    SimulateActionRequest,
    SimulateActionResponse,
)

router = APIRouter(prefix="/api/v1", tags=["responses"])


@router.post("/campaigns/{campaign_id}/response-drafts", response_model=ResponsePacketResponse, status_code=status.HTTP_201_CREATED)
def handle_generate_response_drafts(
    campaign_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> ResponsePacketResponse:
    campaign = session.scalar(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.tenant_id == context.tenant_id)
    )
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    try:
        return generate_campaign_response_packet(session, campaign_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/actions/{action_id}/simulate", response_model=SimulateActionResponse, status_code=status.HTTP_200_OK)
def handle_simulate_action(
    action_id: uuid.UUID,
    request: SimulateActionRequest = SimulateActionRequest(),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_analyst_review),
) -> SimulateActionResponse:
    action = session.scalar(
        select(ResponseAction)
        .join(Campaign, Campaign.id == ResponseAction.campaign_id)
        .where(ResponseAction.id == action_id, Campaign.tenant_id == context.tenant_id)
    )
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Response action not found")

    effective_actor = context.actor

    try:
        return simulate_response_action(
            session,
            action_id=action_id,
            actor=effective_actor,
            notes=request.notes,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
