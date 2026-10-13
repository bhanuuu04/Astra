import hashlib
import hmac
import logging
import os
from pathlib import Path
import time
from typing import Optional, Tuple
import uuid

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def get_storage_base_dir() -> Path:
    settings = get_settings()
    base_dir = Path(settings.evidence_storage_path)
    base_dir.mkdir(parents=True, exist_ok=True)
    return base_dir


def _safe_object_path(object_key: str) -> Path:
    """Resolve an evidence key without allowing traversal or symlink escapes."""
    if not object_key or "\x00" in object_key:
        raise ValueError("Evidence object key is invalid")
    base_dir = get_storage_base_dir().resolve()
    candidate = (base_dir / object_key).resolve()
    try:
        candidate.relative_to(base_dir)
    except ValueError as exc:
        raise ValueError("Evidence object key escapes the storage boundary") from exc
    return candidate


def save_evidence_content(object_key: str, content_bytes: bytes) -> Tuple[Path, str]:
    """Persist raw evidence bytes to durable storage vault and return (file_path, sha256_hash)."""
    file_path = _safe_object_path(object_key)

    # Ensure parent directory exists
    file_path.parent.mkdir(parents=True, exist_ok=True)

    # Atomic write to storage
    temp_file = file_path.with_suffix(".tmp")
    temp_file.write_bytes(content_bytes)
    temp_file.replace(file_path)

    # Calculate cryptographic SHA-256
    sha256_hash = hashlib.sha256(content_bytes).hexdigest()
    logger.info(f"Persisted evidence object {object_key} ({len(content_bytes)} bytes, sha256: {sha256_hash})")
    return file_path, sha256_hash


def load_evidence_content(object_key: str) -> Optional[bytes]:
    """Retrieve raw evidence bytes from storage vault."""
    file_path = _safe_object_path(object_key)
    if not file_path.exists() or not file_path.is_file():
        return None
    return file_path.read_bytes()


def verify_evidence_integrity(object_key: str, expected_sha256: str) -> Tuple[bool, Optional[str]]:
    """Cryptographically verify stored evidence bytes against expected SHA-256 hash."""
    content = load_evidence_content(object_key)
    if content is None:
        return False, None
    actual_hash = hashlib.sha256(content).hexdigest()
    return actual_hash == expected_sha256, actual_hash


def generate_signed_evidence_token(object_key: str, expires_in_seconds: int = 300) -> str:
    """Generate short-lived cryptographic authorization token for authorized evidence retrieval."""
    settings = get_settings()
    secret = (settings.admin_api_key or "astra_evidence_signing_key").encode()
    expiry = int(time.time()) + expires_in_seconds
    message = f"{object_key}:{expiry}".encode()
    sig = hmac.new(secret, message, hashlib.sha256).hexdigest()
    return f"{expiry}:{sig}"


def verify_signed_evidence_token(object_key: str, token: str) -> bool:
    """Validate that the signed token is authentic and has not expired."""
    try:
        settings = get_settings()
        secret = (settings.admin_api_key or "astra_evidence_signing_key").encode()
        parts = token.split(":")
        if len(parts) != 2:
            return False
        expiry = int(parts[0])
        sig = parts[1]

        if time.time() > expiry:
            return False  # Expired

        expected_sig = hmac.new(secret, f"{object_key}:{expiry}".encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(sig, expected_sig)
    except Exception:
        return False


def delete_evidence_object(object_key: str) -> bool:
    """Retention / Deletion Workflow: permanently delete an evidence object from storage."""
    file_path = _safe_object_path(object_key)
    if file_path.exists() and file_path.is_file():
        file_path.unlink()
        logger.info(f"Permanently purged evidence object {object_key}")
        return True
    return False


def purge_tenant_evidence(tenant_id: uuid.UUID) -> int:
    """Customer Offboarding Workflow: permanently purge all evidence stored for a tenant."""
    base_dir = get_storage_base_dir()
    tenant_dir = base_dir / str(tenant_id)
    if not tenant_dir.exists() or not tenant_dir.is_dir():
        return 0

    count = 0
    for file in tenant_dir.glob("**/*"):
        if file.is_file():
            file.unlink()
            count += 1

    # Remove empty directories
    for folder in sorted(tenant_dir.glob("**/*"), reverse=True):
        if folder.is_dir():
            try:
                folder.rmdir()
            except OSError:
                pass
    try:
        tenant_dir.rmdir()
    except OSError:
        pass

    logger.info(f"Customer offboarding: purged {count} evidence items for tenant {tenant_id}")
    return count
