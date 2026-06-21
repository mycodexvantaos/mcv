"""Tests for mycodexvantaos_coder_deep.behavior_tracker module."""

import pytest
from mycodexvantaos_coder_deep.behavior_tracker import (
    ActionCategory,
    ActionOutcome,
    BehaviorAction,
    BehaviorQuery,
    BehaviorTracker,
)


@pytest.fixture
def tracker() -> BehaviorTracker:
    """Create an in-memory BehaviorTracker for each test."""
    return BehaviorTracker(dsn="")


class TestBehaviorRecord:
    """Test record operation."""

    @pytest.mark.asyncio
    async def test_record_basic(self, tracker: BehaviorTracker) -> None:
        """Record a basic behavior action."""
        action = BehaviorAction(
            session_id="sess-1",
            agent_id="agent-1",
            action_name="file_write",
            action_category=ActionCategory.CODE_MODIFICATION,
            outcome=ActionOutcome.SUCCESS,
        )
        result = await tracker.record(action=action)
        assert result.session_id == "sess-1"
        assert result.agent_id == "agent-1"
        assert result.action_name == "file_write"
        assert result.action_category == ActionCategory.CODE_MODIFICATION
        assert result.outcome == ActionOutcome.SUCCESS
        assert result.action_id != ""

    @pytest.mark.asyncio
    async def test_record_with_details(self, tracker: BehaviorTracker) -> None:
        """Record with input/output summaries and duration."""
        action = BehaviorAction(
            session_id="sess-1",
            agent_id="agent-1",
            action_name="test_run",
            action_category=ActionCategory.TESTING,
            input_data={"summary": "Running pytest"},
            output_data={"summary": "5 passed, 1 failed"},
            outcome=ActionOutcome.PARTIAL,
            duration_ms=5000,
        )
        result = await tracker.record(action=action)
        assert result.input_data["summary"] == "Running pytest"
        assert result.output_data["summary"] == "5 passed, 1 failed"
        assert result.outcome == ActionOutcome.PARTIAL
        assert result.duration_ms == 5000

    @pytest.mark.asyncio
    async def test_record_multiple_actions(self, tracker: BehaviorTracker) -> None:
        """Record multiple actions in a session."""
        for i in range(5):
            action = BehaviorAction(
                session_id="sess-1",
                agent_id="agent-1",
                action_name=f"action-{i}",
                action_category=ActionCategory.FILE_OPERATION,
                outcome=ActionOutcome.SUCCESS,
            )
            await tracker.record(action=action)
        # All should be recorded; verify via query
        results = await tracker.query(params=BehaviorQuery(session_id="sess-1"))
        assert len(results) == 5


class TestBehaviorQuery:
    """Test query operation."""

    @pytest.mark.asyncio
    async def test_query_by_session(self, tracker: BehaviorTracker) -> None:
        """Query actions by session ID."""
        await tracker.record(
            action=BehaviorAction(
                session_id="sess-1",
                agent_id="agent-1",
                action_name="a1",
                action_category=ActionCategory.FILE_OPERATION,
            )
        )
        await tracker.record(
            action=BehaviorAction(
                session_id="sess-2",
                agent_id="agent-2",
                action_name="a2",
                action_category=ActionCategory.CODE_MODIFICATION,
            )
        )
        result = await tracker.query(params=BehaviorQuery(session_id="sess-1"))
        assert len(result) >= 1

    @pytest.mark.asyncio
    async def test_query_by_agent(self, tracker: BehaviorTracker) -> None:
        """Query actions by agent ID."""
        await tracker.record(
            action=BehaviorAction(
                session_id="sess-1",
                agent_id="agent-1",
                action_name="a1",
                action_category=ActionCategory.FILE_OPERATION,
            )
        )
        result = await tracker.query(params=BehaviorQuery(agent_id="agent-1"))
        assert len(result) >= 1

    @pytest.mark.asyncio
    async def test_query_by_category(self, tracker: BehaviorTracker) -> None:
        """Query actions by category."""
        await tracker.record(
            action=BehaviorAction(
                session_id="sess-1",
                agent_id="agent-1",
                action_name="a1",
                action_category=ActionCategory.CODE_MODIFICATION,
            )
        )
        result = await tracker.query(
            params=BehaviorQuery(action_category=ActionCategory.CODE_MODIFICATION)
        )
        assert len(result) >= 1

    @pytest.mark.asyncio
    async def test_query_by_outcome(self, tracker: BehaviorTracker) -> None:
        """Query actions by outcome."""
        await tracker.record(
            action=BehaviorAction(
                session_id="sess-1",
                agent_id="agent-1",
                action_name="a1",
                action_category=ActionCategory.FILE_OPERATION,
                outcome=ActionOutcome.FAILURE,
            )
        )
        result = await tracker.query(
            params=BehaviorQuery(outcome=ActionOutcome.FAILURE)
        )
        assert len(result) >= 1


class TestBehaviorStats:
    """Test get_stats operation."""

    @pytest.mark.asyncio
    async def test_stats_empty(self, tracker: BehaviorTracker) -> None:
        """Stats on empty tracker return zero counts."""
        stats = await tracker.get_stats()
        assert stats.total_actions == 0

    @pytest.mark.asyncio
    async def test_stats_after_record(self, tracker: BehaviorTracker) -> None:
        """Stats reflect recorded actions."""
        await tracker.record(
            action=BehaviorAction(
                session_id="sess-1",
                agent_id="agent-1",
                action_name="a1",
                action_category=ActionCategory.FILE_OPERATION,
                outcome=ActionOutcome.SUCCESS,
            )
        )
        await tracker.record(
            action=BehaviorAction(
                session_id="sess-1",
                agent_id="agent-1",
                action_name="a2",
                action_category=ActionCategory.CODE_MODIFICATION,
                outcome=ActionOutcome.FAILURE,
            )
        )
        stats = await tracker.get_stats()
        assert stats.total_actions == 2


class TestBehaviorSessions:
    """Test session management."""

    @pytest.mark.asyncio
    async def test_list_sessions(self, tracker: BehaviorTracker) -> None:
        """List sessions after recording actions."""
        await tracker.record(
            action=BehaviorAction(
                session_id="sess-1",
                agent_id="agent-1",
                action_name="a1",
                action_category=ActionCategory.FILE_OPERATION,
            )
        )
        sessions = await tracker.list_sessions()
        assert len(sessions) >= 1

    @pytest.mark.asyncio
    async def test_end_session(self, tracker: BehaviorTracker) -> None:
        """End a session."""
        await tracker.record(
            action=BehaviorAction(
                session_id="sess-1",
                agent_id="agent-1",
                action_name="a1",
                action_category=ActionCategory.FILE_OPERATION,
            )
        )
        result = await tracker.end_session(session_id="sess-1")
        assert result is True


class TestActionCategoryEnum:
    """Test ActionCategory enum values."""

    def test_all_categories(self) -> None:
        """All expected categories exist."""
        expected = [
            "code_generation",
            "code_modification",
            "code_review",
            "debugging",
            "testing",
            "deployment",
            "analysis",
            "planning",
            "communication",
            "file_operation",
            "search",
            "integration",
            "mcp_operation",
            "memory_operation",
            "other",
        ]
        for cat in expected:
            assert ActionCategory(cat) == cat

    def test_invalid_category(self) -> None:
        """Invalid category raises ValueError."""
        with pytest.raises(ValueError):
            ActionCategory("invalid_category")


class TestActionOutcomeEnum:
    """Test ActionOutcome enum values."""

    def test_all_outcomes(self) -> None:
        """All expected outcomes exist."""
        expected = ["success", "failure", "partial", "skipped", "rolled_back"]
        for outcome in expected:
            assert ActionOutcome(outcome) == outcome

    def test_invalid_outcome(self) -> None:
        """Invalid outcome raises ValueError."""
        with pytest.raises(ValueError):
            ActionOutcome("invalid_outcome")
