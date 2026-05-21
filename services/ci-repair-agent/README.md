# CI Repair Agent

GitHub Actions auto-repair agent for MyCodeXvantaOS — analyzes failed workflow runs, classifies errors, and generates repair plans with optional branch and PR creation.

## Architecture

```
┌──────────────────┐     ┌──────────────────────────┐     ┌──────────┐
│  GitHub Actions  │────▶│  CI Repair Agent (API)   │────▶│PostgreSQL│
│  API (logs/jobs) │     │  FastAPI + CLI            │     │ (history)│
└──────────────────┘     └──────────────────────────┘     └──────────┘
```

The service consists of two Python packages:

- **`mycodexvantaos-ci-repair`** — Core library with log parsing, error classification, repair engine, GitHub API client, and database persistence
- **`ci-repair-agent`** — FastAPI HTTP API and CLI interface

## Error Classification

The agent classifies CI failures into the following categories:

| Category | Description | Auto-fixable |
|---|---|---|
| `dependency_error` | npm/pnpm/uv dependency resolution failures | ✅ Yes |
| `lint_error` | Ruff, ESLint, Prettier violations | ✅ Yes |
| `test_failure` | pytest assertion failures | ❌ Manual review |
| `build_error` | TypeScript compilation, Next.js build errors | ❌ Manual review |
| `docker_build_error` | Dockerfile COPY/RUN failures | ❌ Manual review |
| `deployment_error` | Cloudflare, deployment pipeline failures | ❌ Manual review |
| `permission_error` | GitHub Actions token/scope issues | ❌ Manual review |
| `configuration_error` | Workflow YAML syntax or config errors | ❌ Manual review |
| `timeout_error` | Job timeout or cancellation | ❌ Manual review |
| `unknown_error` | Unclassified failures | ❌ Manual review |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check (reports database status) |
| `GET` | `/api/runs` | List workflow runs (filter by branch/status) |
| `GET` | `/api/runs/{run_id}/analyze` | Analyze a failed run and get repair plan |
| `POST` | `/api/runs/{run_id}/repair` | Execute repair (optionally create branch/PR) |
| `GET` | `/api/history/analyses` | Retrieve stored analyses from database |
| `GET` | `/api/history/stats/categories` | Get error category distribution statistics |

### Example: Analyze a Failed Run

```bash
curl http://localhost:8000/api/runs/12345/analyze
```

### Example: Trigger Repair with PR Creation

```bash
curl -X POST http://localhost:8000/api/runs/12345/repair \
  -H "Content-Type: application/json" \
  -d '{"run_id": 12345, "create_branch": true, "create_pr": true}'
```

## CLI Usage

### Analyze the Latest Failed Run

```bash
python -m main analyze --token $GITHUB_TOKEN
```

### Analyze a Specific Run

```bash
python -m main analyze --token $GITHUB_TOKEN --run-id 12345 --output repair-plan.json
```

### Start the API Server

```bash
python -m main serve --token $GITHUB_TOKEN --port 8000
```

## Quick Start with Docker Compose

```bash
# Copy environment template
cd services/ci-repair-agent
cp .env.example .env
# Edit .env with your GITHUB_TOKEN

# Start services
docker compose up -d

# Check health
curl http://localhost:8000/health
```

## Local Development

```bash
# From the monorepo root
cd python

# Install all workspace packages
uv sync --extra dev --all-packages

# Run linter
uv run ruff check packages/mycodexvantaos-ci-repair apps/ci-repair-agent
uv run ruff format --check packages/mycodexvantaos-ci-repair apps/ci-repair-agent

# Run tests
uv run pytest tests/test_ci_repair_log_parser.py tests/test_ci_repair_engine.py -v

# Start the server (without database)
GITHUB_TOKEN=$GITHUB_TOKEN uv run python -m uvicorn apps.ci-repair-agent.main:app --reload

# Start the server (with database)
GITHUB_TOKEN=$GITHUB_TOKEN DATABASE_URL=postgresql://ci_repair:ci_repair_secret@localhost:5432/ci_repair \
  uv run python -m uvicorn apps.ci-repair-agent.main:app --reload
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GITHUB_TOKEN` | (required) | GitHub personal access token with `repo` and `actions` scopes |
| `GITHUB_REPOSITORY` | `mycodexvantaos/mycodexvantaos` | Target GitHub repository |
| `DATABASE_URL` | (empty) | PostgreSQL connection URL (optional — service runs without DB) |
| `LOG_LEVEL` | `INFO` | Logging level |
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server bind port |

## Technology Stack

- **Python 3.11** with `uv` package manager
- **FastAPI** for HTTP API with Pydantic v2 models
- **httpx** for async GitHub API client
- **asyncpg** for PostgreSQL persistence
- **Docker** multi-stage build with `python:3.11-slim`
- **GitHub Actions** CI workflow with lint, test, and Docker build verification
