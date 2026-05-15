# Local Runtime

## Overview

The local runtime allows running all platform services on a single machine
for development and testing purposes.

## Configuration

```yaml
# runtimes/local/runtime.yaml
runtime: local
version: '1.0'
services:
  all: true # Run all services
providers:
  - filesystem # Use filesystem instead of cloud storage
  - sqlite # Use SQLite instead of D1
  - process # Run Python workers as subprocesses
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

| Service         | Port | URL                   |
| --------------- | ---- | --------------------- |
| API Gateway     | 8787 | http://localhost:8787 |
| Identity        | 8788 | http://localhost:8788 |
| Knowledge Store | 8789 | http://localhost:8789 |
| Memory Store    | 8790 | http://localhost:8790 |
| Dream Worker    | 8791 | http://localhost:8791 |

## SQLite Emulation

The local runtime uses SQLite to emulate Cloudflare D1. Migration files
from `migrations/d1/` are applied automatically on startup.
