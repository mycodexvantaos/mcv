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

## 4. Six-Layer Architecture

```
┌──────────────────────────────────────────────────────┐
│  F. Governance Layer                                  │
│  Policy Engine • Audit Chain • Usage Metering         │
├──────────────────────────────────────────────────────┤
│  E. Deployment Layer                                  │
│  Cloudflare Workers • Docker Compose • Kubernetes     │
├──────────────────────────────────────────────────────┤
│  D. Connector Layer                                   │
│  Adapters: Storage • Database • Cache • Search •      │
│  Model • Queue                                        │
├──────────────────────────────────────────────────────┤
│  C. Native Services Layer                             │
│  8 MVP Services: identity • workspace • knowledge •   │
│  chat • model • audit • usage                         │
├──────────────────────────────────────────────────────┤
│  B. Runtime & Execution Layer                         │
│  Cloudflare Runtime • Docker Runtime • Auto-Detect    │
├──────────────────────────────────────────────────────┤
│  A. Application Layer                                 │
│  Service Logic • Ports (interfaces) • Core (models)   │
└──────────────────────────────────────────────────────┘
```

**Dependency Direction:** A → B → C → D → E (governance F is cross-cutting)

---

## 5. Five Constitutional Models

### 5.1 Service Catalog
**File:** `contracts/service-definitions/service-catalog.yaml`

| Level | Services | Hard Dependencies |
|---|---|---|
| 0 | audit-log, identity | None |
| 1 | workspace, usage-meter | identity |
| 2 | knowledge-store, knowledge-search, model-byok | identity |
| 3 | agent-chat | knowledge-search, model-byok |

**Startup Order:** audit-log → identity → workspace, usage-meter → knowledge-store, knowledge-search, model-byok → agent-chat

### 5.2 Resource Model
**File:** `contracts/resource-model.yaml`  
**Schema:** `contracts/schemas/universal-resource.schema.json`

**URN Format:** `urn:mycodexvantaos:{kind}:{name}:{uuid}`

**18 Resource Kinds:** subject, session, workspace, membership, collection, document, chunk, embedding, chat-session, chat-message, model-endpoint, audit-event, usage-record, policy, role, quota, knowledge-base, agent

**Lifecycle:** Pending → Active → Succeeded / Failed / Retiring → Retired

### 5.3 Policy Model
**File:** `contracts/policy-model.yaml`  
**Schema:** `contracts/schemas/policy-decision.schema.json`

**6 Roles:** system:admin, workspace:owner, workspace:admin, workspace:editor, workspace:viewer, workspace:agent

**14+ Policy Rules** with workspace-scoped RBAC isolation, MFA requirements, and tier-based rate limits.

### 5.4 Audit Model
**File:** `contracts/audit-events.yaml`  
**Schema:** `contracts/schemas/audit-event.schema.json`

**35+ Event Types** with SHA-256 integrity chain and closed-loop pairing (request→completion/failure).

### 5.5 Knowledge Model
**File:** `contracts/knowledge-model.yaml`  
**Schema:** `contracts/schemas/knowledge-pipeline.schema.json`

**Evidence Levels:** knowledge-assisted, knowledge-verified, knowledge-grounded

**10 Knowledge Types:** document, chunk, embedding, collection, knowledge-base, search-result, ingestion-result, evidence, attribution, qa-pair

---

## 6. Port/Adapter Pattern

```
                    ┌─────────────┐
                    │ application/ │  ← Business logic
                    └──────┬──────┘
                           │ depends on
                    ┌──────▼──────┐
                    │   ports/     │  ← Interfaces only
                    └──────┬──────┘
                           │ implemented by
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼───┐ ┌─────▼─────┐ ┌───▼────────┐
     │ adapters/  │ │ adapters/  │ │ adapters/  │
     │ cloudflare/│ │  docker/   │ │  k8s/      │
     └────────────┘ └───────────┘ └────────────┘
```

| Port | Interface | Cloudflare Impl | Docker Impl |
|---|---|---|---|
| Storage | `IStoragePort` | R2 | MinIO (S3) |
| Database | `IDatabasePort` | D1 | PostgreSQL |
| Cache | `ICachePort` | KV | Redis |
| Search | `ISearchPort` | Vectorize + FTS5 | Qdrant + pgvector |
| Model | `IModelPort` | fetch (Workers) | fetch (Node) |
| Queue | `IQueuePort` | Cloudflare Queues | RabbitMQ |
| Audit | `IAuditPort` | D1 + R2 | PostgreSQL + S3 |
| Usage | `IUsagePort` | D1 + KV | PostgreSQL + Redis |

---

## 7. 8 MVP Services

| Service | Level | Capabilities | Key Features |
|---|---|---|---|
| identity | 0 | 7 (auth.*) | JWT, RBAC, session management |
| workspace | 1 | 5 (workspace.*) | Multi-tenant, tier quotas |
| knowledge-store | 2 | 6 (knowledge.*) | Ingestion pipeline, R2+Vectorize |
| knowledge-search | 2 | 4 (knowledge.*) | Hybrid search, evidence levels |
| agent-chat | 3 | 4 (chat.*) | 5-stage generation pipeline |
| model-byok | 2 | 5 (model.*) | Multi-provider BYOK gateway |
| audit-log | 0 | 4 (audit.*) | SHA-256 chain, closed-loop |
| usage-meter | 1 | 5 (usage.*) | 8 dimensions, sliding-window |

---

## 8. Knowledge Pipeline

**Ingestion:** Upload → Validate → Extract → Chunk → Embed → Index → Verify

**Retrieval:** Query → Parse → Authorize → Search → Rank → Trace → Audit

**Generation:** Context → Assemble → Invoke → Attribute → Safety-Check → Audit

---

## 9. Repository Structure

```
mycodexvantaos/
├── contracts/                      # Constitutional model definitions
│   ├── service-definitions/        #   8 service YAML files + catalog
│   └── schemas/                    #   5 JSON Schema validation files
├── core/                           # Zero-dependency core models
├── ports/                          # Platform-neutral interfaces
├── adapters/cloudflare/            # Cloudflare adapter implementations
├── application/                    # 8 service business logic files
├── runtimes/                       # Multi-runtime support
├── migrations/d1/                  # Database migrations
├── infra/                          # Infrastructure configs
│   ├── cloudflare/workers/         #   8 wrangler.toml files
│   ├── docker/                     #   Dockerfiles + gateway
│   └── docker-compose/             #   docker-compose.yaml
├── tools/                          # Development tools (3)
└── .github/workflows/              # CI/CD pipeline
```

---

## 10. Implementation Status

| Phase | Status | Description |
|---|---|---|
| Phase 1 — Platform Constitution | ✅ Complete | Five constitutional models |
| Phase 2 — Layered Architecture | ✅ Complete | core/, ports/, adapters/, application/ |
| Phase 3 — Service Definitions & Schemas | ✅ Complete | 8 YAML + 5 JSON Schema + D1 migration |
| Phase 4 — Infrastructure & Runtime | ✅ Complete | wrangler.toml, Docker, runtimes |
| Phase 5 — Tools, CI & Docs | ✅ Complete | Tools, CI workflow, architecture docs |
| Phase 6 — Push & PR | 📋 In Progress | Branch push + Pull Request |

---

_Architecture document maintained by the MyCodeXvantaOS platform team. Constitution design completed on 2025-05-15._
