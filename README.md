<div align="center">

# MyCodeXvantaOS

**AI-Native Agent Operating System**

_Cloudflare-First · Hexagonal Architecture · Constitutionally Governed_

[![Platform Constitution CI](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/platform-constitution-ci.yml/badge.svg)](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/platform-constitution-ci.yml)
[![CodeQL](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/codeql.yml/badge.svg)](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/codeql.yml)

</div>

---

MyCodeXvantaOS is an AI-native platform where agents authenticate, access knowledge, invoke models, and produce auditable outcomes within governed workspaces. Built on a five-model constitutional foundation with strict port/adapter hexagonal boundaries, it runs first on Cloudflare's global edge while guaranteeing vendor independence from day one.

The platform evolved from a Firebase Studio prototype through a Next.js web application into a full-scale service-oriented architecture. Today it houses a monorepo of 70+ packages, 27 service modules, 8 constitutional service categories, a React dashboard, an AI-powered agent system, and infrastructure for three deployment runtimes.

---

## Table of Contents

- [Core Concepts](#core-concepts)
- [Architecture](#architecture)
- [Service Categories](#service-categories)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Constitutional Models](#constitutional-models)
- [Project History](#project-history)
- [Contributing](#contributing)
- [License](#license)

---

## Core Concepts

### Three Design Principles

**Constitutional Governance** — Five immutable models form the platform constitution. Every service, every API call, every data flow must conform to these models. They are defined in human-readable YAML contracts under `contracts/` and validated by JSON Schemas. No service may bypass or override constitutional rules.

**Cloud-Vendor Independence** — The platform is Cloudflare-first but not Cloudflare-only. All cloud-specific logic lives behind port/adapter boundaries. The `packages/core/` layer has zero cloud vendor dependencies. The `packages/ports/` layer defines platform-neutral interfaces. The `packages/adapters/` layer implements those interfaces for specific providers. Swap runtime without touching business logic.

**Closed-Loop Auditability** — Every significant action produces an audit event. Events form a SHA-256 integrity chain. Synchronous operations follow a request→completion/failure pairing model via `pair_id`. The audit trail is a tamper-evident DAG of cryptographic proof.

### Three-Phase Startup Strategy

| Phase                                | Runtime                                        | Status              |
| ------------------------------------ | ---------------------------------------------- | ------------------- |
| **Phase 1 — Cloudflare-First (MVP)** | Workers + D1 + KV + R2 + Vectorize + Queues    | ✅ Complete         |
| **Phase 2 — Portable Core**          | PostgreSQL + Redis + MinIO + Qdrant + RabbitMQ | 🔧 Bootstrap ready  |
| **Phase 3 — Self-Hostable**          | Kubernetes + Helm + ArgoCD + HPA               | ✅ Helm chart ready |
| **Phase 4 — Governance Hardening**   | Policy Engine + Audit Middleware + Dream Safety | ✅ Complete (197 tests) |

---

## Architecture

MyCodeXvantaOS follows an **eight-layer hexagonal (port/adapter) architecture** with strict dependency direction from inner to outer layers:

```
┌──────────────────────────────────────────────────────────┐
│  H. Apps Layer                                           │
│  api-worker (CF Workers) · web-console (SPA) · cli (mcx) │
├──────────────────────────────────────────────────────────┤
│  G. Runtimes Layer                                       │
│  Cloudflare · Node.js · Docker · Kubernetes              │
├──────────────────────────────────────────────────────────┤
│  F. Governance Layer (cross-cutting)                     │
│  Policy Engine · Audit Chain · Usage Metering            │
├──────────────────────────────────────────────────────────┤
│  E. Infrastructure Layer                                 │
│  Helm Charts · Docker Compose · Migrations · Contracts   │
├──────────────────────────────────────────────────────────┤
│  D. Adapters Layer (7 packages)                          │
│  cloudflare-d1 · cloudflare-kv · cloudflare-r2 ·        │
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

**Dependency direction:** A → B → C → D → E (governance F is cross-cutting; runtimes G and apps H compose the stack)

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
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼───────┐ ┌──▼─────────┐ ┌▼───────────┐
     │ CF Adapters    │ │ AI Adapters│ │ Search     │
     │ D1 · KV · R2   │ │ OpenAI     │ │ D1 FTS5    │
     │                │ │ OpenRouter │ │            │
     │                │ │ Workers AI │ │            │
     └────────────────┘ └────────────┘ └────────────┘
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
| 🔐 **Security**   | Authentication, authorization, secrets         | identity                          | mfa-service, token-rotation                          |
| 📦 **Storage**    | Object storage, file management                | (via adapters)                    | backup-service, lifecycle-policies                   |
| 🧠 **Model**      | LLM endpoints, BYOK gateway                    | model-byok                        | model-fine-tune, model-evaluator                     |
| ⚡ **Automation** | Background jobs, scheduled tasks               | usage-meter, automation           | scheduler, event-router                              |

**URN Format:** `urn:mycodexvantaos:{category}:{kind}:{id}`

---

## Repository Structure

```
mycodexvantaos/
├── contracts/                          # Constitutional model definitions
│   ├── service-definitions/            #   10 service YAML files + catalog
│   ├── service-categories.yaml         #   8-category classification system
│   ├── openapi/api-v1.yaml             #   OpenAPI 3.1 specification
│   ├── events/events.yaml              #   CloudEvents v1.0 event definitions
│   └── schemas/                        #   5 JSON Schema validation files
├── packages/
│   ├── core/                           # Zero-dependency domain models (6 sub-packages)
│   ├── ports/                          # Platform-neutral interfaces (6 port packages)
│   ├── application/                    # Service business logic (8 service modules)
│   └── adapters/                       # Provider-specific implementations (7 adapters)
├── apps/                               # Application entry points
│   ├── api-worker/                     #   Cloudflare Worker API
│   ├── web-console/                    #   Admin SPA
│   └── cli/                            #   CLI tool (mcx)
├── runtimes/                           # Multi-runtime bootstrap
│   ├── cloudflare/                     #   CloudflareServiceContainer
│   ├── node/                           #   NodeServiceContainer (portable)
│   ├── docker/                         #   Env mapping + shutdown handlers
│   └── kubernetes/                     #   K8s liveness/readiness/startup probes
├── migrations/                         # Database schema (3 dialects)
│   ├── d1/                             #   Cloudflare D1
│   ├── sqlite/                         #   Portable SQLite (FTS5)
│   └── postgres/                       #   PostgreSQL 15+ (pgvector + GIN)
├── infra/                              # Infrastructure configuration
│   ├── cloudflare/workers/             #   9 wrangler.toml files
│   ├── docker/                         #   Dockerfiles + API gateway
│   ├── docker-compose/                 #   Local dev stack
│   └── helm/mycodexvantaos/            #   Helm chart (12 templates)
├── services/                           # 27 legacy service packages (monorepo)
├── src/                                # Next.js web application
│   ├── app/                            #   App Router (dashboard, API)
│   ├── ai/                             #   Genkit AI flows
│   └── components/                     #   React UI components
├── docs/                               # Documentation
│   ├── api/                            #   API reference
│   ├── deployment/                     #   Deployment guide
│   └── operations/                     #   Operations runbook
├── tools/                              # Development tooling
│   ├── validators/                     #   Contract & architecture validators
│   └── generators/                     #   Service & adapter scaffolding
└── .github/workflows/                  # 38 CI/CD pipeline configurations
```

---

## Tech Stack

### Platform Layer

| Layer             | Technology                        | Purpose                        |
| ----------------- | --------------------------------- | ------------------------------ |
| **Language**      | TypeScript                        | End-to-end type safety         |
| **Runtime (MVP)** | Cloudflare Workers                | Global edge compute            |
| **Database**      | D1 (SQLite) / PostgreSQL          | Relational data, audit, usage  |
| **Cache**         | KV / Redis                        | Sessions, rate limits, config  |
| **Storage**       | R2 / MinIO                        | Document blobs, audit archives |
| **Search**        | Vectorize + FTS5 / pgvector + GIN | Hybrid semantic + fulltext     |
| **Queue**         | Cloudflare Queues / RabbitMQ      | Async processing, ingestion    |
| **AI Models**     | Workers AI / OpenAI / OpenRouter  | Chat completions, embeddings   |

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
| **Wrangler**       | Cloudflare Workers dev/deploy  |
| **Docker Compose** | Local development stack        |
| **Helm**           | Kubernetes deployment charts   |
| **GitHub Actions** | CI/CD pipelines (38 workflows) |

---

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm 9+
- Cloudflare account (for Workers deployment)
- Docker and Docker Compose (for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/mycodexvantaos/mycodexvantaos.git
cd mycodexvantaos

# Install dependencies
pnpm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

### Local Development (Next.js Web App)

```bash
pnpm dev
# Opens at http://localhost:9002
```

### Local Development (Platform API + Infrastructure)

```bash
# Start the full local stack
docker compose -f infra/docker-compose/docker-compose.local.yaml up -d

# Run D1 migrations locally
cd apps/api-worker && pnpm run db:migrate

# Start the API worker in dev mode
cd apps/api-worker && pnpm run dev
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
```

### Architecture Validators

```bash
# Validate all service contracts
npx tsx tools/validators/validate-contracts.ts

# Validate architecture integrity (6 core + 6 ports + 8 services + 7 adapters)
npx tsx tools/validators/validate-architecture.ts
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

## Deployment

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

All endpoints follow the OpenAPI 3.1 specification defined in `contracts/openapi/api-v1.yaml`.

### Quick Reference

| Category   | Endpoints              | Description                                      |
| ---------- | ---------------------- | ------------------------------------------------ |
| Health     | `GET /health`          | Platform health check                            |
| Security   | `/api/v1/auth/*`       | Login, register, token refresh, permission check |
| Workspace  | `/api/v1/workspaces/*` | CRUD, members, settings                          |
| Knowledge  | `/api/v1/knowledge/*`  | Collections, documents, ingestion, search        |
| Agent      | `/api/v1/agent/*`      | Sessions, messages, streaming                    |
| Model      | `/api/v1/models/*`     | List endpoints, chat completions                 |
| Audit      | `/api/v1/audit/*`      | Event list, chain verification                   |
| Usage      | `/api/v1/usage/*`      | Current usage, quota, history                    |
| Automation | `/api/v1/automation/*` | Job enqueue, status, cancellation                |

### Authentication

All API requests require a Bearer JWT token:

```bash
curl -H "Authorization: Bearer <token>" https://api.mycodexvantaos.com/api/v1/workspaces
```

### Event Specification

All platform events follow **CloudEvents v1.0** format. See `contracts/events/events.yaml` for the full event catalog.

---

## Constitutional Models

Five immutable models form the platform constitution. These are defined in YAML contracts and enforced by JSON Schemas.

### 1. Service Catalog

**File:** `contracts/service-definitions/service-catalog.yaml`

Defines the 8 MVP services with dependency levels and startup order:

```
Level 0: audit-log, identity          (no dependencies)
Level 1: workspace, usage-meter       (depend on identity)
Level 2: knowledge-store, knowledge-search, model-byok  (depend on identity)
Level 3: agent-chat                   (depends on knowledge-search + model-byok)
```

### 2. Resource Model

**File:** `contracts/service-categories.yaml` · **Schema:** `contracts/schemas/universal-resource.schema.json`

18 resource kinds with URN addressing and lifecycle states:

```
Pending → Active → Succeeded / Failed / Retiring → Retired
```

### 3. Policy Model

**File:** `contracts/policy-model.yaml` · **Schema:** `contracts/schemas/policy-decision.schema.json`

6 roles (system:admin → workspace:agent) with 14+ policy rules enforcing workspace-scoped RBAC, MFA, and tier-based rate limits.

### 4. Audit Model

**File:** `contracts/events/events.yaml` · **Schema:** `contracts/schemas/audit-event.schema.json`

35+ event types with SHA-256 integrity chain and closed-loop pairing. Every request event is paired with a completion or failure event via `pair_id`.

### 5. Knowledge Model

**File:** `contracts/knowledge-model.yaml` · **Schema:** `contracts/schemas/knowledge-pipeline.schema.json`

10 knowledge types across 3 evidence levels (assisted, verified, grounded) with a complete ingestion→retrieval→generation pipeline.

---

## Project History

MyCodeXvantaOS has undergone a significant architectural evolution:

| Era    | Phase                 | Description                                                                                      |
| ------ | --------------------- | ------------------------------------------------------------------------------------------------ |
| **V0** | Prototype             | Firebase Studio workspace, initial Next.js prototype                                             |
| **V1** | Divine Control Plane  | 8 core packages, 15 services, Cloudflare-first infrastructure                                    |
| **V2** | SentinelCore          | Observer/observable dual-role system, accountability protocols, 金鑰配對系統                     |
| **V3** | Cloudflare Deployment | Next.js 16 + OpenNext on Cloudflare Workers/Pages, wrangler configuration                        |
| **V4** | Platform Constitution | 8-category service classification, hexagonal decomposition, five constitutional models           |
| **V5** | Full Architecture     | Apps layer, infrastructure contracts, multi-runtime bootstrap, 3-dialect migrations, Helm charts |
| **V6** | Governance Hardening  | Policy enforcement runtime, audit enforcement middleware, knowledge trace enforcement, memory dream safety, contract enforcement CI, Cloudflare Worker launch, self-hostable Docker runtime |

The project merged its platform constitution architecture (PRs #23, #24) completing a 10-phase decomposition from a monolithic structure into the current layered hexagonal architecture.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

Key points:

1. All new services must declare a `category` field matching one of the 8 categories
2. `packages/core/` must remain vendor-free — no cloud SDK imports
3. `packages/ports/` defines interfaces only — no implementations
4. Use the code generators to scaffold new services and adapters
5. Run validators before submitting PRs

---

## License

Proprietary — All rights reserved.

---

<div align="center">

_Architecture document: [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md)_
_Deployment guide: [docs/deployment/README.md](./docs/deployment/README.md)_
_Operations runbook: [docs/operations/README.md](./docs/operations/README.md)_

**Built with ☁️ Cloudflare Workers · 🏛️ Constitutional Governance · 🔗 SHA-256 Audit Chains**

</div>
