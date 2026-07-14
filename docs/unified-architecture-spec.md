## MyCodexVantaOS — Unified Architecture Specification

> **Document ID:** MCXOS-UNIFIED-SPEC-v1.0.0  
> **Document Location:** `docs/unified-architecture-spec.md`  
> **Specification Level:** Platform Mother Specification / Architecture Constitution / CI-Executable Governance Basis  
> **Version:** 1.0.0  
> **Date:** 2026-06-29  
> **Status:** Normative  
> **Scope:** root module, service manifest, provider manifest, foundation spec, service catalog, navigation, namespace governance, unified gates, CI, audit, exception, release, supply chain  
> **Machine Identity:** `mycodexvantaos`  
> **Official Brand Identity:** `MyCodexVantaOS`  
> **Historical Brand Aliases:** `MyCodeXvantaOS`  
> **Canonical URL:** https://mycodexvantaos.com  
> **Spec Authority:** FSA (L0) → Constitution (L1) → Capability Addendum (L2)  
> **Execution Semantics:** MUST / MUST NOT / SHOULD / MAY

---

## Overview

MyCodexVantaOS is an upstream software infrastructure platform purpose-built for the AI era. It vertically integrates compute, data, algorithms, agents, declarative contracts, executable governance, and outcome-based billing into a single contract-first operating system.

## Identity Boundary

| Context                                                                                                  | Canonical Value              |
| -------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Machine Identity                                                                                         | `mycodexvantaos`             |
| Brand Identity                                                                                           | `MyCodexVantaOS`             |
| Canonical URL                                                                                            | `https://mycodexvantaos.com` |
| **Forbidden Prefixes:** `mycodexvanta-os`, `codexvanta-os`, `codexvanta`, `codevantaos`, `kubo`, `axiom` |                              |

## Specification Hierarchy

```
L0  docs/spec/l0-meta/formalized-specification-architecture.yaml
L1  docs/spec/l1-constitution/constitution.yaml
L2  docs/spec/l2-structure/capability-architecture-addendum.yaml
    governance/identity-policy.yaml
    governance/platform-governance-spec.yaml
    platform/service-catalog.yaml
```

## 1. Platform Identity

### 1.1 Canonical Machine Identity

```text
mycodexvantaos
```

### 1.2 Canonical Brand Identity

```text
MyCodexVantaOS
```

### 1.3 Historical Brand Aliases

```text
MyCodeXvantaOS
MyCodeXvanta OS
```

### 1.4 Forbidden Legacy Prefixes

```yaml
forbidden_legacy_prefixes:
  - mycodexvanta-os
  - codexvanta-os
  - codexvanta
  - codevantaos
  - KUBO
  - kubo
  - AXIOM
  - axiom
```

---

## 2. Platform Architecture

MyCodexVantaOS is a vertically integrated upstream AI infrastructure platform organized around seven strategic foundations:

| Foundation            | Responsibility                                                          |
| --------------------- | ----------------------------------------------------------------------- |
| Compute Foundation    | AI chips, GPUs, intelligent servers, inference pools, Kubernetes        |
| Data Foundation       | datasets, vector databases, embeddings, hybrid search, knowledge graphs |
| Algorithm Foundation  | model routing, BYOK, fine-tuning, evaluation, LLMs, CV, NLP             |
| Agent Foundation      | agent runtime, memory, tool calling, MCP, RAG, workflow DAGs            |
| Contract Foundation   | module contracts, APIs, events, schemas, resource kinds, URNs           |
| Governance Foundation | policy-as-code, audit chain, compliance, RBAC, CI gates                 |
| Business Foundation   | billing, metering, quota, workspace, marketplace                        |

---

## 3. Manifest Boundary

| File                         | Scope                | Required For             | Runtime Service |
| ---------------------------- | -------------------- | ------------------------ | --------------- |
| `mycodexvantaos-module.yaml` | root directory       | every root module        | optional        |
| `module-manifest.yaml`       | service module       | deployable service only  | yes             |
| `provider-manifest.yaml`     | provider instance    | provider implementation  | provider only   |
| `foundation.yaml`            | foundation spec unit | foundation subdirectory  | no              |
| `service-catalog.yaml`       | global service index | platform                 | indirect        |
| `navigation/*.yaml`          | navigation index     | AI/human navigation      | no              |
| `unified-gate-index.yaml`    | gate index           | unified gate system      | no              |

Deprecated manifest names (MUST NOT be used):

```text
mycodexvantaos.module.yaml
module.yaml
axiom.module.yaml
```

---

## 4. Foundation Directory Governance

The `foundation/` directory is the strategic specification center for seven platform foundations.

Foundation subdirectories MUST NOT contain:

- runtime source code
- service implementation
- provider implementation
- Dockerfile
- package manager lockfile
- deployment manifests

Seven foundation specification units:

```text
foundation/compute-foundation/
foundation/data-foundation/
foundation/algorithm-foundation/
foundation/agent-foundation/
foundation/contract-foundation/
foundation/governance-foundation/
foundation/business-foundation/
```

---

## 5. Canonical Root Layout

The canonical root layout MUST include:

```text
foundation/
navigation/
mycodexvantaos-namespace-governance/
unified-gates/
```

Root directory count model:

```yaml
rootDirectoryCount:
  declaredClass: 242-plus
  effectiveCanonicalMinimumCount: 245
```

---

## 6. Naming Rules

- Lowercase kebab-case for all machine-readable identifiers
- No underscores, dots (except Kubernetes API groups), spaces
- No version markers in canonical names
- No environment markers in canonical resource names
- No emoji in actual paths
- No forbidden legacy prefixes

Service ID format: `mycodexvantaos-<domain>-<capability>[-<sub-capability>...]`

---

## 7. Provider Capability Set

Canonical capabilities:

```yaml
- database, storage, auth, queue, state-store, secrets, repo, deploy
- validation, security, observability, notification, scheduler
- vector-store, embedding, llm, graph, cache, search
- quantum-runtime, quantum-simulator, quantum-processor, quantum-circuit, quantum-observability
```

Provider instance naming: `<capability>-<provider>` (capability-first, never vendor-first)

Provider directory layout: `providers/<capability>/<capability>-<provider>/provider-manifest.yaml`

Examples of correct capability-first naming:

```text
providers/vector-store/vector-store-qdrant/
providers/vector-store/vector-store-chroma/
providers/vector-store/vector-store-pinecone/
providers/vector-store/vector-store-weaviate/
providers/llm/llm-openai/
providers/embedding/embedding-openai/
```

Vendor-first naming (e.g. `qdrant-vector-store`) and orphan capability
directories that shadow a canonical capability (e.g. `providers/vector/`
shadowing `vector-store`) are FORBIDDEN and MUST be rejected by CI.

---

## 8. Runtime Modes

| Mode        | Purpose                        | Production              |
| ----------- | ------------------------------ | ----------------------- |
| `native`    | local, CI, offline             | allowed                 |
| `connected` | full external provider         | allowed                 |
| `hybrid`    | partial provider with fallback | allowed                 |
| `auto`      | startup intent only            | FORBIDDEN as final mode |

---

## 9. Hash Policy

```yaml
hash_policy:
  runtime_audit_chain: sha256
  long_term_integrity: sha3-512
  fast_ci_comparison: blake3
```

---

## Appendix A — Unified Architecture Normalization Amendment

See full normalization specification in the platform constitution.

---

## Appendix B — Consistency Remediation Amendment

See full consistency remediation specification in the platform constitution.

---

## Appendix C — Consistency Remediation Log (v1.0.1)

Remediation executed on 2026-07-01 per the Integrated Architecture Specification error analysis. All items verified by repository-wide scan.

| #   | Issue                                                 | Severity | Action Taken                                                                              | Status   |
| --- | ----------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- | -------- |
| 1   | Historical alias `MyCodeXvantaOS` in machine contexts | High     | Normalized to `MyCodexVantaOS` in all active-zone ts/js/json/yaml files                    | RESOLVED |
| 2   | Forbidden identifier `codevantaos` in design docs     | High     | Replaced with canonical `mycodexvantaos`                                                   | RESOLVED |
| 3   | Misspelled apiGroup `platform.mycodevantaos/v1`       | High     | Corrected to `platform.mycodexvantaos/v1` in contracts, application services, API routes   | RESOLVED |
| 4   | Missing `module-manifest.yaml` (3 modules)            | High     | Added manifests for agent-toolkit, ai-team-orchestrator, persona-engine                    | RESOLVED |
| 5   | Vendor-shadow capability dir `providers/vector/`      | Medium   | Migrated to `providers/vector-store/vector-store-{chroma,pinecone,weaviate}`               | RESOLVED |
| 6   | Forbidden symbols in active-zone YAML (67 files)      | Medium   | Stripped section sign, arrows, em dash, box drawing from all active-zone YAML              | RESOLVED |
| 7   | Non-prefixed service dirs without exception coverage  | Medium   | Added exception register entries for ci-repair-agent and kafka-stream-processor           | RESOLVED |

Archived zones (`project-import/`, versioned spec snapshots `mcxos-*`) retain historical content by design and are excluded from active-zone enforcement.

---

_This document is the normative source of truth for the MyCodexVantaOS platform architecture._

## Seven Strategic Foundations

| Foundation            | Scope                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| Compute Foundation    | AI chips, GPU, smart servers, inference/training pools, Kubernetes          |
| Data Foundation       | Datasets, pipelines, vector DB, embeddings, hybrid search, knowledge graphs |
| Algorithm Foundation  | Model routing, BYOK gateway, fine-tuning, evaluation, LLM/CV/NLP            |
| Agent Foundation      | AI Agent runtime, memory, tool calling, MCP, RAG, workflow DAG              |
| Contract Foundation   | Declarative AI task contracts, module contracts, API, events, Schema, URN   |
| Governance Foundation | Policy-as-code, audit chain, compliance, RBAC, zero-trust, supply chain     |
| Business Foundation   | Usage metering, quota, billing, pricing, workspace, marketplace             |

## Domain & Deployment Contract

**Production Canonical URL:** `https://mycodexvantaos.com`
All frontend sites, API callbacks, OAuth redirect URIs, webhook endpoints, CORS allowlists, cookie domains, canonical URLs, OpenGraph URLs, sitemaps, and robots.txt MUST use `mycodexvantaos.com` as the production domain baseline.

### Subdomain Strategy

| Subdomain | URL                                | Purpose               |
| --------- | ---------------------------------- | --------------------- |
| apex      | `https://mycodexvantaos.com`       | Brand / Landing / SEO |
| www       | `https://www.mycodexvantaos.com`   | 301 redirect to apex  |
| app       | `https://app.mycodexvantaos.com`   | Application Console   |
| api       | `https://api.mycodexvantaos.com`   | API / Webhooks / BFF  |
| admin     | `https://admin.mycodexvantaos.com` | Admin Console         |
| docs      | `https://docs.mycodexvantaos.com`  | Documentation         |

### Forbidden Production URLs

The following vendor-generated URLs MUST NOT be used as production canonical URLs, OAuth redirect URIs, webhook endpoints, or public API server URLs:

- `*.github.io`
- `*.pages.dev`
- `*.vercel.app`
- `*.netlify.app`
- `*.run.app`
- `*.appspot.com`
- `*.cloudfunctions.net`
- `*.web.app`
- `*.firebaseapp.com`
- `storage.googleapis.com`

## CI Governance

- **CI Rules:** 18 TypeScript validation rules
- **CI Workflows:** 29 GitHub Actions workflows
- **Gates:** 61 AI infrastructure gates (L00–L90)
- **Validation Scripts:** 16 Python scripts

## References

- [Domain & Deployment Contract](../contracts/domain-deployment-contract.md)
- [Identity Policy](../governance/identity-policy.yaml)
- [Platform Governance Spec](../governance/platform-governance-spec.yaml)
- [Service Catalog](../platform/service-catalog.yaml)
- [Unified Gates](../unified-gates/SPEC.md)
