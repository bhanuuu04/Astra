from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    AuditEvent,
    Brand,
    Campaign,
    CampaignMember,
    EvidenceObject,
    ResponseAction,
    Sighting,
)
from app.schemas.response import (
    EvidenceManifestItem,
    ResponseDraftItem,
    ResponsePacketResponse,
    SimulateActionResponse,
)


def generate_campaign_response_packet(session: Session, campaign_id: uuid.UUID) -> ResponsePacketResponse:
    campaign = session.scalar(select(Campaign).where(Campaign.id == campaign_id))
    if not campaign:
        raise ValueError(f"Campaign {campaign_id} not found")

    brand = session.scalar(select(Brand).where(Brand.id == campaign.brand_id))
    brand_name = brand.name if brand else "Astra Security"

    # Get campaign members
    members = list(session.scalars(
        select(Sighting)
        .join(CampaignMember, CampaignMember.sighting_id == Sighting.id)
        .where(CampaignMember.campaign_id == campaign_id)
    ).all())

    member_ids = [m.id for m in members]

    # Get evidence objects
    evidence_objs = list(session.scalars(
        select(EvidenceObject).where(EvidenceObject.sighting_id.in_(member_ids))
    ).all()) if member_ids else []

    # 1. Build Evidence Manifest
    manifest_items: List[EvidenceManifestItem] = []
    for ev in evidence_objs:
        manifest_items.append(
            EvidenceManifestItem(
                id=str(ev.id),
                name=f"Capture-{ev.sha256[:8]}.txt",
                media_type=ev.media_type,
                sha256=ev.sha256,
                captured_at=ev.captured_at.isoformat() if ev.captured_at else datetime.now(timezone.utc).isoformat(),
                source_reference=ev.source_ref or "Sighting raw telemetry",
                included=True,
            )
        )

    if not manifest_items:
        raise ValueError("Response drafts require at least one persisted evidence object")

    # 2. Extract targets
    handles = []
    domains = []
    apks = []

    for m in members:
        payload = m.normalized_payload or {}
        content = payload.get("content", "")
        sender = payload.get("sender") or {}
        if sender.get("username"):
            handles.append(f"@{sender['username']} ({m.surface})")
        if ".apk" in content.lower():
            import re
            apks.extend(re.findall(r"[A-Za-z0-9_.-]+\.apk", content, flags=re.IGNORECASE))
        if "http" in content:
            import urllib.parse
            import re
            for u in re.findall(r'https?://[^\s]+', content):
                try:
                    domains.append(urllib.parse.urlparse(u).netloc)
                except Exception:
                    pass

    target_handles_str = ", ".join(sorted(set(handles)))
    target_domains_str = ", ".join(sorted(set(domains)))
    target_apks_str = ", ".join(sorted(set(apks)))

    # Legacy canned notices are retained as a non-executed migration reference
    # while existing response templates are replaced with evidence-linked drafts.
    '''
    # 3. Compile Multi-Recipient Drafts
    drafts: List[ResponseDraftItem] = [
        # A. Meta Rights Manager
        ResponseDraftItem(
            recipient_type="meta",
            recipient_name="Meta Rights Manager / Instagram Abuse Desk",
            subject=f"[DMCA / URGENT TAKEDOWN] Brand Impersonation & Phishing attacking {brand_name}",
            body_text=(
                f"ATTN: Meta Trust & Safety Desk\n\n"
                f"We formally report unauthorized fraudulent accounts impersonating '{brand_name}' on Meta platforms:\n"
                f"Offending Handles: {target_handles_str}\n"
                f"Violations: Brand Impersonation, Credential Harvesting, Distribution of Malicious Links.\n"
                f"Astra Forensic Risk Score: {campaign.risk_score}/100 [CRITICAL]\n\n"
                f"Evidence Manifest attached: {len(manifest_items)} cryptographically hashed captures.\n"
                f"Please remove immediately pursuant to Meta Trademark & Impersonation Policies."
            ),
            contact_email="ip@instagram.com",
            portal_url="https://help.instagram.com/contact/636276399721841",
            policy_reference="Meta Brand Rights Protection & Impersonation Policy",
        ),
        # B. X Policy
        ResponseDraftItem(
            recipient_type="x_twitter",
            recipient_name="X Safety Operations Desk",
            subject=f"[TRADEMARK INFRINGEMENT] Deceptive Account Revocation Request: {target_handles_str}",
            body_text=(
                f"ATTN: X Brand Safety & Trust Operations\n\n"
                f"The following accounts mimic official enterprise handle '{brand_name}' using homoglyphs & fake verification:\n"
                f"Offending Accounts: {target_handles_str}\n"
                f"Attack Vector: Direct message extortion & trademark infringement fraud.\n\n"
                f"We demand immediate handle suspension and revocation under X Impersonation Policy."
            ),
            contact_email="safety@x.com",
            portal_url="https://help.x.com/forms/impersonation",
            policy_reference="X Brand Impersonation & Deceptive Identity Policy",
        ),
        # C. Google Play Protect & Android Malware Desk
        ResponseDraftItem(
            recipient_type="google_play",
            recipient_name="Google Play Protect & Abuse Registrar",
            subject=f"[MALWARE BULLETIN] Trojanized Mobile APK Mimicking {brand_name}",
            body_text=(
                f"ATTN: Google Play Protect Android Security Team\n\n"
                f"We have identified an active malicious campaign distributing counterfeit Android APKs falsely labeled as {brand_name}:\n"
                f"Rogue Payload: {target_apks_str}\n"
                f"Hosting Infrastructure: {target_domains_str}\n\n"
                f"The APK mimics official brand package and extracts SMS/TOTP authentication tokens.\n"
                f"Request: Add SHA-256 signatures to Play Protect blacklist and flag hosting domain in Safe Browsing."
            ),
            contact_email="googleplay-developer-support@google.com",
            portal_url="https://support.google.com/googleplay/android-developer/contact/takedown",
            policy_reference="Google Play Malware & Counterfeit Application Policy",
        ),
        # D. ICANN Registrar / WHOIS Abuse
        ResponseDraftItem(
            recipient_type="icann_registrar",
            recipient_name="ICANN Domain Registrar WHOIS Abuse Desk",
            subject=f"[PHISHING TAKEDOWN] Malicious Lookalike Domain: {target_domains_str}",
            body_text=(
                f"ATTN: Registrar Abuse Contact\n\n"
                f"Unauthorized phishing landing domain mimicking {brand_name}:\n"
                f"Target Domain: {target_domains_str}\n"
                f"Harm: Hosting malware payloads and credential phishing landing pages.\n\n"
                f"Pursuant to ICANN RAA obligations, suspend DNS delegation immediately."
            ),
            contact_email="abuse@registrar-whois.org",
            portal_url="https://www.icann.org/compliance/complaints/abuse",
            policy_reference="ICANN Registrar Accreditation Agreement Phishing Takedown",
        ),
        # E. Payment Rail / Bank Fraud Desk
        ResponseDraftItem(
            recipient_type="payment_rail",
            recipient_name="Payment Rail & Bank Cyber Fraud Operations",
            subject=f"[FRAUD ACCOUNT FREEZE] Scam UPI Identifier: {target_upis_str}",
            body_text=(
                f"ATTN: Bank Fraud Risk Management Desk\n\n"
                f"A fraudulent payment identifier is actively soliciting extortion fees under brand impersonation:\n"
                f"Flagged Payment Identifier: {target_upis_str}\n\n"
                f"Request: Place temporary debit freeze and file suspicious transaction report with I4C / CERT-In."
            ),
            contact_email="fraud-risk@npci.org.in",
            portal_url="https://cybercrime.gov.in",
            policy_reference="National Cyber Fraud Reporting Portal Protocol",
        ),
        # F. Customer Advisory Notice
        ResponseDraftItem(
            recipient_type="customer_advisory",
            recipient_name="Brand Customer Safety Bulletin",
            subject=f"SECURITY ALERT: Active Impersonation Scam Warning for {brand_name} Customers",
            body_text=(
                f"CUSTOMER SECURITY NOTICE:\n\n"
                f"Our CyberDefense Threat Radar has identified scammers circulating fraudulent messages offering fake updates.\n"
                f"Official Reminder:\n"
                f"- {brand_name} will NEVER ask you to download .apk files via Instagram or Twitter DMs.\n"
                f"- Official updates are ONLY published on verified Google Play Store and Apple App Store.\n"
                f"- If you receive a message from {target_handles_str}, block immediately and report."
            ),
            contact_email=brand.name.lower().replace(" ", "") + "@security.org",
            portal_url=None,
            policy_reference="Enterprise Customer Trust & Disclosure Standard",
        ),
    ]
    '''

    # Replace legacy canned notices with one evidence-linked analyst draft.
    # Provider contacts, legal claims, and enforcement actions must be selected
    # by a human after validating the source evidence.
    observed_targets = []
    if target_handles_str:
        observed_targets.append(f"Profiles: {target_handles_str}")
    if target_domains_str:
        observed_targets.append(f"Domains: {target_domains_str}")
    if target_apks_str:
        observed_targets.append(f"APK names: {target_apks_str}")
    evidence_lines = [
        f"- {item.source_reference} · SHA-256 {item.sha256} · captured {item.captured_at}"
        for item in manifest_items
    ]
    body_lines = [
        "Analyst review required. This draft is not a finding of fact and has not been submitted to a provider.",
        f"Brand reference: {brand_name}",
        f"Campaign: {campaign.title}",
        f"ASTRA triage score: {campaign.risk_score}/100 (heuristic score; not a probability or provider verdict)",
        "Observed references:",
        *(observed_targets or ["No profile, domain, or APK target was extracted from the campaign records."]),
        "Persisted evidence:",
        *evidence_lines,
        "Before any external report, independently verify the target, evidence, impact, and the provider's current reporting process.",
    ]
    drafts = [
        ResponseDraftItem(
            recipient_type="analyst_review",
            recipient_name="Manual review required",
            subject=f"Review suspected brand abuse involving {brand_name}",
            body_text="\n".join(body_lines),
            contact_email="",
            portal_url=None,
            policy_reference="Select the applicable provider policy after evidence review",
        )
    ]

    # 4. Save ResponseAction record in DB as draft
    action_id = uuid.uuid4()
    resp_action = ResponseAction(
        id=action_id,
        campaign_id=campaign_id,
        action_type="multi_recipient_packet",
        draft_payload={
            "drafts": [d.model_dump() for d in drafts],
            "manifest": [m.model_dump() for m in manifest_items],
        },
        status="draft",
    )
    session.add(resp_action)

    # Audit event
    audit = AuditEvent(
        id=uuid.uuid4(),
        tenant_id=campaign.tenant_id,
        actor="system_response_compiler",
        event_type="response.drafts_compiled",
        entity_type="campaign",
        entity_id=str(campaign_id),
        safe_metadata={"action_id": str(action_id), "drafts_count": len(drafts)},
    )
    session.add(audit)
    session.commit()

    return ResponsePacketResponse(
        action_id=action_id,
        campaign_id=campaign_id,
        campaign_title=campaign.title,
        status="draft",
        drafts=drafts,
        manifest=manifest_items,
        created_at=resp_action.created_at,
    )


def simulate_response_action(
    session: Session,
    action_id: uuid.UUID,
    actor: str = "analyst@astra.security",
    notes: Optional[str] = None,
) -> SimulateActionResponse:
    action = session.scalar(select(ResponseAction).where(ResponseAction.id == action_id))
    if not action:
        raise ValueError(f"ResponseAction {action_id} not found")

    now_time = datetime.now(timezone.utc)
    action.status = "simulated"
    action.simulated_at = now_time
    action.simulated_by = actor

    # A simulation is a dry run. It does not approve the action or claim that
    # the external campaign has been mitigated.
    campaign = session.scalar(select(Campaign).where(Campaign.id == action.campaign_id))

    # Append audit event
    audit = AuditEvent(
        id=uuid.uuid4(),
        tenant_id=campaign.tenant_id if campaign else uuid.UUID("00000000-0000-0000-0000-000000000001"),
        actor=actor,
        event_type="action.simulated",
        entity_type="response_action",
        entity_id=str(action_id),
        safe_metadata={"notes": notes, "simulated_at": now_time.isoformat()},
    )
    session.add(audit)
    session.commit()

    return SimulateActionResponse(
        action_id=action.id,
        campaign_id=action.campaign_id,
        status="simulated",
        simulated_at=now_time,
        simulated_by=actor,
        message="Dry-run simulation logged to the audit trail. No external response was submitted.",
    )
