#!/usr/bin/env python3
"""
MyCodexVantaOS Namespace Governance Validation Script

Validates namespace governance compliance.
Machine Identity: mycodexvantaos
"""

import sys
import yaml
from pathlib import Path

MACHINE_IDENTITY = "mycodexvantaos"
CANONICAL_URL = "https://mycodexvantaos.com"

violations = []
passed_checks = []


def check_file_exists(path: Path, description: str) -> bool:
    """Check if a required file exists."""
    if not path.exists():
        violations.append(f"[ERROR] Missing required file: {path} ({description})")
        return False
    passed_checks.append(f"EXISTS: {path}")
    return True


def validate_namespace_governance_module(root: Path) -> None:
    """Validate the namespace governance module."""
    ng_root = root / "mycodexvantaos-namespace-governance"

    if not ng_root.exists():
        violations.append(f"[CRITICAL] Namespace governance module missing: {ng_root}")
        return

    # Check required files
    required_files = [
        ("README.md", "Module documentation"),
        ("mycodexvantaos-module.yaml", "Module manifest"),
        ("contracts/namespace-contract.yaml", "Namespace contract"),
        ("contracts/identity-contract.yaml", "Identity contract"),
        ("governance/policies/naming-policy.yaml", "Naming policy"),
        ("governance/policies/identity-policy.yaml", "Identity policy"),
        ("governance/registry/namespace-registry.yaml", "Namespace registry"),
        ("schemas/namespace-registry.schema.json", "Registry schema"),
    ]

    for rel_path, description in required_files:
        check_file_exists(ng_root / rel_path, description)


def validate_governance_policies(root: Path) -> None:
    """Validate governance policy files."""
    policies_to_check = [
        root / "governance" / "identity-policy.yaml",
        root / "governance" / "platform-governance-spec.yaml",
        root / "governance" / "capability-set.yaml",
        root / "governance" / "hash-policy.yaml",
        root / "governance" / "runtime-mode-policy.yaml",
    ]

    for policy_path in policies_to_check:
        if not policy_path.exists():
            violations.append(f"[ERROR] Missing governance policy: {policy_path}")
            continue

        try:
            with open(policy_path) as f:
                policy = yaml.safe_load(f)

            if not policy.get("apiVersion"):
                violations.append(f"[WARNING] {policy_path}: Missing apiVersion")
            if not policy.get("kind"):
                violations.append(f"[WARNING] {policy_path}: Missing kind")
            if not policy.get("metadata", {}).get("version"):
                violations.append(f"[WARNING] {policy_path}: Missing metadata.version")

            passed_checks.append(f"VALID: {policy_path}")

        except Exception as e:
            violations.append(f"[ERROR] {policy_path}: Parse error: {e}")


def validate_naming_closure(root: Path) -> None:
    """Validate naming closure proofs."""
    closure_dir = root / "governance" / "naming-closure"

    if not closure_dir.exists():
        violations.append(f"[ERROR] Missing naming closure directory: {closure_dir}")
        return

    required_closure_files = [
        "l0-atomic-categories.yaml",
        "l1-specs/directory-name-spec.yaml",
        "l1-specs/service-id-spec.yaml",
        "l1-specs/provider-id-spec.yaml",
        "l2-meta/naming-closure-proof.yaml",
    ]

    for rel_path in required_closure_files:
        check_file_exists(closure_dir / rel_path, f"Naming closure: {rel_path}")


def main() -> int:
    root = Path(__file__).parent.parent

    print(f"MyCodexVantaOS Namespace Governance Validation")
    print(f"Machine Identity: {MACHINE_IDENTITY}")
    print()

    validate_namespace_governance_module(root)
    validate_governance_policies(root)
    validate_naming_closure(root)

    print(f"Passed checks: {len(passed_checks)}")

    if violations:
        print(f"\nViolations ({len(violations)}):")
        for v in violations:
            print(f"  {v}")

        error_count = sum(1 for v in violations if "[ERROR]" in v or "[CRITICAL]" in v)
        if error_count > 0:
            print(f"\nNamespace governance validation: FAILED ({error_count} errors)")
            return 1

    print(f"\nNamespace governance validation: PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
