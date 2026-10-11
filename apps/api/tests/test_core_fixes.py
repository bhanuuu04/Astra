import hashlib
import os
import shutil
import tempfile
import uuid
import pytest

from app.core.security import TenantContext, require_admin, DEFAULT_DEMO_TENANT_ID
from app.core.config import Settings
from app.integrations.llm import _generate_rule_based_summary
from app.storage.evidence_storage import (
    save_evidence_content,
    load_evidence_content,
    verify_evidence_integrity,
)


def test_evidence_storage_persistence_and_integrity():
    test_key = f"test_tenant/test_sighting/{uuid.uuid4().hex[:8]}.txt"
    payload = b"URGENT: Impersonated brand communication payload with malicious APK link."
    expected_hash = hashlib.sha256(payload).hexdigest()

    # Save
    file_path, actual_hash = save_evidence_content(test_key, payload)
    assert actual_hash == expected_hash
    assert file_path.exists()

    # Load
    retrieved = load_evidence_content(test_key)
    assert retrieved == payload

    # Verify integrity
    is_valid, verified_hash = verify_evidence_integrity(test_key, expected_hash)
    assert is_valid is True
    assert verified_hash == expected_hash

    # Verify tampering detection
    is_valid_bad, _ = verify_evidence_integrity(test_key, "0000000000000000000000000000000000000000000000000000000000000000")
    assert is_valid_bad is False


def test_ai_summary_synthesis():
    title = "Brand Impersonation Campaign - Fake Telegram Updater"
    score = 88
    signals = [
        {"detector_name": "homoglyph_brand_confusion", "severity": "critical", "score": 0.95},
        {"detector_name": "unauthorized_sideload_apk", "severity": "high", "score": 0.85},
    ]
    pivots = [
        {"pivot_type": "UPI identifier", "confidence": 0.92},
        {"pivot_type": "Phone number", "confidence": 0.88},
    ]

    summary = _generate_rule_based_summary(title, score, signals, pivots)
    assert "Analyst summary" in summary
    assert "88/100" in summary
    assert "homoglyph_brand_confusion" in summary
    assert "UPI identifier" in summary


def test_tenant_context_structure():
    t_id = uuid.uuid4()
    ctx = TenantContext(
        tenant_id=t_id,
        tenant_name="Acme Financial Corp",
        actor="soc_lead@acmefin.com",
        role="analyst",
        is_admin=False,
    )
    assert ctx.tenant_id == t_id
    assert ctx.role == "analyst"
    assert ctx.is_admin is False


def test_production_configuration_rejects_development_defaults():
    unsafe = Settings(app_env="production")
    with pytest.raises(RuntimeError, match="Unsafe production configuration"):
        unsafe.validate_runtime_security()

    safe = Settings(
        app_env="production",
        jwt_secret="jwt-secret-that-is-unique-and-at-least-32-chars",
        admin_api_key="admin-secret-that-is-unique-and-at-least-32-chars",
        allow_anonymous_dev=False,
        cors_origins="https://console.example.com",
    )
    safe.validate_runtime_security()
