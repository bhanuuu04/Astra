from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, description="User business email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password (min 8 characters)")
    full_name: str = Field(..., min_length=2, max_length=255, description="Full name of user")
    organization_name: str = Field(..., min_length=2, max_length=160, description="Organization / Company name")


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserInfo(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str

    model_config = ConfigDict(from_attributes=True)


class TenantInfo(BaseModel):
    id: uuid.UUID
    name: str
    is_demo: bool = False

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo
    tenant: TenantInfo


class SwitchTenantRequest(BaseModel):
    tenant_id: uuid.UUID


class TenantMembershipInfo(BaseModel):
    tenant_id: uuid.UUID
    tenant_name: str
    role: str


class MeResponse(BaseModel):
    user: UserInfo
    tenant: TenantInfo
    available_tenants: List[TenantMembershipInfo]
