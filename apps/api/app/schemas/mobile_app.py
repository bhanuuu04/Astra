"""Pydantic schemas for Mobile App Radar (forensic mobile app analysis)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field


class MobileAppFindingResponse(BaseModel):
    """Mobile app finding with forensic details."""
    id: uuid.UUID
    finding_id: uuid.UUID
    package_name: str
    app_title: str
    publisher_name: Optional[str] = None
    store_source: str  # google_play, apkmirror, apkpure, direct_download
    store_url: Optional[str] = None
    version_string: Optional[str] = None
    cert_sha256_fingerprint: Optional[str] = None
    official_cert_match: Optional[bool] = None  # TRUE = verified official, FALSE = unauthorized
    apk_sha256: Optional[str] = None
    malware_detections: Dict[str, Any]
    permissions_declared: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MobileAppRadarItem(BaseModel):
    """Combined finding + mobile app forensics for radar UI."""
    # Finding fields
    id: uuid.UUID
    finding_id: uuid.UUID
    tenant_id: uuid.UUID
    brand_id: uuid.UUID
    target_identifier: str
    observed_at: datetime
    created_at: datetime
    data_mode: str  # CRITICAL: live, synthetic_demo, manual_upload
    triage_status: str
    triage_priority: float
    risk_score: float  # Compatibility alias for triage_priority
    
    # Mobile app forensic fields
    package_name: str
    app_title: str
    publisher_name: Optional[str] = None
    store_source: str
    store_platform: str  # Compatibility alias for store_source
    store_url: Optional[str] = None
    version_string: Optional[str] = None
    cert_sha256_fingerprint: Optional[str] = None
    official_cert_match: Optional[bool] = None
    apk_sha256: Optional[str] = None
    malware_detections: Dict[str, Any]
    permissions_declared: List[str]
    impersonation_evidence: Optional[Dict[str, Any]] = None
    
    # Computed fields
    malware_status: str  # clean, suspicious, malicious, unknown
    permissions_risk: str  # low, medium, high


class MobileAppRadarListResponse(BaseModel):
    """Mobile app radar list response."""
    apps: List[MobileAppRadarItem]
    total: int
    limit: int
    offset: int


class MobileAppScanRequest(BaseModel):
    """Request APK package scan."""
    finding_id: uuid.UUID
    scan_type: str = Field(default="virustotal", description="Scan provider: virustotal, hybrid_analysis")


class MobileAppScanResponse(BaseModel):
    """APK scan response."""
    finding_id: uuid.UUID
    scan_queued: bool
    scan_id: Optional[str] = None
    message: str


class AppListingDiscoveryItem(BaseModel):
    """Adapter contract for discovered or fixture mobile app listings (Finding 2)."""
    store: str
    listing_id: str
    package_name: str
    app_title: str
    developer_id: Optional[str] = None
    developer_name: Optional[str] = None
    description: Optional[str] = None
    icon_url: Optional[str] = None
    source_url: str
    captured_at: datetime
    data_mode: str = "live"


class AppListingComparisonResult(BaseModel):
    """Result of comparing an app listing against official brand identity (Finding 2)."""
    is_official_match: bool
    exclusion_reason: Optional[str] = None
    publisher_mismatch: Optional[bool] = None
    has_resembling_description: Optional[bool] = None
    title_brand_match: bool = False
    measured_risk_score: float = 0.0
    signals: List[str] = Field(default_factory=list)
