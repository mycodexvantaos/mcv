#!/usr/bin/env python3
"""
MyCodexVantaOS Naming Validation Script

Validates that all identifiers comply with the L1 Constitution naming policy.
Machine Identity: mycodexvantaos
Canonical URL: https://mycodexvantaos.com
"""

import os
import re
import sys
import yaml
from pathlib import Path

MACHINE_IDENTITY = "mycodexvantaos"
CANONICAL_URL = "https://mycodexvantaos.com"

FORBIDDEN_PREFIXES = [
    "mycodexvanta-os",
    "codexvanta-os",
    "codexvanta",
    "codevantaos",
    "kubo",
    "axiom",
]

MACHINE_ID_PATTERN = re.compile(r"^mycodexvantaos-[a-z0-9]+(?:-[a-z0-9]+)*$")
SERVICE_ID_PATTERN = re.compile(r"^mycodexvantaos-[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]+(?:-[a-z0-9]+)*$")
PROVIDER_ID_PATTERN = re.compile(r"^mycodexvantaos-[a-z0-9]+-[a-z0-9]+(?:-[a-z0-9]+)*$")
KEBAB_CASE_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SPEC_ID_PATTERN = re.compile(r"^mycodexvantaos-spec-l[0-5]-[a-z0-9]+(?:-[a-z0-9]+)*-v\d+\.\d+\.\d+$")

violations = []
warnings = []


def check_forbidden_prefixes(identifier: str, context: str) -> None:
    """Check if an identifier uses a forbidden prefix."""
    for prefix in FORBIDDEN_PREFIXES:
        if identifier.lower().startswith(prefix):
            violations.append(f"[CRITICAL] {context}: '{identifier}' uses forbidden prefix '{prefix}'")
            return


def validate_provider_manifest(manifest_path: Path) -> None:
    """Validate a provider manifest file."""
    try:
        with open(manifest_path) as f:
            manifest = yaml.safe_load(f)

        provider_id = manifest.get("provider-id", "")
        if not provider_id:
            violations.append(f"[ERROR] {manifest_path}: Missing provider-id")
            return

        check_forbidden_prefixes(provider_id, str(manifest_path))

        if not PROVIDER_ID_PATTERN.match(provider_id):
            violations.append(
                f"[ERROR] {manifest_path}: provider-id '{provider_id}' "
                f"does not match pattern {PROVIDER_ID_PATTERN.pattern}"
            )

    except Exception as e:
        violations.append(f"[ERROR] {manifest_path}: Failed to parse: {e}")


def validate_module_manifest(manifest_path: Path) -> None:
    """Validate a module manifest file."""
    try:
        with open(manifest_path) as f:
            manifest = yaml.safe_load(f)

        service_id = manifest.get("service-id", "")
        if not service_id:
            violations.append(f"[ERROR] {manifest_path}: Missing service-id")
            return

        check_forbidden_prefixes(service_id, str(manifest_path))

        if not SERVICE_ID_PATTERN.match(service_id):
            violations.append(
                f"[ERROR] {manifest_path}: service-id '{service_id}' "
                f"does not match pattern {SERVICE_ID_PATTERN.pattern}"
            )

    except Exception as e:
        violations.append(f"[ERROR] {manifest_path}: Failed to parse: {e}")


def validate_directory_names(root: Path) -> None:
    """Validate that directory names follow kebab-case convention."""
    skip_dirs = {".git", "node_modules", "dist", "build", ".next", "outputs", "__pycache__"}

    for dirpath, dirnames, _ in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]
        for dirname in dirnames:
            if dirname.startswith("."):
                continue
            if not KEBAB_CASE_PATTERN.match(dirname):
                warnings.append(
                    f"[WARNING] Directory name '{dirname}' in '{dirpath}' "
                    f"does not follow kebab-case convention"
                )


def validate_identity_policy(root: Path) -> None:
    """Validate the identity policy file."""
    policy_path = root / "governance" / "identity-policy.yaml"
    if not policy_path.exists():
        violations.append(f"[CRITICAL] Missing identity policy: {policy_path}")
        return

    try:
        with open(policy_path) as f:
            policy = yaml.safe_load(f)

        machine_id = policy.get("identity", {}).get("machine", "")
        if machine_id != MACHINE_IDENTITY:
            violations.append(
                f"[CRITICAL] Identity policy: machine identity '{machine_id}' "
                f"must be '{MACHINE_IDENTITY}'"
            )
        else:
            print(f"✓ Machine identity: {machine_id}")

        canonical_url = policy.get("deployment", {}).get("canonical-url", "")
        if canonical_url != CANONICAL_URL:
            violations.append(
                f"[CRITICAL] Identity policy: canonical-url '{canonical_url}' "
                f"must be '{CANONICAL_URL}'"
            )
        else:
            print(f"✓ Canonical URL: {canonical_url}")

    except Exception as e:
        violations.append(f"[ERROR] Identity policy parse error: {e}")


def main() -> int:
    root = Path(__file__).parent.parent

    print(f"MyCodexVantaOS Naming Validation")
    print(f"Machine Identity: {MACHINE_IDENTITY}")
    print(f"Canonical URL: {CANONICAL_URL}")
    print(f"Root: {root}")
    print()

    # Validate identity policy
    validate_identity_policy(root)

    # Validate provider manifests
    for manifest_path in root.glob("providers/**/provider-manifest.yaml"):
        validate_provider_manifest(manifest_path)

    # Validate module manifests
    for manifest_path in root.glob("modules/**/module-manifest.yaml"):
        validate_module_manifest(manifest_path)

    # Validate directory names
    validate_directory_names(root)

    # Report results
    print()
    if warnings:
        print(f"Warnings ({len(warnings)}):")
        for w in warnings:
            print(f"  {w}")

    if violations:
        print(f"\nViolations ({len(violations)}):")
        for v in violations:
            print(f"  {v}")
        print(f"\nNaming validation: FAILED ({len(violations)} violations)")
        return 1

    print(f"Naming validation: PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
