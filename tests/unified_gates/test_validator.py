from pathlib import Path

import yaml
from scripts.unified_gates.validator import (MINIMUM_BLOCKING_GATES,
                                             validate_unified_gate_index)


def write_yaml(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(payload, handle)


def valid_index(tmp_path: Path) -> dict:
    gates = []
    for gate_id in MINIMUM_BLOCKING_GATES:
        path = f"unified-gates/ai-infra-gates/{gate_id}.yaml"
        # We also need to satisfy the schema if we are using it
        write_yaml(
            tmp_path / f"config/{path}",
            {
                "id": gate_id,
                "plane": "ai-infra-gate-plane",
                "lifecycle": "active",
                "blocking": True,
                "layer": "meta-governance",
                "owner": "platform@mycodexvantaos.com",
                "validates": [
                    {"dimension": "test", "description": "test", "checks": []}
                ],
            },
        )
        gates.append(
            {
                "id": gate_id,
                "plane": "ai-infra-gate-plane",
                "path": path,
                "lifecycle": "active",
                "blocking": True,
                "owner": "platform-ai-governance",
                "riskLevel": "high",
                "validates": ["contract"],
            }
        )
    return {
        "apiVersion": "mycodexvantaos.io/v1",
        "kind": "UnifiedGateIndex",
        "metadata": {
            "name": "unified-gate-index",
            "organization": "mycodexvantaos",
        },
        "spec": {
            "planes": [
                {
                    "id": "quality-gate-plane",
                    "path": "unified-gates/gate",
                    "purpose": "documentation-governance-coverage",
                },
                {
                    "id": "ai-infra-gate-plane",
                    "path": "unified-gates/ai-infra-gates",
                    "purpose": "executable-ai-native-infrastructure-gates",
                },
            ],
            "gates": gates,
        },
    }


def test_valid_index_passes(tmp_path: Path) -> None:
    index = valid_index(tmp_path)
    index_path = "config/unified-gates/unified-gate-index.yaml"
    write_yaml(tmp_path / index_path, index)

    # Ensure schema exists for deep validation
    schema_dir = tmp_path / "schemas"
    schema_dir.mkdir(parents=True, exist_ok=True)
    # Use a minimal schema for testing
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "required": ["id", "plane", "lifecycle", "blocking", "layer", "owner"],
        "properties": {
            "id": {"type": "string"},
            "plane": {"type": "string"},
            "lifecycle": {"type": "string"},
            "blocking": {"type": "boolean"},
            "layer": {"type": "string"},
            "owner": {"type": "string"},
        },
    }
    import json

    with open(schema_dir / "unified-gate-schema.json", "w") as f:
        json.dump(schema, f)

    result = validate_unified_gate_index(tmp_path, index_path)
    assert result.ok is True
    assert result.metrics["blockingGateCount"] == len(MINIMUM_BLOCKING_GATES)


def test_missing_blocking_gate_fails(tmp_path: Path) -> None:
    index = valid_index(tmp_path)
    index["spec"]["gates"] = index["spec"]["gates"][1:]
    index_path = "config/unified-gates/unified-gate-index.yaml"
    write_yaml(tmp_path / index_path, index)
    result = validate_unified_gate_index(tmp_path, index_path)
    assert result.ok is False
    assert "blocking-gate-missing" in {issue.code for issue in result.issues}


def test_malformed_gate_id_fails(tmp_path: Path) -> None:
    index = valid_index(tmp_path)
    index["spec"]["gates"][0]["id"] = "Gate_01_Invalid"
    index_path = "config/unified-gates/unified-gate-index.yaml"
    write_yaml(tmp_path / index_path, index)
    result = validate_unified_gate_index(tmp_path, index_path)
    assert result.ok is False
    assert "gate-id-malformed" in {issue.code for issue in result.issues}


def test_active_gate_without_owner_fails(tmp_path: Path) -> None:
    index = valid_index(tmp_path)
    index["spec"]["gates"][0]["owner"] = ""
    index_path = "config/unified-gates/unified-gate-index.yaml"
    write_yaml(tmp_path / index_path, index)
    result = validate_unified_gate_index(tmp_path, index_path)
    assert result.ok is False
    assert "active-gate-has-no-owner" in {issue.code for issue in result.issues}


def test_missing_gate_file_fails(tmp_path: Path) -> None:
    index = valid_index(tmp_path)
    missing_path = index["spec"]["gates"][0]["path"]
    (tmp_path / f"config/{missing_path}").unlink()
    index_path = "config/unified-gates/unified-gate-index.yaml"
    write_yaml(tmp_path / index_path, index)
    result = validate_unified_gate_index(tmp_path, index_path)
    assert result.ok is False
    assert "gate-file-path-missing" in {issue.code for issue in result.issues}
