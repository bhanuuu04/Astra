# ASTRA — System Architecture Specification

This document provides the architectural specification and Mermaid pipeline for the **ASTRA Digital Risk Protection Platform**.

---

## 1. High-Level Architecture (Mermaid)

```mermaid
flowchart TD
  subgraph Stage1 ["1. Telemetry Ingestion & Brand DNA"]
    A["Verified Brand DNA Registry\n(Official Domains, Handles, Packages, Cert Hashes)"]
    B["Social Channel Telemetry\n(X / Twitter, YouTube, Telegram)"]
    C["App Store Adapters\n(Google Play, Third-party APK Mirrors)"]
    D["Inbound Feeds & Customer Reports\n(Webhooks, API Ingestion)"]
  end

  subgraph Stage2 ["2. Normalization & Identity Gate"]
    B --> E["Normalized Observation Model\n(Surface, Identifier, Raw Payload, Timestamps)"]
    C --> E
    D --> E
    A --> F{"Exact Match with\nVerified Official Asset?"}
    E --> F
    F -->|YES: Identity Verified| G["EXCLUDED FROM THREATS\nSignal: official_asset_match\nRisk Priority: 0.0 (Zero False Positives)"]
    F -->|NO: Candidate Entity| H["CANDIDATE FOR FORENSIC ANALYSIS\nDispatched to Specialized Detectors"]
  end

  subgraph Stage3 ["3. Forensic Detection Engine"]
    H --> I["Look-alike Name Analyzer\n• Damerau-Levenshtein Transposition Swaps\n• Added Risk Suffixes (e.g., novapay_support)\n• Spacing & Delimiter Normalization\n• Benign Guard: otherbrand_support excluded"]
    H --> J["Mobile App Forensic Comparator\n• Publisher Mismatch Detection\n• Resembling Description & Phishing Lures\n• APK Signing Cert SHA-256 Audit\n  (official_cert_match == False)"]
    H --> K["Urgency & Scam Lure Classifier\n• Credential Harvesting Patterns\n• Fraudulent Customer Support Cues"]
    H --> L["Cross-Surface Campaign Linker\n• Correlates Shared Nameservers\n• Matches Registrar IDs & Payment Rails"]
  end

  subgraph Stage4 ["4. Storage & Chain of Custody"]
    G --> M[("PostgreSQL 17 + pgvector\n• Strict Multi-Tenant Row-Level Isolation\n• Session-Scoped Advisory Locks\n• State-Preserved JSON Attributes")]
    I --> M
    J --> M
    K --> M
    L --> M
    E --> N["SHA-256 Cryptographic Evidence Vault\n• Raw Payload Immutability\n• Timestamped Chain-of-Custody\n• Signed Evidence Access Tokens"]
  end

  subgraph Stage5 ["5. Next.js 16 Analyst Console & Response"]
    M --> O["Unified Canonical Read Model\n(Sightings Queue, App Radar, Campaign Graph)"]
    N --> O
    O --> P["Social Threat Queue\n• Calibrated Risk Score (0.0 - 1.0)\n• Explainable Signal Attribution"]
    O --> Q["Mobile App Radar\n• Measured Status: Verified / Mismatch / Unverified\n• Malware Status & Permission Risk"]
    O --> R["Interactive Campaign Graph\n• Clustered Attack Infrastructure\n• Powered by React Flow (@xyflow/react)"]
    O --> S["Automated Takedown Dossier\n• Formatted DMCA & Registrar Abuse Notices\n• Pre-routed to Cloudflare, Namecheap, Google Play"]
  end
```

---

## 2. Component Specification

### Stage 1: Telemetry Ingestion & Brand DNA Baseline
Ingests streaming external telemetry from supported platforms (social channels and app store sources) alongside customer-configured Brand DNA assets. Brand DNA acts as the ground-truth baseline against which all candidate observations are compared.

### Stage 2: Normalization & Identity Gate
Incoming observations are parsed into a normalized schema. Before running detection algorithms, the identity gateway executes platform-aware exact matching. Candidates matching verified brand properties receive an auditable `official_asset_match` signal with priority `0.0`, eliminating false alarms on brand-owned accounts and applications.

### Stage 3: Forensic Detection Engine
Unverified candidates undergo specialized detection:
* **Look-alike Analysis:** Evaluates character swaps, delimiter mutations, and risk suffixes while enforcing brand-presence requirements to prevent false positives on unrelated brands.
* **Mobile Forensics:** Compares developer/publisher metadata, analyzes description text for credential/OTP lures, and audits APK signing certificate SHA-256 fingerprints against official developer keys.
* **Campaign Linking:** Groups disparate observations into clustered threat campaigns based on shared infrastructure invariants (nameservers, registrar IDs, payment rails).

### Stage 4: Storage & Cryptographic Evidence Vault
Raw payloads are sealed with SHA-256 digests in an immutable evidence repository, ensuring forensic chain-of-custody for legal proceedings. Relational entities are persisted in PostgreSQL 17 with strict multi-tenant row isolation.

### Stage 5: Analyst Console & Takedown
The analyst console provides a single canonical read model across views, transparent status badges (`Verified`, `Mismatch`, `Unverified`), an interactive campaign graph, and automated takedown dossiers routed to upstream abuse desks.
