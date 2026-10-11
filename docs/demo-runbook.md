# ASTRA — 3-Minute Judge Demo Runbook

**Goal:** Demonstrate the end-to-end Digital Risk Protection workflow from multi-surface evidence intake to cross-surface campaign clustering, human-in-the-loop analyst edge confirmation, and automated takedown response generation.

---

## ⏱️ Timeline Overview (180 Seconds)

| Time | Phase | Target Screen | Key Talking Point |
|---|---|---|---|
| **0:00 – 0:30** | Hook & Baseline | `/overview` | Fragmented alerts waste 14h of SOC time. ASTRA clusters cross-surface threats into explainable campaigns. |
| **0:30 – 0:50** | Brand DNA Ground-Truth | `/brands/[id]` | Ground-truth baseline for NilaPay (domains, handles, APK cert hash, official UPIs). Zero false positive anchor. |
| **0:50 – 1:10** | Evidence Ingestion & Benign Filter | `/sightings` | 4 malicious sightings across Instagram, Web, APK, and Telegram — plus 1 benign fan page that Brand DNA keeps separate. |
| **1:10 – 1:40** | Campaign Graph & Pivot Explainability | `/campaigns/[id]` | React Flow interactive graph. High-confidence pivots on shared UPI (`fraud-upi@axisbank`), phone, and avatar hash. |
| **1:40 – 2:10** | Analyst Review & Audit Decision | `/campaigns/[id]` | Human-in-the-loop: Click edge drawer, review confidence (1.0 on exact UPI), and confirm edge with audit log. |
| **2:10 – 2:40** | Multi-Recipient Response Dossier | `/campaigns/[id]/response` | Recipient-tailored enforcement drafts (Meta IP, GoDaddy ICANN, Google Play) bound to cryptographic SHA-256 evidence manifest. |
| **2:40 – 3:00** | Action Simulation & ROI | `/campaigns/[id]/response` | Click "Simulate Response Action" — 18-minute response turnaround vs 14-hour manual baseline. |

---

## 📋 Step-by-Step Walkthrough

### 1. Overview Screen (`/overview`)
- **Action:** Open `http://localhost:3000/overview`.
- **Show:** 
  - Top header persistent badge: `DEMO — SYNTHETIC DATA`.
  - KPI Cards: **Active Campaigns (Risk 94.0)**, **Total Sightings**, **Pivot Invariants (4 Pivots)**, **Median Response: 18 min**.
  - Recharts Visualizations: Threat Surface Distribution & Classification Breakdown.
- **Narrative:** 
  > *"When an attacker impersonates a financial brand like NilaPay, they don't use one channel. They post on Instagram, deploy a phishing site on GoDaddy, sideload a malicious APK on Telegram, and reuse a single UPI handle for money collection. ASTRA unifies these disjointed signals."*

### 2. Brand DNA Registry (`/brands`)
- **Action:** Click **Brand DNA** in the sidebar. Click into **NilaPay**.
- **Show:** 
  - Official domains (`nilapay.in`, `nilapay.app`).
  - Monitored handles (`x_twitter:nilapay_official`, `instagram:nilapay.official`).
  - Mobile app package (`in.nilapay.app`) with cert fingerprint SHA-256.
  - Official payee UPIs (`nilapay@axisbank`).
- **Narrative:** 
  > *"Before detecting threats, ASTRA establishes cryptographic ground-truth. Brand DNA prevents false positives by registering exact legitimate certificates and payment endpoints."*

### 3. Reset Demo Environment (Deterministic Seeding)
- **Action:** Click **Reset Demo (NilaPay)** in the sidebar footer.
- **Show:** Green toast confirming reset of tenant, Brand DNA, sightings, and candidate edges from `fixtures.json`.

### 4. Threat Sightings & The Benign Near-Match (`/sightings`)
- **Action:** Navigate to **Sightings Queue**.
- **Show:** 
  - Click the **Surface** filter chips (Instagram, Web, APK, Telegram).
  - Select the **Benign Fan Page** sighting (`nilapay_fans_india`).
  - Point to the green badge and ablation note:
    > *"Ablation Proof: Unofficial fan page explicitly disclaims affiliation. With Brand DNA active, ASTRA classifies it as Benign and excludes it from the malicious campaign cluster."*

### 5. Interactive Campaign Graph (`/campaigns/[id]`)
- **Action:** Navigate to **Campaigns & Graph**, click **Open Interactive Graph**.
- **Show:** 
  - React Flow graph rendering nodes: Instagram profile node, Web phishing asset, APK node with Trojan permissions, and Indicator nodes.
  - Top formula pill: `Identity: 35% | Harm: 30% | Exposure: 20% | Freshness: 15% -> Risk Score: 94.0`.
  - Click the edge between Web phishing and APK (`fraud-upi@axisbank`).
  - Drawer opens showing `Pivot Type: upi`, `Confidence: 1.0`, `Status: proposed`.
  - Click **Confirm Campaign** or **Confirm Edge**. Feedback toast shows persisted audit event.

### 6. Response Packet & Evidence Manifest (`/campaigns/[id]/response`)
- **Action:** Click **Generate Response Packet**.
- **Show:** 
  - Recipient tabs:
    - **Meta IP Operations**: Cites Trademark IN-892144 and Instagram profile URI.
    - **GoDaddy Abuse**: Cites ICANN RAA Specification 11 and eKYC harvesting.
    - **Google Play Abuse**: Cites Trojanized permissions (`READ_SMS`, `SEND_SMS`) and APK cert hash.
  - Evidence Manifest Table: SHA-256 checksums, capture timestamps, and inclusion checkboxes.
  - Click **Export Dossier (JSON)** to demonstrate forensic portability.
  - Click **Simulate Response Action**. Badge updates to `STATUS: SIMULATED` with actor stamp.

---

## 🛡️ Fallback & Recovery Checklist

| Problem | Instant Fix |
|---|---|
| Database empty or altered | Click **Reset Demo (NilaPay)** on sidebar — completes in < 1 second. |
| API not running | Run `uvicorn app.main:app --reload --port 8000` in `apps/api`. |
| Web app not running | Run `npm run dev` in `apps/web` (port 3000). |
| Judge asks: *"What if the attacker changes the domain name?"* | Answer: *"The domain changes, but the financial payee UPI and logo hash persist. ASTRA's graph pivots on invariant infrastructure, linking the new domain immediately."* |
