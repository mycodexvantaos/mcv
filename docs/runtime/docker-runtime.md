# Docker Runtime

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
