# Phase 7 — infra/ Normalization
**Version:** 2.0 (post-scan correction, 2026-07-18)

---

## Current State (Verified)

`infra/` **already exists** with **7 items**: cloudflare, docker, docker-compose, helm, kubernetes, oci (plus 1 more)

`argocd/` exists as a separate top-level directory.  
`runtimes/` exists with 10 items: cloudflare, docker, kubernetes, local, node + TypeScript files.

v1.0 described infra/ as "needs to be created with runtime-mesh/ and consolidation". This was wrong.

### Actual structure (needs verification)
```bash
gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/infra?ref=main
gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/runtimes?ref=main
gh api repos/ai-software-engineering-guild/mycodexvantaos/contents/argocd?ref=main
```

### Phase 7 Goals (revised)
1. Audit infra/ (7 items), runtimes/ (10 items), argocd/ structure
2. Determine if argocd/ should live inside infra/ or remain top-level
3. Understand the relationship between runtimes/ and infra/ — why are they separate?
4. Check `packages/deployment` (STUB, deps=5) role relative to infra/
5. Normalize any inconsistencies in Helm chart or Kubernetes manifest structure

### Non-Goals
- ❌ Creating infra/ from scratch — it already exists
- ❌ Building "runtime-mesh/" from nothing — runtimes/ already exists
