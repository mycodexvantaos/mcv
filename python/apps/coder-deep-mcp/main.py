"""Coder-Deep MCP Server — FastAPI service and CLI for persistent memory, context bridging, and AI behavior tracking.

Provides both an HTTP API with standardized responses and an MCP (Model Context Protocol)
server for AI context bridging. Supports persistent memory, context caching, behavior
tracking, architecture synchronization, pipeline codification, and task management.
"""

import argparse
import json
import logging
import os
import sys
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from mycodexvantaos_coder_deep.architecture_sync import ArchitectureSync
from mycodexvantaos_coder_deep.behavior_tracker import (
    BehaviorAction,
    BehaviorQuery,
    BehaviorTracker,
)
from mycodexvantaos_coder_deep.context_cache import (
    ContextCache,
    ContextEntry,
    ContextQuery,
)
from mycodexvantaos_coder_deep.memory_store import (
    MemoryItem,
    MemorySearchParams,
    MemoryStore,
)
from mycodexvantaos_coder_deep.pipeline_codex import (
    CodexEntry,
    CodexQuery,
    PipelineCodex,
)
from mycodexvantaos_coder_deep.task_tracker import TaskEntry, TaskQuery, TaskTracker
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


class Settings(BaseModel):
    """Application settings loaded from environment variables."""

    database_url: str = ""
    log_level: str = "INFO"
    host: str = "0.0.0.0"
    port: int = 8010

    # Context cache limits
    cache_max_entries: int = 1000
    cache_max_size_bytes: int = 52428800  # 50 MB

    # MCP settings
    mcp_enabled: bool = True


def _load_settings() -> Settings:
    """Load settings from environment variables."""
    return Settings(
        database_url=os.getenv("DATABASE_URL", ""),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8010")),
        cache_max_entries=int(os.getenv("CACHE_MAX_ENTRIES", "1000")),
        cache_max_size_bytes=int(
            os.getenv("CACHE_MAX_SIZE_BYTES", "52428800")),
        mcp_enabled=os.getenv("MCP_ENABLED", "true").lower() == "true",
    )


settings = _load_settings()

# ---------------------------------------------------------------------------
# Service singletons
# ---------------------------------------------------------------------------

_memory_store: MemoryStore | None = None
_context_cache: ContextCache | None = None
_behavior_tracker: BehaviorTracker | None = None
_architecture_sync: ArchitectureSync | None = None
_pipeline_codex: PipelineCodex | None = None
_task_tracker: TaskTracker | None = None


def _get_memory() -> MemoryStore:
    """Get the memory store singleton."""
    if _memory_store is None:
        raise AppException(
            code=ErrorCode.SERVICE_UNAVAILABLE,
            message="Memory store not initialized",
            status_code=503,
        )
    return _memory_store


def _get_cache() -> ContextCache:
    """Get the context cache singleton."""
    if _context_cache is None:
        raise AppException(
            code=ErrorCode.SERVICE_UNAVAILABLE,
            message="Context cache not initialized",
            status_code=503,
        )
    return _context_cache


def _get_behavior() -> BehaviorTracker:
    """Get the behavior tracker singleton."""
    if _behavior_tracker is None:
        raise AppException(
            code=ErrorCode.SERVICE_UNAVAILABLE,
            message="Behavior tracker not initialized",
            status_code=503,
        )
    return _behavior_tracker


def _get_architecture() -> ArchitectureSync:
    """Get the architecture sync singleton."""
    if _architecture_sync is None:
        raise AppException(
            code=ErrorCode.SERVICE_UNAVAILABLE,
            message="Architecture sync not initialized",
            status_code=503,
        )
    return _architecture_sync


def _get_codex() -> PipelineCodex:
    """Get the pipeline codex singleton."""
    if _pipeline_codex is None:
        raise AppException(
            code=ErrorCode.SERVICE_UNAVAILABLE,
            message="Pipeline codex not initialized",
            status_code=503,
        )
    return _pipeline_codex


def _get_tasks() -> TaskTracker:
    """Get the task tracker singleton."""
    if _task_tracker is None:
        raise AppException(
            code=ErrorCode.SERVICE_UNAVAILABLE,
            message="Task tracker not initialized",
            status_code=503,
        )
    return _task_tracker


# ---------------------------------------------------------------------------
# Standardized API response models
# ---------------------------------------------------------------------------


class ErrorCode:
    """Standardized error codes for API responses."""

    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHORIZED = "UNAUTHORIZED"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    DATABASE_ERROR = "DATABASE_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    MEMORY_ERROR = "MEMORY_ERROR"
    CACHE_ERROR = "CACHE_ERROR"
    BEHAVIOR_ERROR = "BEHAVIOR_ERROR"
    ARCHITECTURE_ERROR = "ARCHITECTURE_ERROR"
    CODEX_ERROR = "CODEX_ERROR"
    TASK_ERROR = "TASK_ERROR"


class ApiResponse(BaseModel):
    """Standardized API response wrapper.

    All API endpoints return this format with success, data, error, and request_id.
    """

    success: bool
    data: dict[str, Any] | None = None
    error: dict[str, Any] | None = None
    request_id: str


class AppException(Exception):
    """Base application exception with error code and HTTP status."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


# ---------------------------------------------------------------------------
# API domain models
# ---------------------------------------------------------------------------


class HealthData(BaseModel):
    """Health check response data."""

    status: str = "ok"
    version: str = "0.1.0"
    database: str = "not_configured"
    services: dict[str, str] = Field(default_factory=dict)
    timestamp: str = ""


# -- Memory models --


class MemoryPutRequest(BaseModel):
    """Request body for putting a memory item."""

    namespace: str = "default"
    key: str
    value: Any
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    ttl_seconds: int | None = None


class MemorySearchRequest(BaseModel):
    """Request body for searching memory."""

    namespace: str | None = None
    key_prefix: str | None = None
    tags: list[str] = Field(default_factory=list)
    source: str | None = None
    limit: int = 50
    offset: int = 0


# -- Context cache models --


class ContextPutRequest(BaseModel):
    """Request body for putting a context entry."""

    namespace: str = "default"
    context_type: str = "general"
    label: str = ""
    data: Any
    tags: list[str] = Field(default_factory=list)
    ttl_seconds: int | None = None


class ContextFindRequest(BaseModel):
    """Request body for finding context entries."""

    namespace: str | None = None
    context_type: str | None = None
    label: str | None = None
    tags: list[str] = Field(default_factory=list)
    limit: int = 50
    offset: int = 0


# -- Behavior tracker models --


class BehaviorRecordRequest(BaseModel):
    """Request body for recording a behavior action."""

    session_id: str = ""
    agent_id: str = "default"
    action_name: str
    action_category: str = "other"
    description: str = ""
    outcome: str = "success"
    error_message: str = ""
    duration_ms: int = 0
    metadata: dict[str, Any] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)
    repository: str = ""
    branch: str = ""
    file_paths: list[str] = Field(default_factory=list)
    task_type: str = ""


class BehaviorQueryRequest(BaseModel):
    """Request body for querying behavior actions."""

    session_id: str | None = None
    agent_id: str | None = None
    action_category: str | None = None
    outcome: str | None = None
    repository: str | None = None
    branch: str | None = None
    task_type: str | None = None
    tags: list[str] = Field(default_factory=list)
    start_time: str | None = None
    end_time: str | None = None
    limit: int = 50
    offset: int = 0


# -- Architecture sync models --


class ArchitectureScanRequest(BaseModel):
    """Request body for scanning architecture."""

    max_depth: int = 10
    include_checksums: bool = True


class ArchitectureDiffRequest(BaseModel):
    """Request body for computing architecture diff."""

    from_id: str | None = None
    to_id: str | None = None


# -- Pipeline codex models --


class CodexPutRequest(BaseModel):
    """Request body for putting a codex entry."""

    category: str = "best_practice"
    title: str
    description: str = ""
    content: str = ""
    status: str = "active"
    author: str = ""
    team: str = ""
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    scope: str = "global"
    priority: int = 0


class CodexQueryRequest(BaseModel):
    """Request body for querying codex entries."""

    category: str | None = None
    status: str | None = None
    team: str | None = None
    tags: list[str] = Field(default_factory=list)
    scope: str | None = None
    search_text: str | None = None
    limit: int = 50
    offset: int = 0


# -- Task tracker models --


class TaskCreateRequest(BaseModel):
    """Request body for creating a task."""

    title: str
    description: str = ""
    task_type: str = "A"
    priority: str = "medium"
    assignee: str = ""
    session_id: str = ""
    tags: list[str] = Field(default_factory=list)
    depends_on: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    repository: str = ""
    branch: str = ""


class TaskUpdateRequest(BaseModel):
    """Request body for updating a task."""

    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    assignee: str | None = None
    tags: list[str] | None = None
    depends_on: list[str] | None = None
    metadata: dict[str, Any] | None = None


class TaskQueryRequest(BaseModel):
    """Request body for querying tasks."""

    status: str | None = None
    task_type: str | None = None
    priority: str | None = None
    assignee: str | None = None
    session_id: str | None = None
    repository: str | None = None
    branch: str | None = None
    tags: list[str] = Field(default_factory=list)
    limit: int = 50
    offset: int = 0


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """Application lifespan handler — initialize and teardown all services."""
    global _memory_store, _context_cache, _behavior_tracker  # noqa: PLW0603
    global _architecture_sync, _pipeline_codex, _task_tracker  # noqa: PLW0603

    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    logger.info("Coder-Deep MCP Server starting v0.1.0")

    dsn = settings.database_url or None

    # Initialize services
    _memory_store = MemoryStore(dsn=dsn)
    _context_cache = ContextCache(
        max_entries=settings.cache_max_entries,
        max_size_bytes=settings.cache_max_size_bytes,
    )
    _behavior_tracker = BehaviorTracker(dsn=dsn)
    _architecture_sync = ArchitectureSync(root_path=os.getcwd())
    _pipeline_codex = PipelineCodex(dsn=dsn)
    _task_tracker = TaskTracker(dsn=dsn)

    # Connect to database if DSN configured
    if dsn:
        for svc_name, svc in [
            ("memory_store", _memory_store),
            ("behavior_tracker", _behavior_tracker),
            ("pipeline_codex", _pipeline_codex),
            ("task_tracker", _task_tracker),
        ]:
            try:
                await svc.connect()
                logger.info("Connected %s to database", svc_name)
            except Exception:
                logger.exception(
                    "Failed to connect %s — running in-memory mode", svc_name
                )

    logger.info("All services initialized")
    yield

    # Teardown — close database connections
    for svc_name, svc in [
        ("memory_store", _memory_store),
        ("behavior_tracker", _behavior_tracker),
        ("pipeline_codex", _pipeline_codex),
        ("task_tracker", _task_tracker),
    ]:
        if svc is not None:
            try:
                await svc.close()
            except Exception:
                logger.exception("Error closing %s", svc_name)

    logger.info("Coder-Deep MCP Server shutting down")


app = FastAPI(
    title="Coder-Deep MCP Server",
    description="Persistent memory, context bridging, AI behavior tracking, and architecture sync for MyCodeXvantaOS",
    version="0.1.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Middleware: request ID injection
# ---------------------------------------------------------------------------


@app.middleware("http")
async def request_id_middleware(request: Request, call_next: Any) -> Any:
    """Attach a unique request_id to every request for tracing."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application-level exceptions with standardized format."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            success=False,
            error={
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
            request_id=request_id,
        ).model_dump(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTPExceptions with standardized format."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            success=False,
            error={
                "code": ErrorCode.INTERNAL_ERROR,
                "message": str(exc.detail),
            },
            request_id=request_id,
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions with standardized format."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content=ApiResponse(
            success=False,
            error={
                "code": ErrorCode.INTERNAL_ERROR,
                "message": "An unexpected error occurred",
            },
            request_id=request_id,
        ).model_dump(),
    )


# ---------------------------------------------------------------------------
# Helper: build success response
# ---------------------------------------------------------------------------


def _success(request: Request, data: dict[str, Any]) -> dict[str, Any]:
    """Build a standardized success response."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return ApiResponse(success=True, data=data, request_id=request_id).model_dump()


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------


@app.get("/health")
async def health_check(request: Request) -> dict[str, Any]:
    """Health check endpoint — reports service and database status."""
    db_status = "not_configured"
    if settings.database_url:
        db_status = "connected"
        try:
            if _memory_store:
                count = await _memory_store.count()
                db_status = f"connected({count} memory items)"
        except Exception:
            db_status = "error"

    services_status = {
        "memory_store": "ok" if _memory_store else "not_initialized",
        "context_cache": "ok" if _context_cache else "not_initialized",
        "behavior_tracker": "ok" if _behavior_tracker else "not_initialized",
        "architecture_sync": "ok" if _architecture_sync else "not_initialized",
        "pipeline_codex": "ok" if _pipeline_codex else "not_initialized",
        "task_tracker": "ok" if _task_tracker else "not_initialized",
    }

    data = HealthData(
        status="ok",
        version="0.1.0",
        database=db_status,
        services=services_status,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
    return _success(request, data.model_dump())


# ===========================================================================
# Memory Store endpoints
# ===========================================================================


@app.post("/api/memory")
async def memory_put(request: Request, body: MemoryPutRequest) -> dict[str, Any]:
    """Store a memory item in the persistent memory store.

    Items are namespace-isolated and support optional TTL, tags, and metadata.
    If the key already exists in the namespace, it will be updated.
    """
    store = _get_memory()
    try:
        item = MemoryItem(
            namespace=body.namespace,
            key=body.key,
            value=body.value,
            tags=body.tags,
            metadata=body.metadata,
        )
        result = await store.put(item=item)
        return _success(
            request, {"namespace": result.namespace,
                      "key": result.key, "stored": True}
        )
    except Exception as exc:
        raise AppException(
            code=ErrorCode.MEMORY_ERROR,
            message=f"Failed to store memory item: {exc}",
            status_code=500,
        ) from exc


@app.get("/api/memory/{namespace}/{key}")
async def memory_get(request: Request, namespace: str, key: str) -> dict[str, Any]:
    """Retrieve a memory item by namespace and key."""
    store = _get_memory()
    try:
        item = await store.get(namespace=namespace, key=key)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.MEMORY_ERROR,
            message=f"Failed to retrieve memory item: {exc}",
            status_code=500,
        ) from exc

    if item is None:
        raise AppException(
            code=ErrorCode.NOT_FOUND,
            message=f"Memory item not found: {namespace}/{key}",
            status_code=404,
        )

    return _success(request, item.model_dump())


@app.delete("/api/memory/{namespace}/{key}")
async def memory_delete(request: Request, namespace: str, key: str) -> dict[str, Any]:
    """Delete a memory item by namespace and key."""
    store = _get_memory()
    try:
        deleted = await store.delete(namespace=namespace, key=key)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.MEMORY_ERROR,
            message=f"Failed to delete memory item: {exc}",
            status_code=500,
        ) from exc

    return _success(request, {"namespace": namespace, "key": key, "deleted": deleted})


@app.post("/api/memory/search")
async def memory_search(request: Request, body: MemorySearchRequest) -> dict[str, Any]:
    """Search memory items across namespaces by key prefix, tags, and source."""
    store = _get_memory()
    try:
        params = MemorySearchParams(
            namespace=body.namespace,
            key_prefix=body.key_prefix,
            tags=body.tags,
            source=body.source,
            limit=body.limit,
            offset=body.offset,
        )
        result = await store.search(params=params)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.MEMORY_ERROR,
            message=f"Failed to search memory: {exc}",
            status_code=500,
        ) from exc

    return _success(request, result.model_dump())


@app.get("/api/memory/namespaces")
async def memory_list_namespaces(request: Request) -> dict[str, Any]:
    """List all memory namespaces."""
    store = _get_memory()
    try:
        namespaces = await store.list_namespaces()
        count = await store.count()
    except Exception as exc:
        raise AppException(
            code=ErrorCode.MEMORY_ERROR,
            message=f"Failed to list namespaces: {exc}",
            status_code=500,
        ) from exc

    return _success(request, {"namespaces": namespaces, "total_items": count})


@app.delete("/api/memory/{namespace}")
async def memory_clear_namespace(request: Request, namespace: str) -> dict[str, Any]:
    """Clear all items in a memory namespace."""
    store = _get_memory()
    try:
        cleared = await store.clear_namespace(namespace=namespace)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.MEMORY_ERROR,
            message=f"Failed to clear namespace: {exc}",
            status_code=500,
        ) from exc

    return _success(request, {"namespace": namespace, "cleared": cleared})


# ===========================================================================
# Context Cache endpoints
# ===========================================================================


@app.post("/api/cache")
async def cache_put(request: Request, body: ContextPutRequest) -> dict[str, Any]:
    """Store a context entry in the LRU+TTL cache.

    Entries are evicted by LRU policy when max_entries or max_size_bytes is exceeded.
    Optional TTL causes automatic expiration.
    """
    cache = _get_cache()
    try:
        entry = ContextEntry(
            namespace=body.namespace,
            context_type=body.context_type,
            label=body.label,
            data=body.data,
            tags=body.tags,
        )
        result = await cache.put(entry=entry)
        return _success(
            request,
            {
                "entry_id": result.entry_id,
                "stored": True,
                "size_bytes": result.size_bytes,
            },
        )
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CACHE_ERROR,
            message=f"Failed to store context entry: {exc}",
            status_code=500,
        ) from exc


@app.get("/api/cache/stats")
async def cache_stats(request: Request) -> dict[str, Any]:
    """Get context cache statistics including hit rate and size."""
    cache = _get_cache()
    try:
        stats = await cache.stats()
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CACHE_ERROR,
            message=f"Failed to get cache stats: {exc}",
            status_code=500,
        ) from exc

    return _success(request, stats.model_dump())


@app.get("/api/cache/{entry_id}")
async def cache_get(request: Request, entry_id: str) -> dict[str, Any]:
    """Retrieve a context entry by entry ID."""
    cache = _get_cache()
    try:
        entry = await cache.get(entry_id=entry_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CACHE_ERROR,
            message=f"Failed to retrieve context entry: {exc}",
            status_code=500,
        ) from exc

    if entry is None:
        raise AppException(
            code=ErrorCode.NOT_FOUND,
            message=f"Context entry not found: {entry_id}",
            status_code=404,
        )

    return _success(request, entry.model_dump())


@app.delete("/api/cache/{entry_id}")
async def cache_delete(request: Request, entry_id: str) -> dict[str, Any]:
    """Delete a context entry by entry ID."""
    cache = _get_cache()
    try:
        deleted = await cache.delete(entry_id=entry_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CACHE_ERROR,
            message=f"Failed to delete context entry: {exc}",
            status_code=500,
        ) from exc

    return _success(request, {"entry_id": entry_id, "deleted": deleted})


@app.post("/api/cache/find")
async def cache_find(request: Request, body: ContextFindRequest) -> dict[str, Any]:
    """Find context entries matching query parameters."""
    cache = _get_cache()
    try:
        query = ContextQuery(
            namespace=body.namespace,
            context_type=body.context_type,
            label=body.label,
            tags=body.tags,
            limit=body.limit,
            offset=body.offset,
        )
        entries = await cache.find(query=query)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CACHE_ERROR,
            message=f"Failed to find context entries: {exc}",
            status_code=500,
        ) from exc

    return _success(
        request, {"entries": [e.model_dump()
                              for e in entries], "count": len(entries)}
    )


@app.post("/api/cache/invalidate/{namespace}")
async def cache_invalidate(request: Request, namespace: str) -> dict[str, Any]:
    """Invalidate all entries in a namespace from the cache."""
    cache = _get_cache()
    try:
        count = await cache.invalidate(namespace=namespace)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CACHE_ERROR,
            message=f"Failed to invalidate cache: {exc}",
            status_code=500,
        ) from exc

    return _success(request, {"namespace": namespace, "invalidated": count})


# ===========================================================================
# Behavior Tracker endpoints
# ===========================================================================


@app.post("/api/behavior/record")
async def behavior_record(
    request: Request, body: BehaviorRecordRequest
) -> dict[str, Any]:
    """Record an AI behavior action.

    Actions are grouped by session and tracked with category, outcome, and duration.
    """
    tracker = _get_behavior()
    try:
        action = BehaviorAction(
            session_id=body.session_id,
            agent_id=body.agent_id,
            action_name=body.action_name,
            action_category=body.action_category,
            description=body.description,
            outcome=body.outcome,
            error_message=body.error_message,
            duration_ms=body.duration_ms,
            metadata=body.metadata,
            tags=body.tags,
            repository=body.repository,
            branch=body.branch,
            file_paths=body.file_paths,
            task_type=body.task_type,
        )
        result = await tracker.record(action=action)
        return _success(request, {"action_id": result.action_id, "recorded": True})
    except Exception as exc:
        raise AppException(
            code=ErrorCode.BEHAVIOR_ERROR,
            message=f"Failed to record behavior: {exc}",
            status_code=500,
        ) from exc


@app.post("/api/behavior/query")
async def behavior_query(
    request: Request, body: BehaviorQueryRequest
) -> dict[str, Any]:
    """Query behavior actions by session, agent, category, or outcome."""
    tracker = _get_behavior()
    try:
        params = BehaviorQuery(
            session_id=body.session_id,
            agent_id=body.agent_id,
            action_category=body.action_category,
            outcome=body.outcome,
            repository=body.repository,
            branch=body.branch,
            task_type=body.task_type,
            tags=body.tags,
            start_time=body.start_time,
            end_time=body.end_time,
            limit=body.limit,
            offset=body.offset,
        )
        actions = await tracker.query(params=params)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.BEHAVIOR_ERROR,
            message=f"Failed to query behavior: {exc}",
            status_code=500,
        ) from exc

    return _success(
        request, {"actions": [a.model_dump()
                              for a in actions], "count": len(actions)}
    )


@app.get("/api/behavior/stats")
async def behavior_stats(
    request: Request,
    agent_id: str | None = Query(
        default=None, description="Filter by agent ID"),
    session_id: str | None = Query(
        default=None, description="Filter by session ID"),
) -> dict[str, Any]:
    """Get behavior statistics, optionally filtered by agent or session."""
    tracker = _get_behavior()
    try:
        stats = await tracker.get_stats(agent_id=agent_id, session_id=session_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.BEHAVIOR_ERROR,
            message=f"Failed to get behavior stats: {exc}",
            status_code=500,
        ) from exc

    return _success(request, stats.model_dump())


@app.get("/api/behavior/sessions")
async def behavior_list_sessions(
    request: Request,
    limit: int = Query(default=50, ge=1, le=500),
) -> dict[str, Any]:
    """List recent behavior tracking sessions."""
    tracker = _get_behavior()
    try:
        sessions = await tracker.list_sessions(limit=limit)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.BEHAVIOR_ERROR,
            message=f"Failed to list sessions: {exc}",
            status_code=500,
        ) from exc

    return _success(
        request,
        {"sessions": [s.model_dump() for s in sessions],
         "count": len(sessions)},
    )


# ===========================================================================
# Architecture Sync endpoints
# ===========================================================================


@app.post("/api/architecture/scan")
async def architecture_scan(
    request: Request, body: ArchitectureScanRequest
) -> dict[str, Any]:
    """Scan the project directory tree and produce an architecture snapshot.

    The snapshot includes all files with their languages, sizes, and checksums,
    along with directory structure and module boundaries.
    """
    sync = _get_architecture()
    try:
        snapshot = await sync.scan(
            max_depth=body.max_depth,
            include_checksums=body.include_checksums,
        )
    except Exception as exc:
        raise AppException(
            code=ErrorCode.ARCHITECTURE_ERROR,
            message=f"Failed to scan architecture: {exc}",
            status_code=500,
        ) from exc

    return _success(request, snapshot.model_dump())


@app.post("/api/architecture/diff")
async def architecture_diff(
    request: Request, body: ArchitectureDiffRequest
) -> dict[str, Any]:
    """Compute the diff between two architecture snapshots.

    If from_id is not provided, uses the second-to-last snapshot.
    If to_id is not provided, uses the latest snapshot.
    """
    sync = _get_architecture()
    try:
        diff_result = await sync.diff(from_id=body.from_id, to_id=body.to_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.ARCHITECTURE_ERROR,
            message=f"Failed to compute architecture diff: {exc}",
            status_code=500,
        ) from exc

    return _success(request, diff_result.model_dump())


# ===========================================================================
# Pipeline Codex endpoints
# ===========================================================================


@app.post("/api/codex")
async def codex_put(request: Request, body: CodexPutRequest) -> dict[str, Any]:
    """Store a best practice or pipeline entry in the codex.

    Entries are categorized and versioned. Updates create new versions automatically.
    """
    codex = _get_codex()
    try:
        entry = CodexEntry(
            category=body.category,
            title=body.title,
            description=body.description,
            content=body.content,
            status=body.status,
            author=body.author,
            team=body.team,
            tags=body.tags,
            metadata=body.metadata,
            scope=body.scope,
            priority=body.priority,
        )
        result = await codex.put(entry=entry)
        return _success(
            request,
            {"entry_id": result.entry_id, "version": result.version, "stored": True},
        )
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CODEX_ERROR,
            message=f"Failed to store codex entry: {exc}",
            status_code=500,
        ) from exc


@app.get("/api/codex/stats")
async def codex_stats(request: Request) -> dict[str, Any]:
    """Get codex statistics including entry counts by category."""
    codex = _get_codex()
    try:
        stats = await codex.get_stats()
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CODEX_ERROR,
            message=f"Failed to get codex stats: {exc}",
            status_code=500,
        ) from exc

    return _success(request, stats.model_dump())


@app.get("/api/codex/{entry_id}")
async def codex_get(request: Request, entry_id: str) -> dict[str, Any]:
    """Retrieve a codex entry by ID."""
    codex = _get_codex()
    try:
        entry = await codex.get(entry_id=entry_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CODEX_ERROR,
            message=f"Failed to retrieve codex entry: {exc}",
            status_code=500,
        ) from exc

    if entry is None:
        raise AppException(
            code=ErrorCode.NOT_FOUND,
            message=f"Codex entry not found: {entry_id}",
            status_code=404,
        )

    return _success(request, entry.model_dump())


@app.delete("/api/codex/{entry_id}")
async def codex_delete(request: Request, entry_id: str) -> dict[str, Any]:
    """Delete a codex entry by ID."""
    codex = _get_codex()
    try:
        deleted = await codex.delete(entry_id=entry_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CODEX_ERROR,
            message=f"Failed to delete codex entry: {exc}",
            status_code=500,
        ) from exc

    return _success(request, {"entry_id": entry_id, "deleted": deleted})


@app.post("/api/codex/query")
async def codex_query(request: Request, body: CodexQueryRequest) -> dict[str, Any]:
    """Query codex entries by category, status, team, tags, and search text."""
    codex = _get_codex()
    try:
        params = CodexQuery(
            category=body.category,
            status=body.status,
            team=body.team,
            tags=body.tags,
            scope=body.scope,
            search_text=body.search_text,
            limit=body.limit,
            offset=body.offset,
        )
        entries = await codex.query(params=params)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CODEX_ERROR,
            message=f"Failed to query codex: {exc}",
            status_code=500,
        ) from exc

    return _success(
        request, {"entries": [e.model_dump()
                              for e in entries], "count": len(entries)}
    )


@app.get("/api/codex/{entry_id}/versions")
async def codex_versions(request: Request, entry_id: str) -> dict[str, Any]:
    """Get version history for a codex entry."""
    codex = _get_codex()
    try:
        versions = await codex.get_versions(entry_id=entry_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.CODEX_ERROR,
            message=f"Failed to get codex versions: {exc}",
            status_code=500,
        ) from exc

    return _success(
        request, {"entry_id": entry_id, "versions": [
            v.model_dump() for v in versions]}
    )


# ===========================================================================
# Task Tracker endpoints
# ===========================================================================


@app.post("/api/tasks")
async def task_create(request: Request, body: TaskCreateRequest) -> dict[str, Any]:
    """Create a new task in the task tracker.

    Tasks follow the governance classification system: A (new feature), B (security),
    C (CI/CD), D (docs), E (release), F (emergency).
    """
    tracker = _get_tasks()
    try:
        task = TaskEntry(
            title=body.title,
            description=body.description,
            task_type=body.task_type,
            priority=body.priority,
            assignee=body.assignee,
            session_id=body.session_id,
            tags=body.tags,
            depends_on=body.depends_on,
            metadata=body.metadata,
            repository=body.repository,
            branch=body.branch,
        )
        result = await tracker.create(task=task)
        return _success(
            request,
            {"task_id": result.task_id, "status": result.status, "created": True},
        )
    except Exception as exc:
        raise AppException(
            code=ErrorCode.TASK_ERROR,
            message=f"Failed to create task: {exc}",
            status_code=500,
        ) from exc


@app.get("/api/tasks/stats")
async def task_stats(request: Request) -> dict[str, Any]:
    """Get task statistics including counts by status, type, and priority."""
    tracker = _get_tasks()
    try:
        stats = await tracker.get_stats()
    except Exception as exc:
        raise AppException(
            code=ErrorCode.TASK_ERROR,
            message=f"Failed to get task stats: {exc}",
            status_code=500,
        ) from exc

    return _success(request, stats.model_dump())


@app.get("/api/tasks/{task_id}")
async def task_get(request: Request, task_id: str) -> dict[str, Any]:
    """Retrieve a task by ID."""
    tracker = _get_tasks()
    try:
        task = await tracker.get(task_id=task_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.TASK_ERROR,
            message=f"Failed to retrieve task: {exc}",
            status_code=500,
        ) from exc

    if task is None:
        raise AppException(
            code=ErrorCode.NOT_FOUND,
            message=f"Task not found: {task_id}",
            status_code=404,
        )

    return _success(request, task.model_dump())


@app.patch("/api/tasks/{task_id}")
async def task_update(
    request: Request, task_id: str, body: TaskUpdateRequest
) -> dict[str, Any]:
    """Update a task. Status changes are automatically recorded as transitions."""
    tracker = _get_tasks()
    try:
        updates: dict[str, Any] = {}
        if body.title is not None:
            updates["title"] = body.title
        if body.description is not None:
            updates["description"] = body.description
        if body.status is not None:
            updates["status"] = body.status
        if body.priority is not None:
            updates["priority"] = body.priority
        if body.assignee is not None:
            updates["assignee"] = body.assignee
        if body.tags is not None:
            updates["tags"] = body.tags
        if body.depends_on is not None:
            updates["depends_on"] = body.depends_on
        if body.metadata is not None:
            updates["metadata"] = body.metadata

        task = await tracker.update(task_id=task_id, updates=updates)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.TASK_ERROR,
            message=f"Failed to update task: {exc}",
            status_code=500,
        ) from exc

    if task is None:
        raise AppException(
            code=ErrorCode.NOT_FOUND,
            message=f"Task not found: {task_id}",
            status_code=404,
        )

    return _success(request, task.model_dump())


@app.delete("/api/tasks/{task_id}")
async def task_delete(request: Request, task_id: str) -> dict[str, Any]:
    """Delete a task by ID."""
    tracker = _get_tasks()
    try:
        deleted = await tracker.delete(task_id=task_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.TASK_ERROR,
            message=f"Failed to delete task: {exc}",
            status_code=500,
        ) from exc

    return _success(request, {"task_id": task_id, "deleted": deleted})


@app.post("/api/tasks/query")
async def task_query(request: Request, body: TaskQueryRequest) -> dict[str, Any]:
    """Query tasks by status, type, priority, assignee, and other filters."""
    tracker = _get_tasks()
    try:
        params = TaskQuery(
            status=body.status,
            task_type=body.task_type,
            priority=body.priority,
            assignee=body.assignee,
            session_id=body.session_id,
            repository=body.repository,
            branch=body.branch,
            tags=body.tags,
            limit=body.limit,
            offset=body.offset,
        )
        tasks = await tracker.query(params=params)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.TASK_ERROR,
            message=f"Failed to query tasks: {exc}",
            status_code=500,
        ) from exc

    return _success(
        request, {"tasks": [t.model_dump() for t in tasks],
                  "count": len(tasks)}
    )


@app.get("/api/tasks/{task_id}/transitions")
async def task_transitions(request: Request, task_id: str) -> dict[str, Any]:
    """Get status transition history for a task."""
    tracker = _get_tasks()
    try:
        transitions = await tracker.get_transitions(task_id=task_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.TASK_ERROR,
            message=f"Failed to get task transitions: {exc}",
            status_code=500,
        ) from exc

    return _success(
        request,
        {"task_id": task_id, "transitions": [
            t.model_dump() for t in transitions]},
    )


@app.get("/api/tasks/{task_id}/dependencies")
async def task_dependencies(request: Request, task_id: str) -> dict[str, Any]:
    """Get tasks that this task depends on."""
    tracker = _get_tasks()
    try:
        deps = await tracker.get_dependencies(task_id=task_id)
    except Exception as exc:
        raise AppException(
            code=ErrorCode.TASK_ERROR,
            message=f"Failed to get task dependencies: {exc}",
            status_code=500,
        ) from exc

    return _success(
        request, {"task_id": task_id, "dependencies": [
            d.model_dump() for d in deps]}
    )


# ===========================================================================
# MCP Protocol endpoints (Phase 4)
# ===========================================================================


@app.get("/api/mcp/tools")
async def mcp_list_tools(request: Request) -> dict[str, Any]:
    """List available MCP tools.

    Returns the complete catalog of tools that AI agents can invoke
    through the Model Context Protocol.
    """
    tools = [
        {
            "name": "memory_put",
            "description": "Store a key-value memory item in a namespace with optional TTL and tags",
            "input_schema": {
                "type": "object",
                "properties": {
                    "namespace": {
                        "type": "string",
                        "description": "Memory namespace for isolation",
                    },
                    "key": {
                        "type": "string",
                        "description": "Unique key within the namespace",
                    },
                    "value": {
                        "type": "object",
                        "description": "Value to store (any JSON)",
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Searchable tags",
                    },
                },
                "required": ["namespace", "key", "value"],
            },
        },
        {
            "name": "memory_get",
            "description": "Retrieve a memory item by namespace and key",
            "input_schema": {
                "type": "object",
                "properties": {
                    "namespace": {"type": "string"},
                    "key": {"type": "string"},
                },
                "required": ["namespace", "key"],
            },
        },
        {
            "name": "memory_search",
            "description": "Search memory items by key prefix and tags",
            "input_schema": {
                "type": "object",
                "properties": {
                    "namespace": {
                        "type": "string",
                        "description": "Optional namespace filter",
                    },
                    "key_prefix": {
                        "type": "string",
                        "description": "Filter by key prefix",
                    },
                    "tags": {"type": "array", "items": {"type": "string"}},
                    "limit": {"type": "integer", "default": 50},
                },
            },
        },
        {
            "name": "cache_put",
            "description": "Store a context entry in the LRU+TTL cache for large project contexts",
            "input_schema": {
                "type": "object",
                "properties": {
                    "namespace": {"type": "string", "default": "default"},
                    "context_type": {"type": "string", "default": "general"},
                    "label": {"type": "string"},
                    "data": {
                        "type": "object",
                        "description": "Content to cache (any JSON)",
                    },
                    "tags": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["data"],
            },
        },
        {
            "name": "cache_get",
            "description": "Retrieve a cached context entry by entry ID",
            "input_schema": {
                "type": "object",
                "properties": {
                    "entry_id": {"type": "string"},
                },
                "required": ["entry_id"],
            },
        },
        {
            "name": "behavior_record",
            "description": "Record an AI behavior action for tracking and analytics",
            "input_schema": {
                "type": "object",
                "properties": {
                    "session_id": {"type": "string"},
                    "agent_id": {"type": "string", "default": "default"},
                    "action_name": {"type": "string"},
                    "action_category": {
                        "type": "string",
                        "enum": [
                            "code_generation",
                            "code_modification",
                            "code_review",
                            "debugging",
                            "testing",
                            "deployment",
                            "analysis",
                            "planning",
                            "communication",
                            "file_operation",
                            "search",
                            "integration",
                            "mcp_operation",
                            "memory_operation",
                            "other",
                        ],
                    },
                    "outcome": {
                        "type": "string",
                        "enum": [
                            "success",
                            "partial",
                            "failure",
                            "skipped",
                            "rolled_back",
                        ],
                        "default": "success",
                    },
                    "duration_ms": {"type": "integer"},
                },
                "required": ["session_id", "action_name", "action_category"],
            },
        },
        {
            "name": "codex_put",
            "description": "Store a best practice or pipeline entry in the codex",
            "input_schema": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "enum": [
                            "best_practice",
                            "pipeline",
                            "workflow",
                            "capability",
                            "runbook",
                            "standard",
                            "pattern",
                            "anti_pattern",
                        ],
                    },
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "content": {"type": "string"},
                    "tags": {"type": "array", "items": {"type": "string"}},
                    "priority": {"type": "integer", "default": 0},
                },
                "required": ["category", "title", "content"],
            },
        },
        {
            "name": "codex_query",
            "description": "Query best practices and pipeline entries by category and search text",
            "input_schema": {
                "type": "object",
                "properties": {
                    "category": {"type": "string"},
                    "search_text": {"type": "string"},
                    "tags": {"type": "array", "items": {"type": "string"}},
                    "limit": {"type": "integer", "default": 50},
                },
            },
        },
        {
            "name": "task_create",
            "description": "Create a new task with governance classification (A-F)",
            "input_schema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "task_type": {
                        "type": "string",
                        "enum": ["A", "B", "C", "D", "E", "F"],
                        "description": "A=new feature, B=security, C=CI/CD, D=docs, E=release, F=emergency",
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["critical", "high", "medium", "low"],
                        "default": "medium",
                    },
                    "assignee": {"type": "string"},
                    "tags": {"type": "array", "items": {"type": "string"}},
                    "depends_on": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["title", "task_type"],
            },
        },
        {
            "name": "task_query",
            "description": "Query tasks by status, type, priority, assignee",
            "input_schema": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": [
                            "pending",
                            "in_progress",
                            "completed",
                            "failed",
                            "cancelled",
                            "blocked",
                            "deferred",
                        ],
                    },
                    "task_type": {
                        "type": "string",
                        "enum": ["A", "B", "C", "D", "E", "F"],
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["critical", "high", "medium", "low"],
                    },
                    "assignee": {"type": "string"},
                    "limit": {"type": "integer", "default": 50},
                },
            },
        },
        {
            "name": "architecture_scan",
            "description": "Scan the project directory tree and produce an architecture snapshot with file checksums",
            "input_schema": {
                "type": "object",
                "properties": {
                    "max_depth": {"type": "integer", "default": 10},
                    "include_checksums": {"type": "boolean", "default": True},
                },
            },
        },
    ]

    return _success(request, {"tools": tools, "count": len(tools)})


@app.get("/api/mcp/resources")
async def mcp_list_resources(request: Request) -> dict[str, Any]:
    """List available MCP resources.

    Resources are data sources that AI agents can read to obtain context
    about the project, memory, and operational state.
    """
    resources = [
        {
            "uri": "coder-deep://memory/{namespace}",
            "name": "Memory Namespace",
            "description": "All items in a memory namespace",
            "mime_type": "application/json",
        },
        {
            "uri": "coder-deep://memory/{namespace}/{key}",
            "name": "Memory Item",
            "description": "A specific memory item by namespace and key",
            "mime_type": "application/json",
        },
        {
            "uri": "coder-deep://cache/{entry_id}",
            "name": "Cached Context",
            "description": "A cached context entry by entry ID",
            "mime_type": "application/json",
        },
        {
            "uri": "coder-deep://behavior/sessions",
            "name": "Behavior Sessions",
            "description": "Recent behavior tracking sessions",
            "mime_type": "application/json",
        },
        {
            "uri": "coder-deep://behavior/stats",
            "name": "Behavior Statistics",
            "description": "Aggregated behavior statistics",
            "mime_type": "application/json",
        },
        {
            "uri": "coder-deep://codex/{category}",
            "name": "Codex Category",
            "description": "Best practice entries in a category",
            "mime_type": "application/json",
        },
        {
            "uri": "coder-deep://tasks/{task_id}",
            "name": "Task Detail",
            "description": "A specific task with full details",
            "mime_type": "application/json",
        },
        {
            "uri": "coder-deep://architecture/snapshot",
            "name": "Architecture Snapshot",
            "description": "Current project architecture snapshot",
            "mime_type": "application/json",
        },
    ]

    return _success(request, {"resources": resources, "count": len(resources)})


@app.get("/api/mcp/prompts")
async def mcp_list_prompts(request: Request) -> dict[str, Any]:
    """List available MCP prompt templates.

    Prompt templates provide reusable context prompts that AI agents can
    use to quickly access common patterns and workflows.
    """
    prompts = [
        {
            "name": "project_context",
            "description": "Load full project context including architecture, recent tasks, and active memory",
            "arguments": [
                {
                    "name": "namespace",
                    "description": "Memory namespace to load",
                    "required": False,
                },
            ],
        },
        {
            "name": "behavior_summary",
            "description": "Summarize recent AI behavior actions and identify patterns",
            "arguments": [
                {
                    "name": "session_id",
                    "description": "Specific session to summarize",
                    "required": False,
                },
                {
                    "name": "limit",
                    "description": "Number of recent actions to include",
                    "required": False,
                },
            ],
        },
        {
            "name": "task_dashboard",
            "description": "Generate a task dashboard showing active, blocked, and recently completed tasks",
            "arguments": [
                {
                    "name": "assignee",
                    "description": "Filter by assignee",
                    "required": False,
                },
                {
                    "name": "task_type",
                    "description": "Filter by governance type (A-F)",
                    "required": False,
                },
            ],
        },
        {
            "name": "best_practices",
            "description": "Load best practices and conventions for a given category",
            "arguments": [
                {
                    "name": "category",
                    "description": "Codex category (best_practice, pipeline, workflow, etc.)",
                    "required": True,
                },
            ],
        },
        {
            "name": "architecture_review",
            "description": "Review current architecture and identify drift from baseline",
            "arguments": [
                {
                    "name": "from_id",
                    "description": "Baseline snapshot ID",
                    "required": False,
                },
                {
                    "name": "to_id",
                    "description": "Target snapshot ID",
                    "required": False,
                },
            ],
        },
    ]

    return _success(request, {"prompts": prompts, "count": len(prompts)})


@app.post("/api/mcp/tools/{tool_name}")
async def mcp_invoke_tool(request: Request, tool_name: str) -> dict[str, Any]:
    """Invoke an MCP tool by name with the provided arguments.

    The request body should contain the tool input parameters as a JSON object.
    This is the main entry point for AI agents interacting with Coder-Deep
    through the Model Context Protocol.
    """
    body = await request.json()

    try:
        if tool_name == "memory_put":
            store = _get_memory()
            item = MemoryItem(
                namespace=body.get("namespace", "default"),
                key=body["key"],
                value=body["value"],
                tags=body.get("tags", []),
                metadata=body.get("metadata", {}),
            )
            result = await store.put(item=item)
            return _success(
                request,
                {"stored": True, "namespace": result.namespace, "key": result.key},
            )

        if tool_name == "memory_get":
            store = _get_memory()
            item = await store.get(namespace=body["namespace"], key=body["key"])
            if item is None:
                raise AppException(
                    code=ErrorCode.NOT_FOUND,
                    message="Memory item not found",
                    status_code=404,
                )
            return _success(request, item.model_dump())

        if tool_name == "memory_search":
            store = _get_memory()
            params = MemorySearchParams(
                namespace=body.get("namespace"),
                key_prefix=body.get("key_prefix"),
                tags=body.get("tags", []),
                source=body.get("source"),
                limit=body.get("limit", 50),
                offset=body.get("offset", 0),
            )
            result = await store.search(params=params)
            return _success(request, result.model_dump())

        if tool_name == "cache_put":
            cache = _get_cache()
            entry = ContextEntry(
                namespace=body.get("namespace", "default"),
                context_type=body.get("context_type", "general"),
                label=body.get("label", ""),
                data=body["data"],
                tags=body.get("tags", []),
            )
            result = await cache.put(entry=entry)
            return _success(request, {"stored": True, "entry_id": result.entry_id})

        if tool_name == "cache_get":
            cache = _get_cache()
            entry = await cache.get(entry_id=body["entry_id"])
            if entry is None:
                raise AppException(
                    code=ErrorCode.NOT_FOUND,
                    message="Cache entry not found",
                    status_code=404,
                )
            return _success(request, entry.model_dump())

        if tool_name == "behavior_record":
            tracker = _get_behavior()
            action = BehaviorAction(
                session_id=body.get("session_id", ""),
                agent_id=body.get("agent_id", "default"),
                action_name=body["action_name"],
                action_category=body.get("action_category", "other"),
                outcome=body.get("outcome", "success"),
                duration_ms=body.get("duration_ms", 0),
                metadata=body.get("metadata", {}),
                tags=body.get("tags", []),
            )
            result = await tracker.record(action=action)
            return _success(request, {"recorded": True, "action_id": result.action_id})

        if tool_name == "codex_put":
            codex = _get_codex()
            entry = CodexEntry(
                category=body.get("category", "best_practice"),
                title=body["title"],
                description=body.get("description", ""),
                content=body.get("content", ""),
                tags=body.get("tags", []),
                priority=body.get("priority", 0),
                metadata=body.get("metadata", {}),
            )
            result = await codex.put(entry=entry)
            return _success(
                request,
                {
                    "stored": True,
                    "entry_id": result.entry_id,
                    "version": result.version,
                },
            )

        if tool_name == "codex_query":
            codex = _get_codex()
            params = CodexQuery(
                category=body.get("category"),
                search_text=body.get("search_text"),
                tags=body.get("tags", []),
                limit=body.get("limit", 50),
            )
            entries = await codex.query(params=params)
            return _success(
                request,
                {"entries": [e.model_dump() for e in entries],
                 "count": len(entries)},
            )

        if tool_name == "task_create":
            tracker = _get_tasks()
            task = TaskEntry(
                title=body["title"],
                description=body.get("description", ""),
                task_type=body.get("task_type", "A"),
                priority=body.get("priority", "medium"),
                assignee=body.get("assignee", ""),
                tags=body.get("tags", []),
                depends_on=body.get("depends_on", []),
                metadata=body.get("metadata", {}),
            )
            result = await tracker.create(task=task)
            return _success(request, {"created": True, "task_id": result.task_id})

        if tool_name == "task_query":
            tracker = _get_tasks()
            params = TaskQuery(
                status=body.get("status"),
                task_type=body.get("task_type"),
                priority=body.get("priority"),
                assignee=body.get("assignee"),
                limit=body.get("limit", 50),
            )
            tasks = await tracker.query(params=params)
            return _success(
                request, {"tasks": [t.model_dump()
                                    for t in tasks], "count": len(tasks)}
            )

        if tool_name == "architecture_scan":
            sync = _get_architecture()
            snapshot = await sync.scan(
                max_depth=body.get("max_depth", 10),
                include_checksums=body.get("include_checksums", True),
            )
            return _success(request, snapshot.model_dump())

        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message=f"Unknown MCP tool: {tool_name}",
            status_code=400,
        )

    except AppException:
        raise
    except ValueError as exc:
        raise AppException(
            code=ErrorCode.VALIDATION_ERROR,
            message=f"Invalid parameter value: {exc}",
            status_code=400,
        ) from exc
    except Exception as exc:
        raise AppException(
            code=ErrorCode.INTERNAL_ERROR,
            message=f"Tool invocation failed: {exc}",
            status_code=500,
        ) from exc


# ---------------------------------------------------------------------------
# SSE endpoint for MCP communication
# ---------------------------------------------------------------------------


@app.get("/sse")
async def sse_endpoint(request: Request) -> dict[str, Any]:
    """SSE endpoint for MCP streaming communication.

    Returns connection information for SSE-based MCP clients.
    In production, this would upgrade to an actual SSE connection
    using sse-starlette for bidirectional streaming.
    """
    return _success(
        request,
        {
            "protocol": "sse",
            "version": "0.1.0",
            "endpoints": {
                "tools": "/api/mcp/tools",
                "resources": "/api/mcp/resources",
                "prompts": "/api/mcp/prompts",
                "invoke": "/api/mcp/tools/{tool_name}",
            },
            "status": "ready",
        },
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _run_serve(args: argparse.Namespace) -> None:
    """CLI: start the FastAPI server."""
    if args.database_url:
        settings.database_url = args.database_url
    if args.port:
        settings.port = args.port
    if args.log_level:
        settings.log_level = args.log_level

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )


def _run_cache(args: argparse.Namespace) -> None:
    """CLI: manage the context cache."""
    import asyncio

    cache = ContextCache(
        max_entries=settings.cache_max_entries,
        max_size_bytes=settings.cache_max_size_bytes,
    )

    if args.cache_action == "stats":
        stats = asyncio.run(cache.stats())
        print(json.dumps(stats.model_dump(), indent=2))
    elif args.cache_action == "clear":
        count = asyncio.run(cache.clear())
        print(f"Cache cleared ({count} entries removed)")
    else:
        print("Usage: coder-deep-mcp cache [stats|clear]")


def _run_track(args: argparse.Namespace) -> None:
    """CLI: record a behavior action."""
    import asyncio

    tracker = BehaviorTracker(dsn=settings.database_url or "")
    if settings.database_url:
        asyncio.run(tracker.connect())

    try:
        action = BehaviorAction(
            session_id=args.session_id,
            agent_id=args.agent_id,
            action_name=args.action_name,
            action_category=args.category,
            outcome=args.outcome,
        )
        result = asyncio.run(tracker.record(action=action))
        print(json.dumps(
            {"action_id": result.action_id, "recorded": True}, indent=2))
    finally:
        if settings.database_url:
            asyncio.run(tracker.close())


def _run_sync(args: argparse.Namespace) -> None:
    """CLI: scan and report architecture."""
    import asyncio

    sync = ArchitectureSync(root_path=args.path)
    snapshot = asyncio.run(sync.scan(max_depth=10, include_checksums=True))
    print(json.dumps(snapshot.model_dump(), indent=2, default=str))


def cli() -> None:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Coder-Deep MCP Server — persistent memory, context bridging, and AI behavior tracking",
    )
    subparsers = parser.add_subparsers(
        dest="command", help="Available commands")

    # serve subcommand
    serve_parser = subparsers.add_parser(
        "serve", help="Start the HTTP API server")
    serve_parser.add_argument(
        "--port", type=int, default=8010, help="Server port")
    serve_parser.add_argument(
        "--database-url", help="PostgreSQL connection URL")
    serve_parser.add_argument("--log-level", default="INFO", help="Log level")

    # cache subcommand
    cache_parser = subparsers.add_parser(
        "cache", help="Manage the context cache")
    cache_parser.add_argument(
        "cache_action", choices=["stats", "clear"], help="Cache action"
    )

    # track subcommand
    track_parser = subparsers.add_parser(
        "track", help="Record a behavior action")
    track_parser.add_argument("--session-id", required=True, help="Session ID")
    track_parser.add_argument("--agent-id", required=True, help="Agent ID")
    track_parser.add_argument(
        "--action-name", required=True, help="Action name")
    track_parser.add_argument(
        "--category", required=True, help="Action category")
    track_parser.add_argument(
        "--outcome", default="success", help="Action outcome")

    # sync subcommand
    sync_parser = subparsers.add_parser(
        "sync", help="Scan and report architecture")
    sync_parser.add_argument("--path", required=True, help="Root path to scan")

    args = parser.parse_args()

    if args.command == "serve":
        _run_serve(args)
    elif args.command == "cache":
        _run_cache(args)
    elif args.command == "track":
        _run_track(args)
    elif args.command == "sync":
        _run_sync(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    cli()
