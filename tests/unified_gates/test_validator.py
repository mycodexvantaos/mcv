import pytest
from pathlib import Path
import yaml
import json
from scripts.unified_gates.validator import UnifiedGateValidator

@pytest.fixture
def root_dir(tmp_path):
    return tmp_path

@pytest.fixture
def schema_path(root_dir):
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "required": ["id", "plane"],
        "properties": {
            "id": {"type": "string"},
            "plane": {"type": "string", "enum": ["quality", "ai-infra"]}
        }
    }
    p = root_dir / "schema.json"
    p.write_text(json.dumps(schema))
    return p

def test_validate_gate_file_success(root_dir, schema_path):
    gate_data = {"id": "gate-1", "plane": "ai-infra"}
    gate_file = root_dir / "gate.yaml"
    gate_file.write_text(yaml.dump(gate_data))
    
    validator = UnifiedGateValidator(root_dir, schema_path)
    assert validator.validate_gate_file(gate_file) is True
    assert len(validator.issues) == 0

def test_validate_gate_file_fail(root_dir, schema_path):
    gate_data = {"id": "gate-1", "plane": "invalid-plane"}
    gate_file = root_dir / "gate.yaml"
    gate_file.write_text(yaml.dump(gate_data))
    
    validator = UnifiedGateValidator(root_dir, schema_path)
    assert validator.validate_gate_file(gate_file) is False
    assert len(validator.issues) > 0
    assert "Schema validation failed" in validator.issues[0].message
