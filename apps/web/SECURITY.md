# Security Implementation Guide

## Overview

This document describes the security measures implemented in the Astra web application and provides guidance for secure deployment and operation.

## Authentication & Authorization

### API Route Protection

All API routes except webhooks and health checks now require authentication. Authentication is verified using:

1. **Clerk Sessions** (when Clerk is configured)
2. **JWT Bearer Tokens** (backend-validated)

### Implementation

Use `resolveServerIdentity()` in all protected routes:

```typescript
import { resolveServerIdentity } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  const identity = await resolveServerIdentity(req);
  if (!identity) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  // ... protected logic
}
```

### Protected Routes

- `/api/analyze` - Threat analysis
- `/api/takedown` - Takedown dossier generation
- `/api/messages/analyze` - AI-powered message analysis
- `/api/messages/inbound/save` - Sighting ingestion
- `/api/connectors` - Connector management

### Public Routes

- `/api/health/*` - Health checks
- `/api/webhooks/*` - Webhook endpoints (signature-verified)

## Input Validation

### Schema Validation

All API routes use Zod schemas to validate input:

```typescript
import { AnalyzeMessageSchema } from '@/lib/validation';

const parseResult = AnalyzeMessageSchema.safeParse(body);
if (!parseResult.success) {
  return NextResponse.json(
    { error: 'Invalid request parameters', details: parseResult.error.issues },
    { status: 400 }
  );
}
```

### Content Sanitization

Sensitive content is redacted before:
- Storage in the database
- Transmission to external AI providers
- Display in responses

Redacted patterns:
- Email addresses
- Phone numbers
- Seed phrases / recovery words
- Private keys
- API tokens / bearer tokens
- Credit card numbers

### Length Limits

- Message content: 10,000 characters
- Usernames: 200 characters
- Display names: 200 characters
- Bios: 5,000 characters
- Extracted indicators: 50 items max, 500 chars each

## Webhook Security

### Signature Verification

All webhook endpoints verify cryptographic signatures before processing:

#### Meta/Instagram/Facebook
- Header: `X-Hub-Signature-256`
- Format: `sha256=<hex>`
- Validates hex format before comparison
- Uses timing-safe comparison

#### Twitter/X
- Header: `X-Twitter-Webhooks-Signature`
- Format: `sha256=<base64>`
- Uses HMAC-SHA256 with consumer secret

#### Telegram
- Header: `X-Telegram-Bot-Api-Secret-Token`
- Simple secret token comparison

### Signature Validation Improvements

```typescript
// Validate hex format before attempting buffer operations
if (!validateHexSignature(providedHash, 64)) {
  return NextResponse.json(
    { error: 'Invalid signature format' },
    { status: 401 }
  );
}

// Wrap comparison defensively
try {
  const providedBytes = Buffer.from(providedHash, 'hex');
  const expectedBytes = Buffer.from(expectedHash, 'hex');
  
  if (
    providedBytes.length !== expectedBytes.length ||
    !crypto.timingSafeEqual(providedBytes, expectedBytes)
  ) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }
} catch (err) {
  return NextResponse.json(
    { error: 'Signature verification failed' },
    { status: 401 }
  );
}
```

### Tenant Isolation (TODO)

Current webhook implementation:
- ✅ Validates UUID format for tenant_id and brand_id
- ⚠️ Does NOT verify webhook credential → tenant/brand mapping
- ⚠️ Does NOT load actual brand registry for the resolved brand

**Required Implementation:**
1. Map webhook credentials to tenant/brand records in the database
2. Reject requests where provided IDs don't match the mapped credential
3. Load actual brand configuration instead of using DEFAULT_BRAND_REGISTRY
4. Add replay protection using event IDs and timestamps

## External AI Integration

### Feature Flag

External AI (NVIDIA NIM) is disabled by default and must be explicitly enabled:

```bash
ENABLE_EXTERNAL_AI=true
```

### Data Protection

Before sending to external AI:
1. Content is redacted (emails, phones, credentials removed)
2. Length limits enforced (content capped at 10,000 chars, bio at 1,000)
3. 15-second timeout on AI requests
4. Algorithmic fallback if AI unavailable

### AI Output Validation

AI responses are validated with Zod schema:

```typescript
const AiVerdictSchema = z.object({
  isFakeAccount: z.boolean().default(false),
  riskScore: z.number().min(0).max(100).default(0),
  threatType: z.enum([...]).default('unknown'),
  reasoning: z.string().max(2000).default(''),
  extractedIndicators: z.array(z.string().max(500)).max(50).default([]),
  recommendedAction: z.enum([...]).default('investigate')
});
```

Invalid AI outputs are rejected and the system falls back to algorithmic analysis.

## Error Handling

### Internal Error Responses

Errors are logged server-side but external responses are sanitized:

```typescript
// ❌ BAD - leaks backend details
return NextResponse.json({
  error: 'Failed',
  diagnostic: { backendStatusCode, backendErrorDetail }
}, { status: 502 });

// ✅ GOOD - generic public error
console.error('Webhook ingestion failed:', { backendStatusCode, backendErrorDetail });
return NextResponse.json({
  error: 'Ingestion pipeline failure',
  persisted_to_db: false
}, { status: 502 });
```

### Correlation IDs (TODO)

Add correlation IDs to all requests for debugging without exposing internals.

## Connector Security

### Current State

The `/api/connectors` route is **demo-only**:
- ✅ Requires authentication
- ✅ Returns `dataMode: 'demo'` flag
- ✅ `test_connection` validates environment variables only
- ❌ `update_config` and `toggle` return 501 Not Implemented

### Required Implementation

Real connector management needs:
1. Backend storage for credentials (encrypted)
2. Secret manager integration (AWS Secrets Manager, Vault, etc.)
3. Actual provider API validation on test_connection
4. Tenant-scoped credential isolation
5. Never return secrets in GET responses
6. Audit log for credential access

## Takedown Route Security

### Current State

The `/api/takedown` route is **authentication-protected** but functionally a stub:
- ✅ Requires authentication
- ✅ Validates input schema (messageId, targetType, brandId)
- ❌ Does NOT load canonical message/brand records
- ❌ Does NOT verify tenant ownership
- ❌ Does NOT recompute analysis server-side

### Required Implementation

1. Accept only IDs, not full objects
2. Load canonical message and brand from backend
3. Verify user has permission for that message/brand
4. Recompute threat analysis server-side
5. Mark generated content as **draft**
6. Require explicit review before dispatch
7. Validate provider destination against allowlist

## Authentication Token Storage

### Current Implementation

⚠️ Tokens are stored in `localStorage` (P2 issue):

```typescript
// apps/web/src/lib/api.ts
let authToken: string | null = localStorage.getItem("astra_auth_token");
```

### Recommended Migration

Use **HttpOnly cookies**:
1. Backend sets cookies on successful auth
2. Cookies are `HttpOnly`, `Secure`, `SameSite=Strict`
3. Browser automatically includes cookies
4. XSS cannot read cookie values
5. Remove `localStorage` token storage

**Implementation:**
- Update backend to set cookies on `/api/v1/auth/login`
- Update frontend to remove token from localStorage
- Update `astraFetch()` to rely on cookies instead of Authorization header for user tokens

## Rate Limiting (TODO)

Add rate limiting to:
- `/api/analyze` - analysis operations
- `/api/messages/analyze` - AI-powered analysis
- `/api/webhooks/*` - webhook endpoints (per provider signature)

Recommended limits:
- Authenticated users: 100 req/min
- Webhooks: 1000 req/min per provider credential
- AI analysis: 10 req/min per user

## Content Security Policy (TODO)

Add CSP headers to prevent XSS:

```typescript
// middleware.ts
response.headers.set(
  'Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ..."
);
```

## Deployment Checklist

### Environment Variables

- [ ] All secrets use secure secret management (not `.env` files in production)
- [ ] `ENABLE_EXTERNAL_AI` is explicitly set based on data policy review
- [ ] `ASTRA_INTERNAL_API_KEY` is rotated and unique per environment
- [ ] Webhook secrets are provider-specific and rotated regularly

### Configuration

- [ ] HTTPS only (no HTTP in production)
- [ ] CORS configured to allow only trusted origins
- [ ] Clerk or JWT auth is configured and working
- [ ] Database connections use SSL/TLS
- [ ] Backend API uses mutual TLS or IP allowlisting

### Monitoring

- [ ] Failed auth attempts are logged and alerted
- [ ] Webhook signature failures are monitored
- [ ] Rate limit violations trigger alerts
- [ ] AI provider failures fall back gracefully

### Testing

- [ ] Unauthenticated API requests return 401
- [ ] Invalid signatures return 401
- [ ] Malformed input returns 400 with validation errors
- [ ] AI output validation rejects out-of-range values
- [ ] Content redaction removes sensitive patterns
- [ ] Error responses don't leak backend details

## Verification Commands

```powershell
# Build check
cd C:\Users\Lenovo\Desktop\Astra_Final\apps\web
npm run build

# Type check
npm run typecheck

# Dependency audit
npm audit --audit-level=high

# Lint
npm run lint
```

## Security Contact

For security issues, contact: security@astra.example.com

**Do not** open public GitHub issues for security vulnerabilities.
