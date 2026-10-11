# IMP Prototype Integration & Migration Guide

## Overview
This document records how the prototype components and forensic logic previously housed in `/imp` were merged into the primary ASTRA platform architecture (`apps/web`, `apps/api`, `packages`, `infra`, and `docs`).

## Merged Assets & Target Locations

1. **Frontend Presentation & Components** (`apps/web/src/components/`):
   - Migrated 19 rich analyst views:
     - `MessageDetailView.tsx` & `ThreatInbox.tsx` (Deep forensic investigation console).
     - `OverviewDashboard.tsx` (Executive threat KPI summary).
     - `RogueAppsRadar.tsx` (Mobile app & APK radar).
     - `TakedownDossierModal.tsx` & `TakedownsPage.tsx` (Automated legal notice generation for Meta, X, Google Play, and ICANN).
     - `BrandAssetsPage.tsx` & `BrandRegistryModal.tsx` (Brand DNA management).
     - `ConnectorsManager.tsx` (Live channel & webhook credential management).
     - `ManualAnalyzerModal.tsx` (On-demand forensic sandbox).
     - `ImpersonationPage.tsx`, `DomainsPage.tsx`, `ScamLinksPage.tsx`, `AnalyticsView.tsx`, `SettingsPage.tsx`, `TeamPage.tsx`, `Sidebar.tsx`, `Navbar.tsx`.

2. **Types & Data Contracts** (`apps/web/src/types/threat.ts` & `packages/api-client/threat.ts`):
   - Defined core models: `SocialPlatform`, `ThreatSeverity`, `ThreatCategory`, `ThreatIndicator`, `ExtractedArtifact`, `ThreatAnalysis`, `SenderProfile`, `SocialMessage`, `BrandAssetRegistry`, `RogueAppListing`.

3. **Detector Logic & Rules**:
   - Frontend TypeScript Engine: `apps/web/src/lib/threat-engine.ts`.
   - Backend Python Detector Primitives: `apps/api/app/detectors/rules.py` (homoglyph normalization, Levenshtein distance, high-risk TLDs, URL shorteners, urgency triggers, crypto wallet regex extraction).

4. **Shared Seed Fixtures** (`packages/fixture-contract/fixtures.json` & `apps/api/app/seed/fixtures.json`):
   - Standardized deterministic test dataset covering:
     - Official Brand DNA baseline.
     - 4 labeled malicious threat vectors (Rogue APK update, Twitter homoglyph impersonation, Telegram Web3 drainer, LinkedIn executive BEC).
     - 1 deliberate benign near-match (`dev_sarah_cloud`) for false-positive validation.
     - 2 rogue app listings with SHA-256 signatures.

5. **API & Webhook Routes** (`apps/web/src/app/api/`):
   - Migrated route handlers for `/api/webhooks/[platform]`, `/api/analyze`, `/api/connectors`, and `/api/takedown`.

6. **Environment & Dependency Configuration**:
   - `apps/web/package.json`: Added `clsx`, `lucide-react`, and `tailwind-merge`.
   - `.env.example`: Updated with Meta, X, and Telegram webhook secrets and tokens.
