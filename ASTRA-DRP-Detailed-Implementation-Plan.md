# ASTRA Digital Risk Protection Platform
## Comprehensive Product & Engineering Implementation Plan
**Document Version:** 1.0.0  
**Status:** Approved for Implementation (Planning Phase)  
**Target Environment:** Enterprise Digital Risk Protection (DRP)  
**Audience:** Product Management, Security Engineering, Core Platform Engineering, Frontend Engineering, SOC Operations  

---

## Executive Summary & Strategic Mission

ASTRA transforms from a proof-of-concept analyst prototype into an enterprise-grade **Digital Risk Protection (DRP)** platform designed for brand protection, trust-and-safety, fraud prevention, and security operations (SOC) teams. 

### Core Product Promise
> **"ASTRA empowers brand security teams to discover unauthorized brand usage, investigate suspected impersonation, phishing campaigns, and rogue mobile applications using defensible, tamper-evident forensic evidence, and execute human-governed, auditable takedowns."**

### Core Principles
1. **Evidence Before Verdict:** Never declare a target "malicious" based purely on heuristics, third-party lookups, or unverified AI summaries. Distinguish explicitly between *Observed Facts*, *Heuristic Signals*, *Third-Party Enrichment*, *Analyst Determinations*, and *External Provider Confirmations*.
2. **Honest Source Attribution:** Clearly delineate synthetic demo data, manual uploads, customer-authorized feeds, and live API connectors. Real-time guarantees are only made when verified, healthy, scheduled collectors are active.
3. **Strict Human Governance:** AI and automated detectors are purely advisory triage assistants. Consequential actions (escalations, provider takedowns, registrar notices) require explicit human review, authorization, and audit logs.
4. **Conservative, Reversible Correlation:** Shared infrastructure, registrar, or handle patterns propose candidate relationships rather than asserting criminal attribution. Campaign links must be explainable, inspection-ready, and analyst-reversible.
5. **Rigorous Tenant Isolation & Data Privacy:** Enforce cryptographically isolated organization boundaries, role-based access control (RBAC), tamper-evident evidence hashing (SHA-256), and compliant data retention/purge controls.
6. **Calibrated Uncertainty:** Treat numeric risk scores as prioritized triage rankings rather than mathematical probabilities. Surface missing information, confidence intervals, and known false-positive profiles.

---

## 1. Intended Personas, Roles & User Journeys

### 1.1 Persona Matrix & Permissions

| Role | Primary Job to be Done | Critical Workflows | System Permissions |
| :--- | :--- | :--- | :--- |
| **Brand Protection / SOC Analyst** | Triage and investigate incoming findings; confirm/reject threats; assemble response packages. | Queue triage, evidence hash verification, pivot graph investigation, draft takedown preparation. | Read findings, update finding review status, create draft responses, propose graph edges. |
| **Reviewer / SOC Lead** | Validate analyst determinations; ensure response quality and evidentiary standards; authorize external takedowns. | Approval queue review, quality audits, takedown submission authorization, case re-opening. | All Analyst permissions + Approve/Reject responses, authorize takedown dispatches, split/merge campaigns. |
| **Brand Manager / Legal Counsel** | Maintain official brand asset baselines; monitor dispute outcomes; review formal legal cease-and-desist filings. | Brand DNA asset enrollment, official certificate upload, legal notice template approval, dispute tracking. | Brand DNA management, legal export generation, executive reporting access. |
| **Organization Administrator** | Manage tenant governance, user provisioning, authorized connector credentials, retention policies, and audits. | SSO/MFA configuration, API key issuance, connector credential binding, audit trail export, evidence purge. | Full administrative control over tenant configuration, memberships, connectors, and security settings. |
| **Read-Only Executive** | Monitor brand risk posture, exposure metrics, takedown success rates, and team resolution velocity. | Executive dashboards, monthly risk trend reviews, ROI/takedown KPI tracking. | Read-only access to aggregated overview metrics and high-level case summaries. |

---

## 2. End-to-End System Workflow Architecture

```
[ Authorized Ingestion ] ────────► [ Normalization & Idempotency ] ────────► [ Storage Vault ]
 • Meta / Instagram Webhook            • UUID & SHA-256 Deduplication           • Raw Payload Preservation
 • Google Play / Store Scrapers        • Source Provenance Stamping             • SHA-256 Seal & Signature
 • X / Twitter Authorized Feed         • Scope & Consent Binding                • Time-Limited Access Token
 • Analyst Manual Upload
                                                      │
                                                      ▼
[ Response & Resolution ] ◄──────── [ Correlation & Review ] ◄──────── [ Heuristic & AI Engines ]
 • Provider-Specific Takedown         • Cluster-Local Graph Linking            • Token & Confusable Detector
 • Human Reviewer Approval Gate       • Shared Indicator Correlation           • Calibrated Triage Priority
 • Submission & Tracking States       • Split / Merge Reversibility            • Provenance-Grounded LLM
 • Auditable Legal Manifest           • Analyst Decision History               • APK Manifest / Cert Checks
```

### 2.1 First-Run Tenant & Brand Setup
1. **Tenant Provisioning:** Org Admin initializes organization space, configures identity provider (OIDC/SAML), and invites analysts under least-privilege roles.
2. **Brand DNA Enrollment:**
   - Official brand names, trademarks, and localized aliases.
   - Authoritative web domains (with DNS TXT / challenge verification).
   - Verified social media profiles (Twitter/X, Instagram, LinkedIn, YouTube, TikTok, Telegram).
   - Official Mobile App registry: Package IDs (`com.example.app`), official App Store / Play Store URLs, SHA-256 signing-certificate fingerprints (`v1/v2/v3 signing schemes`).
   - Official customer support handles, authorized phone numbers, and payment gateways.
3. **Connector Binding:**
   - Admin attaches customer-authorized API credentials or webhook endpoints.
   - System performs a fail-closed verification handshake, records permission scopes, and presents clear indicators of coverage vs. limitations.

### 2.2 Ingestion & Provenance Preservation
- Every raw incoming observation is sealed into an immutable `EvidenceObject` with a cryptographic SHA-256 digest before any parsing occurs.
- Findings are stamped with:
  - `source_type`: `[live_connector | analyst_manual | partner_feed | synthetic_demo]`
  - `collected_at`: UTC timestamp of acquisition.
  - `observed_at`: Upstream platform timestamp.
  - `consent_basis`: Tenant customer authorization reference.

### 2.3 Detection & Triage Scoring
- Deterministic heuristic detectors run versioned inspections:
  - *Social Impersonation:* Confusable characters (punycode/homoglyphs), official handle substring guards (preventing verified brand tokens from triggering false positives), account bio regex, contact extraction.
  - *Mobile App Radar:* Package ID lookalikes, publisher name spoofing, icon perceptual hash (pHash), APK signing certificate mismatch, dangerous permissions inspection.
  - *Domain/URL Risk:* Levenshtein distance against Brand DNA domains, high-risk TLD analysis, credential harvester form markers.
- Numeric priority score ($0.0 - 1.0$) is explicitly calculated and presented with feature breakdown (e.g., `Brand Token Match (+0.30)`, `Certificate Mismatch (+0.40)`, `Recent Account Age (+0.15)`).

### 2.4 Investigation & Graph Correlation
- Correlation engine groups findings into `Campaign` clusters strictly via shared indicators (e.g., identical registrar, same APK signing fingerprint, identical payment handle, shared hosting IP).
- Campaign names are derived from deterministic cluster identities rather than arbitrary titles to prevent accidental merging of disparate incidents.
- Analysts review candidate graph edges with pair-level evidence rationale and can accept, reject, or split clusters.

### 2.5 Response Workspace & External Escalation
- Response lifecycle enforces strict state machine segregation:
  $$\text{Draft} \longrightarrow \text{Analyst Review} \longrightarrow \text{Lead Approval} \longrightarrow \text{Submitted} \longrightarrow \text{Acknowledged} \longrightarrow \text{Resolved/Rejected}$$
- Takedown dossiers generate provider-tailored packages (Meta IP Reporting, Google Play Abuse, Registrar DMCA / Cease-and-Desist) accompanied by SHA-256 sealed evidence manifests.

---

## 3. Database Schema & Data Model Specifications

The database schema must be upgraded with relational foreign keys, tenant scoping, and full auditability.

```sql
-- 1. Brand Asset Verification Baseline (Brand DNA)
CREATE TABLE brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    asset_type VARCHAR(64) NOT NULL, -- 'domain', 'social_handle', 'mobile_app_pkg', 'cert_fingerprint'
    canonical_value TEXT NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified', -- 'verified', 'pending_challenge', 'unverified'
    verification_method VARCHAR(64), -- 'dns_txt', 'oauth_proof', 'manual_analyst'
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_brand_asset UNIQUE(tenant_id, brand_id, asset_type, canonical_value)
);

-- 2. Connector Registry & Operational Health
CREATE TABLE connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    connector_type VARCHAR(64) NOT NULL, -- 'meta_graph', 'google_play', 'virustotal', 'telegram_bot'
    name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'unconfigured', -- 'active', 'degraded', 'error', 'revoked'
    auth_config_vault_ref TEXT, -- Reference to encrypted secret manager
    permitted_scopes JSONB NOT NULL DEFAULT '[]',
    rate_limit_rpm INT DEFAULT 60,
    last_health_check_at TIMESTAMPTZ,
    last_successful_sync_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Normalized Findings (Replacing ad-hoc sightings)
CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    connector_id UUID REFERENCES connectors(id),
    source_kind VARCHAR(64) NOT NULL, -- 'social_profile', 'mobile_app', 'web_domain', 'messaging'
    surface VARCHAR(64) NOT NULL, -- 'instagram', 'x', 'google_play', 'third_party_apk', 'telegram'
    external_id VARCHAR(255) NOT NULL,
    target_identifier TEXT NOT NULL, -- '@fake_handle', 'com.scam.app', 'hxxps://phish.example'
    observed_at TIMESTAMPTZ NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_mode VARCHAR(32) NOT NULL DEFAULT 'live', -- 'live', 'synthetic_demo', 'manual_upload'
    raw_evidence_id UUID REFERENCES evidence_objects(id),
    normalized_attributes JSONB NOT NULL DEFAULT '{}',
    triage_status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'investigating', 'confirmed_threat', 'false_positive', 'needs_evidence'
    triage_priority NUMERIC(4,3) NOT NULL DEFAULT 0.0,
    assigned_analyst_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_finding_source UNIQUE(tenant_id, surface, external_id)
);

-- 4. Mobile App Radar Forensics
CREATE TABLE mobile_app_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    app_title TEXT NOT NULL,
    publisher_name TEXT,
    store_source VARCHAR(64) NOT NULL, -- 'google_play', 'apkmirror', 'apkpure', 'direct_download'
    store_url TEXT,
    version_string VARCHAR(64),
    cert_sha256_fingerprint VARCHAR(64),
    official_cert_match BOOLEAN DEFAULT FALSE,
    apk_sha256 VARCHAR(64),
    malware_detections JSONB DEFAULT '{}',
    permissions_declared JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Campaign Correlation Graph Edges
CREATE TABLE campaign_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    cluster_key VARCHAR(128) NOT NULL, -- SHA-256 root indicator hash
    display_title VARCHAR(255) NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL,
    calculated_risk NUMERIC(4,3) NOT NULL DEFAULT 0.0,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES campaign_clusters(id) ON DELETE CASCADE,
    source_finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    target_finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    shared_indicator_type VARCHAR(64) NOT NULL, -- 'ip', 'registrar', 'cert_fingerprint', 'payment_id'
    shared_indicator_value TEXT NOT NULL,
    link_confidence NUMERIC(4,3) NOT NULL,
    analyst_review_status VARCHAR(32) NOT NULL DEFAULT 'proposed', -- 'accepted', 'rejected', 'proposed'
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_campaign_edge UNIQUE(cluster_id, source_finding_id, target_finding_id, shared_indicator_type)
);

-- 6. Human-Governed Response Actions
CREATE TABLE response_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES campaign_clusters(id),
    target_provider VARCHAR(64) NOT NULL, -- 'meta_takedown', 'google_abuse', 'cloudflare_abuse', 'registrar_dmca'
    lifecycle_state VARCHAR(32) NOT NULL DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'submitted', 'acknowledged', 'resolved', 'rejected'
    drafted_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    submission_channel VARCHAR(32) NOT NULL DEFAULT 'manual_portal', -- 'manual_portal', 'api_automated', 'email_legal'
    external_case_reference TEXT,
    evidence_manifest_hash VARCHAR(64) NOT NULL,
    submission_payload JSONB NOT NULL DEFAULT '{}',
    submitted_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Immutable Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(64) NOT NULL, -- 'finding_status_change', 'takedown_approved', 'connector_added', 'evidence_exported'
    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. API Endpoints & Contract Design

### 4.1 Ingestion & Findings

#### `POST /api/v1/findings/ingest`
- **Auth:** Connector API Key or Internal Ingestion Service Bearer Token.
- **Header:** `X-Tenant-ID`, `X-Idempotency-Key`.
- **Payload:**
  ```json
  {
    "brand_id": "369c3a10-f127-42dc-9828-aab18ce6dcc3",
    "surface": "instagram",
    "external_id": "ig_post_98234123",
    "target_identifier": "@nilapay_official_help",
    "observed_at": "2026-10-11T09:15:00Z",
    "data_mode": "live",
    "raw_payload": { ... },
    "evidence_files": [
      {
        "filename": "screenshot_profile.png",
        "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "mime_type": "image/png"
      }
    ]
  }
  ```
- **Response:** `201 Created` with `{ "finding_id": "...", "triage_priority": 0.85, "signals": [...] }`.

#### `GET /api/v1/findings`
- **Parameters:** `brand_id`, `surface`, `status`, `min_priority`, `data_mode`, `limit`, `offset`.
- **Response:** Paginated list of normalized findings with full evidence digests and detector rationale.

#### `PATCH /api/v1/findings/{id}/triage`
- **Auth:** Analyst or Org Admin.
- **Payload:**
  ```json
  {
    "triage_status": "confirmed_threat",
    "rationale": "Account uses brand logo and solicits private banking PINs in bio.",
    "escalate_to_campaign": true
  }
  ```
- **Enforcement:** Audit log entry created automatically.

### 4.2 Mobile App Radar

#### `GET /api/v1/apps/radar`
- **Parameters:** `brand_id`, `store_source`, `status`.
- **Returns:** Real-time mobile findings merged with APK certificate verification against official Brand DNA certificates.
- **Contract Guarantee:** Field names match UI models: `package_name`, `cert_sha256`, `official_cert_match`, `malware_status`, `triage_status`.

#### `POST /api/v1/apps/{id}/scan-package`
- **Action:** Submits app package hash to VirusTotal / multi-engine reputation and schedules static manifest permission check.
- **Security Control:** Sandboxed execution; no binary processing occurs inside the API process.

### 4.3 Response & Takedown

#### `POST /api/v1/responses/draft`
- **Generates:** Formal takedown packet pre-populated with Brand DNA trademark credentials, infringement screenshot evidence hashes, and infringing URLs.
- **Initial Status:** `draft`.

#### `POST /api/v1/responses/{id}/approve`
- **Auth:** Restricted to `reviewer` or `org_admin`. Enforces separation of duties (drafter cannot approve their own submission if configured).
- **Status Transition:** `draft` $\longrightarrow$ `approved`.

#### `POST /api/v1/responses/{id}/dispatch`
- **Action:** Submits to external provider API (if configured) or generates downloadable signed legal PDF with tracking ID.
- **Status Transition:** `approved` $\longrightarrow$ `submitted`.

---

## 5. Frontend & UX Architecture

### 5.1 Global Navigation Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│ ASTRA Digital Risk Protection                     [Workspace: NilaPay] │
│ Mode: [● Live Feed] | Connector Status: [3/3 Healthy]   [Analyst: John]│
├──────────────┬─────────────────────────────────────────────────────────┤
│ Overview     │  • Real-Time Threat Posture & Coverage Status           │
│              │                                                         │
│ Investigate  │  • Findings Queue (Triage, Impersonation, Scams)        │
│              │  • Campaign Graph (Correlation, Attribution, Edges)     │
│              │                                                         │
│ Monitor      │  • Mobile App Radar (Clones, Rogue APKs, Signatures)    │
│              │  • Social Surfaces (Instagram, X, Telegram, Meta)       │
│              │  • Domain & Phishing Infrastructure                     │
│              │                                                         │
│ Respond      │  • Takedown & Response Queue                            │
│              │  • Case Outcomes & Registrar Audit History              │
│              │                                                         │
│ Brand Setup  │  • Brand DNA Registry (Trademarks, Certs, Handles)      │
│              │  • Connectors & Source Permissions                      │
│              │                                                         │
│ Admin        │  • Team & RBAC Permissions                              │
│              │  • Audit Logs & Data Retention                          │
└──────────────┴─────────────────────────────────────────────────────────┘
```

### 5.2 Key UI Components & Interactions

1. **Brand Asset Registry (`/brands`):**
   - Clean verification badges: Green (`Verified via DNS/OAuth`), Amber (`Pending Verification Challenge`), Red (`Unverified / Community Reported`).
   - Modal for uploading official APK signing certificates (`SHA-256 fingerprint`) and trademark registration numbers.
2. **Findings Queue (`/sightings`):**
   - Explicit "Data Mode" indicator pill on each row: `[LIVE]`, `[SYNTHETIC DEMO]`, `[MANUAL UPLOAD]`.
   - 1-click triage actions: `Confirm Threat`, `False Positive`, `Request More Evidence`, `Mark Duplicate`.
   - Drawer showing original raw evidence, image viewer with zoom/pan, and SHA-256 copyable hash.
3. **Mobile App Radar (`/apps`):**
   - Table displaying: App Title, Package Name, Store Source, Certificate Match Status (`MATCHED` vs `UNAUTHORIZED FINGERPRINT`), Permissions Risk, VirusTotal Detection Ratio.
   - Action buttons wire directly to `/api/v1/responses/draft` rather than mutating volatile local React state.
4. **Campaign Graph Workspace (`/campaigns/[id]`):**
   - React Flow interactive graph showing node types: `Brand Node`, `Finding Node`, `Infrastructure Node (IP/Domain)`, `App Node`.
   - Edge Review Drawer: Clicking any edge displays the exact shared indicator (e.g. `Shared Registrar: NameCheap Inc, Reg Date: 2026-10-09`) and allows analysts to `Accept Edge` or `Reject Link`.
5. **Response Dossier (`/campaigns/[id]/response`):**
   - Preview of formal cease-and-desist / platform takedown letter.
   - Checkboxes for selecting which verified evidence attachments to bundle.
   - Audit trail box: `Drafted by Analyst` $\rightarrow$ `Approved by Lead` $\rightarrow$ `Submitted to Meta Abuse`.

---

## 6. Phased Engineering Roadmap

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
Truth &     MVP Core    Connector   Detection   Mobile App  Pilot &
Scoping     Trust       Engine      Quality     Intelligence Readiness
(W 1-2)     (W 3-5)     (W 6-8)     (W 8-11)    (W 11-14)   (W 15-18)
```

### Phase 0: Capability Truth & Foundational Alignment (Weeks 1–2)
- **Objective:** Eliminate mock/real discrepancies; align terminology and capabilities across product, engineering, and UI.
- **Key Deliverables:**
  - Audit all UI screens and attach explicit badges: `Live Active`, `Roadmap Prototype`, or `Synthetic Demo`.
  - Fix Apps Radar UI so that action buttons trigger durable API mutations instead of local state toggles.
  - Remove hardcoded formula constants and arbitrary reach estimates.
  - Implement global environment indicator: `Production`, `Pilot Sandbox`, or `Demo Mode`.
- **Exit Criteria:** Every visible UI component corresponds to an actual API schema; no synthetic data masquerades as live findings.

### Phase 1: Trustworthy MVP Foundation (Weeks 3–5)
- **Objective:** Build robust identity, Brand DNA verification, and immutable evidence management.
- **Key Deliverables:**
  - OIDC / IdP integration with strict session revocation and role assignment (`org_admin`, `reviewer`, `analyst`, `read_only`).
  - Brand DNA Verification engine: DNS TXT record challenge verification for authoritative domains.
  - Immutable evidence vault: Local/S3 storage with SHA-256 verification, tamper rejection, and short-lived signed URLs.
  - Findings queue redesign with sorting, status filtering, and reason-backed triage mutations.
- **Exit Criteria:** All 22+ hermetic isolation tests pass; DNS challenges verifiably confirm brand assets; full audit log records every triage change.

### Phase 2: Authorized Connectors & Ingestion Pipeline (Weeks 6–8)
- **Objective:** Implement reliable, customer-authorized data collection with operational observability.
- **Key Deliverables:**
  - Connector configuration engine with encrypted credential storage in vault.
  - Meta/Instagram Graph API connector with fail-closed webhook signature verification (`HMAC-SHA256`).
  - Google Play Store search/listing connector with rate-limit tracking, exponential backoff, and pagination cursors.
  - Connector Health Dashboard: Displays sync timestamps, failure counts, and scope permissions.
- **Exit Criteria:** Ingestion pipeline handles duplicate webhooks idempotently; unconfigured connectors fail closed with clear status.

### Phase 3: Detection Quality & Graph Correlation (Weeks 9–11)
- **Objective:** Upgrade detection logic from prototype heuristics to calibrated, explainable signal pipelines.
- **Key Deliverables:**
  - Unicode/confusable character normalizer (punycode, cyrillic substitution detection).
  - Substring matching fix: Ensure official brand handles (`@nilapay`) cannot trigger self-impersonation alerts.
  - Calibrated Triage Priority Score ($0.0 - 1.0$) with explicit factor breakdowns.
  - Graph correlation upgrade: Persisted cluster identifiers (`cluster_key`), pair-level edge rationale, and analyst-reversible split/merge actions.
- **Exit Criteria:** Benchmark dataset of 100+ positive and negative cases achieves $\ge 90\%$ triage precision; zero cross-tenant edge leakage.

### Phase 4: Mobile App Intelligence & Store Forensics (Weeks 12–14)
- **Objective:** Deliver genuine mobile risk analysis comparing third-party APKs against verified official brand apps.
- **Key Deliverables:**
  - Mobile app metadata extractor: Package ID, store icon perceptual hash, developer details, version history.
  - Certificate Signature Verifier: Compares third-party APK SHA-256 certificate fingerprints against Brand DNA official cert fingerprints.
  - Asynchronous VirusTotal file reputation lookup with isolated queue processing and rate limit governance.
  - Mobile App Radar console with complete forensic breakdown and takedown drafting.
- **Exit Criteria:** Unauthorized apps with mismatched signing certificates are flagged with 100% precision; APK hash lookups occur asynchronously without blocking the UI.

### Phase 5: Response Governance, Reporting & Enterprise Pilot (Weeks 15–18)
- **Objective:** Finalize human-governed takedown workflows, audit reporting, and pilot customer deployment.
- **Key Deliverables:**
  - Response state machine: `Draft` $\rightarrow$ `Reviewer Approval` $\rightarrow$ `Submitted` $\rightarrow$ `Outcome Recorded`.
  - Evidence-backed takedown dossier generator with cryptographically sealed PDF export.
  - Executive KPI Reporting: MTTR (Mean Time to Response), Triage Actionability %, Confirmed Threats vs False Positives.
  - Complete customer pilot operational runbook and disaster recovery / offboarding purge drill.
- **Exit Criteria:** Successful 4-week pilot simulation meeting all SLO gates; SOC team signs off on evidence auditability and review workflow.

---

## 7. Technical Acceptance Criteria & Quality Gates

### 7.1 Security & Compliance Gates
- [ ] **Cryptographic Verification:** Every external token and webhook signature is validated using constant-time comparisons (`timingSafeEqual`).
- [ ] **Zero BOLA / Tenant Leakage:** 100% of API endpoints enforce `tenant_id` ownership; foreign entity IDs return `404 Not Found`.
- [ ] **Data Encryption:** All stored evidence files are encrypted at rest (AES-256) and signed with SHA-256 checksums verified upon download.
- [ ] **Audit Trail Completeness:** Any mutation to brand assets, finding status, campaign clusters, or takedown actions generates an unalterable `audit_logs` record.

### 7.2 Performance & Reliability Gates
- [ ] **API Response Latency:** P95 response time for findings queue and dashboard endpoints $\le 250\text{ ms}$.
- [ ] **Ingestion Throughput:** Ingestion pipeline handles up to 500 findings/second with zero dropped events via asynchronous workers.
- [ ] **Clean Compilation:** Zero TypeScript errors (`npx tsc --noEmit`), zero lint errors, and 100% passing test coverage on core business logic.

---

## 8. Immediate Action Items (Next Steps)

1. **Architecture & Scope Freeze:** Review this implementation plan with core stakeholders and freeze Phase 0/1 scope.
2. **Schema Migration Setup:** Author Alembic migrations for `brand_assets`, `connectors`, `findings`, `mobile_app_findings`, and `response_cases`.
3. **Apps Radar Contract Fix:** Align `/apps` frontend queries with the new `findings` API model to replace mock state with persisted data.
4. **Brand DNA Verification Engine:** Implement the DNS TXT challenge verification flow to establish verifiable official assets.
