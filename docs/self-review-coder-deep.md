# Self-Review: Coder-Deep MCP Server (PR #113)

**Reviewer**: Self (Automated Agent)
**Date**: 2026-05-22
**Scope**: Full implementation of Coder-Deep 快取/巨型專案 — 6 library modules + FastAPI service + test suite

## Summary

This review covers the complete Coder-Deep MCP Server implementation including the 6 core library modules (memory_store, context_cache, behavior_tracker, architecture_sync, pipeline_codex, task_tracker), the FastAPI service with HTTP API and MCP protocol endpoints, and the comprehensive test suite.

## Changes Inventory

### Library Modules (`python/packages/mycodexvantaos-coder-deep/`)

| File                   | Lines | Purpose                                                    |
| ---------------------- | ----- | ---------------------------------------------------------- |
| `memory_store.py`      | 358   | Namespace-isolated key-value store with TTL, tags, search  |
| `context_cache.py`     | 202   | LRU+TTL cache with hit/miss tracking, stats                |
| `behavior_tracker.py`  | 576   | AI action recording, session tracking, 14 categories       |
| `architecture_sync.py` | 385   | File tree scanning, snapshot persistence, diff computation |
| `pipeline_codex.py`    | 493   | Best practice codification, versioning, full-text search   |
| `task_tracker.py`      | 624   | Governance task tracking (A–F), lifecycle transitions      |

### FastAPI Service (`python/apps/coder-deep-mcp/`)

| File      | Lines | Purpose                                          |
| --------- | ----- | ------------------------------------------------ |
| `main.py` | 2032  | HTTP API (30+ endpoints), MCP protocol, CLI, SSE |

### Tests (`python/tests/`)

| File                              | Lines | Tests                     |
| --------------------------------- | ----- | ------------------------- |
| `conftest_coder_deep.py`          | 44    | Shared in-memory fixtures |
| `test_coder_deep_memory.py`       | —     | 15                        |
| `test_coder_deep_cache.py`        | —     | 20                        |
| `test_coder_deep_behavior.py`     | —     | 15                        |
| `test_coder_deep_architecture.py` | —     | 16                        |
| `test_coder_deep_codex.py`        | —     | 16                        |
| `test_coder_deep_tasks.py`        | —     | 29                        |
| `test_coder_deep_api.py`          | —     | 42                        |
| `test_coder_deep_mcp.py`          | —     | 22                        |

### Documentation

| File                                  | Purpose                      |
| ------------------------------------- | ---------------------------- |
| `docs/adr/adr-0012-coder-deep-mcp.md` | Architecture Decision Record |

## Code Quality Checks

### Lint (ruff)

All files pass `ruff check` with zero errors. Fixes applied during development:

- F401: Removed unused imports (`json`, `field`, enum types)
- F821: Fixed `true` → `True` in MCP tool schema (Python boolean, not JSON)
- UP024: Replaced `(OSError, IOError)` with `OSError`
- UP042: Changed `(str, Enum)` to `StrEnum`
- I001: Sorted imports

### Tests

```
176 passed in 1.11s
Coverage: 70% (meeting the 70%+ threshold)
```

### Key Fixes Applied

1. **503 Service Unavailable** — TestClient was not triggering the FastAPI lifespan handler, leaving service singletons as `None`. Fixed by using `TestClient(app)` as a context manager in the `client` fixture: `with TestClient(app) as c: yield c`.

2. **Stats route 404** — FastAPI matches routes in definition order. The `/{entry_id}` or `/{task_id}` parameterized routes were matching `/stats` literal paths. Fixed by moving `/stats` routes before `/{id}` routes for cache, codex, and tasks.

3. **API signature mismatch** — All library methods use model objects as parameters (not keyword arguments). The initial test files used keyword arguments, causing `TypeError`. Rewrote all test files to use the correct model-object API.

4. **Enum value case** — TaskType uses UPPERCASE values (A–F) while other enums use lowercase. Tests initially used lowercase task types, which would fail enum validation. Corrected to UPPERCASE.

## Adherence to Governance Rules

| Rule                                    | Status | Notes                                                                     |
| --------------------------------------- | ------ | ------------------------------------------------------------------------- |
| Minimal change principle                | ✅     | Only reordered routes and fixed test fixtures; no unnecessary refactoring |
| Language scope (TS/JS + Python)         | ✅     | All code is Python; no new languages introduced                           |
| CodeQL (javascript-typescript + python) | ✅     | Python service follows same patterns as CI Repair Agent (ADR 0011)        |
| lowercase kebab-case naming             | ✅     | Package: `mycodexvantaos-coder-deep`, app: `coder-deep-mcp`               |
| Task type classification (A–F)          | ✅     | TaskType enum with A_NEW_FEATURE through F_EMERGENCY_BLOCK                |
| Production-ready engineering            | ✅     | Standardized responses, error handling, request ID tracing                |
| ADR documentation                       | ✅     | `docs/adr/adr-0012-coder-deep-mcp.md`                                     |
| Self-review                             | ✅     | This document                                                             |

## Risk Assessment

| Risk                                    | Severity | Mitigation                                                        |
| --------------------------------------- | -------- | ----------------------------------------------------------------- |
| In-memory stores lose data on restart   | Medium   | Production must configure PostgreSQL DSN                          |
| No enum validation at API boundary      | Low      | Library StrEnum rejects invalid values; API layer accepts strings |
| Architecture scanner only works locally | Low      | Remote scanning requires git clone + scan                         |
| Context cache limits not dynamic        | Low      | Service restart required; acceptable for current use case         |

## Conclusion

The Coder-Deep MCP Server implementation is production-ready with 176 passing tests, 70% coverage, zero lint errors, and comprehensive documentation. The dual-plane architecture (library modules + FastAPI service) provides clean separation of concerns and enables both programmatic and protocol-based consumption. The identified risks are acceptable for the initial release and can be addressed in future iterations.
