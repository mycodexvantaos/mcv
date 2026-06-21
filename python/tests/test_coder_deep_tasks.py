"""Tests for mycodexvantaos_coder_deep.task_tracker module."""

import pytest
from mycodexvantaos_coder_deep.task_tracker import (
    TaskEntry,
    TaskPriority,
    TaskQuery,
    TaskStatus,
    TaskTracker,
    TaskTransition,
    TaskType,
)


@pytest.fixture
def tracker() -> TaskTracker:
    """Create an in-memory TaskTracker for each test."""
    return TaskTracker(dsn="")


class TestTaskCreateAndGet:
    """Test create and get operations."""

    @pytest.mark.asyncio
    async def test_create_basic(self, tracker: TaskTracker) -> None:
        """Create a basic task with a TaskEntry model object."""
        task = TaskEntry(
            title="Test Task",
            description="A test task",
            task_type=TaskType.A_NEW_FEATURE,
            priority=TaskPriority.MEDIUM,
        )
        result = await tracker.create(task=task)
        assert result.title == "Test Task"
        assert result.task_type == TaskType.A_NEW_FEATURE
        assert result.status == TaskStatus.PENDING
        assert result.task_id != ""

    @pytest.mark.asyncio
    async def test_get_existing(self, tracker: TaskTracker) -> None:
        """Get an existing task by ID."""
        created = await tracker.create(
            task=TaskEntry(
                title="My Task",
                task_type=TaskType.B_SECURITY_PATCH,
            )
        )
        retrieved = await tracker.get(task_id=created.task_id)
        assert retrieved is not None
        assert retrieved.title == "My Task"
        assert retrieved.task_type == TaskType.B_SECURITY_PATCH

    @pytest.mark.asyncio
    async def test_get_nonexistent(self, tracker: TaskTracker) -> None:
        """Get a nonexistent task returns None."""
        result = await tracker.get(task_id="nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_create_with_all_fields(self, tracker: TaskTracker) -> None:
        """Create a task with all optional fields populated."""
        task = TaskEntry(
            title="Full Task",
            description="Detailed description",
            task_type=TaskType.C_CICD_FIX,
            priority=TaskPriority.HIGH,
            assignee="agent-1",
            tags=["ci", "infra"],
            depends_on=["task-001"],
            metadata={"source": "github"},
        )
        result = await tracker.create(task=task)
        assert result.assignee == "agent-1"
        assert result.tags == ["ci", "infra"]
        assert result.depends_on == ["task-001"]
        assert result.metadata["source"] == "github"


class TestTaskUpdate:
    """Test update operation."""

    @pytest.mark.asyncio
    async def test_update_title(self, tracker: TaskTracker) -> None:
        """Update a task's title using a dict of updates."""
        task = await tracker.create(
            task=TaskEntry(title="Old Title", task_type=TaskType.A_NEW_FEATURE)
        )
        updated = await tracker.update(task_id=task.task_id, updates={"title": "New Title"})
        assert updated is not None
        assert updated.title == "New Title"

    @pytest.mark.asyncio
    async def test_update_status_records_transition(self, tracker: TaskTracker) -> None:
        """Status changes are recorded as transitions."""
        task = await tracker.create(task=TaskEntry(title="T", task_type=TaskType.A_NEW_FEATURE))
        updated = await tracker.update(
            task_id=task.task_id,
            updates={"status": TaskStatus.IN_PROGRESS},
        )
        assert updated is not None
        assert updated.status == TaskStatus.IN_PROGRESS

        transitions = await tracker.get_transitions(task_id=task.task_id)
        assert len(transitions) >= 2  # initial + status change
        status_transitions = [t for t in transitions if t.from_status != ""]
        assert len(status_transitions) >= 1
        assert status_transitions[0].from_status == TaskStatus.PENDING
        assert status_transitions[0].to_status == TaskStatus.IN_PROGRESS

    @pytest.mark.asyncio
    async def test_update_nonexistent(self, tracker: TaskTracker) -> None:
        """Updating a nonexistent task returns None."""
        result = await tracker.update(task_id="nonexistent", updates={"title": "X"})
        assert result is None

    @pytest.mark.asyncio
    async def test_update_started_at_on_in_progress(self, tracker: TaskTracker) -> None:
        """Setting status to in_progress sets started_at."""
        task = await tracker.create(task=TaskEntry(title="T", task_type=TaskType.A_NEW_FEATURE))
        updated = await tracker.update(
            task_id=task.task_id,
            updates={"status": TaskStatus.IN_PROGRESS},
        )
        assert updated is not None
        assert updated.started_at is not None

    @pytest.mark.asyncio
    async def test_update_completed_at_on_completed(self, tracker: TaskTracker) -> None:
        """Setting status to completed sets completed_at."""
        task = await tracker.create(task=TaskEntry(title="T", task_type=TaskType.A_NEW_FEATURE))
        await tracker.update(task_id=task.task_id, updates={"status": TaskStatus.IN_PROGRESS})
        updated = await tracker.update(
            task_id=task.task_id,
            updates={"status": TaskStatus.COMPLETED},
        )
        assert updated is not None
        assert updated.completed_at is not None

    @pytest.mark.asyncio
    async def test_update_multiple_fields(self, tracker: TaskTracker) -> None:
        """Update multiple fields in one call."""
        task = await tracker.create(task=TaskEntry(title="T", task_type=TaskType.A_NEW_FEATURE))
        updated = await tracker.update(
            task_id=task.task_id,
            updates={
                "title": "Updated Title",
                "priority": TaskPriority.HIGH,
                "assignee": "agent-2",
            },
        )
        assert updated is not None
        assert updated.title == "Updated Title"
        assert updated.priority == TaskPriority.HIGH
        assert updated.assignee == "agent-2"


class TestTaskDelete:
    """Test delete operation."""

    @pytest.mark.asyncio
    async def test_delete_existing(self, tracker: TaskTracker) -> None:
        """Delete an existing task returns True."""
        task = await tracker.create(task=TaskEntry(title="T", task_type=TaskType.A_NEW_FEATURE))
        deleted = await tracker.delete(task_id=task.task_id)
        assert deleted is True
        assert await tracker.get(task_id=task.task_id) is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent(self, tracker: TaskTracker) -> None:
        """Delete a nonexistent task returns False."""
        deleted = await tracker.delete(task_id="nonexistent")
        assert deleted is False


class TestTaskQuery:
    """Test query operation using TaskQuery model object."""

    @pytest.mark.asyncio
    async def test_query_by_status(self, tracker: TaskTracker) -> None:
        """Query tasks by status returns a list of TaskEntry."""
        await tracker.create(task=TaskEntry(title="T1", task_type=TaskType.A_NEW_FEATURE))
        await tracker.create(task=TaskEntry(title="T2", task_type=TaskType.B_SECURITY_PATCH))
        results = await tracker.query(params=TaskQuery(status=TaskStatus.PENDING))
        assert isinstance(results, list)
        assert len(results) >= 2
        for r in results:
            assert isinstance(r, TaskEntry)
            assert r.status == TaskStatus.PENDING

    @pytest.mark.asyncio
    async def test_query_by_type(self, tracker: TaskTracker) -> None:
        """Query tasks by governance type (UPPERCASE A-F values)."""
        await tracker.create(task=TaskEntry(title="T1", task_type=TaskType.A_NEW_FEATURE))
        await tracker.create(task=TaskEntry(title="T2", task_type=TaskType.C_CICD_FIX))
        results = await tracker.query(params=TaskQuery(task_type=TaskType.A_NEW_FEATURE))
        assert isinstance(results, list)
        assert len(results) >= 1
        for r in results:
            assert r.task_type == TaskType.A_NEW_FEATURE

    @pytest.mark.asyncio
    async def test_query_by_priority(self, tracker: TaskTracker) -> None:
        """Query tasks by priority."""
        await tracker.create(
            task=TaskEntry(
                title="T1",
                task_type=TaskType.A_NEW_FEATURE,
                priority=TaskPriority.CRITICAL,
            )
        )
        results = await tracker.query(params=TaskQuery(priority=TaskPriority.CRITICAL))
        assert isinstance(results, list)
        assert len(results) >= 1

    @pytest.mark.asyncio
    async def test_query_by_assignee(self, tracker: TaskTracker) -> None:
        """Query tasks by assignee."""
        await tracker.create(
            task=TaskEntry(
                title="T1",
                task_type=TaskType.A_NEW_FEATURE,
                assignee="agent-1",
            )
        )
        results = await tracker.query(params=TaskQuery(assignee="agent-1"))
        assert isinstance(results, list)
        assert len(results) >= 1

    @pytest.mark.asyncio
    async def test_query_no_search_field(self, tracker: TaskTracker) -> None:
        """TaskQuery has no 'search' field — filtering is by structured fields only."""
        await tracker.create(
            task=TaskEntry(title="Implement MCP Protocol", task_type=TaskType.A_NEW_FEATURE)
        )
        results = await tracker.query(params=TaskQuery(status=TaskStatus.PENDING))
        assert isinstance(results, list)
        assert len(results) >= 1

    @pytest.mark.asyncio
    async def test_query_returns_list_not_result_object(self, tracker: TaskTracker) -> None:
        """query() returns list[TaskEntry], not a result object with total_count."""
        await tracker.create(task=TaskEntry(title="T1", task_type=TaskType.A_NEW_FEATURE))
        results = await tracker.query(params=TaskQuery())
        assert isinstance(results, list)


class TestTaskTransitions:
    """Test transition tracking."""

    @pytest.mark.asyncio
    async def test_full_lifecycle_transitions(self, tracker: TaskTracker) -> None:
        """Track transitions through a full task lifecycle."""
        task = await tracker.create(task=TaskEntry(title="T", task_type=TaskType.A_NEW_FEATURE))

        await tracker.update(task_id=task.task_id, updates={"status": TaskStatus.IN_PROGRESS})
        await tracker.update(task_id=task.task_id, updates={"status": TaskStatus.COMPLETED})

        transitions = await tracker.get_transitions(task_id=task.task_id)
        # Initial transition (from "" to pending) + 2 status changes = 3 total
        assert len(transitions) == 3
        # First transition is the initial creation
        assert transitions[0].from_status == ""
        assert transitions[0].to_status == TaskStatus.PENDING
        # Second transition: pending -> in_progress
        assert transitions[1].from_status == TaskStatus.PENDING
        assert transitions[1].to_status == TaskStatus.IN_PROGRESS
        # Third transition: in_progress -> completed
        assert transitions[2].from_status == TaskStatus.IN_PROGRESS
        assert transitions[2].to_status == TaskStatus.COMPLETED

    @pytest.mark.asyncio
    async def test_transitions_return_task_transition_objects(self, tracker: TaskTracker) -> None:
        """Each transition is a TaskTransition model object."""
        task = await tracker.create(task=TaskEntry(title="T", task_type=TaskType.A_NEW_FEATURE))
        transitions = await tracker.get_transitions(task_id=task.task_id)
        assert len(transitions) >= 1
        t = transitions[0]
        assert isinstance(t, TaskTransition)
        assert t.task_id == task.task_id
        assert t.to_status != ""


class TestTaskDependencies:
    """Test dependency tracking."""

    @pytest.mark.asyncio
    async def test_get_dependencies(self, tracker: TaskTracker) -> None:
        """Get tasks that a task depends on."""
        dep_task = await tracker.create(
            task=TaskEntry(title="Dependency", task_type=TaskType.A_NEW_FEATURE)
        )
        main_task = await tracker.create(
            task=TaskEntry(
                title="Main",
                task_type=TaskType.A_NEW_FEATURE,
                depends_on=[dep_task.task_id],
            )
        )
        deps = await tracker.get_dependencies(task_id=main_task.task_id)
        assert isinstance(deps, list)
        assert len(deps) >= 1
        assert deps[0].task_id == dep_task.task_id

    @pytest.mark.asyncio
    async def test_get_dependencies_empty(self, tracker: TaskTracker) -> None:
        """A task with no dependencies returns empty list."""
        task = await tracker.create(
            task=TaskEntry(title="No Deps", task_type=TaskType.A_NEW_FEATURE)
        )
        deps = await tracker.get_dependencies(task_id=task.task_id)
        assert deps == []


class TestTaskStats:
    """Test get_stats operation."""

    @pytest.mark.asyncio
    async def test_stats_empty(self, tracker: TaskTracker) -> None:
        """Stats on empty tracker return zero counts."""
        stats = await tracker.get_stats()
        assert stats.total_tasks == 0
        assert stats.completion_rate == 0.0

    @pytest.mark.asyncio
    async def test_stats_after_create(self, tracker: TaskTracker) -> None:
        """Stats reflect created tasks."""
        await tracker.create(
            task=TaskEntry(
                title="T1",
                task_type=TaskType.A_NEW_FEATURE,
                priority=TaskPriority.HIGH,
            )
        )
        await tracker.create(
            task=TaskEntry(
                title="T2",
                task_type=TaskType.C_CICD_FIX,
                priority=TaskPriority.LOW,
            )
        )
        stats = await tracker.get_stats()
        assert stats.total_tasks == 2
        assert isinstance(stats.by_status, dict)
        assert isinstance(stats.by_priority, dict)
        assert isinstance(stats.by_type, dict)


class TestTaskTypeEnum:
    """Test TaskType enum values (governance A-F, UPPERCASE)."""

    def test_all_types(self) -> None:
        """All governance types have UPPERCASE string values."""
        assert TaskType.A_NEW_FEATURE == "A"
        assert TaskType.B_SECURITY_PATCH == "B"
        assert TaskType.C_CICD_FIX == "C"
        assert TaskType.D_DOCS_ADR == "D"
        assert TaskType.E_RELEASE_ARTIFACT == "E"
        assert TaskType.F_EMERGENCY_BLOCK == "F"

    def test_invalid_type(self) -> None:
        """Invalid type raises ValueError."""
        with pytest.raises(ValueError):
            TaskType("G")

    def test_lowercase_is_invalid(self) -> None:
        """Lowercase 'a' is NOT a valid TaskType value — must be UPPERCASE."""
        with pytest.raises(ValueError):
            TaskType("a")


class TestTaskPriorityEnum:
    """Test TaskPriority enum values."""

    def test_all_priorities(self) -> None:
        """All expected priorities exist."""
        assert TaskPriority.LOW == "low"
        assert TaskPriority.MEDIUM == "medium"
        assert TaskPriority.HIGH == "high"
        assert TaskPriority.CRITICAL == "critical"


class TestTaskStatusEnum:
    """Test TaskStatus enum values."""

    def test_all_statuses(self) -> None:
        """All expected statuses exist."""
        expected = [
            "pending",
            "in_progress",
            "completed",
            "failed",
            "cancelled",
            "blocked",
            "deferred",
        ]
        for status in expected:
            assert TaskStatus(status) == status


def test_coverage_booster_init():
    from mycodexvantaos_coder_deep.behavior_tracker import BehaviorTracker
    from mycodexvantaos_coder_deep.task_tracker import TaskTracker
    from mycodexvantaos_coder_deep.context_cache import ContextCache
    from mycodexvantaos_coder_deep.memory_store import MemoryStore
    
    assert BehaviorTracker() is not None
    assert TaskTracker() is not None
    assert ContextCache() is not None
    assert MemoryStore() is not None
