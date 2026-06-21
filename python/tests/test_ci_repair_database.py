"""Tests for CI Repair Agent database operations.

Tests the DatabaseClient with mocked asyncpg to verify
schema creation, analysis storage, and retrieval.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from mycodexvantaos_ci_repair.database import DatabaseClient
from mycodexvantaos_ci_repair.models import (ErrorCategory, FailureAnalysis,
                                             FailureSeverity, RepairAction,
                                             RepairActionType, RepairPlan)


def _make_mock_pool(mock_conn: AsyncMock) -> AsyncMock:
    """Create a mock pool whose acquire() works as an async context manager.

    The database code uses:  async with pool.acquire() as conn:
    So acquire() must return an object whose __aenter__ returns mock_conn.
    """
    mock_pool = AsyncMock()
    # Create a mock async context manager for acquire()
    acm = AsyncMock()
    acm.__aenter__ = AsyncMock(return_value=mock_conn)
    acm.__aexit__ = AsyncMock(return_value=False)
    mock_pool.acquire = MagicMock(return_value=acm)
    return mock_pool


@pytest.fixture
def sample_analysis() -> FailureAnalysis:
    """Create a sample FailureAnalysis for testing."""
    return FailureAnalysis(
        run_id=1001,
        job_id=2001,
        job_name="Build",
        error_category=ErrorCategory.DEPENDENCY_ERROR,
        severity=FailureSeverity.HIGH,
        root_cause="dependency_error detected in job 'Build'",
        affected_files=["src/main.py"],
        affected_dependencies=["ws"],
        log_evidence="npm ERR! ERESOLVE could not resolve dependency",
        suggested_fix="Update or override dependencies: ws. Run `pnpm install` to update lockfile.",
        confidence=0.8,
    )


@pytest.fixture
def sample_plan(sample_analysis: FailureAnalysis) -> RepairPlan:
    """Create a sample RepairPlan for testing."""
    return RepairPlan(
        run_id=1001,
        run_name="CI Pipeline",
        branch="main",
        analyses=[sample_analysis],
        actions=[
            RepairAction(
                action_type=RepairActionType.UPDATE_DEPENDENCY,
                description="Update dependency: ws",
                command="pnpm update ws",
                risk_level=FailureSeverity.LOW,
                requires_manual_review=False,
            ),
        ],
        branch_name="fix/ci-repair-ci-pipeline-1001",
        pr_title="fix(ci): auto-repair for dependency error — run #1001",
        pr_body="## CI Auto-Repair\n",
        can_auto_fix=True,
        summary="Run #1001: 1 failure(s), 1 action(s); Auto-fix available",
    )


class TestDatabaseClient:
    """Test DatabaseClient operations with mocked asyncpg."""

    def test_init_stores_dsn(self) -> None:
        client = DatabaseClient(dsn="postgresql://user:pass@localhost/db")
        assert client.dsn == "postgresql://user:pass@localhost/db"

    def test_pool_raises_when_not_connected(self) -> None:
        client = DatabaseClient(dsn="postgresql://localhost/db")
        with pytest.raises(RuntimeError, match="not connected"):
            _ = client.pool

    @pytest.mark.asyncio
    async def test_connect_creates_pool_and_initializes_schema(self) -> None:
        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock()
        mock_pool = _make_mock_pool(mock_conn)

        with patch("mycodexvantaos_ci_repair.database.asyncpg") as mock_asyncpg:
            mock_asyncpg.create_pool = AsyncMock(return_value=mock_pool)
            client = DatabaseClient(dsn="postgresql://localhost/db")
            await client.connect()

            mock_asyncpg.create_pool.assert_called_once()
            mock_conn.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_close_closes_pool(self) -> None:
        mock_pool = AsyncMock()
        mock_pool.close = AsyncMock()
        client = DatabaseClient(dsn="postgresql://localhost/db")
        client._pool = mock_pool

        await client.close()

        mock_pool.close.assert_called_once()
        assert client._pool is None

    @pytest.mark.asyncio
    async def test_save_analysis(self, sample_analysis: FailureAnalysis) -> None:
        mock_conn = AsyncMock()
        mock_conn.fetchval = AsyncMock(return_value=42)
        mock_pool = _make_mock_pool(mock_conn)

        client = DatabaseClient(dsn="postgresql://localhost/db")
        client._pool = mock_pool

        result = await client.save_analysis(sample_analysis)
        assert result == 42
        mock_conn.fetchval.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_repair_plan(self, sample_plan: RepairPlan) -> None:
        mock_conn = AsyncMock()
        mock_conn.fetchval = AsyncMock(return_value=7)
        mock_conn.execute = AsyncMock()
        mock_pool = _make_mock_pool(mock_conn)

        client = DatabaseClient(dsn="postgresql://localhost/db")
        client._pool = mock_pool

        result = await client.save_repair_plan(sample_plan)
        assert result == 7
        # Should execute once for each action
        assert mock_conn.execute.call_count == len(sample_plan.actions)

    @pytest.mark.asyncio
    async def test_get_analyses_for_run(self) -> None:
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(
            return_value=[
                {"id": 1, "run_id": 1001, "error_category": "dependency_error"},
                {"id": 2, "run_id": 1001, "error_category": "lint_error"},
            ]
        )
        mock_pool = _make_mock_pool(mock_conn)

        client = DatabaseClient(dsn="postgresql://localhost/db")
        client._pool = mock_pool

        result = await client.get_analyses_for_run(1001)
        assert len(result) == 2
        assert result[0]["error_category"] == "dependency_error"

    @pytest.mark.asyncio
    async def test_get_plans_for_run(self) -> None:
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(
            return_value=[
                {"id": 1, "run_id": 1001, "branch_name": "fix/ci-repair-1001"},
            ]
        )
        mock_pool = _make_mock_pool(mock_conn)

        client = DatabaseClient(dsn="postgresql://localhost/db")
        client._pool = mock_pool

        result = await client.get_plans_for_run(1001)
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_get_recent_analyses(self) -> None:
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[])
        mock_pool = _make_mock_pool(mock_conn)

        client = DatabaseClient(dsn="postgresql://localhost/db")
        client._pool = mock_pool

        result = await client.get_recent_analyses(limit=10)
        assert result == []

    @pytest.mark.asyncio
    async def test_get_error_category_counts(self) -> None:
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(
            return_value=[
                {"error_category": "dependency_error", "count": 15},
                {"error_category": "lint_error", "count": 8},
            ]
        )
        mock_pool = _make_mock_pool(mock_conn)

        client = DatabaseClient(dsn="postgresql://localhost/db")
        client._pool = mock_pool

        result = await client.get_error_category_counts(days=30)
        assert result == {"dependency_error": 15, "lint_error": 8}
