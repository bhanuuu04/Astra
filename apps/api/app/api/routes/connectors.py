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
    update_connector,
)
from app.schemas.connector import (
    ConnectorCreate,
    ConnectorHealthCheck,
    ConnectorListResponse,
    ConnectorResponse,
    ConnectorUpdate,
)

router = APIRouter(prefix="/api/v1/connectors", tags=["connectors"])


@router.post("", response_model=ConnectorResponse, status_code=status.HTTP_201_CREATED)
def handle_create_connector(
    connector_data: ConnectorCreate,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> ConnectorResponse:
    """Create new connector for authorized data collection.
    
    **Connector Types:**
    - meta_graph: Meta/Instagram Graph API
    - google_play: Google Play Store scraper
    - virustotal: VirusTotal file reputation
    - telegram_bot: Telegram Bot API
    - x_twitter: X/Twitter API
    
    **Security:**
    - Authentication credentials encrypted in secrets manager
    - Fail-closed verification handshake before activation
    - Clear permission scopes recorded
    
    **Request Body:**
    - connector_type: Type identifier
    - name: Human-readable name
    - auth_config: Authentication credentials (encrypted)
    - permitted_scopes: OAuth scopes or permissions
    - rate_limit_rpm: Requests per minute limit
    
    **Returns:**
    - Created connector in 'unconfigured' status
    - auth_config_vault_ref NOT exposed in response
    - Must perform health check to activate
    """
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
    """List all connectors for tenant with operational health.
    
    **Connector Health Dashboard:**
    - Displays sync timestamps, failure counts, scope permissions
    - Shows last_health_check_at and last_successful_sync_at
    - Error messages for failed connectors
    
    **Status Values:**
    - active: Healthy and operational
    - degraded: Partial failures or rate limiting
    - error: Failed health check or invalid credentials
    - revoked: Credentials revoked by provider
    - unconfigured: No authentication configured
    
    **Returns:**
    - List of connectors with health status
    - Enforces tenant isolation
    - Credentials NOT exposed in response
    """
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
    """Get single connector detail.
    
    **Returns:**
    - Connector configuration and health status
    - Enforces tenant isolation (404 for foreign connectors)
    - Credentials NOT exposed
    """
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
    """Update connector configuration.
    
    **Updatable Fields:**
    - name: Display name
    - auth_config: New credentials (re-encrypted)
    - permitted_scopes: New OAuth scopes
    - rate_limit_rpm: New rate limit
    - status: Manual status override (use with caution)
    
    **Request Body:**
    - All fields optional
    - Only provided fields updated
    
    **Returns:**
    - Updated connector
    - Triggers re-authentication if auth_config changed
    """
    try:
        connector = update_connector(
            session=session,
            tenant_id=context.tenant_id,
            connector_id=connector_id,
            name=update.name,
            auth_config=update.auth_config,
            permitted_scopes=update.permitted_scopes,
            rate_limit_rpm=update.rate_limit_rpm,
            status=update.status
        )
        
        return ConnectorResponse.model_validate(connector)
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{connector_id}/health", response_model=ConnectorHealthCheck)
def handle_check_connector_health(
    connector_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> ConnectorHealthCheck:
    """Perform health check on connector.
    
    **Health Check Process:**
    - Validates authentication credentials
    - Tests API connectivity
    - Verifies permission scopes
    - Updates connector status
    
    **Returns:**
    - Current health status
    - Last check timestamp
    - Error message if unhealthy
    - Next expected sync time
    """
    status_val, error_message = check_connector_health(
        session=session,
        tenant_id=context.tenant_id,
        connector_id=connector_id
    )
    
    connector = get_connector(session, context.tenant_id, connector_id)
    
    if not connector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Connector {connector_id} not found"
        )
    
    return ConnectorHealthCheck(
        connector_id=connector.id,
        status=status_val,
        last_check=connector.last_health_check_at or connector.created_at,
        next_sync_expected=None,  # TODO: Calculate based on schedule
        error_message=error_message
    )


@router.delete("/{connector_id}", status_code=status.HTTP_204_NO_CONTENT)
def handle_delete_connector(
    connector_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> None:
    """Delete connector and revoke credentials.
    
    **Warning:**
    - Deletes connector configuration permanently
    - Revokes credentials from secrets manager
    - Orphans any findings collected via this connector
    - Cannot be undone
    
    **Cascade Behavior:**
    - Findings remain but connector_id set to NULL
    - Historical data preserved
    
    **Returns:**
    - 204 No Content on success
    - 404 if connector not found
    """
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
