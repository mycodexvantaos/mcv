# Self-Hostable Overview

## Philosophy

MyCodeXvantaOS is designed to be self-hostable. You can run the entire platform
on your own infrastructure without depending on any cloud service.

## Quick Start

### Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/ai-software-engineering-guild/mycodexvantaos.git
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

| Runtime    | Difficulty | Use Case    |
| ---------- | ---------- | ----------- |
| Local      | Easy       | Development |
| Docker     | Medium     | Self-hosted |
| Kubernetes | Advanced   | Production  |

## Configuration

All configuration is via environment variables or YAML files. No cloud-specific
API keys are required for the local or Docker runtime.

## Data Ownership

When self-hosted, all data remains on your infrastructure. The platform does not
phone home or require external services for core functionality.
