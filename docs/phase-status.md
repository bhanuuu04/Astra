# ASTRA implementation status

This file records capabilities present in the repository. It is updated transparently as platform milestones are verified and committed.

## Present in the codebase

### 1. Platform Foundation & Multi-Tenant Architecture
- FastAPI API and Next.js console backed by PostgreSQL, SQLAlchemy, and Alembic migrations.
- Tenant-scoped brand, sighting, finding, campaign, and response records with object ownership enforcement and OWASP BOLA prevention across all API endpoints.
- Role-Based Access Control (RBAC): `org_admin`, `brand_manager`, `analyst`, `reviewer`, and `read_only`.
- Startup validation that enforces fail-closed security when `APP_ENV=production` (rejects weak/default secrets, rejects wildcard CORS, disables anonymous access).

### 2. P0: Self-Service Authentication, Tenant Provisioning & Persistent Settings (Commit `64e1114`)
- **Self-Service Onboarding:** `POST /api/v1/auth/register` provisions User, Organization/Tenant, and grants `org_admin` role in one transaction.
- **Secure Authentication:** PBKDF2-HMAC-SHA256 password hashing with 100,000 iterations and cryptographically random salt. `POST /api/v1/auth/login` verifies hash and returns signed HMAC-SHA256 JWT access tokens.
- **Persistent Platform Settings:** `TenantSettings` database model and `/api/v1/settings` endpoints persisting sensitivity thresholds, auto-quarantine flags, and encrypted Slack/email notification webhooks.
- **Dynamic Frontend Session Management:** `AppShell` with authenticated user profile, organization name, role badges, and graceful demo/production session handling.

### 3. P1: Brand Trust & DNA Verification Wizard (Commit `2d98b9c`)
- **Domain DNS TXT Challenge:** `POST /api/v1/brands/{brand_id}/assets/{asset_id}/dns-challenge` issues challenge token `_astra.<domain>` (`astra-verification=<uuid>`).
- **Live DNS Query Probe:** `POST /api/v1/brands/{brand_id}/assets/{asset_id}/verify-dns` resolves DNS TXT records in real-time, transitioning state from `pending_challenge` to `verified`.
- **Mobile App Radar Trust:** Registry enrollment and brand detail cards for Android package IDs and official developer signing certificate fingerprints (SHA-256).
- **Truthful Status Lifecycle:** Assets reflect honest state badges (`Verified`, `Pending DNS Probe`, `Unverified`). Analyst manual attestation requires a documented justification reason stored in audit logs.

### 4. P2: Cryptographic Secret Vault, Connector Health & Ingestion Pipeline (Commit `335651a`)
- **Authenticated Cryptographic Secret Vault:** `apps/api/app/core/secret_vault.py` provides Fernet symmetric authenticated encryption (AES-128-CBC + HMAC-SHA256). Credentials stored in `auth_config_vault_ref` with tamper detection. Secrets are masked in logs and never exposed in responses.
- **Provider Health Checks:** Real credential checks are implemented for VirusTotal, Meta Graph, YouTube, Telegram, and Google Play Android Publisher access. Mock tokens and generic connector types are not reported as healthy.
- **On-Demand Ingestion:** YouTube uses public `search.list`; Telegram reads only updates delivered to the authorized bot; Google Play reads recent reviews for enrolled apps the developer account can access; VirusTotal enriches analyst-submitted URLs. These are source-limited reads, not broad continuous monitoring.
- **Evidence Vault:** Provider responses ingested as findings are stored with SHA-256 evidence digests. Live sync does not fabricate findings; unsupported providers return an explicit error.
- **Console Connectors Manager:** Interactive configure modal, credential vaulting, health checks, and analyst-triggered sync. There is no background poller.

---

## Still required before enterprise production scale

- Integrate enterprise SSO (SAML 2.0 / OIDC) and hardware MFA (WebAuthn/FIDO2) for enterprise IAM federation.
- Automated continuous cron/daemon scheduler for periodic connector polling without manual triggers.
- Authorized Meta/Instagram webhook ingestion scoped to the configured tenant, and public-catalog app discovery beyond developer-owned Play apps.
- Link connector `Finding` records into the campaign graph and support evidence-based cross-surface correlation.
- Cloud object store provider bindings (AWS S3 / GCS buckets) for multi-terabyte evidence archiving alongside the local durable storage vault.
- Automated submission and bilateral tracking APIs with platform trust & safety portals (Meta IP Reporting API, Google Play Protect notices).

---

## Verification status

- The prior baseline recorded 43 backend tests and a clean TypeScript check before the current live-connector and response-workflow changes.
- The current working-tree changes have not been run through the test suite or frontend type check.
- CI configuration exists, but a successful run for these changes is not recorded here.
