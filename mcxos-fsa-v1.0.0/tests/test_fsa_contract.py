"""FSA Contract Tests"""
import pytest
import yaml
from pathlib import Path

def test_fsa_spec_exists():
    spec_path = Path(__file__).parent.parent / "docs/spec/l0-meta/formalized-specification-architecture.yaml"
    assert spec_path.exists()

def test_fsa_spec_layer_is_0():
    spec_path = Path(__file__).parent.parent / "docs/spec/l0-meta/formalized-specification-architecture.yaml"
    with open(spec_path) as f:
        spec = yaml.safe_load(f)
    assert spec.get("layer") == 0

def test_fsa_spec_id_format():
    spec_path = Path(__file__).parent.parent / "docs/spec/l0-meta/formalized-specification-architecture.yaml"
    with open(spec_path) as f:
        spec = yaml.safe_load(f)
    spec_id = spec.get("spec-id", "")
    assert spec_id.startswith("mycodexvantaos-spec-l0-")
