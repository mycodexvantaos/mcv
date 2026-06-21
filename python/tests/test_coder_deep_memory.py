"""Tests for mycodexvantaos_coder_deep.memory_store module."""

import pytest
from mycodexvantaos_coder_deep.memory_store import (MemoryItem,
                                                    MemorySearchParams,
                                                    MemoryStore)


@pytest.fixture
def store() -> MemoryStore:
    """Create an in-memory MemoryStore for each test."""
    return MemoryStore(dsn="")


class TestMemoryStorePutAndGet:
    """Test put and get operations."""

    @pytest.mark.asyncio
    async def test_put_and_get_basic(self, store: MemoryStore) -> None:
        """Store and retrieve a basic memory item."""
        item = MemoryItem(
            namespace="test-ns", key="my-key", value={"hello": "world"}, tags=["tag1"]
        )
        result = await store.put(item=item)
        assert result.namespace == "test-ns"
        assert result.key == "my-key"
        assert result.value == {"hello": "world"}

        retrieved = await store.get(namespace="test-ns", key="my-key")
        assert retrieved is not None
        assert retrieved.value == {"hello": "world"}
        assert retrieved.tags == ["tag1"]

    @pytest.mark.asyncio
    async def test_get_nonexistent(self, store: MemoryStore) -> None:
        """Getting a nonexistent key returns None."""
        result = await store.get(namespace="missing", key="nope")
        assert result is None

    @pytest.mark.asyncio
    async def test_put_overwrites(self, store: MemoryStore) -> None:
        """Putting the same namespace/key overwrites the value."""
        await store.put(item=MemoryItem(namespace="ns", key="k", value="v1"))
        await store.put(item=MemoryItem(namespace="ns", key="k", value="v2"))
        item = await store.get(namespace="ns", key="k")
        assert item is not None
        assert item.value == "v2"

    @pytest.mark.asyncio
    async def test_put_with_metadata(self, store: MemoryStore) -> None:
        """Store and retrieve with metadata."""
        await store.put(
            item=MemoryItem(
                namespace="ns",
                key="k",
                value="val",
                metadata={"source": "test", "priority": 1},
            )
        )
        item = await store.get(namespace="ns", key="k")
        assert item is not None
        assert item.metadata["source"] == "test"

    @pytest.mark.asyncio
    async def test_put_with_tags(self, store: MemoryStore) -> None:
        """Store and retrieve with tags."""
        await store.put(
            item=MemoryItem(namespace="ns", key="k", value="val", tags=["a", "b", "c"])
        )
        item = await store.get(namespace="ns", key="k")
        assert item is not None
        assert set(item.tags) == {"a", "b", "c"}


class TestMemoryStoreDelete:
    """Test delete operations."""

    @pytest.mark.asyncio
    async def test_delete_existing(self, store: MemoryStore) -> None:
        """Delete an existing item returns True."""
        await store.put(item=MemoryItem(namespace="ns", key="k", value="v"))
        deleted = await store.delete(namespace="ns", key="k")
        assert deleted is True
        assert await store.get(namespace="ns", key="k") is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent(self, store: MemoryStore) -> None:
        """Delete a nonexistent item returns False."""
        deleted = await store.delete(namespace="ns", key="missing")
        assert deleted is False


class TestMemoryStoreSearch:
    """Test search operations."""

    @pytest.mark.asyncio
    async def test_search_by_namespace(self, store: MemoryStore) -> None:
        """Search finds items in a specific namespace."""
        await store.put(item=MemoryItem(namespace="ns", key="k1", value="hello world"))
        await store.put(item=MemoryItem(namespace="ns", key="k2", value="foo bar"))
        result = await store.search(params=MemorySearchParams(namespace="ns"))
        assert result.total >= 2

    @pytest.mark.asyncio
    async def test_search_by_tags(self, store: MemoryStore) -> None:
        """Search finds items matching tags."""
        await store.put(
            item=MemoryItem(namespace="ns", key="k1", value="v1", tags=["python"])
        )
        await store.put(
            item=MemoryItem(namespace="ns", key="k2", value="v2", tags=["typescript"])
        )
        result = await store.search(
            params=MemorySearchParams(namespace="ns", tags=["python"])
        )
        assert result.total >= 1

    @pytest.mark.asyncio
    async def test_search_by_key_prefix(self, store: MemoryStore) -> None:
        """Search finds items by key prefix."""
        await store.put(item=MemoryItem(namespace="ns", key="prefix-key1", value="v1"))
        await store.put(item=MemoryItem(namespace="ns", key="other-key2", value="v2"))
        result = await store.search(
            params=MemorySearchParams(namespace="ns", key_prefix="prefix")
        )
        assert result.total >= 1

    @pytest.mark.asyncio
    async def test_search_no_results(self, store: MemoryStore) -> None:
        """Search with no matches returns empty results."""
        await store.put(item=MemoryItem(namespace="ns", key="k1", value="hello"))
        result = await store.search(
            params=MemorySearchParams(namespace="ns", key_prefix="xyznotfound")
        )
        assert result.total == 0


class TestMemoryStoreListAndCount:
    """Test list_namespaces and count operations."""

    @pytest.mark.asyncio
    async def test_list_namespaces(self, store: MemoryStore) -> None:
        """List namespaces that have stored items."""
        await store.put(item=MemoryItem(namespace="ns1", key="k1", value="v1"))
        await store.put(item=MemoryItem(namespace="ns2", key="k2", value="v2"))
        namespaces = await store.list_namespaces()
        assert "ns1" in namespaces
        assert "ns2" in namespaces

    @pytest.mark.asyncio
    async def test_count(self, store: MemoryStore) -> None:
        """Count items in a namespace."""
        await store.put(item=MemoryItem(namespace="ns", key="k1", value="v1"))
        await store.put(item=MemoryItem(namespace="ns", key="k2", value="v2"))
        count = await store.count(namespace="ns")
        assert count == 2

    @pytest.mark.asyncio
    async def test_count_all_namespaces(self, store: MemoryStore) -> None:
        """Count items across all namespaces."""
        await store.put(item=MemoryItem(namespace="ns1", key="k1", value="v1"))
        await store.put(item=MemoryItem(namespace="ns2", key="k2", value="v2"))
        count = await store.count()
        assert count == 2


class TestMemoryStoreClearNamespace:
    """Test clear_namespace operation."""

    @pytest.mark.asyncio
    async def test_clear_namespace(self, store: MemoryStore) -> None:
        """Clear all items in a namespace."""
        await store.put(item=MemoryItem(namespace="ns1", key="k1", value="v1"))
        await store.put(item=MemoryItem(namespace="ns2", key="k2", value="v2"))
        cleared = await store.clear_namespace(namespace="ns1")
        assert cleared == 1
        assert await store.count(namespace="ns1") == 0
        assert await store.count(namespace="ns2") == 1
