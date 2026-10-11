from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_write_permission
from app.db.session import get_session
from app.domain.brand_service import (
    add_brand_asset,
    create_brand,
    get_brand,
    get_brand_assets,
    list_brands,
)
from app.schemas.brand import (
    BrandAssetCreate,
    BrandAssetResponse,
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
