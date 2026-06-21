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
        await codex.put(entry=CodexEntry(category=CodexCategory.PATTERN, title="P1", content="c1"))
        await codex.put(
            entry=CodexEntry(category=CodexCategory.ANTI_PATTERN, title="AP1", content="c2")
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
        await codex.put(entry=CodexEntry(category=CodexCategory.PATTERN, title="P1", content="c1"))
        await codex.put(entry=CodexEntry(category=CodexCategory.WORKFLOW, title="W1", content="c2"))
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


class TestCodexCoverageEdges:
    """Focused tests for query filters, ordering, and stats maps."""

    @pytest.mark.asyncio
    async def test_query_filters_status_team_scope_and_paginates(
        self, codex: PipelineCodex
    ) -> None:
        """Query combines status/team/scope filters and honors offset/limit."""
        await codex.put(
            entry=CodexEntry(
                category=CodexCategory.RUNBOOK,
                title="First",
                content="alpha",
                status=CodexStatus.ACTIVE,
                team="platform",
                scope="repo",
                priority=1,
            )
        )
        await codex.put(
            entry=CodexEntry(
                category=CodexCategory.RUNBOOK,
                title="Second",
                content="beta",
                status=CodexStatus.ACTIVE,
                team="platform",
                scope="repo",
                priority=10,
            )
        )
        await codex.put(
            entry=CodexEntry(
                category=CodexCategory.RUNBOOK,
                title="Other Team",
                content="gamma",
                status=CodexStatus.ACTIVE,
                team="security",
                scope="repo",
            )
        )
        results = await codex.query(
            params=CodexQuery(
                status=CodexStatus.ACTIVE,
                team="platform",
                scope="repo",
                limit=1,
                offset=1,
            )
        )
        assert len(results) == 1
        assert results[0].team == "platform"
        assert results[0].scope == "repo"
        assert results[0].title == "First"

    @pytest.mark.asyncio
    async def test_query_search_text_no_match_returns_empty(self, codex: PipelineCodex) -> None:
        """Search text excludes entries whose title/description/content do not match."""
        await codex.put(
            entry=CodexEntry(
                category=CodexCategory.PATTERN,
                title="Circuit Breaker",
                description="Resilience pattern",
                content="Protect downstream services",
            )
        )
        assert await codex.query(params=CodexQuery(search_text="not-present")) == []

    @pytest.mark.asyncio
    async def test_stats_include_status_team_and_scope_breakdowns(
        self, codex: PipelineCodex
    ) -> None:
        """Stats expose category, status, team, and scope counters."""
        await codex.put(
            entry=CodexEntry(
                category=CodexCategory.CAPABILITY,
                title="Capability",
                content="content",
                status=CodexStatus.DRAFT,
                team="ai",
                scope="service",
            )
        )
        stats = await codex.get_stats()
        assert stats.by_status[CodexStatus.DRAFT] == 1
        assert stats.by_team["ai"] == 1
        assert stats.by_scope["service"] == 1

    def test_row_to_entry_decodes_metadata_and_defaults_lists(self) -> None:
        """Database row conversion decodes metadata and normalizes nullable arrays."""
        from datetime import datetime

        now = datetime(2026, 1, 2, 3, 4, 5)
        row = {
            "entry_id": "entry-1",
            "category": CodexCategory.RUNBOOK,
            "title": "Runbook",
            "description": "desc",
            "content": "content",
            "status": CodexStatus.ACTIVE,
            "version": 7,
            "author": "agent",
            "team": "platform",
            "tags": None,
            "metadata": '{"source": "db"}',
            "created_at": now,
            "updated_at": now,
            "parent_id": "parent",
            "references": None,
            "scope": "repo",
            "priority": 9,
            "applies_to": None,
        }
        entry = PipelineCodex._row_to_entry(row)
        assert entry.metadata == {"source": "db"}
        assert entry.tags == []
        assert entry.references == []
        assert entry.applies_to == []
        assert entry.created_at == now.isoformat()
