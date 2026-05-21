# CI Repair Agent

GitHub Actions auto-repair agent for MyCodeXvantaOS — analyzes failed workflow runs, classifies errors, and generates repair plans with optional branch and PR creation.

## Architecture

```
┌──────────────────┐     ┌──────────────────────────────┐     ┌──────────────┐
│  GitHub Actions  │─────▶  CI Repair Agent (API)       │─────▶│  PostgreSQL  │
│  API (logs/jobs) │     │  FastAPI + CLI                │     │  (history)   │
└──────────────────┘     └──────────────────────────────┘     └──────────────┘
```

The service consists of two Python packages:

- **`mycodexvantaos-ci-repair`** — Core library with log parsing, error classification, repair engine, GitHub API client, and database persistence
- **`ci-repair-agent`** — FastAPI HTTP API and CLI interface

## Error Classification

The agent classifies CI failures into the following categories:

| Category              | Description                                  | Auto-fixable     |
| --------------------- | -------------------------------------------- | ---------------- |
| `dependency_error`    | npm/pnpm/uv dependency resolution failures   | ✅ Yes           |
| `lint_error`          | Ruff, ESLint, Prettier violations            | ✅ Yes           |
| `test_failure`        | pytest assertion failures                    | ❌ Manual review |
| `build_error`         | TypeScript compilation, Next.js build errors | ❌ Manual review |
| `docker_build_error`  | Dockerfile COPY/RUN failures                 | ❌ Manual review |
| `deployment_error`    | Cloudflare, deployment pipeline failures     | ❌ Manual review |
| `permission_error`    | GitHub Actions token/scope issues            | ❌ Manual review |
| `configuration_error` | Workflow YAML syntax or config errors        | ❌ Manual review |
| `timeout_error`       | Job timeout or cancellation                  | ❌ Manual review |
| `unknown_error`       | Unclassified failures                        | ❌ Manual review |

## API Endpoints

All API responses follow a standardized format:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

Error responses include structured error details:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "run_id must be a positive integer"
  },
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

The `X-Request-ID` header is propagated from inbound requests or auto-generated as a UUID.

| Method | Path                            | Description                                  |
| ------ | ------------------------------- | -------------------------------------------- |
| `GET`  | `/health`                       | Health check (reports database status)       |
| `GET`  | `/api/runs`                     | List workflow runs (filter by branch/status) |
| `GET`  | `/api/runs/{run_id}/analyze`    | Analyze a failed run and get repair plan     |
| `POST` | `/api/runs/{run_id}/repair`     | Execute repair (optionally create branch/PR) |
| `GET`  | `/api/history/analyses`         | Retrieve stored analyses from database       |
| `GET`  | `/api/history/stats/categories` | Get error category distribution statistics   |

### Example: Analyze a Failed Run

```bash
curl http://localhost:8000/api/runs/12345/analyze
```

Response:

```json
{
  "success": true,
  "data": {
    "run_id": 12345,
    "run_name": "CI Pipeline",
    "branch": "main",
    "analyses": [
      {
        "job_id": 2001,
        "job_name": "Build",
        "error_category": "dependency_error",
        "severity": "high",
        "root_cause": "dependency_error detected in job 'Build'",
        "affected_files": ["src/main.py"],
        "affected_dependencies": ["ws"],
        "suggested_fix": "Update or override dependencies: ws. Run `pnpm install` to update lockfile.",
        "confidence": 0.8
      }
    ],
    "repair_plan": {
      "branch_name": "fix/ci-repair-ci-pipeline-12345",
      "pr_title": "fix(ci): auto-repair for dependency error — run #12345",
      "can_auto_fix": true,
      "summary": "Run #12345: 1 failure(s), 1 action(s); Auto-fix available"
    }
  },
  "error": null,
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Example: Trigger Repair with PR Creation

```bash
curl -X POST http://localhost:8000/api/runs/12345/repair \
  -H "Content-Type: application/json" \
  -d '{"run_id": 12345, "create_branch": true, "create_pr": true}'
```

### Example: With Custom Request ID

```bash
curl http://localhost:8000/api/runs/12345/analyze \
  -H "X-Request-ID: my-trace-id-123"
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

# Run all CI repair tests
uv run pytest tests/test_ci_repair_log_parser.py \
  tests/test_ci_repair_engine.py \
  tests/test_ci_repair_api.py \
  tests/test_ci_repair_database.py \
  tests/test_ci_repair_github_client.py \
  -v

# Run with coverage
uv run pytest tests/test_ci_repair_* \
  --cov=packages/mycodexvantaos-ci-repair \
  --cov=apps/ci-repair-agent \
  --cov-report=term-missing \
  --cov-fail-under=70

# Start the server (without database)
GITHUB_TOKEN=$GITHUB_TOKEN uv run python -m uvicorn apps.ci-repair-agent.main:app --reload

# Start the server (with database)
GITHUB_TOKEN=$GITHUB_TOKEN DATABASE_URL=postgresql://ci_repair:ci_repair_secret@localhost:5432/ci_repair \
  uv run python -m uvicorn apps.ci-repair-agent.main:app --reload
```

## Environment Variables

| Variable            | Default                         | Description                                                    |
| ------------------- | ------------------------------- | -------------------------------------------------------------- |
| `GITHUB_TOKEN`      | (required)                      | GitHub personal access token with `repo` and `actions` scopes  |
| `GITHUB_REPOSITORY` | `mycodexvantaos/mycodexvantaos` | Target GitHub repository                                       |
| `DATABASE_URL`      | (empty)                         | PostgreSQL connection URL (optional — service runs without DB) |
| `LOG_LEVEL`         | `INFO`                          | Logging level                                                  |
| `HOST`              | `0.0.0.0`                       | Server bind address                                            |
| `PORT`              | `8000`                          | Server bind port                                               |

## Test Suite

The test suite includes 168 tests across 5 test files:

| Test File                         | Tests | Coverage Area                                        |
| --------------------------------- | ----- | ---------------------------------------------------- |
| `test_ci_repair_log_parser.py`    | 60+   | Log classification, error context, file/dep extraction |
| `test_ci_repair_engine.py`        | 30+   | Severity mapping, fix suggestions, repair actions     |
| `test_ci_repair_api.py`           | 28    | All API endpoints, response format, validation        |
| `test_ci_repair_database.py`      | 10    | Database operations with mocked asyncpg               |
| `test_ci_repair_github_client.py` | 7     | GitHub API client with mocked httpx                  |

## Technology Stack

- **Python 3.11** with `uv` package manager
- **FastAPI** for HTTP API with Pydantic v2 models
- **httpx** for async GitHub API client
- **asyncpg** for PostgreSQL persistence
- **Docker** multi-stage build with `python:3.11-slim`
- **GitHub Actions** CI workflow with lint, test, coverage threshold, security scan, and Docker build verification

## Error Codes

The API uses standardized error codes in responses:

| Code                 | HTTP Status | Description                            |
| -------------------- | ----------- | -------------------------------------- |
| `VALIDATION_ERROR`   | 400         | Invalid input parameters               |
| `UNAUTHORIZED`       | 401         | Missing or invalid authentication      |
| `FORBIDDEN`          | 403         | Insufficient permissions               |
| `NOT_FOUND`          | 404         | Resource not found                     |
| `CONFLICT`           | 409         | Resource already exists                |
| `RATE_LIMITED`       | 429         | Rate limit exceeded                    |
| `SERVICE_UNAVAILABLE`| 503         | Database or dependency not available    |
| `GITHUB_API_ERROR`   | 502         | GitHub API request failed              |
| `DATABASE_ERROR`     | 503         | Database operation failed              |
| `INTERNAL_ERROR`     | 500         | Unexpected server error                |
