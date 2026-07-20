# MyCodeXvantaOS — Architecture Refactor Master Plan
**Version:** 2.0 (post-scan correction)  
**Last Updated:** 2026-07-18  
**Based on:** Deep scan of `main` branch (commit `15afba1a`)  
**Scan tool:** `tooling/scripts/deep-scan-repo.py` — see `docs/architecture/REALITY-CHECK-REPORT.md`

---

## ⚠️ v1.0 → v2.0 Key Correction

Version 1.0 of this plan was written **before** a thorough scan of the real repository. It made incorrect assumptions about directory contents. Version 2.0 is based on the actual scan results.

**Summary of corrections:**
- The three-layer pattern (modules/services/packages) **already exists** — it was not something to build
- `contracts/`, `governance/`, `infra/`, `apps/`, `release/`, `tests/` all **already exist** with content
- `packages/` has 93 dirs: **33 real libs** + **60 stubs** + **8 domain model packages**
- `services/` has 51 dirs: **26 container microservices** + **25 TypeScript service libraries**
- `modules/` has 54 dirs: **ALL YAML manifests**, zero TypeScript code
- `providers/` has 41 items: **category-organized adapters** with only 5 Cloudflare providers having package.json
- Actual top-level: **68 dirs** (not 54), **49 CI workflows** (not 42)

---

## Current Architecture (Verified Reality)

```
mycodexvantaos/                          68 top-level dirs, 49 CI workflows
│
├── modules/  (54 dirs)                  ← LAYER 1: Declarative YAML Manifests
│   └── mycodexvantaos-<name>/
│       ├── module-manifest.yaml         ← canonical contract for each capability
│       └── capabilities.yaml            ← (subset of modules)
│
├── services/  (51 dirs, 2 sub-types)    ← LAYER 2: Runtime Implementations
│   ├── [26 container services]
│   │   └── mycodexvantaos-<name>/
│   │       ├── Dockerfile
│   │       ├── .env.example
│   │       ├── config/
│   │       └── service-manifest.yaml   ← references modules/ manifest
│   └── [25 TypeScript service libs]
│       └── mycodexvantaos-service-<name>/
│           ├── package.json
│           ├── src/
│           └── CHANGELOG.md
│
├── packages/  (93 dirs, 3 sub-groups)   ← LAYER 3: Shared Libraries
│   ├── [33 real libs]  connector-*, core, event-bus, policy-engine, etc.
│   ├── [60 stubs]      index.ts placeholder interfaces (18 match services/)
│   └── [8 models]      mycodexvantaos-*-model domain packages
│
├── providers/  (41 items)               ← LAYER 4: Secondary Adapters
│   ├── <category>/<category-impl>/      ← organized by domain category
│   └── mycodexvantaos-provider-cloudflare-*/  ← 5 real pnpm packages
│
├── apps/  (6 items)                     ← Primary Adapters (user-facing)
│   ├── admin-console, web-console, cli
│   └── api-node, api-worker
│
├── contracts/  (15 items)               ← Interface contracts (already exists)
├── governance/  (26 items)              ← Governance policies (already exists)
├── infra/  (7 items)                    ← Docker, Helm, Kubernetes (already exists)
├── runtimes/  (10 items)                ← Runtime adapters (cloudflare, docker, k8s)
├── argocd/                              ← GitOps deployment (already exists)
├── release/  (13 items)                 ← Release management (already exists)
├── tests/  (10 items)                   ← Integration/governance tests (already exists)
├── docs/  (40+ items)                   ← Documentation (already exists)
├── python/  (8 items)                   ← Python AI stack (apps, packages, tests)
├── knowledge-graph/                     ← Graph data (already exists)
├── vector-store/                        ← Vector DB data (already exists)
├── migrations/  (d1, postgres, sqlite)  ← DB migrations (already exists)
└── ...                                  ← 40+ more dirs
```

---

## Refactoring Goals (Revised)

Given the reality, refactoring work falls into these categories:

### Category A: FIX existing issues (high priority)
1. **Implement 60 stub packages** — 18 that overlap with services/ should become proper client SDKs
2. **Implement 6 domain model packages** — mycodexvantaos-*-model stubs
3. **Normalize providers/** — ensure all category dirs have proper package.json if workspace-managed

### Category B: Rename/Consolidate (medium priority)
4. **providers/ → adapters/** — rename to match Hexagonal Architecture terminology (REFACTORING_PLAN.md already exists in providers/)
5. **python/ → intelligence/** — rename for clarity
6. **Consolidate data layer** — migrations/ + knowledge-graph/ + vector-store/ → data/

### Category C: New tooling (low priority)
7. **Create tooling/** — governance scripts, CI tooling, scan scripts (this directory doesn't exist)
8. **Clarify services/ Type-B** — 25 src-only service libraries: document their role relative to modules/ manifests

---

## Revised Phase Plan

| Phase | Goal | Status of Target |
|-------|------|-----------------|
| Phase 0 | Prerequisites & tooling setup | ✅ `tooling/` scripts being created |
| Phase 1 | contracts/ governance review | ✅ Already exists (15 items) — review only |
| Phase 2 | governance/ policy review | ✅ Already exists (26 items) — review only |
| Phase 3 | providers/ → adapters/ rename | ⚠️ REFACTORING_PLAN.md already in providers/ |
| Phase 4 | Fix stub packages (18 service overlaps) | 🔴 60 stubs need implementation planning |
| Phase 5 | python/ → intelligence/ rename | 🔴 intelligence/ does NOT exist |
| Phase 6 | data/ consolidation | 🔴 data/ does NOT exist |
| Phase 7 | infra/ normalization | ✅ infra/ already exists |
| Phase 8 | apps/ completion | ✅ apps/ already has 6 items |
| Phase 9 | release/ process | ✅ release/ already has 13 items |
| Phase 10 | tooling/ creation | 🔴 tooling/ does NOT exist |
| Phase 11 | tests/ expansion | ✅ tests/ already has 10 items |
| Phase 12 | docs/ standardization | ✅ docs/ already has 40+ items |

---

## Key Insight: The 3-Tier Pattern

The most important discovery from the scan:

```
modules/mycodexvantaos-core-auth/     → module-manifest.yaml (SPEC)
services/mycodexvantaos-core-auth/    → Dockerfile (CONTAINER)
packages/core-auth/                   → index.ts STUB (CLIENT SDK — not yet implemented)
```

This is the **Spec → Container → SDK** triad. The architecture already enforces it for 18 capabilities. The remaining work is:
1. Implementing the SDK stubs in `packages/`
2. Adding missing `capabilities.yaml` to remaining modules

---

## Actual Counts (Ground Truth from Scan)

| Directory | Count | Type breakdown |
|-----------|-------|----------------|
| packages/ | 93 dirs | 33 real, 60 stubs, 8 models |
| services/ | 51 dirs | 26 Dockerfile, 25 src-only |
| modules/ | 54 dirs | 54 YAML manifests, 4 also have package.json |
| providers/ | 41 items | 5 cloudflare real packages + categories |
| apps/ | 6 items | admin-console, web-console, cli, api-node, api-worker, 1 more |
| infra/ | 7 items | cloudflare, docker, docker-compose, helm, kubernetes, oci |
| runtimes/ | 10 items | cloudflare, docker, kubernetes, local, node + TS files |
| contracts/ | 15 items | already structured |
| governance/ | 26 items | already structured |
| release/ | 13 items | already structured |
| tests/ | 10 items | integration/, governance/, architecture/ |
| docs/ | 40+ items | already structured |
| Top-level total | **68 dirs** | — |
| CI workflows | **49** | — |

---

## Files

| Path | Description |
|------|-------------|
| `docs/architecture/REALITY-CHECK-REPORT.md` | **This is the source of truth** — full scan findings |
| `docs/architecture/repo-scan-report.json` | Raw JSON scan data for all dirs |
| `tooling/scripts/deep-scan-repo.py` | Script that produced the scan |
| `tooling/scripts/govctl.py` | Governance validator CLI |
| `tooling/scripts/scan-before-move.py` | Pre-flight dependency scanner |
| `tooling/scripts/classify-packages.py` | Package classifier (needs update based on scan) |
