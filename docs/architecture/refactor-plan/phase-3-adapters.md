# Phase 3 — providers/ → adapters/ Rename
**Version:** 2.0 (post-scan correction, 2026-07-18)

---

## Current State (Verified)

`providers/` has **41 items** organized as `providers/<category>/<category-impl>/`:

```
providers/
├── PROVIDER_MIGRATION_ANALYSIS.md   ← team already analyzed this!
├── README.md
├── REFACTORING_PLAN.md              ← team already has a plan!
├── ai-ethics/        → 3 sub-providers
├── audio/            → 2 sub-providers
├── auth/             → 5 sub-providers
├── blockchain/       → 3 sub-providers
├── cache/            → 4 sub-providers
├── database/         → 5 sub-providers (note: mixed naming: database-d1 AND db-postgres)
├── deploy/           → 3 sub-providers
├── embedding/        → 5 sub-providers
├── event-stream/     → 3 sub-providers
├── external/         → 2 sub-providers (openai, workers-ai)
├── graph/            → 3 sub-providers
├── hybrid/embedding/ → 1 sub-provider
├── image/            → 1 sub-provider
├── llm/              → 11 sub-providers
├── mycodexvantaos-provider-cloudflare-d1        ← REAL package.json + src/
├── mycodexvantaos-provider-cloudflare-kv        ← REAL package.json + src/
├── mycodexvantaos-provider-cloudflare-r2        ← REAL package.json + src/
├── mycodexvantaos-provider-cloudflare-vectorize ← REAL package.json + src/
├── mycodexvantaos-provider-cloudflare-workers-ai ← REAL package.json + src/
├── native/           → 2 sub-providers
├── notification/     → 1 sub-provider
├── observability/    → 2 sub-providers
├── quantum-circuit/quantum-circuit-native
├── quantum-observability/quantum-observability-native
├── quantum-processor/quantum-processor-native
├── quantum-runtime/quantum-runtime-native
├── quantum-simulator/quantum-simulator-qiskit
├── queue/            → 3 sub-providers
├── realtime/         → 2 sub-providers
├── repo/             → 1 sub-provider
├── scheduler/        → 1 sub-provider
├── search/           → 4 sub-providers
├── secrets/          → 3 sub-providers
├── security/         → 1 sub-provider
├── state-store/      → 1 sub-provider
├── storage/          → 7 sub-providers
├── validation/       → 1 sub-provider
└── vector-store/     → 6 sub-providers
```

**Critical discovery:** The team has **already produced** `PROVIDER_MIGRATION_ANALYSIS.md` and `REFACTORING_PLAN.md` inside `providers/`. These must be read before any renaming work begins.

**pnpm-workspace.yaml** includes `providers/*/*` — only the 5 `mycodexvantaos-provider-cloudflare-*` dirs have `package.json`. The category subdirs (`providers/llm/llm-openai` etc.) currently have no `package.json`.

---

## Hexagonal Architecture Alignment

In Hexagonal Architecture:
- `providers/` = **Secondary Adapters** (driven side)
- `apps/` = **Primary Adapters** (driving side)
- `packages/` = **Application + Domain** (inner hexagon)

The term "providers" is misleading for Secondary Adapters. Renaming to `adapters/` would align with the hexagonal pattern.

`adapters/` currently exists with only **one item** (`cloudflare/`) — this appears to be the start of the migration.

---

## Phase 3 Action Plan (Revised)

### 3.0 Read existing plan first (MANDATORY)
```bash
# Before doing ANYTHING, read the team's existing analysis:
gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/providers/PROVIDER_MIGRATION_ANALYSIS.md \
  --jq '.content' | base64 -d

gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/providers/REFACTORING_PLAN.md \
  --jq '.content' | base64 -d
```

### 3.1 Understand the two naming conventions
Currently `providers/` mixes two naming patterns:
- **Category-organized**: `providers/<category>/<category-impl>` (no package.json)
- **Flat-named**: `providers/mycodexvantaos-provider-cloudflare-*` (have package.json)

The rename to `adapters/` must handle both.

### 3.2 Add package.json to category sub-providers
For `providers/<category>/<category-impl>` dirs that need to be workspace-managed:
```bash
python3 tooling/scripts/scan-before-move.py providers/llm/llm-openai
```

### 3.3 Execute the rename (only after reading REFACTORING_PLAN.md)
```bash
# Check what's in adapters/ first
gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/adapters?ref=main

# Scan dependencies before moving
python3 tooling/scripts/scan-before-move.py providers/

# The actual rename would be a series of:
# git mv providers/<category> adapters/<category>
# (or providers/<category>/<impl> adapters/<category>/<impl>)
```

### 3.4 Update pnpm-workspace.yaml
```yaml
# Before:
packages:
  - "providers/*/*"

# After:
packages:
  - "adapters/*/*"
```

### 3.5 Update all import paths
```bash
# Find all imports referencing providers/
grep -r "from.*providers/" packages/ services/ apps/ --include="*.ts"
grep -r "providers/" .github/workflows/ --include="*.yaml"
```

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Team already has REFACTORING_PLAN.md — conflict | HIGH | Read it first, merge with this plan |
| 5 cloudflare providers already have real code | HIGH | Verify their imports/exports before moving |
| category dirs have no package.json | MEDIUM | Add package.json as needed |
| CI workflows may reference providers/ paths | MEDIUM | Run scan-before-move.py first |
| adapters/ cloudflare/ already exists — naming conflict | LOW | Check if it's the same as providers/mycodexvantaos-provider-cloudflare-* |
