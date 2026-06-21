import pytest
from mycodexvantaos_coder_deep.architecture_sync import ArchitectureSync


def test_architecture_sync_get_sync_status() -> None:
    sync = ArchitectureSync()
    try:
        sync.get_sync_status()
    except Exception as exc:
        pytest.fail(f"get_sync_status() raised unexpectedly: {exc}")
