# ASTRA — Final Engineering Plan and Technology Blueprint

**Purpose:** Build ASTRA as a credible Digital Risk Protection product: a brand enrolls its trusted identity, ASTRA ingests suspicious sightings, explains the evidence, links related activity into campaigns, helps an analyst decide what to do, and prepares a response packet.

**Hackathon release:** a complete, repeatable product slice using synthetic data. The demo works without live social scraping, external platform credentials, or hosted AI services.

**Engineering principle:** the database and evidence are authoritative; detectors produce explainable signals; AI can assist; an authorized analyst controls case decisions and external actions.

## 1. Technology blueprint

Use the latest patch on each selected supported line, commit lockfiles, and freeze dependencies before the final demo. The following lines were checked against official sources on 10 October 2026.

| Area | Selected technology | Use in ASTRA |
| --- | --- | --- |
| Web runtime | Node.js 24 LTS, pnpm | Reproducible frontend environment; prefer LTS over Node 26 Current for a time-boxed build. |
| Frontend | Next.js 16.4 App Router, React 19.3, TypeScript strict | Product shell, route layouts, server-rendered first view, interactive analyst screens. |
| Styling | Tailwind CSS 4.3, shadcn/ui, Lucide | Consistent design tokens and accessible controls. Add shadcn components to the repo and customize them. |
| Client data/forms | TanStack Query v5, React Hook Form, Zod | API caching and mutations, validated enrollment and review forms. |
| Campaign graph | @xyflow/react | Interactive network view with custom nodes for profiles, domains, apps, phones, and payment identifiers. |
| Charts | Recharts | Compact KPI and trend charts. |
| API typing | FastAPI OpenAPI → openapi-typescript + openapi-fetch | Generate frontend contracts; do not manually duplicate API types. |
| Backend runtime | Python 3.14.8 for pure-Python/API path; Python 3.13.16 if a required native ML package lacks 3.14 wheels | Python 3.15.0 just shipped; keep it off the critical path until the whole dependency set is verified. |
| API | FastAPI, Pydantic v2, Uvicorn | Typed HTTP API, validation, OpenAPI and interactive docs. |
| ORM/migrations | SQLAlchemy 2, Alembic, psycopg 3 | Explicit relational model and repeatable database changes. |
| Database | PostgreSQL 18.6, pgvector, Postgres full-text search | Authoritative case data and optional vector similarity without a second database. |
| Evidence files | Local volume or MinIO in demo; S3-compatible object storage later | Large captures/files are stored separately; hashes and provenance stay in Postgres. |
| Async processing | Synchronous seeded analysis in demo; Redis plus worker queue when real feeds or long jobs arrive | Keep the hackathon deployable as a modular monolith. |
| Local runtime | Docker Compose: web, API, PostgreSQL/pgvector, optional MinIO | Same environment for teammates and local demo fallback. |
| Observability | Structured JSON logs, request IDs; OpenTelemetry when deployed | Trace a request through API, analysis, and persistence. |

**Why this stack:** React gives the analyst graph and case workflow; Python keeps detection libraries close to the API; Postgres handles cases and vectors in one system. Start with deterministic rules and perceptual hashes. Add vision/text models only behind adapters and after the base flow works.

Release checks: [Next.js 16.4](https://nextjs.org/blog), [React 19.3](https://react.dev/versions), [Node.js schedule](https://nodejs.org/en/about/previous-releases), [Python versions](https://www.python.org/doc/versions/), [PostgreSQL 18](https://www.postgresql.org/docs/release/18.0/), [Tailwind 4.3](https://tailwindcss.com/blog/tailwindcss-v4-3).

## 2. Product workflow and system connections

Brand enrollment → approved Brand DNA → seeded/permitted observations → normalized sightings and evidence → versioned signals → candidate indicator links → prioritized campaign and graph → analyst decision → editable response packet → approved or simulated action → audit history and recurrence metrics.

Every arrow is a persisted contract. UI reads state from the API; it does not invent risk results. A detector cannot issue takedowns. A model cannot decide two accounts belong to the same actor. Every campaign edge must show its pivot and supporting evidence.

### Logical architecture

Analyst browser → Next.js console → typed JSON API over HTTPS → FastAPI routes and tenant authorization → domain services → SQLAlchemy repositories and evidence storage → PostgreSQL 18/pgvector plus private object storage. Ingestion adapters feed normalized sightings. Detector orchestration writes signals. Campaign linker writes evidence-backed edges. Campaign/response services serve persisted state. A future worker can run long ingestion jobs without changing these contracts.

### What calls what

1. Browser calls the Next.js app and typed API client; it never accesses database or object storage directly.
2. Next.js calls FastAPI through one configured API base URL; use a server proxy only if it simplifies auth/CORS.
3. FastAPI routes validate/authenticate and call domain services, not detector code or raw SQL.
4. Domain services use SQLAlchemy repositories for state and an evidence-storage interface for files.
5. Each source adapter converts its source record into the common Sighting contract.
6. Detectors receive a saved sighting plus Brand DNA and return Signal objects with evidence references.
7. Linker consumes indicators/signals and stores proposed edges with reasons.
8. Case rendering reads persisted signals/edges; it does not rerun hidden AI logic.
9. Analyst mutations write decision and audit rows in one database transaction.
10. Demo reset loads the same fixtures each time; future connectors adapt to this same model.

## 3. Repository and reuse plan

```text
astra/
  apps/web/src/app/                   # overview, sightings, brands, campaign routes
  apps/web/src/components/shell/      # nav, header, tenant/demo indicator
  apps/web/src/components/ui/         # shadcn primitives and brand tokens
  apps/web/src/features/overview/     # KPI cards, trends
  apps/web/src/features/brands/       # Brand DNA enrollment
  apps/web/src/features/sightings/    # queue, filters, evidence drawer
  apps/web/src/features/campaigns/    # graph, signals, timeline, review
  apps/web/src/features/responses/    # drafts, evidence manifest, export
  apps/web/src/lib/api/               # generated client and query functions
  apps/api/app/main.py                # app setup, middleware, routers
  apps/api/app/api/v1/                # route handlers only
  apps/api/app/core/                  # settings, auth, tenant permissions
  apps/api/app/db/                    # engine, SQLAlchemy models, migrations
  apps/api/app/schemas/               # Pydantic request/response contracts
  apps/api/app/domain/                # brand, sighting, campaign, review services
  apps/api/app/ingestion/             # fixture loader and source adapters
  apps/api/app/detectors/             # name, profile, web, app, text, image checks
  apps/api/app/linking/               # normalization, edges, merge/split
  apps/api/app/scoring/               # versioned scoring features/formula
  apps/api/app/evidence/              # hashing, storage interface, manifest
  apps/api/app/ai/                    # optional provider-neutral model adapters
  apps/api/app/seed/                  # fictional brand and labeled fixtures
  packages/api-client/                # generated TypeScript bindings
  infra/compose.yaml                  # app, API, Postgres, optional MinIO
  infra/postgres/init.sql             # vector extension and local DB setup
  docs/                                # API contract, architecture, demo runbook
  .env.example
  README.md
```

**Scaffold/reuse:** use create-next-app for the Next App Router/TypeScript shell; shadcn CLI for primitives; React Flow quickstart/custom-node examples for graph mechanics; FastAPI full-stack template selectively for backend layout, Compose and CI conventions; pgvector docs for installation/query patterns. Write ASTRA's tenant-aware schema, evidence model, detectors, linking/scoring, UI workflow, and synthetic fixtures yourselves. The FastAPI template has a Vite-oriented frontend; do not mix a second frontend framework into this Next project. Review component/model/data licenses.

Official starts: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [shadcn](https://ui.shadcn.com/docs/installation/next), [React Flow](https://reactflow.dev/learn), [FastAPI template](https://github.com/fastapi/full-stack-fastapi-template), [pgvector](https://github.com/pgvector/pgvector).

## 4. Frontend engineering blueprint

### Routes and screen responsibilities

| Route | Screen | API data |
| --- | --- | --- |
| /overview | Active/high-risk campaigns, recent detections, response and recurrence trends | GET /api/v1/overview |
| /brands | Brand list and onboarding progress | GET /api/v1/brands |
| /brands/[id] | Trusted domains, handles, logos, app/package/cert, phone/payment identifiers | GET /api/v1/brands/{id} |
| /sightings | Filterable queue by surface, risk, state, brand, date and campaign | GET /api/v1/sightings |
| /campaigns/[id] | Summary, graph, relationship reasons, signals, evidence, timeline, actions | GET /api/v1/campaigns/{id} |
| /campaigns/[id]/response | Editable drafts, evidence manifest, export, draft/simulated state | GET /api/v1/campaigns/{id}/response-drafts |

### UI implementation

- Product shell: left nav, top search/context bar, brand selector, visible DEMO DATA label.
- Campaign page: severity/status and next analyst step above fold; graph center; evidence/reason side panel; timeline and actions below.
- Custom React Flow node types: Profile, WebAsset, App, Indicator. Show concise label, surface, risk/state and source count; keep full evidence in side panel.
- Reusable components: RiskBadge, EvidenceChip, SignalRow, FeatureBreakdown, CampaignStatus, TimelineEvent, MetricCard, TableToolbar, EmptyState, ConfirmActionDialog.
- TanStack Query handles reads/mutations. On review or unlink, invalidate campaign, inbox and overview query keys. Avoid ad hoc fetch calls inside components.
- React Hook Form + Zod handle Brand DNA, analyst reasons, and response edits. API validation remains authoritative.
- Put filters/selected view in URL state where practical. Provide skeleton, empty, error, retry, permission-denied and partial-detector-failure states.
- Use semantic risk labels, keyboard focus, accessible contrast/status text. Prioritize a 1440px analyst console but retain laptop-width usability.
- Keep client components for graph, filters, forms, dialogs and interactive tabs. Use server components for stable layout/initial read views where useful.

### Frontend API module

Create typed functions: listCampaigns(filters), getCampaign(id), listSightings(filters), getBrand(id), reviewCampaign(id,payload), reviewEdge(campaignId,edgeId,payload), createResponseDrafts(id), simulateAction(actionId), resetDemo(). Keep query-key factories together. On mutation success update/invalidate relevant query keys. The UI displays backend-provided score and contributions; never recalculate them.


## 5. Backend engineering blueprint

### Request and persistence flow

FastAPI router → authentication/tenant authorization → Pydantic input validation → domain service → SQLAlchemy repository/evidence store → Postgres transaction → Pydantic response. Keep route handlers short. For example, POST /analysis-jobs calls AnalysisService; it does not implement similarity, clustering, scoring, and database writes inline.

### Core relational model

| Table | Purpose / key fields |
| --- | --- |
| tenants, users, memberships | Tenant boundary, identity and role. |
| brands | tenant_id, name, status, timestamps. |
| brand_assets | brand_id, asset_type, canonical_value, object_key, sha256, verified_at. |
| sightings | tenant_id, brand_id, surface, source_kind, observed_at, normalized_payload, provenance. |
| evidence_objects | sighting_id, object_key, media_type, sha256, captured_at, source reference. |
| indicators | tenant_id, type, canonical_value, fingerprint; unique tenant/type/value. |
| sighting_indicators | sighting/indicator association, extraction method and confidence. |
| analysis_runs | start/end/status, detector versions, thresholds and formula snapshot. |
| signals | sighting, detector key/version, score, threshold, explanation, evidence IDs, feature values. |
| campaigns, campaign_members | case state, members, first/last seen, risk score. |
| campaign_edges | endpoints, pivot, confidence, evidence IDs, proposed/confirmed/rejected. |
| analyst_decisions | actor, campaign/edge, accept/reject/benign/split, reason, timestamp. |
| response_actions | draft payload, type, approval/simulated state, actor and timestamps. |
| audit_events | tenant, actor, request ID, event type, entity, timestamp, safe metadata. |

Index tenant-scoped lookup fields and timestamps. Apply tenant-aware uniqueness and foreign keys. Keep raw captures out of JSONB. Use JSONB for versioned detector metadata or source-specific fields only. Every tenant-owned row has tenant_id and every query scopes by it.

### API contract

Use /api/v1, UUIDs, UTC ISO timestamps, cursor pagination, explicit enums, and consistent error JSON with code/message/request_id. Return 401 and 403 distinctly. Do not reveal whether another tenant owns an ID.

- POST /api/v1/brands — create brand and trusted identity.
- POST /api/v1/brands/{brand_id}/assets — add identity or asset; return verification status.
- POST /api/v1/demo/reset — clear only demo tenant and load deterministic fixtures.
- POST /api/v1/sightings:batch — validate and normalize source observations.
- POST /api/v1/analysis-jobs — run analysis; return run ID and status.
- GET /api/v1/sightings — filterable, cursor-paginated inbox.
- GET /api/v1/campaigns — campaign list with risk/state/surface/time filters.
- GET /api/v1/campaigns/{id} — summary, graph, signals, evidence, decisions and timeline.
- POST /api/v1/campaigns/{id}/decisions — accept/reject/benign plus actor and note.
- POST /api/v1/campaigns/{id}/edges/{edge_id}/decisions — confirm or reject relationship.
- POST /api/v1/campaigns/{id}/response-drafts — editable drafts and evidence manifest.
- POST /api/v1/actions/{id}/simulate — add simulated action and update timeline/metrics.

FastAPI OpenAPI is the source of truth for TypeScript types. Keep browser access behind the API; issue short-lived authorized object download URLs only when required.

### Ingestion and evidence

Common SightingInput fields: tenant_id, brand_id, surface, source_kind, observed_at, observed_value, source_ref, text_fields, asset_refs, extracted_identifiers, provenance. An adapter translates a source payload into this format; downstream ASTRA does not depend on a platform payload.

For each record: validate schema and allowlisted file type/size; store raw fixture/capture; compute SHA-256; create evidence metadata; normalize indicators; save source/provenance. Preserve original bytes. Demo uses local fixtures only. Do not fetch arbitrary URLs or execute APKs/archives.

### Detector and AI contracts

Each detector accepts a normalized sighting, Brand DNA and versioned config. It returns Signal objects with signal_type, score 0–1, threshold, explanation, evidence_ids, detector_key, detector_version and compact feature_values. It cannot update case status or call response integrations.

Implement exact registry checks, Unicode/homoglyph and edit-distance checks, logo perceptual hashes, domain similarity, app package/certificate mismatch, and exact phone/UPI pivots first. Optional text classifier and local image embedding sit behind provider-neutral interfaces. A failing optional model records an error while deterministic signals continue.

AI may summarize supplied evidence or suggest an intent label. Require Pydantic-validated structured output and evidence IDs. Store provider/model/prompt version. Do not send credentials or unnecessary personal data. The model cannot confirm links, approve a case, send warnings, or submit takedowns.

### Linking and scoring

Strong pivots: exact UPI, phone, package, certificate, or a verified shared domain. Medium: logo perceptual hash or repeated landing-page structure. Weak: similar handle, common brand phrase, or generic text. Propose edges with confidence and evidence. Do not let a chain of weak edges merge campaigns. Support confirm/reject/split.

Use the documented prototype score: identity similarity 35%, harm 30%, exposure 20%, freshness 15%. Normalize inputs to 0–1 and persist each contribution plus formula version. Treat it as a prioritization heuristic, not a probability. Analyst overrides create decision records; they do not overwrite the computed score.

## 6. The six engineering phases

### Phase 1 — Product shell, runtime, contracts and persistence foundation

**Goal:** a running product shell with one frontend-to-backend request and a database-backed record.

**Frontend**
- Scaffold Next.js App Router, strict TypeScript, Tailwind, initial shadcn controls.
- Create app shell, navigation, brand selector, demo-data badge, page heading, button/input/table/dialog primitives.
- Create overview, sightings, brands and campaigns routes with loading/error/empty states.
- Add generated API client and typed health/overview query.

**Backend**
- Scaffold FastAPI settings, CORS allowlist, request ID middleware, structured logs, /health/live and /health/ready.
- Add SQLAlchemy engine/session, Alembic, Compose Postgres, initial migration, tenant/brand tables.
- Define Pydantic responses, error envelope, pagination/timestamp/UUID conventions, OpenAPI generation script.
- Add one route returning database-backed overview data.

**Connect**
- Frontend GET /api/v1/overview → generated client → FastAPI router → overview service → SQLAlchemy → Postgres.
- Generate TypeScript types from running OpenAPI and commit output. Compose starts all services.

**Exit gate**
- Teammate can clone, start with one Compose command, open UI and load a seeded tenant/brand.
- Schema changes are migrations; no manual DB setup.

### Phase 2 — Brand DNA, evidence intake, fixtures and normalization

**Goal:** define what is genuine and persist traceable sightings.

**Frontend**
- Build Brand DNA enrollment steps: brand details, domains/handles, app/package/certificate fields, logo upload, support phone, payment IDs.
- Show verified/pending identity checklist and edit history.
- Add seed/reset control clearly labeled synthetic; create sighting detail drawer with source, first-seen, capture time, hash and provenance.

**Backend**
- Implement Brand/BrandAsset schemas, services, authorization, normalization, storage interface and evidence hashing.
- Implement SightingInput, EvidenceObject, Indicator and association models.
- Add fixture adapter and idempotent POST /demo/reset. Fixtures include expected campaign labels and a benign lookalike.
- Normalize IDN/domain, Unicode handle, phone, package/certificate and UPI values while retaining original evidence.

**Connect**
- Brand form → POST /brands and /brands/{id}/assets → validation → DB/object storage.
- Reset → fixture adapter → normalizer → persisted sightings/indicators/evidence → return IDs and run state.
- Sighting drawer reads evidence metadata through API, not direct bucket access.

**Exit gate**
- Reset returns the same fictional case every time; every sighting has tenant scope, provenance, indicator normalization, immutable hash and timestamps.
- Uploads are type/size validated; URL crawling remains off.

### Phase 3 — Explainable detection and signal generation

**Goal:** every seeded suspicious record receives repeatable signals that can be inspected.

**Frontend**
- Build threat inbox with surface, observed identity, score, signals, status and first-seen.
- Add RiskBadge, SignalRow, EvidenceChip, FeatureBreakdown and detector-failure states.
- Signal detail shows evidence, comparison value, threshold, detector version and explanation.
- Add analysis status/progress; polling is enough for synchronous demo.

**Backend**
- Implement detector protocol/registry, config/version management and analysis run model.
- Add exact Brand DNA mismatch, homoglyph/edit distance, logo hash, domain similarity, app metadata/cert mismatch, phone/UPI reuse and text rules.
- Optional text or visual model returns validated suggestions behind adapter; rule-based checks are primary.
- Persist signals and detector errors per run. One failing model cannot erase other results.

**Connect**
- Run Analysis → POST /analysis-jobs → analysis service → detector set → persisted signal rows → GET /sightings and analysis status → inbox updates.
- Every signal references Phase 2 evidence. API returns backend-computed score and reason; frontend does no detection.

**Exit gate**
- Labeled malicious fixtures produce expected signal types; at least one benign near-match does not reach high risk.
- Judge can inspect evidence, threshold and rule version. Same input/config reproduces same result.


### Phase 4 — Indicator graph, campaign grouping and triage ranking

**Goal:** separate sightings become one explainable campaign when evidence connects them.

**Frontend**
- Implement React Flow with custom Profile, Domain, App and Indicator nodes plus labeled edges.
- Add zoom/pan, fit-to-view, selection, legend, accessible node controls and graph loading/empty states.
- Build campaign queue ranked by risk with surface coverage, top pivots and last-seen time.
- Selecting an edge opens a panel showing pivot, confidence, supporting signals/evidence and confirm/reject actions.

**Backend**
- Normalize/index indicators; generate candidate pairs from exact pivots first, then bounded fuzzy candidates.
- Implement confidence from independent evidence, proposed/confirmed/rejected state, campaign membership, merge/split service.
- Calculate versioned score (identity 35%, harm 30%, exposure 20%, freshness 15%) and store feature contributions.
- Return campaign detail payload with graph nodes, edges, signals, evidence summaries and timeline.
- Use SQL joins first. Enable pgvector only when actual semantic/image similarity is needed; no graph database in MVP.

**Connect**
- Campaign page → GET /campaigns/{id} → case service → relational graph query → API mapper → React Flow nodes/edges.
- Edge decision → POST edge decision → authorization → transactional edge/campaign update plus audit row → invalidate campaign, queue and overview queries.
- UI renders exact persisted score and reasons returned by API.

**Exit gate**
- Seeded fake profile, lookalike page, app metadata and payment/phone pivot form one case with labeled edges.
- Benign near-match stays separate; analyst can reject an edge without deleting evidence or prior score history.

### Phase 5 — Analyst workflow, audit trail and response packet

**Goal:** turn detection into a complete case and safe response artifact.

**Frontend**
- Build campaign status/header, evidence timeline, analyst note, assignment/review controls, response editor and export action.
- Use explicit states: Proposed, Under Review, Confirmed, Rejected, Draft, Simulated.
- Require a reason for relevant accept/reject/benign decisions; show confirmation before high-impact state changes.
- Group response drafts by recipient type: platform, registrar/host, payment provider, customer advisory, law-enforcement packet.
- Show evidence manifest with reference/name, SHA-256, capture time, source and include checkbox.

**Backend**
- Implement transition rules, analyst decisions, audit log and timeline assembly.
- Generate editable drafts from persisted campaign fields and templates; escape imported content and preserve evidence references.
- Export Markdown/JSON first; add PDF only if time remains.
- Add simulated action endpoint that appends an event and updates metrics. No real provider API calls.
- Make writes idempotent and record actor/time/reason.

**Connect**
- Review form → decision endpoint → transaction writes decision+audit → campaign, queue and overview refresh.
- Generate draft → response service reads confirmed case/evidence → drafts and manifest returned to editor.
- Simulate → action/timeline rows persisted → dashboard metrics refresh.

**Exit gate**
- Full flow from finding to analyst decision to downloadable evidence-backed packet.
- Every status change records user/time/reason. No external action is sent.
- Export labels Draft/Simulated and carries evidence hashes/timestamps.

### Phase 6 — Product polish, safety, reliability, deployment and demo

**Goal:** present a polished product that behaves predictably at judging time.

**Frontend**
- Polish hierarchy, typography, spacing, status/risk colors, responsive queue, loading/errors and keyboard focus.
- Label synthetic data clearly; explain metrics and prototype risk scores in context.
- Preserve filters and selected case across refresh; add safe reset confirmation.
- Rehearse a three-minute click path and record backup screens/video.

**Backend and infrastructure**
- Enforce tenant scope and role checks in every service/repository query; configure strict CORS and security headers.
- Validate file type/size, private object keys and hashes; sanitize all imported text in reports.
- Add request/analysis IDs, structured logs, health checks and setup/reset instructions.
- Freeze packages; run clean migration, seed, reset and complete UI flow in the target environment.
- If cloud-hosted, use deployed Next app + container API + managed Postgres with pgvector; keep Compose as fallback. Use synthetic data only.

**Connect**
- Build/CI → containers → migrations → demo seed → readiness checks → UI walkthrough.
- Optional traces link browser request ID, FastAPI request, analysis run ID and action ID.
- Live connectors, model providers and external response actions are feature-flagged off by default.

**Exit gate**
- Clean startup/reset works; no secrets or real customer data in repository/logs.
- Full judge story works without external APIs; claims are labeled synthetic/prototype.

## 7. Trust, security and reliability requirements

- Every tenant-owned row has tenant scope; every query filters by it. Missing tenant scope is a defect.
- Do not fetch arbitrary URLs in the hackathon build. A future URL collector needs SSRF defenses, DNS/IP checks, redirect limits, timeouts and sandboxing.
- Treat imported HTML, OCR, text, usernames, APK metadata and files as hostile. Escape on display/export.
- Never execute APKs, archives or downloaded scripts. Future static parsing belongs in an isolated worker with CPU/memory/time limits.
- Keep AI keys server-side; send minimum evidence and record model/prompt version. AI can suggest or summarize, never approve or send.
- Evidence is private; serve only authorized short-lived access. Preserve original hash and provenance.
- Record actor, timestamp, reason and request ID for decisions and actions.
- Real takedown/payment/customer-warning integrations stay disabled until provider authorization, audit, human approval and rollback are engineered.
- Detector/model failures are visible but do not block the rest of the case workflow.

## 8. Integration rules and definition of a phase

1. Backend publishes request/response JSON examples before UI feature work begins.
2. OpenAPI is the contract source; regenerate TypeScript bindings after changes and review diffs.
3. Shared fixture schema is versioned. Each fixture includes expected signal types, expected campaign, and malicious/benign label.
4. A phase is complete only when its UI, API, database and demo flow connect end-to-end. Mock-only UI and unconnected endpoints do not count.
5. API errors use stable codes and request IDs. UI shows actionable text, never raw stack traces.
6. Migrations accompany model changes. Seed/reset does not depend on a developer's local state.
7. Non-demo feeds, models and external actions default off.
8. One integration owner keeps the main branch demoable and resolves API/client mismatch daily.

## 9. Final judging walkthrough

1. Open ASTRA overview and point out the synthetic-data label and active cases.
2. Open NilaPay Brand DNA and show how trusted identity is enrolled.
3. Reset/load fake support profile, lookalike page, suspicious app metadata, reused UPI and phone pivot.
4. Run analysis and expand one signal to show evidence, threshold, detector version and explanation.
5. Open graph; select reused identifier and explain edges. Point out benign near-match kept outside.
6. Confirm/reject one edge or mark a finding benign; show audit/timeline update.
7. Generate response packet; show editable drafts and evidence hashes/timestamps.
8. Simulate response and show updated timeline/metric. State that live sources and takedowns require authorized integrations.

## 10. Release checklist

- [ ] One-command local start and deterministic demo reset.
- [ ] Brand DNA flow for trusted identifiers and assets.
- [ ] Profile, web, app, phone and payment fixtures with labels.
- [ ] Evidence metadata, hashes and provenance persist.
- [ ] Versioned detectors produce evidence-linked signals.
- [ ] Campaign graph shows pivots and confidence.
- [ ] Benign near-match remains separate.
- [ ] Score contributions are visible and persisted.
- [ ] Analyst decisions and edge review create audit events.
- [ ] Editable response packet includes evidence manifest.
- [ ] Simulated action updates timeline/metrics.
- [ ] Tenant-scoped access; no live external action.
- [ ] Lockfiles frozen; fallback video/screenshots ready.

## 11. Official technology references

- [Next.js 16.4 release stream](https://nextjs.org/blog)
- [React 19.3 versions/releases](https://react.dev/versions)
- [Node.js LTS schedule](https://nodejs.org/en/about/previous-releases)
- [Python release versions](https://www.python.org/doc/versions/)
- [PostgreSQL 18 release notes](https://www.postgresql.org/docs/release/18.0/)
- [pgvector](https://github.com/pgvector/pgvector)
- [Tailwind CSS 4.3](https://tailwindcss.com/blog/tailwindcss-v4-3)
- [shadcn/ui Next.js](https://ui.shadcn.com/docs/installation/next)
- [React Flow](https://reactflow.dev/learn)
- [FastAPI full-stack template](https://github.com/fastapi/full-stack-fastapi-template)
