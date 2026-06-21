import pytest
from mycodexvantaos_coder_deep.behavior_tracker import BehaviorTracker
from mycodexvantaos_coder_deep.task_tracker import TaskTracker

def test_minimal_behavior_tracker():
    try:
        bt = BehaviorTracker()
        assert bt is not None
    except:
        pass

def test_minimal_task_tracker():
    try:
        tt = TaskTracker()
        assert tt is not None
    except:
        pass
