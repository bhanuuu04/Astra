# ASTRA implementation status

This file records capabilities present in the repository. It is not a security certification or production-readiness approval. The enterprise implementation plan describes future work; it should not be read as evidence that every phase is complete.

## Present in the codebase

- FastAPI API and Next.js console backed by PostgreSQL, SQLAlchemy, and Alembic migrations.
- Tenant-scoped brand, sighting, campaign, and response records, with object ownership checks on the principal API routes.
- Signed JWT verification and tenant membership models. Persisted membership roles are authoritative; JWT role claims cannot provision tenant access.
- Write restrictions for read-only roles on brand enrollment, sighting ingestion, analysis, and response workflows.
- Startup validation that rejects default/short JWT and admin secrets, anonymous access, and wildcard CORS origins when `APP_ENV=production`.
- Deterministic, versioned detection and risk-scoring code, campaign correlation, response draft generation, and a campaign graph UI.
- Signature checks for configured Meta, X, and Telegram webhook paths; absent required secrets fail closed.
- Development Docker Compose stack and a production-mode standalone Next.js image.
- Backend tests, TypeScript checks, and a frontend production build are configured in CI.

## Still required before production customer data

- Integrate a real identity provider and a supported login/token flow. User and tenant membership provisioning, revocation, password/MFA policy, and admin workflows are not yet a complete product feature.
- Replace local/demo defaults with managed secrets, an exact production CORS allowlist, production database credentials, backups, retention policy, and a managed evidence object store.
- Bind each webhook credential to a persisted connector, tenant, and brand. The current webhook normalization does not provide full social-profile metadata and should not be treated as broad platform monitoring.
- Implement continuous connector scheduling, retries, rate-limit handling, provider cursors, connector health, and source-permission records.
- Implement actual mobile package acquisition and analysis (manifest/certificate inspection, binary scanning, and sandboxing). Current app detection is not a full APK scanner.
- Add durable asynchronous analysis jobs and idempotent ingestion. Analysis currently runs in the API request lifecycle, and repeated source events need stronger deduplication guarantees.
- Improve campaign split/recompute behavior and validate graph links against their original endpoint/evidence records.
- Make response drafts strictly evidence-derived, keep approval separate from simulation, and require human review before any external action. Drafts are not platform submissions.
- Add database constraints/RLS for cross-tenant relationships, audit/retention controls, load testing, backup/restore exercises, and a production deployment drill.

## Local run

`docker compose up --build` starts the development stack. Compose enables the anonymous local demo path and uses development database credentials. This profile is for local use only. A production deployment must set `APP_ENV=production`, disable `ALLOW_ANONYMOUS_DEV`, configure unique secrets of at least 32 characters, and set exact allowed origins; the API intentionally refuses unsafe production configuration.

## Verification

CI runs the backend test suite, TypeScript compile check, and Next.js production build. Local verification results should be recorded with the commit and CI run that produced them; this document does not claim that the platform has passed a customer pilot or an independent security review.
