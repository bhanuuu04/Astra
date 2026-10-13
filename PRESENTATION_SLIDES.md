# ASTRA — Digital Risk Protection (Social & App Monitoring)
## 5-Slide Pitch Deck Content (HacXLerate 2026 / Kampus.VC)

---

### SLIDE 1: Title & The Problem Landscape
* **Slide Title:** ASTRA — Autonomous Brand Defense & Digital Risk Protection
* **Subtitle:** Protecting Enterprises from Social Media Impersonation & Counterfeit App Stores
* **Challenge:** Digital Risk Protection – Social & App Monitoring (Kampus.VC Track)
* **Team:** [Your Team Name / Members]

#### Key Bullet Points (On-Slide):
* **The Brand Abuse Crisis:** Threat actors launch spoofed support handles, fraudulent executive profiles, and trojanized mobile applications targeting customers.
* **The Fatal Flaw of Existing Tools:**
  * **High False Positive Rate:** Flag legitimate enterprise accounts (e.g. `@novapay` or `com.novapay.official`) because detectors trigger on the brand name itself.
  * **Fabricated / Unmeasured Evidence:** Tools invent fake mismatch labels or pollute empty environments with synthetic records.
  * **Brittle Detection:** Unrelated accounts (e.g. `otherbrand_support`) get flagged as threats without true brand relevance.
* **Astra's Value Proposition:** Ground truth via verified **Brand DNA**, deterministic lookalike & forensic detectors, and **zero false positives on official assets**.

> **🎤 Speaker Notes / Bolne ke Points:**  
> *"Good morning judges. Today, enterprise brands face massive trust erosion from lookalike social profiles and fake mobile apps stealing OTPs and customer credentials. Current DRP tools fail because they flag the company's own official accounts as threats, or flood analysts with false positives like 'otherbrand_support'. ASTRA changes this by establishing cryptographically verified Brand DNA ground truth before scoring any threats."*

---

### SLIDE 2: Brand DNA & Zero-False-Positive Official Exclusion
* **Slide Title:** Establishing Ground Truth: Brand DNA & Immune Architecture
* **Tagline:** You cannot detect an impersonator until you define the legitimate identity.

#### Key Bullet Points (On-Slide):
* **Multi-Asset Brand Baseline:**
  * Canonical Domains (`domain`)
  * Official Social Media Handles (`social_handle`)
  * Official Mobile Package IDs (`mobile_app_pkg`)
  * Developer Signing Certificate SHA-256 Fingerprints (`cert_fingerprint`)
* **Multi-Proof Verification Engine:**
  * Cryptographic DNS TXT challenges (`_astra.<domain>`)
  * HTTP `<meta>` tag and `.well-known` token probes
  * Analyst manual attestation with immutable evidence logging
* **The "Zero False Positive" Guarantee:**
  * Platform-aware exact identity matching runs **first**.
  * Matches emit an auditable `official_asset_match` signal with **priority score 0.0**.
  * Official apps (`com.novapay.official`) and handles (`@novapay`) are permanently protected from false alerts.

> **🎤 Speaker Notes / Bolne ke Points:**  
> *"Our core breakthrough is the Brand DNA engine. Organizations register their official domains, social handles, mobile packages, and signing certificates. Before any detection algorithm runs, Astra performs platform-aware exact matching. If a candidate matches verified brand assets, it is instantly marked as an official asset with score 0.0. This guarantees zero false alarms on legitimate enterprise properties."*

---

### SLIDE 3: Specialized Detection: Social & Mobile App Monitoring
* **Slide Title:** Forensic Detection Engine: Social Lookalikes & Rogue App Radar
* **Tagline:** Calibrated algorithms replacing naive keyword search.

#### Key Bullet Points (On-Slide):
* **Social Media Monitoring & Look-alike Detection (+10 Bonus Points):**
  * **Character Swaps:** Damerau-Levenshtein transposition detection (e.g., `novapya`).
  * **Deceptive Suffixes:** Added risk keywords (`novapay_support`, `novapay_security`).
  * **Spacing & Delimiters:** Normalizes dots, underscores, hyphens, and zero-width spaces.
  * **Contextual Precision Guard:** Unrelated accounts like `otherbrand_support` are safely excluded from NovaPay alerts.
  * **Rate-Limit Resilience:** Differentiates HTTP `429` as coverage limits, never false alarms.
* **App Store Monitoring & Mobile Radar:**
  * **App Listing Adapter Contract:** Structured comparison of store, package ID, developer name, description, and icon reference.
  * **Measured Publisher Mismatch:** Identifies unauthorized third-party developers without inventing publisher labels.
  * **Resembling Description Parsing:** Detects fraudulent OTP / fast-loan / customer care lures.
  * **Signing Certificate Forensics:** Audits APK SHA-256 signatures against official developer certificates (`official_cert_match`).

> **🎤 Speaker Notes / Bolne ke Points:**  
> *"On Slide 3, here is our core detection engine. For social channels, we catch character swaps, spacing changes, and deceptive suffixes. Crucially, we enforce brand relevance first so that 'otherbrand_support' is never flagged as a NovaPay threat. For mobile app stores, our App Radar measures real developer mismatches, description resemblance, and audits APK SHA-256 signing certificates against official enrolled developer keys."*

---

### SLIDE 4: Truthful UX & Cross-Channel Campaign Intelligence
* **Slide Title:** Analyst Experience: Interactive Threat Graph & Takedown Dossiers
* **Tagline:** Turning disconnected sightings into actionable legal takedowns.

#### Key Bullet Points (On-Slide):
* **Truthful UI Design:**
  * Measured badges: `(Verified)`, `(Mismatch)`, `(Unverified)`.
  * Honest empty states: Clean workspaces show zero threats with import actions—no synthetic data hallucination.
  * Canonical read model: Unified risk scores across Queue, Radar, and Campaign views.
* **Interactive Campaign Correlation Graph (`@xyflow/react`):**
  * Clusters isolated phishing domains, rogue APKs, and Telegram fraud channels.
  * Correlates threats by shared infrastructure invariants (nameservers, registrar IDs, payment rails).
* **Automated Legal Takedown Dossier (`/responses`):**
  * One-click generation of formatted DMCA & registrar abuse notices.
  * Pre-configured abuse routing: Cloudflare, AWS Abuse, Namecheap, Google Play Protect.
  * Evidence secured with SHA-256 cryptographic hash chains.

> **🎤 Speaker Notes / Bolne ke Points:**  
> *"Rather than presenting threat scores as a mysterious black box, Astra shows honest, measured badges. Our interactive campaign graph links isolated sightings—showing how a Telegram scam channel, a phishing site, and a rogue Android APK share the exact same nameserver or registrar ID. With one click, analysts generate legally binding DMCA takedown dossiers with cryptographic SHA-256 hash chains routed to registrar abuse desks."*

---

### SLIDE 5: Engineering Depth, Live Status & Future Roadmap
* **Slide Title:** Production Engineering, Scalability & Roadmap
* **Tagline:** Enterprise-grade reliability built for national scale.

#### Key Bullet Points (On-Slide):
* **Technical Depth & Security Invariants:**
  * **Multi-Tenant Isolation:** Session-level cryptographic isolation; cross-tenant access returns 404.
  * **SSRF Defense:** Per-hop DNS resolution blocking loopbacks, private RFC 1918 subnets, and cloud metadata IPs.
  * **Concurrency Protection:** PostgreSQL 17 advisory locks prevent race conditions during scheduled telemetry polling.
  * **100% Automated Test Pass:** 55/55 Pytest test suite covering all challenge criteria.
* **Deployment Readiness:**
  * Containerized via Docker Compose & ready for byteXL Nimbus.
  * Live Swagger OpenAPI documentation at `/docs`.
* **Future Roadmap (Round 2 & Grand Finale):**
  * Autonomous takedown API dispatch via registrar webhooks.
  * Multi-lingual LLM bio & post semantic intent clustering.
  * Dynamic sandboxing integration for live APK payload detonation.

> **🎤 Speaker Notes / Bolne ke Points:**  
> *"Under the hood, Astra is built for production: PostgreSQL 17 with pgvector, advisory locking, per-hop SSRF protection, and 55 out of 55 passing automated tests. The prototype is containerized, fully operational, and ready for deployment on byteXL Nimbus. Moving into Round 2, we will expand from takedown drafting to automated registrar API dispatch. Thank you, and we welcome your questions!"*
