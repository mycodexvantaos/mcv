# Docker Quickstart — MyCodeXvantaOS

Self-host the governance-hardened platform with Docker Compose.

## Prerequisites

- Docker Engine 24+
- Docker Compose v2+
- 2 GB RAM minimum, 4 GB recommended
- Ports 3100 (API) and 5432 (Postgres) available

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ninjatech-ai/mycodexvantaos.git
cd mycodexvantaos

# Start all services (api-node + dream-worker + postgres)
./infra/docker-compose/startup.sh up

# Verify the platform is running
curl http://localhost:3100/v1/health
```

## Services

| Service      | Port | Description                                   |
| ------------ | ---- | --------------------------------------------- |
| api-node     | 3100 | Node.js API server (TypeScript control plane) |
| dream-worker | —    | Python dream worker (runs on-demand via CLI)  |
| postgres     | 5432 | PostgreSQL 16 persistent storage              |

## Governance Enforcement

The self-hosted runtime has full governance enforcement active by default:

- **Audit Enforcement**: All state-changing operations (POST/PUT/DELETE) must be wrapped with `withAudit()`. Unaudited mutations are rejected with 403.
- **Policy Engine**: All requests are evaluated against loaded policy contracts. Default deny if no rule matches.
- **Knowledge Trace**: Answers with `knowledge_assisted=true` require a valid `retrieval_receipt_id`.
- **Dream Safety**: Auto-apply is disabled by default. Delete actions are forbidden in MVP. Architecture decisions require review.

## API Endpoints

### Read Operations (no auth in MVP)

```bash
# Platform overview
curl http://localhost:3100/

# Health check
curl http://localhost:3100/v1/health

# List services
curl http://localhost:3100/v1/services

# List resource kinds
curl http://localhost:3100/v1/resource-kinds

# Query audit events
curl http://localhost:3100/v1/audit/events

# List loaded policies
curl http://localhost:3100/v1/policies
```

### Write Operations (audited)

```bash
# Create audit event
curl -X POST http://localhost:3100/v1/audit/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "custom-event",
    "category": "audit",
    "actor": {"type": "user", "id": "admin"},
    "resource": {"type": "test", "id": "001"},
    "context": {"tenantId": "default", "workspaceId": null}
  }'

# Evaluate a policy
curl -X POST http://localhost:3100/v1/policies/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "subject": {"type": "user", "id": "admin", "roles": ["platform-admin"]},
    "action": "read",
    "resource": {"type": "workspace"}
  }'

# Run a dream (dry-run mode)
curl -X POST http://localhost:3100/v1/dream/run \
  -H "Content-Type: application/json" \
  -d '{"mode": "dry-run"}'

# Search knowledge (creates receipt)
curl -X POST http://localhost:3100/v1/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "topK": 5}'
```

### Dream Safety Flow

```bash
# 1. Run a dream
RUN_ID=$(curl -s -X POST http://localhost:3100/v1/dream/run \
  -H "Content-Type: application/json" \
  -d '{"mode": "dry-run"}' | jq -r '.runId')

# 2. Review (approve) before applying
curl -X POST http://localhost:3100/v1/dream/runs/$RUN_ID/review \
  -H "Content-Type: application/json" \
  -d '{"reviewer": "admin", "decision": "approved"}'

# 3. Apply (only after review approval)
curl -X POST http://localhost:3100/v1/dream/runs/$RUN_ID/apply \
  -H "Content-Type: application/json" \
  -d '{"appliedBy": "admin"}'

# 4. Rollback if needed
curl -X POST http://localhost:3100/v1/dream/runs/$RUN_ID/rollback \
  -H "Content-Type: application/json" \
  -d '{"rolledBackBy": "admin"}'
```

## Configuration

### Environment Variables

| Variable       | Default                                                               | Description                |
| -------------- | --------------------------------------------------------------------- | -------------------------- |
| `API_PORT`     | 3100                                                                  | API server port            |
| `DB_PORT`      | 5432                                                                  | PostgreSQL port            |
| `DB_PASSWORD`  | mycodexvantaos                                                        | PostgreSQL password        |
| `DATABASE_URL` | postgres://mycodexvantaos:mycodexvantaos@postgres:5432/mycodexvantaos | Database connection string |
| `DREAM_MODE`   | dry-run                                                               | Dream worker default mode  |
| `NODE_ENV`     | production                                                            | Node.js environment        |

### Volumes

| Volume       | Mount                    | Description                     |
| ------------ | ------------------------ | ------------------------------- |
| `pg-data`    | /var/lib/postgresql/data | PostgreSQL data                 |
| `dream-data` | /app/data                | Dream worker data               |
| contracts    | /app/contracts:ro        | Contract YAML files (read-only) |

## Operations

```bash
# Start all services
./infra/docker-compose/startup.sh up

# Stop all services
./infra/docker-compose/startup.sh stop

# Check status
./infra/docker-compose/startup.sh status

# Run smoke tests
./infra/docker-compose/startup.sh test

# View logs
./infra/docker-compose/startup.sh logs api-node

# Clean everything (removes volumes)
./infra/docker-compose/startup.sh clean
```

## Running Without Docker

For development, you can run the API directly:

```bash
# Install dependencies
pnpm install

# Start the API server
npx tsx apps/api-node/index.ts

# In another terminal, run the Python dream worker
cd python
pip install -e packages/mycodexvantaos-memory-dream -e apps/dream-worker
dream-worker run --mode dry-run
```

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   api-node   │────▶│   postgres   │     │ dream-worker │
│  (Node.js)   │     │  (storage)   │     │  (Python)    │
│  Port 3100   │     │  Port 5432   │     │  CLI on-demand│
└──────────────┘     └──────────────┘     └──────────────┘
       │                    ▲
       │                    │
       ▼                    │
 ┌─────────────────────────┐
 │  Governance Layer       │
 │  - Audit enforcement    │
 │  - Policy engine        │
 │  - Knowledge trace      │
 │  - Dream safety         │
 └─────────────────────────┘
```

The TypeScript control plane (api-node) owns all governance enforcement.
The Python intelligence plane (dream-worker) processes memory operations.
Contracts are the single source of truth for policy, service, and resource definitions.
