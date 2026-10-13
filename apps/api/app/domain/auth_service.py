from __future__ import annotations

import re
from typing import Any, Dict, List, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    DEFAULT_DEMO_TENANT_ID,
    ROLE_ORG_ADMIN,
    TenantContext,
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.models import Tenant, TenantMembership, TenantSettings, User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    MeResponse,
    RegisterRequest,
    TenantInfo,
    TenantMembershipInfo,
    UserInfo,
)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def register_user(session: Session, req: RegisterRequest) -> AuthResponse:
    """Register a new user, auto-provision their organization/tenant, assign org_admin role, and persist default settings."""
    email_clean = req.email.strip().lower()
    if not EMAIL_REGEX.match(email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )

    if len(req.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )

    # Check for existing user with this email
    existing_user = session.scalar(select(User).where(User.email == email_clean))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please log in.",
        )

    # 1. Provision new Tenant (Organization)
    org_name = req.organization_name.strip()
    tenant = Tenant(
        id=uuid.uuid4(),
        name=org_name,
    )
    session.add(tenant)

    # 2. Provision User with hashed password
    hashed_pw = hash_password(req.password)
    user = User(
        id=uuid.uuid4(),
        email=email_clean,
        full_name=req.full_name.strip(),
        hashed_password=hashed_pw,
        is_active=True,
    )
    session.add(user)
    session.flush()

    # 3. Provision TenantMembership with org_admin role
    membership = TenantMembership(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        user_id=user.id,
        role=ROLE_ORG_ADMIN,
    )
    session.add(membership)

    # 4. Provision default persistent TenantSettings
    tenant_settings = TenantSettings(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        quarantine_threshold=80,
        slack_webhook_url=None,
        alert_critical_only=False,
        notification_email=email_clean,
        auto_quarantine_enabled=True,
    )
    session.add(tenant_settings)

    session.commit()

    # 5. Issue cryptographic JWT access token
    access_token = create_access_token(
        tenant_id=tenant.id,
        role=ROLE_ORG_ADMIN,
        actor=user.email,
        user_id=user.id,
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=ROLE_ORG_ADMIN,
        ),
        tenant=TenantInfo(
            id=tenant.id,
            name=tenant.name,
            is_demo=False,
        ),
    )


def login_user(session: Session, req: LoginRequest) -> AuthResponse:
    """Authenticate user with credentials, resolve tenant membership, and issue JWT access token."""
    email_clean = req.email.strip().lower()

    user = session.scalar(select(User).where(User.email == email_clean))
    if not user or not user.is_active or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Resolve memberships
    memberships = list(
        session.scalars(
            select(TenantMembership).where(TenantMembership.user_id == user.id)
        ).all()
    )
    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not associated with any organization.",
        )

    # Select primary membership (prefer org_admin, otherwise first)
    primary_membership = next(
        (m for m in memberships if m.role == ROLE_ORG_ADMIN), memberships[0]
    )

    tenant = session.scalar(
        select(Tenant).where(Tenant.id == primary_membership.tenant_id)
    )
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated organization not found.",
        )

    is_demo = (tenant.id == DEFAULT_DEMO_TENANT_ID)

    access_token = create_access_token(
        tenant_id=tenant.id,
        role=primary_membership.role,
        actor=user.email,
        user_id=user.id,
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=primary_membership.role,
        ),
        tenant=TenantInfo(
            id=tenant.id,
            name=tenant.name,
            is_demo=is_demo,
        ),
    )


def get_current_user_profile(session: Session, context: TenantContext) -> MeResponse:
    """Retrieve full profile, active tenant, and all accessible organizations for authenticated context."""
    user = None
    if context.user_id:
        user = session.scalar(select(User).where(User.id == context.user_id))
    if not user:
        user = session.scalar(select(User).where(User.email == context.actor))

    if not user:
        # Fallback for anonymous dev or service actor
        return MeResponse(
            user=UserInfo(
                id=context.user_id or uuid.uuid4(),
                email=context.actor,
                full_name=context.actor.split("@")[0].capitalize(),
                role=context.role,
            ),
            tenant=TenantInfo(
                id=context.tenant_id,
                name=context.tenant_name,
                is_demo=(context.tenant_id == DEFAULT_DEMO_TENANT_ID),
            ),
            available_tenants=[
                TenantMembershipInfo(
                    tenant_id=context.tenant_id,
                    tenant_name=context.tenant_name,
                    role=context.role,
                )
            ],
        )

    # Find all tenant memberships for this user
    memberships = list(
        session.scalars(
            select(TenantMembership).where(TenantMembership.user_id == user.id)
        ).all()
    )

    available_tenants: List[TenantMembershipInfo] = []
    for m in memberships:
        t = session.scalar(select(Tenant).where(Tenant.id == m.tenant_id))
        if t:
            available_tenants.append(
                TenantMembershipInfo(
                    tenant_id=t.id,
                    tenant_name=t.name,
                    role=m.role,
                )
            )

    is_demo = (context.tenant_id == DEFAULT_DEMO_TENANT_ID)

    return MeResponse(
        user=UserInfo(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=context.role,
        ),
        tenant=TenantInfo(
            id=context.tenant_id,
            name=context.tenant_name,
            is_demo=is_demo,
        ),
        available_tenants=available_tenants,
    )


def switch_user_tenant(
    session: Session, context: TenantContext, target_tenant_id: uuid.UUID
) -> AuthResponse:
    """Switch active tenant context to another organization the user belongs to."""
    if not context.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user identity required to switch organizations.",
        )

    membership = session.scalar(
        select(TenantMembership).where(
            TenantMembership.user_id == context.user_id,
            TenantMembership.tenant_id == target_tenant_id,
        )
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have membership in the requested organization.",
        )

    target_tenant = session.scalar(
        select(Tenant).where(Tenant.id == target_tenant_id)
    )
    if not target_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target organization not found.",
        )

    user = session.scalar(select(User).where(User.id == context.user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    access_token = create_access_token(
        tenant_id=target_tenant.id,
        role=membership.role,
        actor=user.email,
        user_id=user.id,
    )

    is_demo = (target_tenant.id == DEFAULT_DEMO_TENANT_ID)

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=membership.role,
        ),
        tenant=TenantInfo(
            id=target_tenant.id,
            name=target_tenant.name,
            is_demo=is_demo,
        ),
    )


def sync_clerk_user(
    session: Session,
    email: str,
    full_name: str,
    clerk_id: Optional[str] = None,
    composio_entity_id: Optional[str] = None,
) -> AuthResponse:
    """Synchronize Clerk authenticated user to Supabase PostgreSQL and ensure tenant membership.
    
    Also stores Composio entity ID so social channel connections are linked
    to the correct per-user entity in Composio.
    """
    import logging
    logger = logging.getLogger(__name__)

    email_clean = email.strip().lower()
    user = session.scalar(select(User).where(User.email == email_clean))

    if not user:
        user = User(
            id=uuid.uuid4(),
            email=email_clean,
            full_name=full_name.strip() or email_clean.split("@")[0],
            is_active=True,
        )
        session.add(user)
        session.flush()
        logger.info(f"Created new Supabase user: {email_clean}, composio_entity_id={composio_entity_id}")
    else:
        # Update display name if changed
        if full_name.strip() and user.full_name != full_name.strip():
            user.full_name = full_name.strip()

    if clerk_id:
        user.clerk_id = clerk_id
    if composio_entity_id:
        user.composio_user_id = composio_entity_id
    elif clerk_id and not user.composio_user_id:
        user.composio_user_id = f"astra_{clerk_id}"

    session.flush()

    INITIAL_ADMIN_EMAILS = {
        "bhanuu.pr.04@gmail.com",
        "nomipeindia@gmail.com",
        "bhanu.security@astra.com",
        "analyst@astra.local",
    }

    # Check if user already has an established tenant membership
    membership = session.scalar(
        select(TenantMembership)
        .where(TenantMembership.user_id == user.id)
        .order_by(TenantMembership.created_at.asc())
    )

    if membership:
        target_tenant = session.scalar(select(Tenant).where(Tenant.id == membership.tenant_id))
    else:
        # User has no membership yet
        if email_clean in INITIAL_ADMIN_EMAILS:
            # Option A: Preserve admin account on existing brand tenant (DOCK, dockcloud.in)
            default_tenant = session.scalar(select(Tenant).where(Tenant.id == DEFAULT_DEMO_TENANT_ID))
            if not default_tenant:
                default_tenant = Tenant(id=DEFAULT_DEMO_TENANT_ID, name="ASTRA Enterprise Security")
                session.add(default_tenant)
                session.flush()
            target_tenant = default_tenant
        else:
            # Option A: Auto-provision a dedicated isolated tenant for new sign-ups!
            domain_part = email_clean.split("@")[-1].split(".")[0].capitalize()
            generic_domains = {"Gmail", "Yahoo", "Outlook", "Hotmail", "Icloud", "Proton", "Protonmail"}
            if domain_part in generic_domains or not domain_part:
                org_name = f"{user.full_name.strip()}'s Workspace"
            else:
                org_name = f"{domain_part} Security"

            target_tenant = Tenant(
                id=uuid.uuid4(),
                name=org_name,
            )
            session.add(target_tenant)
            session.flush()

            # Provision default persistent TenantSettings for the new isolated tenant
            tenant_settings = TenantSettings(
                id=uuid.uuid4(),
                tenant_id=target_tenant.id,
                quarantine_threshold=80,
                slack_webhook_url=None,
                alert_critical_only=False,
                notification_email=email_clean,
                auto_quarantine_enabled=True,
            )
            session.add(tenant_settings)
            session.flush()

        # Provision TenantMembership with org_admin role
        membership = TenantMembership(
            id=uuid.uuid4(),
            tenant_id=target_tenant.id,
            user_id=user.id,
            role=ROLE_ORG_ADMIN,
        )
        session.add(membership)
        session.flush()

    # Ensure admin accounts have their primary brand set to DOCK in the default demo tenant
    from app.db.models import Brand
    if email_clean in INITIAL_ADMIN_EMAILS:
        dock_brand = session.scalar(select(Brand).where(Brand.tenant_id == DEFAULT_DEMO_TENANT_ID))
        if dock_brand:
            user.primary_brand_id = dock_brand.id
            user.onboarding_completed = True
            session.flush()
    else:
        # For non-admin users, check if their dedicated tenant has any brand registered
        user_brand = session.scalar(select(Brand).where(Brand.tenant_id == target_tenant.id).order_by(Brand.created_at.desc()))
        if user_brand:
            user.primary_brand_id = user_brand.id
            user.onboarding_completed = True
            session.flush()

    session.commit()
    logger.info(f"Supabase sync complete for {email_clean} | tenant={target_tenant.id} ({target_tenant.name})")

    access_token = create_access_token(
        tenant_id=target_tenant.id,
        role=membership.role,
        actor=user.email,
        user_id=user.id,
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=membership.role,
            clerk_id=user.clerk_id,
            composio_user_id=user.composio_user_id,
            onboarding_completed=user.onboarding_completed,
            primary_brand_id=user.primary_brand_id,
        ),
        tenant=TenantInfo(
            id=target_tenant.id,
            name=target_tenant.name,
            is_demo=False,
        ),
    )


def complete_user_onboarding(
    session: Session,
    clerk_id: Optional[str] = None,
    email: Optional[str] = None,
    brand_id: Optional[uuid.UUID] = None,
) -> Dict[str, Any]:
    """Permanently mark user as onboarded in Supabase PostgreSQL and associate brand."""
    user = None
    if clerk_id:
        user = session.scalar(select(User).where(User.clerk_id == clerk_id))
    if not user and email:
        user = session.scalar(select(User).where(User.email == email.strip().lower()))

    if not user:
        if email or clerk_id:
            return {"success": False, "error": "User not found for provided credentials"}
        user = session.scalar(select(User).order_by(User.created_at.desc()))

    if user:
        user.onboarding_completed = True
        if brand_id:
            user.primary_brand_id = brand_id
            from app.db.models import Brand
            b = session.scalar(select(Brand).where(Brand.id == brand_id))
            if b:
                membership = session.scalar(select(TenantMembership).where(TenantMembership.user_id == user.id))
                if membership and b.tenant_id != membership.tenant_id:
                    b.tenant_id = membership.tenant_id
        session.commit()
        return {
            "success": True,
            "user_id": str(user.id),
            "email": user.email,
            "onboarding_completed": True,
            "primary_brand_id": str(user.primary_brand_id) if user.primary_brand_id else None,
        }

    return {"success": False, "error": "User not found"}


def reset_user_onboarding(
    session: Session,
    clerk_id: Optional[str] = None,
    email: Optional[str] = None,
) -> Dict[str, Any]:
    """Reset user onboarding status to allow restarting the setup guide from the beginning."""
    user = None
    if clerk_id:
        user = session.scalar(select(User).where(User.clerk_id == clerk_id))
    if not user and email:
        user = session.scalar(select(User).where(User.email == email.strip().lower()))

    if not user:
        if email or clerk_id:
            return {"success": False, "error": "User not found for provided credentials"}
        user = session.scalar(select(User).order_by(User.created_at.desc()))

    if user:
        user.onboarding_completed = False
        user.primary_brand_id = None
        session.flush()

        # Delete previous brands for this user's tenant so the old brand profile does not reappear
        from app.db.models import Brand, Tenant, TenantMembership
        membership = session.scalar(select(TenantMembership).where(TenantMembership.user_id == user.id))
        if membership:
            tenant = session.scalar(select(Tenant).where(Tenant.id == membership.tenant_id))
            if tenant:
                tenant.primary_brand_id = None
            old_brands = session.scalars(select(Brand).where(Brand.tenant_id == membership.tenant_id)).all()
            for b in old_brands:
                session.delete(b)
            from app.domain.threat_scan_service import clear_scan_state
            clear_scan_state(str(membership.tenant_id))

        session.commit()
        return {
            "success": True,
            "user_id": str(user.id),
            "email": user.email,
            "onboarding_completed": False,
            "primary_brand_id": None,
        }

    return {"success": False, "error": "User not found"}



