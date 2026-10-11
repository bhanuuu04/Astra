"""Finding ingestion and management service with evidence sealing and idempotency."""
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.db.models import (
    Brand,
    Connector,
    EvidenceObject,
    Finding,
    MobileAppFinding,
    Signal,
)
from app.domain.audit_service import log_audit_event, sanitize_state_for_audit
from app.storage.evidence_storage import save_evidence_content
from app.schemas.finding import (
    FindingIngest,
    FindingTriageSignal,
    FindingIngestResponse,
)


def seal_evidence(
    session: Session,
    finding_id: uuid.UUID,
    raw_payload: Dict[str, Any],
    evidence_files: List[Dict[str, str]]
) -> Optional[uuid.UUID]:
    """Seal raw evidence with SHA-256 digest before any parsing.
    
    Persists evidence bytes to the durable storage vault and registers
    the cryptographic digest in EvidenceObject linked to the finding.
    
    Args:
        session: Database session
        finding_id: Finding ID to link evidence
        raw_payload: Raw JSON payload from source
        evidence_files: List of evidence file references
        
    Returns:
        Evidence object ID if sealed, None if no evidence
    """
    if not raw_payload and not evidence_files:
        return None
    
    # Create deterministic evidence content
    evidence_content = json.dumps(raw_payload, sort_keys=True).encode('utf-8')
    sha256_digest = hashlib.sha256(evidence_content).hexdigest()
    
    # Generate unique object key
    now_utc = datetime.now(timezone.utc)
    object_key = f"findings/{finding_id}/evidence_{now_utc.strftime('%Y%m%d_%H%M%S')}.json"
    
    # Persist raw evidence bytes to durable storage vault
    save_evidence_content(object_key, evidence_content)
    
    # Store evidence object linked directly to finding_id
    evidence = EvidenceObject(
        sighting_id=None,
        finding_id=finding_id,
        object_key=object_key,
        media_type="application/json",
        sha256=sha256_digest,
        captured_at=now_utc,
        provenance={
            "sealed_at": now_utc.isoformat(),
            "evidence_files": evidence_files,
            "raw_payload_hash": sha256_digest
        }
    )
    
    session.add(evidence)
    session.flush()
    
    return evidence.id


def calculate_triage_priority(
    session: Session,
    finding: Finding,
    brand: Brand,
    normalized_attrs: Dict[str, Any]
) -> Tuple[float, List[FindingTriageSignal]]:
    """Calculate triage priority with explainable feature breakdown.
    
    Returns priority score (0.0-1.0) and list of contributing signals.
    
    Args:
        session: Database session
        finding: Finding object
        brand: Brand object
        normalized_attrs: Normalized finding attributes
        
    Returns:
        Tuple of (priority_score, signals)
    """
    signals: List[FindingTriageSignal] = []
    total_score = 0.0
    
    # Signal 1: Brand token match
    brand_name_lower = brand.name.lower()
    target_lower = finding.target_identifier.lower()
    
    if brand_name_lower in target_lower:
        brand_match_score = 0.30
        total_score += brand_match_score
        signals.append(FindingTriageSignal(
            detector_key="brand_token_match",
            detector_version="1.0.0",
            score=brand_match_score,
            explanation=f"Target identifier contains brand name '{brand.name}'",
            feature_values={"brand_name": brand.name, "target": finding.target_identifier}
        ))
    
    # Signal 2: Recent observation (recency boost)
    now_utc = datetime.now(timezone.utc)
    obs = finding.observed_at
    if obs.tzinfo is None:
        obs = obs.replace(tzinfo=timezone.utc)
    time_delta = (now_utc - obs).total_seconds()
    hours_ago = max(0.0, time_delta / 3600)
    
    if hours_ago < 24:
        recency_score = 0.15
        total_score += recency_score
        signals.append(FindingTriageSignal(
            detector_key="recent_observation",
            detector_version="1.0.0",
            score=recency_score,
            explanation=f"Observed {hours_ago:.1f} hours ago (recent activity)",
            feature_values={"hours_ago": hours_ago, "observed_at": obs.isoformat()}
        ))
    
    # Signal 3: High-risk surface
    high_risk_surfaces = ["google_play", "third_party_apk", "telegram"]
    if finding.surface in high_risk_surfaces:
        surface_score = 0.20
        total_score += surface_score
        signals.append(FindingTriageSignal(
            detector_key="high_risk_surface",
            detector_version="1.0.0",
            score=surface_score,
            explanation=f"Surface '{finding.surface}' is high-risk for brand impersonation",
            feature_values={"surface": finding.surface}
        ))
    
    # Signal 4: Suspicious attributes from normalized data
    suspicious_keywords = ["support", "official", "help", "customer", "security", "verify"]
    if any(keyword in target_lower for keyword in suspicious_keywords):
        keyword_score = 0.25
        total_score += keyword_score
        matched_keywords = [kw for kw in suspicious_keywords if kw in target_lower]
        signals.append(FindingTriageSignal(
            detector_key="suspicious_keywords",
            detector_version="1.0.0",
            score=keyword_score,
            explanation=f"Contains suspicious keywords: {', '.join(matched_keywords)}",
            feature_values={"matched_keywords": matched_keywords}
        ))
    
    # Signal 5: Certificate mismatch (mobile apps)
    if normalized_attrs.get("cert_mismatch"):
        cert_score = 0.40
        total_score += cert_score
        signals.append(FindingTriageSignal(
            detector_key="certificate_mismatch",
            detector_version="1.0.0",
            score=cert_score,
            explanation="APK signing certificate does not match official brand certificate",
            feature_values={"cert_fingerprint": normalized_attrs.get("cert_fingerprint")}
        ))
    
    # Normalize score to 0.0-1.0
    priority = min(1.0, total_score)
    
    return priority, signals


def ingest_finding(
    session: Session,
    tenant_id: uuid.UUID,
    finding_data: FindingIngest
) -> FindingIngestResponse:
    """Ingest a single finding with idempotency, evidence sealing, and triage scoring.
    
    Args:
        session: Database session
        tenant_id: Tenant ID from auth context
        finding_data: Finding ingestion payload
        
    Returns:
        FindingIngestResponse with priority and signals
        
    Raises:
        ValueError: If brand not found or invalid data
    """
    # Verify brand exists and belongs to tenant
    brand = session.scalar(
        select(Brand).where(
            Brand.id == finding_data.brand_id,
            Brand.tenant_id == tenant_id
        )
    )
    if not brand:
        raise ValueError(f"Brand {finding_data.brand_id} not found for tenant {tenant_id}")
    
    # Check for existing finding (idempotency)
    existing = session.scalar(
        select(Finding).where(
            Finding.tenant_id == tenant_id,
            Finding.surface == finding_data.surface,
            Finding.external_id == finding_data.external_id
        )
    )
    
    if existing:
        # Return existing finding with current triage info
        signals = session.scalars(
            select(Signal).where(Signal.sighting_id == existing.id)
        ).all()
        
        signal_schemas = [
            FindingTriageSignal(
                detector_key=s.detector_key,
                detector_version=s.detector_version,
                score=s.score,
                explanation=s.explanation,
                feature_values=s.feature_values
            )
            for s in signals
        ]
        
        return FindingIngestResponse(
            finding_id=existing.id,
            triage_priority=existing.triage_priority,
            signals=signal_schemas,
            data_mode=existing.data_mode
        )
    
    # Create new finding
    now_utc = datetime.now(timezone.utc)
    obs = finding_data.observed_at
    if obs.tzinfo is None:
        obs = obs.replace(tzinfo=timezone.utc)

    finding = Finding(
        tenant_id=tenant_id,
        brand_id=finding_data.brand_id,
        connector_id=None,  # TODO: resolve from ingestion context
        source_kind=finding_data.source_kind,
        surface=finding_data.surface,
        external_id=finding_data.external_id,
        target_identifier=finding_data.target_identifier,
        observed_at=obs,
        collected_at=now_utc,
        data_mode=finding_data.data_mode,
        normalized_attributes=finding_data.normalized_attributes or {},
        triage_status="pending",
        triage_priority=0.0
    )
    
    session.add(finding)
    session.flush()
    
    # Seal evidence
    if finding_data.raw_payload or finding_data.evidence_files:
        evidence_id = seal_evidence(
            session,
            finding.id,
            finding_data.raw_payload or {},
            finding_data.evidence_files or []
        )
        finding.raw_evidence_id = evidence_id
    
    # Calculate triage priority with explainable signals
    priority, signal_list = calculate_triage_priority(
        session,
        finding,
        brand,
        finding_data.normalized_attributes or {}
    )
    
    finding.triage_priority = priority
    
    # Store signals linked directly to finding_id
    for sig in signal_list:
        signal = Signal(
            sighting_id=None,
            finding_id=finding.id,
            detector_key=sig.detector_key,
            detector_version=sig.detector_version,
            score=sig.score,
            threshold=0.5,  # Default threshold
            explanation=sig.explanation,
            feature_values=sig.feature_values
        )
        session.add(signal)
    
    session.commit()
    
    return FindingIngestResponse(
        finding_id=finding.id,
        triage_priority=priority,
        signals=signal_list,
        data_mode=finding.data_mode
    )


def list_findings(
    session: Session,
    tenant_id: uuid.UUID,
    brand_id: Optional[uuid.UUID] = None,
    surface: Optional[str] = None,
    triage_status: Optional[str] = None,
    min_priority: Optional[float] = None,
    data_mode: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[Finding], int]:
    """List findings with filters.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        brand_id: Optional brand filter
        surface: Optional surface filter
        triage_status: Optional status filter
        min_priority: Minimum triage priority
        data_mode: Filter by data mode
        limit: Page size
        offset: Page offset
        
    Returns:
        Tuple of (findings list, total count)
    """
    query = select(Finding).where(Finding.tenant_id == tenant_id)
    
    if brand_id:
        query = query.where(Finding.brand_id == brand_id)
    if surface:
        query = query.where(Finding.surface == surface)
    if triage_status:
        query = query.where(Finding.triage_status == triage_status)
    if min_priority is not None:
        query = query.where(Finding.triage_priority >= min_priority)
    if data_mode:
        query = query.where(Finding.data_mode == data_mode)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = session.scalar(count_query) or 0
    
    # Apply pagination and ordering
    query = query.order_by(Finding.triage_priority.desc(), Finding.observed_at.desc())
    query = query.limit(limit).offset(offset)
    
    findings = list(session.scalars(query).all())
    
    return findings, total


VALID_TRIAGE_STATUSES = {"pending", "investigating", "confirmed_threat", "false_positive", "needs_evidence"}


def update_finding_triage(
    session: Session,
    tenant_id: uuid.UUID,
    finding_id: uuid.UUID,
    triage_status: str,
    rationale: str,
    actor_id: uuid.UUID,
    analyst_id: Optional[uuid.UUID] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Finding:
    """Update finding triage status with enforced audit trail and strict validation.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        finding_id: Finding to update
        triage_status: New status (must be valid triage enum)
        rationale: Analyst rationale
        actor_id: Authenticated user ID performing triage
        analyst_id: Optional analyst assignment
        ip_address: Client IP for audit
        user_agent: Client user agent for audit
        
    Returns:
        Updated finding
        
    Raises:
        ValueError: If finding not found or status invalid
    """
    if triage_status not in VALID_TRIAGE_STATUSES:
        raise ValueError(
            f"Invalid triage status '{triage_status}'. Valid statuses are: {', '.join(sorted(VALID_TRIAGE_STATUSES))}"
        )

    finding = session.scalar(
        select(Finding).where(
            Finding.id == finding_id,
            Finding.tenant_id == tenant_id
        )
    )
    
    if not finding:
        raise ValueError(f"Finding {finding_id} not found or access denied")
    
    # Capture before state for audit
    before_state = sanitize_state_for_audit(finding)
    
    # Update status
    old_status = finding.triage_status
    finding.triage_status = triage_status
    
    if analyst_id:
        finding.assigned_analyst_id = analyst_id
    elif not finding.assigned_analyst_id:
        finding.assigned_analyst_id = actor_id
    
    # Store rationale in normalized_attributes
    if not finding.normalized_attributes:
        finding.normalized_attributes = {}
    
    if 'triage_history' not in finding.normalized_attributes:
        finding.normalized_attributes['triage_history'] = []
    
    now_utc = datetime.now(timezone.utc)
    finding.normalized_attributes['triage_history'].append({
        "timestamp": now_utc.isoformat(),
        "old_status": old_status,
        "new_status": triage_status,
        "rationale": rationale,
        "actor_id": str(actor_id),
        "analyst_id": str(finding.assigned_analyst_id) if finding.assigned_analyst_id else None
    })
    
    session.flush()
    
    # Capture after state and log audit event (ALWAYS logged with authenticated actor_id)
    after_state = sanitize_state_for_audit(finding)
    
    log_audit_event(
        session=session,
        tenant_id=tenant_id,
        actor_id=actor_id,
        action="finding_status_change",
        entity_type="finding",
        entity_id=finding.id,
        before_state=before_state,
        after_state=after_state,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    session.commit()
    
    return finding


def get_finding_with_signals(
    session: Session,
    tenant_id: uuid.UUID,
    finding_id: uuid.UUID
) -> Optional[Tuple[Finding, List[Signal]]]:
    """Get finding with associated signals.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        finding_id: Finding ID
        
    Returns:
        Tuple of (finding, signals) or None if not found
    """
    finding = session.scalar(
        select(Finding).where(
            Finding.id == finding_id,
            Finding.tenant_id == tenant_id
        )
    )
    
    if not finding:
        return None
    
    signals = list(
        session.scalars(
            select(Signal).where(
                (Signal.finding_id == finding.id) | (Signal.sighting_id == finding.id)
            )
        ).all()
    )
    
    return finding, signals
