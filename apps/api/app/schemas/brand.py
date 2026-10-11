from datetime import datetime
from typing import List, Optional
import uuid

from pydantic import BaseModel, Field


class BrandAssetCreate(BaseModel):
    asset_type: str = Field(..., description="Type of asset: domain, handle, logo, mobile_app, phone, upi, executive")
    canonical_value: str = Field(..., description="Canonical identifier or value")
    object_key: Optional[str] = None
    sha256: Optional[str] = None


class BrandAssetResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    asset_type: str
    canonical_value: str
    object_key: Optional[str] = None
    sha256: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


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
