"""Pipeline codex — codification of best practices, pipelines, and team workflows.

Stores and retrieves codified best practices, CI/CD pipeline configurations,
team workflow definitions, and technical capability records. Enables teams
to define, version, and share operational knowledge across the organization.
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


class CodexCategory(StrEnum):
    """Categories of codified knowledge."""

    BEST_PRACTICE = "best_practice"
    PIPELINE = "pipeline"
    WORKFLOW = "workflow"
    CAPABILITY = "capability"
    RUNBOOK = "runbook"
    STANDARD = "standard"
    PATTERN = "pattern"
    ANTI_PATTERN = "anti_pattern"


class CodexStatus(StrEnum):
    """Status of a codex entry."""

    DRAFT = "draft"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class CodexEntry(BaseModel):
    """A codified best practice, pipeline, or workflow entry."""

    entry_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str = CodexCategory.BEST_PRACTICE
    title: str = ""
    description: str = ""
    content: str = ""
    status: str = CodexStatus.ACTIVE
    version: int = 1
    author: str = ""
    team: str = ""
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    parent_id: str | None = None
    references: list[str] = Field(default_factory=list)
    scope: str = "global"
    priority: int = 0
    applies_to: list[str] = Field(default_factory=list)


class CodexQuery(BaseModel):
    """Parameters for querying codex entries."""

    category: str | None = None
    status: str | None = None
    team: str | None = None
    tags: list[str] = Field(default_factory=list)
    scope: str | None = None
    search_text: str | None = None
    limit: int = 50
    offset: int = 0


class CodexVersion(BaseModel):
    """A version record for a codex entry."""

    version_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    entry_id: str = ""
    version: int = 1
    content: str = ""
    change_description: str = ""
    author: str = ""
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z")


class CodexStats(BaseModel):
    """Statistics about the codex."""

    total_entries: int = 0
    by_category: dict[str, int] = Field(default_factory=dict)
    by_status: dict[str, int] = Field(default_factory=dict)
    by_team: dict[str, int] = Field(default_factory=dict)
    by_scope: dict[str, int] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------


class _InMemoryCodexStore:
    """In-memory storage for pipeline codex entries."""

    def __init__(self) -> None:
        self._entries: dict[str, CodexEntry] = {}
        self._versions: dict[str, list[CodexVersion]] = {}

    async def put(self, entry: CodexEntry) -> CodexEntry:
        existing = self._entries.get(entry.entry_id)
        if existing:
            entry.created_at = existing.created_at
            entry.version = existing.version + 1
        entry.updated_at = datetime.utcnow().isoformat() + "Z"
        self._entries[entry.entry_id] = entry

        # Record version
        version = CodexVersion(
            entry_id=entry.entry_id,
            version=entry.version,
            content=entry.content,
            author=entry.author,
        )
        if entry.entry_id not in self._versions:
            self._versions[entry.entry_id] = []
        self._versions[entry.entry_id].append(version)

        return entry

    async def get(self, entry_id: str) -> CodexEntry | None:
        return self._entries.get(entry_id)

    async def delete(self, entry_id: str) -> bool:
        if entry_id in self._entries:
            del self._entries[entry_id]
            self._versions.pop(entry_id, None)
            return True
        return False

    async def query(self, params: CodexQuery) -> list[CodexEntry]:
        results: list[CodexEntry] = []
        for entry in self._entries.values():
            if params.category and entry.category != params.category:
                continue
            if params.status and entry.status != params.status:
                continue
            if params.team and entry.team != params.team:
                continue
            if params.scope and entry.scope != params.scope:
                continue
            if params.tags and not any(t in entry.tags for t in params.tags):
                continue
            if params.search_text:
                text = f"{entry.title} {entry.description} {entry.content}".lower()
                if params.search_text.lower() not in text:
                    continue
            results.append(entry)
        results.sort(key=lambda x: (x.priority, x.updated_at), reverse=True)
        return results[params.offset: params.offset + params.limit]

    async def get_versions(self, entry_id: str) -> list[CodexVersion]:
        return self._versions.get(entry_id, [])

    async def get_stats(self) -> CodexStats:
        by_category: dict[str, int] = {}
        by_status: dict[str, int] = {}
        by_team: dict[str, int] = {}
        by_scope: dict[str, int] = {}

        for entry in self._entries.values():
            by_category[entry.category] = by_category.get(
                entry.category, 0) + 1
            by_status[entry.status] = by_status.get(entry.status, 0) + 1
            by_team[entry.team] = by_team.get(entry.team, 0) + 1
            by_scope[entry.scope] = by_scope.get(entry.scope, 0) + 1

        return CodexStats(
            total_entries=len(self._entries),
            by_category=by_category,
            by_status=by_status,
            by_team=by_team,
            by_scope=by_scope,
        )


# ---------------------------------------------------------------------------
# Database-backed store
# ---------------------------------------------------------------------------

_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS coder_deep_codex (
    entry_id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    content TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    version INTEGER DEFAULT 1,
    author TEXT DEFAULT '',
    team TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parent_id TEXT,
    references TEXT[] DEFAULT '{}',
    scope TEXT DEFAULT 'global',
    priority INTEGER DEFAULT 0,
    applies_to TEXT[] DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_codex_category ON coder_deep_codex(category);
CREATE INDEX IF NOT EXISTS idx_codex_status ON coder_deep_codex(status);
CREATE INDEX IF NOT EXISTS idx_codex_team ON coder_deep_codex(team);
CREATE INDEX IF NOT EXISTS idx_codex_scope ON coder_deep_codex(scope);
CREATE INDEX IF NOT EXISTS idx_codex_tags ON coder_deep_codex USING GIN(tags);

CREATE TABLE IF NOT EXISTS coder_deep_codex_versions (
    version_id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL REFERENCES coder_deep_codex(entry_id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content TEXT DEFAULT '',
    change_description TEXT DEFAULT '',
    author TEXT DEFAULT '',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_codex_versions_entry ON coder_deep_codex_versions(entry_id);
"""


class PipelineCodex:
    """Codify and retrieve best practices, pipelines, and workflows.

    Stores operational knowledge as versioned entries with categories
    (best_practice, pipeline, workflow, capability, runbook, standard,
    pattern, anti_pattern). Supports full-text search, team scoping,
    and version history tracking.
    """

    def __init__(self, dsn: str = "") -> None:
        self._dsn = dsn
        self._pool: Any = None
        self._fallback = _InMemoryCodexStore() if not dsn else None

    async def connect(self) -> None:
        """Connect to the PostgreSQL database."""
        if not self._dsn:
            logger.info(
                "PipelineCodex: no DSN configured, using in-memory fallback")
            return

        import asyncpg

        self._pool = await asyncpg.create_pool(dsn=self._dsn, min_size=2, max_size=10)
        async with self._pool.acquire() as conn:
            await conn.execute(_CREATE_TABLE_SQL)
        logger.info("PipelineCodex: database connected")

    async def close(self) -> None:
        """Close the database connection pool."""
        if self._pool:
            await self._pool.close()
            self._pool = None

    @property
    def _using_db(self) -> bool:
        return self._pool is not None

    async def put(self, entry: CodexEntry) -> CodexEntry:
        """Create or update a codex entry."""
        if not self._using_db:
            return await self._fallback.put(entry)

        async with self._pool.acquire() as conn:
            # Check existing
            existing = await conn.fetchrow(
                "SELECT version, created_at FROM coder_deep_codex WHERE entry_id = $1",
                entry.entry_id,
            )
            if existing:
                entry.version = existing["version"] + 1
                entry.created_at = (
                    existing["created_at"].isoformat()
                    if hasattr(existing["created_at"], "isoformat")
                    else str(existing["created_at"])
                )
            entry.updated_at = datetime.utcnow().isoformat() + "Z"

            await conn.execute(
                """
                INSERT INTO coder_deep_codex
                (entry_id, category, title, description, content, status, version,
                 author, team, tags, metadata, created_at, updated_at, parent_id,
                 references, scope, priority, applies_to)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                ON CONFLICT (entry_id) DO UPDATE SET
                    category = EXCLUDED.category,
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    content = EXCLUDED.content,
                    status = EXCLUDED.status,
                    version = EXCLUDED.version,
                    author = EXCLUDED.author,
                    team = EXCLUDED.team,
                    tags = EXCLUDED.tags,
                    metadata = EXCLUDED.metadata,
                    updated_at = EXCLUDED.updated_at,
                    parent_id = EXCLUDED.parent_id,
                    references = EXCLUDED.references,
                    scope = EXCLUDED.scope,
                    priority = EXCLUDED.priority,
                    applies_to = EXCLUDED.applies_to
                """,
                entry.entry_id,
                entry.category,
                entry.title,
                entry.description,
                entry.content,
                entry.status,
                entry.version,
                entry.author,
                entry.team,
                entry.tags,
                json.dumps(entry.metadata),
                entry.created_at,
                entry.updated_at,
                entry.parent_id,
                entry.references,
                entry.scope,
                entry.priority,
                entry.applies_to,
            )

            # Record version
            await conn.execute(
                """
                INSERT INTO coder_deep_codex_versions (version_id, entry_id, version, content, change_description, author)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                str(uuid.uuid4()),
                entry.entry_id,
                entry.version,
                entry.content,
                "",
                entry.author,
            )

        return entry

    async def get(self, entry_id: str) -> CodexEntry | None:
        """Retrieve a codex entry by ID."""
        if not self._using_db:
            return await self._fallback.get(entry_id)

        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM coder_deep_codex WHERE entry_id = $1",
                entry_id,
            )
        return self._row_to_entry(row) if row else None

    async def delete(self, entry_id: str) -> bool:
        """Delete a codex entry."""
        if not self._using_db:
            return await self._fallback.delete(entry_id)

        async with self._pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM coder_deep_codex WHERE entry_id = $1",
                entry_id,
            )
        return result == "DELETE 1"

    async def query(self, params: CodexQuery) -> list[CodexEntry]:
        """Query codex entries with filters."""
        if not self._using_db:
            return await self._fallback.query(params)

        conditions: list[str] = []
        args: list[Any] = []
        idx = 1

        if params.category:
            conditions.append(f"category = ${idx}")
            args.append(params.category)
            idx += 1
        if params.status:
            conditions.append(f"status = ${idx}")
            args.append(params.status)
            idx += 1
        if params.team:
            conditions.append(f"team = ${idx}")
            args.append(params.team)
            idx += 1
        if params.scope:
            conditions.append(f"scope = ${idx}")
            args.append(params.scope)
            idx += 1
        if params.tags:
            conditions.append(f"tags && ${idx}")
            args.append(params.tags)
            idx += 1
        if params.search_text:
            conditions.append(
                f"(title ILIKE ${idx} OR description ILIKE ${idx} OR content ILIKE ${idx})"
            )
            pattern = f"%{params.search_text}%"
            args.append(pattern)
            idx += 1

        where = " AND ".join(conditions) if conditions else "TRUE"

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                f"SELECT * FROM coder_deep_codex WHERE {where} ORDER BY priority DESC, updated_at DESC LIMIT ${idx} OFFSET ${idx + 1}",
                *args,
                params.limit,
                params.offset,
            )

        return [self._row_to_entry(r) for r in rows]

    async def get_versions(self, entry_id: str) -> list[CodexVersion]:
        """Get version history for a codex entry."""
        if not self._using_db:
            return await self._fallback.get_versions(entry_id)

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM coder_deep_codex_versions WHERE entry_id = $1 ORDER BY version DESC",
                entry_id,
            )
        return [
            CodexVersion(
                version_id=r["version_id"],
                entry_id=r["entry_id"],
                version=r["version"],
                content=r["content"],
                change_description=r["change_description"],
                author=r["author"],
                timestamp=(
                    r["timestamp"].isoformat()
                    if hasattr(r["timestamp"], "isoformat")
                    else str(r["timestamp"])
                ),
            )
            for r in rows
        ]

    async def get_stats(self) -> CodexStats:
        """Get codex statistics."""
        if not self._using_db:
            return await self._fallback.get_stats()

        async with self._pool.acquire() as conn:
            total = await conn.fetchrow("SELECT COUNT(*) as cnt FROM coder_deep_codex")
            by_cat = await conn.fetch(
                "SELECT category, COUNT(*) as cnt FROM coder_deep_codex GROUP BY category"
            )
            by_status = await conn.fetch(
                "SELECT status, COUNT(*) as cnt FROM coder_deep_codex GROUP BY status"
            )
            by_team = await conn.fetch(
                "SELECT team, COUNT(*) as cnt FROM coder_deep_codex GROUP BY team"
            )
            by_scope = await conn.fetch(
                "SELECT scope, COUNT(*) as cnt FROM coder_deep_codex GROUP BY scope"
            )

        return CodexStats(
            total_entries=total["cnt"],
            by_category={r["category"]: r["cnt"] for r in by_cat},
            by_status={r["status"]: r["cnt"] for r in by_status},
            by_team={r["team"]: r["cnt"] for r in by_team},
            by_scope={r["scope"]: r["cnt"] for r in by_scope},
        )

    @staticmethod
    def _row_to_entry(row: Any) -> CodexEntry:
        """Convert a database row to a CodexEntry."""
        metadata = row["metadata"]
        if isinstance(metadata, str):
            metadata = json.loads(metadata)

        return CodexEntry(
            entry_id=row["entry_id"],
            category=row["category"],
            title=row["title"],
            description=row["description"],
            content=row["content"],
            status=row["status"],
            version=row["version"],
            author=row["author"],
            team=row["team"],
            tags=row["tags"] or [],
            metadata=metadata,
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
            parent_id=row["parent_id"],
            references=row["references"] or [],
            scope=row["scope"],
            priority=row["priority"],
            applies_to=row["applies_to"] or [],
        )
