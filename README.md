<div align="center">

# MyCodeXvantaOS

**AI-Native Agent Operating System**

_Cloudflare-First · Hexagonal Architecture · Constitutionally Governed_

[![Platform Constitution CI](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/platform-constitution-ci.yml/badge.svg)](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/platform-constitution-ci.yml)
[![CodeQL](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/codeql.yml/badge.svg)](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/codeql.yml)
[![Release Candidate Check](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/release-candidate-check.yml/badge.svg)](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/release-candidate-check.yml)
[![Governance Check](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/governance-check.yml/badge.svg)](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/governance-check.yml)

</div>

---

MyCodeXvantaOS is an AI-native platform where agents authenticate, access knowledge, invoke models, and produce auditable outcomes within governed workspaces. Built on a five-model constitutional foundation with strict port/adapter hexagonal boundaries, it runs first on Cloudflare's global edge while guaranteeing vendor independence from day one.

The platform evolved from a Firebase Studio prototype through a Next.js web application into a full-scale service-oriented architecture. Today it houses a monorepo of 79 packages, 39 service modules, 8 constitutional service categories, a React dashboard, an AI-powered agent system, a Python intelligence plane, and infrastructure for multiple deployment runtimes.

---

## Table of Contents

- [Core Concepts](#core-concepts)
- [Architecture](#architecture)
- [Service Categories](#service-categories)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Governance and Release Commands](#governance-and-release-commands)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Constitutional Models](#constitutional-models)
- [Release and Supply Chain](#release-and-supply-chain)
- [Project History](#project-history)
- [Contributing](#contributing)
- [License](#license)

---

## Core Concepts

### Three Design Principles

**Constitutional Governance** — Five immutable models form the platform constitution. Every service, every API call, every data flow must conform to these models. They are defined in human-readable YAML contracts under `contracts/` and validated by JSON Schemas. No service may bypass or override constitutional rules. The platform enforces 8 hard and 9 soft governance flags across all runtime operations.

**Cloud-Vendor Independence** — The platform is Cloudflare-first but not Cloudflare-only. All cloud-specific logic lives behind port/adapter boundaries. The `packages/core/` layer has zero cloud vendor dependencies. The `packages/ports/` layer defines platform-neutral interfaces. The `packages/adapters/` layer implements those interfaces for specific providers. Swap runtime without touching business logic.

**Closed-Loop Auditability** — Every significant action produces an audit event. Events form a SHA-256 integrity chain. Synchronous operations follow a request→completion/failure pairing model via `pair_id`. The audit trail is a tamper-evident DAG of cryptographic proof.

### Three-Phase Startup Strategy

| Phase                                | Runtime                                         | Status                  |
| ------------------------------------ | ----------------------------------------------- | ----------------------- |
| **Phase 1 — Cloudflare-First (MVP)** | Workers + D1 + KV + R2 + Vectorize + Queues     | ✅ Complete             |
| **Phase 2 — Portable Core**          | PostgreSQL + Redis + MinIO + Qdrant + RabbitMQ  | 🔧 Bootstrap ready      |
| **Phase 3 — Self-Hostable**          | Kubernetes + Helm + ArgoCD + HPA                | ✅ Helm chart ready     |
| **Phase 4 — Governance Hardening**   | Policy Engine + Audit Middleware + Dream Safety | ✅ Complete (197 tests) |
| **Phase 5 — Release & Supply Chain** | SBOM + Provenance + Signing + Promotion Gates   | ✅ Complete (v0.1.0)   |

---

## Architecture

MyCodeXvantaOS follows a **nine-layer hexagonal (port/adapter) architecture** with strict dependency direction from inner to outer layers. The architecture comprises a TypeScript control plane and a Python intelligence plane, connected through contracts as the source of truth.

```
┌──────────────────────────────────────────────────────────┐
│  I. Apps Layer                                           │
│  api-node (Node.js API) · api-worker (CF Workers) ·      │
│  web-console (SPA) · admin-console · cli (mcx)           │
├──────────────────────────────────────────────────────────┤
│  H. Runtimes Layer                                       │
│  Cloudflare · Node.js · Docker · Kubernetes              │
├──────────────────────────────────────────────────────────┤
│  G. Governance Layer (cross-cutting)                     │
│  Policy Engine · Audit Chain · Usage Metering            │
│  Knowledge Trace Enforcement · Dream Safety Enforcement  │
├──────────────────────────────────────────────────────────┤
│  F. Release & Supply Chain Layer                         │
│  Artifact Digests · SBOM · Provenance · Signing Policy   │
│  Promotion Gates · Soak Validation                       │
├──────────────────────────────────────────────────────────┤
│  E. Infrastructure Layer                                 │
│  Helm Charts · Docker Compose · Migrations · Contracts   │
├──────────────────────────────────────────────────────────┤
│  D. Adapters Layer (Provider Adapters)                   │
│  cloudflare-d1 · cloudflare-kv · cloudflare-r2 ·         │
│  d1-full-text-search · openai · openrouter · workers-ai  │
├──────────────────────────────────────────────────────────┤
│  C. Application Layer (8 services)                       │
│  identity · workspace · knowledge · agent · model ·      │
│  audit · usage · automation                              │
├──────────────────────────────────────────────────────────┤
│  B. Ports Layer (6 interfaces)                           │
│  database · object-storage · search · model-provider ·   │
│  queue · auth                                            │
├──────────────────────────────────────────────────────────┤
│  A. Core Layer (6 domain models)                         │
│  shared · service-catalog · resource-model ·             │
│  policy-model · audit-model · knowledge-model            │
└──────────────────────────────────────────────────────────┘
```

**Dependency direction:** A → B → C → D → E (governance G is cross-cutting; release F is cross-cutting; runtimes H and apps I compose the stack)

### Dual-Plane Architecture

The platform operates on two complementary planes:

**TypeScript Control Plane** — Handles service catalog, resource management, policy enforcement, audit logging, and API routing. All governance enforcement (audit, knowledge trace, dream safety, policy runtime) runs in the control plane.

**Python Intelligence Plane** — Handles knowledge pipeline processing, agent orchestration, vector operations, evaluation, and memory dream. Python packages under `python/` connect to the control plane through the shared contract layer.

### Port/Adapter Wiring

```
                    ┌──────────────┐
                    │ application/ │  ← Business logic (8 services)
                    └──────┬───────┘
                           │ depends on
                    ┌──────▼───────┐
                    │   ports/     │  ← Interfaces only (6 ports)
                    └──────┬───────┘
                           │ implemented by
              ┌────────────┼────────────────┐
              │            │                │
     ┌────────▼───────┐ ┌──▼──────────┐ ┌──▼───────────┐
     │ CF Adapters    │ │ AI Adapters │ │ Search       │
     │ D1 · KV · R2   │ │ OpenAI      │ │ D1 FTS5      │
     │                │ │ OpenRouter  │ │              │
     │                │ │ Workers AI  │ │              │
     └────────────────┘ └─────────────┘ └──────────────┘
```

| Port           | Interface                                | Cloudflare Impl                  | Portable Impl        |
| -------------- | ---------------------------------------- | -------------------------------- | -------------------- |
| Database       | `IDatabasePort` / `IRepository<T>`       | D1                               | PostgreSQL           |
| Object Storage | `IObjectStoragePort`                     | R2                               | MinIO/S3             |
| Cache          | via KV                                   | KV                               | Redis                |
| Search         | `ISearchPort` / `IKnowledgeSearchPort`   | D1 FTS5 + Vectorize              | pgvector + GIN       |
| Model          | `IChatModelPort` / `IEmbeddingModelPort` | Workers AI / OpenAI / OpenRouter | Same (fetch-based)   |
| Queue          | `IQueuePort` / `IJobQueuePort`           | Cloudflare Queues                | RabbitMQ             |
| Auth           | `IAuthPort`                              | JWT + KV sessions                | JWT + Redis sessions |

---

## Service Categories

The platform organizes all capabilities into **8 categories** following an AWS-like service catalog model. Every capability is productized, categorized, searchable, and enableable.

| Category          | Description                                    | MVP Services                      | Post-MVP                                             |
| ----------------- | ---------------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| 🔬 **Knowledge**  | Document ingestion, vector search, collections | knowledge-store, knowledge-search | knowledge-trace, knowledge-repair, knowledge-cockpit |
| 🤖 **Agent**      | Conversational AI, autonomous agents           | agent-chat                        | agent-router, agent-mode, agent-memory               |
| 🏢 **Workspace**  | Multi-tenant collaboration                     | workspace                         | workspace-analytics, workspace-templates             |
| 🛠 **Developer**  | Developer tooling and SDK                      | —                                 | dev-portal, sdk-playground                           |
| 🔒 **Security**   | Authentication, authorization, secrets         | identity                          | mfa-service, token-rotation                          |
| 📦 **Storage**    | Object storage, file management                | (via adapters)                    | backup-service, lifecycle-policies                   |
| 🧠 **Model**      | LLM endpoints, BYOK gateway                    | model-byok                        | model-fine-tune, model-evaluator                     |
| ⚡ **Automation** | Background jobs, scheduled tasks               | usage-meter, automation           | scheduler, event-router                              |

**URN Format:** `urn:mycodexvantaos:{category}:{kind}:{id}`

---

## Repository Structure

```
mycodexvantaos/
├── contracts/                          # Constitutional model definitions
│   ├── service-definitions/            #   15 service YAML files + catalog
│   ├── service-categories.yaml         #   8-category classification system
│   ├── openapi/api-v1.yaml             #   OpenAPI 3.1 specification
│   ├── events/                         #   7 CloudEvents v1.0 event YAML files
│   │   ├── audit-events.yaml           #     Audit event definitions
│   │   ├── knowledge-events.yaml       #     Knowledge pipeline events
│   │   ├── memory-events.yaml          #     Memory system events
│   │   ├── agent-events.yaml           #     Agent interaction events
│   │   ├── usage-events.yaml           #     Usage metering events
│   │   └── runtime-events.yaml         #     Runtime lifecycle events
│   ├── resource-kinds/                 #   16 resource kind YAML files
│   ├── policies/                       #   5 policy YAML files
│   └── schemas/                        #   14 JSON Schema validation files
├── packages/                           # 79 packages (TypeScript control plane)
│   ├── core/                           #   Zero-dependency domain models (6 sub-packages)
│   ├── ports/                          #   Platform-neutral interfaces (6 port packages)
│   ├── application/                    #   Service business logic (8 service modules)
│   └── adapters/                       #   Provider-specific implementations (7 adapters)
├── services/                           # 39 service packages (monorepo)
├── apps/                               # Application entry points
│   ├── api-node/                       #   Node.js API server (port 9100, self-hosted)
│   ├── api-worker/                     #   Cloudflare Worker API
│   ├── web-console/                    #   Admin SPA
│   ├── admin-console/                  #   Admin management console
│   └── cli/                            #   CLI tool (mcx)
├── python/                             # Python intelligence plane
│   ├── packages/                       #   5 Python packages
│   │   ├── mycodexvantaos-knowledge-pipeline/
│   │   ├── mycodexvantaos-agent-worker/
│   │   ├── mycodexvantaos-vector-tools/
│   │   ├── mycodexvantaos-evaluation/
│   │   └── mycodexvantaos-memory-dream/
│   └── apps/                           #   3 Python apps
│       ├── knowledge-worker/
│       ├── agent-worker/
│       └── dream-worker/
├── providers/                          # Provider adapter packages
│   ├── mycodexvantaos-provider-cloudflare-d1/
│   ├── mycodexvantaos-provider-cloudflare-kv/
│   ├── mycodexvantaos-provider-cloudflare-r2/
│   ├── mycodexvantaos-provider-cloudflare-vectorize/
│   ├── mycodexvantaos-provider-cloudflare-workers-ai/
│   └── ... (30+ provider categories)
├── runtimes/                           # Multi-runtime bootstrap
│   ├── cloudflare/                     #   CloudflareServiceContainer
│   ├── node/                           #   NodeServiceContainer (portable)
│   ├── docker/                         #   Docker env mapping + shutdown handlers
│   ├── kubernetes/                     #   K8s liveness/readiness/startup probes
│   └── local/                          #   Local runtime bootstrap
├── release/                            # Release artifacts and policies
│   ├── artifacts/                      #   Release artifacts (manifest, digests, SBOM, provenance)
│   │   ├── v0.1.0-rc.1/
│   │   └── v0.1.0/
│   └── policies/                       #   Signing policy, promotion policy
├── governance/                         # Platform governance specification
│   └── platform-governance-spec.yaml   #   8 hard + 9 soft enforcement flags
├── migrations/                         # Database schema (3 dialects)
│   ├── d1/                             #   Cloudflare D1
│   ├── sqlite/                         #   Portable SQLite (FTS5)
│   └── postgres/                       #   PostgreSQL 15+ (pgvector + GIN)
├── infra/                              # Infrastructure configuration
│   ├── cloudflare/workers/             #   9 wrangler.toml files
│   ├── docker/                         #   Dockerfiles + API gateway
│   ├── docker-compose/                 #   Local dev stack
│   └── helm/mycodexvantaos/            #   Helm chart (12 templates)
├── docs/                               # Documentation (20+ topic directories)
│   ├── architecture/                   #   Architecture design documents
│   ├── architecture-decision-records/  #   ADR
│   ├── releases/                       #   Release notes and reports
│   ├── security/                       #   Signing plan and security docs
│   ├── self-hostable/                  #   Self-hosted quickstart guide
│   ├── memory-dream/                   #   Dream safety documentation
│   └── ... (api, deployment, operations, etc.)
├── tools/                              # Development tooling
│   ├── validators/                     #   Contract & architecture validators
│   ├── generators/                     #   Service & adapter scaffolding
│   ├── governance/                     #   Governance check tool
│   ├── rc-verify/                      #   RC verification tool
│   ├── rc-soak/                        #   RC soak validation tool
│   └── release/                        #   Release artifact generators
└── .github/workflows/                  # 49 CI/CD pipeline configurations
```

---

## Tech Stack

### Platform Layer

| Layer             | Technology                        | Purpose                        |
| ----------------- | --------------------------------- | ------------------------------ |
| **Language**      | TypeScript + Python               | Dual-plane architecture        |
| **Runtime (MVP)** | Cloudflare Workers                | Global edge compute            |
| **Runtime (Self-hosted)** | Node.js 22                  | Portable API server (port 9100) |
| **Database**      | D1 (SQLite) / PostgreSQL          | Relational data, audit, usage  |
| **Cache**         | KV / Redis                        | Sessions, rate limits, config  |
| **Storage**       | R2 / MinIO                        | Document blobs, audit archives |
| **Search**        | Vectorize + FTS5 / pgvector + GIN | Hybrid semantic + fulltext     |
| **Queue**         | Cloudflare Queues / RabbitMQ      | Async processing, ingestion    |
| **AI Models**     | Workers AI / OpenAI / OpenRouter  | Chat completions, embeddings   |
| **Governance**    | SHA-256 + SHA3-512                | Audit chain + artifact digests |

### Web Application Layer

| Layer         | Technology                  | Purpose                       |
| ------------- | --------------------------- | ----------------------------- |
| **Framework** | Next.js 16                  | React SSR/SSG with App Router |
| **UI**        | Radix UI + Tailwind CSS     | Accessible, styled components |
| **AI**        | Genkit (Google GenAI)       | AI flow orchestration         |
| **State**     | Zustand                     | Client-side state management  |
| **Charts**    | Recharts                    | Data visualization            |
| **Forms**     | React Hook Form + Zod       | Validation-first forms        |
| **Deploy**    | OpenNext + Cloudflare Pages | SSR on edge                   |

### Infrastructure

| Tool               | Purpose                        |
| ------------------ | ------------------------------ |
| **pnpm**           | Monorepo workspace management  |
| **Node.js 22**     | Primary runtime version        |
| **Wrangler**       | Cloudflare Workers dev/deploy  |
| **Docker Compose** | Local development stack        |
| **Helm**           | Kubernetes deployment charts   |
| **GitHub Actions** | CI/CD pipelines (49 workflows) |

---

## Getting Started

### Prerequisites

- Node.js 22+ and pnpm 9+
- Python 3.11+ (for intelligence plane)
- Cloudflare account (for Workers deployment)
- Docker and Docker Compose (for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/mycodexvantaos/mycodexvantaos.git
cd mycodexvantaos

# Enable corepack (required for pnpm)
corepack enable

# Install dependencies
pnpm install --frozen-lockfile

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

### Local Development (Next.js Web App)

```bash
pnpm dev
# Opens at http://localhost:9002
```

### Local Development (Platform API — Self-Hosted)

```bash
# Start the Node.js API server (port 9100)
pnpm api:start

# Or start with the full local stack
docker compose -f infra/docker-compose/docker-compose.local.yaml up -d

# Run D1 migrations locally
cd apps/api-worker && pnpm run db:migrate

# Start the API worker in dev mode
cd apps/api-worker && pnpm run dev
```

### Quick Health Check

```bash
# Verify the API is running
curl http://localhost:9100/v1/health

# Check version info
curl http://localhost:9100/v1/version

# Verify runtime status
curl http://localhost:9100/v1/runtime

# Validate all contracts
curl http://localhost:9100/v1/contracts/validate
```

### Using the CLI

```bash
# Build and run the CLI tool
cd apps/cli && pnpm run build

# Status check
mcx status

# Chat with an agent
mcx agent chat --workspace my-workspace

# Search knowledge
mcx knowledge search "how to deploy workers"

# Verify audit chain integrity
mcx audit verify
```

---

## Development

### Monorepo Commands

```bash
pnpm build              # Build all packages
pnpm lint               # TypeScript check across workspace
pnpm format:check       # Prettier format check
pnpm typecheck          # Type-check without emit
pnpm test               # Run tests
pnpm test:coverage      # Run tests with coverage
pnpm test:integration   # Run integration tests
pnpm validate           # Validate project structure
```

### Architecture Validators

```bash
# Validate all contracts
pnpm contracts:validate

# Validate JSON schemas
pnpm schemas:validate

# Validate service catalog
pnpm service-catalog:check

# Validate resource model
pnpm resource-model:check

# Validate policy model
pnpm policy:check

# Validate events
pnpm events:check

# Full governance check (all of the above)
pnpm governance:check
```

### Code Generators

```bash
# Scaffold a new service
npx tsx tools/generators/generate-service.ts --name my-service --category knowledge

# Scaffold a new adapter
npx tsx tools/generators/generate-adapter.ts --port database --provider planetscale
```

### Key Naming Conventions

- **Directories:** kebab-case (`cloudflare-d1/`, `model-provider/`)
- **Package names:** `@mycodexvantaos/<short-id>` (`@mycodexvantaos/core`, `@mycodexvantaos/ports`)
- **URN format:** `urn:mycodexvantaos:{category}:{kind}:{id}`
- **No version numbers** in directory or package names
- **packages/core/** must have zero external/cloud vendor dependencies
- **packages/ports/** must not import cloud SDKs

---

## Governance and Release Commands

The platform includes comprehensive governance and release tooling that ensures contract-runtime alignment and supply-chain integrity.

### Governance Commands

```bash
pnpm governance:check              # Full governance check (24 checks)
pnpm contracts:validate            # Validate all YAML/JSON contracts
pnpm schemas:validate              # Validate JSON schemas
pnpm service-catalog:check        # Validate service catalog
pnpm resource-model:check          # Validate resource model
pnpm policy:check                  # Validate policy definitions
pnpm events:check                  # Validate event contracts
```

### Release Candidate Commands

```bash
pnpm rc:verify                     # RC verification (8 categories of checks)
pnpm rc:soak                       # RC soak validation report
pnpm release:promotion:evaluate    # Evaluate promotion gates
```

### Release Artifact Commands

```bash
pnpm generate-release-manifest     # Generate release manifest
pnpm release:artifacts             # Generate release artifacts
pnpm release:sbom                  # Generate CycloneDX 1.5 SBOM
pnpm release:provenance            # Generate SLSA v1 provenance
```

### Governance Enforcement

The platform enforces governance through 8 hard and 9 soft enforcement flags defined in `governance/platform-governance-spec.yaml`. Hard enforcement flags block non-compliant operations at runtime; soft enforcement flags produce warnings and audit records.

**Runtime Enforcement Middleware:**

| Enforcement                | Layer     | Description                                                    |
| -------------------------- | --------- | -------------------------------------------------------------- |
| Audit Enforcement          | Hard      | All state-changing routes must use `withAudit()` middleware    |
| Knowledge Trace            | Hard      | Knowledge-assisted answers must reference valid receipt        |
| Dream Safety               | Hard      | Dream apply/rollback subject to review/safety constraints     |
| Policy Runtime             | Hard      | Policy engine evaluates before state-changing operations       |
| Architecture Decision      | Hard      | Architecture merge/deprecate always requires human review      |

---

## Deployment

### Self-Hosted (Node.js API — Recommended for v0.1.0)

```bash
# Build and run the Node.js API server
pnpm build
pnpm api:start

# Or via Docker
docker run -p 9100:9100 mycodexvantaos/api-node

# Verify
curl http://localhost:9100/v1/health
```

### Cloudflare Workers (MVP)

```bash
# Deploy the API worker
cd apps/api-worker && pnpm run deploy

# Deploy the Next.js web app
pnpm run deploy
```

The platform uses a single Cloudflare Worker with URL-based routing for all 8 service categories, plus a queue consumer for async job processing.

**Bindings:** `D1_DATABASE`, `KV_CACHE`, `KV_SESSION`, `R2_BUCKET`, `AI`, `QUEUE_JOBS`, `JWT_SECRET`, `ENVIRONMENT`

### Docker Compose (Development)

```bash
docker compose -f infra/docker-compose/docker-compose.local.yaml up -d
```

Stack includes: PostgreSQL 15, Redis 7, MinIO, Qdrant, RabbitMQ, and the API worker.

### Kubernetes (Production)

```bash
helm install mycodexvantaos infra/helm/mycodexvantaos/ \
  --namespace mycodexvantaos --create-namespace \
  --set secrets.jwtSecret=your-secret \
  --set secrets.encryptionKey=your-key
```

The Helm chart includes 12 templates: deployment, service, ingress, HPA, PDB, ServiceMonitor, secrets, configmap, serviceaccount, migration-job, workers, and helpers.

---

## API Reference

All endpoints are served from the Node.js API on port 9100. The API follows the OpenAPI 3.1 specification defined in `contracts/openapi/api-v1.yaml`.

### Quick Reference

| Category     | Endpoints                                                        | Description                                      |
| ------------ | ---------------------------------------------------------------- | ------------------------------------------------ |
| **Health**   | `GET /v1/health`                                                 | Platform health check (all 5 runtime loops)      |
| **Readiness**| `GET /v1/ready`                                                  | Kubernetes readiness probe                       |
| **Version**  | `GET /v1/version`                                                | Version, commit, build info                      |
| **Runtime**  | `GET /v1/runtime`                                                | Node version, memory, platform info              |
| **Contracts**| `GET /v1/contracts/validate`                                     | Validate all contracts                           |
| **Services** | `GET /v1/services` · `GET /v1/services/:id`                     | Service catalog (15 services)                    |
| **Resources**| `GET /v1/resource-kinds` · `GET /v1/resource-kinds/:kind`       | Resource kinds (16 kinds)                        |
| **Audit**    | `POST /v1/audit/events` · `GET /v1/audit/events` · `GET /v1/audit/verify` | Audit event recording and integrity verification |
| **Knowledge**| `POST /v1/knowledge/search` · `POST /v1/knowledge/answer` · `GET /v1/knowledge/retrieval-receipts/:id` · `GET /v1/knowledge/answer-traces/:id` | Knowledge search with trace enforcement |
| **Dream**    | `POST /v1/dream/run` · `GET /v1/dream/runs/:id` · `GET /v1/dream/stats` · `POST /v1/dream/runs/:id/review` · `POST /v1/dream/runs/:id/apply` · `POST /v1/dream/runs/:id/rollback` | Memory dream with safety enforcement |
| **Policy**   | `POST /v1/policies/evaluate` · `GET /v1/policies`               | Policy evaluation and listing                    |

### Authentication

All API requests require a Bearer JWT token:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:9100/v1/services
```

### Event Specification

All platform events follow **CloudEvents v1.0** format, split across 7 domain-specific YAML files in `contracts/events/`:

| Event File          | Domain      | Description                          |
| ------------------- | ----------- | ------------------------------------ |
| audit-events.yaml   | Audit       | Audit recording and integrity events |
| knowledge-events.yaml | Knowledge | Document ingestion and search events |
| memory-events.yaml  | Memory      | Memory capture and dream events      |
| agent-events.yaml   | Agent       | Chat session and message events      |
| usage-events.yaml   | Usage       | Metering and quota events            |
| runtime-events.yaml | Runtime     | Service lifecycle events             |

---

## Constitutional Models

Five immutable models form the platform constitution. These are defined in YAML contracts and enforced by JSON Schemas.

### 1. Service Catalog

**File:** `contracts/service-definitions/` (15 service YAML files)

Defines the 15 services with dependency levels and startup order:

```
Level 0: audit-log, identity                    (no dependencies)
Level 1: workspace, usage-meter                 (depend on identity)
Level 2: knowledge-store, knowledge-search,     (depend on identity)
         model-byok
Level 3: agent-chat                             (depends on knowledge-search + model-byok)
```

### 2. Resource Model

**File:** `contracts/resource-kinds/` (16 YAML files) · **Schema:** `contracts/schemas/universal-resource.schema.json`

16 resource kinds with URN addressing and lifecycle states:

```
Pending → Active → Succeeded / Failed / Retiring → Retired
```

### 3. Policy Model

**File:** `contracts/policies/` (5 YAML files) · **Schema:** `contracts/schemas/policy-decision.schema.json`

6 roles (system:admin → workspace:agent) with 14+ policy rules enforcing workspace-scoped RBAC, MFA, and tier-based rate limits.

### 4. Audit Model

**File:** `contracts/events/` (7 event YAML files) · **Schema:** `contracts/schemas/audit-event.schema.json`

35+ event types with SHA-256 integrity chain and closed-loop pairing. Every request event is paired with a completion or failure event via `pair_id`.

### 5. Knowledge Model

**File:** `contracts/schemas/knowledge-pipeline.schema.json`

10 knowledge types across 3 evidence levels (assisted, verified, grounded) with a complete ingestion→retrieval→generation pipeline.

---

## Release and Supply Chain

The v0.1.0 release introduces a comprehensive release and supply-chain pipeline that ensures artifact integrity, provenance, and governance compliance.

### Release Pipeline

| Stage                      | Tool/Command                           | Output                                    |
| -------------------------- | -------------------------------------- | ----------------------------------------- |
| RC Verification            | `pnpm rc:verify`                       | 8-category verification report            |
| RC Soak Validation         | `pnpm rc:soak`                         | Soak report (19 checks, 6 classifications)|
| Release Manifest           | `pnpm generate-release-manifest`       | release-manifest.json with SHA3-512 digests|
| Artifact Generation        | `pnpm release:artifacts`               | Artifact bundle with digests               |
| SBOM Generation            | `pnpm release:sbom`                    | CycloneDX 1.5 JSON SBOM                   |
| Provenance Generation      | `pnpm release:provenance`              | SLSA v1 / in-toto Statement v1 provenance  |
| Promotion Evaluation       | `pnpm release:promotion:evaluate`      | Gate evaluation (9/11 pass, 2 acceptable) |

### Artifact Integrity

- **Primary hash:** SHA3-512 for all release artifacts
- **Secondary hash:** SHA-256 for audit chains and compatibility
- **SBOM:** CycloneDX 1.5 JSON format
- **Provenance:** SLSA v1 / in-toto Statement v1 format

### Classifications

| Classification                  | Description                                           |
| ------------------------------- | ----------------------------------------------------- |
| `signing-not-configured`        | Artifact signing not yet configured (planned)         |
| `infrastructure-not-configured` | Infrastructure signing not yet configured (planned)   |

---

## Project History

MyCodeXvantaOS has undergone a significant architectural evolution:

| Era    | Phase                 | Description                                                                                                                                                                                 |
| ------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **V0** | Prototype             | Firebase Studio workspace, initial Next.js prototype                                                                                                                                        |
| **V1** | Divine Control Plane  | 8 core packages, 15 services, Cloudflare-first infrastructure                                                                                                                               |
| **V2** | SentinelCore          | Observer/observable dual-role system, accountability protocols, 金鑰配對系統                                                                                                                |
| **V3** | Cloudflare Deployment | Next.js 16 + OpenNext on Cloudflare Workers/Pages, wrangler configuration                                                                                                                   |
| **V4** | Platform Constitution | 8-category service classification, hexagonal decomposition, five constitutional models                                                                                                      |
| **V5** | Full Architecture     | Apps layer, infrastructure contracts, multi-runtime bootstrap, 3-dialect migrations, Helm charts                                                                                            |
| **V6** | Governance Hardening  | Policy enforcement runtime, audit enforcement middleware, knowledge trace enforcement, memory dream safety, contract enforcement CI, Cloudflare Worker launch, self-hosted Docker runtime |
| **V7** | Release Stabilization | CodeQL integration, TFC guard, RC verify pipeline, governance check CI, cross-platform section-sign enforcement                                                                            |
| **V8** | Release Validation & Packaging | SBOM generation (CycloneDX 1.5), provenance (SLSA v1), artifact digests (SHA3-512), self-hosted quickstart, promotion policy, signing policy definition                     |
| **V9** | RC Soak & Stable Promotion | Soak validation (19/19 checks), promotion gate evaluation (9/11 pass, 2 acceptable skips), stable release signing plan, v0.1.0 stable release draft                        |

The project merged its platform constitution architecture (PRs #23, #24) completing a 10-phase decomposition from a monolithic structure into the current layered hexagonal architecture, followed by governance hardening (PRs #34–#70) and release validation (PRs #71–#74).

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

Key points:

1. All new services must declare a `category` field matching one of the 8 categories
2. `packages/core/` must remain vendor-free — no cloud SDK imports
3. `packages/ports/` defines interfaces only — no implementations
4. Use the code generators to scaffold new services and adapters
5. Run governance checks before submitting PRs (`pnpm governance:check`)
6. All state-changing API routes must use `withAudit()` middleware
7. No provider SDK imports in core packages
8. No fake Terraform or infrastructure files

---

## License

Proprietary — All rights reserved.

---

<div align="center">

_Architecture document: [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md)_
_Deployment guide: [docs/deployment/README.md](./docs/deployment/README.md)_
_Operations runbook: [docs/operations/README.md](./docs/operations/README.md)_
_Self-hosted guide: [docs/self-hostable/self-hostable-overview.md](./docs/self-hostable/self-hostable-overview.md)_
_Release notes: [docs/releases/v0.1.0.md](./docs/releases/v0.1.0.md)_

**Built with ☁️ Cloudflare Workers · 🏛️ Constitutional Governance · 🔐 SHA-256 Audit Chains · 📦 Supply Chain Integrity**

</div>
