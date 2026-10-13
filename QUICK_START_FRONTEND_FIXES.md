# Quick Start: Frontend Trust Fixes
## Immediate Actions to Address P0 UI/UX Issues

**Time to First Value:** 2-3 days for critical badges  
**Full Implementation:** 10 weeks  

---

## 🚨 P0 Fixes (Do These First - Week 1)

### 1. Data Mode Badges (2 hours)

Copy this component and use it everywhere findings display:

```tsx
// Copy to: src/components/ui/DataModeBadge.tsx
export function DataModeBadge({ mode }: { mode: 'live' | 'synthetic_demo' | 'manual_upload' }) {
  const config = {
    live: { label: 'LIVE', color: 'emerald', pulse: true },
    synthetic_demo: { label: 'DEMO', color: 'amber', pulse: false },
    manual_upload: { label: 'MANUAL', color: 'blue', pulse: false },
  }[mode];

  return (
    <span className={`px-2 py-1 text-xs font-semibold uppercase rounded bg-${config.color}-500/10 text-${config.color}-400 border border-${config.color}-500/30`}>
      {config.pulse && '🟢 '}
      {config.label}
    </span>
  );
}

// Usage in finding list:
<DataModeBadge mode={finding.data_mode} />
```

### 2. Triage Status Labels (1 hour)

Replace this:
```tsx
// ❌ WRONG - Don't do this
{!finding.isBenign && <span>Active Threat</span>}
```

With this:
```tsx
// ✅ CORRECT
const STATUS_LABELS = {
  pending: 'Unreviewed',
  investigating: 'Investigating',
  confirmed_threat: 'Confirmed Threat',
  false_positive: 'False Positive',
  needs_evidence: 'Needs Evidence',
};

<span>{STATUS_LABELS[finding.triage_status]}</span>
```

### 3. Demo Data Warnings (30 minutes)

Add this below any demo data:
```tsx
{finding.data_mode === 'synthetic_demo' && (
  <div className="mt-2 p-2 rounded bg-amber-500/5 border border-amber-500/20">
    <p className="text-xs text-amber-400">
      ⚠️ Demo data for testing purposes only
    </p>
  </div>
)}
```

### 4. Persistent Actions Check (1 hour)

For App Radar scan buttons:
```tsx
// ❌ WRONG - UI-only state
const [scanned, setScanned] = useState(false);
<button onClick={() => setScanned(true)}>
  {scanned ? 'Scanned' : 'Scan'}
</button>

// ✅ CORRECT - Call backend API
async function handleScan() {
  await fetch(`/api/v1/apps/${findingId}/scan-package`, {
    method: 'POST',
    body: JSON.stringify({ scan_type: 'virustotal' })
  });
  // Then refetch app data to show actual status
}
```

---

## 📊 Backend APIs Already Working

You just need to call them from frontend:

### Findings with Data Mode
```typescript
GET /api/v1/findings
Response includes: data_mode, triage_status, triage_priority
```

### Triage Update
```typescript
PATCH /api/v1/findings/{id}/triage
Body: {
  triage_status: 'confirmed_threat' | 'false_positive' | 'investigating',
  rationale: 'Analyst explanation'
}
```

### Response Workflow
```typescript
// Full state machine already working:
POST /api/v1/responses/draft      // Create
POST /api/v1/responses/{id}/approve   // Approve
POST /api/v1/responses/{id}/dispatch  // Send
POST /api/v1/responses/{id}/resolve   // Close
```

### Connectors Health
```typescript
GET /api/v1/connectors
Response includes: status, last_successful_sync_at, error_message
```

---

## 🎯 Priority Implementation Order

### Day 1-2: Critical Trust Indicators
- [ ] Add DataModeBadge to all finding displays
- [ ] Fix triage status labels (no more "malicious" for unreviewed)
- [ ] Add demo data warnings

### Day 3-5: Response Workflow
- [ ] Add state timeline component
- [ ] Show draft/approve/dispatch/resolve states
- [ ] Hide actions for wrong states

### Week 2: Source Attribution
- [ ] Show connector name + status on findings
- [ ] Display "last sync" timestamps
- [ ] Add evidence ID references

### Week 3-4: Campaign Graph
- [ ] Install React Flow
- [ ] Render campaign nodes + edges
- [ ] Color-code by review status

### Week 5-10: Polish & Consistency
- [ ] Unified navigation
- [ ] Consistent empty states
- [ ] Loading skeletons
- [ ] Error boundaries

---

## 🧪 Quick Test Checklist

After implementing badges:
- [ ] All findings show LIVE/DEMO/MANUAL badge
- [ ] No "Active Threat" label on unreviewed items
- [ ] Demo data shows warning banner
- [ ] Scan button calls API (check network tab)
- [ ] Response workflow shows current state

---

## 📦 NPM Packages Needed

```bash
# For campaign graph visualization
npm install reactflow @xyflow/react

# For date formatting
npm install date-fns

# Icons (if not already installed)
npm install lucide-react
```

---

## 🔗 Related Documents

- **Full Implementation Plan:** `ASTRA-UI-UX-FIX-IMPLEMENTATION-PLAN.md`
- **Backend API Reference:** `DRP_IMPLEMENTATION_SUMMARY.md`
- **Original UX Review:** `ASTRA-Audience-Expansion-Implementation-Plan.md` (Section: ASTRA UI/UX Review)

---

## ⚡ TL;DR

**3 Things to Do Right Now:**

1. **Add this badge everywhere findings appear:**
   ```tsx
   <DataModeBadge mode={finding.data_mode} />
   ```

2. **Fix status labels:**
   ```tsx
   // Use finding.triage_status, not isBenign
   {finding.triage_status === 'pending' ? 'Unreviewed' : ...}
   ```

3. **Make actions call backend APIs:**
   ```tsx
   // Not: setScanned(true)
   // But: await fetch('/api/v1/apps/{id}/scan-package')
   ```

**Result:** Analysts can now trust what they see in the UI! 🎯
