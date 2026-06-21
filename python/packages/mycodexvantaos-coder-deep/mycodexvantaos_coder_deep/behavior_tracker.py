"""AI behavior tracking — logs and retrieves AI agent actions for audit and improvement.

Tracks AI agent behavior including actions taken, decisions made, tools used,
and outcomes achieved. Provides query capabilities for behavior analysis,
pattern detection, and team learning.
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


class ActionCategory(StrEnum):
    """Categories of AI agent actions."""

    CODE_GENERATION = "code_generation"
    CODE_MODIFICATION = "code_modification"
    CODE_REVIEW = "code_review"
    DEBUGGING = "debugging"
    TESTING = "testing"
    DEPLOYMENT = "deployment"
    ANALYSIS = "analysis"
    PLANNING = "planning"
    COMMUNICATION = "communication"
    FILE_OPERATION = "file_operation"
    SEARCH = "search"
    INTEGRATION = "integration"
    MCP_OPERATION = "mcp_operation"
    MEMORY_OPERATION = "memory_operation"
    OTHER = "other"


class ActionOutcome(StrEnum):
    """Outcome of an AI agent action."""

    SUCCESS = "success"
    PARTIAL = "partial"
    FAILURE = "failure"
    SKIPPED = "skipped"
    ROLLED_BACK = "rolled_back"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class BehaviorAction(BaseModel):
    """A single tracked AI agent action."""

    action_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str = ""
    agent_id: str = "default"
    action_category: str = ActionCategory.OTHER
    action_name: str = ""
    description: str = ""
    input_data: dict[str, Any] = Field(default_factory=dict)
    output_data: dict[str, Any] = Field(default_factory=dict)
    outcome: str = ActionOutcome.SUCCESS
    error_message: str = ""
    duration_ms: int = 0
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    metadata: dict[str, Any] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)
    repository: str = ""
    branch: str = ""
    file_paths: list[str] = Field(default_factory=list)
    task_type: str = ""


class BehaviorQuery(BaseModel):
    """Parameters for querying tracked behaviors."""

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


class BehaviorStats(BaseModel):
    """Aggregate statistics about tracked behaviors."""

    total_actions: int = 0
    by_category: dict[str, int] = Field(default_factory=dict)
    by_outcome: dict[str, int] = Field(default_factory=dict)
    by_agent: dict[str, int] = Field(default_factory=dict)
    avg_duration_ms: float = 0.0
    error_rate: float = 0.0
    top_actions: list[dict[str, Any]] = Field(default_factory=list)


class BehaviorSession(BaseModel):
    """Summary of a tracked behavior session."""

    session_id: str
    agent_id: str = "default"
    started_at: str = ""
    ended_at: str | None = None
    action_count: int = 0
    success_count: int = 0
    failure_count: int = 0
    total_duration_ms: int = 0
    repositories: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------


class _InMemoryBehaviorStore:
    """In-memory storage for behavior tracking."""

    def __init__(self) -> None:
        self._actions: list[BehaviorAction] = []
        self._sessions: dict[str, BehaviorSession] = {}

    async def record(self, action: BehaviorAction) -> BehaviorAction:
        self._actions.append(action)
        # Update session
        if action.session_id:
            if action.session_id not in self._sessions:
                self._sessions[action.session_id] = BehaviorSession(
                    session_id=action.session_id,
                    agent_id=action.agent_id,
                    started_at=action.timestamp,
                )
            session = self._sessions[action.session_id]
            session.action_count += 1
            if action.outcome == ActionOutcome.SUCCESS:
                session.success_count += 1
            elif action.outcome == ActionOutcome.FAILURE:
                session.failure_count += 1
            session.total_duration_ms += action.duration_ms
            if action.repository and action.repository not in session.repositories:
                session.repositories.append(action.repository)
        return action

    async def query(self, params: BehaviorQuery) -> list[BehaviorAction]:
        results: list[BehaviorAction] = []
        for action in reversed(self._actions):
            if params.session_id and action.session_id != params.session_id:
                continue
            if params.agent_id and action.agent_id != params.agent_id:
                continue
            if (
                params.action_category
                and action.action_category != params.action_category
            ):
                continue
            if params.outcome and action.outcome != params.outcome:
                continue
            if params.repository and action.repository != params.repository:
                continue
            if params.branch and action.branch != params.branch:
                continue
            if params.task_type and action.task_type != params.task_type:
                continue
            if params.tags and not any(t in action.tags for t in params.tags):
                continue
            if params.start_time and action.timestamp < params.start_time:
                continue
            if params.end_time and action.timestamp > params.end_time:
                continue
            results.append(action)
            if len(results) >= params.limit:
                break
        return results[params.offset :]

    async def get_stats(
        self, agent_id: str | None = None, session_id: str | None = None
    ) -> BehaviorStats:
        actions = self._actions
        if agent_id:
            actions = [a for a in actions if a.agent_id == agent_id]
        if session_id:
            actions = [a for a in actions if a.session_id == session_id]

        by_category: dict[str, int] = {}
        by_outcome: dict[str, int] = {}
        by_agent: dict[str, int] = {}
        total_duration = 0

        for a in actions:
            by_category[a.action_category] = by_category.get(a.action_category, 0) + 1
            by_outcome[a.outcome] = by_outcome.get(a.outcome, 0) + 1
            by_agent[a.agent_id] = by_agent.get(a.agent_id, 0) + 1
            total_duration += a.duration_ms

        error_count = by_outcome.get(ActionOutcome.FAILURE, 0)
        error_rate = error_count / len(actions) if actions else 0.0

        # Top actions
        action_counts: dict[str, int] = {}
        for a in actions:
            key = f"{a.action_category}:{a.action_name}"
            action_counts[key] = action_counts.get(key, 0) + 1
        top = sorted(action_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_actions = [{"action": k, "count": v} for k, v in top]

        return BehaviorStats(
            total_actions=len(actions),
            by_category=by_category,
            by_outcome=by_outcome,
            by_agent=by_agent,
            avg_duration_ms=total_duration / len(actions) if actions else 0.0,
            error_rate=round(error_rate, 4),
            top_actions=top_actions,
        )

    async def get_session(self, session_id: str) -> BehaviorSession | None:
        return self._sessions.get(session_id)

    async def list_sessions(
        self, limit: int = 50, offset: int = 0
    ) -> list[BehaviorSession]:
        sessions = sorted(
            self._sessions.values(), key=lambda s: s.started_at, reverse=True
        )
        return sessions[offset : offset + limit]

    async def end_session(self, session_id: str) -> bool:
        session = self._sessions.get(session_id)
        if session:
            session.ended_at = datetime.utcnow().isoformat() + "Z"
            return True
        return False


# ---------------------------------------------------------------------------
# Database-backed store
# ---------------------------------------------------------------------------

_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS coder_deep_behavior (
    action_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL DEFAULT '',
    agent_id TEXT NOT NULL DEFAULT 'default',
    action_category TEXT NOT NULL,
    action_name TEXT NOT NULL,
    description TEXT DEFAULT '',
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    outcome TEXT NOT NULL DEFAULT 'success',
    error_message TEXT DEFAULT '',
    duration_ms INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    repository TEXT DEFAULT '',
    branch TEXT DEFAULT '',
    file_paths TEXT[] DEFAULT '{}',
    task_type TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_behavior_session ON coder_deep_behavior(session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_agent ON coder_deep_behavior(agent_id);
CREATE INDEX IF NOT EXISTS idx_behavior_category ON coder_deep_behavior(action_category);
CREATE INDEX IF NOT EXISTS idx_behavior_outcome ON coder_deep_behavior(outcome);
CREATE INDEX IF NOT EXISTS idx_behavior_timestamp ON coder_deep_behavior(timestamp);
"""


class BehaviorTracker:
    """Track and query AI agent behaviors for audit and improvement.

    Records AI agent actions with full context including inputs, outputs,
    outcomes, and timing. Supports querying by session, agent, category,
    and outcome for behavior analysis and pattern detection.
    """

    def __init__(self, dsn: str = "") -> None:
        self._dsn = dsn
        self._pool: Any = None
        self._fallback = _InMemoryBehaviorStore() if not dsn else None

    async def connect(self) -> None:
        """Connect to the PostgreSQL database."""
        if not self._dsn:
            logger.info("BehaviorTracker: no DSN configured, using in-memory fallback")
            return

        import asyncpg

        self._pool = await asyncpg.create_pool(dsn=self._dsn, min_size=2, max_size=10)
        async with self._pool.acquire() as conn:
            await conn.execute(_CREATE_TABLE_SQL)
        logger.info("BehaviorTracker: database connected")

    async def close(self) -> None:
        """Close the database connection pool."""
        if self._pool:
            await self._pool.close()
            self._pool = None

    @property
    def _using_db(self) -> bool:
        return self._pool is not None

    async def record(self, action: BehaviorAction) -> BehaviorAction:
        """Record an AI agent action."""
        if not self._using_db:
            return await self._fallback.record(action)

        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO coder_deep_behavior
                (action_id, session_id, agent_id, action_category, action_name, description,
                 input_data, output_data, outcome, error_message, duration_ms, timestamp,
                 metadata, tags, repository, branch, file_paths, task_type)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                """,
                action.action_id,
                action.session_id,
                action.agent_id,
                action.action_category,
                action.action_name,
                action.description,
                json.dumps(action.input_data),
                json.dumps(action.output_data),
                action.outcome,
                action.error_message,
                action.duration_ms,
                action.timestamp,
                json.dumps(action.metadata),
                action.tags,
                action.repository,
                action.branch,
                action.file_paths,
                action.task_type,
            )
        return action

    async def query(self, params: BehaviorQuery) -> list[BehaviorAction]:
        """Query tracked behaviors with filters."""
        if not self._using_db:
            return await self._fallback.query(params)

        conditions: list[str] = []
        args: list[Any] = []
        idx = 1

        if params.session_id:
            conditions.append(f"session_id = ${idx}")
            args.append(params.session_id)
            idx += 1
        if params.agent_id:
            conditions.append(f"agent_id = ${idx}")
            args.append(params.agent_id)
            idx += 1
        if params.action_category:
            conditions.append(f"action_category = ${idx}")
            args.append(params.action_category)
            idx += 1
        if params.outcome:
            conditions.append(f"outcome = ${idx}")
            args.append(params.outcome)
            idx += 1
        if params.repository:
            conditions.append(f"repository = ${idx}")
            args.append(params.repository)
            idx += 1
        if params.branch:
            conditions.append(f"branch = ${idx}")
            args.append(params.branch)
            idx += 1
        if params.start_time:
            conditions.append(f"timestamp >= ${idx}")
            args.append(params.start_time)
            idx += 1
        if params.end_time:
            conditions.append(f"timestamp <= ${idx}")
            args.append(params.end_time)
            idx += 1

        where = " AND ".join(conditions) if conditions else "TRUE"

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                f"SELECT * FROM coder_deep_behavior WHERE {where} ORDER BY timestamp DESC LIMIT ${idx} OFFSET ${idx + 1}",
                *args,
                params.limit,
                params.offset,
            )

        return [self._row_to_action(r) for r in rows]

    async def get_stats(
        self, agent_id: str | None = None, session_id: str | None = None
    ) -> BehaviorStats:
        """Get aggregate behavior statistics."""
        if not self._using_db:
            return await self._fallback.get_stats(
                agent_id=agent_id, session_id=session_id
            )

        conditions: list[str] = []
        args: list[Any] = []
        idx = 1

        if agent_id:
            conditions.append(f"agent_id = ${idx}")
            args.append(agent_id)
            idx += 1
        if session_id:
            conditions.append(f"session_id = ${idx}")
            args.append(session_id)
            idx += 1

        where = " AND ".join(conditions) if conditions else "TRUE"

        async with self._pool.acquire() as conn:
            # Total actions
            total_row = await conn.fetchrow(
                f"SELECT COUNT(*) as cnt FROM coder_deep_behavior WHERE {where}", *args
            )
            total = total_row["cnt"]

            # By category
            cat_rows = await conn.fetch(
                f"SELECT action_category, COUNT(*) as cnt FROM coder_deep_behavior WHERE {where} GROUP BY action_category",
                *args,
            )
            by_category = {r["action_category"]: r["cnt"] for r in cat_rows}

            # By outcome
            outcome_rows = await conn.fetch(
                f"SELECT outcome, COUNT(*) as cnt FROM coder_deep_behavior WHERE {where} GROUP BY outcome",
                *args,
            )
            by_outcome = {r["outcome"]: r["cnt"] for r in outcome_rows}

            # By agent
            agent_rows = await conn.fetch(
                f"SELECT agent_id, COUNT(*) as cnt FROM coder_deep_behavior WHERE {where} GROUP BY agent_id",
                *args,
            )
            by_agent = {r["agent_id"]: r["cnt"] for r in agent_rows}

            # Avg duration
            dur_row = await conn.fetchrow(
                f"SELECT AVG(duration_ms) as avg_dur FROM coder_deep_behavior WHERE {where}",
                *args,
            )
            avg_duration = float(dur_row["avg_dur"] or 0)

            # Top actions
            top_rows = await conn.fetch(
                f"SELECT action_category || ':' || action_name as action, COUNT(*) as cnt FROM coder_deep_behavior WHERE {where} GROUP BY action_category, action_name ORDER BY cnt DESC LIMIT 10",
                *args,
            )
            top_actions = [{"action": r["action"], "count": r["cnt"]} for r in top_rows]

        failure_count = by_outcome.get(ActionOutcome.FAILURE, 0)
        error_rate = failure_count / total if total > 0 else 0.0

        return BehaviorStats(
            total_actions=total,
            by_category=by_category,
            by_outcome=by_outcome,
            by_agent=by_agent,
            avg_duration_ms=round(avg_duration, 2),
            error_rate=round(error_rate, 4),
            top_actions=top_actions,
        )

    async def get_session(self, session_id: str) -> BehaviorSession | None:
        """Get a behavior session summary."""
        if not self._using_db:
            return await self._fallback.get_session(session_id)

        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT session_id, agent_id, MIN(timestamp) as started_at,
                       MAX(timestamp) as ended_at, COUNT(*) as action_count,
                       COUNT(*) FILTER (WHERE outcome = 'success') as success_count,
                       COUNT(*) FILTER (WHERE outcome = 'failure') as failure_count,
                       SUM(duration_ms) as total_duration_ms,
                       ARRAY_AGG(DISTINCT repository) as repositories
                FROM coder_deep_behavior WHERE session_id = $1 GROUP BY session_id, agent_id
                """,
                session_id,
            )
        if not row:
            return None
        return BehaviorSession(
            session_id=row["session_id"],
            agent_id=row["agent_id"] or "default",
            started_at=(
                row["started_at"].isoformat()
                if hasattr(row["started_at"], "isoformat")
                else str(row["started_at"])
            ),
            ended_at=(
                row["ended_at"].isoformat()
                if hasattr(row["ended_at"], "isoformat")
                else str(row["ended_at"])
            ),
            action_count=row["action_count"],
            success_count=row["success_count"],
            failure_count=row["failure_count"],
            total_duration_ms=row["total_duration_ms"] or 0,
            repositories=[r for r in (row["repositories"] or []) if r],
        )

    async def list_sessions(
        self, limit: int = 50, offset: int = 0
    ) -> list[BehaviorSession]:
        """List behavior sessions."""
        if not self._using_db:
            return await self._fallback.list_sessions(limit=limit, offset=offset)

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT session_id, agent_id, MIN(timestamp) as started_at,
                       MAX(timestamp) as ended_at, COUNT(*) as action_count,
                       COUNT(*) FILTER (WHERE outcome = 'success') as success_count,
                       COUNT(*) FILTER (WHERE outcome = 'failure') as failure_count,
                       SUM(duration_ms) as total_duration_ms
                FROM coder_deep_behavior GROUP BY session_id, agent_id
                ORDER BY started_at DESC LIMIT $1 OFFSET $2
                """,
                limit,
                offset,
            )
        sessions = []
        for r in rows:
            sessions.append(
                BehaviorSession(
                    session_id=r["session_id"],
                    agent_id=r["agent_id"] or "default",
                    started_at=(
                        r["started_at"].isoformat()
                        if hasattr(r["started_at"], "isoformat")
                        else str(r["started_at"])
                    ),
                    ended_at=(
                        r["ended_at"].isoformat()
                        if hasattr(r["ended_at"], "isoformat")
                        else str(r["ended_at"])
                    ),
                    action_count=r["action_count"],
                    success_count=r["success_count"],
                    failure_count=r["failure_count"],
                    total_duration_ms=r["total_duration_ms"] or 0,
                )
            )
        return sessions

    async def end_session(self, session_id: str) -> bool:
        """Mark a session as ended."""
        if not self._using_db:
            return await self._fallback.end_session(session_id)
        # Sessions are derived from actions; ending is a no-op in DB mode
        return True

    @staticmethod
    def _row_to_action(row: Any) -> BehaviorAction:
        """Convert a database row to a BehaviorAction."""
        input_data = row["input_data"]
        if isinstance(input_data, str):
            input_data = json.loads(input_data)

        output_data = row["output_data"]
        if isinstance(output_data, str):
            output_data = json.loads(output_data)

        metadata = row["metadata"]
        if isinstance(metadata, str):
            metadata = json.loads(metadata)

        return BehaviorAction(
            action_id=row["action_id"],
            session_id=row["session_id"],
            agent_id=row["agent_id"],
            action_category=row["action_category"],
            action_name=row["action_name"],
            description=row["description"],
            input_data=input_data,
            output_data=output_data,
            outcome=row["outcome"],
            error_message=row["error_message"],
            duration_ms=row["duration_ms"],
            timestamp=(
                row["timestamp"].isoformat()
                if hasattr(row["timestamp"], "isoformat")
                else str(row["timestamp"])
            ),
            metadata=metadata,
            tags=row["tags"] or [],
            repository=row["repository"],
            branch=row["branch"],
            file_paths=row["file_paths"] or [],
            task_type=row["task_type"],
        )
