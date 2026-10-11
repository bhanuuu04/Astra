"""Brand DNA verification service with DNS TXT challenge verification.

Implements DNS-based domain ownership verification, OAuth proof verification,
and manual analyst verification for brand assets per DRP specification.
"""
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Optional, Tuple

import dns.resolver
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import BrandAsset, User


class VerificationError(Exception):
    """Raised when verification fails."""
    pass


def generate_challenge_token(tenant_id: uuid.UUID, brand_id: uuid.UUID, domain: str) -> str:
    """Generate a cryptographically secure challenge token for DNS TXT verification.
    
    Args:
        tenant_id: The tenant identifier
        brand_id: The brand identifier
        domain: The domain being verified
        
    Returns:
        A hex-encoded challenge token (64 characters)
    """
    random_part = secrets.token_hex(16)  # 32 hex chars
    domain_hash = hashlib.sha256(f"{tenant_id}:{brand_id}:{domain}".encode()).hexdigest()[:32]
    return f"{random_part}{domain_hash}"


def get_expected_txt_record(token: str) -> str:
    """Format the expected TXT record value.
    
    Args:
        token: The challenge token
        
    Returns:
        Formatted TXT record string for DNS verification
    """
    return f"astra-verification={token}"


def check_txt_record(domain: str, expected_token: str, timeout: float = 5.0) -> Tuple[bool, Optional[str]]:
    """Check if domain has the expected TXT record for verification.
    
    Args:
        domain: The domain to check
        expected_token: The challenge token to verify
        timeout: DNS query timeout in seconds
        
    Returns:
        Tuple of (is_verified, error_message)
    """
    expected_record = get_expected_txt_record(expected_token)
    
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = timeout
        resolver.lifetime = timeout
        
        # Query TXT records for the domain
        answers = resolver.resolve(domain, 'TXT')
        
        # Check if any TXT record matches our expected value
        for rdata in answers:
            for txt_string in rdata.strings:
                decoded = txt_string.decode('utf-8', errors='ignore')
                if decoded == expected_record:
                    return True, None
        
        return False, f"TXT record not found. Expected: {expected_record}"
        
    except dns.resolver.NXDOMAIN:
        return False, f"Domain {domain} does not exist"
    except dns.resolver.NoAnswer:
        return False, f"No TXT records found for {domain}"
    except dns.resolver.Timeout:
        return False, f"DNS query timeout for {domain}"
    except Exception as e:
        return False, f"DNS verification error: {str(e)}"


def initiate_domain_verification(
    session: Session,
    brand_asset: BrandAsset,
    initiated_by: uuid.UUID
) -> str:
    """Initiate domain ownership verification by generating a challenge token.
    
    Args:
        session: Database session
        brand_asset: The brand asset to verify (must be domain type)
        initiated_by: User ID initiating verification
        
    Returns:
        Challenge token to be added to DNS TXT record
        
    Raises:
        ValueError: If asset is not a domain type
    """
    if brand_asset.asset_type not in ('domain', 'web_domain'):
        raise ValueError(f"Asset type {brand_asset.asset_type} cannot be verified via DNS")
    
    domain = brand_asset.canonical_value
    token = generate_challenge_token(brand_asset.tenant_id, brand_asset.brand_id, domain)
    
    # Store challenge token in metadata
    if not brand_asset.asset_metadata:
        brand_asset.asset_metadata = {}
    
    brand_asset.asset_metadata['challenge_token'] = token
    brand_asset.asset_metadata['challenge_initiated_at'] = datetime.utcnow().isoformat()
    brand_asset.asset_metadata['challenge_initiated_by'] = str(initiated_by)
    brand_asset.verification_status = 'pending_challenge'
    brand_asset.verification_method = 'dns_txt'
    
    session.commit()
    
    return token


def verify_domain_ownership(
    session: Session,
    brand_asset: BrandAsset,
    verified_by: uuid.UUID
) -> Tuple[bool, Optional[str]]:
    """Verify domain ownership by checking DNS TXT record.
    
    Args:
        session: Database session
        brand_asset: The brand asset to verify
        verified_by: User ID performing verification
        
    Returns:
        Tuple of (is_verified, error_message)
    """
    if brand_asset.asset_type not in ('domain', 'web_domain'):
        return False, f"Asset type {brand_asset.asset_type} cannot be verified via DNS"
    
    if not brand_asset.asset_metadata or 'challenge_token' not in brand_asset.asset_metadata:
        return False, "No challenge token found. Please initiate verification first."
    
    domain = brand_asset.canonical_value
    token = brand_asset.asset_metadata['challenge_token']
    
    # Check DNS TXT record
    is_valid, error_msg = check_txt_record(domain, token)
    
    if is_valid:
        # Update verification status
        brand_asset.verification_status = 'verified'
        brand_asset.verified_at = datetime.utcnow()
        brand_asset.verified_by = verified_by
        
        # Add verification record to metadata
        if not brand_asset.asset_metadata:
            brand_asset.asset_metadata = {}
        brand_asset.asset_metadata['verified_at'] = datetime.utcnow().isoformat()
        brand_asset.asset_metadata['verification_method'] = 'dns_txt'
        
        session.commit()
        return True, None
    else:
        return False, error_msg


def verify_asset_manual(
    session: Session,
    brand_asset: BrandAsset,
    verified_by: uuid.UUID,
    reason: str
) -> None:
    """Manually verify a brand asset with analyst attestation.
    
    Args:
        session: Database session
        brand_asset: The brand asset to verify
        verified_by: User ID performing manual verification
        reason: Attestation reason/evidence for manual verification
        
    Raises:
        ValueError: If reason is empty
    """
    if not reason or not reason.strip():
        raise ValueError("Manual verification requires a reason/attestation")
    
    brand_asset.verification_status = 'verified'
    brand_asset.verification_method = 'manual_analyst'
    brand_asset.verified_at = datetime.utcnow()
    brand_asset.verified_by = verified_by
    
    if not brand_asset.asset_metadata:
        brand_asset.asset_metadata = {}
    
    brand_asset.asset_metadata['manual_verification_reason'] = reason
    brand_asset.asset_metadata['verified_at'] = datetime.utcnow().isoformat()
    
    session.commit()


def revoke_verification(
    session: Session,
    brand_asset: BrandAsset,
    revoked_by: uuid.UUID,
    reason: str
) -> None:
    """Revoke verification status of a brand asset.
    
    Args:
        session: Database session
        brand_asset: The brand asset to revoke
        revoked_by: User ID revoking verification
        reason: Reason for revocation
    """
    if not reason or not reason.strip():
        raise ValueError("Revocation requires a reason")
    
    brand_asset.verification_status = 'unverified'
    brand_asset.verified_at = None
    brand_asset.verified_by = None
    
    if not brand_asset.asset_metadata:
        brand_asset.asset_metadata = {}
    
    brand_asset.asset_metadata['revoked_at'] = datetime.utcnow().isoformat()
    brand_asset.asset_metadata['revoked_by'] = str(revoked_by)
    brand_asset.asset_metadata['revocation_reason'] = reason
    
    session.commit()


def get_verification_instructions(asset_type: str, domain: str, token: str) -> dict:
    """Get human-readable verification instructions.
    
    Args:
        asset_type: Type of asset being verified
        domain: Domain name
        token: Challenge token
        
    Returns:
        Dictionary with instructions and expected values
    """
    if asset_type in ('domain', 'web_domain'):
        expected_record = get_expected_txt_record(token)
        return {
            "method": "DNS TXT Record",
            "domain": domain,
            "record_type": "TXT",
            "record_name": domain,
            "record_value": expected_record,
            "instructions": [
                f"1. Log into your DNS provider's control panel",
                f"2. Add a new TXT record for domain: {domain}",
                f"3. Set the TXT record value to: {expected_record}",
                f"4. Wait for DNS propagation (typically 5-60 minutes)",
                f"5. Click 'Verify' to complete verification"
            ],
            "verification_check": f"You can test DNS propagation using: nslookup -type=TXT {domain}"
        }
    
    return {
        "method": "Manual Verification",
        "instructions": ["Contact system administrator for manual verification"]
    }


def check_asset_verified(session: Session, brand_id: uuid.UUID, asset_type: str, value: str) -> bool:
    """Check if a specific brand asset is verified.
    
    Args:
        session: Database session
        brand_id: Brand identifier
        asset_type: Type of asset
        value: Canonical value to check
        
    Returns:
        True if asset exists and is verified
    """
    asset = session.scalar(
        select(BrandAsset).where(
            BrandAsset.brand_id == brand_id,
            BrandAsset.asset_type == asset_type,
            BrandAsset.canonical_value == value
        )
    )
    
    return asset is not None and asset.verification_status == 'verified'
