# Python Plane Instructions

## Overview

The Python plane provides specialized services that complement the TypeScript platform. It uses FastAPI for web services and `uv` for package management.

## Directory Structure

```
python/
├── apps/
│   ├── ci-repair-agent/    — GitHub Actions auto-repair service
│   ├── agent-worker/       — Agent task execution worker
│   └── dream-worker/       — Memory consolidation worker
├── packages/
│   ├── mycodexvantaos-agent-worker/  — Agent worker library
│   └── mycodexvantaos-ci-repair/     — CI repair library
├── tests/                  — Shared test suite
├── pyproject.toml          — Project configuration (uv)
└── uv.lock                 — Locked dependencies
```

## Development Commands

```bash
# Install dependencies
cd python && uv sync --extra dev --all-packages

# Run tests
npm run python:test
# Or directly: cd python && .venv/bin/python -m pytest tests/ -v

# Lint with ruff
npm run python:lint
# Or directly: cd python && .venv/bin/ruff check packages/ apps/

# Type check with mypy
npm run python:typecheck
# Or directly: cd python && .venv/bin/mypy packages/ --ignore-missing-imports

# Dream worker dry run
npm run dream:dry-run
```

## CI Repair Agent

### Purpose

Automatically analyzes failed GitHub Actions runs and generates repair plans.

### Usage

```bash
# CLI: Analyze latest failed run
python -m main analyze --token $GITHUB_TOKEN

# CLI: Analyze specific run
python -m main analyze --token $GITHUB_TOKEN --run-id 12345 --output plan.json

# API: Start server
python -m main serve --token $GITHUB_TOKEN --port 8000
```

### CI Workflow

Triggered by changes to:

- `python/packages/mycodexvantaos-ci-repair/**`
- `python/apps/ci-repair-agent/**`
- `python/tests/test_ci_repair_*`
- `services/ci-repair-agent/**`

## Code Standards

- Python 3.11+
- Type hints required for all function signatures
- Use `ruff` for linting and formatting
- Use `mypy` for type checking
- Follow PEP 8 naming conventions
- Use `pydantic` for data validation
- Use `httpx` for HTTP clients (not `requests`)
- Use `pytest` for testing

## Adding New Python Services

1. Create app directory: `python/apps/<service-name>/`
2. Create package if needed: `python/packages/mycodexvantaos-<name>/`
3. Add to `pyproject.toml` workspace
4. Add CI workflow in `.github/workflows/`
5. Create service entry in `services/` (for platform integration)
6. Run `npm run python:lint && npm run python:typecheck`

## Integration with TypeScript Platform

- Python services communicate via HTTP APIs (contract-first)
- Contracts defined in `packages/mycodexvantaos-contracts-sdk/`
- Use JSON schemas from `schemas/` for data validation
- Environment variables for configuration (not config files)
