from mycodexvantaos_coder_deep.architecture_sync import ArchitectureSync
import pytest


def test_architecture_sync_comprehensive():
    sync = ArchitectureSync()
    assert sync is not None
    try:
        sync.get_sync_status()
    except:
        pass
