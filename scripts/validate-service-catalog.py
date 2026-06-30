#!/usr/bin/env python3
"""
MyCodexVantaOS Service Catalog Validation Script
"""

import sys
import yaml
import re
from pathlib import Path

SERVICE_ID_PATTERN = re.compile(
    r"^mycodexvantaos-[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]+(?:-[a-z0-9]+)*$"
)

violations = []

REQUIRED_MODULES = [
    "mycodexvantaos-agent-runtime",
    "mycodexvantaos-ai-embedding",
    "mycodexvantaos-ai-inference",
    "mycodexvantaos-billing-metering",
    "mycodexvantaos-core-auth",
    "mycodexvantaos-governance-audit-chain",
    "mycodexvantaos-governance-policy-engine",
    "mycodexvantaos-knowledge-ingestion",
    "mycodexvantaos-knowledge-search",
    "mycodexvantaos-quantum-controller",
    "mycodexvantaos-runtime-mode-resolver",
]


def validate_module_manifests(root: Path) -> None:
    """Validate all module manifests."""
    modules_dir = root / "modules"
    if not modules_dir.exists():
        violations.append(f"[ERROR] Missing modules directory: {modules_dir}")
        return

    found_modules = set()
    for manifest_path in modules_dir.glob("*/module-manifest.yaml"):
        try:
            with open(manifest_path) as f:
                manifest = yaml.safe_load(f)

            service_id = manifest.get("service-id", "")
            found_modules.add(service_id)

            if not SERVICE_ID_PATTERN.match(service_id):
                violations.append(
                    f"[ERROR] {manifest_path}: Invalid service-id '{service_id}'"
                )
            else:
                print(f"✓ Module: {service_id}")

        except Exception as e:
            violations.append(f"[ERROR] {manifest_path}: {e}")

    # Check all required modules are present
    for required in REQUIRED_MODULES:
        if required not in found_modules:
            violations.append(f"[ERROR] Required module missing: {required}")


def validate_service_catalog(root: Path) -> None:
    """Validate the service catalog file."""
    catalog_path = root / "platform" / "service-catalog.yaml"
    if not catalog_path.exists():
        violations.append(f"[ERROR] Missing service catalog: {catalog_path}")
        return

    try:
        with open(catalog_path) as f:
            yaml.safe_load(f)
        print(f"✓ Service catalog: {catalog_path}")
    except Exception as e:
        violations.append(f"[ERROR] Service catalog parse error: {e}")


def main() -> int:
    root = Path(__file__).parent.parent
    print("MyCodexVantaOS Service Catalog Validation")
    print()

    validate_service_catalog(root)
    validate_module_manifests(root)

    if violations:
        print(f"\nViolations ({len(violations)}):")
        for v in violations:
            print(f"  {v}")
        print(f"\nService catalog validation: FAILED")
        return 1

    print(f"\nService catalog validation: PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
