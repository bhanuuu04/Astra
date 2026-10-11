"""Connector management API endpoints for authorized data sources."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_write_permission
from app.db.session import get_session
from app.domain.connector_service import (
    check_connector_health,
    create_connector,
    delete_connector,
    get_connector,
    list_connectors,
    sync_connector_telemetry,
    update_connector,
)
from app.schemas.connector import (
    ConnectorCreate,
    ConnectorHealthCheck,
    ConnectorListResponse,
    ConnectorResponse,
    ConnectorSyncResponse,
    ConnectorUpdate,
)

router = APIRouter(prefix="/api/v1/connectors", tags=["connectors"])


@router.post("", response_model=ConnectorResponse, status_code=status.HTTP_201_CREATED)
def handle_create_connector(
    connector_data: ConnectorCreate,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> ConnectorResponse:
    """Create new connector for authorized data collection."""
    connector = create_connector(
        session=session,
        tenant_id=context.tenant_id,
        connector_type=connector_data.connector_type,
        name=connector_data.name,
        auth_config=connector_data.auth_config,
        permitted_scopes=connector_data.permitted_scopes,
        rate_limit_rpm=connector_data.rate_limit_rpm or 60
    )
    return ConnectorResponse.model_validate(connector)


@router.get("", response_model=ConnectorListResponse)
def handle_list_connectors(
    connector_type: Optional[str] = Query(None, description="Filter by type"),
    status: Optional[str] = Query(None, description="Filter by status: active, degraded, error, unconfigured"),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> ConnectorListResponse:
    """List all connectors for tenant with operational health."""
    connectors = list_connectors(
        session=session,
        tenant_id=context.tenant_id,
        connector_type=connector_type,
        status=status
    )
    connector_responses = [ConnectorResponse.model_validate(c) for c in connectors]
    return ConnectorListResponse(
        connectors=connector_responses,
        total=len(connector_responses)
    )


@router.get("/{connector_id}", response_model=ConnectorResponse)
def handle_get_connector(
    connector_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> ConnectorResponse:
    """Get single connector detail."""
    connector = get_connector(session, context.tenant_id, connector_id)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Connector {connector_id} not found"
        )
    return ConnectorResponse.model_validate(connector)


@router.patch("/{connector_id}", response_model=ConnectorResponse)
def handle_update_connector(
    connector_id: uuid.UUID,
    update: ConnectorUpdate,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> ConnectorResponse:
    """Update connector configuration."""
    connector = get_connector(session, context.tenant_id, connector_id)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Connector {connector_id} not found"
        )
    try:
        updated = update_connector(
            session=session,
            tenant_id=context.tenant_id,
            connector_id=connector_id,
            name=update.name,
            auth_config=update.auth_config,
            permitted_scopes=update.permitted_scopes,
            rate_limit_rpm=update.rate_limit_rpm,
            status=update.status
        )
        return ConnectorResponse.model_validate(updated)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{connector_id}/health", response_model=ConnectorHealthCheck)
def handle_check_connector_health(
    connector_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> ConnectorHealthCheck:
    """Perform health check and cryptographic handshake on connector."""
    connector = get_connector(session, context.tenant_id, connector_id)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Connector {connector_id} not found"
        )

    status_val, error_message = check_connector_health(
        session=session,
        tenant_id=context.tenant_id,
        connector_id=connector_id
    )

    connector = get_connector(session, context.tenant_id, connector_id)
    return ConnectorHealthCheck(
        connector_id=connector.id,
        status=status_val,
        last_check=connector.last_health_check_at or connector.created_at,
        next_sync_expected=None,
        error_message=error_message
    )


@router.post("/{connector_id}/sync", response_model=ConnectorSyncResponse)
def handle_sync_connector(
    connector_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> ConnectorSyncResponse:
    """Execute live telemetry collection and ingest findings into the evidence vault."""
    connector = get_connector(session, context.tenant_id, connector_id)
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Connector {connector_id} not found"
        )
    try:
        result = sync_connector_telemetry(
            session=session,
            tenant_id=context.tenant_id,
            connector_id=connector_id
        )
        return ConnectorSyncResponse(
            connector_id=result["connector_id"],
            status=result["status"],
            synced_findings_count=result["synced_findings_count"],
            finding_ids=result["finding_ids"],
            synced_at=result["synced_at"],
            error_message=result["error_message"]
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{connector_id}", status_code=status.HTTP_204_NO_CONTENT)
def handle_delete_connector(
    connector_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> None:
    """Delete connector and revoke credentials."""
    deleted = delete_connector(
        session=session,
        tenant_id=context.tenant_id,
        connector_id=connector_id
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Connector {connector_id} not found"
        )
