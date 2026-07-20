# Phase 10 — Governance Scripts (tools/scripts/)
**Version:** 2.1 (corrected to use authoritative `tools/` directory, 2026-07-20)

---

## Current State (Verified)

`tools/` already exists in the `main` branch and is the authoritative location for development
tooling (`AGENTS.md:115-131`, `.github/copilot-instructions.md:90-106`).

A `tooling/` directory was introduced in an earlier revision of this PR but conflicts with the
established architecture. Scripts have been moved to `tools/scripts/` and renamed to comply
with the snake_case convention required by Rule 2.

---

## Phase 10 Goals

### 10.1 Add governance scripts to tools/scripts/
```
tools/scripts/
├── govctl.py                  ← governance validator (created)
├── scan_before_move.py        ← pre-flight dependency scanner (created)
├── classify_packages.py       ← package classifier (created)
└── deep_scan_repo.py          ← reality-check scanner (created, local-first)
```

### 10.2 Update classify_packages.py
The current `classify_packages.py` uses content-based heuristics derived from actual repo patterns.
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
- Add `scan_before_move.py` as a pre-merge check for PRs touching packages/services/modules
- Add pytest coverage for all `tools/scripts/*.py` scripts

### 10.4 Generator scripts
- `generate_client_sdk.py` — scaffold a TypeScript client SDK from a service's OpenAPI/config
- `generate_module_manifest.py` — scaffold a new module-manifest.yaml from template
