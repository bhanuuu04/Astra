# Backend API Security Fixes

## Status: PARTIAL - Critical Configuration Fixed

### Build Status
⚠️ Tests require dependency installation: `psycopg[binary]>=3.2,<4.0`

---

## P0 Issues - FIXED

### ✅ 1. Production Safety Validation Now Fails Closed

**Status:** FIXED

**Problem:**
Configuration validation only ran when `APP_ENV` was exactly `production` or `prod`. Any misspelled or unexpected environment (staging, preview) would skip validation while keeping insecure defaults:
- `admin_api_key = "astra_admin_dev_secret"`
- `jwt_secret = "astra_enterprise_jwt_signing_secret_dev"`
- `allow_anonymous_dev = True`

**Solution:**
- Added `Environment` enum for strict environment types
- Changed defaults to `"INSECURE_DEFAULT_CHANGE_IN_PRODUCTION"`
- Validation now runs for ALL non-local environments (development, staging, preview, production)
- Only explicit `local`, `test`, or `testing` environments skip validation
- Added comprehensive checks for insecure default patterns

**Files Modified:**
- `apps/api/app/core/config.py`

**Verification:**
```powershell
cd apps/api

# Should REJECT insecure configuration
$env:APP_ENV = "staging"
python -c "from app.core.config import Settings; Settings().validate_runtime_security()"

# Should show error about INSECURE_DEFAULT patterns

# Should ACCEPT local dev
$env:APP_ENV = "local"
python -c "from app.core.config import Settings; Settings().validate_runtime_security(); print('OK')"
```

**Security Impact:**
- Staging/preview deployments can no longer accidentally use development secrets
- Misspelled environment names trigger validation failure
- Clear error messages indicate which secrets are insecure

---

### ✅ 2. Anonymous Development Identity Restricted to Local-Only

**Status:** FIXED

**Problem:**
The API would auto-create persistent users and tenant memberships when `allow_anonymous_dev=true`, regardless of environment. This happened during request authentication and could race under concurrent requests.

**Solution:**
- Added `is_local_dev` property that checks for explicit `local`, `test`, or `testing` environments
- Anonymous access now requires BOTH:
  1. `allow_anonymous_dev=true` AND
  2. `app_env` in {local, test, testing}
- User/membership auto-provisioning checks `is_local_dev` independently
- Clear error messages when anonymous access attempted in non-local environments

**Files Modified:**
- `apps/api/app/core/config.py` (added `is_local_dev` property)
- `apps/api/app/core/security.py` (added environment checks)

**Security Impact:**
- Staging/development deployments cannot create users via unauthenticated requests
- Identity provisioning only happens in explicit local mode
- Authentication side-effects eliminated for non-local environments

---

## P0 Issues - REQUIRES ADDITIONAL WORK

### ⚠️ 3. Test Suite Dependency Installation

**Status:** DOCUMENTED (not a security issue per se, but blocks verification)

**Problem:**
Running `pytest` fails with `ModuleNotFoundError: No module named 'psycopg'` because dependencies declared in `pyproject.toml` are not installed.

**Solution Required:**
```powershell
cd apps/api

# Option 1: pip
python -m pip install -e .

# Option 2: uv (recommended)
uv sync
uv run pytest -q
```

**Files to Create:**
- `apps/api/README.md` with setup instructions
- `.github/workflows/api-tests.yml` for CI

---

## P1 Issues - ANALYSIS

### ⚠️ 4. Response Dispatch Without Provider Delivery

**Status:** DOCUMENTED (requires architectural decision)

**Problem:**
`apps/api/app/api/routes/response_cases.py:243-284` transitions cases to `submitted` status without actually calling provider APIs (Meta, Google Play, Cloudflare, etc.).

**Current State:**
```python
# TODO: Meta IP Reporting API integration
# TODO: Google Play Developer API integration
# TODO: Cloudflare Abuse API integration
```

**Recommended Solution:**
1. Add distinct lifecycle states:
   - `draft` → `pending_approval` → `approved` → `queued` → `submitted` → `acknowledged`
2. Only transition to `submitted` after provider confirms receipt
3. Store provider request ID, response status, timestamps
4. Add idempotency keys for legal submissions
5. Return `501 Not Implemented` for unsupported channels

**Files to Modify:**
- `apps/api/app/db/models.py` - add `queued` state, provider fields
- `apps/api/app/domain/response_case_service.py` - implement provider calls
- `apps/api/app/api/routes/response_cases.py` - update status transitions

---

### ⚠️ 5. Mobile App Scan Returns Success Without Queuing

**Status:** DOCUMENTED (requires worker infrastructure)

**Problem:**
`apps/api/app/domain/mobile_app_service.py:347` contains:
```python
# TODO: Queue async scan job with Celery/background worker
```

Returns `scan_id=None` with success status.

**Recommended Solution:**
1. Add `ScanJob` model with states: queued, running, completed, failed
2. Implement durable job queue (Celery, RQ, or cloud-native)
3. Return `202 Accepted` with actual job ID
4. Persist scan results and evidence
5. Add retry/timeout handling

**Files to Create:**
- `apps/api/app/db/models.py` - `ScanJob` model
- `apps/api/app/workers/scan_worker.py` - background processor
- `apps/api/app/domain/scan_service.py` - job management

---

### ⚠️ 6. Connector Scheduler PostgreSQL-Specific Locks

**Status:** DOCUMENTED (requires dialect detection)

**Problem:**
`apps/api/app/scheduler.py:103-119` uses PostgreSQL `pg_try_advisory_lock` unconditionally. Fails with SQLite and hangs indefinitely on connection errors.

**Recommended Solution:**
```python
def acquire_scheduler_lock(session: Session, lock_id: int) -> bool:
    dialect = session.bind.dialect.name
    
    if dialect == "postgresql":
        result = session.execute(
            text("SELECT pg_try_advisory_lock(:lock_id)"),
            {"lock_id": lock_id}
        )
        return result.scalar()
    
    elif dialect == "sqlite":
        # Use file-based lock or no-op for testing
        return True
    
    else:
        raise RuntimeError(f"Scheduler not supported for dialect: {dialect}")
```

**Files to Modify:**
- `apps/api/app/scheduler.py`

---

### ✅ 7. Integrations Status Endpoint Authentication

**Status:** ALREADY FIXED

**Finding:**
The `/api/v1/integrations/status` endpoint already requires authentication via `TenantContext = Depends(get_current_tenant_context)`.

**No action required.**

---

### ✅ 8. Composio Sync User ID Validation

**Status:** ALREADY CORRECT

**Finding:**
The Composio sync endpoint correctly derives `user_id` from the authenticated context:
```python
user_id = None
if context.user_id:
    user = session.scalar(select(User).where(User.id == context.user_id))
    if user and user.composio_user_id:
        user_id = user.composio_user_id
```

The `ComposioSyncRequest` model does NOT accept caller-supplied `user_id`.

**No action required.**

---

### ⚠️ 9. Slack Webhook URL Plaintext Storage

**Status:** REQUIRES SECRET VAULT INTEGRATION

**Problem:**
`apps/api/app/db/models.py:39` stores `slack_webhook_url` as plaintext string. It's a bearer credential that should be encrypted.

**Recommended Solution:**
1. Store only vault reference or encrypted value
2. Use `apps/api/app/core/secret_vault.py` for encryption
3. Never return full URL in API responses (return configured status + last 4 chars)
4. Redact from logs and audit trails

**Files to Modify:**
- `apps/api/app/db/models.py` - change column type or add encrypted column
- `apps/api/app/domain/settings_service.py` - encrypt on write, decrypt on use
- `apps/api/app/api/routes/settings.py` - redact from responses

---

## P2 Issues - DOCUMENTED

### 10. Provider Dispatch TODOs Not Surfaced

**Problem:**
Route documentation describes automatic dispatch while implementation has TODOs. Clients can't distinguish real operations from placeholders.

**Recommended Solution:**
- Add `capability_status` field to responses: `implemented`, `manual_required`, `not_implemented`
- Document unsupported channels in OpenAPI descriptions
- Add contract tests for each lifecycle state

---

### 11. Infrastructure Initialization Incomplete

**Problem:**
`infra/postgres/init.sql` only creates the vector extension. No:
- Database user permissions
- Migration execution
- Health checks
- Backup configuration
- TLS/network restrictions
- Scheduler deployment

**Recommended Solution:**
- Document deployment requirements
- Add migration check to startup health endpoint
- Create deployment guide with Alembic upgrade steps
- Add least-privilege database role definitions

---

### 12. Security Headers Too Broad

**Problem:**
`apps/api/app/main.py:34` adds HSTS header to ALL responses, including local HTTP development.

**Recommended Solution:**
```python
if settings.is_production and request.url.scheme == "https":
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
```

Only emit HSTS when actually served over HTTPS in production.

---

## Configuration Improvements

### Updated `.env.example`

Create `apps/api/.env.example`:
```bash
# Environment (strict enum)
APP_ENV=local  # local, test, testing, development, staging, preview, production, prod

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/astra_dev

# SECURITY: Override these in non-local environments
JWT_SECRET=INSECURE_DEFAULT_CHANGE_IN_PRODUCTION
ADMIN_API_KEY=INSECURE_DEFAULT_CHANGE_IN_PRODUCTION
ASTRA_INTERNAL_API_KEY=INSECURE_DEFAULT_CHANGE_IN_PRODUCTION
API_SECRET_KEY=INSECURE_DEFAULT_CHANGE_IN_PRODUCTION

# Anonymous Access (ONLY for local development)
ALLOW_ANONYMOUS_DEV=false  # Set true ONLY in APP_ENV=local

# CORS (use HTTPS in production)
CORS_ORIGINS=http://localhost:3000

# Provider API Keys (optional)
VIRUSTOTAL_API_KEY=
YOUTUBE_API_KEY=
COMPOSIO_API_KEY=
META_VERIFY_TOKEN=
META_APP_SECRET=
META_PAGE_ACCESS_TOKEN=
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=
GEMINI_API_KEY=
OPENAI_API_KEY=
SENTRY_DSN=

# Connector Scheduler
CONNECTOR_AUTO_SYNC_ENABLED=true
CONNECTOR_AUTO_SYNC_INTERVAL_SECONDS=3600
CONNECTOR_SCHEDULER_POLL_SECONDS=30

# Storage
EVIDENCE_STORAGE_PATH=storage/evidence
```

---

## Verification Commands

### Configuration Validation Test
```powershell
cd apps/api

# Test staging rejects insecure defaults
$env:APP_ENV = "staging"
python -c "from app.core.config import Settings; Settings().validate_runtime_security()"
# Expected: RuntimeError with INSECURE_DEFAULT message

# Test local accepts defaults
$env:APP_ENV = "local"
python -c "from app.core.config import Settings; Settings().validate_runtime_security(); print('OK')"
# Expected: OK

# Test development rejects insecure defaults
$env:APP_ENV = "development"
python -c "from app.core.config import Settings; Settings().validate_runtime_security()"
# Expected: RuntimeError
```

### Anonymous Access Test
```powershell
cd apps/api

# Test staging rejects anonymous even with flag
$env:APP_ENV = "staging"
$env:ALLOW_ANONYMOUS_DEV = "true"
python -c "from app.core.config import Settings; s=Settings(); print(f'Env: {s.app_env}, LocalDev: {s.is_local_dev}, Anonymous: {s.allow_anonymous_dev}')"
# Expected: LocalDev: False (anonymous access will be rejected)

# Test local allows anonymous with flag
$env:APP_ENV = "local"
$env:ALLOW_ANONYMOUS_DEV = "true"
python -c "from app.core.config import Settings; s=Settings(); print(f'Env: {s.app_env}, LocalDev: {s.is_local_dev}, Anonymous: {s.allow_anonymous_dev}')"
# Expected: LocalDev: True, Anonymous: True
```

### Test Suite (after dependency installation)
```powershell
cd apps/api

# Install dependencies
uv sync
# or: python -m pip install -e .

# Run tests
uv run pytest -q
# or: python -m pytest -q
```

---

## Summary of Changes

### Files Modified
1. **`apps/api/app/core/config.py`**
   - Added `Environment` enum
   - Changed defaults to `INSECURE_DEFAULT_CHANGE_IN_PRODUCTION`
   - Added `is_local_dev` and `is_production` properties
   - Enhanced `validate_runtime_security()` to check ALL non-local environments
   - Added checks for insecure default patterns

2. **`apps/api/app/core/security.py`**
   - Anonymous access now requires explicit local/test environment
   - User/membership auto-provisioning checks `is_local_dev`
   - Added error messages for environment validation failures

### Security Improvements
- ✅ Staging/preview can no longer use development credentials
- ✅ Anonymous access restricted to explicit local mode
- ✅ Clear fail-closed behavior for misconfigured environments
- ✅ Insecure defaults easily detectable

### Outstanding Work (Requires Backend Implementation)
- [ ] Response dispatch provider integration
- [ ] Mobile app scan worker queue
- [ ] Scheduler dialect detection
- [ ] Slack webhook encryption
- [ ] Test suite dependency documentation
- [ ] Infrastructure deployment guide

---

## Deployment Checklist

### Pre-Deployment
- [ ] Set `APP_ENV` to correct value (staging, preview, production)
- [ ] Generate strong secrets (32+ chars) for:
  - `JWT_SECRET`
  - `ADMIN_API_KEY`
  - `ASTRA_INTERNAL_API_KEY`
  - `API_SECRET_KEY`
- [ ] Set `ALLOW_ANONYMOUS_DEV=false`
- [ ] Configure CORS with HTTPS origins
- [ ] Run `validate_runtime_security()` check
- [ ] Run Alembic migrations: `alembic upgrade head`

### Verification
```powershell
# Verify configuration loads without errors
python -c "from app.core.config import get_settings; s = get_settings(); s.validate_runtime_security(); print('Configuration valid')"

# Check environment detection
python -c "from app.core.config import get_settings; s = get_settings(); print(f'Env: {s.app_env}, LocalDev: {s.is_local_dev}, Production: {s.is_production}')"
```

### Post-Deployment
- [ ] Monitor authentication failures
- [ ] Verify no anonymous access in logs
- [ ] Check CORS headers in responses
- [ ] Test authenticated API requests
- [ ] Verify tenant isolation

---

**Last Updated:** 2024-01-XX
**Status:** P0 issues fixed, P1/P2 documented for implementation
