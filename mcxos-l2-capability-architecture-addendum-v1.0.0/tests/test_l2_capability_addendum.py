"""L2 Capability Addendum Tests"""
import pytest
import yaml
from pathlib import Path

def test_l2_spec_layer_is_2():
    spec_path = Path(__file__).parent.parent / "docs/spec/l2-structure/capability-architecture-addendum.yaml"
    with open(spec_path) as f:
        spec = yaml.safe_load(f)
    assert spec.get("layer") == 2

def test_l2_gate_system_defined():
    spec_path = Path(__file__).parent.parent / "docs/spec/l2-structure/capability-architecture-addendum.yaml"
    with open(spec_path) as f:
        spec = yaml.safe_load(f)
    assert "gate-system" in spec
    assert spec["gate-system"]["gate-count"] == 61
