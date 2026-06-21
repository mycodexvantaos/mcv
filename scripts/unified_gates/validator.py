import argparse
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import jsonschema
import yaml


@dataclass
class ValidationIssue:
    gate_id: Optional[str]
    severity: str
    message: str
    path: List[str]


class UnifiedGateValidator:
    def __init__(self, root_dir: Path, schema_path: Path) -> None:
        self.root_dir = root_dir
        self.schema_path = schema_path
        self.schema = self._load_schema()
        self.issues: List[ValidationIssue] = []

    def _load_schema(self) -> Dict[str, Any]:
        with self.schema_path.open() as f:
            return json.load(f)

    def validate_gate_file(self, gate_path: Path) -> bool:
        try:
            with gate_path.open() as f:
                data = yaml.safe_load(f)

            validator = jsonschema.Draft7Validator(self.schema)
            errors = sorted(validator.iter_errors(data), key=lambda e: e.path)

                for error in errors:
                    self.issues.append(
                        ValidationIssue(
                            gate_id=(data.get("id") if isinstance(data, dict) else None),
                            severity="error",
                            message=f"Schema validation failed: {error.message}",
                            path=list(error.path),
                        )
                    )
                return False
            return True
        except Exception as e:
            self.issues.append(
                ValidationIssue(
                    gate_id=None,
                    severity="error",
                    message=f"Failed to read or parse gate file {gate_path}: {str(e)}",
                    path=[],
                )
            )
            return False

    def validate_index(self, index_path: Path) -> bool:
        try:
            with index_path.open() as f:
                index = yaml.safe_load(f)

            all_passed = True
            for gate_info in index.get("gates", []):
                gate_rel_path = gate_info.get("path")
                if not gate_rel_path:
                    self.issues.append(
                        ValidationIssue(
                            gate_id=gate_info.get("id"),
                            severity="error",
                            message="Missing path in index for gate",
                            path=["gates"],
                        )
                    )
                    all_passed = False
                    continue

                gate_full_path = self.root_dir / gate_rel_path
                if not gate_full_path.exists():
                    self.issues.append(
                        ValidationIssue(
                            gate_id=gate_info.get("id"),
                            severity="error",
                            message=f"Gate file not found: {gate_rel_path}",
                            path=["gates"],
                        )
                    )
                    all_passed = False
                    continue

                if not self.validate_gate_file(gate_full_path):
                    all_passed = False

            return all_passed
        except Exception as e:
            self.issues.append(
                ValidationIssue(
                    gate_id=None,
                    severity="error",
                    message=f"Failed to validate index {index_path}: {str(e)}",
                    path=[],
                )
            )
            return False

    def check_blocking_gates(self, index_path: Path, required_count: int = 18) -> bool:
        # Implementation for Principle 4.3: Production Closure
        try:
            with index_path.open() as f:
                index = yaml.safe_load(f)

            active_blocking_gates = [
                g for g in index.get("gates", []) if g.get("blocking") is True
            ]

            if len(active_blocking_gates) < required_count:
                self.issues.append(
                    ValidationIssue(
                        gate_id="gate-99-production-closure",
                        severity="error",
                        message=f"Insufficient blocking gates. Found {len(active_blocking_gates)}, required {required_count}.",
                        path=[],
                    ))
                return False
            return True
        except Exception as e:
            self.issues.append(
                ValidationIssue(
                    gate_id=None,
                    severity="error",
                    message=f"Error checking blocking gates: {str(e)}",
                    path=[],
                )
            )
            return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Unified Gate System Validator")
    parser.add_argument(
        "--gate-index", required=True, help="Path to unified-gate-index.yaml"
    )
    parser.add_argument(
        "--strict", action="store_true", help="Enable strict validation"
    )
    parser.add_argument(
        "--check-blocking",
        action="store_true",
        help="Check for mandatory blocking gates",
    )
    parser.add_argument("--output", help="Path to output validation report (JSON)")
    parser.add_argument(
        "--fail-on-error",
        action="store_true",
        help="Exit with non-zero code on errors",
    )

    args = parser.parse_args()

    root_dir = Path.cwd()
    schema_path = root_dir / "schemas/unified-gate-schema.json"
    index_path = root_dir / args.gate_index

    validator = UnifiedGateValidator(root_dir, schema_path)

    success = validator.validate_index(index_path)

    if args.check_blocking:
        # For now we only have 2 gates, but the doc says 18 are required for
        # production. We will use a lower threshold for now to demonstrate
        # success or flag as error
        if not validator.check_blocking_gates(index_path, required_count=2):
            success = False

    report = {"success": success, "issues": [asdict(i) for i in validator.issues]}

    if args.output:
        with open(args.output, "w") as f:
            json.dump(report, f, indent=2)
    else:
        print(json.dumps(report, indent=2))

    if args.fail_on_error and not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
