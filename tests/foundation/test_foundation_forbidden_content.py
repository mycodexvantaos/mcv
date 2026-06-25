"""
MyCodexVantaOS Foundation Forbidden Content Tests
"""

import pytest
from pathlib import Path


FOUNDATION_ROOT = Path("foundation")


def test_no_typescript_source_in_foundation_subdirs():
    subdirs = [
        "compute-foundation", "data-foundation", "algorithm-foundation",
        "agent-foundation", "contract-foundation", "governance-foundation",
        "business-foundation"
    ]
    for subdir in subdirs:
        subdir_path = FOUNDATION_ROOT / subdir
        ts_files = list(subdir_path.rglob("*.ts"))
        assert len(ts_files) == 0, f"TypeScript source found in foundation/{subdir}: {ts_files}"
