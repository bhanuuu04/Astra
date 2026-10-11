"""Audit logging service for comprehensive mutation tracking with before/after state."""
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.db.models import AuditLog


def log_audit_event(
    session: Session,
    tenant_id: uuid.UUID,
    actor_id: uuid.UUID,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    before_state: Optional[Dict[str, Any]] = None,
    after_state: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AuditLog:
    """Log immutable audit event with before/after state.
    
    **Standard Actions:**
    - finding_status_change: Triage status updated
    - finding_created: New finding ingested
    - takedown_approved: Response case approved
    - takedown_dispatched: Response case submitted
    - connector_added: New connector configured
    - connector_removed: Connector deleted
    - evidence_exported: Evidence downloaded
    - brand_asset_verified: Asset verification completed
    - campaign_cluster_created: Campaign cluster formed
    - campaign_edge_accepted: Graph edge confirmed
    
    **Entity Types:**
    - finding, response_case, connector, brand_asset, campaign_cluster, campaign_edge
    
    Args:
        session: Database session
        tenant_id: Tenant ID
        actor_id: User performing action
        action: Action identifier
        entity_type: Type of entity
        entity_id: Entity UUID
        before_state: State before mutation
        after_state: State after mutation
        ip_address: Client IP address
        user_agent: Client user agent
        
    Returns:
        Created AuditLog
    """
    audit_log = AuditLog(
        tenant_id=tenant_id,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_state=before_state,
        after_state=after_state,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    session.add(audit_log)
    # Note: Caller responsible for session.commit()
    
    return audit_log


def sanitize_state_for_audit(obj: Any, sensitive_fields: set = None) -> Dict[str, Any]:
    """Sanitize object state for audit logging.
    
    Removes sensitive fields like passwords, API keys, auth tokens.
    
    Args:
        obj: Object to sanitize (model instance or dict)
        sensitive_fields: Additional fields to redact
        
    Returns:
        Sanitized dict safe for audit logging
    """
    default_sensitive = {
        'password', 'password_hash', 'api_key', 'secret', 'token',
        'auth_config', 'auth_config_vault_ref', 'credential'
    }
    
    if sensitive_fields:
        default_sensitive.update(sensitive_fields)
    
    if hasattr(obj, '__dict__'):
        state = {k: v for k, v in obj.__dict__.items() if not k.startswith('_')}
    elif isinstance(obj, dict):
        state = obj.copy()
    else:
        return {}
    
    # Redact sensitive fields
    for key in list(state.keys()):
        if any(sensitive in key.lower() for sensitive in default_sensitive):
            state[key] = "[REDACTED]"
        elif isinstance(state[key], (bytes, bytearray)):
            state[key] = "[BINARY]"
        elif hasattr(state[key], 'isoformat'):  # datetime
            state[key] = state[key].isoformat()
        elif isinstance(state[key], uuid.UUID):
            state[key] = str(state[key])
    
    return state
