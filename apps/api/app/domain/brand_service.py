from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

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

    # Check if a brand profile already exists for this tenant
    existing_brand = session.scalar(
        select(Brand)
        .options(selectinload(Brand.assets))
        .where(Brand.tenant_id == tenant_id)
        .order_by(Brand.created_at.desc())
    )

    if existing_brand:
        # Update existing brand profile instead of creating redundant duplicate profiles
        existing_brand.name = data.name
        existing_brand.status = data.status or "active"

        # Reconcile assets if new assets are provided
        if data.assets is not None:
            # Delete existing assets for this brand to replace with new profile assets
            for old_asset in list(existing_brand.assets):
                session.delete(old_asset)
            session.flush()

            for asset_in in data.assets:
                add_brand_asset(session, existing_brand.id, asset_in)

        session.commit()
        session.refresh(existing_brand)
        return existing_brand

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
    session.refresh(brand)
    return brand


def get_brand(session: Session, brand_id: uuid.UUID) -> Optional[Brand]:
    return session.scalar(
        select(Brand).options(selectinload(Brand.assets)).where(Brand.id == brand_id)
    )


def list_brands(session: Session, tenant_id: Optional[uuid.UUID] = None) -> List[Brand]:
    stmt = select(Brand).options(selectinload(Brand.assets))
    if tenant_id:
        stmt = stmt.where(Brand.tenant_id == tenant_id)
    return list(session.scalars(stmt.order_by(Brand.created_at.desc())).all())


def add_brand_asset(session: Session, brand_id: uuid.UUID, asset_data: BrandAssetCreate) -> BrandAsset:
    brand = get_brand(session, brand_id)
    if not brand:
        raise ValueError(f"Brand {brand_id} not found")

    # Canonical normalization
    val = asset_data.canonical_value.strip()
    if asset_data.asset_type in ("domain", "handle", "social_handle"):
        val = val.lower().lstrip("@")

    # Normalize mobile app pkg type
    asset_type = asset_data.asset_type
    if asset_type == "mobile_app":
        asset_type = "mobile_app_pkg"

    asset = BrandAsset(
        id=uuid.uuid4(),
        tenant_id=brand.tenant_id,
        brand_id=brand_id,
        asset_type=asset_type,
        canonical_value=val,
        object_key=asset_data.object_key,
        sha256=asset_data.sha256,
        asset_metadata=asset_data.metadata or {},
        verification_status="unverified",
        verification_method=None,
        verified_at=None,
    )
    session.add(asset)
    session.commit()
    return asset


def get_brand_assets(session: Session, brand_id: uuid.UUID) -> List[BrandAsset]:
    return list(session.scalars(select(BrandAsset).where(BrandAsset.brand_id == brand_id)).all())


def get_brand_asset(session: Session, brand_id: uuid.UUID, asset_id: uuid.UUID) -> Optional[BrandAsset]:
    return session.scalar(
        select(BrandAsset).where(
            BrandAsset.brand_id == brand_id,
            BrandAsset.id == asset_id,
        )
    )


def delete_brand_asset(session: Session, brand_id: uuid.UUID, asset_id: uuid.UUID) -> bool:
    asset = get_brand_asset(session, brand_id, asset_id)
    if not asset:
        return False
    session.delete(asset)
    session.commit()
    return True


def delete_brand(session: Session, brand_id: uuid.UUID, tenant_id: Optional[uuid.UUID] = None) -> bool:
    """Delete a brand and clean up references on users and tenant."""
    from app.db.models import Tenant, User
    stmt = select(Brand).where(Brand.id == brand_id)
    if tenant_id:
        stmt = stmt.where(Brand.tenant_id == tenant_id)
    brand = session.scalar(stmt)
    if not brand:
        return False

    actual_tenant_id = brand.tenant_id

    # Unset references on users and tenant
    users = session.scalars(select(User).where(User.primary_brand_id == brand_id)).all()
    for u in users:
        u.primary_brand_id = None
        u.onboarding_completed = False

    tenant = session.scalar(select(Tenant).where(Tenant.id == actual_tenant_id))
    if tenant and tenant.primary_brand_id == brand_id:
        tenant.primary_brand_id = None

    # Delete brand (cascades to assets, sightings, campaigns, evidence)
    session.delete(brand)
    session.commit()
    return True


def reset_tenant_brands(session: Session, tenant_id: uuid.UUID) -> int:
    """Reset and delete all brands and brand assets for a tenant."""
    from app.db.models import Tenant, TenantMembership, User
    brands = list(session.scalars(select(Brand).where(Brand.tenant_id == tenant_id)).all())
    count = len(brands)

    # Clear users' onboarding and primary brand in this tenant
    memberships = session.scalars(select(TenantMembership).where(TenantMembership.tenant_id == tenant_id)).all()
    user_ids = [m.user_id for m in memberships]
    if user_ids:
        users = session.scalars(select(User).where(User.id.in_(user_ids))).all()
        for u in users:
            u.primary_brand_id = None
            u.onboarding_completed = False

    tenant = session.scalar(select(Tenant).where(Tenant.id == tenant_id))
    if tenant:
        tenant.primary_brand_id = None

    for b in brands:
        session.delete(b)

    session.commit()
    return count


