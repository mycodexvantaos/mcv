"""Context cache for large project contexts with LRU eviction and TTL.

Provides an efficient caching layer for storing and retrieving large project
contexts (file trees, architecture maps, dependency graphs) with automatic
eviction based on LRU policy and optional TTL expiration.
"""

import hashlib
import json
import logging
import time
from collections import OrderedDict
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class ContextEntry(BaseModel):
    """A cached context entry with metadata."""

    entry_id: str = ""
    namespace: str = "default"
    context_type: str = "general"
    label: str = ""
    data: Any = None
    size_bytes: int = 0
    checksum: str = ""
    created_at: float = Field(default_factory=time.time)
    accessed_at: float = Field(default_factory=time.time)
    expires_at: float | None = None
    hit_count: int = 0
    tags: list[str] = Field(default_factory=list)
    source_file: str = ""
    version: int = 1


class ContextQuery(BaseModel):
    """Parameters for querying cached contexts."""

    namespace: str | None = None
    context_type: str | None = None
    label: str | None = None
    tags: list[str] = Field(default_factory=list)
    limit: int = 50
    offset: int = 0


class ContextStats(BaseModel):
    """Statistics about the context cache."""

    total_entries: int = 0
    total_size_bytes: int = 0
    namespaces: list[str] = Field(default_factory=list)
    context_types: list[str] = Field(default_factory=list)
    hit_rate: float = 0.0
    eviction_count: int = 0


# ---------------------------------------------------------------------------
# LRU Cache with TTL
# ---------------------------------------------------------------------------


@dataclass
class _CacheNode:
    """Internal node for the LRU cache."""

    entry_id: str
    entry: ContextEntry
    prev_node: "_CacheNode | None" = None
    next_node: "_CacheNode | None" = None


class ContextCache:
    """LRU + TTL cache for large project contexts.

    Stores project contexts (file trees, architecture maps, dependency
    graphs) with automatic LRU eviction and optional TTL expiration.
    Thread-safe for async usage with in-memory storage. Database
    persistence is optional.
    """

    def __init__(self, max_entries: int = 1000, max_size_bytes: int = 50 * 1024 * 1024) -> None:
        self._max_entries = max_entries
        self._max_size_bytes = max_size_bytes
        self._entries: OrderedDict[str, ContextEntry] = OrderedDict()
        self._current_size: int = 0
        self._hits: int = 0
        self._misses: int = 0
        self._evictions: int = 0

    def _compute_checksum(self, data: Any) -> str:
        """Compute a checksum for cache validation."""
        raw = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    def _estimate_size(self, data: Any) -> int:
        """Estimate the byte size of cached data."""
        raw = json.dumps(data, default=str)
        return len(raw.encode("utf-8"))

    def _evict_if_needed(self, needed_bytes: int) -> None:
        """Evict entries using LRU policy until there is room."""
        while self._entries and (
            len(self._entries) >= self._max_entries
            or self._current_size + needed_bytes > self._max_size_bytes
        ):
            _, evicted = self._entries.popitem(last=False)
            self._current_size -= evicted.size_bytes
            self._evictions += 1
            logger.debug(
                "ContextCache evicted: %s (%d bytes)",
                evicted.entry_id,
                evicted.size_bytes,
            )

    def _purge_expired(self) -> int:
        """Remove expired entries. Returns count of purged entries."""
        now = time.time()
        expired_keys = [
            k for k, v in self._entries.items() if v.expires_at is not None and v.expires_at <= now
        ]
        for k in expired_keys:
            entry = self._entries.pop(k)
            self._current_size -= entry.size_bytes
            self._evictions += 1
        return len(expired_keys)

    async def put(self, entry: ContextEntry) -> ContextEntry:
        """Store a context entry in the cache."""
        self._purge_expired()

        if not entry.entry_id:
            entry.entry_id = hashlib.sha256(
                f"{entry.namespace}:{entry.context_type}:{entry.label}:{time.time()}".encode()
            ).hexdigest()[:16]

        entry.size_bytes = self._estimate_size(entry.data)
        entry.checksum = self._compute_checksum(entry.data)
        entry.created_at = time.time()
        entry.accessed_at = time.time()
        entry.hit_count = 0

        # If key already exists, remove old entry first
        if entry.entry_id in self._entries:
            old = self._entries.pop(entry.entry_id)
            self._current_size -= old.size_bytes

        self._evict_if_needed(entry.size_bytes)

        self._entries[entry.entry_id] = entry
        self._current_size += entry.size_bytes
        self._entries.move_to_end(entry.entry_id)

        logger.debug("ContextCache PUT: %s (%d bytes)", entry.entry_id, entry.size_bytes)
        return entry

    async def get(self, entry_id: str) -> ContextEntry | None:
        """Retrieve a context entry by ID. Returns None if not found or expired."""
        self._purge_expired()

        entry = self._entries.get(entry_id)
        if entry is None:
            self._misses += 1
            return None

        # Check TTL
        if entry.expires_at is not None and entry.expires_at <= time.time():
            self._entries.pop(entry_id)
            self._current_size -= entry.size_bytes
            self._misses += 1
            return None

        entry.hit_count += 1
        entry.accessed_at = time.time()
        self._entries.move_to_end(entry_id)
        self._hits += 1
        return entry

    async def find(self, query: ContextQuery) -> list[ContextEntry]:
        """Find context entries matching query parameters."""
        self._purge_expired()
        results: list[ContextEntry] = []

        for entry in reversed(self._entries.values()):
            if query.namespace and entry.namespace != query.namespace:
                continue
            if query.context_type and entry.context_type != query.context_type:
                continue
            if query.label and entry.label != query.label:
                continue
            if query.tags and not any(t in entry.tags for t in query.tags):
                continue
            results.append(entry)
            if len(results) >= query.limit:
                break

        return results[query.offset :]

    async def delete(self, entry_id: str) -> bool:
        """Delete a context entry. Returns True if deleted."""
        entry = self._entries.pop(entry_id, None)
        if entry:
            self._current_size -= entry.size_bytes
            return True
        return False

    async def invalidate(self, namespace: str) -> int:
        """Invalidate all entries in a namespace. Returns count of invalidated entries."""
        to_remove = [k for k, v in self._entries.items() if v.namespace == namespace]
        for k in to_remove:
            entry = self._entries.pop(k)
            self._current_size -= entry.size_bytes
        return len(to_remove)

    async def stats(self) -> ContextStats:
        """Get cache statistics."""
        self._purge_expired()
        total_requests = self._hits + self._misses
        hit_rate = self._hits / total_requests if total_requests > 0 else 0.0

        namespaces = list({e.namespace for e in self._entries.values()})
        context_types = list({e.context_type for e in self._entries.values()})

        return ContextStats(
            total_entries=len(self._entries),
            total_size_bytes=self._current_size,
            namespaces=namespaces,
            context_types=context_types,
            hit_rate=round(hit_rate, 4),
            eviction_count=self._evictions,
        )

    async def clear(self) -> int:
        """Clear all cache entries. Returns count of cleared entries."""
        count = len(self._entries)
        self._entries.clear()
        self._current_size = 0
        return count

    async def refresh(self, entry_id: str, data: Any) -> ContextEntry | None:
        """Refresh a cached entry with new data. Returns updated entry or None."""
        entry = self._entries.get(entry_id)
        if entry is None:
            return None

        old_size = entry.size_bytes
        entry.data = data
        entry.size_bytes = self._estimate_size(data)
        entry.checksum = self._compute_checksum(data)
        entry.version += 1
        entry.accessed_at = time.time()

        self._current_size -= old_size
        self._current_size += entry.size_bytes
        self._entries.move_to_end(entry_id)

        return entry
