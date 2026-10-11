from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import ROLE_READ_ONLY, TenantContext, get_current_tenant_context
from app.db.session import get_session
from app.domain.settings_service import get_tenant_settings, update_tenant_settings
from app.schemas.settings import TenantSettingsResponse, TenantSettingsUpdate

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


@router.get(
    "",
    response_model=TenantSettingsResponse,
    summary="Get persistent platform settings for tenant",
)
def get_settings(
    context: TenantContext = Depends(get_current_tenant_context),
    session: Session = Depends(get_session),
):
    """Retrieve database-persisted threshold and alert settings for the active organization."""
    return get_tenant_settings(session, context.tenant_id)


@router.put(
    "",
    response_model=TenantSettingsResponse,
    summary="Update persistent platform settings for tenant",
)
def update_settings(
    updates: TenantSettingsUpdate,
    context: TenantContext = Depends(get_current_tenant_context),
    session: Session = Depends(get_session),
):
    """Update database-persisted quarantine threshold, Slack webhook, and alert settings."""
    if context.role == ROLE_READ_ONLY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Read-only members cannot update organization settings.",
        )
    return update_tenant_settings(session, context.tenant_id, updates)
