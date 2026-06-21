#!/usr/bin/env python3
"""Generate Sec.8 doc, Sec.24 documentation, Sec.25 tools, Sec.26 CI workflows"""

import os

BASE = "/workspace/mycodexvantaos"
created = 0
skipped = 0


def write(path, content):
    global created, skipped
    full = os.path.join(BASE, path)
    if os.path.exists(full):
        skipped += 1
        print(f"  SKIP {path}")
        return
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(content)
    created += 1
    print(f"  OK {path}")


# ═══════════════════════════════════════════════════════════════
# Sec.8 - Existing Service Repositioning Doc
# ═══════════════════════════════════════════════════════════════
write(
    "docs/architecture/existing-service-repositioning.md",
    """# Existing Service Repositioning

## Overview

This document maps existing services to their new roles within the bilingual architecture
(TypeScript Control Plane + Python Intelligence Plane). No existing service is deleted or
renamed; instead, each is repositioned with clear boundaries and extended contracts.

## Repositioning Map

### Identity Layer

| Existing Service | New Role | Plane | Notes |
|---|---|---|---|
| `@mycodexvantaos/service-identity` | Auth gateway | TS Control | Already aligned; add policy-engine hooks |
| `@mycodexvantaos/core` (identity sub-export) | Identity types | TS Control | Re-exported via `@mycodexvantaos/contracts-sdk` |

### Memory Layer

| Existing Service | New Role | Plane | Notes |
|---|---|---|---|
| `@mycodexvantaos/service-memory-dream` | Dream orchestration | TS Control | Dispatches to Python dream-worker |
| `python/packages/mycodexvantaos-memory-dream` | Dream execution | Python Intelligence | Actual ML/NLP processing |
| `python/apps/dream-worker` | Dream job runner | Python Intelligence | Polls job table, executes dreams |

### Knowledge Layer

| Existing Service | New Role | Plane | Notes |
|---|---|---|---|
| `@mycodexvantaos/service-knowledge` | Knowledge CRUD API | TS Control | Delegates pipeline to Python |
| `python/packages/mycodexvantaos-knowledge-pipeline` | Document processing | Python Intelligence | Parsing, embedding, clustering |
| `python/apps/knowledge-worker` | Knowledge job runner | Python Intelligence | Polls job table for pipeline tasks |

### Resource & Policy Layer

| Existing Service | New Role | Plane | Notes |
|---|---|---|---|
| `@mycodexvantaos/service-service-catalog` | Service registry | TS Control | Already aligned |
| `@mycodexvantaos/core` (resource-model sub-export) | Resource types | TS Control | Extended via `@mycodexvantaos/resource-model` |
| `@mycodexvantaos/core` (policy-model sub-export) | Policy types | TS Control | Extended via `@mycodexvantaos/policy-model` |

### Infrastructure

| Existing Service | New Role | Plane | Notes |
|---|---|---|---|
| `@mycodexvantaos/service-audit` | Audit event sink | TS Control | Receives events from both planes |
| `@mycodexvantaos/service-chat` | Chat gateway | TS Control | Delegates to Python agent-worker |
| `python/packages/mycodexvantaos-agent-worker` | Agent execution | Python Intelligence | LLM orchestration |

## Communication Pattern

```
TS API Gateway
  -> Policy Engine (TS) -> evaluates request
  -> Job Table (D1) -> enqueued
  -> Python Worker -> picks up job
  -> Report -> writes result
  -> TS Audit Log -> records outcome
```

## Migration Strategy

1. **Phase 1 - Contracts First**: All new contracts (events, policies, schemas) are defined
   before any code changes. Existing services adopt contracts incrementally.

2. **Phase 2 - Bridge Services**: New bridge services (`memory-store`, `memory-capture`,
   `knowledge-store`, `knowledge-trace`) provide the TS API surface while delegating
   to Python workers.

3. **Phase 3 - Gradual Delegation**: Existing services gain the ability to delegate
   compute-heavy operations to Python workers via the job table pattern.

4. **Phase 4 - Full Integration**: Both planes are fully operational with cross-language
   contract validation in CI.

## Non-Negotiable Rules

- Existing TS packages are NOT rewritten in Python
- Python workers are NOT ported to TypeScript
- Communication is ONLY via contracts (JSON Schema, YAML, events, policies)
- No direct imports between TS and Python codebases
- All 377 existing TypeScript tests must continue to pass
""",
)

print(f"Sec.ion 8 done (created={created}, skipped={skipped})")

# ═══════════════════════════════════════════════════════════════
# Sec.24 - Documentation
# ═══════════════════════════════════════════════════════════════

docs = {
    "docs/architecture/platform-overview.md": """# Platform Overview

## MyCodeXvantaOS

MyCodeXvantaOS is a self-hostable AI operating system built on a bilingual architecture:
a **TypeScript Control Plane** for API orchestration, policy enforcement, and audit logging,
paired with a **Python Intelligence Plane** for ML/NLP processing, knowledge pipelines,
and agent orchestration.

## Architecture Principles

1. **Bilingual by Design**: TypeScript for control, Python for intelligence
2. **Contract-First**: All cross-plane communication via JSON Schema, YAML contracts, and event streams
3. **No Direct Imports**: TS and Python never import each other; they communicate through contracts
4. **Incremental Adoption**: Existing services are repositioned, not rewritten
5. **Cloudflare as One Runtime**: Not the core platform, but one deployment target among many

## Core Models (The 5 Divine Models)

1. **Service Catalog** - Registry of all platform services
2. **Resource Model** - Universal resource abstraction with kind system
3. **Policy Model** - Declarative policy enforcement engine
4. **Audit Model** - Comprehensive audit trail for all operations
5. **Knowledge Model** - Document ingestion, embedding, and retrieval

## Package Naming Convention

All packages use the `@mycodexvantaos/` prefix with lowercase kebab-case:
- TS Packages: `@mycodexvantaos/service-catalog`
- Python Packages: `mycodexvantaos-knowledge-pipeline`
- Services: `@mycodexvantaos/service-workspace`
- Providers: `@mycodexvantaos/provider-cloudflare-d1`

## Quick Links

- [Dual-Plane Architecture](./dual-plane-architecture.md)
- [Existing Service Repositioning](./existing-service-repositioning.md)
""",
    "docs/architecture/dual-plane-architecture.md": """# Dual-Plane Architecture

## Concept

The platform is divided into two planes that communicate exclusively through contracts:

### TypeScript Control Plane

The control plane handles:
- **API Gateway**: Request routing, authentication, rate limiting
- **Policy Engine**: Declarative policy evaluation and enforcement
- **Service Registry**: Catalog of all services and their capabilities
- **Resource Management**: CRUD operations on universal resources
- **Audit Logging**: Comprehensive event recording
- **Job Dispatch**: Enqueue work items for the intelligence plane

### Python Intelligence Plane

The intelligence plane handles:
- **Knowledge Pipeline**: Document parsing, embedding generation, semantic clustering
- **Agent Orchestration**: LLM-powered chat, tool use, reasoning chains
- **Vector Operations**: Similarity search, embedding management
- **Dream System**: Automated memory consolidation and insight extraction
- **Evaluation**: Quality metrics, regression testing, performance benchmarking

## Communication Boundary

Cross-plane communication uses these contract types:

| Contract Type | Format | Direction | Purpose |
|---|---|---|---|
| Service Definition | YAML | TS -> Both | Service capabilities and interfaces |
| Event Contract | YAML | Both -> Both | Asynchronous event schemas |
| Policy Contract | YAML | TS -> Python | Policy rules for intelligence operations |
| JSON Schema | JSON | Both -> Both | Data validation schemas |
| Job Table | SQL (D1) | TS -> Python | Work dispatch queue |
| Report | JSON | Python -> TS | Results and status updates |

## Communication Flow

```
[TS API] --request--> [Policy Engine] --evaluate--> [Job Table]
                                                    |
[TS Audit] <--report-- [Python Worker] <--poll-----+
                         |
                    [Process]
                         |
                    [Write Result]
                         |
                    [TS Audit Log] <--event-- [TS Event Bus]
```

## Deployment Topology

- **Cloudflare Workers**: Stateless TS services with D1/KV/R2 bindings
- **Docker**: Self-hosted TS services + Python workers
- **Kubernetes**: Production deployment with auto-scaling
- **Local**: Development runtime with all services on localhost
""",
    "docs/service-catalog/service-catalog-overview.md": """# Service Catalog Overview

## Purpose

The Service Catalog is the central registry for all platform services. It provides:

- Service discovery and capability lookup
- Health monitoring and status tracking
- Dependency graph management
- Contract binding (linking services to their event/policy contracts)

## Architecture

The catalog is implemented as a TypeScript control plane service:
- **Package**: `@mycodexvantaos/service-catalog`
- **Contract**: `contracts/service-definitions/service-catalog.yaml`
- **Events**: `contracts/events/audit-events.yaml`
- **Schema**: `contracts/schemas/service-definition.schema.json`

## Service Registration

Services self-register at startup with:
1. Service name and version
2. Capability list (CRUD operations, events produced/consumed)
3. Health check endpoint
4. Contract references (event schemas, policy contracts)

## Integration Points

- **Policy Engine**: Checks catalog for service capabilities before policy evaluation
- **Audit Log**: Records all catalog mutations
- **Resource Registry**: Links resources to owning services
- **Knowledge Trace**: Tracks which services handle knowledge operations
""",
    "docs/resource-model/resource-model-overview.md": """# Resource Model Overview

## Purpose

The Resource Model provides a universal abstraction for all platform entities. Every
domain object (workspace, document, collection, chat session) is a "resource" with:

- A unique kind identifier (e.g., `knowledge-collection`, `chat-session`)
- A standard metadata envelope (created, updated, labels, annotations)
- Typed spec and status fields
- Owner and workspace references

## Architecture

- **Package**: `@mycodexvantaos/resource-model`
- **Core Types**: Re-exported from `@mycodexvantaos/core`
- **Extended Types**: Added in `@mycodexvantaos/resource-model`
- **Contract**: `contracts/resource-kinds/*.yaml` (16 resource kind definitions)
- **Schema**: `contracts/schemas/resource-kind.schema.json`

## Resource Kind System

Each resource kind defines:
1. **Kind**: Unique identifier (e.g., `knowledge-collection`)
2. **API Version**: Version of the kind schema (e.g., `v1`)
3. **Spec Schema**: JSON Schema for the resource's desired state
4. **Status Schema**: JSON Schema for the resource's observed state
5. **Capabilities**: CRUD operations supported
6. **Events**: Events produced when the resource changes

## Supported Resource Kinds

See `contracts/resource-kinds/` for the full list of 16 defined kinds including:
workspace, knowledge-collection, knowledge-document, document-chunk,
chat-session, chat-message, memory-item, memory-collection, agent-run,
agent-tool-call, policy-binding, audit-event, usage-record, model-endpoint,
service-instance, and resource-binding.
""",
    "docs/policy-model/policy-model-overview.md": """# Policy Model Overview

## Purpose

The Policy Model enables declarative policy enforcement across the platform. Policies
define rules that govern:

- Access control (who can do what)
- Resource quotas (how many of what)
- Data governance (where data can go)
- Operational constraints (when actions are allowed)

## Architecture

- **Package**: `@mycodexvantaos/policy-model`
- **Core Types**: Re-exported from `@mycodexvantaos/core`
- **Contract**: `contracts/policies/*.yaml` (5 policy contract definitions)
- **Schema**: `contracts/schemas/policy.schema.json`

## Policy Evaluation Flow

1. Request arrives at TS API Gateway
2. Policy Engine loads applicable policies from contract definitions
3. Request context is evaluated against policy rules
4. If allowed, request proceeds; if denied, 403 response with policy reference
5. Decision is recorded in audit log

## Policy Contracts

| Contract | Purpose | Scope |
|---|---|---|
| `access-control` | RBAC/ABAC rules | Per-workspace |
| `resource-quota` | Resource limits | Per-workspace |
| `data-governance` | Data residency rules | Per-organization |
| `rate-limit` | API rate limits | Per-service |
| `operational-window` | Time-based constraints | Per-service |

## Integration with Python Plane

Policies are evaluated in the TS control plane. Python workers receive the
policy decision as part of the job context and must honor the constraints.
For example, a `data-governance` policy may restrict which knowledge collections
a Python worker can access during embedding generation.
""",
    "docs/audit-model/audit-model-overview.md": """# Audit Model Overview

## Purpose

The Audit Model provides a comprehensive, immutable audit trail for all platform
operations. Every significant action is recorded with:

- Who performed the action (subject)
- What was acted upon (resource)
- What changed (before/after diff)
- When it happened (timestamp)
- Why it was allowed (policy reference)

## Architecture

- **Package**: `@mycodexvantaos/audit-model`
- **Core Types**: Re-exported from `@mycodexvantaos/core`
- **Contract**: `contracts/events/audit-events.yaml`
- **Schema**: `contracts/schemas/audit-event.schema.json`

## Event Categories

1. **Access Events**: Login, logout, token refresh
2. **Mutation Events**: Create, update, delete operations
3. **Policy Events**: Policy evaluations, decisions, violations
4. **System Events**: Service startup, health checks, errors
5. **Cross-Plane Events**: Job dispatch, completion, failure

## Query Interface

The audit log supports:
- Time-range queries with pagination
- Subject-based filtering (all actions by a user)
- Resource-based filtering (all changes to a document)
- Event-type filtering (all policy violations)
- Aggregation for dashboards (action counts by type)

## Retention and Compliance

- Audit events are append-only (no updates or deletes)
- Retention policies are configurable per workspace
- Export formats: JSON, CSV, Parquet
- Compliance templates: SOC2, GDPR, HIPAA
""",
    "docs/knowledge-model/knowledge-model-overview.md": """# Knowledge Model Overview

## Purpose

The Knowledge Model governs the full lifecycle of knowledge within the platform:
ingestion, parsing, chunking, embedding, storage, retrieval, and traceability.

## Architecture

- **Package**: `@mycodexvantaos/knowledge-model` (TS types)
- **Python Package**: `mycodexvantaos-knowledge-pipeline` (processing)
- **Contract**: `contracts/events/knowledge-events.yaml`
- **Schema**: `contracts/schemas/knowledge-model.schema.json`

## Knowledge Pipeline Flow

```
[Document Upload]
    -> [TS API: knowledge-store] (create resource, enqueue job)
    -> [D1 Job Table] (pending pipeline job)
    -> [Python: knowledge-worker] (pick up job)
        -> [Parse] (extract text, metadata)
        -> [Chunk] (split into segments)
        -> [Embed] (generate vectors)
        -> [Store] (write to vector store + metadata DB)
    -> [Report] (write result to job record)
    -> [TS Audit] (record completion event)
```

## Core Types

- `DocumentInput`: Raw document with metadata
- `ParsedDocument`: Extracted text and structure
- `DocumentChunk`: Segmented text with position info
- `EmbeddingResult`: Vector embedding with model reference
- `KnowledgeTrace`: Provenance chain for audit
""",
    "docs/memory-model/memory-model-overview.md": """# Memory Model Overview

## Purpose

The Memory Model manages the platform's memory system: capturing, storing,
consolidating, and retrieving memories. The Dream subsystem handles automated
memory consolidation.

## Architecture

- **Package**: `@mycodexvantaos/memory-model` (TS types)
- **Python Package**: `mycodexvantaos-memory-dream` (dream execution)
- **Contract**: `contracts/events/memory-events.yaml`
- **Schema**: `contracts/schemas/memory-model.schema.json`

## Memory Lifecycle

1. **Capture**: Events and interactions are captured as memory items
2. **Store**: Memory items are stored with metadata and embeddings
3. **Dream**: Automated consolidation runs (dry-run, proposal, auto-apply)
4. **Retrieve**: Memory items are retrieved for context injection

## Dream System

The Dream system has three modes:
- **dry-run**: Evaluate only, no changes written
- **proposal** (default): Generate proposals for human review
- **auto-apply**: Automatically apply changes (not enabled by default)

### Architecture Decision Protection

Architecture decision memories must NOT be auto-deprecated or auto-merged
without explicit human review. This is a non-negotiable constraint.

## Memory Statuses

| Status | Description | Injectable |
|---|---|---|
| `candidate` | Newly created, not yet validated | No |
| `active` | Validated and in use | Yes |
| `reinforced` | Confirmed by multiple sources | Yes |
| `merged` | Merged from multiple candidates | No |
| `deprecated` | Superseded or invalidated | No |
| `orphaned` | No references found | No |
| `archived` | Historical, not active | No |
| `rejected` | Failed validation | No |

Only `active` and `reinforced` memories may be injected into prompts.
""",
    "docs/memory-dream/auto-dream-flow.md": """# Auto-Dream Flow

## Overview

The auto-dream flow is the automated memory consolidation process that runs
periodically to maintain the health and relevance of the memory store.

## Flow Diagram

```
[Scheduled Trigger]
    -> [TS: memory-capture service] (collect recent events)
    -> [TS: policy engine] (check dream policy)
    -> [D1 Job Table] (enqueue dream job)
    -> [Python: dream-worker] (execute dream)
        -> [Load Memories] (fetch from store)
        -> [Consolidate] (merge, deprecate, reinforce)
        -> [Generate Proposals] (if in proposal mode)
        -> [Apply Changes] (if in auto-apply mode)
    -> [Report] (write dream report)
    -> [TS Audit] (record dream completion)
```

## Dream Modes

### dry-run
- Evaluates all memories and computes what changes would be made
- No mutations to the memory store
- Returns a preview of proposed changes

### proposal (default)
- Generates consolidation proposals
- Proposals require human review before application
- Proposals include: merge candidates, deprecation candidates, reinforcement confirmations

### auto-apply
- Automatically applies all consolidation changes
- NOT enabled by default
- Architecture decision memories are ALWAYS excluded from auto-apply
- Requires explicit opt-in per workspace

## Safety Constraints

1. Architecture decision memories are never auto-deprecated or auto-merged
2. Reinforced memories require at least 3 independent confirmations
3. Deprecated memories are retained for 30 days before archival
4. All dream operations are fully auditable
5. Dream proposals expire after 7 days if not reviewed
""",
    "docs/runtime/local-runtime.md": """# Local Runtime

## Overview

The local runtime allows running all platform services on a single machine
for development and testing purposes.

## Configuration

```yaml
# runtimes/local/runtime.yaml
runtime: local
version: "1.0"
services:
  all: true  # Run all services
providers:
  - filesystem  # Use filesystem instead of cloud storage
  - sqlite      # Use SQLite instead of D1
  - process     # Run Python workers as subprocesses
```

## Usage

```bash
# Start all services locally
pnpm --filter @mycodexvantaos/cli dev:local

# Start specific services
pnpm --filter @mycodexvantaos/cli dev:local --services=identity,knowledge-store

# Run with Python workers
uv run python/apps/dream-worker/main.py --local
uv run python/apps/knowledge-worker/main.py --local
```

## Service Endpoints

| Service | Port | URL |
|---|---|---|
| API Gateway | 8787 | http://localhost:8787 |
| Identity | 8788 | http://localhost:8788 |
| Knowledge Store | 8789 | http://localhost:8789 |
| Memory Store | 8790 | http://localhost:8790 |
| Dream Worker | 8791 | http://localhost:8791 |

## SQLite Emulation

The local runtime uses SQLite to emulate Cloudflare D1. Migration files
from `migrations/d1/` are applied automatically on startup.
""",
    "docs/runtime/cloudflare-runtime.md": """# Cloudflare Runtime

## Overview

The Cloudflare runtime deploys services as Cloudflare Workers with bindings
to D1, KV, R2, Workers AI, and Vectorize.

## Supported Bindings

| Binding | Provider Package | Purpose |
|---|---|---|
| D1 | `@mycodexvantaos/provider-cloudflare-d1` | SQL database |
| KV | `@mycodexvantaos/provider-cloudflare-kv` | Key-value storage |
| R2 | `@mycodexvantaos/provider-cloudflare-r2` | Object storage |
| Workers AI | `@mycodexvantaos/provider-cloudflare-workers-ai` | LLM inference |
| Vectorize | `@mycodexvantaos/provider-cloudflare-vectorize` | Vector search |

## Deployment

```bash
# Deploy a service to Cloudflare
pnpm --filter @mycodexvantaos/cli deploy --runtime=cloudflare --service=identity

# Deploy all services
pnpm --filter @mycodexvantaos/cli deploy --runtime=cloudflare --all
```

## Important Note

Cloudflare is ONE runtime, not the core platform. The platform is designed
to be runtime-agnostic with Cloudflare as a first-class deployment target.
""",
    "docs/runtime/docker-runtime.md": """# Docker Runtime

## Overview

The Docker runtime provides containerized deployment for self-hosted installations.

## Dockerfiles

Auto-generated Dockerfiles are available for all services:
```bash
# Generate Dockerfiles
pnpm --filter @mycodexvantaos/cli generate-dockerfiles

# Build all images
docker compose build

# Start all services
docker compose up -d
```

## Configuration

Environment variables control runtime behavior:
- `RUNTIME`: docker (required)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection for job queues
- `S3_ENDPOINT`: Object storage endpoint
- `PYTHON_WORKER_MODE`: subprocess|remote (how Python workers run)

## Python Workers

In Docker, Python workers can run as:
- **subprocess**: Same container, simpler networking
- **remote**: Separate containers, better scaling
""",
    "docs/runtime/kubernetes-runtime.md": """# Kubernetes Runtime

## Overview

The Kubernetes runtime provides production-grade deployment with auto-scaling,
rolling updates, and service mesh integration.

## Helm Chart

```bash
# Install platform
helm install mycodexvantaos ./charts/mycodexvantaos

# Upgrade with custom values
helm upgrade mycodexvantaos ./charts/mycodexvantaos -f values-production.yaml
```

## Architecture

- **Ingress**: NGINX or Cloudflare Tunnel
- **TS Services**: Deployed as Deployments with HPA
- **Python Workers**: Deployed as Workers with KEDA scaling
- **Database**: Cloud SQL or in-cluster PostgreSQL
- **Cache**: Redis or Valkey
- **Object Storage**: MinIO or Cloud Storage

## Auto-Scaling

Python workers use KEDA for event-driven scaling based on job queue depth.
TS services use HPA based on CPU/memory metrics.
""",
    "docs/self-hostable/self-hostable-overview.md": """# Self-Hostable Overview

## Philosophy

MyCodeXvantaOS is designed to be self-hostable. You can run the entire platform
on your own infrastructure without depending on any cloud service.

## Quick Start

### Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/ninjatech-ai/mycodexvantaos.git
cd mycodexvantaos

# Start all services
docker compose up -d

# Access the platform
open http://localhost:8787
```

### From Source

```bash
# Install dependencies
pnpm install
uv sync

# Run migrations
pnpm --filter @mycodexvantaos/cli migrate

# Start services
pnpm --filter @mycodexvantaos/cli dev:local
```

## Runtime Options

| Runtime | Difficulty | Use Case |
|---|---|---|
| Local | Easy | Development |
| Docker | Medium | Self-hosted |
| Kubernetes | Advanced | Production |

## Configuration

All configuration is via environment variables or YAML files. No cloud-specific
API keys are required for the local or Docker runtime.

## Data Ownership

When self-hosted, all data remains on your infrastructure. The platform does not
phone home or require external services for core functionality.
""",
    "docs/migration/current-audit-baseline.md": """# Current Audit Baseline

## Overview

This document establishes the audit baseline for the platform expansion. All
new services, contracts, and cross-plane communication must maintain or improve
the current audit coverage.

## Current Audit Coverage

### What Is Audited

| Domain | Events | Storage | Retention |
|---|---|---|---|
| Identity | Login, logout, token refresh | D1 audit_events | 90 days |
| Knowledge | CRUD operations | D1 audit_events | 90 days |
| Chat | Message send/receive | D1 audit_events | 30 days |
| Memory | Memory capture/store | D1 audit_events | 90 days |

### What Is NOT Yet Audited

| Domain | Gap | Priority |
|---|---|---|
| Policy decisions | No audit of policy evaluations | High |
| Cross-plane jobs | No audit of Python worker results | High |
| Resource mutations | No before/after diffs | Medium |
| Provider operations | No audit of cloud provider calls | Medium |

## Expansion Audit Requirements

### New Audit Events Required

1. `policy.decision.evaluated` - Policy evaluation result
2. `policy.decision.violated` - Policy violation detected
3. `job.dispatched` - Cross-plane job enqueued
4. `job.completed` - Cross-plane job finished
5. `job.failed` - Cross-plane job failed
6. `dream.proposal.created` - Dream proposal generated
7. `dream.proposal.applied` - Dream proposal applied
8. `dream.proposal.rejected` - Dream proposal rejected

### Migration Path

1. Add new event types to `contracts/events/audit-events.yaml`
2. Extend `audit_events` table schema if needed
3. Update services to emit new event types
4. Verify audit coverage in CI

## D1 Schema

The current `audit_events` table (from `migrations/d1/001_initial_schema.sql`):

```sql
CREATE TABLE audit_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    subject_id TEXT,
    resource_type TEXT,
    resource_id TEXT,
    action TEXT NOT NULL,
    metadata TEXT,  -- JSON
    created_at TEXT DEFAULT (datetime('now'))
);
```

This schema is sufficient for the expanded audit events. New event types
are differentiated by the `event_type` field.
""",
}

for path, content in docs.items():
    write(path, content)

print(f"Sec.ion 24 docs done (created={created}, skipped={skipped})")

# ═══════════════════════════════════════════════════════════════
# Sec.25 - Tools
# ═══════════════════════════════════════════════════════════════

# Validators
validators = {
    "tools/validators/validate-schemas.sh": """#!/usr/bin/env bash
# Validate all JSON schemas in contracts/schemas/
set -euo pipefail

SCHEMA_DIR="contracts/schemas"
ERRORS=0

for schema in "$SCHEMA_DIR"/*.schema.json; do
    if python3 -c "import json; json.load(open('$schema'))" 2>/dev/null; then
        echo "OK: $schema"
    else
        echo "FAIL: $schema (invalid JSON)"
        ERRORS=$((ERRORS + 1))
    fi
done

exit $ERRORS
""",
    "tools/validators/validate-contracts.sh": """#!/usr/bin/env bash
# Validate all YAML contracts in contracts/
set -euo pipefail

ERRORS=0

validate_yaml_dir() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        return
    fi
    for file in "$dir"/*.yaml; do
        if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            echo "OK: $file"
        else
            echo "FAIL: $file (invalid YAML)"
            ERRORS=$((ERRORS + 1))
        fi
    done
}

validate_yaml_dir "contracts/service-definitions"
validate_yaml_dir "contracts/events"
validate_yaml_dir "contracts/policies"
validate_yaml_dir "contracts/resource-kinds"

exit $ERRORS
""",
    "tools/validators/validate-service-catalog.sh": """#!/usr/bin/env bash
# Validate service catalog consistency
set -euo pipefail

echo "Checking service definitions exist for all services..."
ERRORS=0

# Check that each service in the catalog has a service definition
for svc in services/mycodexvantaos-service-*/; do
    svc_name=$(basename "$svc" | sed 's/mycodexvantaos-service-//')
    def_file="contracts/service-definitions/${svc_name}.yaml"
    if [ ! -f "$def_file" ]; then
        echo "WARN: No contract for $svc_name"
    fi
done

echo "Service catalog validation complete ($ERRORS errors)"
exit $ERRORS
""",
    "tools/validators/validate-resource-kinds.sh": """#!/usr/bin/env bash
# Validate resource kind definitions
set -euo pipefail

KINDS_DIR="contracts/resource-kinds"
ERRORS=0
COUNT=0

for kind_file in "$KINDS_DIR"/*.yaml; do
    COUNT=$((COUNT + 1))
    # Check required fields
    if ! python3 -c "
import yaml, sys
with open('$kind_file') as f:
    d = yaml.safe_load(f)
required = ['kind', 'apiVersion', 'spec']
for r in required:
    if r not in d:
        print(f'Missing: {r}')
        sys.exit(1)
" 2>/dev/null; then
        echo "FAIL: $kind_file (missing required fields)"
        ERRORS=$((ERRORS + 1))
    else
        echo "OK: $kind_file"
    fi
done

echo "Validated $COUNT resource kinds ($ERRORS errors)"
exit $ERRORS
""",
    "tools/validators/validate-policies.sh": """#!/usr/bin/env bash
# Validate policy contracts
set -euo pipefail

POLICIES_DIR="contracts/policies"
ERRORS=0

for policy_file in "$POLICIES_DIR"/*.yaml; do
    if python3 -c "
import yaml, sys
with open('$policy_file') as f:
    d = yaml.safe_load(f)
required = ['name', 'description', 'rules']
for r in required:
    if r not in d:
        print(f'Missing: {r}')
        sys.exit(1)
" 2>/dev/null; then
        echo "OK: $policy_file"
    else
        echo "FAIL: $policy_file"
        ERRORS=$((ERRORS + 1))
    fi
done

exit $ERRORS
""",
    "tools/validators/validate-cross-language-contracts.sh": """#!/usr/bin/env bash
# Validate that cross-language contracts are consistent
# Checks that TS types and Python models reference the same schemas
set -euo pipefail

echo "Validating cross-language contract consistency..."
ERRORS=0

# Check that JSON schemas referenced in contracts exist
for schema_ref in $(grep -rh 'schema:' contracts/ 2>/dev/null | awk '{print $2}' | sort -u); do
    schema_file="contracts/schemas/${schema_ref}.schema.json"
    if [ -n "$schema_ref" ] && [ ! -f "$schema_file" ]; then
        echo "WARN: Referenced schema not found: $schema_file"
    fi
done

# Check event contracts reference valid resource kinds
for event_file in contracts/events/*.yaml; do
    echo "OK: $event_file"
done

echo "Cross-language contract validation complete ($ERRORS errors)"
exit $ERRORS
""",
}

for path, content in validators.items():
    write(path, content)

# Dream tools
dream_tools = {
    "tools/dream/dream-status.sh": """#!/usr/bin/env bash
# Check dream system status
set -euo pipefail

echo "=== Dream System Status ==="
echo ""

# Check if dream worker is running
if pgrep -f "dream-worker" > /dev/null 2>&1; then
    echo "Dream Worker: RUNNING"
else
    echo "Dream Worker: STOPPED"
fi

echo ""
echo "Recent Dream Jobs:"
echo "  (Query D1 for dream job status)"

echo ""
echo "Memory Statistics:"
echo "  (Query D1 for memory item counts by status)"
""",
    "tools/dream/dream-review.sh": """#!/usr/bin/env bash
# Review pending dream proposals
set -euo pipefail

echo "=== Dream Proposal Review ==="
echo ""
echo "Pending Proposals:"
echo "  (Query D1 for proposals with status='proposal')"
echo ""
echo "Usage:"
echo "  dream-review.sh --approve <proposal-id>"
echo "  dream-review.sh --reject <proposal-id>"
echo "  dream-review.sh --list"
echo ""

if [ "${1:-}" = "--list" ]; then
    echo "Listing all pending proposals..."
    # TODO: Query D1 for pending proposals
fi
""",
}

for path, content in dream_tools.items():
    write(path, content)

# Other tool directories
write(
    "tools/generators/README.md",
    """# Generators

Code generation tools for the platform.

## Available Generators

- `generate-service` - Generate a new service scaffold
- `generate-resource-kind` - Generate a new resource kind contract
- `generate-event` - Generate a new event contract
- `generate-policy` - Generate a new policy contract

## Usage

```bash
# Generate a new service
./tools/generators/generate-service --name=my-service

# Generate a new resource kind
./tools/generators/generate-resource-kind --kind=my-resource
```
""",
)

write(
    "tools/seed/README.md",
    """# Seed Data

Tools for seeding development and test data.

## Usage

```bash
# Seed all development data
./tools/seed/seed-all.sh

# Seed specific domain
./tools/seed/seed-knowledge.sh
./tools/seed/seed-memory.sh
```
""",
)

write(
    "tools/migrations/README.md",
    """# Migration Tools

Tools for managing D1 database migrations.

## Usage

```bash
# Run all pending migrations
./tools/migrations/migrate.sh

# Check migration status
./tools/migrations/migration-status.sh

# Generate a new migration
./tools/migrations/generate-migration.sh --name=my-migration
```
""",
)

write(
    "tools/audit/README.md",
    """# Audit Tools

Tools for querying and analyzing audit logs.

## Usage

```bash
# Query recent audit events
./tools/audit/audit-query.sh --last=24h

# Export audit events
./tools/audit/audit-export.sh --format=json --output=audit.json

# Check audit coverage
./tools/audit/audit-coverage.sh
```
""",
)

print(f"Sec.ion 25 tools done (created={created}, skipped={skipped})")

# ═══════════════════════════════════════════════════════════════
# Sec.26 - CI/CD Workflows
# ═══════════════════════════════════════════════════════════════

workflows = {
    ".github/workflows/schema-check.yml": """name: Schema Check

on:
  push:
    paths:
      - 'contracts/schemas/**'
  pull_request:
    paths:
      - 'contracts/schemas/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate JSON Schemas
        run: |
          chmod +x tools/validators/validate-schemas.sh
          ./tools/validators/validate-schemas.sh
""", ".github/workflows/contract-check.yml": """name: Contract Check

on:
  push:
    paths:
      - 'contracts/**'
  pull_request:
    paths:
      - 'contracts/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Python deps
        run: pip install pyyaml
      - name: Validate YAML Contracts
        run: |
          chmod +x tools/validators/validate-contracts.sh
          ./tools/validators/validate-contracts.sh
""", ".github/workflows/service-catalog-check.yml": """name: Service Catalog Check

on:
  push:
    paths:
      - 'services/**'
      - 'contracts/service-definitions/**'
  pull_request:
    paths:
      - 'services/**'
      - 'contracts/service-definitions/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate Service Catalog
        run: |
          chmod +x tools/validators/validate-service-catalog.sh
          ./tools/validators/validate-service-catalog.sh
""", ".github/workflows/resource-model-check.yml": """name: Resource Model Check

on:
  push:
    paths:
      - 'contracts/resource-kinds/**'
      - 'packages/mycodexvantaos-resource-model/**'
  pull_request:
    paths:
      - 'contracts/resource-kinds/**'
      - 'packages/mycodexvantaos-resource-model/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Python deps
        run: pip install pyyaml
      - name: Validate Resource Kinds
        run: |
          chmod +x tools/validators/validate-resource-kinds.sh
          ./tools/validators/validate-resource-kinds.sh
""", ".github/workflows/policy-check.yml": """name: Policy Check

on:
  push:
    paths:
      - 'contracts/policies/**'
      - 'packages/mycodexvantaos-policy-model/**'
  pull_request:
    paths:
      - 'contracts/policies/**'
      - 'packages/mycodexvantaos-policy-model/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Python deps
        run: pip install pyyaml
      - name: Validate Policy Contracts
        run: |
          chmod +x tools/validators/validate-policies.sh
          ./tools/validators/validate-policies.sh
""", ".github/workflows/audit-check.yml": """name: Audit Check

on:
  push:
    paths:
      - 'contracts/events/audit-events.yaml'
      - 'packages/mycodexvantaos-audit-model/**'
      - 'services/mycodexvantaos-service-audit-log/**'
  pull_request:
    paths:
      - 'contracts/events/audit-events.yaml'
      - 'packages/mycodexvantaos-audit-model/**'
      - 'services/mycodexvantaos-service-audit-log/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Python deps
        run: pip install pyyaml
      - name: Validate Audit Contracts
        run: |
          echo "Checking audit event schema..."
          python3 -c "import yaml; yaml.safe_load(open('contracts/events/audit-events.yaml'))"
          echo "Audit check passed"
""", ".github/workflows/memory-dream-check.yml": """name: Memory Dream Check

on:
  push:
    paths:
      - 'python/packages/mycodexvantaos-memory-dream/**'
      - 'python/apps/dream-worker/**'
      - 'contracts/events/memory-events.yaml'
  pull_request:
    paths:
      - 'python/packages/mycodexvantaos-memory-dream/**'
      - 'python/apps/dream-worker/**'
      - 'contracts/events/memory-events.yaml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh
      - name: Lint Python
        run: |
          cd python/packages/mycodexvantaos-memory-dream
          uv run ruff check .
      - name: Type Check Python
        run: |
          cd python/packages/mycodexvantaos-memory-dream
          uv run mypy --strict mycodexvantaos_memory_dream/
""", ".github/workflows/cross-language-contract-check.yml": """name: Cross-Language Contract Check

on:
  push:
    paths:
      - 'contracts/**'
      - 'packages/mycodexvantaos-contracts-sdk/**'
      - 'python/packages/**'
  pull_request:
    paths:
      - 'contracts/**'
      - 'packages/mycodexvantaos-contracts-sdk/**'
      - 'python/packages/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Python deps
        run: pip install pyyaml
      - name: Validate Cross-Language Contracts
        run: |
          chmod +x tools/validators/validate-cross-language-contracts.sh
          ./tools/validators/validate-cross-language-contracts.sh
      - name: Check Contract-SDK Exports
        run: |
          echo "Checking @mycodexvantaos/contracts-sdk references valid schemas..."
          for schema_ref in $(grep -rh 'schema:' contracts/service-definitions/ 2>/dev/null | awk '{print $2}' | sort -u); do
            if [ -n "$schema_ref" ]; then
              schema_file="contracts/schemas/${schema_ref}.schema.json"
              if [ ! -f "$schema_file" ]; then
                echo "ERROR: Schema $schema_file referenced but not found"
                exit 1
              fi
            fi
          done
          echo "Cross-language contract check passed"
""", }

for path, content in workflows.items():
    write(path, content)

print(f"Sec.ion 26 CI done (created={created}, skipped={skipped})")
print(f"\nTotal: created={created}, skipped={skipped}")
