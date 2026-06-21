"""Tests for mycodexvantaos_coder_deep.pipeline_codex module."""

import pytest
from mycodexvantaos_coder_deep.pipeline_codex import (
    CodexCategory,
    CodexEntry,
    CodexQuery,
    CodexStatus,
    PipelineCodex,
)


@pytest.fixture
def codex() -> PipelineCodex:
    """Create an in-memory PipelineCodex for each test."""
    return PipelineCodex(dsn="")


class TestCodexPutAndGet:
    """Test put and get operations."""

    @pytest.mark.asyncio
    async def test_put_and_get_basic(self, codex: PipelineCodex) -> None:
        """Store and retrieve a basic codex entry."""
        entry = CodexEntry(
            category=CodexCategory.BEST_PRACTICE,
            title="Test Best Practice",
            description="A test best practice",
            content="Do X, then Y",
        )
        result = await codex.put(entry=entry)
        assert result.category == CodexCategory.BEST_PRACTICE
        assert result.title == "Test Best Practice"
        assert result.entry_id != ""

        retrieved = await codex.get(entry_id=result.entry_id)
        assert retrieved is not None
        assert retrieved.title == "Test Best Practice"
        assert retrieved.content == "Do X, then Y"

    @pytest.mark.asyncio
    async def test_get_nonexistent(self, codex: PipelineCodex) -> None:
        """Getting a nonexistent entry returns None."""
        result = await codex.get(entry_id="nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_put_with_tags(self, codex: PipelineCodex) -> None:
        """Store with tags."""
        entry = CodexEntry(
            category=CodexCategory.STANDARD,
            title="Standard",
            content="Follow this",
            tags=["python", "style"],
        )
        result = await codex.put(entry=entry)
        assert set(result.tags) == {"python", "style"}

    @pytest.mark.asyncio
    async def test_put_with_priority(self, codex: PipelineCodex) -> None:
        """Store with priority."""
        entry = CodexEntry(
            category=CodexCategory.WORKFLOW,
            title="Priority Workflow",
            content="Always do X",
            priority=10,
        )
        result = await codex.put(entry=entry)
        assert result.priority == 10


class TestCodexVersioning:
    """Test version tracking."""

    @pytest.mark.asyncio
    async def test_version_increment_on_update(self, codex: PipelineCodex) -> None:
        """Putting the same entry_id increments version."""
        entry1 = CodexEntry(
            entry_id="fixed-entry-id",
            category=CodexCategory.PATTERN,
            title="Version Test",
            content="v1",
        )
        result1 = await codex.put(entry=entry1)
        assert result1.version == 1

        # Update the entry with same entry_id
        entry2 = CodexEntry(
            entry_id="fixed-entry-id",
            category=CodexCategory.PATTERN,
            title="Version Test",
            content="v2",
        )
        result2 = await codex.put(entry=entry2)
        assert result2.version == 2

    @pytest.mark.asyncio
    async def test_get_versions(self, codex: PipelineCodex) -> None:
        """Get version history for an entry."""
        entry = CodexEntry(
            category=CodexCategory.WORKFLOW,
            title="Versioned",
            content="content",
        )
        result = await codex.put(entry=entry)
        versions = await codex.get_versions(entry_id=result.entry_id)
        assert len(versions) >= 1


class TestCodexDelete:
    """Test delete operation."""

    @pytest.mark.asyncio
    async def test_delete_existing(self, codex: PipelineCodex) -> None:
        """Delete an existing entry returns True."""
        entry = CodexEntry(
            category=CodexCategory.PATTERN,
            title="Delete Me",
            content="content",
        )
        result = await codex.put(entry=entry)
        deleted = await codex.delete(entry_id=result.entry_id)
        assert deleted is True
        assert await codex.get(entry_id=result.entry_id) is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent(self, codex: PipelineCodex) -> None:
        """Delete a nonexistent entry returns False."""
        deleted = await codex.delete(entry_id="nonexistent")
        assert deleted is False


class TestCodexQuery:
    """Test query operation."""

    @pytest.mark.asyncio
    async def test_query_by_category(self, codex: PipelineCodex) -> None:
        """Query entries by category."""
        await codex.put(
            entry=CodexEntry(category=CodexCategory.PATTERN,
                             title="P1", content="c1")
        )
        await codex.put(
            entry=CodexEntry(
                category=CodexCategory.ANTI_PATTERN, title="AP1", content="c2"
            )
        )
        result = await codex.query(params=CodexQuery(category=CodexCategory.PATTERN))
        assert len(result) >= 1

    @pytest.mark.asyncio
    async def test_query_by_search_text(self, codex: PipelineCodex) -> None:
        """Query entries by search text."""
        await codex.put(
            entry=CodexEntry(
                category=CodexCategory.BEST_PRACTICE,
                title="Error Handling Guide",
                content="Always handle exceptions",
            )
        )
        result = await codex.query(params=CodexQuery(search_text="Error Handling"))
        assert len(result) >= 1

    @pytest.mark.asyncio
    async def test_query_by_tags(self, codex: PipelineCodex) -> None:
        """Query entries by tags."""
        await codex.put(
            entry=CodexEntry(
                category=CodexCategory.STANDARD,
                title="Naming",
                content="Use kebab-case",
                tags=["naming", "style"],
            )
        )
        result = await codex.query(params=CodexQuery(tags=["naming"]))
        assert len(result) >= 1


class TestCodexStats:
    """Test get_stats operation."""

    @pytest.mark.asyncio
    async def test_stats_empty(self, codex: PipelineCodex) -> None:
        """Stats on empty codex return zero counts."""
        stats = await codex.get_stats()
        assert stats.total_entries == 0

    @pytest.mark.asyncio
    async def test_stats_after_entries(self, codex: PipelineCodex) -> None:
        """Stats reflect stored entries."""
        await codex.put(
            entry=CodexEntry(category=CodexCategory.PATTERN,
                             title="P1", content="c1")
        )
        await codex.put(
            entry=CodexEntry(category=CodexCategory.WORKFLOW,
                             title="W1", content="c2")
        )
        stats = await codex.get_stats()
        assert stats.total_entries == 2


class TestCodexCategoryEnum:
    """Test CodexCategory enum values."""

    def test_all_categories(self) -> None:
        """All expected categories exist."""
        expected = [
            "best_practice",
            "pipeline",
            "workflow",
            "capability",
            "runbook",
            "standard",
            "pattern",
            "anti_pattern",
        ]
        for cat in expected:
            assert CodexCategory(cat) == cat

    def test_invalid_category(self) -> None:
        """Invalid category raises ValueError."""
        with pytest.raises(ValueError):
            CodexCategory("invalid")


class TestCodexStatusEnum:
    """Test CodexStatus enum values."""

    def test_all_statuses(self) -> None:
        """All expected statuses exist."""
        expected = ["draft", "active", "deprecated", "archived"]
        for status in expected:
            assert CodexStatus(status) == status
