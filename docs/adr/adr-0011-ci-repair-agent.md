# ADR 0011: GitHub Actions Auto-Repair Agent

**Date**: 2026-05-21
**Status**: Accepted
**Context**: CI Pipeline Observability & Automated Repair

## Context

MyCodeXvantaOS operates a complex CI/CD pipeline with over 50 GitHub Actions workflows across a pnpm monorepo with 106 workspace projects. When CI failures occur, developers must manually navigate to GitHub, find the failed run, read logs, identify the error type, and determine the appropriate fix. This process is time-consuming and repetitive, especially for common failure categories like dependency conflicts, lint violations, and formatting issues that could be automatically classified and often auto-fixed.

The existing Python workspace already uses FastAPI for services and Pydantic v2 for data models. PostgreSQL is used as the persistence layer for other services. The `uv` package manager manages workspace dependencies.

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

3. **Infrastructure**:
   - Docker multi-stage build with `python:3.11-slim`
   - docker-compose.yml with PostgreSQL 16 service
   - GitHub Actions CI workflow for lint, test, and Docker build verification

## Key Design Choices

- **Bottom-up log scanning**: CI logs contain the root cause near the end, so scanning from the bottom provides more accurate classification than top-down scanning.
- **Auto-fix vs manual review**: Only dependency errors and lint errors are classified as auto-fixable. Test failures, build errors, deployment errors, and permission issues always require manual review to prevent unintended changes.
- **Optional PostgreSQL**: The service can operate without a database connection, falling back to stateless mode where analyses are computed on-demand but not persisted. This simplifies development and testing.
- **No LLM dependency**: Error classification uses deterministic regex pattern matching rather than LLM inference, ensuring fast, predictable, and cost-free classification.
- **Workspace package structure**: Following the established monorepo convention with library packages in `python/packages/` and apps in `python/apps/`.

## Consequences

- **Positive**: Developers can quickly identify CI failure categories without reading raw logs. Common issues (dependency conflicts, lint violations) can be auto-fixed with a single API call. Historical analysis data enables trend identification across runs.
- **Positive**: The CLI enables automated pipelines (e.g., run analysis after every failure and post results as a comment).
- **Negative**: Regex-based classification has a finite pattern set and may miss novel error types. New patterns must be added manually to the `_PATTERNS` list in `log_parser.py`.
- **Negative**: Branch/PR creation is limited — the agent creates branches but does not automatically commit file patches. Actual code changes still require manual intervention or a future enhancement with file patching capability.
- **Risk**: The GitHub API rate limit (5,000 requests/hour for authenticated users) could be hit if analyzing many runs in rapid succession. Mitigated by caching run data and limiting log fetch concurrency.

## Alternatives Considered

1. **LLM-based classification**: Using an LLM to classify errors from log text. Rejected due to cost, latency, and non-determinism — regex provides instant, free, reproducible results.
2. **GitHub Actions reusable workflow**: Building the repair agent as a reusable workflow that runs after failures. Rejected because the service model provides more flexibility (API, CLI, webhooks) and can be triggered on-demand.
3. **No persistence (purely stateless)**: Rejected because historical analysis data is valuable for trend identification, recurring failure detection, and measuring repair success rates.

## References

- MyCodeXvantaOS Python Workspace: `python/pyproject.toml`
- CI Repair Library: `python/packages/mycodexvantaos-ci-repair/`
- CI Repair Agent App: `python/apps/ci-repair-agent/`
- Docker Configuration: `services/ci-repair-agent/`
- CI Workflow: `.github/workflows/ci-repair-agent.yml`
