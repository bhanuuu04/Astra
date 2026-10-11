import json
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def generate_analyst_summary(
    campaign_title: str,
    risk_score: int,
    signals: List[Dict[str, Any]],
    pivots: List[Dict[str, Any]],
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate an AI-powered executive analyst summary for a threat campaign."""
    settings = get_settings()
    gemini_key = api_key or settings.gemini_api_key
    openai_key = settings.openai_api_key

    # 1. Try Gemini if configured
    if gemini_key:
        try:
            summary = await _call_gemini_api(gemini_key, campaign_title, risk_score, signals, pivots)
            if summary:
                return {
                    "provider": "google_gemini_1.5_flash",
                    "is_live_llm": True,
                    "summary_text": summary,
                }
        except Exception as e:
            logger.warning(f"Gemini API call failed, falling back: {e}")

    # 2. Try OpenAI if configured
    if openai_key:
        try:
            summary = await _call_openai_api(openai_key, campaign_title, risk_score, signals, pivots)
            if summary:
                return {
                    "provider": "openai_gpt4o_mini",
                    "is_live_llm": True,
                    "summary_text": summary,
                }
        except Exception as e:
            logger.warning(f"OpenAI API call failed, falling back: {e}")

    # 3. Deterministic Forensic Synthesis Fallback
    return {
        "provider": "astra_deterministic_nlp_engine",
        "is_live_llm": False,
        "summary_text": _generate_rule_based_summary(campaign_title, risk_score, signals, pivots),
        "note": "Generated via ASTRA Forensic Reason Engine. Set GEMINI_API_KEY or OPENAI_API_KEY in .env for external cloud LLM generation.",
    }


async def _call_gemini_api(key: str, title: str, score: int, signals: List[Dict], pivots: List[Dict]) -> Optional[str]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    prompt = (
        f"You are an analyst assistant. Use only the supplied records; do not infer malware behavior, victim impact, actor identity, legal violations, or provider verdicts.\n"
        f"Campaign title: {title}\nASTRA heuristic triage score: {score}/100 (not a probability)\n"
        f"Recorded signals: {json.dumps(signals[:6])}\nProposed or reviewed pivots: {json.dumps(pivots[:6])}\n\n"
        f"Summarize what is recorded, what is not established, and what an analyst should verify next. State clearly that no external action has been submitted."
    )
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    return None


async def _call_openai_api(key: str, title: str, score: int, signals: List[Dict], pivots: List[Dict]) -> Optional[str]:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    prompt = (
        f"Analyze threat campaign '{title}' (Risk {score}/100) with signals {json.dumps(signals[:4])} and pivots {json.dumps(pivots[:4])}. "
        f"Provide a concise 3-paragraph executive summary with attack vector, correlated pivots, and takedown recommendation."
    )
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a cyber risk intelligence analyst."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    return None


def _generate_rule_based_summary(title: str, score: int, signals: List[Dict], pivots: List[Dict]) -> str:
    """Conservative summary that does not add facts missing from source records."""
    sig_names = [s.get("detector_name") or s.get("signal_type", "threat_indicator") for s in signals]
    pivot_types = sorted(set(p.get("pivot_type", "shared_indicator") for p in pivots))

    return (
        f"### Analyst summary\n\n"
        f"Campaign: {title}\n"
        f"ASTRA heuristic triage score: {score}/100. This score is not a probability or a confirmed provider verdict.\n\n"
        f"Recorded detector signals: {', '.join(sig_names[:6]) if sig_names else 'None recorded.'}\n"
        f"Recorded pivot types: {', '.join(pivot_types) if pivot_types else 'None recorded.'}\n\n"
        f"Review the original source records and evidence before treating this activity as malicious. Confirm target ownership, timestamps, and impact. No external report or mitigation has been submitted."
    )
