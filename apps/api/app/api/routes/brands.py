from datetime import datetime, timezone
from typing import Dict, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_write_permission
from app.db.models import BrandAsset
from app.db.session import get_session
from app.domain.brand_service import (
    add_brand_asset,
    create_brand,
    delete_brand_asset,
    get_brand,
    get_brand_asset,
    get_brand_assets,
    list_brands,
)
from app.domain.profile_validator import verify_social_profile_live
from app.domain.verification_service import (
    get_expected_txt_record,
    initiate_domain_verification,
    verify_asset_manual,
    verify_domain_ownership,
)
from app.schemas.brand import (
    BrandAssetCreate,
    BrandAssetResponse,
    BrandAssetVerificationInstructions,
    BrandAssetVerificationManual,
    BrandCreate,
    BrandResponse,
    SocialProfileProbeRequest,
    SocialProfileProbeResponse,
)

router = APIRouter(prefix="/api/v1/brands", tags=["brands"])


@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
def handle_create_brand(
    data: BrandCreate,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> BrandResponse:
    brand = create_brand(session, data, tenant_id=context.tenant_id)
    if context.user_id:
        from app.db.models import User
        user = session.scalar(select(User).where(User.id == context.user_id))
        if user:
            user.primary_brand_id = brand.id
            user.onboarding_completed = True
            session.commit()
    elif context.actor and "@" in context.actor and not context.actor.endswith(".local"):
        from app.db.models import User
        user = session.scalar(select(User).where(User.email == context.actor.strip().lower()))
        if user:
            user.primary_brand_id = brand.id
            user.onboarding_completed = True
            session.commit()

    assets = get_brand_assets(session, brand.id)
    return BrandResponse(
        id=brand.id,
        tenant_id=brand.tenant_id,
        name=brand.name,
        status=brand.status,
        created_at=brand.created_at,
        assets=[BrandAssetResponse.model_validate(a) for a in assets],
    )


@router.get("", response_model=List[BrandResponse])
def handle_list_brands(
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> List[BrandResponse]:
    brands = list_brands(session, tenant_id=context.tenant_id)
    return [
        BrandResponse(
            id=b.id,
            tenant_id=b.tenant_id,
            name=b.name,
            status=b.status,
            created_at=b.created_at,
            assets=[BrandAssetResponse.model_validate(a) for a in b.assets],
        )
        for b in brands
    ]


@router.get("/{brand_id}", response_model=BrandResponse)
def handle_get_brand(
    brand_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> BrandResponse:
    brand = get_brand(session, brand_id)
    if not brand or brand.tenant_id != context.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return BrandResponse(
        id=brand.id,
        tenant_id=brand.tenant_id,
        name=brand.name,
        status=brand.status,
        created_at=brand.created_at,
        assets=[BrandAssetResponse.model_validate(a) for a in brand.assets],
    )


@router.post(
    "/verify-social-handle",
    response_model=SocialProfileProbeResponse,
    summary="Probe platform endpoint live to verify if a social profile actually exists",
)
async def handle_verify_social_handle(
    data: SocialProfileProbeRequest,
    context: TenantContext = Depends(get_current_tenant_context),
) -> SocialProfileProbeResponse:
    is_live, canonical_url, error_detail = await verify_social_profile_live(
        data.platform, data.handle_or_url
    )
    return SocialProfileProbeResponse(
        is_live=is_live,
        canonical_url=canonical_url,
        error_detail=error_detail,
        status_label="Verified (Live Profile)" if is_live else "Unverified / Non-Existent",
    )


@router.post("/{brand_id}/assets", response_model=BrandAssetResponse, status_code=status.HTTP_201_CREATED)
async def handle_add_brand_asset(
    brand_id: uuid.UUID,
    data: BrandAssetCreate,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> BrandAssetResponse:
    brand = get_brand(session, brand_id)
    if not brand or brand.tenant_id != context.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    try:
        asset = add_brand_asset(session, brand_id, data)
        # Pre-flight probe for social handles
        if asset.asset_type in ("handle", "social_handle"):
            surf = "twitter"
            raw_val = asset.canonical_value
            if ":" in raw_val:
                parts = raw_val.split(":", 1)
                surf = parts[0]
                handle_val = parts[1]
            else:
                handle_val = raw_val

            is_live, target_url, err = await verify_social_profile_live(surf, handle_val, timeout=3.5)
            meta = dict(asset.asset_metadata or {})
            meta["target_url"] = target_url
            meta["live_verified"] = is_live
            if is_live:
                asset.verification_status = "verified"
                asset.verification_method = "live_http_probe"
                asset.verified_at = datetime.now(timezone.utc)
                meta["status_label"] = "Verified (Live Profile)"
            else:
                asset.verification_status = "unverified"
                asset.verification_method = "live_http_probe"
                meta["status_label"] = "Unverified / Non-Existent"
                meta["error"] = err
            asset.asset_metadata = meta
            session.commit()
            session.refresh(asset)

        return BrandAssetResponse.model_validate(asset)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/{brand_id}/assets/{asset_id}/dns-challenge",
    response_model=BrandAssetVerificationInstructions,
    summary="Initiate DNS TXT challenge for domain verification",
)
def handle_initiate_dns_challenge(
    brand_id: uuid.UUID,
    asset_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> BrandAssetVerificationInstructions:
    brand = get_brand(session, brand_id)
    if not brand or brand.tenant_id != context.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    asset = get_brand_asset(session, brand_id, asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand asset not found")
    if asset.asset_type not in ("domain", "web_domain"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only domain assets can be verified via DNS TXT challenge",
        )

    actor_id = context.user_id or uuid.uuid4()
    token = initiate_domain_verification(session, asset, initiated_by=actor_id)
    expected_record = get_expected_txt_record(token)

    return BrandAssetVerificationInstructions(
        method="dns_txt",
        domain=asset.canonical_value,
        record_type="TXT",
        record_name=f"_astra.{asset.canonical_value}",
        record_value=expected_record,
        instructions=[
            f"1. Log in to your DNS provider (Cloudflare, AWS Route53, GoDaddy, etc.) for '{asset.canonical_value}'.",
            f"2. Add a new DNS TXT record with Name: '_astra.{asset.canonical_value}' (or '@' if subdomains not supported).",
            f"3. Set the Record Value to: '{expected_record}' with TTL: 300.",
            "4. Click 'Verify DNS Now' to probe the live DNS records.",
        ],
        verification_check=f"dig TXT _astra.{asset.canonical_value} +short",
    )


@router.post(
    "/{brand_id}/assets/{asset_id}/verify-dns",
    response_model=BrandAssetResponse,
    summary="Verify live DNS TXT record for domain ownership",
)
def handle_verify_dns(
    brand_id: uuid.UUID,
    asset_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> BrandAssetResponse:
    brand = get_brand(session, brand_id)
    if not brand or brand.tenant_id != context.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    asset = get_brand_asset(session, brand_id, asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand asset not found")

    actor_id = context.user_id or uuid.uuid4()
    is_valid, error_msg = verify_domain_ownership(session, asset, verified_by=actor_id)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or "DNS verification failed. TXT record not found or token mismatched.",
        )
    return BrandAssetResponse.model_validate(asset)


@router.post(
    "/{brand_id}/assets/{asset_id}/verify-manual",
    response_model=BrandAssetResponse,
    summary="Manual analyst attestation verification",
)
def handle_verify_manual(
    brand_id: uuid.UUID,
    asset_id: uuid.UUID,
    data: BrandAssetVerificationManual,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> BrandAssetResponse:
    brand = get_brand(session, brand_id)
    if not brand or brand.tenant_id != context.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    asset = get_brand_asset(session, brand_id, asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand asset not found")

    actor_id = context.user_id or uuid.uuid4()
    try:
        verify_asset_manual(session, asset, verified_by=actor_id, reason=data.reason)
        return BrandAssetResponse.model_validate(asset)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/{brand_id}/assets/{asset_id}/verify-social",
    response_model=BrandAssetResponse,
    summary="Trigger live existence probe for a registered social handle asset",
)
async def handle_verify_asset_social(
    brand_id: uuid.UUID,
    asset_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> BrandAssetResponse:
    brand = get_brand(session, brand_id)
    if not brand or brand.tenant_id != context.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    asset = get_brand_asset(session, brand_id, asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand asset not found")
    if asset.asset_type not in ("handle", "social_handle"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only social handle assets can be verified via social profile probe",
        )

    surf = "twitter"
    raw_val = asset.canonical_value
    if ":" in raw_val:
        parts = raw_val.split(":", 1)
        surf = parts[0]
        handle_val = parts[1]
    else:
        handle_val = raw_val

    is_live, target_url, error_detail = await verify_social_profile_live(surf, handle_val)
    meta = dict(asset.asset_metadata or {})
    meta["target_url"] = target_url
    meta["live_verified"] = is_live

    if is_live:
        asset.verification_status = "verified"
        asset.verification_method = "live_http_probe"
        asset.verified_at = datetime.now(timezone.utc)
        asset.verified_by = context.user_id
        meta["status_label"] = "Verified (Live Profile)"
        meta.pop("error", None)
    else:
        asset.verification_status = "unverified"
        asset.verification_method = "live_http_probe"
        meta["status_label"] = "Unverified / Non-Existent"
        meta["error"] = error_detail

    asset.asset_metadata = meta
    session.commit()
    session.refresh(asset)
    return BrandAssetResponse.model_validate(asset)


@router.delete(
    "/{brand_id}/assets/{asset_id}",
    summary="Delete brand asset",
)
def handle_delete_brand_asset(
    brand_id: uuid.UUID,
    asset_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
):
    brand = get_brand(session, brand_id)
    if not brand or brand.tenant_id != context.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    deleted = delete_brand_asset(session, brand_id, asset_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand asset not found")
    return {"deleted": True, "asset_id": str(asset_id)}
