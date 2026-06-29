# MyCodexVantaOS — Unified Architecture Specification

> **Document ID:** MCXOS-UNIFIED-SPEC-v1.0.0  
> **Version:** 1.0.0  
> **Date:** 2026-06-29  
> **Status:** Normative  
> **Machine Identity:** `mycodexvantaos`  
> **Brand Identity:** `MyCodexVantaOS`  
> **Canonical URL:** https://mycodexvantaos.com  
> **Spec Authority:** FSA (L0) → Constitution (L1) → Capability Addendum (L2)

## Overview

MyCodexVantaOS is an upstream software infrastructure platform purpose-built for the AI era. It vertically integrates compute, data, algorithms, agents, declarative contracts, executable governance, and outcome-based billing into a single contract-first operating system.

## Identity Boundary

| Context | Canonical Value |
|---|---|
| Machine Identity | `mycodexvantaos` |
| Brand Identity | `MyCodexVantaOS` |
| Canonical URL | `https://mycodexvantaos.com` |

**Forbidden Prefixes:** `mycodexvanta-os`, `codexvanta-os`, `codexvanta`, `codevantaos`, `kubo`, `axiom`

## Specification Hierarchy

```
L0  docs/spec/l0-meta/formalized-specification-architecture.yaml
L1  docs/spec/l1-constitution/constitution.yaml
L2  docs/spec/l2-structure/capability-architecture-addendum.yaml
    governance/identity-policy.yaml
    governance/platform-governance-spec.yaml
    platform/service-catalog.yaml
```

## Seven Strategic Foundations

| Foundation | Scope |
|---|---|
| Compute Foundation | AI chips, GPU, smart servers, inference/training pools, Kubernetes |
| Data Foundation | Datasets, pipelines, vector DB, embeddings, hybrid search, knowledge graphs |
| Algorithm Foundation | Model routing, BYOK gateway, fine-tuning, evaluation, LLM/CV/NLP |
| Agent Foundation | AI Agent runtime, memory, tool calling, MCP, RAG, workflow DAG |
| Contract Foundation | Declarative AI task contracts, module contracts, API, events, Schema, URN |
| Governance Foundation | Policy-as-code, audit chain, compliance, RBAC, zero-trust, supply chain |
| Business Foundation | Usage metering, quota, billing, pricing, workspace, marketplace |

## Domain & Deployment Contract

**Production Canonical URL:** `https://mycodexvantaos.com`

All frontend sites, API callbacks, OAuth redirect URIs, webhook endpoints, CORS allowlists, cookie domains, canonical URLs, OpenGraph URLs, sitemaps, and robots.txt MUST use `mycodexvantaos.com` as the production domain baseline.

### Subdomain Strategy

| Subdomain | URL | Purpose |
|---|---|---|
| apex | `https://mycodexvantaos.com` | Brand / Landing / SEO |
| www | `https://www.mycodexvantaos.com` | 301 redirect to apex |
| app | `https://app.mycodexvantaos.com` | Application Console |
| api | `https://api.mycodexvantaos.com` | API / Webhooks / BFF |
| admin | `https://admin.mycodexvantaos.com` | Admin Console |
| docs | `https://docs.mycodexvantaos.com` | Documentation |

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

## Runtime Modes

| Mode | Description |
|---|---|
| `native` | Fully self-hosted, no external providers required |
| `connected` | Cloud-connected with external provider integrations |
| `hybrid` | Mix of native and connected providers |

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
