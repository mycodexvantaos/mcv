# Phase 8 — apps/ Completion
**Version:** 2.0 (post-scan correction, 2026-07-18)

---

## Current State (Verified)

`apps/` **already exists** with **6 items**: admin-console, web-console, cli, api-node, api-worker (+ 1 more)

v1.0 described apps/ as "needs to be created". This was wrong.

`pnpm-workspace.yaml` includes `apps/*`.

### What to do next
```bash
gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/apps?ref=main
```

### Phase 8 Goals (revised)
1. Audit existing 6 apps
2. Identify which `packages/` stubs each app depends on (cross-reference the 18 client SDK stubs)
3. Check if apps/ properly uses the packages/ client SDKs vs calling services directly
4. Identify any missing apps that are described in modules/ manifests but not yet created
5. Ensure apps follow the primary adapter pattern in hexagonal architecture

### Non-Goals
- ❌ Creating apps/ from scratch — it already exists with 6 apps
