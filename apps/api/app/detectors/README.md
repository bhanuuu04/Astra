# Detector module

Planned detector contract: accept a normalized sighting, Brand DNA, and a versioned configuration; return zero or more evidence-linked Signal records. Detectors must not update campaign state or trigger external actions. Phase 3 implements exact identity checks first; optional model adapters remain separate from deterministic rules.
