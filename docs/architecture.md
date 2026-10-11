# ASTRA Enterprise Architecture

ASTRA is an enterprise Digital Risk Protection (DRP) platform designed to help brand-protection teams review suspected impersonation and scam accounts, understand the evidence, and manage the response in one auditable workflow.

The authoritative enterprise specification for this codebase is documented in [ASTRA Enterprise Platform Implementation Plan](../ASTRA%20Enterprise%20Platform%20Implementation%20Plan.md).

---

## 1. Modular Monolith Architecture

ASTRA uses a **modular monolith** topology to maximize reliability, tenant boundary safety, and auditability without premature microservice overhead.

```text
Customer SSO / IdP (OIDC + MFA)
                │
                ▼
Next.js Analyst Console (apps/web)
  ├── Server-rendered Overview, Brands, Sightings, Cases & Campaigns
  ├── Evidence Presentation & Review Drawer
  └── Truthful status indicators (Zero ungrounded "live" claims)
                │  Bearer JWT / Session
                ▼
FastAPI Application Gateway (apps/api)
  ├── Server-Derived Tenant Context (app/core/security.py)
  ├── RBAC Enforcement: Org Admin, Brand Manager, Analyst, Reviewer, Read-only
  ├── BOLA Prevention on every object lookup (/brands, /sightings, /campaigns, /actions)
  ├── System of Record: PostgreSQL (Brands, Sightings, Signals, Campaigns, Decisions, Audit)
  ├── Durable Evidence Vault (app/storage/evidence_storage.py): SHA-256 integrity, signed access tokens
  └── Background Ingestion & Detection Workers: Idempotent processing, retries, and rate limits
```

---

## 2. Core Pillars & Design Invariants

1. **System of Record & Evidence Durability:**
   * PostgreSQL is the authoritative system of record for operational state, campaigns, analyst decisions, and append-only audit events.
   * Captured evidence bytes are persisted in an encrypted storage vault with SHA-256 cryptographic hashes. Viewing evidence requires time-limited, signed access tokens.
2. **Tenant Isolation & Zero Trust Header Policy:**
   * Tenant identity is derived strictly from verified credentials/sessions. Caller-supplied `X-Tenant-ID` or `X-Actor` headers cannot override or switch tenant boundaries (OWASP BOLA protection).
3. **Deterministic Detectors & AI Boundaries:**
   * Detections use versioned, deterministic heuristics with explicit feature contributions.
   * LLMs are used exclusively to draft evidence-linked summaries for human review. LLM outputs never bypass analyst approval or make enforcement decisions autonomously.
4. **Human-in-the-Loop Response Governance:**
   * Automated external takedowns are disabled. Response packets (Meta, X, ICANN, Google Play, Payment Rail UPI) are generated as editable drafts requiring explicit analyst approval before escalation or export.

---

## 3. Reference Documents

* [Enterprise Platform Implementation Plan](../ASTRA%20Enterprise%20Platform%20Implementation%20Plan.md) — Authoritative enterprise blueprint and capability boundaries.
* [Customer Pilot Runbook](customer-pilot-runbook.md) — 4-week design partner evaluation framework and SLA benchmarks.
* [Production Operations Runbook](production-operations.md) — NIST CSF 2.0 governance, database migrations, secrets redaction, and SLOs.
* [Engineering Phase Status](phase-status.md) — Verification tracking and completed milestone log.
