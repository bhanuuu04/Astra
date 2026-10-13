# ASTRA — Digital Risk Protection Platform
## Executive 5-Slide Pitch Deck Specification

---

### Slide 1: Problem Landscape & Market Need
* **Slide Header:** ASTRA — Autonomous Brand Defense & Digital Risk Protection
* **Subtitle:** Protecting Enterprise Brands from Social Media Impersonation & Counterfeit Mobile Applications
* **Challenge Track:** Digital Risk Protection – Social & App Monitoring (Kampus.VC)

#### Content:
* **The Brand Abuse Surge:** Threat actors exploit external ecosystems by creating spoofed support accounts, executive impersonators, and fraudulent mobile applications that deceive customers and steal credentials.
* **Limitations of Existing DRP Platforms:**
  * **High False Positive Rates:** Naive string matching flags an organization's own official accounts and legitimate apps.
  * **Unverified Evidence Claims:** Dashboards manufacture unmeasured mismatch flags or insert synthetic demo records into production views.
  * **Brittle Detection Rules:** Keyword matchers trigger on unrelated brand names (e.g., flagging `otherbrand_support` as a threat to NovaPay).
* **The Astra Solution:** Ground truth established via verified Brand DNA, deterministic lookalike & forensic detectors, and a mathematical guarantee of zero false positives on legitimate assets.

---

### Slide 2: Brand DNA & Official Asset Exclusion
* **Slide Header:** Establishing Ground Truth: Brand DNA & Immune Architecture
* **Tagline:** Ground-truth identity verification before threat scoring.

#### Content:
* **Multi-Asset Brand Baseline:**
  * Canonical Web Domains (`domain`)
  * Official Social Media Accounts (`social_handle`)
  * Official Mobile Application Package IDs (`mobile_app_pkg`)
  * Developer Signing Certificate SHA-256 Fingerprints (`cert_fingerprint`)
* **Multi-Proof Verification Pipeline:**
  * Cryptographic DNS TXT validation (`_astra.<domain>`)
  * HTTP `<meta>` tag and `.well-known` token probes
  * Analyst manual attestation with immutable evidence logging
* **Zero False Positive Guarantee:**
  * Platform-aware exact identity matching executes prior to impersonation scoring.
  * Matches emit an auditable `official_asset_match` signal with priority score `0.0`.
  * Verified brand assets (e.g., `com.novapay.official`, `@novapay`) are permanently protected from false alarms.

---

### Slide 3: Specialized Detection: Social & Mobile App Monitoring
* **Slide Header:** Forensic Detection Engine: Social Lookalikes & Rogue App Radar
* **Tagline:** Calibrated algorithms replacing naive keyword search.

#### Content:
* **Social Media Monitoring & Look-alike Detection (+10 Bonus Points):**
  * **Character Swaps:** Damerau-Levenshtein transposition distance (e.g., `novapya`).
  * **Deceptive Suffixes:** Suffix and prefix risk vocabulary flags (e.g., `novapay_support`, `novapay_security`).
  * **Delimiter Normalization:** Strips hyphens, underscores, dots, and zero-width spaces.
  * **Contextual Precision Guard:** Unrelated brand accounts (e.g., `otherbrand_support`) are safely excluded from NovaPay alerts.
  * **Provider Resilience:** Categorizes HTTP 429/403 responses as coverage gaps rather than threat observations.
* **App Store Monitoring & Mobile Radar:**
  * **App Listing Adapter Contract:** Structured comparison of store, package ID, developer name, description, and icon reference.
  * **Publisher Mismatch Analysis:** Identifies unauthorized third-party developers without inventing publisher labels.
  * **Resembling Description Analysis:** Identifies fraudulent OTP, loan, and customer-care lures.
  * **Signing Certificate Forensics:** Audits APK SHA-256 signatures against official developer certificates (`official_cert_match`).

---

### Slide 4: Analyst Experience & Campaign Intelligence
* **Slide Header:** Analyst Console: Interactive Threat Graph & Takedown Dossiers
* **Tagline:** Converting isolated sightings into actionable legal takedowns.

#### Content:
* **Evidence Truthfulness:**
  * Measured badges: `(Verified)`, `(Mismatch)`, `(Unverified)`.
  * Clean empty states: Zero synthetic data hallucination in clean environments.
  * Canonical read model: Unified risk scores across Queue, Radar, and Campaign views.
* **Interactive Campaign Correlation Graph (`@xyflow/react`):**
  * Clusters rogue APK downloads, phishing domains, and Telegram channels.
  * Correlates threats by shared infrastructure invariants (nameservers, registrar IDs, payment rails).
* **Automated Legal Takedown Dossier (`/responses`):**
  * One-click generation of formatted DMCA and registrar abuse notices.
  * Targeted abuse desk routing: Cloudflare, AWS Abuse, Namecheap, Google Play Protect.
  * Forensic evidence chain secured with SHA-256 cryptographic digests.

---

### Slide 5: Production Engineering, Scalability & Roadmap
* **Slide Header:** Production Architecture, Reliability & Future Roadmap
* **Tagline:** Enterprise-grade security built for national scale.

#### Content:
* **Architectural Robustness:**
  * **Multi-Tenant Isolation:** Session-level cryptographic isolation; cross-tenant access returns 404.
  * **SSRF Protection:** Per-hop DNS resolution blocking loopbacks, private RFC 1918 subnets, and cloud metadata IPs.
  * **Concurrency Protection:** PostgreSQL 17 advisory locks prevent race conditions during scheduled telemetry polling.
  * **Comprehensive Test Suite:** 55/55 automated tests passing across tenant isolation, brand verification, and detectors.
* **Deployment Readiness:**
  * Fully containerized via Docker Compose; compatible with byteXL Nimbus.
  * Interactive OpenAPI Swagger documentation available at `/docs`.
* **Future Roadmap:**
  * Autonomous registrar abuse API dispatch via webhooks.
  * Multi-lingual semantic intent clustering for social bios and posts.
  * Dynamic sandboxing integration for automated APK payload detonation.
