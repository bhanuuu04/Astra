# Security Deployment Checklist

## Pre-Deployment Security Review

### ✅ Code Changes Verified
- [x] All changes build successfully (`npm run build`)
- [x] TypeScript type checking passes (`npx tsc --noEmit`)
- [x] All P0 security issues fixed
- [x] All P1 security issues fixed or mitigated

### ✅ Authentication & Authorization
- [x] All sensitive API routes require authentication
- [x] Middleware properly protects `/api/*` routes
- [x] Webhook routes use signature verification
- [x] No arbitrary bearer tokens accepted from clients

### ✅ Input Validation
- [x] Zod schemas validate all API inputs
- [x] Content length limits enforced
- [x] PII redaction implemented
- [x] Webhook signature format validated

### ✅ External Services
- [x] External AI disabled by default (`ENABLE_EXTERNAL_AI=false`)
- [x] AI output validated with schemas
- [x] Content redacted before external transmission
- [x] Timeouts configured (15s)

### ✅ Error Handling
- [x] No backend diagnostics exposed to external callers
- [x] Detailed errors logged server-side only
- [x] Generic error messages returned to clients

### ⚠️ Known Limitations
- [ ] Webhook tenant/brand mapping requires backend implementation
- [ ] Takedown route is authentication-protected stub only
- [ ] Connector persistence requires backend implementation
- [ ] Auth tokens still in localStorage (P2 - requires architectural change)

---

## Environment Configuration

### Required Environment Variables

#### Production Backend
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.production.example.com
API_BASE_URL=https://api.production.example.com

# Internal API Authentication (CRITICAL - rotate per environment)
ASTRA_INTERNAL_API_KEY=<strong-random-key>
ADMIN_API_KEY=<strong-random-key>
```

#### Authentication (Optional - Clerk)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-publishable-key>
CLERK_SECRET_KEY=<clerk-secret-key>
```

#### External AI (Optional - Disabled by Default)
```bash
ENABLE_EXTERNAL_AI=false  # Set to true only after data policy review
NVIDIA_NIM_API_KEY=<nvidia-api-key>
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_NIM_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b
```

#### Webhook Secrets (CRITICAL - must match provider configuration)
```bash
# Meta/Instagram/Facebook
META_APP_SECRET=<meta-app-secret>
META_VERIFY_TOKEN=<meta-verify-token>
META_PAGE_ACCESS_TOKEN=<meta-page-token>

# Twitter/X
X_CONSUMER_SECRET=<x-consumer-secret>
X_CONSUMER_KEY=<x-consumer-key>
X_BEARER_TOKEN=<x-bearer-token>

# Telegram
TELEGRAM_WEBHOOK_SECRET=<telegram-webhook-secret>
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
```

### Secret Management

**❌ DO NOT:**
- Commit secrets to version control
- Use `.env` files in production
- Share secrets via email/Slack
- Reuse secrets across environments

**✅ DO:**
- Use platform secret management (Vercel, AWS Secrets Manager, Vault)
- Rotate secrets regularly (quarterly minimum)
- Use unique secrets per environment
- Audit secret access

---

## Dependency Security

### Current Audit Status
⚠️ **7 vulnerabilities detected** (4 low, 2 moderate, 1 high)

**Affected Package:** `composio-core@0.5.39`
- Indirect dependencies: `tmp`, `uuid`, `inquirer`, `external-editor`
- Vulnerabilities: Path traversal, buffer bounds check

**Mitigation Options:**

1. **Accept Risk** (if composio-core not used in production):
   ```powershell
   # Document accepted risk
   echo "composio-core vulnerabilities accepted - not used in production paths" > AUDIT_EXCEPTIONS.txt
   ```

2. **Update Dependencies**:
   ```powershell
   npm audit fix --force
   # Warning: This is a breaking change to composio-core
   ```

3. **Remove Package** (if not needed):
   ```powershell
   npm uninstall composio-core
   ```

### Ongoing Monitoring
```powershell
# Run weekly
npm audit --audit-level=moderate

# Check for outdated packages
npm outdated
```

---

## Pre-Production Testing

### 1. Authentication Tests

**Test unauthenticated access (should return 401):**
```powershell
# Analyze endpoint
curl.exe -i -X POST https://app.production.example.com/api/analyze `
  -H "Content-Type: application/json" `
  --data '{"content":"test","sender":{"platform":"instagram","username":"test"}}'

# Expected: HTTP/1.1 401 Unauthorized

# Connectors endpoint
curl.exe -i https://app.production.example.com/api/connectors

# Expected: HTTP/1.1 401 Unauthorized

# Messages save endpoint
curl.exe -i -X POST https://app.production.example.com/api/messages/inbound/save `
  -H "Content-Type: application/json" `
  --data '{"platform":"instagram","content":"test","sender":{"username":"test"}}'

# Expected: HTTP/1.1 401 Unauthorized
```

### 2. Webhook Signature Tests

**Test malformed signature (should return 401, not 500):**
```powershell
curl.exe -i -X POST https://app.production.example.com/api/webhooks/facebook `
  -H "Content-Type: application/json" `
  -H "X-Hub-Signature-256: sha256=INVALIDHEXSTRING!!!!" `
  --data '{}'

# Expected: HTTP/1.1 401 Unauthorized
```

**Test missing signature:**
```powershell
curl.exe -i -X POST https://app.production.example.com/api/webhooks/facebook `
  -H "Content-Type: application/json" `
  --data '{}'

# Expected: HTTP/1.1 401 Unauthorized
```

### 3. Content Redaction Tests

**Test with PII (should be redacted in logs):**
```powershell
# Start monitoring logs, then send:
curl.exe -X POST https://app.production.example.com/api/analyze `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <valid-token>" `
  --data '{"content":"Contact me at user@example.com or call 555-123-4567","sender":{"platform":"instagram","username":"test"}}'

# Verify logs show [EMAIL_REDACTED] and [PHONE_REDACTED]
```

### 4. Demo Mode Labeling

**Verify all endpoints return data_mode:**
```powershell
curl.exe https://app.production.example.com/api/connectors `
  -H "Authorization: Bearer <valid-token>"

# Expected response includes: "dataMode": "demo"
```

---

## Deployment Steps

### 1. Pre-Deployment
```powershell
# Clean install
rm -rf node_modules package-lock.json
npm install

# Verify build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Audit
npm audit --audit-level=high
```

### 2. Environment Setup
- [ ] All environment variables configured in deployment platform
- [ ] Secrets stored in secret manager (not environment variables)
- [ ] HTTPS enforced (no HTTP)
- [ ] CORS configured for trusted origins only

### 3. Deploy
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Monitor logs for authentication failures
- [ ] Verify webhook signature validation
- [ ] Check demo mode flags

### 4. Post-Deployment
- [ ] Monitor failed authentication attempts
- [ ] Check for signature validation errors
- [ ] Verify no backend diagnostic leakage in logs
- [ ] Test one production webhook event
- [ ] Document any issues

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Authentication Failures**
   - Alert threshold: >10/minute
   - Possible attack or misconfiguration

2. **Webhook Signature Failures**
   - Alert threshold: >5/minute per provider
   - Possible replay attack or secret mismatch

3. **AI Provider Failures**
   - Alert threshold: >50% failure rate
   - Graceful degradation to algorithmic analysis

4. **Rate Limit Violations** (when implemented)
   - Track per-user and per-IP
   - Alert on sustained high volume

### Log Patterns to Watch

**Normal:**
```
✓ Webhook verified and ingested (platform=instagram, severity=low)
✓ User authenticated (identity=user-123)
✓ AI analysis completed (riskScore=15, mode=algorithmic_fallback)
```

**Suspicious:**
```
⚠ Webhook signature validation failed (platform=telegram, attempts=15)
⚠ Authentication failed (ip=203.0.113.5, attempts=50)
⚠ Malformed signature detected (platform=facebook, hex_validation_failed)
```

---

## Rollback Plan

### If Critical Security Issue Detected

1. **Immediate Actions:**
   ```powershell
   # Disable affected routes via feature flag
   # OR revert to previous version
   vercel rollback <previous-deployment-url>
   ```

2. **Investigate:**
   - Check logs for exploitation attempts
   - Review audit trail
   - Assess data exposure

3. **Communicate:**
   - Notify security team
   - Document timeline
   - Prepare incident report

---

## Security Contacts

- **Security Team:** security@astra.example.com
- **On-Call:** oncall@astra.example.com
- **PagerDuty:** [PagerDuty Integration]

**For security vulnerabilities:**
- Do NOT open public GitHub issues
- Email security@astra.example.com with:
  - Description of issue
  - Steps to reproduce
  - Potential impact
  - Suggested fix (if any)

---

## Compliance Notes

### Data Processing
- External AI disabled by default
- PII redaction implemented
- User consent mechanism TBD

### Data Retention
- Webhook events persisted to backend
- Logs retained per policy (default 90 days)
- PII minimization in logs

### Audit Trail
- Authentication events logged
- Webhook events logged
- Admin actions logged (when implemented)

---

## Next Security Milestones

### Short Term (1-2 weeks)
- [ ] Implement rate limiting
- [ ] Add integration tests
- [ ] Deploy to staging
- [ ] Security penetration testing

### Medium Term (1-2 months)
- [ ] HttpOnly cookie migration
- [ ] Webhook tenant/brand mapping
- [ ] Takedown route backend implementation
- [ ] Connector persistence backend

### Long Term (3+ months)
- [ ] SOC 2 compliance review
- [ ] External security audit
- [ ] Bug bounty program
- [ ] Security training for team

---

**Last Updated:** 2024-01-XX
**Reviewed By:** Security Team
**Next Review:** 2024-02-XX
