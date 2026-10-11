from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_write_permission
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
)

router = APIRouter(prefix="/api/v1/brands", tags=["brands"])


@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
def handle_create_brand(
    data: BrandCreate,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(require_write_permission),
) -> BrandResponse:
    brand = create_brand(session, data, tenant_id=context.tenant_id)
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
    result = []
    for b in brands:
        assets = get_brand_assets(session, b.id)
        result.append(
            BrandResponse(
                id=b.id,
                tenant_id=b.tenant_id,
                name=b.name,
                status=b.status,
                created_at=b.created_at,
                assets=[BrandAssetResponse.model_validate(a) for a in assets],
            )
        )
    return result


@router.get("/{brand_id}", response_model=BrandResponse)
def handle_get_brand(
    brand_id: uuid.UUID,
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> BrandResponse:
    brand = get_brand(session, brand_id)
    if not brand or brand.tenant_id != context.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    assets = get_brand_assets(session, brand.id)
    return BrandResponse(
        id=brand.id,
        tenant_id=brand.tenant_id,
        name=brand.name,
        status=brand.status,
        created_at=brand.created_at,
        assets=[BrandAssetResponse.model_validate(a) for a in assets],
    )


@router.post("/{brand_id}/assets", response_model=BrandAssetResponse, status_code=status.HTTP_201_CREATED)
def handle_add_brand_asset(
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
