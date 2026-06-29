# MyCodexVantaOS

> **Machine Identity:** `mycodexvantaos`  
> **Brand Identity:** `MyCodexVantaOS`  
> **Version:** v1.0.0  
> **Canonical URL:** https://mycodexvantaos.com  
> **Spec Authority:** FSA (L0) → Constitution (L1) → Capability Addendum (L2)

## Platform Overview

MyCodexVantaOS is an upstream software infrastructure platform purpose-built for the AI era. It vertically integrates compute, data, algorithms, agents, declarative contracts, executable governance, and outcome-based billing into a single contract-first operating system.

### Core Design Philosophy

| Principle | Description |
|---|---|
| **Contract-First** | All capabilities MUST be defined as declarative contracts before implementation |
| **Governance-Executable** | All governance rules exist in machine-verifiable form and are enforced in CI |
| **Self-Hostable** | Platform runs fully without external providers in `native` mode |

### Seven Strategic Foundations

| Foundation | Scope |
|---|---|
| **Compute Foundation** | AI chips, GPU, smart servers, inference/training pools, Kubernetes, autoscaling |
| **Data Foundation** | Datasets, pipelines, vector DB, embeddings, hybrid search, knowledge graphs |
| **Algorithm Foundation** | Model routing, BYOK gateway, fine-tuning, pre-training, evaluation, LLM/CV/NLP |
| **Agent Foundation** | AI Agent runtime, memory, tool calling, MCP, RAG, workflow DAG, long-running tasks |
| **Contract Foundation** | Declarative AI task contracts, module contracts, API, events, Schema, URN |
| **Governance Foundation** | Policy-as-code, audit chain, compliance, RBAC, zero-trust, supply chain, SBOM |
| **Business Foundation** | Usage metering, quota, billing, pricing, workspace, marketplace, enterprise |

## Identity Boundary

```
Machine Identity (SSOT):  mycodexvantaos
Brand Identity:           MyCodexVantaOS
Forbidden Prefixes:       mycodexvanta-os, codexvanta-os, codexvanta, codevantaos, kubo, axiom
```

All machine-readable identifiers MUST use `mycodexvantaos`. Human-readable documents SHOULD use `MyCodexVantaOS`.

## Repository Structure

```
mycodexvantaos/
├── docs/                    # Platform specifications and architecture docs
├── foundation/              # Seven strategic foundation specs
├── governance/              # Governance policies, audit, naming closure
├── navigation/              # Navigation maps and dependency graphs
├── contracts/               # OpenAPI, AsyncAPI, events, schemas
├── platform/                # Service catalog and topology
├── providers/               # Provider manifests (22 providers)
├── modules/                 # Module manifests (11 modules)
├── services/                # Service implementations (11 services)
├── packages/                # TypeScript packages (8 packages)
├── apps/                    # Applications (5 apps)
├── infra/                   # Infrastructure (Docker, Helm, Kubernetes)
├── policies/                # Platform policies
├── supply-chain/            # SLSA attestations, provenance
├── release/                 # Release manifests and policies
├── artifacts/               # Artifact index and digests
├── config/                  # Platform configuration
├── ci/                      # CI validation rules and reporters
├── scripts/                 # Validation and generation scripts
├── unified-gates/           # Unified Gate System (61 gates, L00-L90)
└── .github/workflows/       # 29 GitHub Actions workflows
```

## Production Domain

**Canonical URL:** `https://mycodexvantaos.com`

All frontend sites, API callbacks, OAuth redirect URIs, webhook endpoints, CORS allowlists, cookie domains, canonical URLs, OpenGraph URLs, sitemaps, robots.txt, environment variables, and deployment configurations default to `mycodexvantaos.com` as the production domain baseline.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run architecture validation
pnpm run validate:architecture

# Run all CI gates
pnpm run ci:gates

# Run tests
pnpm run test
```

## Governance

This platform is governed by the following SSOT hierarchy:

```
L0  docs/spec/l0-meta/formalized-specification-architecture.yaml
L1  docs/spec/l1-constitution/constitution.yaml
L2  docs/spec/l2-structure/capability-architecture-addendum.yaml
    governance/identity-policy.yaml
    governance/platform-governance-spec.yaml
    platform/service-catalog.yaml
```

## License

Proprietary — MyCodexVantaOS. All rights reserved.

See [LICENSE](./LICENSE) for details.
