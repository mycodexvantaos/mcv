"""Task tracker — persistent task state with history and dependency tracking.

Tracks tasks across AI agent sessions with full lifecycle management,
dependency tracking, and execution history. Enables long-running task
continuity and cross-session task resumption.
"""

import json
import logging
import uuid
from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class TaskStatus(StrEnum):
    """Status of a tracked task."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    BLOCKED = "blocked"
    DEFERRED = "deferred"


class TaskPriority(StrEnum):
    """Priority of a tracked task."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TaskType(StrEnum):
    """Type classification for tasks (following MyCodeXvantaOS governance)."""

    A_NEW_FEATURE = "A"
    B_SECURITY_PATCH = "B"
    C_CICD_FIX = "C"
    D_DOCS_ADR = "D"
    E_RELEASE_ARTIFACT = "E"
    F_EMERGENCY_BLOCK = "F"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class TaskEntry(BaseModel):
    """A tracked task with full lifecycle state."""

    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    description: str = ""
    status: str = TaskStatus.PENDING
    priority: str = TaskPriority.MEDIUM
    task_type: str = TaskType.A_NEW_FEATURE
    assignee: str = ""
    session_id: str = ""
    parent_task_id: str | None = None
    depends_on: list[str] = Field(default_factory=list)
    blocks: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] = Field(default_factory=dict)
    error: str = ""
    created_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    started_at: str | None = None
    completed_at: str | None = None
    due_at: str | None = None
    repository: str = ""
    branch: str = ""
    file_paths: list[str] = Field(default_factory=list)
    progress_pct: int = 0


class TaskTransition(BaseModel):
    """A status transition record for a task."""

    transition_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str = ""
    from_status: str = ""
    to_status: str = ""
    reason: str = ""
    actor: str = ""
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z")


class TaskQuery(BaseModel):
    """Parameters for querying tasks."""

    status: str | None = None
    priority: str | None = None
    task_type: str | None = None
    assignee: str | None = None
    session_id: str | None = None
    parent_task_id: str | None = None
    tags: list[str] = Field(default_factory=list)
    repository: str | None = None
    branch: str | None = None
    limit: int = 50
    offset: int = 0


class TaskStats(BaseModel):
    """Aggregate statistics about tasks."""

    total_tasks: int = 0
    by_status: dict[str, int] = Field(default_factory=dict)
    by_priority: dict[str, int] = Field(default_factory=dict)
    by_type: dict[str, int] = Field(default_factory=dict)
    completion_rate: float = 0.0
    avg_completion_time_ms: float = 0.0


# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------


class _InMemoryTaskStore:
    """In-memory storage for task tracking."""

    def __init__(self) -> None:
        self._tasks: dict[str, TaskEntry] = {}
        self._transitions: dict[str, list[TaskTransition]] = {}

    async def create(self, task: TaskEntry) -> TaskEntry:
        self._tasks[task.task_id] = task
        self._transitions[task.task_id] = [
            TaskTransition(
                task_id=task.task_id,
                from_status="",
                to_status=task.status,
                actor="system",
            )
        ]
        return task

    async def get(self, task_id: str) -> TaskEntry | None:
        return self._tasks.get(task_id)

    async def update(self, task_id: str, updates: dict[str, Any]) -> TaskEntry | None:
        task = self._tasks.get(task_id)
        if not task:
            return None

        old_status = task.status
        for key, value in updates.items():
            if hasattr(task, key):
                setattr(task, key, value)

        task.updated_at = datetime.utcnow().isoformat() + "Z"

        # Record status transition
        if "status" in updates and updates["status"] != old_status:
            if task_id not in self._transitions:
                self._transitions[task_id] = []
            self._transitions[task_id].append(
                TaskTransition(
                    task_id=task_id, from_status=old_status, to_status=updates["status"]
                )
            )

            # Set timestamps
            if updates["status"] == TaskStatus.IN_PROGRESS and not task.started_at:
                task.started_at = datetime.utcnow().isoformat() + "Z"
            if updates["status"] in (
                TaskStatus.COMPLETED,
                TaskStatus.FAILED,
                TaskStatus.CANCELLED,
            ):
                task.completed_at = datetime.utcnow().isoformat() + "Z"

        return task

    async def delete(self, task_id: str) -> bool:
        if task_id in self._tasks:
            del self._tasks[task_id]
            self._transitions.pop(task_id, None)
            return True
        return False

    async def query(self, params: TaskQuery) -> list[TaskEntry]:
        results: list[TaskEntry] = []
        for task in self._tasks.values():
            if params.status and task.status != params.status:
                continue
            if params.priority and task.priority != params.priority:
                continue
            if params.task_type and task.task_type != params.task_type:
                continue
            if params.assignee and task.assignee != params.assignee:
                continue
            if params.session_id and task.session_id != params.session_id:
                continue
            if params.parent_task_id and task.parent_task_id != params.parent_task_id:
                continue
            if params.repository and task.repository != params.repository:
                continue
            if params.branch and task.branch != params.branch:
                continue
            if params.tags and not any(t in task.tags for t in params.tags):
                continue
            results.append(task)
        results.sort(key=lambda x: x.updated_at, reverse=True)
        return results[params.offset: params.offset + params.limit]

    async def get_transitions(self, task_id: str) -> list[TaskTransition]:
        return self._transitions.get(task_id, [])

    async def get_dependencies(self, task_id: str) -> list[TaskEntry]:
        task = self._tasks.get(task_id)
        if not task:
            return []
        return [self._tasks[d] for d in task.depends_on if d in self._tasks]

    async def get_blocked_by(self, task_id: str) -> list[TaskEntry]:
        """Get tasks that are blocked by this task."""
        return [t for t in self._tasks.values() if task_id in t.depends_on]

    async def get_stats(self) -> TaskStats:
        by_status: dict[str, int] = {}
        by_priority: dict[str, int] = {}
        by_type: dict[str, int] = {}

        for task in self._tasks.values():
            by_status[task.status] = by_status.get(task.status, 0) + 1
            by_priority[task.priority] = by_priority.get(task.priority, 0) + 1
            by_type[task.task_type] = by_type.get(task.task_type, 0) + 1

        completed = by_status.get(TaskStatus.COMPLETED, 0)
        total = len(self._tasks)
        completion_rate = completed / total if total > 0 else 0.0

        return TaskStats(
            total_tasks=total,
            by_status=by_status,
            by_priority=by_priority,
            by_type=by_type,
            completion_rate=round(completion_rate, 4),
        )


# ---------------------------------------------------------------------------
# Database-backed store
# ---------------------------------------------------------------------------

_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS coder_deep_tasks (
    task_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    task_type TEXT NOT NULL DEFAULT 'A',
    assignee TEXT DEFAULT '',
    session_id TEXT DEFAULT '',
    parent_task_id TEXT,
    depends_on TEXT[] DEFAULT '{}',
    blocks TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    result JSONB DEFAULT '{}',
    error TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    repository TEXT DEFAULT '',
    branch TEXT DEFAULT '',
    file_paths TEXT[] DEFAULT '{}',
    progress_pct INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON coder_deep_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON coder_deep_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON coder_deep_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_session ON coder_deep_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON coder_deep_tasks(assignee);

CREATE TABLE IF NOT EXISTS coder_deep_task_transitions (
    transition_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES coder_deep_tasks(task_id) ON DELETE CASCADE,
    from_status TEXT DEFAULT '',
    to_status TEXT NOT NULL,
    reason TEXT DEFAULT '',
    actor TEXT DEFAULT '',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transitions_task ON coder_deep_task_transitions(task_id);
"""


class TaskTracker:
    """Track and manage tasks across AI agent sessions.

    Provides persistent task tracking with lifecycle management,
    dependency tracking, status transitions, and execution history.
    Supports cross-session task continuity for long-running work.
    """

    def __init__(self, dsn: str = "") -> None:
        self._dsn = dsn
        self._pool: Any = None
        self._fallback = _InMemoryTaskStore() if not dsn else None

    async def connect(self) -> None:
        """Connect to the PostgreSQL database."""
        if not self._dsn:
            logger.info(
                "TaskTracker: no DSN configured, using in-memory fallback")
            return

        import asyncpg

        self._pool = await asyncpg.create_pool(dsn=self._dsn, min_size=2, max_size=10)
        async with self._pool.acquire() as conn:
            await conn.execute(_CREATE_TABLE_SQL)
        logger.info("TaskTracker: database connected")

    async def close(self) -> None:
        """Close the database connection pool."""
        if self._pool:
            await self._pool.close()
            self._pool = None

    @property
    def _using_db(self) -> bool:
        return self._pool is not None

    async def create(self, task: TaskEntry) -> TaskEntry:
        """Create a new task."""
        if not self._using_db:
            return await self._fallback.create(task)

        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO coder_deep_tasks
                (task_id, title, description, status, priority, task_type, assignee,
                 session_id, parent_task_id, depends_on, blocks, tags, metadata, result,
                 error, created_at, updated_at, started_at, completed_at, due_at,
                 repository, branch, file_paths, progress_pct)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
                """,
                task.task_id,
                task.title,
                task.description,
                task.status,
                task.priority,
                task.task_type,
                task.assignee,
                task.session_id,
                task.parent_task_id,
                task.depends_on,
                task.blocks,
                task.tags,
                json.dumps(task.metadata),
                json.dumps(task.result),
                task.error,
                task.created_at,
                task.updated_at,
                task.started_at,
                task.completed_at,
                task.due_at,
                task.repository,
                task.branch,
                task.file_paths,
                task.progress_pct,
            )

            # Record initial transition
            await conn.execute(
                """
                INSERT INTO coder_deep_task_transitions (transition_id, task_id, from_status, to_status, actor)
                VALUES ($1, $2, $3, $4, $5)
                """,
                str(uuid.uuid4()),
                task.task_id,
                "",
                task.status,
                "system",
            )

        return task

    async def get(self, task_id: str) -> TaskEntry | None:
        """Get a task by ID."""
        if not self._using_db:
            return await self._fallback.get(task_id)

        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM coder_deep_tasks WHERE task_id = $1",
                task_id,
            )
        return self._row_to_task(row) if row else None

    async def update(self, task_id: str, updates: dict[str, Any]) -> TaskEntry | None:
        """Update a task with the given field updates."""
        if not self._using_db:
            return await self._fallback.update(task_id, updates)

        # Build dynamic UPDATE
        set_clauses: list[str] = []
        args: list[Any] = []
        idx = 1

        for key, value in updates.items():
            if key in ("task_id", "created_at"):
                continue
            set_clauses.append(f"{key} = ${idx}")
            if key in ("metadata", "result"):
                args.append(json.dumps(value))
            else:
                args.append(value)
            idx += 1

        if not set_clauses:
            return await self.get(task_id)

        set_clauses.append(f"updated_at = ${idx}")
        args.append(datetime.utcnow().isoformat() + "Z")
        idx += 1

        args.append(task_id)

        async with self._pool.acquire() as conn:
            # Get old status for transition tracking
            old_row = await conn.fetchrow(
                "SELECT status FROM coder_deep_tasks WHERE task_id = $1",
                task_id,
            )
            if not old_row:
                return None

            old_status = old_row["status"]

            await conn.execute(
                f"UPDATE coder_deep_tasks SET {', '.join(set_clauses)} WHERE task_id = ${idx}",
                *args,
            )

            # Record transition if status changed
            if "status" in updates and updates["status"] != old_status:
                await conn.execute(
                    """
                    INSERT INTO coder_deep_task_transitions (transition_id, task_id, from_status, to_status, actor)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    str(uuid.uuid4()),
                    task_id,
                    old_status,
                    updates["status"],
                    "api",
                )

        return await self.get(task_id)

    async def delete(self, task_id: str) -> bool:
        """Delete a task."""
        if not self._using_db:
            return await self._fallback.delete(task_id)

        async with self._pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM coder_deep_tasks WHERE task_id = $1",
                task_id,
            )
        return result == "DELETE 1"

    async def query(self, params: TaskQuery) -> list[TaskEntry]:
        """Query tasks with filters."""
        if not self._using_db:
            return await self._fallback.query(params)

        conditions: list[str] = []
        args: list[Any] = []
        idx = 1

        if params.status:
            conditions.append(f"status = ${idx}")
            args.append(params.status)
            idx += 1
        if params.priority:
            conditions.append(f"priority = ${idx}")
            args.append(params.priority)
            idx += 1
        if params.task_type:
            conditions.append(f"task_type = ${idx}")
            args.append(params.task_type)
            idx += 1
        if params.assignee:
            conditions.append(f"assignee = ${idx}")
            args.append(params.assignee)
            idx += 1
        if params.session_id:
            conditions.append(f"session_id = ${idx}")
            args.append(params.session_id)
            idx += 1
        if params.parent_task_id:
            conditions.append(f"parent_task_id = ${idx}")
            args.append(params.parent_task_id)
            idx += 1
        if params.repository:
            conditions.append(f"repository = ${idx}")
            args.append(params.repository)
            idx += 1
        if params.branch:
            conditions.append(f"branch = ${idx}")
            args.append(params.branch)
            idx += 1
        if params.tags:
            conditions.append(f"tags && ${idx}")
            args.append(params.tags)
            idx += 1

        where = " AND ".join(conditions) if conditions else "TRUE"

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                f"SELECT * FROM coder_deep_tasks WHERE {where} ORDER BY updated_at DESC LIMIT ${idx} OFFSET ${idx + 1}",
                *args,
                params.limit,
                params.offset,
            )

        return [self._row_to_task(r) for r in rows]

    async def get_transitions(self, task_id: str) -> list[TaskTransition]:
        """Get status transition history for a task."""
        if not self._using_db:
            return await self._fallback.get_transitions(task_id)

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM coder_deep_task_transitions WHERE task_id = $1 ORDER BY timestamp",
                task_id,
            )
        return [
            TaskTransition(
                transition_id=r["transition_id"],
                task_id=r["task_id"],
                from_status=r["from_status"],
                to_status=r["to_status"],
                reason=r["reason"],
                actor=r["actor"],
                timestamp=(
                    r["timestamp"].isoformat()
                    if hasattr(r["timestamp"], "isoformat")
                    else str(r["timestamp"])
                ),
            )
            for r in rows
        ]

    async def get_dependencies(self, task_id: str) -> list[TaskEntry]:
        """Get tasks that this task depends on."""
        if not self._using_db:
            return await self._fallback.get_dependencies(task_id)

        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT depends_on FROM coder_deep_tasks WHERE task_id = $1",
                task_id,
            )
        if not row or not row["depends_on"]:
            return []

        dep_ids = row["depends_on"]
        if not self._using_db:
            return []
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM coder_deep_tasks WHERE task_id = ANY($1)",
                dep_ids,
            )
        return [self._row_to_task(r) for r in rows]

    async def get_stats(self) -> TaskStats:
        """Get aggregate task statistics."""
        if not self._using_db:
            return await self._fallback.get_stats()

        async with self._pool.acquire() as conn:
            total = await conn.fetchrow("SELECT COUNT(*) as cnt FROM coder_deep_tasks")
            by_status = await conn.fetch(
                "SELECT status, COUNT(*) as cnt FROM coder_deep_tasks GROUP BY status"
            )
            by_priority = await conn.fetch(
                "SELECT priority, COUNT(*) as cnt FROM coder_deep_tasks GROUP BY priority"
            )
            by_type = await conn.fetch(
                "SELECT task_type, COUNT(*) as cnt FROM coder_deep_tasks GROUP BY task_type"
            )

        status_map = {r["status"]: r["cnt"] for r in by_status}
        completed = status_map.get(TaskStatus.COMPLETED, 0)
        total_count = total["cnt"]

        return TaskStats(
            total_tasks=total_count,
            by_status=status_map,
            by_priority={r["priority"]: r["cnt"] for r in by_priority},
            by_type={r["task_type"]: r["cnt"] for r in by_type},
            completion_rate=(
                round(completed / total_count, 4) if total_count > 0 else 0.0
            ),
        )

    @staticmethod
    def _row_to_task(row: Any) -> TaskEntry:
        """Convert a database row to a TaskEntry."""
        metadata = row["metadata"]
        if isinstance(metadata, str):
            metadata = json.loads(metadata)

        result = row["result"]
        if isinstance(result, str):
            result = json.loads(result)

        return TaskEntry(
            task_id=row["task_id"],
            title=row["title"],
            description=row["description"],
            status=row["status"],
            priority=row["priority"],
            task_type=row["task_type"],
            assignee=row["assignee"],
            session_id=row["session_id"],
            parent_task_id=row["parent_task_id"],
            depends_on=row["depends_on"] or [],
            blocks=row["blocks"] or [],
            tags=row["tags"] or [],
            metadata=metadata,
            result=result,
            error=row["error"],
            created_at=(
                row["created_at"].isoformat()
                if hasattr(row["created_at"], "isoformat")
                else str(row["created_at"])
            ),
            updated_at=(
                row["updated_at"].isoformat()
                if hasattr(row["updated_at"], "isoformat")
                else str(row["updated_at"])
            ),
            started_at=(
                row["started_at"].isoformat()
                if row["started_at"] and hasattr(row["started_at"], "isoformat")
                else (str(row["started_at"]) if row["started_at"] else None)
            ),
            completed_at=(
                row["completed_at"].isoformat()
                if row["completed_at"] and hasattr(row["completed_at"], "isoformat")
                else (str(row["completed_at"]) if row["completed_at"] else None)
            ),
            due_at=(
                row["due_at"].isoformat()
                if row["due_at"] and hasattr(row["due_at"], "isoformat")
                else (str(row["due_at"]) if row["due_at"] else None)
            ),
            repository=row["repository"],
            branch=row["branch"],
            file_paths=row["file_paths"] or [],
            progress_pct=row["progress_pct"],
        )
