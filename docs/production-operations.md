# ASTRA Enterprise Production Operations Runbook

## 1. Governance & NIST CSF 2.0 Alignment

ASTRA's operational program is structured around **NIST Cybersecurity Framework 2.0 (CSF 2.0)**:

| CSF 2.0 Function | ASTRA Implementation & Controls |
| :--- | :--- |
| **Govern (GV)** | Multi-tenant policy enforcement, strict RBAC (`org_admin`, `brand_manager`, `analyst`, `reviewer`, `read_only`), immutable audit logging (`audit_events`). |
| **Identify (ID)** | Monitored Brand DNA registry: official domains, certified social handles, APK package signatures, and authorized payment rails. |
| **Protect (PR)** | Cryptographic SHA-256 evidence integrity hashing, encrypted storage vault, ephemeral signed tokens, log redaction of secrets/tokens. |
| **Detect (DE)** | Versioned deterministic detectors (homoglyphs, phishing heuristics, trojanized APK markers, UPI extortion pivots), campaign clustering. |
| **Respond (RS)** | Human-in-the-loop analyst review, multi-recipient draft response packets (Meta, X, Google Play, ICANN, UPI Payment Rail), simulation before submission. |
| **Recover (RC)** | Automated PostgreSQL backups with point-in-time recovery, customer offboarding data purge, evidence vault disaster recovery drills. |

---

## 2. Environment Separation & Configuration

Staging aur Production environments strictly isolated hone chahiye:

| Control Area | Staging Environment | Production Environment |
| :--- | :--- | :--- |
| **App Environment** | `APP_ENV=staging` | `APP_ENV=production` |
| **Anonymous Dev Access** | `ALLOW_ANONYMOUS_DEV=false` | `ALLOW_ANONYMOUS_DEV=false` (Mandatory) |
| **Demo Reset Route** | Disabled unless `ALLOW_DEMO_RESET=true` | **Permanently disabled** (hardcoded 403) |
| **Database** | Isolated staging Postgres cluster | High-availability PostgreSQL with WAL replication |
| **Object Storage** | Staging bucket (`astra-staging-evidence`) | Encrypted, private KMS bucket (`astra-prod-evidence`) |
| **Secret Storage** | Staging Secret Manager | Cloud KMS / Vault with strict rotation policies |

---

## 3. Release Process & Database Migrations

> [!IMPORTANT]
> Application processes (FastAPI / Workers) startup ke waqt database migrations execute **nahi** karenge. Migrations strictly deployment pipeline ke dedicated release step mein chalenge.

### Standard Release Workflow:
1. **Pre-flight Checks:**
   ```bash
   # 1. Verify TypeScript & Next.js frontend
   cd apps/web && npx tsc --noEmit
   
   # 2. Run backend test suite & tenant isolation checks
   cd apps/api && pytest tests
   ```
2. **Release Migration Step (before spinning up new traffic):**
   ```bash
   cd apps/api
   alembic upgrade head
   ```
3. **Container Rollout:**
   * Traffic is routed to new container versions only after `/healthz` returns `200 {"status": "ready"}`.

### Migration Rollback Procedure:
Agar koi migration fail ho ya regression produce kare:
```bash
# Downgrade 1 migration step
alembic downgrade -1
```

---

## 4. Health & Observability Endpoints

| Endpoint | Purpose | SLA Check |
| :--- | :--- | :--- |
| `GET /health/live` | Process liveness probe (checks if Python process is alive) | Container orchestrator restart probe |
| `GET /health/ready` | Readiness probe (verifies database connectivity `SELECT 1`) | Traffic ingress routing probe |
| `GET /healthz` | Cloud platform readiness check (Railway, Kubernetes, AWS ECS) | Service deployment healthcheck |
| `GET /api/v1/integrations/status` | Real-time honest connector telemetry & status check | SOC integration freshness monitoring |

---

## 5. Logging Hygiene & Secrets Redaction

All API and background worker logs automatically run through [`SensitiveDataRedactor`](file:///c:/Users/Lenovo/Astra/apps/api/app/core/logging.py):
* Authorization Bearer tokens, API keys (`admin_api_key`, `virustotal_api_key`), passphrases, aur customer PII automatically sanitize hokar `[REDACTED]` mein convert ho jate hain.
* Logs mein raw customer evidence bytes ya untrusted payload dumping strictly forbidden hai; sirf metadata (`object_key`, `sha256`, `tenant_id`) log kiya jata hai.

---

## 6. Service Level Objectives (SLOs) & Metrics

1. **API Availability:** 
   * **Target:** ≥ 99.9% uptime for core API endpoints (`/brands`, `/sightings`, `/campaigns`).
2. **Connector Freshness:**
   * **Target:** Active connectors (Meta Graph, YouTube, Customer Reports) se telemetry ingestion lag < 15 minutes.
3. **Cryptographic Evidence Integrity:**
   * **Target:** 100% verification rate on evidence retrieval (zero SHA-256 mismatch tolerated).
4. **Triage-to-Draft Latency:**
   * **Target:** < 30 minutes from ingestion event to generated response draft ready for analyst sign-off.

---

## 7. Backup, Disaster Recovery & Customer Offboarding

### Automated Database Backups:
* Continuous WAL archiving + Daily full snapshots.
* 30-day retention for compliance audit trails.

### Disaster Recovery Drill (Run Monthly):
1. Provision empty PostgreSQL container.
2. Restore latest snapshot.
3. Verify table counts and tenant consistency:
   ```sql
   SELECT tenant_id, COUNT(*) FROM sightings GROUP BY tenant_id;
   ```

### Customer Offboarding / GDPR Data Purge:
Jab koi tenant contract terminate kare ya data deletion request kare:
1. Trigger tenant purge routine:
   ```python
   from app.storage.evidence_storage import purge_tenant_evidence
   purged_files = purge_tenant_evidence(tenant_id)
   ```
2. Delete database records via cascade delete on `Tenant.id`.
3. Record permanent `audit_event` documenting the offboarding action.
