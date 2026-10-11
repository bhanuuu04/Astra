import uuid
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.security import (
    DEFAULT_DEMO_TENANT_ID,
    ROLE_ANALYST,
    ROLE_ORG_ADMIN,
    ROLE_READ_ONLY,
    TenantContext,
    create_access_token,
    hash_password,
    verify_access_token,
    verify_password,
)
from app.db.models import Base, Tenant, TenantMembership, TenantSettings, User
from app.domain.auth_service import (
    get_current_user_profile,
    login_user,
    register_user,
    switch_user_tenant,
)
from app.domain.settings_service import get_tenant_settings, update_tenant_settings
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.settings import TenantSettingsUpdate


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_password_hashing_and_verification():
    raw_pass = "EnterpriseShield2026!"
    hashed = hash_password(raw_pass)

    assert hashed.startswith("pbkdf2_sha256$")
    assert raw_pass not in hashed  # Plain text must NEVER be in the hash
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False


def test_self_service_registration_provisions_tenant_and_settings(db_session):
    req = RegisterRequest(
        email="ciso@apexfintech.com",
        password="SecurePassword99#",
        full_name="Alex Mercer",
        organization_name="Apex FinTech Inc",
    )

    auth_resp = register_user(db_session, req)

    assert auth_resp.access_token is not None
    assert auth_resp.user.email == "ciso@apexfintech.com"
    assert auth_resp.user.role == ROLE_ORG_ADMIN
    assert auth_resp.tenant.name == "Apex FinTech Inc"
    assert auth_resp.tenant.is_demo is False
    assert auth_resp.tenant.id != DEFAULT_DEMO_TENANT_ID

    # Verify DB records
    user = db_session.scalar(select(User).where(User.email == "ciso@apexfintech.com"))
    assert user is not None
    assert user.hashed_password is not None
    assert "SecurePassword99#" not in user.hashed_password

    tenant = db_session.scalar(select(Tenant).where(Tenant.name == "Apex FinTech Inc"))
    assert tenant is not None
    assert tenant.id == auth_resp.tenant.id

    membership = db_session.scalar(
        select(TenantMembership).where(
            TenantMembership.user_id == user.id,
            TenantMembership.tenant_id == tenant.id,
        )
    )
    assert membership is not None
    assert membership.role == ROLE_ORG_ADMIN

    # Verify TenantSettings auto-provisioned
    settings = db_session.scalar(
        select(TenantSettings).where(TenantSettings.tenant_id == tenant.id)
    )
    assert settings is not None
    assert settings.quarantine_threshold == 80
    assert settings.notification_email == "ciso@apexfintech.com"

    # Verify JWT claims
    claims = verify_access_token(auth_resp.access_token)
    assert claims["tenant_id"] == tenant.id
    assert claims["role"] == ROLE_ORG_ADMIN
    assert claims["user_id"] == user.id


def test_duplicate_email_registration_rejected(db_session):
    req = RegisterRequest(
        email="lead@guard.com",
        password="SuperSecretPassword1!",
        full_name="Lead Analyst",
        organization_name="Guard Corp",
    )
    register_user(db_session, req)

    # Attempt second registration with same email
    with pytest.raises(HTTPException) as exc_info:
        register_user(db_session, req)
    assert exc_info.value.status_code == 409
    assert "already exists" in exc_info.value.detail


def test_registration_validation(db_session):
    # Invalid email format rejected by service
    with pytest.raises(HTTPException) as exc_info:
        register_user(
            db_session,
            RegisterRequest(
                email="not-an-email",
                password="ValidPassword123!",
                full_name="User",
                organization_name="Org",
            ),
        )
    assert exc_info.value.status_code == 400

    # Weak password (< 8 chars) rejected by schema validation
    with pytest.raises(Exception):
        RegisterRequest(
            email="valid@corp.com",
            password="short",
            full_name="User",
            organization_name="Org",
        )


def test_login_flow(db_session):
    reg = RegisterRequest(
        email="analyst@defense.io",
        password="MySecretPassword123",
        full_name="Sam Analyst",
        organization_name="Defense IO",
    )
    register_user(db_session, reg)

    # Successful login
    login_resp = login_user(
        db_session,
        LoginRequest(email="analyst@defense.io", password="MySecretPassword123"),
    )
    assert login_resp.access_token is not None
    assert login_resp.user.email == "analyst@defense.io"
    assert login_resp.tenant.name == "Defense IO"

    # Wrong password
    with pytest.raises(HTTPException) as exc_info:
        login_user(
            db_session,
            LoginRequest(email="analyst@defense.io", password="WrongPassword!"),
        )
    assert exc_info.value.status_code == 401

    # Non-existent email
    with pytest.raises(HTTPException) as exc_info:
        login_user(
            db_session,
            LoginRequest(email="nonexistent@defense.io", password="AnyPassword"),
        )
    assert exc_info.value.status_code == 401


def test_tenant_settings_persistence_and_isolation(db_session):
    # Tenant A
    auth_a = register_user(
        db_session,
        RegisterRequest(
            email="admin@tenant-a.com",
            password="Password123456!",
            full_name="Admin A",
            organization_name="Tenant Alpha",
        ),
    )
    # Tenant B
    auth_b = register_user(
        db_session,
        RegisterRequest(
            email="admin@tenant-b.com",
            password="Password123456!",
            full_name="Admin B",
            organization_name="Tenant Beta",
        ),
    )

    # Update Tenant A's settings
    update_tenant_settings(
        db_session,
        auth_a.tenant.id,
        TenantSettingsUpdate(
            quarantine_threshold=95,
            slack_webhook_url="https://hooks.slack.com/services/TA/BA/KA",
            alert_critical_only=True,
        ),
    )

    # Verify Tenant A's persisted settings
    settings_a = get_tenant_settings(db_session, auth_a.tenant.id)
    assert settings_a.quarantine_threshold == 95
    assert settings_a.slack_webhook_url == "https://hooks.slack.com/services/TA/BA/KA"
    assert settings_a.alert_critical_only is True

    # Verify Tenant B's settings remain default (STRICT TENANT ISOLATION)
    settings_b = get_tenant_settings(db_session, auth_b.tenant.id)
    assert settings_b.quarantine_threshold == 80
    assert settings_b.slack_webhook_url is None
    assert settings_b.alert_critical_only is False


def test_switch_tenant_governance(db_session):
    # Register user in Org 1
    auth1 = register_user(
        db_session,
        RegisterRequest(
            email="multi@corp.com",
            password="Password1234!",
            full_name="Multi User",
            organization_name="Primary Org",
        ),
    )
    user_id = auth1.user.id

    # Create Org 2 and add user as analyst
    org2 = Tenant(id=uuid.uuid4(), name="Secondary Org")
    db_session.add(org2)
    m2 = TenantMembership(
        id=uuid.uuid4(),
        tenant_id=org2.id,
        user_id=user_id,
        role=ROLE_ANALYST,
    )
    db_session.add(m2)
    db_session.commit()

    context = TenantContext(
        tenant_id=auth1.tenant.id,
        tenant_name=auth1.tenant.name,
        actor=auth1.user.email,
        role=ROLE_ORG_ADMIN,
        user_id=user_id,
    )

    # Switch to Org 2
    switched = switch_user_tenant(db_session, context, org2.id)
    assert switched.tenant.id == org2.id
    assert switched.tenant.name == "Secondary Org"
    assert switched.user.role == ROLE_ANALYST

    # Attempt to switch to an unauthorized third tenant
    rogue_org_id = uuid.uuid4()
    with pytest.raises(HTTPException) as exc_info:
        switch_user_tenant(db_session, context, rogue_org_id)
    assert exc_info.value.status_code == 403
