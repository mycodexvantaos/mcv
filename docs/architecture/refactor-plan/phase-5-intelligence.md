# Phase 5 — python/ → intelligence/ Rename
**Version:** 2.0 (post-scan correction, 2026-07-18)

---

## Current State (Verified — STILL VALID)

`python/` **exists** with **8 items**: apps/, packages/, pyproject.toml, tests/, uv.lock (+ 3 more)  
`intelligence/` does **NOT exist** → valid rename target ✅

This is one of the few Phase plans from v1.0 that remains valid.

---

## What python/ Contains
```bash
# Verify:
gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/python?ref=main
```

Known items:
- `apps/` — Python applications
- `packages/` — Python packages
- `pyproject.toml` — Python project config
- `tests/` — Python tests
- `uv.lock` — uv package manager lockfile (confirms this uses `uv`, not pip/poetry)

---

## Phase 5 Action Plan

### 5.1 Read PROVIDER_MIGRATION_ANALYSIS.md first (if it mentions Python)
Check if any cross-language analysis exists.

### 5.2 Pre-flight scan
```bash
python3 tooling/scripts/scan-before-move.py python/
```
Check for:
- CI workflows referencing `python/`
- Dockerfile references to `python/` paths
- Any relative imports

### 5.3 Execute rename
```bash
git mv python/ intelligence/
```

### 5.4 Update CI workflows
Search for `python/` in all 49 CI workflows:
```bash
grep -r "python/" .github/workflows/ --include="*.yaml" -l
```

### 5.5 Update pyproject.toml
If pyproject.toml has path references, update them.

---

## Risk: Low (verified target doesn't exist)
The `intelligence/` directory is confirmed to NOT exist, so there's no naming conflict.  
The main risk is CI workflow path references — run scan first.
