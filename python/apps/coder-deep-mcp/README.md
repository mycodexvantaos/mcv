# Coder-Deep MCP Server

FastAPI service and CLI for persistent memory, context bridging, AI behavior tracking, and architecture synchronization in MyCodeXvantaOS.

## Features

- **Persistent Memory Store** — Namespace-isolated key-value storage with TTL, tags, and search
- **Context Cache** — LRU + TTL cache for large project contexts with hit rate tracking
- **Behavior Tracker** — AI action logging with session tracking, category classification, and analytics
- **Architecture Sync** — File system scanning, snapshot creation, and drift detection
- **Pipeline Codex** — Best practice and convention codification with version tracking
- **Task Tracker** — Task state persistence with governance classification (A-F) and dependency tracking
- **MCP Protocol** — Model Context Protocol tools, resources, and prompts for AI agent integration
- **SSE Transport** — Server-Sent Events endpoint for MCP streaming communication

## Quick Start

```bash
# Start the server
coder-deep-mcp serve --port 8010

# With PostgreSQL persistence
coder-deep-mcp serve --database-url postgresql://user:pass@localhost:5432/coder_deep

# Check health
curl http://localhost:8010/health
```

## API Endpoints

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |

### Memory Store
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/memory` | Store a memory item |
| GET | `/api/memory/{namespace}/{key}` | Retrieve a memory item |
| DELETE | `/api/memory/{namespace}/{key}` | Delete a memory item |
| POST | `/api/memory/search` | Search memory items |
| GET | `/api/memory/{namespace}` | List items in namespace |
| DELETE | `/api/memory/{namespace}` | Clear a namespace |

### Context Cache
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/cache` | Store a context entry |
| GET | `/api/cache/{key}` | Retrieve a context entry |
| DELETE | `/api/cache/{key}` | Delete a context entry |
| POST | `/api/cache/find` | Find matching entries |
| GET | `/api/cache/stats` | Cache statistics |
| POST | `/api/cache/invalidate` | Purge expired entries |

### Behavior Tracker
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/behavior/record` | Record an action |
| POST | `/api/behavior/query` | Query actions |
| GET | `/api/behavior/stats` | Behavior statistics |
| GET | `/api/behavior/sessions` | List sessions |

### Architecture Sync
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/architecture/scan` | Scan directory tree |
| POST | `/api/architecture/diff` | Compute architecture diff |

### Pipeline Codex
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/codex` | Store a codex entry |
| GET | `/api/codex/{entry_id}` | Retrieve a codex entry |
| DELETE | `/api/codex/{entry_id}` | Delete a codex entry |
| POST | `/api/codex/query` | Query codex entries |
| GET | `/api/codex/{entry_id}/versions` | Get version history |
| GET | `/api/codex/stats` | Codex statistics |

### Task Tracker
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/{task_id}` | Retrieve a task |
| PATCH | `/api/tasks/{task_id}` | Update a task |
| DELETE | `/api/tasks/{task_id}` | Delete a task |
| POST | `/api/tasks/query` | Query tasks |
| GET | `/api/tasks/{task_id}/transitions` | Get transition history |
| GET | `/api/tasks/{task_id}/dependencies` | Get dependencies |
| GET | `/api/tasks/stats` | Task statistics |

### MCP Protocol
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/mcp/tools` | List MCP tools |
| GET | `/api/mcp/resources` | List MCP resources |
| GET | `/api/mcp/prompts` | List MCP prompt templates |
| POST | `/api/mcp/tools/{tool_name}` | Invoke an MCP tool |
| GET | `/sse` | SSE endpoint info |

## CLI Commands

```bash
# Start server
coder-deep-mcp serve --port 8010 --database-url postgresql://...

# Cache management
coder-deep-mcp cache stats
coder-deep-mcp cache clear

# Behavior tracking
coder-deep-mcp track --session-id abc --agent-id agent-1 --action-name "file_write" --category file_write

# Architecture sync
coder-deep-mcp sync --path /path/to/project
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `DATABASE_URL` | (empty) | PostgreSQL connection string |
| `PORT` | `8010` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `LOG_LEVEL` | `INFO` | Logging level |
| `CACHE_MAX_ENTRIES` | `1000` | Max cache entries |
| `CACHE_MAX_SIZE_BYTES` | `52428800` | Max cache size (50MB) |
| `MCP_ENABLED` | `true` | Enable MCP endpoints |

## Task Type Classification (Governance)

| Type | Category | Description |
|------|----------|-------------|
| A | New Feature | New functionality or service |
| B | Security | Security-related changes |
| C | CI/CD | Pipeline and infrastructure |
| D | Documentation | Docs and ADR updates |
| E | Release | Version bumps and releases |
| F | Emergency | Hotfixes and critical patches |
