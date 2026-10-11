from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Callable, List, Optional, Set
import uuid

from fastapi import Depends, Header, HTTPException, status
import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Tenant, TenantMembership, User
from app.db.session import get_session


DEFAULT_DEMO_TENANT_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

# Enterprise RBAC Roles
ROLE_ORG_ADMIN = "org_admin"
ROLE_BRAND_MANAGER = "brand_manager"
ROLE_ANALYST = "analyst"
ROLE_REVIEWER = "reviewer"
ROLE_READ_ONLY = "read_only"

VALID_ROLES = {
    ROLE_ORG_ADMIN,
    ROLE_BRAND_MANAGER,
    ROLE_ANALYST,
    ROLE_REVIEWER,
    ROLE_READ_ONLY,
}


@dataclass
class TenantContext:
    tenant_id: uuid.UUID
    tenant_name: str
    actor: str
    role: str
    user_id: Optional[uuid.UUID] = None
    is_admin: bool = False


def create_access_token(
    tenant_id: uuid.UUID,
    role: str = ROLE_ANALYST,
    actor: str = "analyst@astra.local",
    user_id: Optional[uuid.UUID] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a cryptographically signed HMAC-SHA256 JWT access token."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.jwt_expiration_minutes)
    )

    payload = {
        "iss": "astra-enterprise",
        "sub": str(user_id) if user_id else actor,
        "tenant_id": str(tenant_id),
        "role": role if role in VALID_ROLES else ROLE_ANALYST,
        "actor": actor,
        "user_id": str(user_id) if user_id else None,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_access_token(token: str) -> dict:
    """Verify cryptographic signature and claims of an access token."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            issuer="astra-enterprise",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature or payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    role = payload.get("role", "").lower()
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token contains invalid role: {role}.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        t_id = uuid.UUID(payload["tenant_id"])
    except (KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing or invalid tenant_id claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = None
    if payload.get("user_id"):
        try:
            user_id = uuid.UUID(payload["user_id"])
        except ValueError:
            pass

    return {
        "tenant_id": t_id,
        "role": role,
        "actor": payload.get("actor", "analyst@astra.local"),
        "user_id": user_id,
    }


def get_current_tenant_context(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    session: Session = Depends(get_session),
) -> TenantContext:
    """Resolve and enforce server-verified tenant context and actor identity.

    Security Rule: An untrusted caller CANNOT dictate their tenant or actor via headers.
    Tenant context and actor identity MUST be strictly derived from the cryptographically verified token or session.
    """
    settings = get_settings()
    is_prod = settings.app_env.lower() in ("production", "prod")

    provided_key = None
    if x_api_key:
        provided_key = x_api_key.strip()
    elif authorization and authorization.lower().startswith("bearer "):
        provided_key = authorization[7:].strip()

    # 1. Determine Identity & Privileges from Cryptographic Credential
    is_super_admin = False
    token_tenant_id: Optional[uuid.UUID] = None
    derived_role = ROLE_ANALYST
    derived_actor = "analyst@astra.local"
    derived_user_id: Optional[uuid.UUID] = None

    if provided_key:
        if settings.admin_api_key and provided_key == settings.admin_api_key:
            is_super_admin = True
            derived_role = ROLE_ORG_ADMIN
            derived_actor = "admin@astra.local"
        elif settings.api_secret_key and provided_key == settings.api_secret_key:
            is_super_admin = False
            derived_role = ROLE_ANALYST
            derived_actor = "service@astra.local"
        else:
            # Bearer token MUST be a cryptographically verified JWT
            claims = verify_access_token(provided_key)
            token_tenant_id = claims["tenant_id"]
            derived_role = claims["role"]
            derived_actor = claims["actor"]
            derived_user_id = claims["user_id"]

    elif is_prod or not settings.allow_anonymous_dev:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid authentication token or API key is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    else:
        # Development local fallback only when credentials omitted and allow_anonymous_dev is enabled
        token_tenant_id = DEFAULT_DEMO_TENANT_ID
        derived_role = ROLE_ANALYST
        derived_actor = "analyst@astra.local"

    # 2. Enforce Tenant Boundary (Prevent BOLA & Cross-Tenant Spoofing)
    target_tenant_id: Optional[uuid.UUID] = None

    if x_tenant_id:
        try:
            requested_tenant = uuid.UUID(x_tenant_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-Tenant-ID format. Must be a valid UUID.",
            )

        # Non-super-admins CANNOT switch tenants or request other tenants
        if not is_super_admin:
            if token_tenant_id and requested_tenant != token_tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cross-tenant access prohibited. You do not have permission for the requested tenant.",
                )
        target_tenant_id = requested_tenant
    else:
        target_tenant_id = token_tenant_id or DEFAULT_DEMO_TENANT_ID

    # 3. Resolve Tenant in Database
    tenant = session.scalar(select(Tenant).where(Tenant.id == target_tenant_id))
    if not tenant:
        if target_tenant_id == DEFAULT_DEMO_TENANT_ID and not is_prod:
            # Bootstrap default demo tenant in non-prod
            tenant = Tenant(id=DEFAULT_DEMO_TENANT_ID, name="Astra Demo Organization")
            session.add(tenant)
            session.commit()
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {target_tenant_id} not found.",
            )

    # 4. Resolve identity and authorization from persisted membership. JWT role
    # claims are advisory only; a signed token cannot provision its own access.
    user_query = select(User)
    user = (
        session.scalar(user_query.where(User.id == derived_user_id))
        if derived_user_id
        else session.scalar(user_query.where(User.email == derived_actor))
    )

    is_dev_anonymous = not provided_key and not is_prod and settings.allow_anonymous_dev
    identity_created = False
    if not user and (is_dev_anonymous or is_super_admin):
        user = User(
            id=derived_user_id or uuid.uuid4(),
            email=derived_actor,
            full_name=derived_actor.split("@")[0].capitalize(),
            is_active=True,
        )
        session.add(user)
        session.flush()
        identity_created = True

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not active or is not provisioned.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    membership = session.scalar(
        select(TenantMembership).where(
            TenantMembership.tenant_id == tenant.id,
            TenantMembership.user_id == user.id,
        )
    )
    if not membership and (is_dev_anonymous or is_super_admin):
        membership = TenantMembership(
            id=uuid.uuid4(),
            tenant_id=tenant.id,
            user_id=user.id,
            role=derived_role,
        )
        session.add(membership)
        session.flush()
        identity_created = True
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no membership in this tenant.",
        )

    if membership.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant membership has an invalid role; contact an administrator.",
        )
    derived_role = membership.role
    derived_actor = user.email
    if identity_created:
        session.commit()

    return TenantContext(
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        actor=derived_actor,
        role=derived_role,
        user_id=user.id,
        is_admin=(derived_role == ROLE_ORG_ADMIN or is_super_admin),
    )


def require_admin(
    context: TenantContext = Depends(get_current_tenant_context),
) -> TenantContext:
    """Enforce Org Admin authorization."""
    if context.role == ROLE_ORG_ADMIN or context.is_admin:
        return context

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Administrative authorization required (Org Admin role).",
    )


def require_role(*allowed_roles: str) -> Callable[[TenantContext], TenantContext]:
    """Dependency factory to enforce specific RBAC roles."""
    allowed_set: Set[str] = set(allowed_roles)

    def _role_checker(context: TenantContext = Depends(get_current_tenant_context)) -> TenantContext:
        if context.is_admin or context.role in allowed_set:
            return context

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required one of: {sorted(list(allowed_set))}",
        )

    return _role_checker


def require_write_permission(
    context: TenantContext = Depends(get_current_tenant_context),
) -> TenantContext:
    """Enforce that read-only users cannot perform write or mutating actions."""
    if context.role == ROLE_READ_ONLY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Read-only role cannot perform mutating operations.",
        )
    return context


# Standard composite dependencies for routes
require_brand_management = require_role(ROLE_ORG_ADMIN, ROLE_BRAND_MANAGER)
require_analyst_review = require_role(ROLE_ORG_ADMIN, ROLE_ANALYST, ROLE_REVIEWER)
