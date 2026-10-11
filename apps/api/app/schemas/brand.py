from datetime import datetime
from typing import List, Optional
import uuid

from pydantic import BaseModel, Field


class BrandAssetCreate(BaseModel):
    asset_type: str = Field(..., description="Type of asset: domain, social_handle, mobile_app_pkg, cert_fingerprint, logo, phone, upi, executive")
    canonical_value: str = Field(..., description="Canonical identifier or value")
    object_key: Optional[str] = None
    sha256: Optional[str] = None
    metadata: Optional[dict] = Field(default_factory=dict)


class BrandAssetResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    brand_id: uuid.UUID
    asset_type: str
    canonical_value: str
    verification_status: str  # verified, pending_challenge, unverified
    verification_method: Optional[str] = None  # dns_txt, oauth_proof, manual_analyst
    verified_at: Optional[datetime] = None
    verified_by: Optional[uuid.UUID] = None
    metadata: Optional[dict] = Field(default=None, validation_alias="asset_metadata")
    object_key: Optional[str] = None
    sha256: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BrandAssetVerificationInitiate(BaseModel):
    """Request to initiate domain verification."""
    asset_id: uuid.UUID


class BrandAssetVerificationComplete(BaseModel):
    """Request to complete domain verification."""
    asset_id: uuid.UUID


class BrandAssetVerificationManual(BaseModel):
    """Request for manual verification with attestation."""
    asset_id: uuid.UUID
    reason: str = Field(..., min_length=10, description="Attestation reason for manual verification")


class BrandAssetVerificationInstructions(BaseModel):
    """Verification instructions response."""
    method: str
    domain: Optional[str] = None
    record_type: Optional[str] = None
    record_name: Optional[str] = None
    record_value: Optional[str] = None
    instructions: List[str]
    verification_check: Optional[str] = None


class BrandCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=160, description="Brand name")
    status: str = Field("active", description="Enrollment status")
    tenant_id: Optional[uuid.UUID] = None
    assets: Optional[List[BrandAssetCreate]] = None


class BrandResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    status: str
    created_at: datetime
    assets: List[BrandAssetResponse] = []

    class Config:
        from_attributes = True


class SocialProfileProbeRequest(BaseModel):
    platform: str = Field(..., description="Platform: twitter, instagram, telegram, youtube, linkedin, web")
    handle_or_url: str = Field(..., description="Handle or URL to verify")


class SocialProfileProbeResponse(BaseModel):
    is_live: bool
    canonical_url: str
    error_detail: Optional[str] = None
    status_label: str
