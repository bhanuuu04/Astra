from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import TenantContext, get_current_tenant_context, require_internal_api_key
from app.db.session import get_session
from app.domain.auth_service import (
    complete_user_onboarding,
    reset_user_onboarding,
    get_current_user_profile,
    login_user,
    register_user,
    switch_user_tenant,
    sync_clerk_user,
)
from app.schemas.auth import (
    AuthResponse,
    ClerkSyncRequest,
    CompleteOnboardingRequest,
    LoginRequest,
    MeResponse,
    RegisterRequest,
    SwitchTenantRequest,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Self-service user registration and organization provisioning",
)
def register(req: RegisterRequest, session: Session = Depends(get_session)):
    """Public self-service signup: creates user, provisions tenant organization,

    assigns org_admin role, and initializes persistent settings.
    """
    return register_user(session, req)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="User authentication and JWT token issuance",
)
def login(req: LoginRequest, session: Session = Depends(get_session)):
    """Authenticate with email and password, returning JWT bearer token with tenant context."""
    return login_user(session, req)


@router.get(
    "/me",
    response_model=MeResponse,
    summary="Get current user profile and tenant memberships",
)
def me(
    context: TenantContext = Depends(get_current_tenant_context),
    session: Session = Depends(get_session),
):
    """Return user details, current organization, and all accessible organizations."""
    return get_current_user_profile(session, context)


@router.post(
    "/switch-tenant",
    response_model=AuthResponse,
    summary="Switch active tenant organization",
)
def switch_tenant(
    req: SwitchTenantRequest,
    context: TenantContext = Depends(get_current_tenant_context),
    session: Session = Depends(get_session),
):
    """Switch active organization context to another tenant where the user has active membership."""
    return switch_user_tenant(session, context, req.tenant_id)


@router.post(
    "/sync-clerk",
    response_model=AuthResponse,
    summary="Synchronize Clerk authenticated user to Supabase PostgreSQL",
)
def sync_clerk(
    req: ClerkSyncRequest,
    session: Session = Depends(get_session),
    _internal_auth: None = Depends(require_internal_api_key),
):
    """Synchronize Clerk authenticated user to Supabase database, create tenant membership, and issue JWT."""
    return sync_clerk_user(
        session,
        req.email,
        req.full_name,
        req.clerk_id,
        getattr(req, 'composio_entity_id', None),
    )


@router.post(
    "/complete-onboarding",
    summary="Mark onboarding as completed in Supabase",
)
def handle_complete_onboarding(
    req: CompleteOnboardingRequest,
    session: Session = Depends(get_session),
    _internal_auth: None = Depends(require_internal_api_key),
):
    """Permanently store onboarding status and primary brand in Supabase."""
    return complete_user_onboarding(
        session,
        clerk_id=req.clerk_id,
        email=req.email,
        brand_id=req.brand_id,
    )


@router.post(
    "/reset-onboarding",
    summary="Reset user onboarding status in database",
)
def handle_reset_onboarding(
    req: CompleteOnboardingRequest,
    session: Session = Depends(get_session),
    _internal_auth: None = Depends(require_internal_api_key),
):
    """Reset user onboarding status to allow restarting the setup guide."""
    return reset_user_onboarding(
        session,
        clerk_id=req.clerk_id,
        email=req.email,
    )


