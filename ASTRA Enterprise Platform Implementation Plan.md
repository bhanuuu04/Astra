# ASTRA Enterprise Platform Implementation Plan

**Purpose:** Turn the existing hackathon implementation into a secure, supportable Digital Risk Protection platform that can be piloted with real organizations. This plan is based on the repository as it exists today, not on the earlier planned architecture alone.

**Product rule:** ASTRA stores evidence and provenance, explains how signals were produced, proposes campaign relationships, and lets authorized analysts decide. A detector or AI service must not make an enforcement decision or contact a third party by itself.

**Planning assumptions:** Start with a modular monolith and one permitted source workflow. Treat existing third-party scanners as optional connectors until platform terms, customer authorization, data handling, and reliability are proven. Do not promise broad social-media surveillance or automated takedowns based on the current code.

## 1. Executive assessment

ASTRA has a useful prototype foundation and a coherent analyst workflow. The repository already contains a Next.js App Router console, a FastAPI API, SQLAlchemy models, two Alembic migrations, PostgreSQL/pgvector Compose setup, synthetic fixtures, evidence hashing, rule-based signals, campaign graph UI, response packet generation, and several third-party integration adapters. This is a meaningful head start for a pilot.

It is **not yet an enterprise-ready platform**. Several files and screens remain simulators or use synthetic frontend state; the API does not have production identity and access management; tenant boundaries are not consistently enforced for writes and relationships; campaign grouping has correctness problems; evidence and connector operations are not durable job workflows; and deployment configuration is not yet a production deployment design. README and status documents also make claims that exceed what their own caveats and the code establish.

The most important engineering change is to establish a trusted identity and tenant boundary, then make a single complete workflow work against persisted data. Expanding integrations before that foundation would multiply security, privacy, and support risks.

### Repository review: what exists now

| Area | Current implementation | Enterprise interpretation |
| --- | --- | --- |
| Web app | `apps/web` is a Next.js 16 App Router application with database-backed overview, brands, sightings and campaign feature folders, plus a much larger older console under `/console`. React Flow, TanStack Query, forms, charts and reusable UI pieces are present. | Keep the feature-based analyst console and migrate useful prototype interactions deliberately. The `/console` state, mock connector settings, and `apps/web/src/lib/store.ts` are simulator data; they must not represent live tenant state. |
| API | `apps/api` is a FastAPI modular monolith with route, domain, schema, detector, linking, integration and storage modules. API routes generally use SQLAlchemy sessions and Pydantic. | Preserve the modular monolith boundary, but move authorization, transaction ownership, audit and error handling into consistent shared patterns. |
| Data | PostgreSQL schema and migrations cover tenants, brands, sightings, evidence metadata, indicators, signals, campaigns, decisions, response actions and audit events. The local compose DB uses pgvector/pg17. | Useful prototype schema, but it has no users/memberships or connector/job lifecycle, and some dependent rows do not carry a tenant key. Add constraints and tenant-safe relationships through additive migrations. |
| Analysis | Rule-based detector service, indicator extraction, risk scoring and campaign linking are present. Analysis currently runs synchronously in the request. | Keep deterministic detectors as the first production baseline. Record immutable run configuration and make expensive analysis asynchronous once real ingestion is enabled. |
| Evidence | Text evidence is hashed and written to a local filesystem path; evidence API verifies its hash before returning content. | Good integrity prototype. Production needs private object storage, atomic metadata/object handling, access policy, retention/deletion, malware-safe previews, and audit of access. |
| Response | Backend can generate multi-recipient drafts and simulate an action; frontend also has an older locally generated takedown flow. | Clearly separate editable drafts, approved actions, simulated actions, and submitted connector outcomes. No live external action until a reviewed approval workflow and provider-specific connector exist. |
| Integrations | VirusTotal, YouTube, Meta, Google Play, LLM and Sentry adapters/settings exist; Next.js has webhook and connector routes. | Code presence is not proof of an authorized, supported or resilient connector. Web connector settings are mostly hard-coded demo responses; validate each integration independently before pilot use. |
| Delivery | Docker Compose, Dockerfiles, GitHub workflow, Vercel config and Railway config exist. | Current compose is development-oriented. Railway health path `/healthz` does not match the API health routes; Compose passes `API_BASE_URL=http://api:8000`, while the web API helper falls back to port 8001 and injects fixed demo headers. Vercel and Railway need explicit production environment, auth, networking and secret design. |
| Verification | There is one small API test module and a demo runbook. `docs/phase-status.md` says the scaffold has not been run in this environment; `docs/architecture.md` still says only Phase 1 is implemented; README says Phases 1–6 are implemented. | Establish truthful capability status, reproducible local startup, test/verification gates and a customer pilot runbook before making readiness claims. |

### Priority defects to resolve before any real-customer data

1. **Replace the current trust model.** `apps/api/app/core/security.py` accepts shared API keys and selects tenant from `X-Tenant-ID`; it also accepts `X-Actor`. `apps/web/src/lib/api.ts` sends fixed demo tenant and actor headers. A tenant must come from a verified session/API credential membership, never from an untrusted caller header. `X-Role` on the web client has no authority and should be removed.
2. **Enforce tenant ownership on every relationship.** `POST /sightings:batch` replaces batch tenant ID but item-level `brand_id` can still select a brand without validating its tenant. Several dependent tables and service queries rely only on globally unique IDs. Require tenant-scoped lookups and composite tenant-aware foreign keys or equivalent database constraints.
3. **Repair campaign linking before using its output.** `compute_campaign_edges_and_clusters` builds edges across all proposed pairs and then persists the full edge list inside each cluster loop. It groups all shared indicators into connected components, including weak pivots, and creates fixed-score campaigns for isolated sightings. This can produce unrelated edges/campaigns and misleading risk. Replace with cluster-local, pivot-strength-aware proposals and persisted explanations.
4. **Fix response action ownership/model inconsistency.** `apps/api/app/api/routes/responses.py` filters `ResponseAction.tenant_id`, but the ORM model and migration do not define that column. Add tenant ownership and a migration, or scope via campaign ownership with a transaction-safe query and a tested policy.
5. **Stop exposing demo actors and synthetic connectors as live.** `apps/web/src/lib/store.ts`, `/console`, `/api/connectors`, and the frontend `/api/takedown` route contain static/sample records and simulated “connected” states. Make demo mode explicit and separate from production routes; do not store or accept connector secrets in the browser.
6. **Make writes durable and idempotent.** Ingestion writes evidence files and database rows in separate systems, without cleanup if the DB transaction fails. Demo reset deletes DB rows but leaves local evidence files. Introduce object lifecycle cleanup/outbox patterns and idempotency keys for inbound events and action operations.
7. **Correct data and report semantics.** Risk scores and response text include hard-coded values/default targets. Model outputs and response packets must be derived from persisted, evidence-linked signals and remain clearly labeled as drafts. Never generate claims about malicious behavior, legal rights or impact that the evidence does not support.

## 2. Target architecture

Use a **modular monolith** for the first enterprise pilot. Retain Next.js for the browser experience and FastAPI for APIs and domain logic. Add a worker process using the same backend package for ingestion, analysis and connector jobs. Split services only when measured load, team ownership or isolation needs justify it.

```text
Analyst browser
   | HTTPS; OIDC session
Next.js web/BFF (same-origin browser API, CSRF protection)
   | service credential / user context, private network
FastAPI API ───────────── Worker service
   |                       | queue + retries + dead-letter review
   +---- domain services --+---- ingestion / detectors / connectors
              |                         |
       PostgreSQL                 private object storage
       tenant-scoped               encrypted captures
       relational data              hashes/provenance in DB
```

### Service responsibilities

- **Web:** authenticated app shell, tenant and role-aware navigation, server-mediated API access, evidence presentation, review forms, audit timeline, and clear demo/sample labels. The browser never receives provider secrets or direct database/object-store credentials.
- **API:** OIDC/session validation, tenant membership and role checks, rate limits, request IDs, schema validation, domain service calls and consistent problem responses. Every query and mutation receives a verified `TenantContext` from auth middleware.
- **Worker:** idempotent ingestion, analysis, connector sync, evidence processing, report export and retryable external calls. Each job has tenant scope, actor/source, idempotency key, attempt state, deadlines and structured outcome. Start with a single worker deployment; use a queue such as Redis-backed RQ/Arq or a managed queue selected for the hosting environment.
- **PostgreSQL:** authoritative operational state, migrations, tenant-scoped indexes/constraints and audit metadata. Keep pgvector optional until a measured retrieval feature needs embeddings. Use JSONB for source-specific attributes and versioned feature payloads, not as a substitute for core relational fields.
- **Object storage:** private bucket with encryption, short-lived authorized downloads, checksums, retention/lifecycle rules and an evidence metadata record. Store original bytes; use a safe derived preview for browser display.
- **Connectors:** provider-neutral adapter interface with capability/config status, permitted scopes, rate limits, webhook verification, cursor state and health. Implement one customer-authorized ingestion source first. Treat reputation APIs as enrichments, not authoritative labels.

### Enterprise tenancy and identity

- Integrate a managed OIDC identity provider; support enterprise SSO and MFA through that provider. Store application users, tenants/organizations, memberships and role grants. Map subject ID to user and tenant membership on every request.
- Roles initially: `org_admin`, `brand_manager`, `analyst`, `read_only`, and service identities with narrow connector scopes. Enforce permissions server-side for read, export, review, tenant configuration and response actions.
- Tenant selection in UI may choose among a user’s memberships, but the API validates that membership; headers/body values cannot grant access.
- Add PostgreSQL row-level security as defense in depth after application query scoping is consistent. Set tenant context transaction-locally and ensure pooled connections clear it.
- Use separate service credentials per worker/connector. Keep secrets in the deployment secret manager and encrypt per-tenant connector credentials with managed KMS; never return stored secret values.

## 3. Product scope for the first enterprise pilot

Build a trustworthy workflow for **one customer, one enrolled brand, one permitted source, and one evidence-backed campaign review**. The pilot should cover:

1. Admin creates tenant, invites users and assigns roles.
2. Brand manager enrolls a brand and verifies domains/handles/apps with provenance.
3. Analyst submits a permitted report or connector delivers an observation.
4. ASTRA stores the original evidence privately, records provenance and hash, normalizes indicators, and starts an analysis job.
5. Versioned deterministic detectors produce signals with supporting evidence references and feature explanations.
6. Linker proposes candidate campaign edges with pivot, strength and exact evidence; uncertain edges stay reviewable and do not silently merge cases.
7. Analyst reviews the case, confirms/rejects links, records a reason and sees a complete append-only audit timeline.
8. ASTRA creates an editable response draft from approved case facts. A separate authorized user approves any future connector submission; pilot actions remain export or simulation unless a real integration is explicitly approved and tested.

Do not make automated takedowns, automated customer warnings, APK execution, arbitrary URL crawling, broad scraping, or AI case adjudication part of the first pilot.

## 4. Frontend implementation plan

### Product structure

Prioritize these routes in the database-backed analyst app:

| Route | Enterprise behavior |
| --- | --- |
| `/overview` | Tenant-scoped queue and trend summaries; show data freshness and connector health; no invented demo KPIs. |
| `/brands` and `/brands/[id]` | Brand enrollment, official asset verification, source provenance and verification history. Separate legal/brand facts from analyst notes. |
| `/sightings` | Search/filter queue, paginated results, surface/source/time/status, permission-aware evidence access and ingestion state. |
| `/campaigns` and `/campaigns/[id]` | Campaign detail, score explanation, members, candidate/confirmed/rejected graph edges, evidence panel, analysis run version, analyst decisions and audit timeline. |
| `/campaigns/[id]/response` | Editable drafts, evidence manifest, export, approval state and action outcomes. Default to draft/export only. |
| `/settings/users` | Invitations, memberships, role assignment, SSO config status and audit events (org admin only). |
| `/settings/connectors` | Server-reported connector state, scope, last success, lag and remediation. No client-held secrets or fabricated connectivity checks. |

Keep the legacy simulator accessible only through a clearly labeled demo route during migration. Decide whether `/console` is a customer sandbox or remove it after its useful components are migrated. Do not allow state in the simulator to imply it was persisted or externally monitored.

### Frontend engineering tasks

- Replace hard-coded headers and API base URL behavior in `apps/web/src/lib/api.ts` with an authenticated same-origin BFF or a server-only configured API client. Support local Docker and deployed environments without browser secrets.
- Generate TypeScript API bindings from FastAPI OpenAPI into `packages/api-client`; eliminate duplicated hand-maintained API response types and untyped `any` from API boundaries.
- Consolidate data access around TanStack Query hooks and query-key factories. Standardize API errors; do not turn every failure into an empty array/null that looks like valid empty data.
- Make pagination, sorting, filters and selected graph node shareable in URL state. Use server components for stable initial reads and client components for graph, forms and review actions.
- Build visible loading, empty, retry, permission denied, stale data and partial connector failure states. Show whether a record is synthetic, imported, connector-derived or manually submitted.
- Remove mock connector values and fake success latency from `apps/web/src/lib/store.ts`, `/api/connectors` and console settings before production build. Never show “connected” unless backend configuration and a real authorized health check support it.
- Use accessible labels, keyboard-operable graph alternatives, non-color risk text, confirmed destructive actions and safe text rendering for hostile captured content.
- Ensure response drafts are visibly labeled “Draft — review before sending.” Escape untrusted evidence when rendering/exporting; keep raw evidence text out of HTML contexts.

## 5. Backend and data implementation plan

### Data model additions and corrections

Add migration(s) rather than rewriting deployed migrations. Align ORM metadata, Alembic schema and API schemas in the same change.

| Domain | Required target fields/constraints |
| --- | --- |
| Identity | `users`, `memberships`, `role_grants`, optional `service_principals`; unique `(tenant_id, user_id)` membership. External identity subject is unique per issuer. |
| Tenant-owned data | Add tenant keys/constraints to dependent records such as `brand_assets`, `evidence_objects` (directly or composite scope), `sighting_indicators`, `signals`, `campaign_members`, `campaign_edges`, and `response_actions`. Enforce brand/sighting/campaign parent ownership through composite foreign keys where practical. |
| Sources and jobs | `connectors`, encrypted connector secret references, source cursor/checkpoint, `ingestion_jobs`, `analysis_runs`, `job_attempts`, idempotency keys, retry and dead-letter status. Never store cleartext secrets in application rows/logs. |
| Evidence | Content SHA-256, immutable object version/key, size, media type, capture/ingest timestamps, source reference, acquisition method, provenance, retention/deletion state and access audit. |
| Indicators/signals | Typed canonical value, normalization version, extraction method and confidence; signal detector/version/config, score, threshold, evidence references, features and run ID. Validate scores and IDs. |
| Campaign graph | Stable endpoint references, pivot type/value reference, candidate/confirmed/rejected status, confidence and supporting signal/evidence references. Add decision history and explicit merge/split events. |
| Risk/review | Separate computed score and human disposition. Persist formula version, feature contributions, freshness timestamp and override reason. Do not mutate historical run results after analyst decisions. |
| Response | Tenant-owned response action, draft version, evidence manifest, approval request/approver, idempotent submission attempt, external receipt/status and audit record. Simulation must not be confused with approval or submission. |
| Audit | Tenant, actor/service identity, request/job ID, action, target, timestamp, safe before/after metadata and integrity/retention policy. Audit must be append-only to normal application roles. |

### API contract direction

Keep `/api/v1`, UUIDs, UTC timestamps, explicit enums and OpenAPI as the source of truth. Add cursor pagination for sightings/campaigns, filtering/sorting validation, request ID and consistent `application/problem+json` or equivalent errors. Return 404 for inaccessible tenant-owned resources where that avoids confirming cross-tenant existence.

Prioritize these interfaces:

- `GET/POST /api/v1/brands`, `GET/PATCH /api/v1/brands/{id}`, and brand-asset verification history.
- `POST /api/v1/ingestion-jobs` for permitted imports/reports; connector webhooks write a verified event to a durable inbox and enqueue processing.
- `GET /api/v1/jobs/{id}` and `GET /api/v1/jobs/{id}/events` (poll first; add SSE if needed).
- `GET /api/v1/sightings` with cursor and filters; `GET /api/v1/sightings/{id}/evidence` via authorized short-lived object download.
- `POST /api/v1/analysis-jobs` and `GET /api/v1/analysis-jobs/{id}` with explicit queued/running/succeeded/partial/failed states.
- `GET /api/v1/campaigns`, `GET /api/v1/campaigns/{id}`, `POST /decisions`, `POST /edges/{edge_id}/decisions`, and explicit merge/split review endpoints.
- `POST /api/v1/campaigns/{id}/response-drafts`, update/version draft, request approval, approve/reject, export, and later connector submission endpoints. Require distinct permission and audit events.
- `GET /api/v1/connectors` and connector health/status based on server state and last successful activity.

The API should own the transaction boundary. Domain services may not commit mid-work; callers commit once all DB changes for an operation succeed. For database + object storage, use temporary upload + checksum verification + durable metadata/outbox state and compensating cleanup, not an assumption of a distributed transaction.

### Detection and campaign correctness

- Create deterministic detector interfaces with input schema, detector ID/version, config hash, evidence IDs and structured features. Store detector errors as per-detector outcomes without losing successful signals.
- Start with small, reviewed rules: exact official identity checks, Unicode lookalikes, domain similarity, app package/certificate comparisons, payment/phone reuse and clearly evidenced credential/payment solicitation.
- Separate extraction confidence, threat likelihood heuristics and business impact. A score is a triage priority, not a probability; display formula version, feature contribution and missing data.
- Rebuild linking with explicit pivot policy: strong exact pivots can propose edges; medium pivots require independent support; weak similarity alone cannot auto-merge. Build components from eligible edges, preserve rejected links and support analyst splits.
- Scope each proposed edge to the cluster/campaign it connects. Add stable deduplication keys so reruns are idempotent and do not duplicate signals, edges or campaigns.
- Keep model summaries optional and evidence-grounded. Schema-validate output, retain model/provider/prompt version, minimize submitted data and never let model text create a fact without linked evidence.
- Maintain a labeled evaluation set, including benign near-matches and adversarial cases. Track precision/recall by detector and surface, analyst override rate and false campaign merge rate before claiming detection performance.

## 6. Security, privacy and enterprise operations

Before external pilot data is ingested, complete:

- OIDC sign-in, MFA policy through identity provider, session rotation/revocation, CSRF protection, secure cookies and service-to-service auth.
- Tenant ownership validation for every route and domain operation; cross-tenant authorization tests; database constraints/RLS as defense in depth.
- Rate limits, request size limits, allowlisted CORS, safe security headers, SSRF-safe connector egress, webhook signature/clock/replay checks, and upload MIME/size validation.
- Secrets management and rotation; dependency/image scanning; least-privileged database and cloud identities; no production debug/reload; no secrets or full evidence in logs.
- Encryption in transit and at rest; retention schedules; customer export/deletion workflow; object versioning and access logs; documented subprocessors and model data handling.
- Audit for evidence views/downloads, brand changes, user/role changes, decisions, exports, approvals and connector actions.
- Observability: structured JSON logs with request/job/tenant IDs (tenant ID only where safe), metrics for queue lag and job outcomes, traces across API/worker/DB, error reporting, alerts and health/readiness probes.
- Backup and restore runbook for PostgreSQL and object store; migration rollback/forward plan; defined RPO/RTO for pilot.
- Incident response, customer support escalation, and a documented process for platform/provider access withdrawal or connector suspension.

Do not fetch arbitrary user-provided URLs in the API/worker. For a future permitted URL collector, isolate the fetcher and defend against SSRF (DNS rebinding, private/link-local IPs, redirects, schemes, ports, response size and timeout), malware and unsafe document parsing. Never execute uploaded APKs or archives.

## 7. Infrastructure and deployment target

Keep a reproducible local Compose profile for developer use. Create separate staging and production deployments with:

- Web and API deployments with immutable build artifacts, non-root containers, pinned lockfiles and production start commands.
- Managed PostgreSQL with backups/PITR, TLS, private networking, migration job and least-privileged credentials.
- Private encrypted object storage and managed queue; worker deployment with bounded concurrency and retry/dead-letter policy.
- Secret manager/KMS, centralized logs/metrics/traces, error monitoring, alert routing and deployment health checks.
- Per-environment identity provider, OAuth/webhook URLs, CORS origins and connector credentials. No wildcard Vercel origin regex in production.
- CI stages for formatting/type checking, static analysis, unit/integration/API/tenant-isolation checks, migration validation, frontend production build, container scan and deployment artifact creation. Promote the same artifact through staging to production.

Fix current configuration before deployment work: API health endpoint and `railway.json` healthcheck must agree; web API base URL must be valid in each runtime; avoid build-time exposure of backend URLs/secrets; Compose must have production and dev profiles; use a frozen frontend lockfile with reproducible install and avoid `--no-frozen-lockfile` in production builds. Keep migration execution as a controlled release step rather than concurrent app-start behavior.

## 8. Phased delivery and completion gates

Effort is relative; validate durations after the first technical spike. Complete each phase with a reviewable vertical slice and do not treat code presence as acceptance.

### Phase 0 — Baseline, product truth and defect stabilization

**Work:** create a route/API/data-flow inventory; label real persisted features versus simulator/demo features; reconcile README, `docs/architecture.md`, phase status and runbook. Fix response-action schema/query mismatch, health path, API URL configuration, integration error handling and score/report hard-coding. Preserve existing fixtures as demo-only. Decide one pilot customer workflow and one permitted source.

**Gate:** clean local environment can start from documented commands; demo reset is scoped, repeatable and cleans associated evidence; every demonstrated production feature is marked persisted or clearly simulated; no real connector secrets or fake success claims are in frontend defaults.

### Phase 1 — Identity, tenancy and schema integrity

**Work:** implement OIDC-backed identity, memberships and roles; replace `X-Tenant-ID`/`X-Actor` authority; route all reads/writes through verified tenant context; validate brand ownership in ingestion and all relationship writes; add tenant-aware constraints and response action ownership; harden audit. Create cross-tenant denial and role matrix checks.

**Gate:** unauthenticated production API is denied; two test tenants cannot read, create relationships to, mutate, export or infer each other’s records; analyst cannot perform org admin or response approval actions; audit actor is derived from verified identity.

### Phase 2 — Evidence pipeline and asynchronous jobs

**Work:** create ingestion job and connector interfaces; use a durable queue and worker; idempotency for webhook/event and batch imports; move evidence to private object storage; record provenance/hash and cleanup lifecycle; add job status, retry, partial failure and dead-letter handling. Start with user-submitted reports or one authorized source.

**Gate:** replaying the same source event does not duplicate sightings/evidence; object/DB failure leaves recoverable state; evidence download is tenant/role checked and integrity verified; queue retries do not duplicate analysis outcomes.

### Phase 3 — Reliable detection, scoring and campaign graph

**Work:** refactor detector contracts and versioned runs; remove fixed scores and false-positive assumptions; repair linker as above; make analysis background-capable, repeatable and idempotent; persist score contributions and edge rationale; record analyst merge/split/reject decisions.

**Gate:** labeled synthetic evaluation set reports measured outcomes; benign near-match stays separate; each edge can be opened to supporting evidence; repeated analysis does not create duplicate cases; individual detector failure is visible without hiding successful results.

### Phase 4 — Analyst experience and response governance

**Work:** complete the frontend route migration to persisted API data; generated API client; query/error/pagination patterns; case review and audit; accessible graph/list alternative; evidence panel and safe text; draft versioning and export; approval permissions. Mark all simulation clearly and remove synthetic data from production screens.

**Gate:** analyst can enroll a brand, ingest a report, inspect evidence, review a proposed campaign, record a decision and export an editable response draft end to end. Every mutation refreshes persisted state and adds an audit event. No UI action claims external submission unless a receipt confirms it.

### Phase 5 — Staging, security review and limited pilot

**Work:** deploy staging and production infrastructure, backups, monitoring and alerting; run migration/restore and tenant isolation checks; threat-model connector and evidence flows; set retention and deletion; document support and incident response; onboard a small pilot with synthetic-to-real data boundary documented. Enable only a reviewed source adapter.

**Gate:** security/privacy review has no unresolved critical/high findings; restore rehearsal is successful; SLO and operational owner are defined; one pilot tenant can operate with least-privilege users; connector scope and data handling are approved and observable.

### Phase 6 — Scale based on evidence

**Work:** add source connectors one at a time, increase worker throughput, tune case search, evaluate detector quality by source, add retention tiers and enterprise administration. Consider service extraction only after profiling. Add live response submission only after provider approval, customer authorization, signed approval workflow, idempotent submission, receipt tracking and rollback/escalation procedures.

**Gate:** expansion has measured value, acceptable detector false-positive rates, capacity evidence, clear customer controls and a tested operational runbook. Avoid marketing performance claims until supported by representative labeled outcomes.

## 9. Suggested ownership and work order

For a small team, align parallel streams around stable contracts:

1. **Platform/backend owner:** identity, tenant context, migrations, object storage, worker/job contracts and API OpenAPI.
2. **Detection/data owner:** normalization, detector versions, linking correctness, evaluation fixtures and quality metrics.
3. **Frontend owner:** persisted workflow, BFF/session integration, generated client, evidence and case review UI.
4. **Product/security owner:** pilot source permissions, privacy/retention, response governance, threat model and acceptance gates.

Integrate by merging narrow vertical slices: auth + tenant-scoped overview; brand enroll + persisted assets; report ingest + evidence access; one analysis run + campaign detail; analyst decision + audit; response draft + export. Keep a short decision record for schema/API changes and generate client types from the merged API contract.

## 10. First implementation backlog

Recommended first sequence from the current codebase:

1. Add this plan as the enterprise source of truth; update README and `docs/architecture.md` to accurately distinguish hackathon demo, implemented API paths, and not-yet-supported enterprise capabilities.
2. Remove hard-coded tenant/actor headers from the web API helper; introduce an auth provider seam and prohibit production startup with demo auth defaults.
3. Add user/membership tables and establish tenant context from authenticated membership; validate item brand IDs and all child relationships.
4. Add `tenant_id` to response actions (or equivalent enforced ownership join) and correct all queries/model/migration/schema together.
5. Refactor DB commit boundaries and make evidence persistence recoverable; scope demo reset and remove orphaned local evidence.
6. Rewrite campaign linking and add fixtures that prove cluster-local edges, weak-pivot behavior, benign separation and idempotent reruns.
7. Replace frontend placeholder connector state with backend connector status; mark `/console` and sample data as demo only.
8. Create a worker/job vertical slice for one manual report ingestion and analysis flow; only then connect one authorized source.
9. Generate API client from OpenAPI and migrate overview, brand, sightings and campaign screens to consistent authenticated data/error handling.
10. Deploy staging with monitoring, backups, object storage, secrets management and security gates before onboarding real evidence.

## 11. Readiness definition

ASTRA may be called ready for a limited enterprise pilot when all of these are true:

- It has authenticated users, verified tenant membership and tested role permissions.
- All data access and object downloads are tenant-scoped; cross-tenant tests pass.
- One permitted source/report path is durable, idempotent, observable and provenance-preserving.
- Detection and campaign links are reproducible and explainable, with measured performance on labeled data and benign controls.
- Analyst decisions, evidence access, exports and approvals are auditable.
- Response output is a truthful, editable draft; external submission remains behind explicit authorization and approval.
- Staging/production deployment, migration, backup/restore, retention, incident and support runbooks have been exercised.
- Product documentation and UI accurately state what is live, simulated, degraded or unavailable.

This sequence keeps the current implementation useful while putting identity, data correctness and operational safety ahead of connector breadth. The earlier hackathon engineering plan remains useful for the demo stack and screen concepts, but this document supersedes its phase checklist for enterprise readiness.
