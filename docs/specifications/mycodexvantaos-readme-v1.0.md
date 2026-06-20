<div align="center">

# MyCodexVantaOS

**AI-Native Agent Operating System**

_Upstream AI Infrastructure · Compute–Data–Algorithm Integration · Contract-First · Governance-Enforced_

[![Platform Constitution CI](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/platform-constitution-ci.yml/badge.svg)](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/platform-constitution-ci.yml)
[![CodeQL](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/codeql.yml/badge.svg)](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/codeql.yml)
[![Release Candidate Check](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/release-candidate-check.yml/badge.svg)](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/release-candidate-check.yml)
[![Governance Check](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/governance-check.yml/badge.svg)](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/governance-check.yml)

</div>

---

## One-Sentence Positioning

**MyCodexVantaOS is a vertically integrated upstream AI infrastructure platform for the AI era, unifying compute, data, algorithms, agents, declarative contracts, governance, and outcome-based commercialization into one contract-first operating system.**

中文定位：

> **MyCodexVantaOS 是一個專為 AI 時代設計的上游軟體基礎設施平台，垂直整合算力、數據、算法、Agent、聲明式合約、治理與任務結果計費能力。**

---

## What We Are Building

MyCodexVantaOS is not a single SaaS application, not a chatbot wrapper, and not a cloud-only deployment template.

It is an **AI-native upstream infrastructure software platform** designed to provide the foundational operating layer for AI workloads:

- **Compute Foundation** — AI chips, GPUs, intelligent servers, inference pools, training pools, AI compute centers, Kubernetes, autoscaling, and workload scheduling.
- **Data Foundation** — datasets, data pipelines, vector databases, embeddings, hybrid search, knowledge graphs, data governance, and RAG-ready knowledge assets.
- **Algorithm Foundation** — model routing, BYOK gateway, fine-tuning, pretraining, evaluation, multimodal learning, LLMs, CV, NLP, and AI development frameworks.
- **Agent Foundation** — AI Agent runtime, memory, tool calling, MCP, RAG execution, workflow DAGs, long-running tasks, batch jobs, and ChatOps.
- **Contract Foundation** — declarative AI task contracts, module contracts, APIs, events, schemas, resource kinds, URNs, and machine-readable governance.
- **Governance Foundation** — policy-as-code, audit chain, compliance, risk, RBAC, zero-trust, observability, supply chain, SBOM, provenance, and CI gates.
- **Business Foundation** — usage metering, quota, billing, pricing, workspace, marketplace, developer portal, enterprise packaging, and outcome-based AI billing.

The platform is built around four principles:

```text
local-first
cloud-agnostic
contract-first
governance-enforced
```

External providers are integration adapters. They must not become the semantic foundation of the platform.

---

## Five-Minute Understanding

### 1. Problem

AI infrastructure is fragmented:

- compute is separated from data;
- data is separated from model execution;
- model usage is separated from billing;
- agent runtime is separated from governance;
- governance is often documentation-only;
- cloud providers create lock-in;
- AI workload costs are difficult to attribute to concrete outcomes.

MyCodexVantaOS solves this by turning AI infrastructure into a **declarative, auditable, contract-driven platform**.

### 2. Platform Thesis

The platform must first be able to run by itself, then optionally connect to external providers.

```text
native provider first
  ↓
external provider adapter
  ↓
hybrid runtime fallback
  ↓
governed deployment
  ↓
auditable outcome
```

Third-party providers such as Cloudflare, OpenAI, PostgreSQL, Redis, MinIO, Qdrant, RabbitMQ, and Kubernetes are treated as **adapters**, not as the semantic foundation of the platform.

### 3. Business Model

MyCodexVantaOS is designed to support AI workload commercialization:

- per inference;
- per embedding;
- per vector query;
- per GPU-hour;
- per training-hour;
- per fine-tuning job;
- per agent run;
- per tool call;
- per successful AI task result;
- per enterprise workspace;
- per marketplace transaction.

This enables:

```text
ai task → resource usage → metering event → billing model → invoice / quota / plan
```

---

## Platform DNA

```text
Compute
  AI chips · GPU · intelligent servers · AI compute centers · inference pools · training pools

Data
  datasets · vector database · embeddings · hybrid search · knowledge graph · data governance

Algorithm
  model routing · BYOK · fine-tuning · evaluation · LLM · CV · NLP · multimodal AI

Agent
  agent runtime · memory · tool calling · MCP · RAG · workflow DAG · long task execution

Contract
  module contract · service manifest · OpenAPI · AsyncAPI · CloudEvents · JSON Schema · URN

Governance
  policy · audit · compliance · RBAC · risk · zero-trust · SBOM · provenance · CI gates

Business
  metering · quota · pricing · billing · marketplace · workspace · developer portal
```

---

## Architecture Overview

MyCodexVantaOS follows a **nine-layer hexagonal architecture** with strict dependency direction from inner to outer layers.

```text
┌──────────────────────────────────────────────────────────┐
│ I. Apps Layer                                            │
│ api-node · api-worker · web-console · admin-console · cli │
├──────────────────────────────────────────────────────────┤
│ H. Runtimes Layer                                        │
│ Cloudflare · Node.js · Docker · Kubernetes · Local        │
├──────────────────────────────────────────────────────────┤
│ G. Governance Layer                                      │
│ Policy Engine · Audit Chain · Usage Metering · SLO       │
├──────────────────────────────────────────────────────────┤
│ F. Release & Supply Chain Layer                          │
│ Artifact Digests · SBOM · Provenance · Signing · Gates   │
├──────────────────────────────────────────────────────────┤
│ E. Infrastructure Layer                                  │
│ Helm · Docker Compose · Migrations · Contracts · GitOps  │
├──────────────────────────────────────────────────────────┤
│ D. Adapters Layer                                        │
│ Cloudflare · PostgreSQL · Redis · MinIO · OpenAI · Qdrant│
├──────────────────────────────────────────────────────────┤
│ C. Application Layer                                     │
│ identity · workspace · knowledge · agent · model · usage │
├──────────────────────────────────────────────────────────┤
│ B. Ports Layer                                           │
│ database · storage · queue · auth · model · vector       │
├──────────────────────────────────────────────────────────┤
│ A. Core Layer                                            │
│ resource model · policy model · audit model · knowledge  │
└──────────────────────────────────────────────────────────┘
```

Dependency direction:

```text
core → ports → application → adapters → infrastructure
```

Governance, release, and supply chain are cross-cutting. Runtime and apps compose the stack but must not pollute the core.

---

## Root Architecture Model

MyCodexVantaOS uses an extreme flat monorepo modeled as an **AI-native distributed capability registry**.

Every top-level directory is treated as a potential independently declared micro-module.

Current root directory policy:

```text
root directory count class: 242-plus
effective canonical minimum: 245
```

The current canonical additions are:

```text
navigation/
mycodexvantaos-namespace-governance/
unified-gates/
```

These directories extend the baseline root capability registry rather than replacing it.

---

## Navigation, Namespace Governance, and Unified Gates

### navigation/

`navigation/` manages global indexes required by both AI agents and human operators.

It owns:

```text
directory index
module index
dependency graph
binding index
service navigation map
AI retrieval entrypoints
human orientation map
```

### mycodexvantaos-namespace-governance/

`mycodexvantaos-namespace-governance/` owns namespace governance closure.

It manages:

```text
namespace naming rules
governance code validation
lifecycle registry
repository naming validation
dependency binding policies
governance closure proof
```

### unified-gates/

`unified-gates/` owns the full gate system.

It includes two planes:

```text
quality-gate-plane
  lifecycle, execution, coverage, governance, monitoring, waiver, SLO, cost

ai-infra-gate-plane
  compute, data, algorithm, workload, billing, cloud infrastructure, attestation closure
```

---

## Dual-Plane Architecture

MyCodexVantaOS operates through two cooperating planes.

### TypeScript Control Plane

Responsible for:

- service catalog;
- resource model;
- policy enforcement;
- provider resolution;
- runtime mode resolution;
- audit chain;
- API routing;
- usage metering;
- governance validation.

### Python Intelligence Plane

Responsible for:

- knowledge ingestion;
- vector processing;
- embedding workflows;
- agent orchestration;
- evaluation pipelines;
- memory and dream processing;
- AI task execution workers.

All cross-plane communication must pass through contracts, schemas, events, or ports.

---

## Foundation Model

The `foundation/` directory is the strategic specification center for the platform.

It is **not** a container for implementation code.

It defines the seven platform foundations:

```text
foundation/
├── compute-foundation/
├── data-foundation/
├── algorithm-foundation/
├── agent-foundation/
├── contract-foundation/
├── governance-foundation/
└── business-foundation/
```

Each foundation subdirectory is a **specification unit**, not an independent root module.

Actual implementation remains in flat root modules such as:

```text
compute/
data/
vector/
model/
agent-runtime-platform/
billing/
security/
contracts/
schemas/
infra/
services/
providers/
```

Foundation relationship:

```text
foundation/<foundation>/foundation.yaml
  ↓
foundation/<foundation>/module-map.yaml
  ↓
platform/service-catalog.yaml
  ↓
modules/<service-id>/module-manifest.yaml
  ↓
services/<service-id>/
```

---

## Contract-First Model

Every major platform capability must be declared before it is implemented.

### Contract Sources

| Contract Type        | Location                                                   | Purpose                                       |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| Root module contract | `<root>/mycodexvantaos-module.yaml`                        | Declares root directory identity and boundary |
| Service manifest     | `modules/<service-id>/module-manifest.yaml`                | Declares deployable service contract          |
| Provider manifest    | `providers/<capability>/<provider>/provider-manifest.yaml` | Declares provider implementation              |
| Foundation spec      | `foundation/<name>-foundation/foundation.yaml`             | Declares strategic foundation boundary        |
| API contract         | `contracts/openapi/` or `api/`                             | Declares REST APIs                            |
| Event contract       | `contracts/events/` or `events/`                           | Declares CloudEvents / AsyncAPI events        |
| Schema contract      | `schemas/` or `contracts/schemas/`                         | Declares JSON Schema validation               |
| Policy contract      | `policies/`, `rego/`, `kyverno/`, `gatekeeper/`            | Declares machine-enforceable governance       |

### Rule

```text
if there is no contract, there is no implementation
```

---

## AI Task Model

AI work must be modeled as a first-class task resource.

An AI task is not just a function call. It is a governed workload with:

- identity;
- input contract;
- output contract;
- runtime mode;
- provider requirements;
- state machine;
- audit events;
- usage metering;
- billing attribution;
- failure policy;
- retry policy;
- governance policy.

Standard lifecycle:

```text
pending → scheduled → running → succeeded
                        └────→ failed
                        └────→ cancelled
                        └────→ fallback-used
```

Related directories:

```text
ai-task/
workflow/
scheduler/
jobs/
orchestrator/
events/
billing-model/
metrics/
slo/
audit/
```

---

## Outcome-Based Billing Loop

MyCodexVantaOS is designed for result-aware AI workload billing.

```text
ai task submitted
  ↓
provider selected
  ↓
task executed
  ↓
result produced
  ↓
usage event emitted
  ↓
metering pipeline records usage
  ↓
billing model calculates charge
  ↓
quota / invoice / plan updated
  ↓
audit evidence generated
```

Billable primitives include:

- inference token;
- model call;
- embedding token;
- vector query;
- dataset GB-month;
- GPU-hour;
- training job hour;
- fine-tuning job;
- agent run;
- tool call;
- workflow execution;
- successful AI task result.

Related directories:

```text
billing/
billing-model/
usage/
events/
metrics/
slo/
marketplace/
workspace/
enterprise/
```

---

## Runtime Modes

MyCodexVantaOS supports multiple runtime modes.

| Mode        | Purpose                                                   |
| ----------- | --------------------------------------------------------- |
| `native`    | Local, CI, offline, disaster recovery                     |
| `connected` | Full external provider integration                        |
| `hybrid`    | Partial provider availability with fallback               |
| `auto`      | Startup intent only, not allowed as final production mode |

Production must explicitly set:

```text
MYCODEXVANTAOS_RUNTIME_MODE
MYCODEXVANTAOS_SECRETS_PROVIDER
MYCODEXVANTAOS_DEPLOYMENT_TARGET
```

Production must not rely on `auto` as final runtime mode.

---

## Provider Abstraction

External systems must be accessed through provider contracts.

Canonical provider capabilities include:

```text
database
storage
auth
queue
state-store
secrets
repo
deploy
validation
security
observability
notification
scheduler
vector-store
embedding
llm
graph
cache
search
quantum-runtime
quantum-simulator
quantum-processor
quantum-circuit
quantum-observability
```

Provider instance naming:

```text
<capability>-<provider>
```

Valid examples:

```text
database-postgres
database-d1
storage-r2
storage-minio
auth-jwt
queue-rabbitmq
vector-store-pgvector
llm-openai
llm-workers-ai
```

Invalid examples:

```text
postgres-database
openai-llm
database_postgres
redis-cache-prod
```

---

## Service Categories

The platform organizes productized services into canonical categories.

| Category   | Purpose                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| Knowledge  | document ingestion, vector search, knowledge trace, knowledge repair    |
| Agent      | agent chat, agent router, agent memory, tool calling                    |
| Workspace  | multi-tenant enterprise collaboration                                   |
| Developer  | SDK, CLI, developer portal, API playground                              |
| Security   | identity, auth, RBAC, MFA, token rotation                               |
| Storage    | object storage, lifecycle policies, backup                              |
| Model      | BYOK, model endpoint, model routing, fine-tuning, evaluation            |
| Automation | scheduler, background jobs, event router, workflow automation           |
| Quantum    | quantum runtime, simulator, quantum processor, quantum-classical bridge |

---

## Repository Navigation by Capability

The repository intentionally uses many flat root directories. Do not treat the tree as a traditional nested application.

Use `navigation/` and the following capability map instead.

### Compute Layer

```text
compute/
cloud/
infrastructure/
infra/
kubernetes/
helm/
kustomize/
docker/
docker-templates/
manifests/
deployment/
network/
scaling/
performance/
ansible/
wrangler/
```

Purpose:

> AI chip abstraction, GPU scheduling, intelligent servers, compute centers, deployment runtime, Kubernetes, GitOps, autoscaling, and hosted infrastructure.

### Data Layer

```text
data/
dataset/
vector/
vector-database/
vector-index/
vector-store/
vectors/
search-indexes/
knowledge-graph/
kb/
imports/
original/
extracted/
sync/
prisma/
migration/
```

Purpose:

> datasets, ingestion, labeling, data governance, vector database, embeddings, hybrid search, knowledge graph, and RAG-ready knowledge assets.

### Algorithm Layer

```text
model/
model-endpoint/
model-training/
pretraining/
ai-ml/
evals/
large-language-models/
diffusion-models/
computer-vision/
natural-language-processing/
multimodal-learning/
generative-adversarial-networks/
self-supervised-learning/
meta-learning/
analytical-ai/
embodied-ai/
artificial-general-intelligence/
ai-generated-content/
spectral/
transcendent/
intelligence/
intelligent/
cross-framework/
advanced/
advanced-engineering/
```

Purpose:

> model gateway, model routing, BYOK, fine-tuning, training, evaluation, LLMs, CV, NLP, multimodal learning, diffusion, and AI algorithm frameworks.

### Agent Layer

```text
agents/
agent-hooks/
agent-runtime-platform/
adk/
memory/
rag/
prompts/
workflow/
ai-task/
mcp-servers/
orchestrator/
scheduler/
jobs/
automation/
chatops/
interaction/
bridges/
traits-matrix/
exec/
```

Purpose:

> agent runtime, memory, tool calling, MCP, RAG, workflow DAG, long-running tasks, batch jobs, ChatOps, and governed autonomy.

### Contract Layer

```text
contracts/
schemas/
api/
events/
meta/
canonical/
canon/
metadata/
registry/
namespaces/
resources/
capabilities/
graph/
layers/
state/
base/
mapping/
index/
rsd/
decision/
foundation/
navigation/
mycodexvantaos-namespace-governance/
unified-gates/
```

Purpose:

> module contracts, service manifests, API contracts, event contracts, JSON Schemas, URNs, resource kinds, root policies, AI/human navigation, namespace governance, gate governance, and machine-readable governance.

### Governance Layer

```text
policies/
rego/
kyverno/
gatekeeper/
conftest/
compliance/
regulatory/
security/
secrets/
trust/
risk/
observability/
monitoring/
metrics/
prometheus/
grafana/
logging/
alerting/
alerts/
drift-detection/
slo/
supply-chain/
sbom/
ci/
ci-cd/
validators/
gate/
rbac/
release/
promotion/
artifacts/
watchdog/
playbooks/
runbooks/
troubleshooting/
reports/
tests/
.github/
.github-private/
.config/
.devcontainer/
.idx/
.vscode/
```

Purpose:

> policy-as-code, audit, compliance, RBAC, security, zero-trust, observability, release gates, SBOM, provenance, and CI enforcement.

### Business Layer

```text
billing/
billing-model/
marketplace/
workspace/
developer/
sdk/
web/
admin/
dashboard/
gateway/
apps/
applications/
services/
backend/
client/
api-client/
enterprise/
enterprise-capabilities/
eco/
platform/
org-implementation/
catalog/
public/
assets/
imgs/
render/
docs/
onboarding/
support/
auxiliary/
intro/
```

Purpose:

> billing, usage metering, quota, workspace, marketplace, developer platform, enterprise packaging, user interfaces, and commercial operations.

---

## Naming Rules

Canonical identifiers must follow:

- lowercase only;
- kebab-case;
- `-` as the only semantic separator;
- no `_`;
- no semantic `.`;
- no spaces;
- no version suffix in canonical names;
- no environment marker in canonical resource names;
- no emoji in actual paths;
- no legacy prefix.

Machine identity:

```text
mycodexvantaos
```

NPM scope:

```text
@mycodexvantaos
```

URN namespace:

```text
urn:mycodexvantaos
```

Internal URI scheme:

```text
mycodexvantaos://
```

Deprecated module contract names:

```text
mycodexvantaos.module.yaml
module.yaml
axiom.module.yaml
```

Required root module contract name:

```text
mycodexvantaos-module.yaml
```

---

## Environment Marker Policy

Environment markers are forbidden in canonical resource names.

Forbidden:

```text
mycodexvantaos-auth-service-dev
mycodexvantaos-auth-service-staging
mycodexvantaos-auth-service-prod
vector-gateway-production
redis-cache-prod
```

Deployment overlay paths may contain environment selectors.

Allowed:

```text
deploy/kustomize/overlays/dev/
deploy/kustomize/overlays/staging/
deploy/kustomize/overlays/prod/
deploy/kustomize/overlays/production/
deploy/kustomize/overlays/local/
```

Rule:

```text
resource name must not contain environment marker
deployment overlay path may contain environment marker
```

---

## Service Identity

Canonical service ID format:

```text
mycodexvantaos-<domain>-<capability>[-<sub-capability>]
```

Example:

```text
mycodexvantaos-ai-embedding
```

Derived identities:

| Resource         | Derived Value                                                     |
| ---------------- | ----------------------------------------------------------------- |
| Service Path     | `services/mycodexvantaos-ai-embedding/`                           |
| Module Path      | `modules/mycodexvantaos-ai-embedding/`                            |
| Manifest Path    | `modules/mycodexvantaos-ai-embedding/module-manifest.yaml`        |
| Package Short ID | `ai-embedding`                                                    |
| Package Name     | `@mycodexvantaos/ai-embedding`                                    |
| K8s Name         | `mycodexvantaos-ai-embedding`                                     |
| OCI Image        | `ghcr.io/mycodexvantaos/mycodexvantaos-ai-embedding`              |
| Internal URI     | `mycodexvantaos://platform/service/mycodexvantaos-ai-embedding`   |
| URN              | `urn:mycodexvantaos:manifest:service:mycodexvantaos-ai-embedding` |

---

## Development Stack

| Area                 | Technology                                                |
| -------------------- | --------------------------------------------------------- |
| Control Plane        | TypeScript, Node.js 22                                    |
| Intelligence Plane   | Python 3.11+                                              |
| Web Console          | Next.js, React, Tailwind CSS                              |
| Runtime Edge Adapter | Cloudflare Workers / Pages                                |
| Portable Runtime     | Node.js, Docker                                           |
| Self-Hosted Runtime  | Kubernetes, Helm, ArgoCD                                  |
| Database             | D1, PostgreSQL                                            |
| Cache                | KV, Redis                                                 |
| Object Storage       | R2, MinIO                                                 |
| Vector Store         | Vectorize, pgvector, Qdrant                               |
| Queue                | Cloudflare Queues, RabbitMQ                               |
| AI Providers         | Workers AI, OpenAI, OpenRouter, native providers          |
| Governance           | JSON Schema, OPA/Rego, Kyverno, Gatekeeper, CI validators |
| Supply Chain         | SBOM, SLSA provenance, in-toto, signing policy            |

Note:

```text
Cloudflare is a preferred edge adapter, not the semantic foundation.
The platform remains local-first and cloud-agnostic.
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- Python 3.11+
- Docker and Docker Compose
- Cloudflare account for edge-adapter deployment
- Kubernetes and Helm for self-hosted deployment

### Install

```bash
git clone https://github.com/mycodexvantaos/mycodexvantaos.git
cd mycodexvantaos

corepack enable
pnpm install --frozen-lockfile
```

### Local Web Development

```bash
pnpm dev
```

Default URL:

```text
http://localhost:9002
```

### Local Platform API

```bash
pnpm api:start
```

Health check:

```bash
curl http://localhost:9100/v1/health
curl http://localhost:9100/v1/version
curl http://localhost:9100/v1/runtime
```

### Docker Compose

```bash
docker compose -f infra/docker-compose/docker-compose.local.yaml up -d
```

### Kubernetes

```bash
helm install mycodexvantaos infra/helm/mycodexvantaos/ \
  --namespace mycodexvantaos --create-namespace
```

---

## Governance Commands

```bash
pnpm governance:check
pnpm contracts:validate
pnpm schemas:validate
pnpm service-catalog:check
pnpm resource-model:check
pnpm policy:check
pnpm events:check
```

### Architecture Validation

```bash
pnpm tsx ci/validate-architecture.ts --check naming
pnpm tsx ci/validate-architecture.ts --check manifests
pnpm tsx ci/validate-architecture.ts --check providers
pnpm tsx ci/validate-architecture.ts --check topology
pnpm tsx ci/validate-architecture.ts --check drift
```

### Foundation Validation

```bash
python3 scripts/validate-foundation-structure.py --root foundation
```

### Navigation, Namespace Governance, and Gates

```bash
pnpm navigation:check
pnpm namespace-governance:check
pnpm unified-gates:check
pnpm coverage-gates:check
pnpm ai-infra-gates:check
```

### Release and Supply Chain

```bash
pnpm rc:verify
pnpm rc:soak
pnpm release:promotion:evaluate
pnpm generate-release-manifest
pnpm release:artifacts
pnpm release:sbom
pnpm release:provenance
```

---

## AI-Assisted Development Instructions

This repository is optimized for AI-assisted development. Any AI agent, coding assistant, or autonomous development tool working in this repository must follow these rules.

### 1. Understand the Platform First

You are working on an upstream AI infrastructure platform, not a generic web application.

Always reason through:

```text
compute → data → algorithm → agent → contract → governance → business
```

### 2. Contract First

Before implementing any new API, event, service, provider, AI task, billing event, or deployment behavior:

1. Check the relevant contract directory.
2. If no contract exists, create or update the contract first.
3. Validate the contract.
4. Only then implement runtime code.

Relevant locations:

```text
contracts/
schemas/
api/
events/
ai-task/
billing-model/
modules/<service-id>/module-manifest.yaml
providers/<capability>/<provider>/provider-manifest.yaml
```

### 3. Task-Driven AI Workloads

Any AI computation must be represented as an `ai-task` resource.

Required properties:

- task identity;
- input schema;
- output schema;
- lifecycle state;
- provider requirements;
- audit events;
- metering event;
- billing attribution;
- retry and fallback policy.

Do not implement untracked AI computation.

### 4. Billing Awareness

Any measurable AI operation must emit a standard usage or billing event.

Examples:

- inference;
- embedding;
- vector query;
- fine-tuning;
- training;
- agent run;
- tool call;
- workflow execution.

Check:

```text
billing/
billing-model/
events/
usage/
metrics/
slo/
```

### 5. Respect Directory Boundaries

Do not mix concerns.

- `application/` contains business use cases.
- `ports/` contains interfaces.
- `adapters/` contains provider implementations.
- `infra/` contains deployment definitions.
- `contracts/` contains contracts.
- `foundation/` contains strategic specifications only.
- `navigation/` contains global indexes for AI and human navigation.
- `mycodexvantaos-namespace-governance/` contains namespace governance closure.
- `unified-gates/` contains quality gates and AI infrastructure gates.
- `policies/`, `rego/`, `kyverno/`, `gatekeeper/` contain governance rules.
- `services/` contains service implementations.
- `modules/` contains service manifests.

Cross-boundary dependencies must go through ports, providers, contracts, manifests, or navigation indexes.

### 6. Vector-Native Data Access

For knowledge and semantic workloads:

- prefer vector retrieval for semantic matching;
- use relational storage for metadata, ownership, audit, and governance;
- use knowledge graph for entity and relation traversal;
- emit traceable retrieval receipts.

Relevant locations:

```text
vector/
vector-store/
vector-index/
search-indexes/
knowledge-graph/
kb/
rag/
```

### 7. Provider Isolation

Do not import external provider SDKs into core packages.

Forbidden:

```text
packages/core/ imports cloud SDK
packages/ports/ imports provider implementation
application/ directly imports OpenAI, Cloudflare, Redis, PostgreSQL SDK
```

Required:

```text
application → ports → adapters/providers
```

### 8. Governance Is Executable

Governance rules are not comments. They must be machine-checkable.

If adding a new rule, also update one or more of:

```text
governance/
ci/rules/
schemas/
policies/
rego/
conftest/
.github/workflows/
navigation/
mycodexvantaos-namespace-governance/
unified-gates/
```

### 9. No Silent Fallback

Any fallback behavior must:

- be declared;
- be policy-allowed;
- emit an audit event;
- be visible in runtime health;
- be reflected in service status.

### 10. Update Maps and Indexes

When adding a new service, module, provider, foundation, gate, namespace, or navigation relationship, update the relevant index:

```text
navigation/
platform/service-catalog.yaml
governance/provider-registry.yaml
foundation/maps/
registry/
modules/<service-id>/module-manifest.yaml
mycodexvantaos-namespace-governance/
unified-gates/
```

---

## Example: Adding Model Inference Billing

A correct implementation flow:

1. Check `billing-model/` for pricing primitives.
2. Check `ai-task/` for inference task lifecycle.
3. Add or update event contract in `events/` or `contracts/events/`.
4. Register event in the event index.
5. Add metering logic in `billing/`.
6. Emit usage event after successful inference.
7. Update metrics in `metrics/`.
8. Update SLO in `slo/`.
9. Update audit behavior in `audit` or governance event model.
10. Update navigation indexes.
11. Update unified gates if a gate should block release.
12. Add tests and CI validation.

Incorrect implementation:

```text
writing a helper function in utils/ that increments a counter
```

Correct implementation:

```text
contract → ai-task lifecycle → event → metering → billing model → audit → slo → gate → navigation
```

---

## API Reference

Primary API endpoints are served from the Node.js API on port `9100`.

| Category  | Endpoint                     |
| --------- | ---------------------------- |
| Health    | `GET /v1/health`             |
| Readiness | `GET /v1/ready`              |
| Version   | `GET /v1/version`            |
| Runtime   | `GET /v1/runtime`            |
| Contracts | `GET /v1/contracts/validate` |
| Services  | `GET /v1/services`           |
| Audit     | `POST /v1/audit/events`      |
| Knowledge | `POST /v1/knowledge/search`  |
| Agent     | `POST /v1/agent/chat`        |
| Policy    | `POST /v1/policies/evaluate` |

All platform events follow CloudEvents v1.0.

---

## Release and Supply Chain

The platform release process generates:

- release manifest;
- artifact digest;
- SBOM;
- SLSA provenance;
- in-toto statement;
- promotion gate report;
- governance evidence.

Hash policy:

| Purpose                      | Algorithm |
| ---------------------------- | --------- |
| Runtime audit chain          | SHA-256   |
| Long-term artifact integrity | SHA3-512  |
| Fast CI comparison           | BLAKE3    |

Production images must use digest pinning:

```text
ghcr.io/mycodexvantaos/<service-id>@sha256:<digest>
```

---

## Production Readiness

Production requires:

- explicit runtime mode;
- configured secrets provider;
- provider health checks;
- service manifest validation;
- topology validation;
- no expired exceptions;
- audit chain enabled;
- SBOM generated;
- provenance generated;
- image digest pinning;
- rollback policy;
- release promotion gate;
- navigation index validation;
- namespace governance validation;
- unified gate validation.

---

## Documentation

Key documents:

```text
docs/unified-architecture-spec.md
docs/deployment/README.md
docs/operations/README.md
docs/self-hostable/self-hostable-overview.md
foundation/foundation-index.yaml
governance/platform-governance-spec.yaml
platform/service-catalog.yaml
navigation/
mycodexvantaos-namespace-governance/
unified-gates/
```

---

## Contributing

Before submitting a pull request:

1. Run governance checks.
2. Validate contracts.
3. Validate service catalog.
4. Validate provider registry.
5. Validate foundation structure if foundation files changed.
6. Validate navigation indexes if root directories, modules, services, providers, or gates changed.
7. Validate namespace governance if names, governance codes, registries, or lifecycle files changed.
8. Validate unified gates if gate definitions, coverage gates, AI infrastructure gates, or production gates changed.
9. Ensure no provider SDK leaks into core or ports.
10. Ensure all state-changing routes emit audit events.
11. Ensure measurable AI operations emit metering events.
12. Ensure all new services have module manifests.
13. Ensure all root directories have `mycodexvantaos-module.yaml`.

Required commands:

```bash
pnpm governance:check
pnpm contracts:validate
pnpm schemas:validate
pnpm service-catalog:check
pnpm navigation:check
pnpm namespace-governance:check
pnpm unified-gates:check
python3 scripts/validate-foundation-structure.py --root foundation
```

---

## License

Proprietary — All rights reserved.

---

<div align="center">

**Built for the AI infrastructure era**

_Compute · Data · Algorithm · Agent · Contract · Governance · Business_

**Edge-adapter ready · Cloud-agnostic · Local-first · Contract-first · Governance-enforced**

</div>
