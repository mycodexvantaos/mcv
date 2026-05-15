# Platform Constitution

> **Version:** 1.0.0  
> **Date:** 2024-05-15  
> **Status:** Active — Documented  
> **Spectrum:** Spectrum-00 (Foundation) → Spectrum-07 (Agent Control)  
> **Related Contracts:** `contracts/*.yaml`  

---

<div align="center">

# MyCodeXvantaOS — Platform Constitution

**Five Immutable Models · Eight Service Categories · Constitutional Governance**

[![Platform Constitution CI](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/platform-constitution-ci.yml/badge.svg)](https://github.com/mycodexvantaos/mycodexvantaos/actions/workflows/platform-constitution-ci.yml)

</div>

---

## Overview

The MyCodeXvantaOS Platform Constitution is the foundational governance framework that defines how the platform operates, how services interact, and how resources are managed. It consists of **five constitutional models**, **eight service categories**, and an **eight-layer hexagonal architecture** that together create a governance-ready, AI-native service operating system.

**Design Philosophy:**
- **Constitutional:** The constitution is immutable — no service may bypass or override constitutional rules
- **Contract-First:** All models are defined in human-readable YAML contracts under `contracts/`
- **Governance-Ready:** Every action is auditable, every resource is governed, every policy is enforced
- **Cloud-Vendor Independent:** Cloudflare-first but architecturally guaranteed vendor independence

---

## The Five Constitutional Models

MyCodeXvantaOS is governed by five core constitutional models. These models form the immutable constitution of the platform.

```
┌─────────────────────────────────────────────────────────────┐
│                  Service Catalog Model                      │
│            "What services are available?"                   │
├─────────────────────────────────────────────────────────────┤
│                   Resource Model                            │
│        "What resources exist and how are they managed?"     │
├─────────────────────────────────────────────────────────────┤
│                   Policy Model                              │
│      "Who can do what to which resources and when?"         │
├─────────────────────────────────────────────────────────────┤
│                   Audit Model                               │
│            "What happened and when?"                        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                Knowledge Model (+ Memory Dream)             │
│     "How is knowledge stored, retrieved, and evolved?"      │
└─────────────────────────────────────────────────────────────┘
```

### 1. Service Catalog Model

**Contract:** [`contracts/service-categories.yaml`](../../contracts/service-categories.yaml)

**Purpose:** Defines the AWS-like service catalog that organizes all platform capabilities into productized, searchable, enableable services.

**Key Concepts:**
- **8 Service Categories:** knowledge, agent, workspace, developer, security, storage, model, automation
- **Service Definition Schema:** Every service has a standardized YAML definition
- **Discovery Protocol:** Services can be discovered, queried, and enabled/disable
- **Category-Based Navigation:** Organized services for user-facing console

**Eight Service Categories:**

| Category | Purpose | Icon | Services |
|----------|---------|------|----------|
| **Knowledge** | Knowledge ingestion, storage, search, trace | 🧠 | Knowledge Store, Knowledge Search, Knowledge Trace |
| **Agent** | AI agent orchestration and interaction | 🤖 | Agent Chat, Agent Router, Agent Execution |
| **Workspace** | Multi-tenant workspace isolation | 📁 | Workspace, Identity, Session Management |
| **Developer** | Development tools and services | 👨‍💻 | Service Catalog, Resource Registry, Policy Engine |
| **Security** | Security and governance | 🔒 | Audit Log, Policy Engine, Access Control |
| **Storage** | Data storage and retrieval | 💾 | Storage, Vector Store, Database |
| **Model** | AI model management | 🎯 | Model BYOK, Model Orchestration |
| **Automation** | Automation and workflow engine | ⚙️ | Usage Meter, Memory Dream, Workflow Engine |

**Service Definition Example:**

```yaml
apiVersion: platform.mycodevantaos/v1
kind: ServiceDefinition
metadata:
  id: knowledge-store
  name: Knowledge Store
  category: knowledge
  phase: mvp
spec:
  description: Document and chunk storage with indexing pipeline
  api:
    basePath: /v1/knowledge/documents
    operations:
      - POST: Create document
      - GET: List documents
      - GET: Get document by ID
  resources:
    - kind: Document
      operations: [create, read, update, delete]
  capabilities:
    - document-ingestion
    - chunking
    - metadata-extraction
    - full-text-indexing
    - semantic-indexing
```

**Resources:**
- [Service Categories Reference](../../architecture/service-catalog/service-categories.md)
- [Service Registration Guide](../../onboarding/service-creation-guide.md)

---

### 2. Resource Model

**Contract:** [`contracts/resource-model.yaml`](../../contracts/resource-model.yaml)

**Purpose:** Defines the universal resource language for the platform. Every entity is a resource with standard schema, lifecycle state machine, and URN reference.

**Key Concepts:**
- **Universal Schema:** Every resource has `metadata / spec / status` structure
- **URN Format:** Canonical reference `urn:mycodexvantaos:{category}:{kind}:{id}`
- **Lifecycle State Machine:** Phases: Creating → Ready → Degraded → Terminating
- **Workspace-Scoped:** All resources belong to a workspace (isolation boundary)

**Resource Schema:**

```yaml
apiVersion: platform.mycodevantaos/v1
kind: ResourceKind
metadata:
  name: Document
  namespace: mycodexvantaos-system
spec:
  schema:
    required_top_level: [apiVersion, kind, metadata, spec]
    metadata:
      required: [id, urn, kind, workspaceId, createdAt, updatedAt]
      fields:
        id: { type: string, format: uuidv4 }
        urn: { type: string, format: urn }
        kind: { type: string }
        workspaceId: { type: string, format: uuidv4 }
    spec:
      description: "Desired state — defined by resource kind"
    status:
      required: [phase, conditions]
      fields:
        phase: { type: string }  # Creating, Ready, Degraded, Terminating
        conditions: { type: "array<Condition>" }
```

**URN Format:**

```
urn:mycodexvantaos:knowledge:document:550e8400-e29b-41d4-a716-446655440000
urn:mycodexvantaos:agent:chat:660e8400-e29b-41d4-a716-446655440001
urn:mycodexvantaos:workspace:project:770e8400-e29b-41d4-a716-446655440002
```

**Lifecycle State Machine:**

```
┌─────────┐      ┌────────┐      ┌────────┐      ┌─────────────┐
│ Creating ├─────►│ Ready  ├─────►│Degraded ├─────►│ Terminating │
└─────────┘      └────────┘      └────────┘      └─────────────┘
       │                                     │
       └─────────────────────────────────────┘
```

**Resources:**
- [Resource Model Reference](../../architecture/resource-model/README.md)
- [Resource Kinds Reference](../../contracts/resource-kinds.md)

---

### 3. Policy Model

**Contract:** [`contracts/policy-model.yaml`](../../contracts/policy-model.yaml)

**Purpose:** Defines the permission framework, role hierarchy, and policy rules. Every access decision is evaluated against this model at runtime.

**Key Concepts:**
- **Subject-Action-Resource:** Core policy tuple: who can do what to which resource
- **Role Hierarchy:** Platform Admin → Workspace Admin → Developer → Viewer
- **Workspace-Scoped Isolation:** Fundamental security boundary
- **Policy-as-Code:** Every policy is defined in YAML and evaluated at runtime

**Policy Schema:**

```yaml
apiVersion: platform.mycodevantaos/v1
kind: Policy
metadata:
  id: workspace-admin-policy
  name: Workspace Administrator Policy
spec:
  priority: 100
  enabled: true
  subject:
    role: workspace-admin
    workspace_scope: same-workspace
  action:
    - "workspace:*"
    - "knowledge:*"
    - "agent:*"
    - "model:*"
  resource:
    kind: "*"
    scope: workspace
  effect: allow
  condition:
    workspaceId: $request.workspaceId
```

**Role Hierarchy:**

| Role | Scope | Permissions | Constraints |
|------|-------|-------------|-------------|
| **Platform Admin** | Platform | Full platform control | Cannot delete platform config |
| **Workspace Admin** | Workspace | Full workspace control | Cannot delete workspace itself |
| **Developer** | Workspace | Create/read resources | Cannot manage other users |
| **Viewer** | Workspace | Read-only access | Cannot write any resource |

**Policy Evaluation Flow:**

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌────────────┐
│ Request  ├───►│ Subject   ├───►│ Action   ├───►│   Policy    │
└──────────┘    │ Info      │    │ Analysis │    │ Evaluation │
                └───────────┘    └──────────┘    └────────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │ Effect: Allow  │
                                              │       or       │
                                              │ Effect: Deny   │
                                              └─────────────────┘
```

**Resources:**
- [Policy Model Reference](../../architecture/policy-governance/README.md)
- [Policy Examples](../../contracts/policies.md)

---

### 4. Audit Model

**Contract:** [`contracts/audit-events.yaml`](../../contracts/audit-events.yaml)

**Purpose:** Defines the audit event schema and append-only integrity chain. Every significant action produces an audit event.

**Key Concepts:**
- **Audit Event Schema:** Standardized event format with actor, resource, action, outcome
- **Append-Only Log:** Audit events cannot be deleted or modified
- **SHA-256 Integrity Chain:** Each event hash-links to previous event (tamper-evident DAG)
- **Closed-Loop Governance:** Request → Completion/Failure pairing with `pair_id`
- **Compliance:** GDPR-ready audit trail with full traceability

**Audit Event Schema:**

```yaml
apiVersion: platform.mycodevantaos/v1
kind: AuditEvent
metadata:
  id: 550e8400-e29b-41d4-a716-446655440000
  urn: urn:mycodexvantaos:audit:event:550e8400-e29b-41d4-a716-446655440000
spec:
  timestamp: 2024-05-15T12:00:00Z
  actor:
    id: user-123
    type: human|machine
    workspaceId: ws-456
  action:
    type: create
    target: document
    resourceId: doc-789
  outcome:
    status: success|failure
    reason: "Document created successfully"
  integrity:
    sha256: "abc123..."
    previousEventId: evt-001
```

**SHA-256 Integrity Chain:**

```
Event 1 (hash: abc123)
    │
    ├─ sha256(Event 1) → stored in Event 2
    ▼
Event 2 (hash: def456, previousEventId: Event 1)
    │
    ├─ sha256(Event 2) → stored in Event 3
    ▼
Event 3 (hash: ghi789, previousEventId: Event 2)
```

**Closed-Loop Governance:**

```yaml
# Request Event
- type: document.create.request
  pairId: req-001
  resourceId: doc-789

# Completion Event
- type: document.create.completion
  pairId: req-001
  matches: true
  resourceId: doc-789
```

**Resources:**
- [Audit Model Reference](../../architecture/audit-trace/README.md)
- [Audit Events Reference](../../contracts/events/audit-events.md)

---

### 5. Knowledge Model

**Contract:** [`contracts/knowledge-model.yaml`](../../contracts/knowledge-model.yaml)

**Purpose:** Defines how knowledge is stored, chunked, indexed, retrieved, and traced. Documents become operational substrate — parseable, searchable, citable, repairable, and promotable to memory.

**Key Concepts:**
- **Document Model:** Document → Chunks → Metadata → Indexing
- **Retrieval Receipt:** Proof of which chunks were retrieved for each query
- **Answer Trace:** Source linking from agent answers back to retrieved chunks
- **Knowledge Issues:** Automatic detection of knowledge conflicts, gaps, inconsistencies
- **Memory Promotion:** High-quality knowledge can be promoted to agent memory

**Knowledge Flow:**

```
┌────────────┐     ┌─────────┐     ┌────────┐     ┌────────────┐
│  Document  ├────►│ Chunks  ├────►│ Search ├────►│ Retrieval  │
│   Ingest   │     │         │     │        │     │  Receipt   │
└────────────┘     └─────────┘     └────────┘     └────────────┘
                                                         │
                                            ┌────────────▼────────┐
                                            │   Answer Trace      │
                                            │  (Source Linking)   │
                                            └─────────────────────┘
```

**Retrieval Receipt:**

```yaml
apiVersion: platform.mycodevantaos/v1
kind: RetrievalReceipt
metadata:
  id: rr-001
spec:
  query: "What is the architecture?"
  retrievedAt: 2024-05-15T12:00:00Z
  chunks:
    - documentId: doc-001
      chunkId: chunk-001
      score: 0.95
      source: "architectural-overview.md#L10"
  traceId: trace-001
```

**Answer Trace:**

```yaml
apiVersion: platform.mycodevantaos/v1
kind: AnswerTrace
metadata:
  id: at-001
spec:
  question: "What is the architecture?"
  answer: "The platform follows..."
  sources:
    - chunkId: chunk-001
      documentId: doc-001
      confidence: 0.95
  citations:
    - source: "architectural-overview.md#L10"
      quote: "The platform follows a three-phase strategy"
```

**Resources:**
- [Knowledge Model Reference](../../architecture/knowledge-layer/README.md)
- [Knowledge Trace Guide](../../architecture/knowledge-layer/retrieval-receipt.md)

---

### Bonus: Memory Dream Runtime

**Contract:** [`contracts/service-definitions/memory-dream.yaml`](../../contracts/service-definitions/memory-dream.yaml)

**Purpose:** An advanced system that periodically reviews, consolidates, and resolves conflicts in accumulated knowledge to maintain a consistent, high-quality memory for agents.

**Memory Dream Spectrum:**

```
Memory Capture
      │
      ├─► Memory Store
      │         │
      │         ├─► Memory Search
      │         │         │
      │         │         └─► Memory Dream
      │         │                   │
      │         │                   ├─► Conflict Detection
      │         │                   ├─► Conflict Resolution
      │         │                   ├─► Memory Merge
      │         │                   └─► Memory Reinforcement
      │         │
      │         └─► Memory Audit
      │
      └─► Orphan Sweeping
                │
                └─► Garbage Collection
```

**Memory Dream Capabilities:**

| Capability | Description | Phase |
|------------|-------------|-------|
| **Memory Capture** | Auto-save agent interactions | MVP |
| **Memory Store** | Persistent memory storage | MVP |
| **Memory Search** | Query memory across sessions | Post-MVP |
| **Memory Dream** | Periodic consolidation & conflict resolution | Post-MVP |
| **Conflict Detection** | Find inconsistent memories | Proposed |
| **Conflict Resolution** | Merge or prioritize conflicting memories | Proposed |
| **Memory Merge** | Consolidate related memories | Proposed |
| **Memory Reinforcement** | Strengthen high-quality memories | Proposed |
| **Memory Audit** | Trace memory changes | Proposed |
| **Orphan Sweeping** | Remove unused memories | Proposed |

**Resources:**
- [Memory Dream Reference](../../architecture/memory-dream/README.md)
- [First Memory Dream Guide](../../onboarding/first-memory-dream.md)

---

## Eight-Layer Hexagonal Architecture

The platform follows a clean port/adapter hexagonal architecture with eight distinct layers. This ensures vendor independence, testability, and maintainability.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Spectrum-07: Apps                          │
│                    Web Console · API Worker · CLI               │
├─────────────────────────────────────────────────────────────────┤
│                    Spectrum-06: Runtimes                       │
│              Cloudflare · Node · Docker · Kubernetes            │
├─────────────────────────────────────────────────────────────────┤
│                    Spectrum-05: Infrastructure                   │
│           Providers · Databases · Storage · Queues             │
├─────────────────────────────────────────────────────────────────┤
│                    Spectrum-04: Governance                      │
│              Policies · Audit · Compliance · Monitoring         │
├─────────────────────────────────────────────────────────────────┤
│                    Spectrum-03: Adapters                       │
│     Cloud Provider Adapters · Database Adapters · LLM Adapters │
├─────────────────────────────────────────────────────────────────┤
│                    Spectrum-02: Application                     │
│          Workflows · Processes · Use Cases · Orchestrators     │
├─────────────────────────────────────────────────────────────────┤
│                    Spectrum-01: Ports                          │
│              Interfaces · Abstract Definitions · Contracts      │
├─────────────────────────────────────────────────────────────────┤
│                    Spectrum-00: Core                           │
│           Domain Models · Business Logic · Entities            │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Breakdown

| Layer | Responsibility | Contains |
|-------|----------------|----------|
| **0. Core** | Domain models, business logic | Entities, value objects, domain services |
| **1. Ports** | Platform-neutral interfaces | Interface definitions, contracts |
| **2. Application** | Workflows, use cases | Orchestrators, command/query handlers |
| **3. Adapters** | Provider implementations | Cloud, database, storage, LLM adapters |
| **4. Infrastructure** | External services | Databases, queues, storage, search |
| **5. Governance** | Policies, audit, compliance | Policy engine, audit logging |
| **6. Runtimes** | Deployment runtimes | Cloudflare, Node, Docker, K8s |
| **7. Apps** | User-facing applications | Web console, API worker, CLI |

### Dependency Rules

**Strict Dependency Direction:**
- Apps → Runtimes → Infrastructure → Governance → Adapters → Application → Ports → Core
- Core has zero vendor dependencies
- Ports define interfaces only, no implementations
- Adapters implement ports for specific providers
- Each layer can only depend on layers below it

**Port/Adapter Pattern:**

```
┌─────────────────────────────────────────────────────────┐
│                     Core                                 │
│              (Domain Layer, No Dependencies)              │
└────────────────────────────┬────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │      Ports       │
                    │  (Interfaces)    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
      ┌───────▼──────┐ ┌─────▼─────┐ ┌─────▼──────┐
      │  Cloudflare  │ │   Node    │ │   Docker   │
      │   Adapter    │ │  Adapter  │ │  Adapter   │
      └──────────────┘ └───────────┘ └────────────┘
```

---

## Three-Phase Startup Strategy

### Phase 1: Cloudflare-First (MVP)

Ship fast on Cloudflare's global edge with minimal infrastructure.

| Platform Need | Cloudflare Service |
|---------------|-------------------|
| Database | D1 (SQLite) |
| Cache | KV |
| Storage | R2 |
| Vector Search | Vectorize |
| Queue | Cloudflare Queues |
| Compute | Workers |

**Why Cloudflare First:**
- Free tier available for MVP
- Global edge deployment
- Serverless scaling
- Fast time-to-market

### Phase 2: Portable Core

Extract core logic into portable adapters for vendor independence.

| Cloudflare Resource | Portable Alternative |
|---------------------|---------------------|
| D1 | PostgreSQL / SQLite |
| KV | Redis |
| R2 | MinIO (S3-compatible) |
| Vectorize | Qdrant / pgvector |
| Queues | Cloud Tasks / RabbitMQ |
| Workers | Node.js / Bun |

**Architectural Guarantee:**
- `packages/core/` has zero cloud vendor dependencies
- `packages/ports/` defines platform-neutral interfaces
- `packages/adapters/` implements interfaces for specific providers
- Cloudflare is one of many optional providers

### Phase 3: Self-Hostable

Complete self-hosted deployment with Docker Compose and Helm charts.

**Deployment Options:**
- `docker-compose.yaml` — Local development, single-server deployment
- `helm/mycodexvantaos/` — Kubernetes enterprise deployment
- Migration tools — From Cloudflare to self-hosted

**Migration Path:**
1. Export data from Cloudflare (D1, KV, R2, Vectorize)
2. Import to self-hosted (PostgreSQL, Redis, MinIO, pgvector)
3. Update adapters configuration
4. Re-deploy on new runtime

---

## CloudEvents & OpenAPI

All platform events and APIs follow industry standards.

### CloudEvents v1.0

All events emitted by platform services conform to CloudEvents v1.0 specification.

**Event Example:**

```yaml
specversion: 1.0
type: mycodexvantaos.knowledge.document.created
source: /knowledge/documents/abc123
id: evt-550e8400-e29b-41d4-a716-446655440000
time: 2024-05-15T12:00:00Z
datacontenttype: application/json
data:
  documentId: abc123
  workspaceId: ws-456
  createdBy: user-789
```

**Event Types:**

| Category | Events |
|----------|--------|
| Knowledge | `mycodexvantaos.knowledge.document.created`, `mycodexvantaos.knowledge.search.completed` |
| Agent | `mycodexvantaos.agent.chat.started`, `mycodexvantaos.agent.chat.completed` |
| Audit | `mycodexvantaos.audit.event.created` |
| Memory | `mycodexvantaos.memory.item.captured`, `mycodexvantaos.memory.dream.completed` |

### OpenAPI 3.1

All platform APIs are documented in OpenAPI 3.1 specification.

**API Structure:**
- `contracts/openapi/platform-api.yaml`
- `contracts/openapi/knowledge-api.yaml`
- `contracts/openapi/memory-api.yaml`
- `contracts/openapi/agent-api.yaml`
- `contracts/openapi/audit-api.yaml`
- `contracts/openapi/runtime-api.yaml`

---

## Constitutional Validation

The platform enforces constitutional compliance through automatic validation.

### CI/CD Validation

**Workflow:** `.github/workflows/platform-constitution-ci.yml`

**Checks:**
1. Schema validation for all YAML contracts
2. Service catalog completeness check
3. Resource model compliance
4. Policy model syntax validation
5. Audit event format validation
6. Knowledge model integrity check
7. Memory dream schema validation
8. Port/Adapter dependency check (no vendor deps in core)

**Failure Action:** Any constitutional violation blocks the PR merge.

### Runtime Validation

**Validators:**
- `tools/validators/schema-validator.ts` — Schema validation
- `tools/validators/contract-validator.ts` — Contract validation
- `tools/validators/auditor-validator.ts` — Audit integrity check
- `tools/validators/port-adapter-validator.ts` — Dependency check

**Validation Hook:**
- All contract changes must pass validators before commit
- API calls validate against schemas at runtime
- Audit events validated before writing to log

---

## Constitutional Principles

### 1. Immutability

- The five constitutional models cannot be changed without constitutional amendment
- Changes require documented ADR (Architecture Decision Record)
- All changes must go through constitutional CI validation

### 2. Zero Trust

- No implicit trust between services
- All access decisions evaluated against policy model
- All actions audited with SHA-256 integrity chain

### 3. Workspace Isolation

- Workspace is the fundamental security boundary
- Resources cannot cross workspace boundaries
- Cross-workspace access requires platform-admin role

### 4. Append-Only Audit

- Audit events cannot be deleted or modified
- SHA-256 chain provides tamper-evidence
- Closed-loop governance with request→completion/failure pairing

### 5. Vendor Independence

- Core layer has zero cloud vendor dependencies
- Port/Adapter pattern enables provider switching
- Multi-runtime support (Cloudflare, Node, Docker, K8s)

---

## Related Architecture

### Hexagonal Architecture

- [Hexagonal Architecture Overview](../../ARCHITECTURE.md)
- [Hexagonal Layers Detail](../../architecture/foundation/hexagonal-architecture.md)

### Service Categories

- [Knowledge Services](../../architecture/service-catalog/knowledge/README.md)
- [Agent Services](../../architecture/service-catalog/agent/README.md)
- [Workspace Services](../../architecture/service-catalog/workspace/README.md)
- [Developer Services](../../architecture/service-catalog/developer/README.md)
- [Security Services](../../architecture/service-catalog/security/README.md)
- [Storage Services](../../architecture/service-catalog/storage/README.md)
- [Model Services](../../architecture/service-catalog/model/README.md)
- [Automation Services](../../architecture/service-catalog/automation/README.md)

### Advanced Systems

- [Quantum Agentic System](../../architecture/advanced-systems/quantum-agentic-system.md)
- [Carbon Neutral System](../../architecture/advanced-systems/carbon-neutral-system.md)
- [Infinite Scalability System](../../architecture/advanced-systems/infinite-scalability-system.md)
- [Zero Trust Security System](../../architecture/advanced-systems/zero-trust-security-system.md)

---

## References

- [All Platform Contracts](../../contracts/README.md)
- [Service Definitions](../../contracts/service-definitions/README.md)
- [Service Categories Contract](../../contracts/service-categories.yaml)
- [Resource Model Contract](../../contracts/resource-model.yaml)
- [Policy Model Contract](../../contracts/policy-model.yaml)
- [Audit Events Contract](../../contracts/audit-events.yaml)
- [Knowledge Model Contract](../../contracts/knowledge-model.yaml)
- [Memory Dream Contract](../../contracts/service-definitions/memory-dream.yaml)

---

## Next Steps

### For Developers

1. [Read the Service Catalog](../../architecture/service-catalog/README.md)
2. [Learn the Resource Model](../../architecture/resource-model/README.md)
3. [Understand Policy Enforcement](../../architecture/policy-governance/README.md)
4. [Study Audit Patterns](../../architecture/audit-trace/README.md)
5. [Explore Knowledge Flows](../../architecture/knowledge-layer/README.md)

### For Operators

1. [Review Deployment Guide](../../deployment/README.md)
2. [Setup Runtime](../../runtime/README.md)
3. [Configure Policies](../contracts/policies.md)
4. [Monitor Audit Logs](../../operations/monitoring.md)

### For Contributors

1. [Review Code Conventions](../contributing/code-conventions.md)
2. [Learn Service Registration](../onboarding/service-creation-guide.md)
3. [Understand Contract Validation](../contributing/contract-validation.md)
4. [Study Testing Guidelines](../contributing/testing-guidelines.md)

---

## Document Metadata

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Last Updated** | 2024-05-15 |
| **Status** | Active — Documented |
| **Spectrum** | Spectrum-00 to Spectrum-07 |
| **Maintainer** | Platform Architecture Team |
| **Review Cycle** | Quarterly |

---

<div align="center">

**Built with 🏛️ Constitutional Governance · 🔗 SHA-256 Audit Chains · ☁️ Cloudflare-First Architecture**

[Back to Documentation Index](../README.md)

</div>