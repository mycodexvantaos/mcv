#!/usr/bin/env python3
"""
MyCodexVantaOS Foundation Structure Validation Script
"""

import sys
from pathlib import Path

FOUNDATIONS = [
    "compute-foundation",
    "data-foundation",
    "algorithm-foundation",
    "agent-foundation",
    "contract-foundation",
    "governance-foundation",
    "business-foundation",
]

REQUIRED_FILES = [
    "foundation.yaml",
    "README.md",
    "boundary.yaml",
    "capability-map.yaml",
    "commercial-model.yaml",
    "maturity.yaml",
    "module-map.yaml",
    "owner-map.yaml",
    "package-map.yaml",
    "product-boundary.yaml",
    "reference-architecture.yaml",
    "roadmap.yaml",
    "service-map.yaml",
    "urn-map.yaml",
]

violations = []


def validate_foundation(foundation_path: Path) -> None:
    """Validate a single foundation directory."""
    for req_file in REQUIRED_FILES:
        file_path = foundation_path / req_file
        if not file_path.exists():
            violations.append(f"[ERROR] Missing: {file_path}")
        else:
            print(f"  ✓ {req_file}")


def main() -> int:
    root = Path(__file__).parent.parent
    foundation_root = root / "foundation"

    print("MyCodexVantaOS Foundation Structure Validation")
    print(f"Expected foundations: {len(FOUNDATIONS)}")
    print(f"Required files per foundation: {len(REQUIRED_FILES)}")
    print()

    if not foundation_root.exists():
        print(f"[CRITICAL] Foundation directory missing: {foundation_root}")
        return 1

    for foundation_name in FOUNDATIONS:
        foundation_path = foundation_root / foundation_name
        print(f"Validating: {foundation_name}")
        if not foundation_path.exists():
            violations.append(f"[CRITICAL] Foundation missing: {foundation_path}")
        else:
            validate_foundation(foundation_path)

    if violations:
        print(f"\nViolations ({len(violations)}):")
        for v in violations:
            print(f"  {v}")
        print(f"\nFoundation structure validation: FAILED")
        return 1

    print(f"\nFoundation structure validation: PASSED ({len(FOUNDATIONS)} foundations)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
