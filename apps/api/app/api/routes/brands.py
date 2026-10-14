from datetime import datetime, timezone
from typing import Any, Dict, List
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
    delete_brand,
    delete_brand_asset,
    get_brand,
    get_brand_asset,
    get_brand_assets,
    list_brands,
    reset_tenant_brands,
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

    # Automatically initiate background threat surface scan for the newly enrolled brand
    try:
        import asyncio
        from app.domain.threat_scan_service import run_osint_threat_scan, set_scan_state

        init_scan_state = {
            "is_scanning": True,
            "status": "running",
            "brand_id": str(brand.id),
            "progress_pct": 5,
            "stage": "Phase 1: Establishing Canonical Brand Perimeter & DNS Invariants...",
            "stage_index": 1,
            "total_stages": 4,
            "eta_seconds": 35,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "logs": [
                f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Threat Surface Sentinel activated for newly enrolled brand: {brand.name}"
            ],
            "findings_found": 0,
            "live_threats": [],
            "completed_at": None,
        }
        set_scan_state(f"{brand.tenant_id}:{brand.id}", init_scan_state)
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(run_osint_threat_scan(brand_id=brand.id, tenant_id=brand.tenant_id))
        except RuntimeError:
            pass
    except Exception:
        pass

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
            meta["existence_status"] = "exists" if is_live else ("rate_limited" if "rate_limited" in str(err) else "not_found")
            meta["status_label"] = "Live Profile Found (Ownership Unverified)" if is_live else "Unverified / Non-Existent"
            if err:
                meta["probe_error"] = err
            # Existence probe does not establish verified ownership
            asset.verification_status = "unverified"
            asset.verification_method = "live_http_probe"
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


def _ensure_passive_ct_monitor(session: Session, tenant_id: uuid.UUID, actor_id: uuid.UUID) -> None:
    """Provision one tenant-level passive CT monitor after domain verification."""
    from app.db.models import Connector
    existing = session.scalar(
        select(Connector).where(
            Connector.tenant_id == tenant_id,
            Connector.connector_type == "certificate_transparency",
        ).limit(1)
    )
    if existing:
        return
    connector = Connector(
        tenant_id=tenant_id,
        connector_type="certificate_transparency",
        name="Passive Certificate Transparency Monitor",
        status="active",
        auth_config_vault_ref=None,
        permitted_scopes=["public_ct_logs", "verified_brand_domains"],
    )
    session.add(connector)
    session.commit()


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
    _ensure_passive_ct_monitor(session, context.tenant_id, actor_id)
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
    meta["existence_status"] = "exists" if is_live else ("rate_limited" if "rate_limited" in str(error_detail) else "not_found")

    if is_live:
        meta["status_label"] = "Live Profile Found (Ownership Unverified)"
        meta.pop("error", None)
    else:
        meta["status_label"] = "Unverified / Non-Existent"
        meta["error"] = error_detail

    # Existence probe does not establish verified ownership
    asset.verification_status = "unverified"
    asset.verification_method = "live_http_probe"
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


@router.post("/reset", summary="Reset brand profile for authenticated tenant")
def handle_reset_brands(
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> Dict[str, Any]:
    from app.domain.threat_scan_service import clear_scan_state
    clear_scan_state(str(context.tenant_id))
    count = reset_tenant_brands(session, tenant_id=context.tenant_id)
    return {
        "success": True,
        "message": f"Brand profile reset successfully ({count} profile(s) cleared).",
        "tenant_id": str(context.tenant_id),
    }


@router.delete("/{brand_id}", summary="Delete brand")
def handle_delete_brand(
    brand_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> Dict[str, Any]:
    from app.domain.threat_scan_service import clear_scan_state
    clear_scan_state(str(brand_id))
    clear_scan_state(str(context.tenant_id))
    success = delete_brand(session, brand_id, tenant_id=context.tenant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand {brand_id} not found for authenticated tenant",
        )
    return {"success": True, "message": "Brand deleted successfully."}

