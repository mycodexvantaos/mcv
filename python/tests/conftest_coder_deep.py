"""Shared test fixtures for Coder-Deep MCP tests."""

import pytest

from mycodexvantaos_coder_deep.architecture_sync import ArchitectureSync
from mycodexvantaos_coder_deep.behavior_tracker import BehaviorTracker
from mycodexvantaos_coder_deep.context_cache import ContextCache
from mycodexvantaos_coder_deep.memory_store import MemoryStore
from mycodexvantaos_coder_deep.pipeline_codex import PipelineCodex
from mycodexvantaos_coder_deep.task_tracker import TaskTracker


@pytest.fixture
def memory_store() -> MemoryStore:
    """Create an in-memory MemoryStore for testing (no database)."""
    return MemoryStore(dsn="")


@pytest.fixture
def context_cache() -> ContextCache:
    """Create a ContextCache for testing."""
    return ContextCache(max_entries=100, max_size_bytes=1048576)


@pytest.fixture
def behavior_tracker() -> BehaviorTracker:
    """Create an in-memory BehaviorTracker for testing."""
    return BehaviorTracker(dsn="")


@pytest.fixture
def architecture_sync(tmp_path) -> ArchitectureSync:
    """Create an ArchitectureSync for testing, pointed at a temp directory."""
    return ArchitectureSync(root_path=str(tmp_path))


@pytest.fixture
def pipeline_codex() -> PipelineCodex:
    """Create an in-memory PipelineCodex for testing."""
    return PipelineCodex(dsn="")


@pytest.fixture
def task_tracker() -> TaskTracker:
    """Create an in-memory TaskTracker for testing."""
    return TaskTracker(dsn="")
