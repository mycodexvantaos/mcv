"""
MyCodexVantaOS Foundation Structure Tests
"""

import pytest
from pathlib import Path


FOUNDATION_ROOT = Path("foundation")
REQUIRED_SUBDIRS = [
    "compute-foundation",
    "data-foundation",
    "algorithm-foundation",
    "agent-foundation",
    "contract-foundation",
    "governance-foundation",
    "business-foundation",
]


def test_foundation_directory_exists():
    assert FOUNDATION_ROOT.exists(), "foundation/ directory must exist"


def test_foundation_module_yaml_exists():
    module_yaml = FOUNDATION_ROOT / "mycodexvantaos-module.yaml"
    assert module_yaml.exists(), "foundation/mycodexvantaos-module.yaml must exist"


def test_seven_foundation_subdirectories_exist():
    for subdir in REQUIRED_SUBDIRS:
        path = FOUNDATION_ROOT / subdir
        assert path.exists(), f"foundation/{subdir}/ must exist"


def test_foundation_subdirs_have_foundation_yaml():
    for subdir in REQUIRED_SUBDIRS:
        foundation_yaml = FOUNDATION_ROOT / subdir / "foundation.yaml"
        assert foundation_yaml.exists(), f"foundation/{subdir}/foundation.yaml must exist"


def test_foundation_subdirs_have_no_module_yaml():
    for subdir in REQUIRED_SUBDIRS:
        module_yaml = FOUNDATION_ROOT / subdir / "mycodexvantaos-module.yaml"
        assert not module_yaml.exists(), (
            f"foundation/{subdir}/mycodexvantaos-module.yaml MUST NOT exist"
        )
