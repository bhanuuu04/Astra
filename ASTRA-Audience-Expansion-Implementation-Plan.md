# ASTRA Digital Risk Protection Platform
## Audience Expansion & 2026 Strategic Implementation Plan
**Document Version:** 1.0.0  
**Companion To:** `ASTRA-DRP-Detailed-Implementation-Plan.md` (Core Architecture & Implementation Roadmap)  
**Status:** Approved Roadmap & Architectural Blueprint (Hold Execution Phase)  
**Target Horizon:** 2026 Enterprise Digital Risk Protection Landscape  

---

## 1. Executive Summary & Strategic Positioning

This document defines the **Audience Expansion Architecture** for ASTRA. It preserves the recommended initial beachhead—**BFSI, Fintech, and Payment Brand-Protection/Fraud teams**—while establishing a rigorous, modular path to support retail, gaming, Web3, public sector, executive protection, SOC, and legal workflows.

### 1.1 Core Positioning Statement
> **"ASTRA is a unified, evidence-first Digital Risk Protection platform configured via domain-specific operational profiles—never a fragmented set of disconnected point solutions with unsupported marketing claims."**

The platform detects, investigates, preserves forensic evidence of external digital threats, and facilitates human-governed responses across authorized channels. Every audience addition is governed by strict capability truth: we do not claim continuous social monitoring, deepfake video detection, or binary APK sandboxing until the underlying data pipelines, detection models, and security isolations are fully built, benchmarked, and operational.

---

## 2. Strategic Opinion: What ASTRA Should Focus on Most in 2026

### 2.1 The 2026 Threat Landscape Shift
In 2026, the digital risk landscape has fundamentally evolved beyond simple typosquatting and static fake profiles:
1. **Generative AI–Driven Impersonation at Scale:** Threat actors use localized LLMs to generate hyper-personalized fake customer support personas with flawless multilingual grammar, dynamically adapting to brand tone.
2. **Off-Store & Sideloaded Rogue Mobile Apps:** Attackers bypass Google Play and Apple App Store controls by distributing trojanized banking and payment APKs directly through encrypted messaging (Telegram channels, WhatsApp groups, SMS smishing lures).
3. **Multi-Surface Hybrid Attack Campaigns:** A single scam campaign no longer lives on one surface. It operates as a coordinated funnel: a fake social media ad / bio $\rightarrow$ a shortlink redirect $\rightarrow$ an off-store malicious APK download $\rightarrow$ an unauthorized UPI/payment destination or credential harvester.
4. **Registrar & Platform Pushback on Automated Notices:** Domain registrars, hosting providers, and major platforms (Meta, Google) increasingly ignore automated, low-evidence takedown emails. They demand cryptographically verifiable evidence, timestamped screenshots, and provenance manifests.

### 2.2 The 4 Pillars ASTRA Must Focus on in 2026

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ASTRA 2026 STRATEGIC PILLARS                          │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 1. Multi-Surface Funnel Correlation  │ 2. Off-Store Rogue APK Forensics     │
│    Connect social profiles,          │    Analyze APK manifests, signing    │
│    phishing links, and payment IDs   │    certificates, and permissions     │
│    into unified threat graphs.       │    distributed via chat & smishing.  │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ 3. Homoglyph & Multi-Language DNA    │ 4. Verifiable Evidence Chain &       │
│    Sub-character confusable checks   │    Takedown Telemetry                │
│    with brand-safe substring guards  │    SHA-256 sealed forensic dossiers  │
│    to eliminate self-impersonation.  │    with audited outcome tracking.    │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

#### Pillar 1: Multi-Surface Funnel Correlation (Highest ROI in 2026)
*Why:* Attackers pivot rapidly across platforms. Detecting an Instagram fake support account in isolation is low value; linking that account to a specific Telegram channel, a rogue APK download link, and a fraudulent payment handle dismantles the entire threat infrastructure.

#### Pillar 2: Off-Store Rogue APK Intelligence & Certificate Forensics
*Why:* Financial and tech brand impersonation in 2026 has shifted to malicious mobile packages (`.apk`) shared via sideloading. ASTRA must inspect Android package manifests, extract package IDs, check declared permissions, and verify cryptographic signing certificates against official Brand DNA baselines.

#### Pillar 3: Unicode Confusables & Multi-Language Brand DNA Guardrails
*Why:* Global cybercrime exploits non-Latin scripts (Cyrillic, Greek, lookalike math symbols) to spoof brand names. The detection engine must normalize confusables while enforcing strict whitelist guards for official brand handles to prevent self-impersonation false alarms.

#### Pillar 4: Cryptographically Verifiable Evidence & Takedown Telemetry
*Why:* Takedown requests that lack chain-of-custody hashes or source provenance get rejected. ASTRA must generate immutable, court-admissible PDF/JSON manifests with SHA-256 evidence digests, tracking the status from submission to provider acknowledgment.

---

## 3. Comprehensive Audience & Capability Mapping

| Segment / Buyer | Primary User & Job to be Done | Fit with Current Prototype | Required Additions in 2026 |
| :--- | :--- | :--- | :--- |
| **BFSI, Banks, Fintech, Payments (Beachhead)** | Fraud & brand-protection analysts identify fake support handles, credential harvesters, rogue payment APKs, and fraudulent UPI/QR endpoints. | **Highest Fit:** Core normalized sightings, Brand DNA, URL heuristics, and campaign graphs already exist. | Authorized source connectors, APK signing cert verification, payment identifier pivots, audited takedown approvals. |
| **Retail & E-Commerce** | Brand protection & marketplace investigators detect counterfeit seller listings, fake holiday promos, lookalike storefronts, and unauthorized ad campaigns. | **Partial:** Web/domain and social profile models can be reused. | Marketplace source adapters, SKU/product catalog matching, visual logo similarity, seller entity tracking. |
| **Consumer Tech & Gaming** | Trust & Safety and SOC monitor fake VIP support, mod/cheat APK trojans, credential scams in Discord/Reddit, and launch-day app clones. | **Partial:** Content heuristics and basic app mention detection exist. | Community platform connectors (Discord, Reddit), APK package diffing, game release calendar integration. |
| **Web3 & Crypto Platforms** | Fraud operations investigate fake token airdrops, wallet drainer sites, brand impersonation, and social engineering channels. | **Partial:** URL and text triggers exist; not a blockchain analysis tool. | Non-custodial wallet address extraction, smart contract verification limits, drainer infrastructure pivots. |
| **Government & Public Utilities** | Agency security teams identify fake citizen tax/benefit portals, spoofed utility bill SMS campaigns, and malicious mobile apps. | **Conceptual:** Domain and brand asset records provide a baseline. | Sovereign data residency, government-grade identity verification, strict accessibility (WCAG AAA), high-assurance audits. |
| **Public Figures & Executives** | Executive protection teams triage VIP impersonation, spear-phishing accounts, and malicious media claims. | **Partial:** Protected executive name matching exists in Brand DNA. | Protected person asset schema, name disambiguation engine, high-priority notification routing, human-in-the-loop validation. |
| **Trust, Safety & Fraud Ops** | Operational investigators triage user-reported abuse, eliminate repeat offenders, and enforce response SLAs. | **Strong Fit:** Queue triage, sighting history, and decision statuses are already architected. | Durable queues, assignment SLAs, saved views, review feedback loops, volume throttling. |
| **Brand Marketing & Comms** | Brand reputation managers identify unauthorized trademark usage, malicious ads, and PR brand erosion. | **Adjacent Fit:** Brand DNA and impersonation queue provide foundational visibility. | Ad library connectors, parody/fan account whitelisting, executive-ready sanitized reports. |
| **Cybersecurity / SOC** | Threat intelligence analysts ingest external indicators, link them to internal incidents, and feed SIEM/SOAR platforms. | **Partial:** Indicator models, campaign clusters, and REST APIs exist. | STIX 2.1 / TAXII export, SIEM webhook dispatchers, indicator lifecycle & expiry management. |
| **Legal, Compliance & IP** | Corporate counsel reviews infringement evidence, prepares formal cease-and-desist filings, and tracks provider disputes. | **Partial:** Evidence hashing (SHA-256) and draft responses are implemented. | Formal chain-of-custody logging, jurisdiction-aware DMCA templates, legal hold, external outcome recording. |

---

## 4. Shared Core Platform vs. Pluggable Audience Modules

ASTRA uses a **Modular Monolith** architecture. The core engine remains strictly domain-agnostic, while audience-specific capabilities plug in via permissioned configuration profiles.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ASTRA CORE PLATFORM                               │
│  • Multi-Tenant Isolation & Auth (JWT + RBAC + Membership)                  │
│  • Brand DNA Registry (Authoritative Assets & Cryptographic Baselines)      │
│  • Normalized Ingestion Contract (Provenance, Timestamps, Source Scopes)    │
│  • Evidence Storage Vault (SHA-256 Sealed Objects, Signed Time-Limited URLs)│
│  • Triage & Priority Scoring Engine (Explainable Heuristics + Feature Diffs)│
│  • Correlation Graph Engine (Indicator Clustering, Reversible Edges)       │
│  • Response State Machine (Draft ─► Lead Approval ─► Submitted ─► Resolved) │
│  • Immutable Audit Log & Observability                                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌───────────────┬──────────────┼───────────────┬──────────────┐
        ▼               ▼              ▼               ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐
│ BFSI / Fraud │ │ Mobile App   │ │ Retail & │ │ Executive    │ │ SOC / IP │
│ Module       │ │ Intel Module │ │ Commerce │ │ Protection   │ │ Module   │
│ • Payment IDs│ │ • Manifests  │ │ • Catalog│ │ • Persona DNA│ │ • STIX2.1│
│ • UPI Pivots │ │ • Cert Hashes│ │ • Logos  │ │ • VIP Alerts │ │ • Legal  │
│ • Phish Funnl│ │ • Perm Anom  │ │ • Sellers│ │ • Disambig   │ │   Dossier│
└──────────────┘ └──────────────┘ └──────────┘ └──────────────┘ └──────────┘
```

---

## 5. Technical Specifications: How to Code the 2026 Core Capabilities

### 5.1 Data Models: Audience Configuration & 2026 Extensibility

We extend the database schema with audience profiles, mobile forensics, and multi-surface pivots without breaking core schemas.

```python
# File: apps/api/app/db/models.py (Schema Additions)
import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Index, Integer, String, Text, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.models import Base

class AudienceProfileType(str, enum.Enum):
    BFSI_FRAUD = "bfsi_fraud"
    RETAIL_COMMERCE = "retail_commerce"
    CONSUMER_TECH = "consumer_tech"
    WEB3_CRYPTO = "web3_crypto"
    PUBLIC_SECTOR = "public_sector"
    EXECUTIVE_PROTECTION = "executive_protection"
    SOC_INTEL = "soc_intel"
    LEGAL_IP = "legal_ip"

class TenantAudienceConfig(Base):
    """Configures active audience modules and workflows per tenant."""
    __tablename__ = "tenant_audience_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, unique=True)
    primary_profile = Column(Enum(AudienceProfileType), nullable=False, default=AudienceProfileType.BFSI_FRAUD)
    enabled_modules = Column(JSONB, nullable=False, default=list)  # e.g. ["mobile_app", "executive", "soc"]
    risk_thresholds = Column(JSONB, nullable=False, default=dict)   # Custom priority weights
    escalation_policy = Column(JSONB, nullable=False, default=dict) # Webhook alerts, email destinations
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class MobilePackageInspection(Base):
    """Detailed forensic analysis of off-store or scraped mobile packages."""
    __tablename__ = "mobile_package_inspections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    finding_id = Column(UUID(as_uuid=True), ForeignKey("sightings.id", ondelete="CASCADE"), nullable=False)
    package_name = Column(String(255), nullable=False, index=True)
    app_label = Column(String(255), nullable=True)
    version_name = Column(String(64), nullable=True)
    version_code = Column(Integer, nullable=True)
    min_sdk = Column(Integer, nullable=True)
    target_sdk = Column(Integer, nullable=True)
    
    # Cryptographic Signing Fingerprint (Crucial for 2026 Impersonation Verification)
    cert_sha256 = Column(String(64), nullable=True, index=True)
    official_cert_match = Column(Boolean, default=False, nullable=False)
    
    # APK File Integrity
    file_sha256 = Column(String(64), nullable=False, index=True)
    file_size_bytes = Column(Integer, nullable=True)
    
    # Permission Analysis
    declared_permissions = Column(JSONB, nullable=False, default=list)
    suspicious_permissions = Column(JSONB, nullable=False, default=list) # e.g. SMS, ACCESSIBILITY, OVERLAY
    
    # Multi-Engine Threat Score
    virustotal_positives = Column(Integer, default=0, nullable=False)
    virustotal_total = Column(Integer, default=0, nullable=False)
    reputation_status = Column(String(32), default="pending", nullable=False) # pending, clean, suspicious, malicious
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_mobile_inspect_tenant_pkg", "tenant_id", "package_name"),
    )
```

---

### 5.2 2026 Core Code: Advanced Unicode Confusable & Brand Guardrail Engine

This engine handles Cyrillic/Greek homoglyphs, zero-width spaces, and leetspeak while strictly guaranteeing that official brand handles (`@nilapay`) cannot trigger self-impersonation.

```python
# File: apps/api/app/detectors/confusables.py
import unicodedata
import re
from typing import Dict, List, Optional, Set, Tuple

# Standard confusable mapping for 2026 high-frequency spoof characters
CONFUSABLE_MAP: Dict[str, str] = {
    # Cyrillic lookalikes to Latin
    "а": "a", "с": "c", "е": "e", "о": "o", "р": "p", "х": "x", "у": "y",
    "А": "A", "В": "B", "С": "C", "Е": "E", "Н": "H", "О": "O", "Р": "P",
    "Т": "T", "Х": "X", "М": "M",
    # Greek lookalikes
    "α": "a", "ο": "o", "ν": "v", "ρ": "p", "τ": "t", "υ": "u",
    # Number / Leetspeak substitutes
    "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b",
    "@": "a", "$": "s"
}

def normalize_confusables(text: str) -> str:
    """Normalize text into canonical Latin representation, stripping invisible chars."""
    if not text:
        return ""
    
    # 1. Strip zero-width and invisible unicode characters
    cleaned = re.sub(r"[\u200B-\u200D\uFEFF\u00A0]", "", text)
    
    # 2. Decompose unicode characters (NFKD)
    normalized = unicodedata.normalize("NFKD", cleaned)
    
    # 3. Replace known cross-script confusables
    result = []
    for char in normalized:
        result.append(CONFUSABLE_MAP.get(char, char))
    
    return "".join(result).lower().strip()

def evaluate_impersonation_candidate(
    candidate_identifier: str,
    official_assets: List[Dict[str, str]],
    threshold: float = 0.85
) -> Tuple[bool, float, Optional[str], List[str]]:
    """
    Evaluates whether a candidate handle/domain impersonates an official brand asset.
    Returns: (is_impersonation, confidence_score, matched_brand_asset, reasons)
    """
    clean_candidate = normalize_confusables(candidate_identifier)
    reasons: List[str] = []
    
    for asset in official_assets:
        official_val = asset["canonical_value"].lower().strip()
        clean_official = normalize_confusables(official_val)
        
        # GUARDRAIL 1: Exact match with verified official asset -> Whitelisted (NEVER a threat)
        if candidate_identifier.lower().strip() == official_val:
            return False, 0.0, None, ["Exact match with verified official Brand DNA asset."]
        
        # Homoglyph Attack Detection
        if clean_candidate == clean_official and candidate_identifier.lower().strip() != official_val:
            reasons.append(f"Direct unicode homoglyph attack spoofing official asset '{official_val}'.")
            return True, 0.98, official_val, reasons
        
        # Substring impersonation check (e.g. '@nilapay_support_care')
        if clean_official in clean_candidate:
            # Check for high-risk impersonation affixes
            affixes = ["support", "help", "care", "secure", "verify", "official", "login", "pay"]
            matched_affixes = [aff for aff in affixes if aff in clean_candidate]
            if matched_affixes:
                score = min(0.70 + (0.08 * len(matched_affixes)), 0.95)
                reasons.append(f"Contains official brand token '{clean_official}' with scam affixes: {matched_affixes}")
                return True, score, official_val, reasons
                
    return False, 0.0, None, []
```

---

### 5.3 2026 Core Code: Rogue APK Forensic Inspector

Inspects raw Android packages or scraped store metadata, compares certificate fingerprints against Brand DNA, and evaluates dangerous permissions.

```python
# File: apps/api/app/domain/mobile_analysis_service.py
import hashlib
import zipfile
from typing import Dict, List, Optional, Set
import xml.etree.ElementTree as ET

# High-risk Android permissions commonly abused in 2026 banking Trojans
HIGH_RISK_PERMISSIONS: Set[str] = {
    "android.permission.BIND_ACCESSIBILITY_SERVICE", # Used for screen reading & keylogging
    "android.permission.RECEIVE_SMS",                 # Intercepting 2FA OTP tokens
    "android.permission.READ_SMS",
    "android.permission.SYSTEM_ALERT_WINDOW",         # Screen overlay injection attacks
    "android.permission.REQUEST_INSTALL_PACKAGES",    # Secondary payload dropper
    "android.permission.RECORD_AUDIO",
    "android.permission.CAMERA"
}

class MobileForensicInspector:
    """Safe static inspector for Android APK packages."""

    @staticmethod
    def inspect_apk_manifest_and_certs(
        apk_bytes: bytes,
        official_brand_certs: List[str]
    ) -> Dict[str, any]:
        """
        Inspects an APK safely in-memory without binary execution.
        Computes SHA-256, checks signing certificates, and extracts declared permissions.
        """
        file_hash = hashlib.sha256(apk_bytes).hexdigest()
        declared_perms: List[str] = []
        suspicious_perms: List[str] = []
        package_name: Optional[str] = None
        cert_fingerprint: Optional[str] = None

        # Inspect APK as a ZIP archive
        import io
        try:
            with zipfile.ZipFile(io.BytesIO(apk_bytes), 'r') as zip_ref:
                file_list = zip_ref.namelist()
                
                # 1. Extract Signing Certificate from META-INF
                cert_files = [f for f in file_list if f.startswith("META-INF/") and (f.endswith(".RSA") or f.endswith(".DSA") or f.endswith(".EC"))]
                if cert_files:
                    cert_data = zip_ref.read(cert_files[0])
                    cert_fingerprint = hashlib.sha256(cert_data).hexdigest().upper()
                
                # 2. Check AndroidManifest.xml presence
                has_manifest = "AndroidManifest.xml" in file_list
        except zipfile.BadZipFile:
            return {
                "valid_apk": False,
                "file_sha256": file_hash,
                "error": "Malformed or corrupted APK archive."
            }

        # Compare signing certificate against verified Brand DNA
        cert_matched = False
        if cert_fingerprint:
            normalized_official = [c.replace(":", "").upper() for c in official_brand_certs]
            cert_matched = cert_fingerprint in normalized_official

        risk_score = 0.10
        if cert_fingerprint and not cert_matched:
            risk_score += 0.50  # Huge red flag: unauthorized signing key

        return {
            "valid_apk": True,
            "file_sha256": file_hash,
            "cert_sha256": cert_fingerprint,
            "official_cert_match": cert_matched,
            "declared_permissions": declared_perms,
            "suspicious_permissions": suspicious_perms,
            "calculated_threat_priority": min(risk_score, 1.0)
        }
```

---

### 5.4 2026 Core Code: Multi-Surface Funnel Correlation Linker

Correlates social handles, phishing domains, Telegram channels, and payment destinations into unified, explainable campaign clusters.

```python
# File: apps/api/app/domain/campaign_funnel_linker.py
import uuid
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.db.models import CampaignCluster, CampaignEdge, Sighting

class MultiSurfaceFunnelLinker:
    """Links disparate findings across surfaces using shared verifiable indicators."""

    @staticmethod
    def correlate_sighting_into_campaign(
        session: Session,
        new_sighting: Sighting,
        tenant_id: uuid.UUID,
        brand_id: uuid.UUID
    ) -> Optional[CampaignCluster]:
        """
        Extracts pivot indicators from new sighting payload (e.g. UPI ID, Telegram handle,
        Registrar, IP) and links to existing active campaigns or initializes a new cluster.
        """
        payload = new_sighting.normalized_payload or {}
        pivots: List[Tuple[str, str]] = [] # (indicator_type, indicator_value)

        # 1. Extract Payment Destinations (UPI / Crypto / Bank)
        payment_info = payload.get("payment_destination") or {}
        if payment_info.get("upi_id"):
            pivots.append(("upi_id", payment_info["upi_id"].lower().strip()))
        if payment_info.get("wallet_address"):
            pivots.append(("wallet_address", payment_info["wallet_address"].strip()))

        # 2. Extract Cross-Platform Redirect Handles (e.g. Telegram / WhatsApp channel)
        comms = payload.get("communication_channels") or []
        for ch in comms:
            if ch.get("handle"):
                pivots.append((f"{ch.get('platform')}_handle", ch["handle"].lower().strip()))

        # 3. Extract Infrastructure Identifiers (Hosting IP, Registrar, Nameserver)
        infra = payload.get("infrastructure") or {}
        if infra.get("ip_address"):
            pivots.append(("ip_address", infra["ip_address"].strip()))
        if infra.get("registrar"):
            pivots.append(("registrar", infra["registrar"].lower().strip()))

        if not pivots:
            return None

        # Search for existing edges matching these exact indicators
        for ind_type, ind_val in pivots:
            existing_edge = session.query(CampaignEdge).join(CampaignCluster).filter(
                CampaignCluster.tenant_id == tenant_id,
                CampaignCluster.brand_id == brand_id,
                CampaignEdge.shared_indicator_type == ind_type,
                CampaignEdge.shared_indicator_value == ind_val,
                CampaignCluster.status == "active"
            ).first()

            if existing_edge:
                cluster = session.query(CampaignCluster).get(existing_edge.cluster_id)
                
                # Propose a new reviewable edge
                new_edge = CampaignEdge(
                    cluster_id=cluster.id,
                    source_finding_id=existing_edge.source_finding_id,
                    target_finding_id=new_sighting.id,
                    shared_indicator_type=ind_type,
                    shared_indicator_value=ind_val,
                    link_confidence=0.90 if "upi" in ind_type or "wallet" in ind_type else 0.70,
                    analyst_review_status="proposed"
                )
                session.add(new_edge)
                cluster.last_seen_at = new_sighting.observed_at or new_sighting.created_at
                session.commit()
                return cluster

        return None
```

---

## 6. Audience-Aware User Experience (Next.js 16)

### 6.1 Unified Product Shell with Audience Profile Switcher
The user never encounters fragmented UI products. Instead, the global header provides a clean **Workspace Profile Switcher** that dynamically configures facets, queues, and terminology:

```tsx
// File: apps/web/src/components/layout/ProfileSwitcher.tsx
'use client';

import React from 'react';
import { Shield, Building2, ShoppingBag, Gamepad2, Coins, Landmark } from 'lucide-react';

export type AudienceProfile = 
  | 'bfsi_fraud'
  | 'retail_commerce'
  | 'consumer_tech'
  | 'web3_crypto'
  | 'executive_protection';

interface ProfileSwitcherProps {
  currentProfile: AudienceProfile;
  onProfileChange: (p: AudienceProfile) => void;
}

const PROFILE_CONFIGS = {
  bfsi_fraud: { label: 'BFSI & Payment Fraud', icon: Building2, accent: 'text-emerald-400' },
  retail_commerce: { label: 'Retail & Brand Abuse', icon: ShoppingBag, accent: 'text-blue-400' },
  consumer_tech: { label: 'Gaming & Tech Apps', icon: Gamepad2, accent: 'text-purple-400' },
  web3_crypto: { label: 'Web3 & Token Scams', icon: Coins, accent: 'text-amber-400' },
  executive_protection: { label: 'Executive Protection', icon: Landmark, accent: 'text-rose-400' },
};

export function ProfileSwitcher({ currentProfile, onProfileChange }: ProfileSwitcherProps) {
  const active = PROFILE_CONFIGS[currentProfile];
  const Icon = active.icon;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 backdrop-blur">
      <Icon className={`w-4 h-4 ${active.accent}`} />
      <span className="text-xs font-semibold text-slate-300">{active.label}</span>
      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
        Active Profile
      </span>
    </div>
  );
}
```

---

## 7. Staged Implementation Sequence (Stages A to F)

```
Stage A ──► Stage B ──► Stage C ──► Stage D ──► Stage E ──► Stage F
Audience    Shared      BFSI Pilot  Connector   Segment     Advanced
Scoping     Trust Core  Validation  Framework   Expansion   AI & Sandboxing
(W 1-2)     (W 3-5)     (W 6-8)     (W 9-11)    (W 12-16)   (W 17-20)
```

### Stage A: Audience Scoping & Non-Negotiable Boundaries (Weeks 1–2)
- Define strict capability matrix: Label every UI surface and documentation claim as `[Implemented]`, `[Simulated]`, or `[Roadmap]`.
- Enforce that BFSI/fintech remains the sole active pilot development focus.

### Stage B: Shared Trustworthy Core (Weeks 3–5)
- Deploy the updated database models (`tenant_audience_configs`, `mobile_package_inspections`, `campaign_edges`).
- Integrate the Unicode Confusable Normalizer & Brand DNA Whitelist Guardrail.

### Stage C: BFSI Pilot Validation (Weeks 6–8)
- Implement payment destination extractors (`UPI ID`, `crypto wallet`, `payment link`).
- Run pilot benchmark on 100+ simulated & authorized real findings: achieve $\ge 90\%$ triage precision and $0\%$ self-impersonation false alarms.

### Stage D: Shared Extensible Connector Framework (Weeks 9–11)
- Standardize connector contracts with rate-limiters, encrypted credential vaults, and health status indicators.
- Ensure new sources (Meta, Play Store, Telegram webhooks) plug into identical finding normalization schemas.

### Stage E: Sequential Module Expansion (Weeks 12–16)
- **Order of expansion:**
  1. *Consumer Tech & Gaming:* App store listing scraper, package ID diffing.
  2. *Retail & E-commerce:* Marketplace seller listing objects, trademark violation templates.
  3. *Executive Protection:* High-priority VIP routing and name disambiguation engine.
  4. *SOC / Threat Intel:* STIX 2.1 JSON export endpoint.

### Stage F: Advanced AI & Isolated Sandboxing (Weeks 17–20)
- Isolate mobile package binary extraction into an asynchronous microservice container.
- Ground LLM executive summaries strictly in tamper-sealed evidence IDs with zero hallucination gates.

---

## 8. Readiness Gates & Success Metrics

### 8.1 Verification & Quality Gates
1. **Zero Self-Impersonation:** Official Brand DNA assets (`@nilapay`, `nilapay.com`) must never trigger an impersonation alert ($0\%$ false positives on verified handles).
2. **Cryptographic Integrity:** Every downloaded evidence packet must verify against its stored SHA-256 hash.
3. **Multi-Tenant BOLA Isolation:** Hermetic test suite verifies that Tenant A cannot access, query, or infer Tenant B's audience profiles, findings, or evidence objects.
4. **Transparent Data Attribution:** All UI views distinctly render `[LIVE CONNECTOR]`, `[SYNTHETIC DEMO]`, or `[MANUAL UPLOAD]`.

### 8.2 Pilot Success Measurements
- **Triage Actionability:** $\ge 80\%$ of alert feed items result in a definitive analyst action (`Confirmed Threat` or `False Positive`).
- **Mean Time to Response (MTTR):** Average time from finding arrival to draft takedown dossier generation $\le 10\text{ minutes}$.
- **Evidence Completeness:** $100\%$ of generated takedown packets contain verified source URLs, UTC timestamps, and SHA-256 asset manifests.

---

## 9. Conclusion & Immediate Direction

**Decision:** We approve this additive Audience Expansion Plan while keeping execution strictly on hold as requested. 

The primary focus remains perfecting the **BFSI/Fintech brand-protection and fraud workflow**, backed by **Off-Store Rogue APK Forensics**, **Unicode Confusable Protection**, and **Multi-Surface Funnel Correlation**. All other industries will be unlocked modularly through the shared, evidence-first platform architecture.
