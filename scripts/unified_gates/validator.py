"""Unified Gate System validator.

Rationale: the repository constitution requires gates to be machine-verifiable;
this module enforces identity, blocking, owner, lifecycle, path, and production
closure invariants through a single auditable validation boundary.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

import jsonschema
import yaml

from scripts.unified_gates.io import GateIoError, read_yaml, repo_path
from scripts.unified_gates.models import ValidationIssue, ValidationResult

GATE_ID_PATTERN = re.compile(r"^gate-[0-9]{2}-[a-z0-9]+(?:-[a-z0-9]+)*$")
OWNER_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
VALID_LIFECYCLES = {"proposed", "active", "deprecated", "archived", "destroyed"}
VALID_RISKS = {"low", "medium", "high", "critical"}
VALID_PLANES = {"quality-gate-plane", "ai-infra-gate-plane", "quality", "ai-infra"}

MINIMUM_BLOCKING_GATES = frozenset(
    {
        "gate-01-namespace-governance-validation",
        "gate-04-directory-binding-mediator-validation",
        "gate-05-dependency-graph-acyclic-validation",
        "gate-15-ai-compute-cluster-readiness",
        "gate-21-dataset-contract-validation",
        "gate-25-vector-database-schema-validation",
        "gate-32-model-contract-validation",
        "gate-34-inference-runtime-validation",
        "gate-41-ai-workload-contract-validation",
        "gate-47-workload-slo-validation",
        "gate-51-usage-event-contract-validation",
        "gate-56-cost-attribution-validation",
        "gate-62-kubernetes-baseline-validation",
        "gate-63-gitops-sync-validation",
        "gate-91-sbom-generation-validation",
        "gate-92-provenance-validation",
        "gate-93-signature-validation",
        "gate-99-production-closure-validation",
    }
)


def validate_unified_gate_index(root: Path, index_path: str) -> ValidationResult:
    issues: list[ValidationIssue] = []
    try:
        index = read_yaml(repo_path(root, index_path))
    except GateIoError as exc:
        return ValidationResult.fail_with(
            [
                ValidationIssue(
                    code="unified-gate-index-read-failed",
                    message=str(exc),
                    path=index_path,
                )
            ]
        )

    _validate_header(index, issues, index_path)
    gates = _extract_gates(index, issues, index_path)
    _validate_planes(index, issues, index_path)
    _validate_gates(root, gates, issues)
    _validate_duplicate_ids(gates, issues)
    _validate_minimum_blocking_set(gates, issues)

    metrics = {
        "gateCount": len(gates),
        "blockingGateCount": sum(1 for gate in gates if gate.get("blocking") is True),
        "minimumBlockingGateCount": len(MINIMUM_BLOCKING_GATES),
        "issueCount": len(issues),
    }
    if issues:
        return ValidationResult.fail_with(issues, metrics)
    return ValidationResult.pass_with(metrics)


def _validate_header(
    index: dict[str, Any],
    issues: list[ValidationIssue],
    path: str,
) -> None:
    if index.get("apiVersion") != "mycodexvantaos.io/v1":
        issues.append(
            ValidationIssue(
                code="invalid-api-version",
                message="apiVersion must equal mycodexvantaos.io/v1",
                path=path,
            )
        )
    if index.get("kind") != "UnifiedGateIndex":
        issues.append(
            ValidationIssue(
                code="invalid-kind",
                message="kind must equal UnifiedGateIndex",
                path=path,
            )
        )


def _validate_planes(
    index: dict[str, Any],
    issues: list[ValidationIssue],
    path: str,
) -> None:
    planes = index.get("spec", {}).get("planes", [])
    if not isinstance(planes, list):
        issues.append(
            ValidationIssue(
                code="invalid-planes",
                message="spec.planes must be an array",
                path=path,
            )
        )
        return
    plane_ids = {plane.get("id") for plane in planes if isinstance(plane, dict)}
    missing = VALID_PLANES - plane_ids
    for plane_id in sorted(missing):
        issues.append(
            ValidationIssue(
                code="missing-plane",
                message=f"required plane is absent: {plane_id}",
                path=path,
            )
        )


def _extract_gates(
    index: dict[str, Any],
    issues: list[ValidationIssue],
    path: str,
) -> list[dict[str, Any]]:
    gates = index.get("spec", {}).get("gates", [])
    if not isinstance(gates, list):
        issues.append(
            ValidationIssue(
                code="invalid-gates",
                message="spec.gates must be an array",
                path=path,
            )
        )
        return []
    typed_gates = [gate for gate in gates if isinstance(gate, dict)]
    if len(typed_gates) != len(gates):
        issues.append(
            ValidationIssue(
                code="invalid-gate-entry",
                message="every gate entry must be a mapping",
                path=path,
            )
        )
    return typed_gates


def _validate_gates(
    root: Path,
    gates: list[dict[str, Any]],
    issues: list[ValidationIssue],
) -> None:
    schema_path = root / "schemas/unified-gate-schema.json"
    schema = None
    if schema_path.exists():
        with open(schema_path) as f:
            schema = json.load(f)

    for index, gate in enumerate(gates):
        gate_path = f"spec.gates[{index}]"
        gate_id = gate.get("id")

        # 1. Basic format validation
        if not isinstance(gate_id, str) or not GATE_ID_PATTERN.match(gate_id):
            issues.append(
                ValidationIssue(
                    code="gate-id-malformed",
                    message="gate id must match gate-[0-9]{2}-{kebab-case}",
                    path=gate_path,
                )
            )
        if gate.get("plane") not in VALID_PLANES:
            issues.append(
                ValidationIssue(
                    code="gate-plane-invalid",
                    message="gate plane must be a declared unified plane",
                    path=gate_path,
                )
            )
        if gate.get("lifecycle") not in VALID_LIFECYCLES:
            issues.append(
                ValidationIssue(
                    code="gate-lifecycle-invalid",
                    message="gate lifecycle is not allowed",
                    path=gate_path,
                )
            )
        if gate.get("riskLevel") not in VALID_RISKS:
            issues.append(
                ValidationIssue(
                    code="gate-risk-invalid",
                    message="gate riskLevel is not allowed",
                    path=gate_path,
                )
            )

        # 2. File and path validation
        _validate_owner(gate, issues, gate_path)
        rel_path = _validate_path(root, gate, issues, gate_path)
        _validate_targets(gate, issues, gate_path)

        # 3. Deep Schema validation (from PR 160)
        if schema and rel_path:
            full_path = repo_path(root, rel_path)
            if full_path.exists():
                try:
                    with open(full_path) as f:
                        gate_content = yaml.safe_load(f)
                    jsonschema.validate(instance=gate_content, schema=schema)
                except jsonschema.ValidationError as e:
                    issues.append(
                        ValidationIssue(
                            code="gate-schema-validation-failed",
                            message=f"Schema error in {rel_path}: {e.message}",
                            path=gate_path,
                        )
                    )
                except Exception as e:
                    issues.append(
                        ValidationIssue(
                            code="gate-content-read-failed",
                            message=f"Could not read gate content {rel_path}: {str(e)}",
                            path=gate_path,
                        )
                    )


def _validate_owner(
    gate: dict[str, Any],
    issues: list[ValidationIssue],
    gate_path: str,
) -> None:
    owner = gate.get("owner")
    lifecycle = gate.get("lifecycle")
    if lifecycle == "active" and not owner:
        issues.append(
            ValidationIssue(
                code="active-gate-has-no-owner",
                message="active gate must declare owner",
                path=gate_path,
            )
        )
        return
    if not isinstance(owner, str) or not OWNER_PATTERN.match(owner):
        issues.append(
            ValidationIssue(
                code="gate-owner-invalid",
                message="owner must be lowercase kebab-case",
                path=gate_path,
            )
        )


def _validate_path(
    root: Path,
    gate: dict[str, Any],
    issues: list[ValidationIssue],
    gate_path: str,
) -> str | None:
    relative = gate.get("path")
    if not isinstance(relative, str) or not relative.startswith("unified-gates/"):
        issues.append(
            ValidationIssue(
                code="gate-path-invalid",
                message="gate path must start with unified-gates/",
                path=gate_path,
            )
        )
        return None
    candidate = repo_path(root, relative)
    config_mirror = repo_path(root, f"config/{relative}")
    if not candidate.exists() and not config_mirror.exists():
        issues.append(
            ValidationIssue(
                code="gate-file-path-missing",
                message=f"gate file path does not exist: {relative}",
                path=gate_path,
            )
        )
        return None
    return relative


def _validate_targets(
    gate: dict[str, Any],
    issues: list[ValidationIssue],
    gate_path: str,
) -> None:
    validates = gate.get("validates")
    if not isinstance(validates, list) or not validates:
        issues.append(
            ValidationIssue(
                code="gate-validation-targets-missing",
                message="gate must declare at least one validation target",
                path=gate_path,
            )
        )
        return
    for target in validates:
        if not isinstance(target, str) or not OWNER_PATTERN.match(target):
            issues.append(
                ValidationIssue(
                    code="gate-validation-target-invalid",
                    message="validation target must be lowercase kebab-case",
                    path=gate_path,
                )
            )


def _validate_duplicate_ids(
    gates: list[dict[str, Any]],
    issues: list[ValidationIssue],
) -> None:
    ids = [gate.get("id") for gate in gates if isinstance(gate.get("id"), str)]
    counts = Counter(ids)
    for gate_id, count in counts.items():
        if count > 1:
            issues.append(
                ValidationIssue(
                    code="duplicate-gate-id",
                    message=f"gate id appears {count} times: {gate_id}",
                    path="spec.gates",
                )
            )


def _validate_minimum_blocking_set(
    gates: list[dict[str, Any]],
    issues: list[ValidationIssue],
) -> None:
    # Build a set[str] of IDs for active, blocking gates (filter out non-str)
    blocking: set[str] = set()
    for gate in gates:
        if gate.get("blocking") is True and gate.get("lifecycle") == "active":
            gate_id = gate.get("id")
            if isinstance(gate_id, str):
                blocking.add(gate_id)

    missing = MINIMUM_BLOCKING_GATES - blocking
    for gate_id in sorted(missing):
        issues.append(
            ValidationIssue(
                code="blocking-gate-missing",
                message=f"mandatory production blocking gate is missing: {gate_id}",
                path="spec.gates",
            )
        )
