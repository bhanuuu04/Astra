"""Connector management service for authorized data source configuration."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.db.models import Connector


def create_connector(
    session: Session,
    tenant_id: uuid.UUID,
    connector_type: str,
    name: str,
    auth_config: Optional[dict] = None,
    permitted_scopes: Optional[List[str]] = None,
    rate_limit_rpm: int = 60
) -> Connector:
    """Create a new connector configuration.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        connector_type: Connector type (meta_graph, google_play, etc.)
        name: Human-readable name
        auth_config: Authentication credentials (will be encrypted)
        permitted_scopes: OAuth scopes or permissions
        rate_limit_rpm: Rate limit in requests per minute
        
    Returns:
        Created Connector
    """
    # TODO: Encrypt auth_config before storing
    # For now, store as JSON reference
    auth_vault_ref = None
    if auth_config:
        # In production: encrypt and store in secrets manager
        # auth_vault_ref = secrets_manager.store(auth_config)
        auth_vault_ref = "vault://encrypted/connector/" + str(uuid.uuid4())
    
    connector = Connector(
        tenant_id=tenant_id,
        connector_type=connector_type,
        name=name,
        status="unconfigured",
        auth_config_vault_ref=auth_vault_ref,
        permitted_scopes=permitted_scopes or [],
        rate_limit_rpm=rate_limit_rpm
    )
    
    session.add(connector)
    session.commit()
    
    return connector


def list_connectors(
    session: Session,
    tenant_id: uuid.UUID,
    connector_type: Optional[str] = None,
    status: Optional[str] = None
) -> List[Connector]:
    """List connectors for tenant.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        connector_type: Optional type filter
        status: Optional status filter
        
    Returns:
        List of connectors
    """
    query = select(Connector).where(Connector.tenant_id == tenant_id)
    
    if connector_type:
        query = query.where(Connector.connector_type == connector_type)
    if status:
        query = query.where(Connector.status == status)
    
    query = query.order_by(Connector.created_at.desc())
    
    return list(session.scalars(query).all())


def get_connector(
    session: Session,
    tenant_id: uuid.UUID,
    connector_id: uuid.UUID
) -> Optional[Connector]:
    """Get single connector.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        connector_id: Connector ID
        
    Returns:
        Connector or None if not found
    """
    return session.scalar(
        select(Connector).where(
            Connector.id == connector_id,
            Connector.tenant_id == tenant_id
        )
    )


def update_connector(
    session: Session,
    tenant_id: uuid.UUID,
    connector_id: uuid.UUID,
    name: Optional[str] = None,
    auth_config: Optional[dict] = None,
    permitted_scopes: Optional[List[str]] = None,
    rate_limit_rpm: Optional[int] = None,
    status: Optional[str] = None
) -> Connector:
    """Update connector configuration.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        connector_id: Connector to update
        name: New name
        auth_config: New auth config
        permitted_scopes: New scopes
        rate_limit_rpm: New rate limit
        status: New status
        
    Returns:
        Updated Connector
        
    Raises:
        ValueError: If connector not found
    """
    connector = get_connector(session, tenant_id, connector_id)
    
    if not connector:
        raise ValueError(f"Connector {connector_id} not found")
    
    if name is not None:
        connector.name = name
    
    if auth_config is not None:
        # TODO: Encrypt and store in secrets manager
        connector.auth_config_vault_ref = "vault://encrypted/connector/" + str(uuid.uuid4())
    
    if permitted_scopes is not None:
        connector.permitted_scopes = permitted_scopes
    
    if rate_limit_rpm is not None:
        connector.rate_limit_rpm = rate_limit_rpm
    
    if status is not None:
        connector.status = status
    
    session.commit()
    
    return connector


def check_connector_health(
    session: Session,
    tenant_id: uuid.UUID,
    connector_id: uuid.UUID
) -> Tuple[str, Optional[str]]:
    """Check connector health and update status.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        connector_id: Connector to check
        
    Returns:
        Tuple of (status, error_message)
    """
    connector = get_connector(session, tenant_id, connector_id)
    
    if not connector:
        return "error", "Connector not found"
    
    connector.last_health_check_at = datetime.now(timezone.utc)
    
    # Truthful health check: verify credentials and actual pipeline sync
    if not connector.auth_config_vault_ref:
        connector.status = "unconfigured"
        connector.error_message = "No authentication configuration registered."
    elif connector.last_successful_sync_at is None:
        connector.status = "unconfigured"
        connector.error_message = "Awaiting initial verified synchronization."
    else:
        connector.status = "active"
        connector.error_message = None
    
    session.commit()
    
    return connector.status, connector.error_message


def record_connector_sync(
    session: Session,
    connector_id: uuid.UUID,
    success: bool,
    error_message: Optional[str] = None
) -> None:
    """Record connector sync attempt.
    
    Args:
        session: Database session
        connector_id: Connector ID
        success: Whether sync succeeded
        error_message: Error message if failed
    """
    connector = session.scalar(
        select(Connector).where(Connector.id == connector_id)
    )
    
    if not connector:
        return
    
    if success:
        connector.last_successful_sync_at = datetime.utcnow()
        connector.status = "active"
        connector.error_message = None
    else:
        connector.status = "error"
        connector.error_message = error_message
    
    connector.last_health_check_at = datetime.utcnow()
    session.commit()


def delete_connector(
    session: Session,
    tenant_id: uuid.UUID,
    connector_id: uuid.UUID
) -> bool:
    """Delete connector.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        connector_id: Connector to delete
        
    Returns:
        True if deleted, False if not found
    """
    connector = get_connector(session, tenant_id, connector_id)
    
    if not connector:
        return False
    
    # TODO: Revoke credentials from secrets manager
    
    session.delete(connector)
    session.commit()
    
    return True
