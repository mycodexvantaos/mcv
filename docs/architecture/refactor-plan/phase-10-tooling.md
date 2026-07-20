# Phase 10 — tooling/ Creation
**Version:** 2.0 (post-scan correction, 2026-07-18)

---

## Current State (Verified)

`tooling/` does **NOT exist** in the `main` branch — this is a valid Phase 10 target.

The scripts being created in this PR (`tooling/scripts/`) are new contributions.

---

## Phase 10 Goals

### 10.1 Create tooling/ directory structure
```
tooling/
├── scripts/
│   ├── govctl.py                  ← governance validator (created)
│   ├── scan-before-move.py        ← pre-flight dependency scanner (created)
│   ├── classify-packages.py       ← package classifier (needs update based on scan)
│   └── deep-scan-repo.py          ← reality-check scanner (created)
├── generators/                    ← code generators (future)
└── README.md
```

### 10.2 Update classify-packages.py
The current `classify-packages.py` uses heuristics that don't match actual repo patterns.
Based on the scan, the correct classification logic is:

```python
# Category A: stub packages with matching service container
if pkg_name in OVERLAP_SERVICE_NAMES and is_stub:
    return "client_sdk_stub"  # needs implementation as TypeScript client

# Category B: real infrastructure libraries
elif has_real_src and deps >= 7:
    return "infrastructure_lib"

# Category C: domain model packages
elif pkg_name.startswith("mycodexvantaos-") and "-model" in pkg_name:
    return "domain_model"

# Category D: stubs with no matching service
elif is_stub:
    return "unmatched_stub"  # needs triage

# Category E: core/utility
elif pkg_name in ("core", "jsonata", "providers"):
    return "utility"
```

### 10.3 CI integration
There are **49 CI workflows** total. Phase 10 should:
- Add `govctl validate-all` to the CI pipeline
- Add `scan-before-move.py` as a pre-merge check for PRs touching packages/services/modules

### 10.4 Generator scripts
- `generate-client-sdk.py` — scaffold a TypeScript client SDK from a service's OpenAPI/config
- `generate-module-manifest.py` — scaffold a new module-manifest.yaml from template
