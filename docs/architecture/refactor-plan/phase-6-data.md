# Phase 6 — data/ Consolidation
**Version:** 2.0 (post-scan correction, 2026-07-18)

---

## Current State (Verified — MOSTLY VALID)

Sources confirmed to exist:
- `migrations/` → subdirs: d1, postgres, sqlite ✅
- `knowledge-graph/` ✅
- `vector-store/` ✅

Target confirmed to NOT exist:
- `data/` does **NOT exist** → valid consolidation target ✅

---

## Proposed Structure
```
data/
├── migrations/
│   ├── d1/
│   ├── postgres/
│   └── sqlite/
├── knowledge-graph/
└── vector-store/
```

---

## Overlap with providers/

Note: `providers/vector-store/` contains vector store **adapter implementations**:
```
providers/vector-store/
  ├── vector-store-chroma/
  ├── vector-store-pgvector/
  ├── vector-store-pinecone/
  ├── vector-store-qdrant/
  ├── vector-store-vectorize/
  └── vector-store-weaviate/
```

And `packages/data-vector-store` (STUB) ↔ `services/mycodexvantaos-data-vector-store` (Dockerfile)

**The root `vector-store/` = actual data/schema, not adapter code.**  
**The `providers/vector-store/` = adapter implementations.**  
**These are different and should NOT be merged.**

---

## Phase 6 Action Plan

### 6.1 Verify the source directories
```bash
gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/migrations?ref=main
gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/knowledge-graph?ref=main
gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/vector-store?ref=main
```

### 6.2 Pre-flight scan
```bash
python3 tools/scripts/scan_before_move.py --source migrations/
python3 tools/scripts/scan_before_move.py --source knowledge-graph/
python3 tools/scripts/scan_before_move.py --source vector-store/
```

### 6.3 Execute consolidation
```bash
mkdir -p data/
git mv migrations/ data/migrations/
git mv knowledge-graph/ data/knowledge-graph/
git mv vector-store/ data/vector-store/
```

### 6.4 Update references
- CI workflows referencing `migrations/` paths
- Dockerfile references (especially services using these DBs)
- infra/kubernetes/ manifest paths
- Any ORM/migration tooling config

---

## Risk: Medium
- DB migration paths may be referenced in many service configs
- Run scan-before-move.py on all three source dirs
