from mycodexvantaos_coder_deep.behavior_tracker import BehaviorTracker
from mycodexvantaos_coder_deep.context_cache import ContextCache
from mycodexvantaos_coder_deep.memory_store import MemoryStore
from mycodexvantaos_coder_deep.task_tracker import TaskTracker


def test_behavior_tracker_init():
    tracker = BehaviorTracker()
    assert tracker is not None


def test_task_tracker_init():
    tracker = TaskTracker()
    assert tracker is not None


def test_context_cache_init():
    cache = ContextCache()
    assert cache is not None


def test_memory_store_init():
    store = MemoryStore()
    assert store is not None
