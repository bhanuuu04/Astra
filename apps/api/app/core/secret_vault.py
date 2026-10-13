"""Cryptographic Secret Vault for secure storage of external connector credentials.

Uses Fernet symmetric authenticated encryption (AES-128-CBC + HMAC-SHA256)
with keys derived from application secret key or dedicated vault master key.
Detects tampering, prevents plain-text leakage, and enforces fail-closed decryption.
"""
import base64
import hashlib
import json
import logging
from typing import Any, Dict, Optional

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings

logger = logging.getLogger(__name__)

VAULT_PREFIX = "vault:v1:"


def derive_vault_key(secret_key: Optional[str] = None) -> bytes:
    """Derive a URL-safe 32-byte Fernet key from secret key using SHA-256."""
    s = get_settings()
    candidate_secrets = [
        secret_key,
        getattr(s, "vault_encryption_key", ""),
        getattr(s, "api_secret_key", ""),
        getattr(s, "jwt_secret", ""),
    ]
    raw_secret = None
    for sec in candidate_secrets:
        if sec and sec not in ("INSECURE_DEFAULT_CHANGE_IN_PRODUCTION", "replace-this"):
            raw_secret = sec
            break
    if not raw_secret:
        raw_secret = getattr(s, "jwt_secret", "") or getattr(s, "api_secret_key", "") or "astra_vault_secret_fallback"
    # Derive deterministic 32 bytes with vault-specific domain separation
    derived = hashlib.sha256(f"astra_vault_fernet_v1:{raw_secret}".encode("utf-8")).digest()
    return base64.urlsafe_b64encode(derived)


def encrypt_secret_payload(payload: Dict[str, Any], secret_key: Optional[str] = None) -> str:
    """Serialize and encrypt a dictionary payload into an authenticated vault reference.
    
    Args:
        payload: Dictionary containing secret keys (tokens, passwords, api keys)
        secret_key: Optional override for master key
        
    Returns:
        Formatted vault reference string: vault:v1:<fernet_token>
    """
    if not payload:
        raise ValueError("Cannot encrypt empty secret payload.")
    
    fernet_key = derive_vault_key(secret_key)
    fernet = Fernet(fernet_key)
    
    serialized = json.dumps(payload, sort_keys=True).encode("utf-8")
    ciphertext = fernet.encrypt(serialized).decode("utf-8")
    
    return f"{VAULT_PREFIX}{ciphertext}"


def decrypt_secret_payload(vault_ref: str, secret_key: Optional[str] = None) -> Dict[str, Any]:
    """Decrypt an authenticated vault reference back to its original dictionary.
    
    Args:
        vault_ref: Vault reference formatted as vault:v1:<token>
        secret_key: Optional override for master key
        
    Returns:
        Decrypted dictionary
        
    Raises:
        ValueError: If reference is malformed, corrupted, or tampered with
    """
    if not vault_ref or not vault_ref.startswith(VAULT_PREFIX):
        raise ValueError("Invalid vault reference format. Expected 'vault:v1:<token>'")
    
    ciphertext = vault_ref[len(VAULT_PREFIX):].strip()
    fernet_key = derive_vault_key(secret_key)
    fernet = Fernet(fernet_key)
    
    try:
        decrypted_bytes = fernet.decrypt(ciphertext.encode("utf-8"))
        return json.loads(decrypted_bytes.decode("utf-8"))
    except InvalidToken:
        logger.error("Tampering or corrupt secret detected in vault reference.")
        raise ValueError("Failed to decrypt secret payload: invalid or tampered vault reference.")
    except Exception as e:
        logger.error(f"Vault decryption error: {e}")
        raise ValueError(f"Vault decryption error: {str(e)}")


def mask_secret_dict(payload: Dict[str, Any]) -> Dict[str, str]:
    """Return masked values for audit logs and safe presentation (e.g. 'ak_123***ef')."""
    masked = {}
    for k, v in payload.items():
        if isinstance(v, str):
            if len(v) <= 8:
                masked[k] = "******"
            else:
                masked[k] = f"{v[:4]}...{v[-4:]}"
        else:
            masked[k] = "******"
    return masked
