"""Tests for mycodexvantaos_coder_deep.context_cache module."""

import time

import pytest
from mycodexvantaos_coder_deep.context_cache import (
    ContextCache,
    ContextEntry,
    ContextQuery,
)


@pytest.fixture
def cache() -> ContextCache:
    """Create a ContextCache for each test."""
    return ContextCache(max_entries=10, max_size_bytes=10240)


class TestContextCachePutAndGet:
    """Test put and get operations."""

    @pytest.mark.asyncio
    async def test_put_and_get_basic(self, cache: ContextCache) -> None:
        """Store and retrieve a basic context entry."""
        entry = ContextEntry(
            namespace="test-ns", context_type="general", label="test-label", data="hello world"
        )
        result = await cache.put(entry=entry)
        assert result.namespace == "test-ns"
        assert result.label == "test-label"
        assert result.data == "hello world"
        assert result.entry_id != ""

        retrieved = await cache.get(entry_id=result.entry_id)
        assert retrieved is not None
        assert retrieved.data == "hello world"

    @pytest.mark.asyncio
    async def test_get_nonexistent(self, cache: ContextCache) -> None:
        """Getting a nonexistent entry returns None."""
        result = await cache.get(entry_id="missing-id")
        assert result is None

    @pytest.mark.asyncio
    async def test_put_overwrites(self, cache: ContextCache) -> None:
        """Putting an entry with the same entry_id overwrites."""
        entry1 = ContextEntry(
            entry_id="fixed-id", namespace="ns", context_type="general", label="lbl", data="v1"
        )
        await cache.put(entry=entry1)
        entry2 = ContextEntry(
            entry_id="fixed-id", namespace="ns", context_type="general", label="lbl", data="v2"
        )
        await cache.put(entry=entry2)
        retrieved = await cache.get(entry_id="fixed-id")
        assert retrieved is not None
        assert retrieved.data == "v2"

    @pytest.mark.asyncio
    async def test_put_with_tags(self, cache: ContextCache) -> None:
        """Store with tags."""
        entry = ContextEntry(
            namespace="ns", context_type="general", label="k", data="v", tags=["python", "style"]
        )
        result = await cache.put(entry=entry)
        assert set(result.tags) == {"python", "style"}

    @pytest.mark.asyncio
    async def test_put_auto_generates_entry_id(self, cache: ContextCache) -> None:
        """If no entry_id is given, one is auto-generated."""
        entry = ContextEntry(namespace="ns", context_type="general", label="auto", data="v")
        result = await cache.put(entry=entry)
        assert result.entry_id != ""


class TestContextCacheTTL:
    """Test TTL expiration."""

    @pytest.mark.asyncio
    async def test_ttl_expiration(self, cache: ContextCache) -> None:
        """Entries with expires_at in the past expire."""
        entry = ContextEntry(
            namespace="ns",
            context_type="general",
            label="ttl-key",
            data="expires",
            expires_at=time.time() - 1,
        )
        result = await cache.put(entry=entry)
        # The put already purges expired entries, so get should return None
        retrieved = await cache.get(entry_id=result.entry_id)
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_no_ttl_stays(self, cache: ContextCache) -> None:
        """Entries without TTL do not expire."""
        entry = ContextEntry(namespace="ns", context_type="general", label="no-ttl", data="forever")
        result = await cache.put(entry=entry)
        retrieved = await cache.get(entry_id=result.entry_id)
        assert retrieved is not None


class TestContextCacheLRU:
    """Test LRU eviction."""

    @pytest.mark.asyncio
    async def test_lru_eviction_by_entries(self) -> None:
        """Oldest entries are evicted when max_entries is exceeded."""
        small_cache = ContextCache(max_entries=3, max_size_bytes=102400)
        ids = []
        for i in range(5):
            entry = ContextEntry(
                namespace="ns", context_type="general", label=f"key-{i}", data=f"val-{i}"
            )
            result = await small_cache.put(entry=entry)
            ids.append(result.entry_id)

        # Only the last 3 should remain
        assert await small_cache.get(entry_id=ids[0]) is None
        assert await small_cache.get(entry_id=ids[1]) is None
        assert await small_cache.get(entry_id=ids[2]) is not None
        assert await small_cache.get(entry_id=ids[3]) is not None
        assert await small_cache.get(entry_id=ids[4]) is not None


class TestContextCacheFind:
    """Test find operation."""

    @pytest.mark.asyncio
    async def test_find_by_namespace(self, cache: ContextCache) -> None:
        """Find entries by namespace."""
        await cache.put(
            entry=ContextEntry(namespace="ns1", context_type="general", label="k1", data="v1")
        )
        await cache.put(
            entry=ContextEntry(namespace="ns2", context_type="general", label="k2", data="v2")
        )
        entries = await cache.find(query=ContextQuery(namespace="ns1"))
        assert len(entries) >= 1
        assert all(e.namespace == "ns1" for e in entries)

    @pytest.mark.asyncio
    async def test_find_by_context_type(self, cache: ContextCache) -> None:
        """Find entries by context type."""
        await cache.put(
            entry=ContextEntry(namespace="ns", context_type="text", label="k1", data="v1")
        )
        await cache.put(
            entry=ContextEntry(namespace="ns", context_type="json", label="k2", data="v2")
        )
        entries = await cache.find(query=ContextQuery(context_type="json"))
        assert len(entries) >= 1
        assert all(e.context_type == "json" for e in entries)

    @pytest.mark.asyncio
    async def test_find_by_label(self, cache: ContextCache) -> None:
        """Find entries by label."""
        await cache.put(
            entry=ContextEntry(namespace="ns", context_type="general", label="find-me", data="v1")
        )
        entries = await cache.find(query=ContextQuery(label="find-me"))
        assert len(entries) >= 1


class TestContextCacheDelete:
    """Test delete operation."""

    @pytest.mark.asyncio
    async def test_delete_existing(self, cache: ContextCache) -> None:
        """Delete an existing entry returns True."""
        entry = ContextEntry(namespace="ns", context_type="general", label="k", data="v")
        result = await cache.put(entry=entry)
        deleted = await cache.delete(entry_id=result.entry_id)
        assert deleted is True
        assert await cache.get(entry_id=result.entry_id) is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent(self, cache: ContextCache) -> None:
        """Delete a nonexistent entry returns False."""
        deleted = await cache.delete(entry_id="missing-id")
        assert deleted is False


class TestContextCacheStats:
    """Test stats operation."""

    @pytest.mark.asyncio
    async def test_stats_empty(self, cache: ContextCache) -> None:
        """Stats on empty cache show zero entries."""
        stats = await cache.stats()
        assert stats.total_entries == 0

    @pytest.mark.asyncio
    async def test_stats_after_put(self, cache: ContextCache) -> None:
        """Stats reflect entries after put."""
        await cache.put(
            entry=ContextEntry(namespace="ns1", context_type="general", label="k1", data="v1")
        )
        await cache.put(
            entry=ContextEntry(namespace="ns2", context_type="general", label="k2", data="v2")
        )
        stats = await cache.stats()
        assert stats.total_entries == 2
        assert stats.total_size_bytes > 0

    @pytest.mark.asyncio
    async def test_hit_rate(self, cache: ContextCache) -> None:
        """Hit rate is computed from hits and misses."""
        entry = ContextEntry(namespace="ns", context_type="general", label="k", data="v")
        result = await cache.put(entry=entry)
        await cache.get(entry_id=result.entry_id)  # hit
        await cache.get(entry_id="missing-id")  # miss
        stats = await cache.stats()
        assert stats.hit_rate > 0


class TestContextCacheClear:
    """Test clear operation."""

    @pytest.mark.asyncio
    async def test_clear(self, cache: ContextCache) -> None:
        """Clear removes all entries."""
        await cache.put(
            entry=ContextEntry(namespace="ns", context_type="general", label="k1", data="v1")
        )
        await cache.put(
            entry=ContextEntry(namespace="ns", context_type="general", label="k2", data="v2")
        )
        count = await cache.clear()
        assert count == 2
        stats = await cache.stats()
        assert stats.total_entries == 0


class TestContextCacheRefresh:
    """Test refresh operation."""

    @pytest.mark.asyncio
    async def test_refresh_updates_data(self, cache: ContextCache) -> None:
        """Refresh updates the data and increments version."""
        entry = ContextEntry(namespace="ns", context_type="general", label="k", data="original")
        result = await cache.put(entry=entry)
        refreshed = await cache.refresh(entry_id=result.entry_id, data="updated")
        assert refreshed is not None
        assert refreshed.data == "updated"
        assert refreshed.version == 2

    @pytest.mark.asyncio
    async def test_refresh_nonexistent(self, cache: ContextCache) -> None:
        """Refresh a nonexistent entry returns None."""
        refreshed = await cache.refresh(entry_id="missing-id", data="x")
        assert refreshed is None


class TestContextCacheInvalidate:
    """Test invalidate operation."""

    @pytest.mark.asyncio
    async def test_invalidate_namespace(self, cache: ContextCache) -> None:
        """Invalidate removes all entries in a namespace."""
        await cache.put(
            entry=ContextEntry(namespace="ns1", context_type="general", label="k1", data="v1")
        )
        await cache.put(
            entry=ContextEntry(namespace="ns2", context_type="general", label="k2", data="v2")
        )
        count = await cache.invalidate(namespace="ns1")
        assert count == 1
        stats = await cache.stats()
        assert stats.total_entries == 1
