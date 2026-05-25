# MyCodeXvantaOS — Platform Architecture Design

> **Cloudflare-First, Multi-Runtime, Self-Hostable AI-Native Service Platform**
> Organization: `mycodexvantaos` · NPM Scope: `@mycodexvantaos` · URN Namespace: `urn:mycodexvantaos`

---

## 1. Platform Overview

**MyCodeXvantaOS** is an AI-native Agent Operating System — a platform where AI agents can authenticate, access knowledge, invoke models, and produce auditable outcomes within a governed workspace. The architecture is defined by five immutable constitutional models, implemented through a clean port/adapter pattern, and deployable across multiple runtimes.

The platform follows a **five-phase startup strategy**: Cloudflare-first (MVP) → Portable Core (adapters/ports) → Self-hostable (Docker/K8s) → Governance Hardening → Release & Supply Chain. This approach ships fast on Cloudflare's global edge while ensuring the ultimate goal — vendor independence, constitutional governance, and supply chain integrity — is architecturally guaranteed from day one.

### Platform Identity

| Attribute            | Value                    |
| :------------------- | :----------------------- |
| Organization         | `mycodexvantaos`         |
| NPM Scope            | `@mycodexvantaos`        |
| URN Namespace        | `urn:mycodexvantaos`     |
| Primary Language     | TypeScript + Python      |
| Primary Runtime      | Cloudflare Workers       |
| Self-Hosted Runtime  | Node.js 22 (port 9100)   |
| Portable Runtime     | Docker / Kubernetes      |
| Architecture Pattern | Port/Adapter (Hexagonal) |
| Package Manager      | pnpm 9                   |
| License              | Proprietary              |

---

## 2. Design Philosophy

Three fundamental principles govern every design decision.

**Constitutional Governance.** Five core models form the immutable constitution of the platform. Every service, every API call, every data flow must conform to these models. The models are defined in human-readable YAML contracts under `contracts/` and validated by JSON Schemas. No service may bypass or override constitutional rules.

**Cloud-Vendor Independence.** The platform is cloudflare-first but not cloudflare-only. All cloud-specific logic lives behind port/adapter boundaries. The `core/` layer has zero cloud vendor dependencies. The `ports/` layer defines platform-neutral interfaces. The `adapters/` layer implements those interfaces for specific providers.

**Closed-Loop Auditability.** Every significant action produces an audit event. Events form a SHA3-512 integrity chain (SHA-256 secondary). Synchronous operations follow a request→completion/failure pairing model. The audit trail is a DAG of cryptographic proof.

---

## 3. Three-Phase Startup Strategy

### Phase 1: Cloudflare-First (MVP)

| Platform Resource | Cloudflare Service  | Purpose                                      |
| ----------------- | ------------------- | -------------------------------------------- |
| Database          | D1 (SQLite)         | Relational data, audit events, usage records |
| Cache             | KV                  | Session tokens, rate limit counters, config  |
| Storage           | R2                  | Document blobs, audit archives               |
| Search            | Vectorize + D1 FTS5 | Semantic + fulltext hybrid search            |
| Queue             | Cloudflare Queues   | Async event processing, ingestion pipeline   |
| Compute           | Workers             | Service runtime                              |

### Phase 2: Portable Core

| Cloudflare Resource | Portable Alternative  | Docker Image                   |
| ------------------- | --------------------- | ------------------------------ |
| D1                  | PostgreSQL / SQLite   | `postgres:15-alpine`           |
| KV                  | Redis                 | `redis:7-alpine`               |
| R2                  | MinIO (S3-compatible) | `minio/minio:latest`           |
| Vectorize           | Qdrant / pgvector     | `qdrant/qdrant:latest`         |
| Queues              | RabbitMQ / Kafka      | `rabbitmq:3-management-alpine` |

### Phase 3: Self-Hostable

Full Kubernetes deployment with Helm charts, ArgoCD gitops, and horizontal pod autoscaling.

### Phase 4: Governance Hardening

Policy engine with 8 hard + 9 soft enforcement flags. Runtime middleware enforcement: `withAudit()`, `withPolicy()`, knowledge trace, dream safety, architecture decisions. Governance specification in `governance/platform-governance-spec.yaml`.

### Phase 5: Release & Supply Chain

SBOM generation (CycloneDX 1.5 JSON), provenance attestation (SLSA v1 / in-toto Statement v1), artifact digests (SHA3-512 primary, SHA-256 secondary), 11-gate promotion evaluation, signing policy. RC validation pipeline: `rc:verify` → `rc:soak` → release artifact generation.

---

## 4. Nine-Layer Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  I. Apps Layer                                                │
│  api-worker (CF Workers) • api-node (Node.js API) •          │
│  web-console (SPA) • admin-console • cli (mcx)               │
├──────────────────────────────────────────────────────────────┤
│  H. Runtimes Layer                                            │
│  Cloudflare • Node.js (port 9100) • Docker • Kubernetes      │
├──────────────────────────────────────────────────────────────┤
│  G. Governance Layer (cross-cutting)                          │
│  Policy Engine • Audit Chain • Usage Metering •               │
│  Dream Safety • Architecture Decisions • Knowledge Trace     │
├──────────────────────────────────────────────────────────────┤
│  F. Release & Supply Chain Layer (cross-cutting)              │
│  SBOM (CycloneDX 1.5) • Provenance (SLSA v1) •              │
│  Artifact Digests (SHA3-512) • Promotion Gates • Signing     │
├──────────────────────────────────────────────────────────────┤
│  E. Infrastructure Layer                                      │
│  Helm Charts • Docker Compose • Migrations • Contracts        │
├──────────────────────────────────────────────────────────────┤
│  D. Adapters Layer                                            │
│  cloudflare-d1 • cloudflare-kv • cloudflare-r2 •             │
│  d1-full-text-search • openai • openrouter • workers-ai •    │
│  native-providers • hybrid-providers                          │
├──────────────────────────────────────────────────────────────┤
│  C. Application Layer                                         │
│  identity • workspace • knowledge • agent • model •           │
│  audit • usage • automation • memory • resource-registry      │
├──────────────────────────────────────────────────────────────┤
│  B. Ports Layer                                               │
│  database • object-storage • search • model-provider •        │
│  queue • auth                                                 │
├──────────────────────────────────────────────────────────────┤
│  A. Core Layer                                                │
│  shared • service-catalog • resource-model •                  │
│  policy-model • audit-model • knowledge-model •               │
│  memory-model • runtime-model • contracts-sdk                 │
└──────────────────────────────────────────────────────────────┘
```

**Dependency Direction:** A → B → C → D → E (governance G is cross-cutting; release & supply chain F is cross-cutting; runtimes H and apps I compose the stack)

### 4.1 Dual-Plane Architecture

MyCodeXvantaOS employs a **dual-plane architecture**:

- **TypeScript Control Plane** — Primary runtime handling API serving, governance enforcement, contract validation, and service orchestration. Runs on Cloudflare Workers (edge) or Node.js API server (self-hosted, port 9100).
- **Python Intelligence Plane** — Handles knowledge pipeline processing, agent orchestration, vector operations, evaluation, and memory dream. Python packages under `python/` connect to the control plane through the shared contract layer.

Both planes share the same constitutional contracts (`contracts/`), ensuring cross-language consistency and unified governance.

### 4.2 Governance Enforcement (Layer G)

The governance layer operates through runtime enforcement middleware on the Node.js API (`apps/api-node/`):

| Middleware            | Purpose                 | Endpoints Protected     |
| :-------------------- | :---------------------- | :---------------------- |
| `withAudit()`         | Audit trail integrity   | All mutating operations |
| `withPolicy()`        | RBAC policy enforcement | All /v1/\* endpoints    |
| Knowledge Trace       | Evidence-level tracking | /v1/knowledge/\*        |
| Dream Safety          | Review/rollback gates   | /v1/dream/\*            |
| Architecture Decision | Design governance       | /v1/contracts/validate  |

Governance is enforced by 8 hard + 9 soft flags defined in `governance/platform-governance-spec.yaml` (17 total checks, 24 governance checks via `pnpm governance:check`).

### 4.3 Release & Supply Chain (Layer F)

The release and supply chain layer provides end-to-end artifact integrity:

| Component        | Format                                 | Purpose                       |
| :--------------- | :------------------------------------- | :---------------------------- |
| SBOM             | CycloneDX 1.5 JSON                     | Software bill of materials    |
| Provenance       | SLSA v1 / in-toto Statement v1         | Build provenance attestation  |
| Artifact Digests | SHA3-512 primary, SHA-256 secondary    | Content-addressable integrity |
| Promotion Gates  | 11-gate evaluation                     | Stable release readiness      |
| Signing Policy   | `release/policies/signing-policy.json` | Release signing requirements  |

**Pipeline:** `rc:verify` → `rc:soak` → `release:artifacts` → `release:sbom` → `release:provenance` → `release:promotion:evaluate`

**Classifications:** `signing-not-configured` and `infrastructure-not-configured` are acceptable skips for v0.1.0 (9/11 gates pass).

## 5. Service Categories

The platform organizes all 15 services into 8 categories:

| Category       | Description                            | Services                                                         |
| -------------- | -------------------------------------- | ---------------------------------------------------------------- |
| **knowledge**  | Document management, ingestion, search | knowledge-store, knowledge-search, knowledge-trace, memory-dream |
| **agent**      | Conversational AI, autonomous agents   | agent-chat                                                       |
| **workspace**  | Multi-tenant collaboration             | workspace                                                        |
| **developer**  | Developer tooling and SDK              | (extensible)                                                     |
| **security**   | Authentication, authorization, secrets | identity, audit-log                                              |
| **storage**    | Object storage, file management        | (via adapters)                                                   |
| **model**      | LLM endpoints, BYOK gateway            | model-byok                                                       |
| **automation** | Background jobs, scheduled tasks       | usage-meter, automation, resource-registry                       |

**URN Format:** `urn:mycodexvantaos:{category}:{kind}:{id}`

**Resource URI Example:** `urn:mycodexvantaos:knowledge:document:abc123`

---

## 6. Five Constitutional Models

### 6.1 Service Catalog

**File:** `contracts/service-definitions/` (15 service YAML files + catalog)

| Level | Services                                                       | Hard Dependencies            |
| ----- | -------------------------------------------------------------- | ---------------------------- |
| 0     | audit-log, identity                                            | None                         |
| 1     | workspace, usage-meter, resource-registry                      | identity                     |
| 2     | knowledge-store, knowledge-search, knowledge-trace, model-byok | identity                     |
| 3     | agent-chat, memory-store, memory-capture, memory-dream         | knowledge-search, model-byok |

**Startup Order:** audit-log → identity → workspace, usage-meter, resource-registry → knowledge-store, knowledge-search, knowledge-trace, model-byok → agent-chat, memory-store, memory-capture, memory-dream

### 6.2 Resource Model

**File:** `contracts/resource-kinds/` (16 resource kind YAML files)
**Schema:** `contracts/schemas/universal-resource.schema.json`

**URN Format:** `urn:mycodexvantaos:{category}:{kind}:{id}`

**16 Resource Kinds** defined as YAML files under `contracts/resource-kinds/`, with URN addressing and lifecycle states.

**Lifecycle:** Pending → Active → Succeeded / Failed / Retiring → Retired

### 6.3 Policy Model

**File:** `contracts/service-definitions/service-catalog.yaml`
**Schema:** `contracts/schemas/policy-decision.schema.json`

**6 Roles:** system:admin, workspace:owner, workspace:admin, workspace:editor, workspace:viewer, workspace:agent

**14+ Policy Rules** with workspace-scoped RBAC isolation, MFA requirements, and tier-based rate limits.

### 6.4 Audit Model

**File:** `contracts/events/` (7 event YAML files)
**Schema:** `contracts/schemas/audit-event.schema.json`

**35+ Event Types** with SHA3-512 integrity chain (SHA-256 secondary) and closed-loop pairing (request→completion/failure via `pair_id`).

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

| Port           | Interface                                | Cloudflare Impl                  | Portable Impl             |
| -------------- | ---------------------------------------- | -------------------------------- | ------------------------- |
| Database       | `IDatabasePort` / `IRepository<T>`       | D1 (cloudflare-d1)               | PostgreSQL (node runtime) |
| Object Storage | `IObjectStoragePort`                     | R2 (cloudflare-r2)               | MinIO/S3 (node runtime)   |
| Cache          | `ICachePort` (via KV)                    | KV (cloudflare-kv)               | Redis (node runtime)      |
| Search         | `ISearchPort` / `IKnowledgeSearchPort`   | D1 FTS5 (d1-full-text-search)    | pgvector + GIN (postgres) |
| Model          | `IChatModelPort` / `IEmbeddingModelPort` | Workers AI / OpenAI / OpenRouter | Same (fetch-based)        |
| Queue          | `IQueuePort` / `IJobQueuePort`           | Cloudflare Queues                | RabbitMQ (node runtime)   |
| Auth           | `IAuthPort`                              | JWT + KV sessions                | JWT + Redis sessions      |

---

## 8. Repository Structure

```
mycodexvantaos/
├── contracts/                          # Constitutional model definitions
│   ├── service-definitions/            #   15 service YAML files + catalog
│   ├── service-categories.yaml         #   8-category classification system
│   ├── openapi/                        #   OpenAPI 3.1 specification (api-v1.yaml)
│   ├── resource-kinds/                 #   16 resource kind YAML files
│   ├── events/                         #   7 CloudEvents v1.0 event YAML files
│   ├── policies/                       #   5 policy YAML files
│   └── schemas/                        #   14 JSON Schema validation files
├── packages/
│   ├── core/                           # Zero-dependency domain models (9 packages)
│   │   ├── shared/                     #   id, time, result, errors, pagination, metadata
│   │   ├── service-catalog/            #   ServiceDefinition, ServiceCategory
│   │   ├── resource-model/             #   ResourceKind, URN parsing
│   │   ├── policy-model/              #   PolicyDefinition, RBAC
│   │   ├── audit-model/               #   AuditEvent, integrity chain
│   │   ├── knowledge-model/           #   Document, Chunk, Collection, Retrieval, Answer
│   │   ├── memory-model/              #   Memory, Dream, Recall models
│   │   ├── runtime-model/             #   RuntimeAdapter, RuntimeMode
│   │   └── contracts-sdk/             #   Cross-language contract utilities
│   ├── ports/                          # Platform-neutral interfaces
│   │   ├── database/                   #   IDatabasePort, IRepository<T>
│   │   ├── object-storage/             #   IObjectStoragePort
│   │   ├── search/                     #   ISearchPort, IKnowledgeSearchPort
│   │   ├── model-provider/             #   IChatModelPort, IEmbeddingModelPort
│   │   ├── queue/                      #   IQueuePort, IJobQueuePort
│   │   └── auth/                       #   IAuthPort
│   ├── capabilities/                   # Provider management with Runtime Mode auto-switching
│   │   ├── base/                       #   CapabilityBase<T> abstract class
│   │   ├── factory/                    #   ProviderFactory<T> runtime-aware factory
│   │   ├── types/                      #   RuntimeMode, ProviderConfig, etc.
│   │   └── index.ts                    #   Module exports
│   ├── application/                    # Service business logic modules
│   │   ├── identity/                   #   IdentityService
│   │   ├── workspace/                  #   WorkspaceService
│   │   ├── knowledge/                  #   KnowledgeService
│   │   ├── agent/                      #   AgentService
│   │   ├── model/                      #   ModelService
│   │   ├── audit/                      #   AuditService
│   │   ├── usage/                      #   UsageService
│   │   ├── automation/                 #   AutomationService
│   │   ├── memory/                     #   MemoryService
│   │   └── resource-registry/          #   ResourceRegistryService
│   ├── adapters/                       # Provider-specific implementations
│   │   ├── cloudflare-d1/              #   CloudflareD1Adapter, D1Repository<T>
│   │   ├── cloudflare-kv/              #   CloudflareKVCacheStore, CloudflareKVSessionStore
│   │   ├── cloudflare-r2/              #   CloudflareR2Adapter
│   │   ├── d1-full-text-search/        #   D1FullTextSearchAdapter
│   │   ├── openai/                     #   OpenAIChatAdapter, OpenAIEmbeddingAdapter
│   │   ├── openrouter/                 #   OpenRouterChatAdapter
│   │   └── workers-ai/                 #   WorkersAIChatAdapter, WorkersAIEmbeddingAdapter
│   └── providers/                      # Provider adapter packages
│       ├── mycodexvantaos-provider-cloudflare-d1/
│       ├── mycodexvantaos-provider-cloudflare-kv/
│       ├── mycodexvantaos-provider-cloudflare-r2/
│       ├── mycodexvantaos-provider-cloudflare-workers-ai/
│       └── mycodexvantaos-provider-cloudflare-vectorize/
├── apps/                               # Application entry points (5 apps)
│   ├── api-worker/                     #   Cloudflare Worker API (wrangler.toml)
│   ├── api-node/                       #   Node.js API server (port 9100, /v1/* endpoints)
│   ├── web-console/                    #   Admin SPA (HTML + TypeScript)
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
├── runtimes/                           # Multi-runtime bootstrap
│   ├── cloudflare/src/                 #   CloudflareServiceContainer, bindings
│   ├── node/src/                       #   NodeServiceContainer (portable)
│   ├── local/                          #   Local development runtime
│   ├── docker/                         #   Docker env mapping + shutdown handlers
│   └── kubernetes/                     #   K8s liveness/readiness/startup probes
├── release/                            # Release artifacts and policies
│   ├── artifacts/                      #   Release artifact generators
│   └── policies/                       #   Release policies (signing-policy.json)
├── migrations/                         # Database migrations
│   ├── sqlite/                         #   001_initial_schema.sql (D1-compatible)
│   ├── postgres/                       #   001_initial_schema.sql (pgvector + GIN)
│   └── d1/                             #   D1-specific migrations (9 files)
├── governance/                         # Platform governance specification
│   └── platform-governance-spec.yaml   #   8 hard + 9 soft enforcement flags
├── infra/                              # Infrastructure configuration
│   ├── cloudflare/workers/             #   8 wrangler.toml files
│   ├── docker/                         #   Dockerfiles + gateway
│   ├── docker-compose/                 #   docker-compose.local.yaml + env.example
│   └── helm/mycodexvantaos/            #   Helm chart (12 templates)
├── docs/                               # Documentation
│   ├── architecture/                   #   Architecture design documents
│   ├── releases/                       #   Release notes (v0.1.0.md)
│   ├── security/                       #   Security documents (release-signing.md)
│   ├── api/                            #   API reference
│   ├── deployment/                     #   Deployment guide
│   └── operations/                     #   Operations runbook
├── tools/                              # Development tooling
│   ├── validators/                     #   validate-contracts.ts, validate-architecture.ts
│   ├── generators/                     #   generate-service.ts, generate-adapter.ts
│   ├── dream/                          #   Dream dry-run tools
│   ├── audit/                          #   Audit tools
│   ├── seed/                           #   Seed data tools
│   └── migrations/                     #   Migration verification tools
└── .github/workflows/                  # 49 CI/CD pipeline configurations
```

---

## 9. Service Catalog (15 Services)

| Service           | Category   | Level | Capabilities     | Key Features                         |
| ----------------- | ---------- | ----- | ---------------- | ------------------------------------ |
| identity          | security   | 0     | 7 (auth.\*)      | JWT, RBAC, session management        |
| audit-log         | security   | 0     | 4 (audit.\*)     | SHA3-512 chain, closed-loop          |
| workspace         | workspace  | 1     | 5 (workspace.\*) | Multi-tenant, tier quotas            |
| usage-meter       | automation | 1     | 5 (usage.\*)     | 8 dimensions, sliding-window         |
| resource-registry | automation | 1     | 4 (resource.\*)  | URN-addressed resource lifecycle     |
| knowledge-store   | knowledge  | 2     | 6 (knowledge.\*) | Ingestion pipeline, R2+Vectorize     |
| knowledge-search  | knowledge  | 2     | 4 (knowledge.\*) | Hybrid search, evidence levels       |
| knowledge-trace   | knowledge  | 2     | 3 (trace.\*)     | Evidence-level tracking, attribution |
| model-byok        | model      | 2     | 5 (model.\*)     | Multi-provider BYOK gateway          |
| agent-chat        | agent      | 3     | 4 (chat.\*)      | 5-stage generation pipeline          |
| memory-store      | knowledge  | 3     | 3 (memory.\*)    | Persistent memory, recall            |
| memory-capture    | knowledge  | 3     | 3 (memory.\*)    | Memory ingestion, deduplication      |
| memory-dream      | knowledge  | 3     | 4 (dream.\*)     | Autonomous review, apply/rollback    |
| service-workspace | workspace  | 1     | 3 (svc.\*)       | Service-level workspace management   |
| automation        | automation | 1     | 3 (auto.\*)      | Background jobs, scheduled tasks     |

---

## 10. Knowledge Pipeline

**Ingestion:** Upload → Validate → Extract → Chunk → Embed → Index → Verify

**Retrieval:** Query → Parse → Authorize → Search → Rank → Trace → Audit

**Generation:** Context → Assemble → Invoke → Attribute → Safety-Check → Audit

---

## 11. Event Specification

All platform events follow **CloudEvents v1.0** format as defined in `contracts/events/` (7 event YAML files):

| Category   | Events                                                              |
| ---------- | ------------------------------------------------------------------- |
| knowledge  | document.ingested, search.performed, issue.detected, trace.recorded |
| agent      | session.created, message.sent                                       |
| workspace  | created, member.added                                               |
| security   | subject.registered, token.created, permission.checked               |
| model      | endpoint.registered, invocation.completed                           |
| automation | job.enqueued, job.completed, job.failed                             |
| memory     | memory.captured, dream.initiated, dream.reviewed, dream.applied     |

---

## 12. Python Intelligence Plane

The Python Intelligence Plane complements the TypeScript Control Plane by handling compute-intensive AI workloads:

### Packages (5)

| Package                             | Purpose                                                   |
| :---------------------------------- | :-------------------------------------------------------- |
| `mycodexvantaos-knowledge-pipeline` | Document ingestion, chunking, embedding orchestration     |
| `mycodexvantaos-agent-worker`       | Agent execution, tool invocation, conversation management |
| `mycodexvantaos-vector-tools`       | Vector similarity search, embedding utilities             |
| `mycodexvantaos-evaluation`         | Model evaluation, benchmarking, quality metrics           |
| `mycodexvantaos-memory-dream`       | Memory dream cycle — review, apply, rollback              |

### Apps (3)

| App                | Purpose                                  |
| :----------------- | :--------------------------------------- |
| `knowledge-worker` | Background knowledge pipeline processing |
| `agent-worker`     | Agent task execution worker              |
| `dream-worker`     | Memory dream cycle processing worker     |

### Cross-Plane Integration

Python packages connect to the TypeScript control plane through:

- **Shared contracts** (`contracts/`) — JSON Schema validation for cross-language consistency
- **Cross-language contract check** CI workflow validates schema compatibility
- **API endpoints** — Python workers consume/produce via the Node.js API (`/v1/*`)

---

## 13. Database Schema

The platform supports three database dialects via migrations:

| Dialect         | File                                         | Features                                  |
| --------------- | -------------------------------------------- | ----------------------------------------- |
| SQLite (D1)     | `migrations/sqlite/001_initial_schema.sql`   | FTS5 virtual tables, sync triggers        |
| PostgreSQL      | `migrations/postgres/001_initial_schema.sql` | UUID, JSONB, pgvector(1536) HNSW, GIN FTS |
| D1 (Cloudflare) | `migrations/d1/001_initial_schema.sql`       | Cloudflare D1 specific                    |

**14 Tables:** identity_subjects, identity_sessions, workspaces, workspace_memberships, knowledge_collections, knowledge_documents, knowledge_chunks, knowledge_chunks_fts, agent_sessions, agent_messages, model_endpoints, audit_events, usage_events, automation_jobs

---

## 14. Infrastructure

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

## 15. Implementation Status

| Phase                             | Status      | Description                                                                                                                                           |
| --------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 1 — Service Categories      | ✅ Complete | 8-category classification, service-categories.yaml                                                                                                    |
| Phase 2 — Core Domain Models      | ✅ Complete | 9 core sub-packages (shared, service-catalog, resource-model, policy-model, audit-model, knowledge-model, memory-model, runtime-model, contracts-sdk) |
| Phase 3 — Ports Layer             | ✅ Complete | 6 port packages (database, object-storage, search, model-provider, queue, auth)                                                                       |
| Phase 4 — Application Services    | ✅ Complete | 10+ application service modules (identity, workspace, knowledge, agent, model, audit, usage, automation, memory, resource-registry)                   |
| Phase 5 — Adapters                | ✅ Complete | 7 adapter packages + 5 Cloudflare providers                                                                                                           |
| Phase 6 — Apps Layer              | ✅ Complete | 5 apps (api-worker, api-node, web-console, admin-console, cli)                                                                                        |
| Phase 7 — Infrastructure          | ✅ Complete | OpenAPI, events, migrations (sqlite+postgres+D1), docker-compose, Helm chart                                                                          |
| Phase 8 — Runtimes                | ✅ Complete | cloudflare, node, local, docker, kubernetes bootstrap                                                                                                 |
| Phase 9 — Docs & Tools            | ✅ Complete | API/deployment/operations docs, validators, generators, dream tools, audit tools                                                                      |
| Phase 10 — Platform Expansion     | ✅ Complete | Python intelligence plane (5 packages + 3 apps), memory-dream, resource-registry, knowledge-trace                                                     |
| Phase 11 — Governance Hardening   | ✅ Complete | Policy engine, audit middleware, dream safety, architecture decisions, governance spec (8 hard + 9 soft flags)                                        |
| Phase 12 — Release & Supply Chain | ✅ Complete | SBOM (CycloneDX 1.5), provenance (SLSA v1), artifact digests (SHA3-512), promotion gates, signing policy                                              |
| Phase 13 — RC Validation          | ✅ Complete | RC verify (8 categories), RC soak (19/19 checks), promotion evaluation (9/11 pass), stable release draft                                              |

---

_Architecture document maintained by the MyCodeXvantaOS platform team. Last updated for v0.1.0 stable._
