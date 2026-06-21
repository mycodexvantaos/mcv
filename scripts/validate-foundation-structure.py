#!/usr/bin/env python3
"""
MyCodexVantaOS Foundation Structure Validator
Validates the foundation/ directory structure per the Unified Architecture Constitution.
"""

import argparse
import json
import sys
from pathlib import Path

REQUIRED_FOUNDATION_SUBDIRS = [
    "compute-foundation",
    "data-foundation",
    "algorithm-foundation",
    "agent-foundation",
    "contract-foundation",
    "governance-foundation",
    "business-foundation",
]

REQUIRED_FOUNDATION_FILES = [
    "foundation.yaml",
    "README.md",
    "capability-map.yaml",
    "module-map.yaml",
    "service-map.yaml",
    "package-map.yaml",
    "urn-map.yaml",
    "owner-map.yaml",
    "boundary.yaml",
    "roadmap.yaml",
    "maturity.yaml",
    "product-boundary.yaml",
    "reference-architecture.yaml",
    "commercial-model.yaml",
]

PROHIBITED_FOUNDATION_FILES = [
    "Dockerfile",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
]


def validate_foundation_structure(root: str) -> dict:
    """Validate foundation directory structure."""
    results = {"passed": [], "failed": [], "errors": []}
    foundation_path = Path(root)

    # Check foundation/ exists
    if not foundation_path.exists():
        results["failed"].append(f"foundation/ directory does not exist at {root}")
        return results
    results["passed"].append("foundation/ directory exists")

    # Check mycodexvantaos-module.yaml exists
    module_yaml = foundation_path / "mycodexvantaos-module.yaml"
    if not module_yaml.exists():
        results["failed"].append("foundation/mycodexvantaos-module.yaml does not exist")
    else:
        results["passed"].append("foundation/mycodexvantaos-module.yaml exists")

    # Check seven foundation subdirectories
    for subdir in REQUIRED_FOUNDATION_SUBDIRS:
        subdir_path = foundation_path / subdir
        if not subdir_path.exists():
            results["failed"].append(f"foundation/{subdir}/ does not exist")
        else:
            results["passed"].append(f"foundation/{subdir}/ exists")

            # Check required files per subdirectory
            for req_file in REQUIRED_FOUNDATION_FILES:
                file_path = subdir_path / req_file
                if not file_path.exists():
                    results["failed"].append(
                        f"foundation/{subdir}/{req_file} does not exist"
                    )
                else:
                    results["passed"].append(f"foundation/{subdir}/{req_file} exists")

            # Check no mycodexvantaos-module.yaml in subdirectory
            submodule_yaml = subdir_path / "mycodexvantaos-module.yaml"
            if submodule_yaml.exists():
                results["failed"].append(
                    f"foundation/{subdir}/mycodexvantaos-module.yaml MUST NOT exist "
                    f"(foundation subdirectories are not independent root modules)"
                )
            else:
                results["passed"].append(
                    f"foundation/{subdir}/ correctly has no mycodexvantaos-module.yaml"
                )

            # Check prohibited files
            for prohibited in PROHIBITED_FOUNDATION_FILES:
                prohibited_path = subdir_path / prohibited
                if prohibited_path.exists():
                    results["failed"].append(
                        f"foundation/{subdir}/{prohibited} MUST NOT exist "
                        f"(prohibited runtime artifact in foundation spec)"
                    )

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Validate MyCodexVantaOS foundation structure"
    )
    parser.add_argument("--root", default="foundation", help="Foundation root path")
    parser.add_argument("--output", default=None, help="Output report path")
    args = parser.parse_args()

    results = validate_foundation_structure(args.root)

    passed = len(results["passed"])
    failed = len(results["failed"])
    total = passed + failed

    print(f"Foundation Structure Validation")
    print(f"Root: {args.root}")
    print(f"Passed: {passed}/{total}")
    print(f"Failed: {failed}/{total}")

    if results["failed"]:
        print("\nFailed checks:")
        for failure in results["failed"]:
            print(f"  FAIL: {failure}")

    report = {
        "validator": "validate-foundation-structure",
        "root": args.root,
        "passed": passed,
        "failed": failed,
        "total": total,
        "details": results,
    }

    if args.output:
        with open(args.output, "w") as f:
            json.dump(report, f, indent=2)

    if failed > 0:
        sys.exit(1)
    else:
        print("\nAll foundation structure checks passed.")
        sys.exit(0)


if __name__ == "__main__":
    main()
