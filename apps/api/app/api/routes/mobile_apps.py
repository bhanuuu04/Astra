"""Mobile App Radar API endpoints for forensic mobile app analysis."""
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_write_permission
from app.db.models import Brand
from app.db.session import get_session
from app.domain.mobile_app_service import (
    get_mobile_app_radar,
    queue_apk_scan,
)
from app.domain.store_scanner import (
    analyze_single_store_url_or_pkg,
    scan_and_ingest_mobile_store_apps,
)
from app.schemas.mobile_app import (
    MobileAppRadarListResponse,
    MobileAppScanRequest,
    MobileAppScanResponse,
    StoreAppAnalyzeRequest,
    StoreAppAnalyzeResponse,
    StoreAppScanRequest,
    StoreAppScanResponse,
)

router = APIRouter(prefix="/api/v1/apps", tags=["mobile_apps"])


@router.get("/radar", response_model=MobileAppRadarListResponse)
def handle_get_mobile_app_radar(
    brand_id: Optional[uuid.UUID] = Query(None, description="Filter by brand"),
    store_source: Optional[str] = Query(None, description="Filter by store: google_play, apkmirror, apkpure, direct_download"),
    triage_status: Optional[str] = Query(None, description="Filter by triage status"),
    cert_match_status: Optional[bool] = Query(None, description="Filter by certificate match: true=matched, false=mismatch"),
    limit: int = Query(50, ge=1, le=200, description="Page size"),
    offset: int = Query(0, ge=0, description="Page offset"),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> MobileAppRadarListResponse:
    """Get Mobile App Radar with certificate verification and forensic analysis.
    
    **Real-Time Mobile Risk Analysis:**
    - Compares third-party APKs against verified official brand apps
    - Certificate signature verification (SHA-256 fingerprint matching)
    - Malware detection status (clean, suspicious, malicious, unknown)
    - Permissions risk assessment (low, medium, high)
    
    **Contract Guarantee:**
    - Field names match UI models exactly:
      - package_name, cert_sha256, official_cert_match
      - malware_status, permissions_risk, triage_status
    - data_mode field indicates: LIVE | SYNTHETIC_DEMO | MANUAL_UPLOAD
    
    **Certificate Match Status:**
    - TRUE: Certificate matches official brand asset (verified)
    - FALSE: Certificate mismatch (UNAUTHORIZED FINGERPRINT)
    - NULL: No official certificate registered for comparison
    
    **Returns:**
    - Paginated list of mobile app findings with forensic details
    - Each item includes complete forensic breakdown
    - Ordered by triage_priority DESC, observed_at DESC
    """
    apps, total = get_mobile_app_radar(
        session=session,
        tenant_id=context.tenant_id,
        brand_id=brand_id,
        store_source=store_source,
        triage_status=triage_status,
        cert_match_status=cert_match_status,
        limit=limit,
        offset=offset
    )
    
    return MobileAppRadarListResponse(
        apps=apps,
        total=total,
        limit=limit,
        offset=offset
    )


@router.post("/{finding_id}/scan-package", response_model=MobileAppScanResponse)
def handle_scan_app_package(
    finding_id: uuid.UUID,
    request: MobileAppScanRequest,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> MobileAppScanResponse:
    """Submit APK package hash for malware scanning (async operation).
    
    **Security Control:**
    - Sandboxed execution; no binary processing in API process
    - Submits hash to VirusTotal or other multi-engine scanners
    - Scan results updated asynchronously via background worker
    
    **Workflow:**
    1. Validates finding exists and belongs to tenant
    2. Checks APK hash is available
    3. Queues scan job with selected provider
    4. Returns scan ID for status tracking
    
    **Scan Providers:**
    - virustotal: VirusTotal multi-engine scanning
    - hybrid_analysis: Hybrid Analysis sandbox
    
    **Path Parameters:**
    - finding_id: Finding UUID (must be mobile_app source_kind)
    
    **Request Body:**
    - scan_type: Scanner provider (default: virustotal)
    
    **Returns:**
    - scan_queued: Boolean success indicator
    - scan_id: External scan reference ID (if available)
    - message: Human-readable status message
    
    **Notes:**
    - Actual scan results populated asynchronously
    - Check GET /findings/{id} for updated malware_detections
    - Enforces tenant isolation
    """
    queued, message = queue_apk_scan(
        session=session,
        tenant_id=context.tenant_id,
        finding_id=finding_id,
        scan_type=request.scan_type
    )
    
    if not queued:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    return MobileAppScanResponse(
        finding_id=finding_id,
        scan_queued=queued,
        scan_id=None,  # TODO: Return actual scan ID from queue
        message=message
    )


@router.post("/scan", response_model=StoreAppScanResponse)
def handle_scan_store_apps(
    request: Optional[StoreAppScanRequest] = None,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> StoreAppScanResponse:
    """Scan Apple App Store & Google Play for brand app impersonations.

    - Queries live listings on Google Play & Apple App Store
    - Performs heuristic and publisher identity comparison against brand
    - Calculates impersonation risk score and detects rogue lookalikes
    - Automatically ingests verified findings into Mobile App Radar and Sightings queue
    """
    from sqlalchemy import select

    brand_id = request.brand_id if request else None

    # Resolve brand
    if brand_id:
        brand = session.scalar(select(Brand).where(Brand.id == brand_id, Brand.tenant_id == context.tenant_id))
    else:
        brand = session.scalar(select(Brand).where(Brand.tenant_id == context.tenant_id).order_by(Brand.created_at.desc()))

    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No enrolled brand found for this workspace. Please enroll a brand first."
        )

    discovered_apps = scan_and_ingest_mobile_store_apps(session, brand, context.tenant_id)
    threats = [a for a in discovered_apps if a.get("is_threat")]

    return StoreAppScanResponse(
        brand_id=brand.id,
        brand_name=brand.name,
        total_discovered=len(discovered_apps),
        threats_detected=len(threats),
        apps=discovered_apps,
        message=f"App store audit complete for '{brand.name}'. Analyzed {len(discovered_apps)} public store applications; {len(threats)} potential brand impersonators flagged."
    )


@router.post("/analyze-listing", response_model=StoreAppAnalyzeResponse)
def handle_analyze_store_listing(
    request: StoreAppAnalyzeRequest,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> StoreAppAnalyzeResponse:
    """Analyze any arbitrary Google Play or App Store listing or package ID on demand.

    Inspects developer identity, title, package, and description keywords to determine
    whether it impersonates the specified or active brand.
    """
    from sqlalchemy import select
    from app.db.models import BrandAsset

    brand_id = request.brand_id
    if brand_id:
        brand = session.scalar(select(Brand).where(Brand.id == brand_id, Brand.tenant_id == context.tenant_id))
    else:
        brand = session.scalar(select(Brand).where(Brand.tenant_id == context.tenant_id).order_by(Brand.created_at.desc()))

    brand_name = brand.name if brand else "Brand"
    official_packages: list[str] = []
    official_publishers: list[str] = []

    if brand:
        brand_assets = list(session.scalars(select(BrandAsset).where(BrandAsset.brand_id == brand.id)).all())
        official_packages = [
            a.canonical_value.lower().strip()
            for a in brand_assets
            if a.asset_type in ("mobile_app", "mobile_app_pkg")
        ]
        official_publishers = [
            (a.asset_metadata or {}).get("publisher_name", "").strip()
            for a in brand_assets
            if (a.asset_metadata or {}).get("publisher_name")
        ]
        official_publishers.append(brand.name)

    result = analyze_single_store_url_or_pkg(
        url_or_pkg=request.url_or_package,
        brand_name=brand_name,
        official_packages=official_packages,
        official_publishers=official_publishers,
    )

    return StoreAppAnalyzeResponse(
        app_info=result["app_info"],
        evaluation=result["evaluation"],
    )

