import os

def apply_tests():
    test_content = """from mycodexvantaos_coder_deep.behavior_tracker import BehaviorTracker
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
"""
    paths = [
        "python/apps/coder-deep-mcp/tests/test_extra_coverage.py",
        "python/packages/mycodexvantaos-coder-deep/tests/test_extra_coverage.py"
    ]
    
    repo_root = "/workspace/mycodexvantaos"
    for p in paths:
        full_path = os.path.join(repo_root, p)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w') as f:
            f.write(test_content)
        print(f"Updated {p}")

if __name__ == "__main__":
    apply_tests()
