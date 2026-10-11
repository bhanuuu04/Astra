import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import TenantContext, get_current_tenant_context
from app.db.models import Campaign, CampaignEdge, CampaignMember, Signal
from app.db.session import get_session
from app.integrations.google_play import inspect_app_listing
from app.integrations.llm import generate_analyst_summary
from app.integrations.meta import get_instagram_user_metadata
from app.integrations.virustotal import check_file_reputation, check_url_reputation
from app.integrations.youtube import search_brand_impersonation

router = APIRouter(prefix="/api/v1", tags=["integrations"])


class VirusTotalCheckRequest(BaseModel):
    url: Optional[str] = None
    file_hash: Optional[str] = None


class YouTubeScanRequest(BaseModel):
    brand_name: str = Field(default="Astra Security")
    query_suffix: Optional[str] = "support customer care update"
    max_results: Optional[int] = 5


class GooglePlayInspectRequest(BaseModel):
    package_name: str = Field(default="com.astra.security.patch.updater")
    brand_name: str = Field(default="Astra Security")


class AISummaryRequest(BaseModel):
    pass


@router.get("/integrations/status")
def get_integrations_status() -> Dict[str, Any]:
    """Return honest health & configuration status of all third-party external connectors.
    Connectors that lack valid credentials are never labeled as 'live'.
    """
    s = get_settings()
    vt_active = bool(s.virustotal_api_key)
    yt_active = bool(s.youtube_api_key)
    meta_active = bool(s.meta_page_access_token and s.meta_app_secret)
    gp_active = bool(s.google_play_service_account_json)
    ai_active = bool(s.gemini_api_key or s.openai_api_key)

    return {
        "status": "configuration_report",
        "connectors": {
            "database_pgvector": {
                "name": "PostgreSQL System of Record",
                "configured": bool(s.database_url),
                "is_live": False,
                "status": "configured" if s.database_url else "unconfigured",
                "scope": "operational_system_of_record",
            },
            "virustotal": {
                "name": "VirusTotal API v3",
                "configured": vt_active,
                "is_live": False,
                "status": "configured" if vt_active else "unconfigured",
                "scope": "file_and_url_reputation_enrichment",
                "note": "Credential configured; connector health is not checked here" if vt_active else "API key missing in environment",
            },
            "youtube": {
                "name": "YouTube Data API v3",
                "configured": yt_active,
                "is_live": False,
                "status": "configured" if yt_active else "unconfigured",
                "scope": "video_and_channel_search",
                "note": "Credential configured; connector health is not checked here" if yt_active else "API key missing in environment",
            },
            "meta_instagram": {
                "name": "Meta / Instagram Graph API",
                "configured": meta_active,
                "is_live": False,
                "status": "configured" if meta_active else "unconfigured",
                "scope": "webhook_brand_mention_ingestion",
                "note": "Webhook credentials configured; provider delivery is not health-checked here" if meta_active else "Page access token or app secret not configured",
            },
            "google_play": {
                "name": "Google Play Store Catalog Watcher",
                "configured": gp_active,
                "is_live": False,
                "status": "configured" if gp_active else "unconfigured",
                "scope": "package_metadata_inspection",
                "note": "Service account configured; provider reachability is not checked here" if gp_active else "Service account JSON not configured",
            },
            "ai_llm_provider": {
                "name": "AI Executive Threat Briefing Assistant",
                "configured": ai_active,
                "is_live": False,
                "status": "configured" if ai_active else "deterministic_fallback",
                "scope": "analyst_draft_synthesis",
                "note": "Provider key configured; provider health is not checked here" if ai_active else "Using a rule-based summary; validate all findings against source evidence",
            },
            "sentry": {
                "name": "Sentry Error Monitoring",
                "configured": bool(s.sentry_dsn),
                "is_live": False,
                "status": "configured" if s.sentry_dsn else "unconfigured",
            },
        },
    }


@router.post("/integrations/virustotal/check")
async def run_virustotal_check(
    request: VirusTotalCheckRequest,
    context: TenantContext = Depends(get_current_tenant_context),
) -> Dict[str, Any]:
    """Check a suspicious URL or APK SHA-256 hash against VirusTotal or heuristic scanner."""
    if request.url:
        return await check_url_reputation(request.url)
    elif request.file_hash:
        return await check_file_reputation(request.file_hash)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either 'url' or 'file_hash' to inspect.",
        )


@router.post("/integrations/youtube/scan")
async def run_youtube_scan(
    request: YouTubeScanRequest,
    context: TenantContext = Depends(get_current_tenant_context),
) -> Dict[str, Any]:
    """Search YouTube for suspicious brand impersonation videos, tutorials, and fake helpdesks."""
    return await search_brand_impersonation(
        brand_name=request.brand_name,
        query_suffix=request.query_suffix or "support customer care",
        max_results=request.max_results or 5,
    )


@router.post("/integrations/google-play/inspect")
def run_google_play_inspect(
    request: GooglePlayInspectRequest,
    context: TenantContext = Depends(get_current_tenant_context),
) -> Dict[str, Any]:
    """Inspect Android package listing and review sentiment for brand imitation."""
    return inspect_app_listing(
        package_name=request.package_name,
        brand_name=request.brand_name,
    )


@router.post("/campaigns/{campaign_id}/ai-summary")
async def generate_campaign_ai_summary(
    campaign_id: uuid.UUID,
    request: AISummaryRequest = AISummaryRequest(),
    session: Session = Depends(get_session),
    context: TenantContext = Depends(get_current_tenant_context),
) -> Dict[str, Any]:
    """Generate an AI-powered executive analyst summary for a threat campaign."""
    campaign = session.scalar(
        select(Campaign).where(Campaign.id == campaign_id, Campaign.tenant_id == context.tenant_id)
    )
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    # Join CampaignMember to get all signals for sightings in this campaign
    signals = list(
        session.scalars(
            select(Signal)
            .join(CampaignMember, CampaignMember.sighting_id == Signal.sighting_id)
            .where(CampaignMember.campaign_id == campaign_id)
        ).all()
    )
    edges = list(session.scalars(select(CampaignEdge).where(CampaignEdge.campaign_id == campaign_id)).all())

    signals_data = [
        {
            "detector_name": s.detector_key,
            "severity": "critical" if s.score >= 0.8 else "high" if s.score >= 0.6 else "medium" if s.score >= 0.4 else "low",
            "score": s.score,
        }
        for s in signals
    ]
    edges_data = [{"pivot_type": e.pivot_type, "confidence": e.confidence} for e in edges]

    return await generate_analyst_summary(
        campaign_title=campaign.title,
        risk_score=int(round(campaign.risk_score)),
        signals=signals_data,
        pivots=edges_data,
    )
