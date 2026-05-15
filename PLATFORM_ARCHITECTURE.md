# MyCodeXvantaOS — Platform Architecture Design

> **Cloudflare-First, Multi-Runtime, Self-Hostable AI-Native Service Platform**
> Organization: `mycodexvantaos` · NPM Scope: `@mycodexvantaos` · URN Namespace: `urn:mycodexvantaos`

---

## 1. Platform Overview

**MyCodeXvantaOS** is an AI-native Agent Operating System — a platform where AI agents can authenticate, access knowledge, invoke models, and produce auditable outcomes within a governed workspace. The architecture is defined by five immutable constitutional models, implemented through a clean port/adapter pattern, and deployable across multiple runtimes.

The platform follows a **three-phase startup strategy**: Cloudflare-first (MVP) → Portable Core (adapters/ports) → Self-hostable (Docker/K8s). This approach ships fast on Cloudflare's global edge while ensuring the ultimate goal — vendor independence — is architecturally guaranteed from day one.

### Platform Identity

| Attribute            | Value                    |
| :------------------- | :----------------------- |
| Organization         | `mycodexvantaos`         |
| NPM Scope            | `@mycodexvantaos`        |
| URN Namespace        | `urn:mycodexvantaos`     |
| Primary Language     | TypeScript               |
| Primary Runtime      | Cloudflare Workers       |
| Portable Runtime     | Docker / Kubernetes      |
| Architecture Pattern | Port/Adapter (Hexagonal) |

---

## 2. Design Philosophy

Three fundamental principles govern every design decision.

**Constitutional Governance.** Five core models form the immutable constitution of the platform. Every service, every API call, every data flow must conform to these models. The models are defined in human-readable YAML contracts under `contracts/` and validated by JSON Schemas. No service may bypass or override constitutional rules.

**Cloud-Vendor Independence.** The platform is cloudflare-first but not cloudflare-only. All cloud-specific logic lives behind port/adapter boundaries. The `core/` layer has zero cloud vendor dependencies. The `ports/` layer defines platform-neutral interfaces. The `adapters/` layer implements those interfaces for specific providers.

**Closed-Loop Auditability.** Every significant action produces an audit event. Events form a SHA-256 integrity chain. Synchronous operations follow a request→completion/failure pairing model. The audit trail is a DAG of cryptographic proof.

---

## 3. Three-Phase Startup Strategy

### Phase 1: Cloudflare-First (MVP)

| Platform Resource | Cloudflare Service | Purpose |
|---|---|---|
| Database | D1 (SQLite) | Relational data, audit events, usage records |
| Cache | KV | Session tokens, rate limit counters, config |
| Storage | R2 | Document blobs, audit archives |
| Search | Vectorize + D1 FTS5 | Semantic + fulltext hybrid search |
| Queue | Cloudflare Queues | Async event processing, ingestion pipeline |
| Compute | Workers | Service runtime |

### Phase 2: Portable Core

| Cloudflare Resource | Portable Alternative | Docker Image |
|---|---|---|
| D1 | PostgreSQL / SQLite | `postgres:15-alpine` |
| KV | Redis | `redis:7-alpine` |
| R2 | MinIO (S3-compatible) | `minio/minio:latest` |
| Vectorize | Qdrant / pgvector | `qdrant/qdrant:latest` |
| Queues | RabbitMQ / Kafka | `rabbitmq:3-management-alpine` |

### Phase 3: Self-Hostable

Full Kubernetes deployment with Helm charts, ArgoCD gitops, and horizontal pod autoscaling.

---

## 4. Nine-Layer Architecture (Updated with Capabilities Layer)

> **Phase 0.5 Update:** Added Capabilities Layer as Layer G for unified provider management with Runtime Mode auto-switching.

```
┌──────────────────────────────────────────────────────────┐
│  H. Apps Layer                                           │
│  api-worker (CF Workers) • web-console (SPA) • cli (mcx) │
├──────────────────────────────────────────────────────────┤
│  G. Runtimes Layer                                       │
│  Cloudflare • Node.js • Docker • Kubernetes              │
├──────────────────────────────────────────────────────────┤
│  F. Governance Layer (cross-cutting)                     │
│  Policy Engine • Audit Chain • Usage Metering            │
├──────────────────────────────────────────────────────────┤
│  E. Infrastructure Layer                                 │
│  Helm Charts • Docker Compose • Migrations • Contracts   │
├──────────────────────────────────────────────────────────┤
│  D. Adapters Layer                                       │
│  cloudflare-d1 • cloudflare-kv • cloudflare-r2 •        │
│  d1-full-text-search • openai • openrouter • workers-ai  │
├──────────────────────────────────────────────────────────┤
│  C. Application Layer                                    │
│  identity • workspace • knowledge • agent • model •      │
│  audit • usage • automation                              │
├──────────────────────────────────────────────────────────┤
│  B. Ports Layer                                          │
│  database • object-storage • search • model-provider •   │
│  queue • auth                                            │
├──────────────────────────────────────────────────────────┤
│  A. Core Layer                                           │
│  shared • service-catalog • resource-model •             │
│  policy-model • audit-model • knowledge-model            │
└──────────────────────────────────────────────────────────┘
```

**Dependency Direction:** A → B → C → D → E (governance F is cross-cutting, capabilities G provides provider abstraction to adapters D, runtimes H and apps I compose the stack)

### 4.1 Capabilities Layer (New - Phase 0.5)

**Purpose:** Provide unified provider management with Runtime Mode auto-switching, ensuring Platform Independence across cloud/on-premise environments.

**Key Components:**
- **CapabilityBase<T>**: Abstract base class for all providers
  - Lifecycle management (initialize, healthCheck, shutdown)
  - Automatic metrics collection (invocation, success, failure, latency)
  - Auto fallback trigger logic
  - Structured logging

- **ProviderFactory<T>**: Provider factory for runtime-aware provider selection
  - Four Runtime Modes: native/connected/hybrid/auto
  - Provider registration and management
  - Health monitoring with automatic fallback
  - Network detection for AUTO mode

- **Providers**: Categorized into three types:
  - **Native Providers** (`providers/native/`): Zero-dependency, fully offline-capable
    - Example: Memory Vector Store, Memory Cache, JWT Auth
  - **External Providers** (`providers/external/`): Third-party API dependencies
    - Example: OpenAI, Workers AI, Cloudflare D1/KV/R2
  - **Hybrid Providers** (`providers/hybrid/`): External with Native fallback
    - Example: Embedding (OpenAI → Native), Vector Store (Pinecone → Native Memory)

- **Runtime Manager**: Singleton for runtime configuration
  - Mode switching with structured logging
  - Environment detection (Cloudflare/Docker/Kubernetes)
  - Network probing (google/custom/dns/system)
  - Dependency verification

**Runtime Modes:**
| Mode | Description | Use Case |
|------|-------------|----------|
| `native` | Fully offline, zero external dependencies | Self-hosted, air-gapped, local dev |
| `connected` | Prefer external providers, require API keys | Cloud deployment, need AI capabilities |
| `hybrid` | External first, auto fallback to native | Production, high availability guarantee |
| `auto` | Auto-switch based on network/status | Dynamic environments, edge compute, dev |

**Implementation:** See `packages/capabilities/` for complete implementation

---

## 5. Eight Service Categories

The platform organizes all services into 8 categories, replacing the original 4-category structure (core/knowledge/ai/governance):

| Category | Description | Services |
|---|---|---|
| **knowledge** | Document management, ingestion, search | knowledge-store, knowledge-search, memory-dream (deferred) |
| **agent** | Conversational AI, autonomous agents | agent-chat |
| **workspace** | Multi-tenant collaboration | workspace |
| **developer** | Developer tooling and SDK | (extensible) |
| **security** | Authentication, authorization, secrets | identity |
| **storage** | Object storage, file management | (via adapters) |
| **model** | LLM endpoints, BYOK gateway | model-byok |
| **automation** | Background jobs, scheduled tasks | usage-meter, automation |

**URN Format:** `urn:mycodexvantaos:{category}:{kind}:{id}`

**Resource URI Example:** `urn:mycodexvantaos:knowledge:document:abc123`

---

## 6. Five Constitutional Models

### 6.1 Service Catalog
**File:** `contracts/service-definitions/service-catalog.yaml`

| Level | Services | Hard Dependencies |
|---|---|---|
| 0 | audit-log, identity | None |
| 1 | workspace, usage-meter | identity |
| 2 | knowledge-store, knowledge-search, model-byok | identity |
| 3 | agent-chat | knowledge-search, model-byok |

**Startup Order:** audit-log → identity → workspace, usage-meter → knowledge-store, knowledge-search, model-byok → agent-chat

### 6.2 Resource Model
**File:** `contracts/service-categories.yaml`
**Schema:** `contracts/schemas/universal-resource.schema.json`

**URN Format:** `urn:mycodexvantaos:{category}:{kind}:{id}`

**18 Resource Kinds:** subject, session, workspace, membership, collection, document, chunk, embedding, chat-session, chat-message, model-endpoint, audit-event, usage-record, policy, role, quota, knowledge-base, agent

**Lifecycle:** Pending → Active → Succeeded / Failed / Retiring → Retired

### 6.3 Policy Model
**File:** `contracts/service-definitions/service-catalog.yaml`
**Schema:** `contracts/schemas/policy-decision.schema.json`

**6 Roles:** system:admin, workspace:owner, workspace:admin, workspace:editor, workspace:viewer, workspace:agent

**14+ Policy Rules** with workspace-scoped RBAC isolation, MFA requirements, and tier-based rate limits.

### 6.4 Audit Model
**File:** `contracts/events/events.yaml`
**Schema:** `contracts/schemas/audit-event.schema.json`

**35+ Event Types** with SHA-256 integrity chain and closed-loop pairing (request→completion/failure via `pair_id`).

### 6.5 Knowledge Model
**File:** `contracts/schemas/knowledge-pipeline.schema.json`

**Evidence Levels:** knowledge-assisted, knowledge-verified, knowledge-grounded

**10 Knowledge Types:** document, chunk, embedding, collection, knowledge-base, search-result, ingestion-result, evidence, attribution, qa-pair

---

## 7. Port/Adapter Pattern (Hexagonal Architecture)

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
     │ adapters/      │ │ adapters/  │ │ adapters/  │
     │ cloudflare-d1  │ │ openai     │ │ workers-ai │
     │ cloudflare-kv  │ │ openrouter │ │ d1-fts     │
     │ cloudflare-r2  │ │            │ │            │
     └────────────────┘ └────────────┘ └────────────┘
```

| Port | Interface | Cloudflare Impl | Portable Impl |
|---|---|---|---|
| Database | `IDatabasePort` / `IRepository<T>` | D1 (cloudflare-d1) | PostgreSQL (node runtime) |
| Object Storage | `IObjectStoragePort` | R2 (cloudflare-r2) | MinIO/S3 (node runtime) |
| Cache | `ICachePort` (via KV) | KV (cloudflare-kv) | Redis (node runtime) |
| Search | `ISearchPort` / `IKnowledgeSearchPort` | D1 FTS5 (d1-full-text-search) | pgvector + GIN (postgres) |
| Model | `IChatModelPort` / `IEmbeddingModelPort` | Workers AI / OpenAI / OpenRouter | Same (fetch-based) |
| Queue | `IQueuePort` / `IJobQueuePort` | Cloudflare Queues | RabbitMQ (node runtime) |
| Auth | `IAuthPort` | JWT + KV sessions | JWT + Redis sessions |

---

## 8. Repository Structure

```
mycodexvantaos/
├── contracts/                          # Constitutional model definitions
│   ├── service-definitions/            #   8+ service YAML files + catalog
│   ├── service-categories.yaml         #   8-category classification system
│   ├── openapi/                        #   OpenAPI 3.1 specification (api-v1.yaml)
│   ├── events/                         #   CloudEvents v1.0 event definitions
│   └── schemas/                        #   JSON Schema validation files
├── packages/
│   ├── core/                           # Zero-dependency domain models
│   │   ├── shared/                     #   id, time, result, errors, pagination, metadata
│   │   ├── service-catalog/            #   ServiceDefinition, ServiceCategory
│   │   ├── resource-model/             #   ResourceKind, URN parsing
│   │   ├── policy-model/              #   PolicyDefinition, RBAC
│   │   ├── audit-model/               #   AuditEvent, integrity chain
│   │   └── knowledge-model/           #   Document, Chunk, Collection, Retrieval, Answer
│   ├── ports/                          # Platform-neutral interfaces
│   │   ├── database/                   #   IDatabasePort, IRepository<T>
│   │   ├── object-storage/             #   IObjectStoragePort
│   │   ├── search/                     #   ISearchPort, IKnowledgeSearchPort
│   │   ├── model-provider/             #   IChatModelPort, IEmbeddingModelPort
│   │   ├── queue/                      #   IQueuePort, IJobQueuePort
│   │   └── auth/                       #   IAuthPort
│   └── capabilities/                   # NEW - Provider management (Phase 0.5)
│       ├── base/                       #   CapabilityBase<T> abstract class
│       ├── factory/                    #   ProviderFactory<T> runtime-aware factory
│       ├── types/                      #   RuntimeMode, ProviderConfig, etc.
│       └── index.ts                    #   Module exports
│   ├── application/                    # 8 service business logic modules
│   │   ├── identity/                   #   IdentityService
│   │   ├── workspace/                  #   WorkspaceService
│   │   ├── knowledge/                  #   KnowledgeService
│   │   ├── agent/                      #   AgentService
│   │   ├── model/                      #   ModelService
│   │   ├── audit/                      #   AuditService
│   │   ├── usage/                      #   UsageService
│   │   └── automation/                 #   AutomationService
│   └── adapters/                       # Provider-specific implementations
│       ├── cloudflare-d1/              #   CloudflareD1Adapter, D1Repository<T>
│       ├── cloudflare-kv/              #   CloudflareKVCacheStore, CloudflareKVSessionStore
│       ├── cloudflare-r2/              #   CloudflareR2Adapter
│       ├── d1-full-text-search/        #   D1FullTextSearchAdapter
│       ├── openai/                     #   OpenAIChatAdapter, OpenAIEmbeddingAdapter
│       ├── openrouter/                 #   OpenRouterChatAdapter
│       └── workers-ai/                 #   WorkersAIChatAdapter, WorkersAIEmbeddingAdapter
├── apps/                               # Application entry points
│   ├── api-worker/                     #   Cloudflare Worker API (wrangler.toml)
│   ├── web-console/                    #   Admin SPA (HTML + TypeScript)
│   └── cli/                            #   CLI tool (mcx)
├── runtimes/                           # Multi-runtime bootstrap
│   ├── cloudflare/src/                 #   CloudflareServiceContainer, bindings
│   ├── node/src/                       #   NodeServiceContainer (portable)
│   ├── docker/                         #   Docker env mapping + shutdown handlers
│   └── kubernetes/                     #   K8s liveness/readiness/startup probes
├── migrations/                         # Database migrations
│   ├── sqlite/                         #   001_initial_schema.sql (D1-compatible)
│   ├── postgres/                       #   001_initial_schema.sql (pgvector + GIN)
│   └── d1/                             #   D1-specific migrations
├── infra/                              # Infrastructure configuration
│   ├── cloudflare/workers/             #   8 wrangler.toml files
│   ├── docker/                         #   Dockerfiles + gateway
│   ├── docker-compose/                 #   docker-compose.local.yaml + env.example
│   └── helm/mycodexvantaos/            #   Helm chart (12 templates)
├── docs/                               # Documentation
│   ├── api/                            #   API reference
│   ├── deployment/                     #   Deployment guide
│   └── operations/                     #   Operations runbook
├── tools/                              # Development tooling
│   ├── validators/                     #   validate-contracts.ts, validate-architecture.ts
│   └── generators/                     #   generate-service.ts, generate-adapter.ts
└── .github/workflows/                  # CI/CD pipelines
```

---

## 9. 8 MVP Services

| Service | Category | Level | Capabilities | Key Features |
|---|---|---|---|---|
| identity | security | 0 | 7 (auth.*) | JWT, RBAC, session management |
| workspace | workspace | 1 | 5 (workspace.*) | Multi-tenant, tier quotas |
| knowledge-store | knowledge | 2 | 6 (knowledge.*) | Ingestion pipeline, R2+Vectorize |
| knowledge-search | knowledge | 2 | 4 (knowledge.*) | Hybrid search, evidence levels |
| agent-chat | agent | 3 | 4 (chat.*) | 5-stage generation pipeline |
| model-byok | model | 2 | 5 (model.*) | Multi-provider BYOK gateway |
| audit-log | security | 0 | 4 (audit.*) | SHA-256 chain, closed-loop |
| usage-meter | automation | 1 | 5 (usage.*) | 8 dimensions, sliding-window |

---

## 10. Knowledge Pipeline

**Ingestion:** Upload → Validate → Extract → Chunk → Embed → Index → Verify

**Retrieval:** Query → Parse → Authorize → Search → Rank → Trace → Audit

**Generation:** Context → Assemble → Invoke → Attribute → Safety-Check → Audit

---

## 11. Event Specification

All platform events follow **CloudEvents v1.0** format as defined in `contracts/events/events.yaml`:

| Category | Events |
|---|---|
| knowledge | document.ingested, search.performed, issue.detected |
| agent | session.created, message.sent |
| workspace | created, member.added |
| security | subject.registered, token.created, permission.checked |
| model | endpoint.registered, invocation.completed |
| automation | job.enqueued, job.completed, job.failed |

---

## 12. Database Schema

The platform supports three database dialects via migrations:

| Dialect | File | Features |
|---|---|---|
| SQLite (D1) | `migrations/sqlite/001_initial_schema.sql` | FTS5 virtual tables, sync triggers |
| PostgreSQL | `migrations/postgres/001_initial_schema.sql` | UUID, JSONB, pgvector(1536) HNSW, GIN FTS |
| D1 (Cloudflare) | `migrations/d1/001_initial_schema.sql` | Cloudflare D1 specific |

**14 Tables:** identity_subjects, identity_sessions, workspaces, workspace_memberships, knowledge_collections, knowledge_documents, knowledge_chunks, knowledge_chunks_fts, agent_sessions, agent_messages, model_endpoints, audit_events, usage_events, automation_jobs

---

## 13. Infrastructure

### Cloudflare Workers (MVP)
- Single API worker with URL-based routing for all 8 service categories
- Queue consumer for async job processing (chunk-and-embed)
- Bindings: D1_DATABASE, KV_CACHE, KV_SESSION, R2_BUCKET, AI, QUEUE_JOBS

### Docker Compose (Development)
- PostgreSQL 15, Redis 7, MinIO, Qdrant, RabbitMQ
- API worker service with postgres migrations

### Kubernetes (Production)
- Helm chart with 12 templates: deployment, service, ingress, HPA, PDB, ServiceMonitor, secrets, configmap, serviceaccount, migration-job, workers
- Configurable worker pools via `values.workers`

---

## 14. Implementation Status

| Phase | Status | Description |
|---|---|---|
| Phase 1 — Service Categories | ✅ Complete | 8-category classification, service-categories.yaml |
| Phase 2 — Core Domain Models | ✅ Complete | 6 core sub-packages (shared, service-catalog, resource-model, policy-model, audit-model, knowledge-model) |
| Phase 3 — Ports Layer | ✅ Complete | 6 port packages (database, object-storage, search, model-provider, queue, auth) |
| Phase 4 — Application Services | ✅ Complete | 8 application service modules |
| Phase 5 — Adapters | ✅ Complete | 7 adapter packages (cloudflare-d1, cloudflare-kv, cloudflare-r2, d1-fts, openai, openrouter, workers-ai) |
| Phase 6 — Apps Layer | ✅ Complete | api-worker, web-console, cli |
| Phase 7 — Infrastructure | ✅ Complete | OpenAPI, events, migrations (sqlite+postgres), docker-compose, Helm chart |
| Phase 8 — Runtimes | ✅ Complete | cloudflare, node, docker, kubernetes bootstrap |
| Phase 9 — Docs & Tools | ✅ Complete | API/deployment/operations docs, validators, generators |
| Phase 10 — Cleanup & PR | ✅ Complete | Legacy packages removed, memory-dream deferred, CI updated |

---

_Architecture document maintained by the MyCodeXvantaOS platform team. Constitution design completed on 2025-05-15._
