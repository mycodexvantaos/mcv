# Local Runtime

Runtime configuration for local development and testing.

## Supported Providers

- Database: SQLite (file-based)
- Cache: In-memory Map
- Storage: Local filesystem
- Queue: In-process (asyncio)
- AI: Ollama (optional)

## Supported Services

All platform services can run locally for development.

## Usage

```bash
# Start local API server
pnpm --filter @mycodexvantaos/api-node dev

# Run with Docker Compose (optional)
docker-compose -f infra/docker-compose/docker-compose.yml up
```

## Self-Hostable

Yes - the local runtime is the primary self-hostable configuration.
