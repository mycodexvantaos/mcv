# ADR 0012: Coder-Deep MCP Server — Persistent Memory, Context Bridging, and AI Behavior Tracking

**Date**: 2026-05-22
**Status**: Accepted
**Supersedes**: None
**Context**: Coder-Deep 快取/巨型專案 — MCP Server, Persistent Memory Store, AI Behavior Tracking, Task Work Tracking, Team Best Practice Codification, Architecture Synchronization, SDK/ADK, and Long-Context Continuity

## Context

MyCodeXvantaOS operates a dual-plane architecture with a TypeScript Control Plane and a Python Intelligence Plane. AI agents (both autonomous and human-assisted) operate across this monorepo of 106 workspace projects, making code modifications, running CI pipelines, fixing bugs, and managing releases. These agents currently lack persistent memory across sessions, have no mechanism to cache and retrieve context efficiently, cannot track their own behavioral patterns, and have no structured way to codify team best practices or manage task lifecycles.

The existing Python workspace already uses FastAPI for services (see ADR 0011), Pydantic v2 for data models, and `uv` as the package manager. The monorepo follows the convention of library packages in `python/packages/` and application services in `python/apps/`.

The Coder-Deep project addresses six critical capability gaps: (1) persistent memory with namespace isolation for cross-session knowledge retention, (2) LRU+TTL context caching for efficient context bridging between agent sessions, (3) AI behavior tracking for observability and pattern detection, (4) architecture synchronization for detecting structural drift, (5) pipeline codex for codifying and querying team best practices, and (6) task tracking with governance-compliant type classification and lifecycle management.

## Decision

Implement the Coder-Deep MCP Server as six composable library modules and one FastAPI service that exposes both an HTTP API and MCP (Model Context Protocol) endpoints:

1. **Persistent Memory Store** (`memory_store.py`) providing:
   - Namespace-isolated key-value storage with optional TTL expiration and tag-based categorization
   - Search by namespace, key prefix, and tags via `MemorySearchParams` model
   - In-memory fallback when DSN is empty string, PostgreSQL persistence via asyncpg when DSN is provided
   - CRUD operations: `put(MemoryItem)`, `get(namespace, key)`, `delete(namespace, key)`, `search(MemorySearchParams)`, `list_namespaces()`, `count()`, `clear_namespace()`
   - Automatic timestamp management (created_at, updated_at, accessed_at)

2. **Context Cache** (`context_cache.py`) providing:
   - LRU eviction by entry count with configurable `max_entries` and `max_size_bytes`
   - Optional TTL expiration per entry with lazy eviction on access
   - Context entries identified by `namespace`, `context_type`, `label`, and `data` fields
   - Query via `ContextQuery` model with namespace, context_type, label, and tag filters
   - Statistics tracking including hit rate, miss rate, entry count, and size metrics
   - Cache operations: `put(ContextEntry)`, `get(entry_id)`, `find(ContextQuery)`, `delete(entry_id)`, `invalidate(namespace)`, `stats()`, `clear()`, `refresh(entry_id, data)`

3. **AI Behavior Tracker** (`behavior_tracker.py`) providing:
   - Action recording with 14 category types: code_generation, code_modification, code_review, debugging, testing, deployment, analysis, planning, communication, file_operation, search, integration, mcp_operation, memory_operation, other
   - 5 outcome types: success, partial, failure, skipped, rolled_back
   - Session-based grouping with automatic session creation on first action
   - Query via `BehaviorQuery` model with session_id, agent_id, category, outcome, and time range filters
   - Aggregated statistics by agent, session, and category
   - Operations: `record(BehaviorAction)`, `query(BehaviorQuery)`, `get_stats()`, `get_session()`, `list_sessions()`, `end_session()`

4. **Architecture Synchronizer** (`architecture_sync.py`) providing:
   - File tree scanning with language detection, test/doc/config classification
   - Snapshot persistence for temporal comparison (in-memory dict storage)
   - Diff computation between snapshots detecting added, removed, and modified files
   - Configurable root_path at construction time, max_depth and include_checksums at scan time
   - Operations: `scan(max_depth, include_checksums)`, `diff(from_id, to_id)`, `list_snapshots()`, `get_latest_snapshot()`

5. **Pipeline Codex** (`pipeline_codex.py`) providing:
   - Best practice and pattern codification with 8 category types: best_practice, pipeline, workflow, capability, runbook, standard, pattern, anti_pattern
   - 4 status types: draft, active, deprecated, archived
   - Version tracking with automatic version increment on content updates
   - Full-text search via `search_text` field in `CodexQuery`
   - Priority and scope metadata for ranking and filtering
   - Operations: `put(CodexEntry)`, `get(entry_id)`, `delete(entry_id)`, `query(CodexQuery)`, `get_versions(entry_id)`, `get_stats()`

6. **Task Tracker** (`task_tracker.py`) providing:
   - Governance-compliant task type classification: A (new feature), B (security patch), C (CI/CD fix), D (docs/ADR), E (release artifact), F (emergency block)
   - 7 status types: pending, in_progress, completed, failed, cancelled, blocked, deferred
   - 4 priority levels: critical, high, medium, low
   - Automatic status transition recording with actor, timestamp, and reason
   - Automatic `started_at` on transition to in_progress, `completed_at` on transition to completed/failed/cancelled
   - Dependency tracking via `depends_on` and `blocks` lists
   - Operations: `create(TaskEntry)`, `get(task_id)`, `update(task_id, updates)`, `delete(task_id)`, `query(TaskQuery)`, `get_transitions(task_id)`, `get_dependencies(task_id)`, `get_stats()`

7. **FastAPI Service** (`coder-deep-mcp/main.py`) providing:
   - HTTP API with 30+ endpoints covering all six modules
   - MCP protocol endpoints for tool discovery, resource listing, prompt templates, and tool invocation
   - SSE (Server-Sent Events) transport endpoint for real-time MCP communication
   - Standardized API response format: `{success, data, error, request_id}`
   - Request ID middleware with `X-Request-ID` header propagation
   - Lifespan handler for service initialization and teardown
   - CLI with `serve` and utility subcommands
   - 11 MCP tools: memory_put, memory_get, memory_search, cache_put, cache_get, behavior_record, codex_put, codex_query, task_create, task_query, architecture_scan

## Key Design Choices

- **Model objects as parameters**: All library methods accept Pydantic model instances (e.g., `MemoryItem`, `TaskEntry`) rather than keyword arguments. This provides type safety, automatic validation, and self-documenting API contracts. The `update()` methods accept `dict[str, Any]` for partial updates since only changed fields are provided.

- **In-memory fallback**: When `dsn=""` (empty string), all stores operate in-memory using Python dicts and lists. This enables zero-dependency development and testing while preserving the same API contract as the PostgreSQL-backed production mode. The `ContextCache` is always in-memory since it is inherently ephemeral.

- **StrEnum for enum classes**: All enum types use `StrEnum` (not `str, Enum`) following ruff UP042 recommendation. Enum values are lowercase strings except `TaskType` which uses UPPERCASE single-letter values (A–F) to match the governance classification system.

- **FastAPI route ordering**: Literal path segments (e.g., `/api/tasks/stats`) must be registered before parameterized paths (e.g., `/api/tasks/{task_id}`) because FastAPI matches routes in definition order. Placing `{task_id}` before `stats` causes `/api/tasks/stats` to match with `task_id="stats"`, which then returns 404 because no task has ID "stats".

- **TestClient lifespan context**: The `TestClient(app)` must be used as a context manager (`with TestClient(app) as client:`) to trigger the FastAPI lifespan handler, which initializes the service singletons. Without the context manager, all service singletons remain `None` and endpoints return 503 Service Unavailable.

- **No `from __future__ import annotations`**: Pydantic v2 requires runtime type resolution for model field validation. Using `from __future__ import annotations` defers all type annotations to strings, which causes `PydanticUserError` when models reference `Any` or other complex types. Python 3.11 natively supports `X | None` and `list[X]`, making the future import unnecessary.

- **LRU + TTL caching strategy**: The context cache combines Least Recently Used eviction (for size-based bounds) with Time-To-Live expiration (for freshness-based bounds). Entries are lazily evicted on access when TTL has expired, and proactively evicted when the cache exceeds max_entries or max_size_bytes. This dual-policy approach ensures both bounded memory usage and data freshness.

- **Namespace isolation**: Memory store namespaces provide logical isolation between different agent sessions, projects, or concern domains. Operations like `clear_namespace()` enable bulk cleanup without affecting other namespaces. Search can be scoped to a single namespace or span all namespaces.

- **Automatic lifecycle timestamps**: The task tracker automatically sets `started_at` when a task transitions to `in_progress` and `completed_at` when it transitions to a terminal state (`completed`, `failed`, `cancelled`). This eliminates the need for callers to manage timestamps manually and ensures consistent lifecycle tracking.

- **Initial creation transition**: When a task is created, an initial `TaskTransition` is recorded with `from_status=""` (empty string) and `to_status` set to the task's initial status. This provides a complete audit trail from task inception.

## Test Suite

The comprehensive test suite covers all layers of the service with 176 tests achieving 70% coverage:

| Test file                         | Tests | Coverage area                                                             |
| --------------------------------- | ----- | ------------------------------------------------------------------------- |
| `test_coder_deep_memory.py`       | 15    | MemoryStore CRUD, search, namespaces, count                               |
| `test_coder_deep_cache.py`        | 20    | ContextCache put/get, TTL, LRU eviction, find, stats, refresh             |
| `test_coder_deep_behavior.py`     | 15    | BehaviorTracker record, query, stats, sessions, enums                     |
| `test_coder_deep_architecture.py` | 16    | ArchitectureSync scan, diff, snapshots, languages, ignores                |
| `test_coder_deep_codex.py`        | 16    | PipelineCodex put/get, versioning, query, stats, enums                    |
| `test_coder_deep_tasks.py`        | 29    | TaskTracker create/update/delete, transitions, dependencies, stats, enums |
| `test_coder_deep_api.py`          | 42    | All 6 API domains, health, request ID, standardized responses             |
| `test_coder_deep_mcp.py`          | 22    | MCP tools/resources/prompts listing, tool invocation, SSE                 |

Key testing techniques:

- **In-memory fixtures** in `conftest_coder_deep.py` using `dsn=""` for zero-dependency unit testing
- **TestClient context manager** for API/MCP tests to trigger lifespan and initialize service singletons
- **Enum validation tests** ensuring TaskType uses UPPERCASE values and lowercase is rejected
- **Lifecycle transition tests** verifying initial creation transition and automatic timestamp management
- **Route ordering verification** confirming `/stats` endpoints resolve correctly (not captured by `/{id}` patterns)

## Consequences

- **Positive**: AI agents gain persistent memory across sessions, enabling knowledge retention and context bridging. The namespace isolation model allows multiple agents to coexist without data collisions.
- **Positive**: The LRU+TTL context cache provides bounded-memory context storage with automatic freshness management, preventing stale data from accumulating indefinitely.
- **Positive**: Behavior tracking enables observability into agent actions, supporting pattern detection, performance analysis, and debugging of autonomous workflows.
- **Positive**: Architecture synchronization detects structural drift between snapshots, enabling agents to verify that their modifications align with the expected project structure.
- **Positive**: The pipeline codex codifies team best practices as queryable entries with versioning, enabling knowledge transfer and onboarding.
- **Positive**: Task tracking with governance-compliant type classification ensures all work items follow the A–F taxonomy, supporting automated workflow routing and compliance reporting.
- **Positive**: The MCP protocol integration enables AI agents to discover and invoke tools through a standardized protocol, supporting tool-use patterns in LLM workflows.
- **Positive**: Standardized API responses and request ID propagation enable reliable integration with observability tooling and API consumers.
- **Negative**: The in-memory fallback does not persist across process restarts. Production deployments must configure PostgreSQL for durability.
- **Negative**: The architecture scanner operates on the local filesystem. Remote repository scanning requires a separate mechanism (e.g., git clone + scan).
- **Negative**: The MCP tool invocation layer does not validate enum values at the API boundary. Invalid categories or task types are accepted and stored as-is. Validation occurs at the library level where StrEnum construction may reject invalid values.
- **Risk**: The context cache size limits are configured at service startup and cannot be changed dynamically. Changing limits requires a service restart.

## Alternatives Considered

1. **Redis for caching**: Using Redis instead of in-memory LRU+TTL. Rejected because the current deployment model favors minimal external dependencies. Redis can be added later as a backend for the cache module without changing the API contract.

2. **SQLite for persistence**: Using SQLite instead of PostgreSQL. Rejected because the monorepo already standardizes on PostgreSQL for persistence (see ADR 0011), and asyncpg provides superior async performance for concurrent access patterns.

3. **Separate microservices for each module**: Deploying each module as an independent service. Rejected because the modules share common infrastructure (database connection, settings) and the combined deployment reduces operational overhead. The modular library design allows future extraction if needed.

4. **GraphQL API**: Using GraphQL instead of REST for flexible querying. Rejected because the query patterns are well-defined (each module has a dedicated query model), and REST provides simpler integration with existing infrastructure (API gateways, load balancers, monitoring).

5. **Event sourcing for behavior tracking**: Recording actions as an immutable event log with projections. Rejected for the initial implementation due to complexity. The current append-only model with query support provides sufficient functionality. Event sourcing can be layered on top of the existing storage model if needed.

6. **OpenAPI-generated clients**: Generating typed client SDKs from the OpenAPI spec. Deferred to a future iteration. The current API is consumed primarily by MCP protocol clients and direct HTTP calls.

## References

- MyCodeXvantaOS Python Workspace: `python/pyproject.toml`
- Coder-Deep Library: `python/packages/mycodexvantaos-coder-deep/`
- Coder-Deep MCP App: `python/apps/coder-deep-mcp/`
- Test Suite: `python/tests/test_coder_deep_*.py`
- Conftest: `python/tests/conftest_coder_deep.py`
- ADR 0011: GitHub Actions Auto-Repair Agent (prior Python service reference)
