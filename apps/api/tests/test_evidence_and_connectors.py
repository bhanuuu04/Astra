import hashlib
import time
import uuid
import pytest

from app.ingestion.contract import (
    ConnectorStatus,
    ConnectorType,
    NormalizedFinding,
)
from app.storage.evidence_storage import (
    delete_evidence_object,
    generate_signed_evidence_token,
    load_evidence_content,
    purge_tenant_evidence,
    save_evidence_content,
    verify_evidence_integrity,
    verify_signed_evidence_token,
)


def test_normalized_finding_contract_validation():
    """Verify that NormalizedFinding strictly satisfies the enterprise ingestion contract."""
    brand_id = uuid.uuid4()
    finding = NormalizedFinding(
        source_identity="meta:instagram_official_webhook",
        connector_type=ConnectorType.META_GRAPH,
        permission_scope="instagram_manage_comments,pages_read_engagement",
        external_id="ig_post_9876543210",
        brand_id=brand_id,
        surface="instagram",
        target_handle_or_ref="@nilapay_fraud_desk",
        normalized_content="URGENT: Your NilaPay account has been suspended. Send 500 INR to fraudster@okhdfcbank",
        sender_metadata={"username": "nilapay_fraud_desk", "is_verified": False},
        extracted_pivots=[{"type": "upi", "value": "fraudster@okhdfcbank"}],
        connector_status=ConnectorStatus.ACTIVE_LIVE,
        is_live_source=True,
    )

    assert finding.source_identity == "meta:instagram_official_webhook"
    assert finding.connector_type == ConnectorType.META_GRAPH
    assert finding.connector_status == ConnectorStatus.ACTIVE_LIVE
    assert finding.surface == "instagram"
    assert finding.extracted_pivots[0]["value"] == "fraudster@okhdfcbank"


def test_durable_evidence_vault_signed_tokens_and_tamper_detection():
    """Verify durable evidence persistence, signed access tokens, and tamper detection."""
    tenant_id = uuid.uuid4()
    sighting_id = uuid.uuid4()
    object_key = f"{tenant_id}/{sighting_id}/capture.txt"
    payload = b"CRITICAL FORENSIC EVIDENCE: Suspected NilaPay phishing kit with stolen logo."

    expected_hash = hashlib.sha256(payload).hexdigest()

    # 1. Save to storage vault
    file_path, actual_hash = save_evidence_content(object_key, payload)
    assert actual_hash == expected_hash
    assert file_path.exists()

    # 2. Verify integrity
    is_valid, computed_hash = verify_evidence_integrity(object_key, expected_hash)
    assert is_valid is True
    assert computed_hash == expected_hash

    # 3. Signed token generation and verification
    token = generate_signed_evidence_token(object_key, expires_in_seconds=60)
    assert verify_signed_evidence_token(object_key, token) is True

    # Tampered key should fail token verification
    assert verify_signed_evidence_token("other_tenant/other_key.txt", token) is False

    # Tampered token should fail
    assert verify_signed_evidence_token(object_key, "invalid:token") is False

    # 4. Deletion workflow
    deleted = delete_evidence_object(object_key)
    assert deleted is True
    assert load_evidence_content(object_key) is None


def test_customer_offboarding_purge():
    """Verify complete tenant evidence purge during customer offboarding."""
    tenant_id = uuid.uuid4()
    key1 = f"{tenant_id}/s1/doc1.txt"
    key2 = f"{tenant_id}/s2/doc2.txt"

    save_evidence_content(key1, b"Evidence 1")
    save_evidence_content(key2, b"Evidence 2")

    assert load_evidence_content(key1) == b"Evidence 1"
    assert load_evidence_content(key2) == b"Evidence 2"

    purged_count = purge_tenant_evidence(tenant_id)
    assert purged_count == 2
    assert load_evidence_content(key1) is None
    assert load_evidence_content(key2) is None


def test_evidence_object_keys_cannot_escape_storage_boundary():
    """Evidence keys must never write, read, or delete outside the vault."""
    with pytest.raises(ValueError):
        save_evidence_content("../outside.txt", b"secret")
    with pytest.raises(ValueError):
        load_evidence_content("../../outside.txt")
    with pytest.raises(ValueError):
        delete_evidence_object("/absolute/outside.txt")


def test_webhook_fail_closed_verification():
    """Verify that webhook signatures strictly fail closed across all invalid states."""
    import hmac
    from app.integrations.meta import verify_webhook_signature, normalize_meta_webhook_event

    payload = b'{"object":"instagram","entry":[{"id":"12345"}]}'
    valid_secret = "test_meta_webhook_super_secret_key"
    valid_hash = hmac.new(valid_secret.encode(), payload, hashlib.sha256).hexdigest()
    valid_header = f"sha256={valid_hash}"

    # 1. Missing secret must fail closed (return False)
    assert verify_webhook_signature(payload, valid_header, secret="") is False

    # 2. Missing or malformed signature header must fail closed (return False)
    assert verify_webhook_signature(payload, "", secret=valid_secret) is False
    assert verify_webhook_signature(payload, "invalid_header_without_prefix", secret=valid_secret) is False

    # 3. Tampered payload or wrong hash must fail closed (return False)
    assert verify_webhook_signature(b'{"tampered":"data"}', valid_header, secret=valid_secret) is False
    assert verify_webhook_signature(payload, "sha256=0000000000000000000000000000000000000000000000000000000000000000", secret=valid_secret) is False

    # 4. Valid signature with valid secret passes
    assert verify_webhook_signature(payload, valid_header, secret=valid_secret) is True

    # 5. Normalization test
    sample_entry = {
        "changes": [
            {
                "field": "messages",
                "value": {
                    "id": "msg_999",
                    "from": {"id": "111222", "username": "impersonator_bank"},
                    "text": "Your account is locked, click phishing link",
                    "created_time": "2026-10-11T10:00:00Z"
                }
            }
        ]
    }
    normalized = normalize_meta_webhook_event(sample_entry)
    assert len(normalized) == 1
    assert normalized[0]["surface"] == "instagram"
    assert normalized[0]["normalized_payload"]["sender"]["username"] == "impersonator_bank"
