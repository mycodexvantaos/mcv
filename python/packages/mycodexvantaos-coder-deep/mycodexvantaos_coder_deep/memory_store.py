"""Persistent key-value memory store with TTL, namespaces, and search.

Supports cross-session AI memory continuity by providing a PostgreSQL-backed
store for key-value pairs with optional TTL, namespace isolation, and
full-text search capabilities.
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class MemoryItem(BaseModel):
    """A single memory entry with metadata."""

    memory_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    namespace: str = "default"
    key: str
    value: Any
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    expires_at: str | None = None
    access_count: int = 0
    source: str = "api"
    tags: list[str] = Field(default_factory=list)


class MemorySearchParams(BaseModel):
    """Parameters for memory search."""

    namespace: str | None = None
    key_prefix: str | None = None
    tags: list[str] = Field(default_factory=list)
    source: str | None = None
    limit: int = 50
    offset: int = 0


class MemorySearchResult(BaseModel):
    """Result of a memory search operation."""

    items: list[MemoryItem] = Field(default_factory=list)
    total: int = 0
    limit: int = 50
    offset: int = 0


# ---------------------------------------------------------------------------
# In-memory store (fallback when no database is configured)
# ---------------------------------------------------------------------------


class _InMemoryStore:
    """Simple in-memory store for development and testing."""

    def __init__(self) -> None:
        self._data: dict[str, dict[str, MemoryItem]] = {}

    def _ns(self, namespace: str) -> dict[str, MemoryItem]:
        if namespace not in self._data:
            self._data[namespace] = {}
        return self._data[namespace]

    async def put(self, item: MemoryItem) -> MemoryItem:
        ns = self._ns(item.namespace)
        existing = ns.get(item.key)
        if existing:
            item.memory_id = existing.memory_id
            item.created_at = existing.created_at
            item.access_count = existing.access_count
        item.updated_at = datetime.utcnow().isoformat() + "Z"
        ns[item.key] = item
        logger.debug("Memory PUT: ns=%s key=%s", item.namespace, item.key)
        return item

    async def get(self, namespace: str, key: str) -> MemoryItem | None:
        ns = self._ns(namespace)
        item = ns.get(key)
        if item:
            item.access_count += 1
            item.updated_at = datetime.utcnow().isoformat() + "Z"
        return item

    async def delete(self, namespace: str, key: str) -> bool:
        ns = self._ns(namespace)
        if key in ns:
            del ns[key]
            return True
        return False

    async def search(self, params: MemorySearchParams) -> MemorySearchResult:
        items: list[MemoryItem] = []
        for ns_name, ns_data in self._data.items():
            if params.namespace and ns_name != params.namespace:
                continue
            for item in ns_data.values():
                if params.key_prefix and not item.key.startswith(params.key_prefix):
                    continue
                if params.source and item.source != params.source:
                    continue
                if params.tags and not any(t in item.tags for t in params.tags):
                    continue
                items.append(item)
        items.sort(key=lambda x: x.updated_at, reverse=True)
        total = len(items)
        page = items[params.offset: params.offset + params.limit]
        return MemorySearchResult(
            items=page, total=total, limit=params.limit, offset=params.offset
        )

    async def list_namespaces(self) -> list[str]:
        return list(self._data.keys())

    async def count(self, namespace: str | None = None) -> int:
        if namespace:
            return len(self._ns(namespace))
        return sum(len(ns) for ns in self._data.values())

    async def clear_namespace(self, namespace: str) -> int:
        ns = self._data.pop(namespace, {})
        return len(ns)


# ---------------------------------------------------------------------------
# Database-backed store
# ---------------------------------------------------------------------------

_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS coder_deep_memory (
    memory_id TEXT PRIMARY KEY,
    namespace TEXT NOT NULL DEFAULT 'default',
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    source TEXT DEFAULT 'api',
    tags TEXT[] DEFAULT '{}',
    UNIQUE(namespace, key)
);
CREATE INDEX IF NOT EXISTS idx_memory_namespace ON coder_deep_memory(namespace);
CREATE INDEX IF NOT EXISTS idx_memory_tags ON coder_deep_memory USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_memory_expires ON coder_deep_memory(expires_at) WHERE expires_at IS NOT NULL;
"""


class MemoryStore:
    """Persistent memory store with database and in-memory fallback.

    Provides key-value storage with namespace isolation, TTL support,
    full-text search, and access tracking. Falls back to an in-memory
    store when no database is configured.
    """

    def __init__(self, dsn: str = "") -> None:
        self._dsn = dsn
        self._pool: Any = None
        self._fallback = _InMemoryStore() if not dsn else None

    async def connect(self) -> None:
        """Connect to the PostgreSQL database."""
        if not self._dsn:
            logger.info("MemoryStore: no DSN configured, using in-memory fallback")
            return

        import asyncpg

        self._pool = await asyncpg.create_pool(dsn=self._dsn, min_size=2, max_size=10)
        async with self._pool.acquire() as conn:
            await conn.execute(_CREATE_TABLE_SQL)
        logger.info("MemoryStore: database connected and schema ensured")

    async def close(self) -> None:
        """Close the database connection pool."""
        if self._pool:
            await self._pool.close()
            self._pool = None

    @property
    def _using_db(self) -> bool:
        return self._pool is not None

    async def put(self, item: MemoryItem) -> MemoryItem:
        """Store a memory item. Creates or updates."""
        if not self._using_db:
            result = await self._fallback.put(item)
            return result

        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO coder_deep_memory (memory_id, namespace, key, value, metadata, created_at, updated_at, expires_at, access_count, source, tags)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (namespace, key) DO UPDATE SET
                    value = EXCLUDED.value,
                    metadata = EXCLUDED.metadata,
                    updated_at = EXCLUDED.updated_at,
                    expires_at = EXCLUDED.expires_at,
                    source = EXCLUDED.source,
                    tags = EXCLUDED.tags
                RETURNING *
                """,
                item.memory_id,
                item.namespace,
                item.key,
                json.dumps(item.value),
                json.dumps(item.metadata),
                item.created_at,
                datetime.utcnow().isoformat() + "Z",
                item.expires_at,
                item.access_count,
                item.source,
                item.tags,
            )
        return self._row_to_item(row)

    async def get(self, namespace: str, key: str) -> MemoryItem | None:
        """Retrieve a memory item by namespace and key."""
        if not self._using_db:
            return await self._fallback.get(namespace, key)

        async with self._pool.acquire() as conn:
            await conn.execute(
                "UPDATE coder_deep_memory SET access_count = access_count + 1, updated_at = NOW() WHERE namespace = $1 AND key = $2",
                namespace,
                key,
            )
            row = await conn.fetchrow(
                "SELECT * FROM coder_deep_memory WHERE namespace = $1 AND key = $2",
                namespace,
                key,
            )
        return self._row_to_item(row) if row else None

    async def delete(self, namespace: str, key: str) -> bool:
        """Delete a memory item. Returns True if deleted."""
        if not self._using_db:
            return await self._fallback.delete(namespace, key)

        async with self._pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM coder_deep_memory WHERE namespace = $1 AND key = $2",
                namespace,
                key,
            )
        return result == "DELETE 1"

    async def search(self, params: MemorySearchParams) -> MemorySearchResult:
        """Search memory items with filters."""
        if not self._using_db:
            return await self._fallback.search(params)

        conditions: list[str] = []
        args: list[Any] = []
        idx = 1

        if params.namespace:
            conditions.append(f"namespace = ${idx}")
            args.append(params.namespace)
            idx += 1

        if params.key_prefix:
            conditions.append(f"key LIKE ${idx}")
            args.append(params.key_prefix + "%")
            idx += 1

        if params.source:
            conditions.append(f"source = ${idx}")
            args.append(params.source)
            idx += 1

        if params.tags:
            conditions.append(f"tags && ${idx}")
            args.append(params.tags)
            idx += 1

        where = " AND ".join(conditions) if conditions else "TRUE"

        async with self._pool.acquire() as conn:
            count_row = await conn.fetchrow(
                f"SELECT COUNT(*) as cnt FROM coder_deep_memory WHERE {where}", *args
            )
            total = count_row["cnt"]
            rows = await conn.fetch(
                f"SELECT * FROM coder_deep_memory WHERE {where} ORDER BY updated_at DESC LIMIT ${idx} OFFSET ${idx + 1}",
                *args,
                params.limit,
                params.offset,
            )

        items = [self._row_to_item(r) for r in rows]
        return MemorySearchResult(
            items=items, total=total, limit=params.limit, offset=params.offset
        )

    async def list_namespaces(self) -> list[str]:
        """List all namespaces that have stored memories."""
        if not self._using_db:
            return await self._fallback.list_namespaces()

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT DISTINCT namespace FROM coder_deep_memory ORDER BY namespace"
            )
        return [r["namespace"] for r in rows]

    async def count(self, namespace: str | None = None) -> int:
        """Count memory items, optionally filtered by namespace."""
        if not self._using_db:
            return await self._fallback.count(namespace)

        async with self._pool.acquire() as conn:
            if namespace:
                row = await conn.fetchrow(
                    "SELECT COUNT(*) as cnt FROM coder_deep_memory WHERE namespace = $1",
                    namespace,
                )
            else:
                row = await conn.fetchrow(
                    "SELECT COUNT(*) as cnt FROM coder_deep_memory"
                )
        return row["cnt"]

    async def clear_namespace(self, namespace: str) -> int:
        """Clear all items in a namespace. Returns count of deleted items."""
        if not self._using_db:
            return await self._fallback.clear_namespace(namespace)

        async with self._pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM coder_deep_memory WHERE namespace = $1",
                namespace,
            )
        count_str = result.split()[-1]
        return int(count_str)

    @staticmethod
    def _row_to_item(row: Any) -> MemoryItem:
        """Convert a database row to a MemoryItem."""
        value = row["value"]
        if isinstance(value, str):
            value = json.loads(value)

        metadata = row["metadata"]
        if isinstance(metadata, str):
            metadata = json.loads(metadata)

        return MemoryItem(
            memory_id=row["memory_id"],
            namespace=row["namespace"],
            key=row["key"],
            value=value,
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
            expires_at=(
                row["expires_at"].isoformat()
                if row["expires_at"] and hasattr(row["expires_at"], "isoformat")
                else (str(row["expires_at"]) if row["expires_at"] else None)
            ),
            access_count=row["access_count"],
            source=row["source"],
            tags=row["tags"] if row["tags"] else [],
        )
