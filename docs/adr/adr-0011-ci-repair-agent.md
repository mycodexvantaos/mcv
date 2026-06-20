# ADR 0011: GitHub Actions Auto-Repair Agent

**Date**: 2026-05-21
**Status**: Accepted
**Supersedes**: Initial version (PR #111)
**Context**: CI Pipeline Observability & Automated Repair

## Context

MyCodeXvantaOS operates a complex CI/CD pipeline with over 50 GitHub Actions workflows across a pnpm monorepo with 106 workspace projects. When CI failures occur, developers must manually navigate to GitHub, find the failed run, read logs, identify the error type, and determine the appropriate fix. This process is time-consuming and repetitive, especially for common failure categories like dependency conflicts, lint violations, and formatting issues that could be automatically classified and often auto-fixed.

The existing Python workspace already uses FastAPI for services and Pydantic v2 for data models. PostgreSQL is used as the persistence layer for other services. The `uv` package manager manages workspace dependencies.

The initial implementation (PR #111) provided the core library and a basic FastAPI service. Production hardening (this ADR update) adds standardized API responses, comprehensive error handling, a full test suite, and infrastructure hardening for production deployment.

## Decision

Implement a GitHub Actions Auto-Repair Agent service with the following architecture:

1. **Core library** (`mycodexvantaos-ci-repair`) providing:
   - Regex-based log parser that scans CI logs bottom-up for known error patterns
   - Error classification into 10 categories: dependency_error, test_failure, lint_error, build_error, docker_build_error, deployment_error, permission_error, configuration_error, timeout_error, unknown_error
   - Repair engine that generates actionable repair plans with auto-fix vs manual review classification
   - Async GitHub API client (httpx) for fetching workflow runs, jobs, and logs
   - PostgreSQL persistence (asyncpg) for storing analysis history and statistics

2. **FastAPI service** (`ci-repair-agent`) providing:
   - HTTP API for listing runs, analyzing failures, and triggering repairs
   - CLI with `analyze` and `serve` subcommands
   - Optional branch and PR creation for auto-fixable repairs
   - Health check endpoint with database status reporting

3. **Production hardening** (v0.2.0) adding:
   - Standardized API response format with `ApiResponse(success, data, error, request_id)` wrapper
   - `ErrorCode` class with 10 domain-specific error codes mapped to HTTP status codes
   - `AppException` base class for structured error propagation
   - Request ID middleware (`X-Request-ID`) for distributed tracing
   - Global exception handlers (AppException, HTTPException, generic) ensuring all responses conform to the standard format
   - Input validation (positive run_id, path/body consistency check)
   - Pydantic v2 domain response models for all endpoints

4. **Infrastructure**:
   - Docker multi-stage build with `python:3.11-slim` and non-root user
   - docker-compose.yml with PostgreSQL 16, bridge network, resource limits, and log rotation
   - GitHub Actions CI workflow with lint, test, 70% coverage threshold, CodeQL security scan, and Docker build verification
   - `.dockerignore` for optimized build context
   - `.env.example` with all configuration options documented

## Key Design Choices

- **Standardized API response format**: All endpoints return `{success, data, error, request_id}`. This eliminates response format ambiguity for API consumers and enables consistent error handling on the client side. The `error` object always contains `code` and `message` fields, with optional `details`.

- **Request ID propagation**: The `X-Request-ID` header is accepted from inbound requests or auto-generated as a UUID. It is attached to every response and stored in `request.state` for use in exception handlers. This enables end-to-end request tracing across the service boundary.

- **Bottom-up log scanning**: CI logs contain the root cause near the end, so scanning from the bottom provides more accurate classification than top-down scanning.

- **Auto-fix vs manual review**: Only dependency errors and lint errors are classified as auto-fixable. Test failures, build errors, deployment errors, and permission issues always require manual review to prevent unintended changes.

- **Optional PostgreSQL**: The service can operate without a database connection, falling back to stateless mode where analyses are computed on-demand but not persisted. This simplifies development and testing.

- **No LLM dependency**: Error classification uses deterministic regex pattern matching rather than LLM inference, ensuring fast, predictable, and cost-free classification.

- **Workspace package structure**: Following the established monorepo convention with library packages in `python/packages/` and apps in `python/apps/`.

- **No `from __future__ import annotations`**: Pydantic v2 requires runtime type resolution for model field validation. Using `from __future__ import annotations` defers all type annotations to strings, which causes `PydanticUserError: ApiResponse is not fully defined` when models reference `Any` or other models. Since Python 3.11 natively supports `X | None` and `list[X]`, the future import is unnecessary.

## Production Test Suite

The comprehensive test suite covers all layers of the service:

| Test file | Tests | Coverage |
|-----------|-------|----------|
| `test_ci_repair_log_parser.py` | 60+ | Log classification, error context extraction, file/dependency extraction |
| `test_ci_repair_engine.py` | 30+ | Severity mapping, fix suggestion generation, repair action planning |
| `test_ci_repair_api.py` | 28 | All 6 API endpoints, standardized response format, validation errors |
| `test_ci_repair_database.py` | 10 | Database CRUD operations with mocked asyncpg pool |
| `test_ci_repair_github_client.py` | 7 | GitHub API client with mocked httpx |

Key testing techniques employed:

- **Factory functions** (`make_sample_*`) in conftest.py provide reusable test data that can be called both from fixtures and directly from test code, avoiding the "fixture called directly" pitfall
- **Async context manager mocking** via `_make_mock_pool()` helper that properly sets up `pool.acquire()` to return an object with `__aenter__`/`__aexit__` for the `async with pool.acquire() as conn:` pattern
- **Module isolation** via `importlib.util.spec_from_file_location()` to avoid name collisions between `apps/ci-repair-agent/main.py` and `apps/agent-worker/main.py`
- **Patch object** via `patch.object(_module, "_get_client")` to patch the loaded module directly rather than using string-based patch targets that may not resolve

## Infrastructure Hardening

- **Docker Compose**: Bridge network (`ci-repair-network`) isolates the service and database. Resource limits (1 CPU/512M for agent, 0.5 CPU/256M for PostgreSQL) prevent runaway resource consumption. JSON file logging with 10MB max-size and 3-file rotation prevents disk exhaustion.
- **Dockerfile**: Multi-stage build separates build dependencies from production runtime. Non-root user (`ci-repair:1001`) runs the application. `dumb-init` handles PID 1 signal propagation.
- **CI Workflow**: Three-job pipeline — `lint-and-test` (ruff check, ruff format, pytest with 70% coverage threshold), `security-scan` (CodeQL analyze for python), `docker-build` (build verification with GitHub Actions cache).
- **Coverage threshold**: The 70% minimum coverage requirement ensures that production changes cannot merge without adequate test coverage.

## Consequences

- **Positive**: Developers can quickly identify CI failure categories without reading raw logs. Common issues (dependency conflicts, lint violations) can be auto-fixed with a single API call. Historical analysis data enables trend identification across runs.
- **Positive**: The CLI enables automated pipelines (e.g., run analysis after every failure and post results as a comment).
- **Positive**: Standardized response format and request ID propagation enable reliable integration with observability tooling and API consumers.
- **Positive**: The 168-test suite with 70% coverage threshold provides confidence in refactoring and prevents regressions.
- **Negative**: Regex-based classification has a finite pattern set and may miss novel error types. New patterns must be added manually to the `_PATTERNS` list in `log_parser.py`.
- **Negative**: Branch/PR creation is limited — the agent creates branches but does not automatically commit file patches. Actual code changes still require manual intervention or a future enhancement with file patching capability.
- **Risk**: The GitHub API rate limit (5,000 requests/hour for authenticated users) could be hit if analyzing many runs in rapid succession. Mitigated by caching run data and limiting log fetch concurrency.

## Alternatives Considered

1. **LLM-based classification**: Using an LLM to classify errors from log text. Rejected due to cost, latency, and non-determinism — regex provides instant, free, reproducible results.
2. **GitHub Actions reusable workflow**: Building the repair agent as a reusable workflow that runs after failures. Rejected because the service model provides more flexibility (API, CLI, webhooks) and can be triggered on-demand.
3. **No persistence (purely stateless)**: Rejected because historical analysis data is valuable for trend identification, recurring failure detection, and measuring repair success rates.
4. **Non-standardized response format**: Returning raw Pydantic model dicts from endpoints. Rejected because inconsistent error formats (HTTPException vs domain errors) make client-side error handling fragile. The `ApiResponse` wrapper with `success/data/error/request_id` ensures all responses follow the same contract.
5. **`from __future__ import annotations`**: Using the future import for cleaner type hints. Rejected because Pydantic v2 requires runtime type resolution, and the future import causes `PydanticUserError: ApiResponse is not fully defined`. Python 3.11 natively supports `X | None` and `list[X]`, making the import unnecessary.

## References

- MyCodeXvantaOS Python Workspace: `python/pyproject.toml`
- CI Repair Library: `python/packages/mycodexvantaos-ci-repair/`
- CI Repair Agent App: `python/apps/ci-repair-agent/`
- Docker Configuration: `services/ci-repair-agent/`
- CI Workflow: `.github/workflows/ci-repair-agent.yml`
- Test Suite: `python/tests/test_ci_repair_*.py`
- ADR for initial implementation: PR #111 (merged)
