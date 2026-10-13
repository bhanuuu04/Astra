"""Mobile App Radar service for forensic mobile app analysis and certificate verification."""
import uuid
from typing import Dict, List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.db.models import (
    Brand,
    BrandAsset,
    Finding,
    MobileAppFinding,
)
from app.schemas.mobile_app import (
    MobileAppRadarItem,
    AppListingDiscoveryItem,
    AppListingComparisonResult,
)


def verify_certificate_match(
    session: Session,
    brand_id: uuid.UUID,
    cert_fingerprint: Optional[str]
) -> Optional[bool]:
    """Verify if certificate matches official brand certificate.
    
    Args:
        session: Database session
        brand_id: Brand identifier
        cert_fingerprint: SHA-256 certificate fingerprint to verify
        
    Returns:
        True if matches official cert, False if mismatch, None if no official cert registered
    """
    if not cert_fingerprint:
        return None
    
    # Query brand assets for official certificate fingerprints
    official_certs = session.scalars(
        select(BrandAsset).where(
            BrandAsset.brand_id == brand_id,
            BrandAsset.asset_type == 'cert_fingerprint',
            BrandAsset.verification_status == 'verified'
        )
    ).all()
    
    if not official_certs:
        return None  # No official cert registered
    
    # Check if any official cert matches
    for cert in official_certs:
        if cert.canonical_value.lower() == cert_fingerprint.lower():
            return True
    
    return False  # Cert mismatch


def calculate_malware_status(detections: Dict) -> str:
    """Calculate malware status from detection results.
    
    Args:
        detections: VirusTotal or other scanner results
        
    Returns:
        Status: clean, suspicious, malicious, unknown
    """
    if not detections:
        return "unknown"
    
    positives = detections.get("positives", 0)
    total = detections.get("total", 0)
    
    if total == 0:
        return "unknown"
    
    detection_rate = positives / total
    
    if detection_rate >= 0.3:  # 30%+ detection rate
        return "malicious"
    elif detection_rate >= 0.05:  # 5-30% detection rate
        return "suspicious"
    else:
        return "clean"


def calculate_permissions_risk(permissions: List[str]) -> str:
    """Calculate risk level based on declared permissions.
    
    Args:
        permissions: List of Android permissions
        
    Returns:
        Risk level: low, medium, high
    """
    if not permissions:
        return "low"
    
    high_risk_permissions = {
        "READ_SMS", "SEND_SMS", "RECEIVE_SMS",
        "READ_CONTACTS", "WRITE_CONTACTS",
        "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION",
        "RECORD_AUDIO", "CAMERA",
        "READ_CALL_LOG", "WRITE_CALL_LOG",
        "CALL_PHONE", "READ_PHONE_STATE",
        "SYSTEM_ALERT_WINDOW", "REQUEST_INSTALL_PACKAGES"
    }
    
    medium_risk_permissions = {
        "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE",
        "ACCESS_NETWORK_STATE", "INTERNET",
        "WAKE_LOCK", "VIBRATE"
    }
    
    high_risk_count = sum(1 for p in permissions if p in high_risk_permissions)
    medium_risk_count = sum(1 for p in permissions if p in medium_risk_permissions)
    
    if high_risk_count >= 3:
        return "high"
    elif high_risk_count >= 1 or medium_risk_count >= 5:
        return "medium"
    else:
        return "low"


def get_mobile_app_radar(
    session: Session,
    tenant_id: uuid.UUID,
    brand_id: Optional[uuid.UUID] = None,
    store_source: Optional[str] = None,
    triage_status: Optional[str] = None,
    cert_match_status: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[MobileAppRadarItem], int]:
    """Get mobile app radar with forensic analysis.
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        brand_id: Optional brand filter
        store_source: Optional store filter
        triage_status: Optional status filter
        cert_match_status: Optional cert match filter (True=matched, False=mismatch, None=any)
        limit: Page size
        offset: Page offset
        
    Returns:
        Tuple of (radar items, total count)
    """
    # Join findings with mobile_app_findings
    query = (
        select(Finding, MobileAppFinding)
        .join(MobileAppFinding, Finding.id == MobileAppFinding.finding_id)
        .where(Finding.tenant_id == tenant_id)
        .where(Finding.source_kind == 'mobile_app')
    )
    
    if brand_id:
        query = query.where(Finding.brand_id == brand_id)
    if store_source:
        query = query.where(MobileAppFinding.store_source == store_source)
    if triage_status:
        query = query.where(Finding.triage_status == triage_status)
    if cert_match_status is not None:
        query = query.where(MobileAppFinding.official_cert_match == cert_match_status)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = session.scalar(count_query) or 0
    
    # Apply pagination and ordering
    query = query.order_by(Finding.triage_priority.desc(), Finding.observed_at.desc())
    query = query.limit(limit).offset(offset)
    
    results = list(session.execute(query).all())
    
    # Build radar items
    radar_items = []
    for finding, app_finding in results:
        malware_status = calculate_malware_status(app_finding.malware_detections or {})
        permissions_risk = calculate_permissions_risk(app_finding.permissions_declared or [])
        
        radar_items.append(MobileAppRadarItem(
            id=finding.id,
            finding_id=finding.id,
            tenant_id=finding.tenant_id,
            brand_id=finding.brand_id,
            target_identifier=finding.target_identifier,
            observed_at=finding.observed_at,
            created_at=finding.created_at or finding.observed_at,
            data_mode=finding.data_mode,
            triage_status=finding.triage_status,
            triage_priority=finding.triage_priority,
            risk_score=finding.triage_priority,
            package_name=app_finding.package_name,
            app_title=app_finding.app_title,
            publisher_name=app_finding.publisher_name,
            store_source=app_finding.store_source,
            store_platform=app_finding.store_source,
            store_url=app_finding.store_url,
            version_string=app_finding.version_string,
            cert_sha256_fingerprint=app_finding.cert_sha256_fingerprint,
            official_cert_match=app_finding.official_cert_match,
            apk_sha256=app_finding.apk_sha256,
            malware_detections=app_finding.malware_detections or {},
            permissions_declared=app_finding.permissions_declared or [],
            impersonation_evidence=finding.normalized_attributes,
            malware_status=malware_status,
            permissions_risk=permissions_risk
        ))
    
    return radar_items, total


def create_mobile_app_finding(
    session: Session,
    finding_id: uuid.UUID,
    package_name: str,
    app_title: str,
    store_source: str,
    publisher_name: Optional[str] = None,
    store_url: Optional[str] = None,
    version_string: Optional[str] = None,
    cert_sha256_fingerprint: Optional[str] = None,
    apk_sha256: Optional[str] = None,
    permissions_declared: Optional[List[str]] = None
) -> MobileAppFinding:
    """Create mobile app finding with forensic details.
    
    Args:
        session: Database session
        finding_id: Parent finding ID
        package_name: Android package name
        app_title: App display title
        store_source: Store source (google_play, apkmirror, etc.)
        publisher_name: Publisher/developer name
        store_url: Store listing URL
        version_string: Version string
        cert_sha256_fingerprint: APK signing certificate fingerprint
        apk_sha256: APK file hash
        permissions_declared: List of Android permissions
        
    Returns:
        Created MobileAppFinding
    """
    # Get finding to determine brand
    finding = session.scalar(select(Finding).where(Finding.id == finding_id))
    if not finding:
        raise ValueError(f"Finding {finding_id} not found")
    
    # Verify certificate against brand assets
    official_cert_match = verify_certificate_match(
        session,
        finding.brand_id,
        cert_sha256_fingerprint
    )
    
    app_finding = MobileAppFinding(
        finding_id=finding_id,
        package_name=package_name,
        app_title=app_title,
        publisher_name=publisher_name,
        store_source=store_source,
        store_url=store_url,
        version_string=version_string,
        cert_sha256_fingerprint=cert_sha256_fingerprint,
        official_cert_match=official_cert_match,
        apk_sha256=apk_sha256,
        malware_detections={},
        permissions_declared=permissions_declared or []
    )
    
    session.add(app_finding)
    session.commit()
    
    return app_finding


def update_malware_scan_results(
    session: Session,
    finding_id: uuid.UUID,
    scan_results: Dict
) -> MobileAppFinding:
    """Update mobile app finding with malware scan results.
    
    Args:
        session: Database session
        finding_id: Finding ID
        scan_results: VirusTotal or scanner results
        
    Returns:
        Updated MobileAppFinding
        
    Raises:
        ValueError: If app finding not found
    """
    app_finding = session.scalar(
        select(MobileAppFinding).where(MobileAppFinding.finding_id == finding_id)
    )
    
    if not app_finding:
        raise ValueError(f"Mobile app finding for {finding_id} not found")
    
    app_finding.malware_detections = scan_results
    session.commit()
    
    return app_finding


def queue_apk_scan(
    session: Session,
    tenant_id: uuid.UUID,
    finding_id: uuid.UUID,
    scan_type: str = "virustotal"
) -> Tuple[bool, str]:
    """Queue APK package scan (async operation).
    
    Args:
        session: Database session
        tenant_id: Tenant ID (enforced)
        finding_id: Finding to scan
        scan_type: Scanner type (virustotal, hybrid_analysis)
        
    Returns:
        Tuple of (queued, message)
    """
    # Verify finding exists and belongs to tenant
    finding = session.scalar(
        select(Finding).where(
            Finding.id == finding_id,
            Finding.tenant_id == tenant_id,
            Finding.source_kind == 'mobile_app'
        )
    )
    
    if not finding:
        return False, "Finding not found or not a mobile app"
    
    # Check if mobile app finding exists
    app_finding = session.scalar(
        select(MobileAppFinding).where(MobileAppFinding.finding_id == finding_id)
    )
    
    if not app_finding:
        return False, "Mobile app forensic data not found"
    
    if not app_finding.apk_sha256:
        return False, "APK hash not available for scanning"
    
    # Return unsupported until asynchronous worker queue is implemented
    return False, f"Package scanning with {scan_type} is currently unsupported: asynchronous package sandboxing worker not configured"


def compare_app_listing_against_brand(
    session: Session,
    brand: Brand,
    listing: AppListingDiscoveryItem,
) -> AppListingComparisonResult:
    """Compare an external app listing against official brand identity (Finding 2).

    1. Compares official store & package/bundle IDs first (exact exclusion).
    2. Compares publisher / developer identity if registered.
    3. Compares app title / name against brand tokens.
    4. Evaluates description for resembling content or impersonation keywords.
    5. Returns an explainable comparison result without manufacturing missing evidence.
    """
    # 1. Compare official package/bundle IDs registered for the brand
    brand_assets = list(session.scalars(select(BrandAsset).where(BrandAsset.brand_id == brand.id)).all())
    official_packages = {
        a.canonical_value.lower()
        for a in brand_assets
        if a.asset_type in ("mobile_app", "mobile_app_pkg")
    }

    pkg_clean = (listing.package_name or "").lower().strip()
    if pkg_clean and pkg_clean in official_packages:
        return AppListingComparisonResult(
            is_official_match=True,
            exclusion_reason=f"Matches verified official app package '{pkg_clean}'.",
            publisher_mismatch=False,
            has_resembling_description=False,
            title_brand_match=True,
            measured_risk_score=0.0,
            signals=["official_asset_match"],
        )

    # 2. Check title brand match
    brand_name_lower = brand.name.lower()
    title_lower = (listing.app_title or "").lower()
    title_brand_match = brand_name_lower in title_lower

    # 3. Check publisher identity against brand or official publisher assets
    official_publishers = {
        (a.asset_metadata or {}).get("publisher_name", "").lower()
        for a in brand_assets
        if (a.asset_metadata or {}).get("publisher_name")
    }
    official_publishers.add(brand_name_lower)

    dev_name_clean = (listing.developer_name or "").lower().strip()
    publisher_mismatch: Optional[bool] = None
    if dev_name_clean:
        if any(pub and (pub in dev_name_clean or dev_name_clean in pub) for pub in official_publishers):
            publisher_mismatch = False
        else:
            publisher_mismatch = True

    # 4. Check description resemblance
    desc_clean = (listing.description or "").lower()
    has_resembling_description: Optional[bool] = None
    if desc_clean:
        has_resembling_description = brand_name_lower in desc_clean or any(
            kw in desc_clean for kw in ("official app", "customer care", "account login", "verify otp")
        )

    # 5. Calculate measured risk score based only on measured features
    signals = []
    score = 0.0
    if title_brand_match:
        signals.append("brand_title_match")
        score += 0.35
    if publisher_mismatch is True:
        signals.append("publisher_mismatch")
        score += 0.30
    if has_resembling_description is True:
        signals.append("resembling_description")
        score += 0.20
    if listing.icon_url:
        signals.append("icon_present")

    return AppListingComparisonResult(
        is_official_match=False,
        exclusion_reason=None,
        publisher_mismatch=publisher_mismatch,
        has_resembling_description=has_resembling_description,
        title_brand_match=title_brand_match,
        measured_risk_score=min(1.0, score),
        signals=signals,
    )
