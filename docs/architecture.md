# ASTRA architecture

The product is a modular monolith: Next.js analyst console, FastAPI API/domain services, PostgreSQL with pgvector, and private evidence storage. The browser talks to the API; adapters normalize permitted source data; detectors emit versioned signals; the campaign linker stores evidence-backed edges; analyst mutations append decisions and audit records.

See README.md for the six-phase delivery plan. Current code implements the Phase 1 foundation only.
