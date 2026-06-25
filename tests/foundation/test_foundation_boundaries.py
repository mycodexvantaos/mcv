"""
MyCodexVantaOS Foundation Boundary Tests
"""

import pytest
from pathlib import Path


FOUNDATION_ROOT = Path("foundation")
PROHIBITED_FILES = ["Dockerfile", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"]


def test_no_prohibited_files_in_foundation():
    for prohibited in PROHIBITED_FILES:
        for path in FOUNDATION_ROOT.rglob(prohibited):
            pytest.fail(f"Prohibited file found: {path}")
