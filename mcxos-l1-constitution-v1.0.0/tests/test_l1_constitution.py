"""L1 Constitution Tests"""
import pytest
import yaml
from pathlib import Path

def test_l1_spec_layer_is_1():
    spec_path = Path(__file__).parent.parent / "docs/spec/l1-constitution/constitution.yaml"
    with open(spec_path) as f:
        spec = yaml.safe_load(f)
    assert spec.get("layer") == 1

def test_l1_machine_identity():
    spec_path = Path(__file__).parent.parent / "docs/spec/l1-constitution/constitution.yaml"
    with open(spec_path) as f:
        spec = yaml.safe_load(f)
    assert spec.get("identity", {}).get("machine") == "mycodexvantaos"

def test_l1_capability_set_count():
    spec_path = Path(__file__).parent.parent / "docs/spec/l1-constitution/constitution.yaml"
    with open(spec_path) as f:
        spec = yaml.safe_load(f)
    capabilities = spec.get("capability-set", {}).get("capabilities", [])
    assert len(capabilities) == 24
