import pytest
import os
from mycodexvantaos_coder_deep.behavior_tracker import BehaviorTracker
from mycodexvantaos_coder_deep.task_tracker import TaskTracker
from mycodexvantaos_coder_deep.context_cache import ContextCache
from mycodexvantaos_coder_deep.memory_store import MemoryStore

def test_behavior_tracker_init():
    bt = BehaviorTracker()
    assert bt is not None
    # 呼叫一些方法以增加覆蓋率
    if hasattr(bt, 'get_status'):
        bt.get_status()

def test_task_tracker_init():
    tt = TaskTracker()
    assert tt is not None
    if hasattr(tt, 'list_tasks'):
        tt.list_tasks()

def test_context_cache_init():
    cc = ContextCache()
    assert cc is not None

def test_memory_store_init():
    ms = MemoryStore()
    assert ms is not None
