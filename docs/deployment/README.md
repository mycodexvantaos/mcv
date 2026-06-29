# MyCodeXvantaOS Deployment Guide

## Deployment Options

### 1. Cloudflare Workers (MVP — Phase 1)

The primary deployment target for the MVP. All infrastructure is Cloudflare-managed:

- **Compute:** Cloudflare Workers
- **Database:** D1 (SQLite)
- **Cache/Sessions:** KV
- **Object Storage:** R2
- **Vector Search:** Workers AI + D1 FTS5
- **Queues:** Cloudflare Queues

#### Prerequisites

- Cloudflare account with Workers enabled
- `wrangler` CLI installed (`npm install -g wrangler`)
- D1 database created

#### Steps

```bash
# 1. Clone the repository
git clone https://github.com/mycodexvantaos/mycodexvantaos.git
cd mycodexvantaos

# 2. Install dependencies
npm install

# 3. Create D1 database
wrangler d1 create mycodexvantaos-db

# 4. Update wrangler.toml with your D1 database ID

# 5. Run database migrations
wrangler d1 execute mycodexvantaos-db --file=migrations/d1/001_initial_schema.sql

# 6. Set secrets
wrangler secret put JWT_SECRET

# 7. Deploy
cd apps/api-worker
wrangler deploy
```

### 2. Docker Compose (Phase 2 — Portable Core)

Self-hosted deployment with portable alternatives for all Cloudflare services:

| Cloudflare | Portable Alternative |
| ---------- | -------------------- |
| D1         | PostgreSQL 15        |
| KV         | Redis 7              |
| R2         | MinIO                |
| Vectorize  | Qdrant               |
| Queues     | RabbitMQ             |

#### Steps

```bash
# 1. Clone and install
git clone https://github.com/mycodexvantaos/mycodexvantaos.git
cd mycodexvantaos

# 2. Configure environment
cp infra/docker-compose/env.example .env
# Edit .env with your values

# 3. Start infrastructure + API
docker compose -f infra/docker-compose/docker-compose.local.yaml up -d

# 4. Verify health
curl http://localhost:8787/api/v1/health
```

### 3. Kubernetes (Phase 3 — Self-Hosted)

Production Kubernetes deployment using Helm:

```bash
# 1. Add Helm repository (future)
helm repo add mycodexvantaos https://charts.mycodexvantaos.ai

# 2. Install with custom values
helm install mycodexvantaos infra/helm/mycodexvantaos \
  --set api.image.repository=ghcr.io/mycodexvantaos/api \
  --set secrets.jwtSecret=$(openssl rand -hex 32) \
  --set secrets.encryptionKey=$(openssl rand -hex 16) \
  --set env.databaseUrl=postgres://user:pass@postgres:5432/mycodexvantaos \
  -f my-values.yaml
```

## Environment Variables

See [`infra/docker-compose/env.example`](../../infra/docker-compose/env.example) for the complete list.
