# MyCodexVantaOS — Unified Architecture Specification

> Document Location: `docs/unified-architecture-spec.md`
> Specification Level: Platform Mother Specification / Architecture Constitution / CI-Executable Governance Basis
> Scope: root module, service manifest, provider manifest, foundation spec, service catalog, navigation, namespace governance, unified gates, CI, audit, exception, release, supply chain
> Machine Identity: `mycodexvantaos`
> Official Brand Identity: `MyCodexVantaOS`
> Historical Brand Aliases: `MyCodeXvantaOS`
> Status: Normative
> Execution Semantics: MUST / MUST NOT / SHOULD / MAY

---

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

| File                         | Scope                | Runtime Service |
| ---------------------------- | -------------------- | --------------- |
| `mycodexvantaos-module.yaml` | root directory       | optional        |
| `module-manifest.yaml`       | deployable service   | yes             |
| `provider-manifest.yaml`     | provider instance    | provider only   |
| `foundation.yaml`            | foundation spec unit | no              |
| `service-catalog.yaml`       | global service index | indirect        |

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

Provider instance naming: `<capability>-<provider>`

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

_This document is the normative source of truth for the MyCodexVantaOS platform architecture._
