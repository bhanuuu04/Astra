from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Brand, BrandAsset, Tenant
from app.schemas.brand import BrandAssetCreate, BrandCreate


def get_or_create_default_tenant(session: Session) -> Tenant:
    tenant = session.scalar(select(Tenant).order_by(Tenant.created_at.asc()))
    if not tenant:
        tenant = Tenant(
            id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
            name="Astra Demo Organization",
        )
        session.add(tenant)
        session.flush()
    return tenant


def create_brand(session: Session, data: BrandCreate, tenant_id: Optional[uuid.UUID] = None) -> Brand:
    if not tenant_id:
        if data.tenant_id:
            tenant_id = data.tenant_id
        else:
            tenant = get_or_create_default_tenant(session)
            tenant_id = tenant.id

    brand = Brand(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        name=data.name,
        status=data.status or "active",
    )
    session.add(brand)
    session.flush()

    if data.assets:
        for asset_in in data.assets:
            add_brand_asset(session, brand.id, asset_in)

    session.commit()
    return brand


def get_brand(session: Session, brand_id: uuid.UUID) -> Optional[Brand]:
    return session.scalar(select(Brand).where(Brand.id == brand_id))


def list_brands(session: Session, tenant_id: Optional[uuid.UUID] = None) -> List[Brand]:
    stmt = select(Brand)
    if tenant_id:
        stmt = stmt.where(Brand.tenant_id == tenant_id)
    return list(session.scalars(stmt.order_by(Brand.created_at.desc())).all())


def add_brand_asset(session: Session, brand_id: uuid.UUID, asset_data: BrandAssetCreate) -> BrandAsset:
    brand = get_brand(session, brand_id)
    if not brand:
        raise ValueError(f"Brand {brand_id} not found")

    # Canonical normalization
    val = asset_data.canonical_value.strip()
    if asset_data.asset_type in ("domain", "handle"):
        val = val.lower().lstrip("@")

    asset = BrandAsset(
        id=uuid.uuid4(),
        brand_id=brand_id,
        asset_type=asset_data.asset_type,
        canonical_value=val,
        object_key=asset_data.object_key,
        sha256=asset_data.sha256,
        # Enrollment records the customer's assertion; ownership verification
        # requires a separate challenge workflow and must not be implied here.
        verified_at=None,
    )
    session.add(asset)
    session.commit()
    return asset


def get_brand_assets(session: Session, brand_id: uuid.UUID) -> List[BrandAsset]:
    return list(session.scalars(select(BrandAsset).where(BrandAsset.brand_id == brand_id)).all())
