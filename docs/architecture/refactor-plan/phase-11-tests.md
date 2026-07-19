# Phase 11 — tests/ Expansion
**Version:** 2.0 (post-scan correction, 2026-07-18)

---

## Current State (Verified)

`tests/` **already exists** with **10 items** — already has integration/, governance/, architecture/ subdirs.

v1.0 described tests/ as "needs to be created". This was wrong.

Additionally, many services/ Type-B libraries have `tests/` (e.g., `services/mycodexvantaos-agent-runtime/tests/`).

### What to do next
```bash
gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/tests?ref=main
```

### Phase 11 Goals (revised)
1. Audit the 10 items in tests/ — what types of tests exist?
2. Check test coverage for the 33 real packages/ libs
3. Check test coverage for the 26 container services
4. Identify gaps: which of the 60 stub packages have no tests?
5. Ensure `govctl.py validate-all` is integrated into CI

### Non-Goals
- ❌ Creating tests/ from scratch — it already exists with 10 items
