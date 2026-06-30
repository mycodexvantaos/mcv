#!/usr/bin/env python3
"""
MyCodexVantaOS Navigation Validation Script
"""

import sys
import yaml
from pathlib import Path

violations = []


def validate_navigation_files(root: Path) -> None:
    """Validate navigation map files."""
    nav_root = root / "navigation"
    if not nav_root.exists():
        violations.append(f"[ERROR] Missing navigation directory: {nav_root}")
        return

    required_files = [
        "README.md",
        "mycodexvantaos-module.yaml",
        "dependency-graph.yaml",
        "module-index.yaml",
        "navigation-policy.yaml",
    ]

    for req_file in required_files:
        path = nav_root / req_file
        if not path.exists():
            violations.append(f"[ERROR] Missing navigation file: {path}")
        else:
            print(f"✓ Navigation file: {req_file}")

    # Validate dependency graph
    dep_graph_path = nav_root / "dependency-graph.yaml"
    if dep_graph_path.exists():
        try:
            with open(dep_graph_path) as f:
                graph = yaml.safe_load(f)
            nodes = graph.get("nodes", [])
            edges = graph.get("edges", [])
            print(f"✓ Dependency graph: {len(nodes)} nodes, {len(edges)} edges")
        except Exception as e:
            violations.append(f"[ERROR] Dependency graph parse error: {e}")


def main() -> int:
    root = Path(__file__).parent.parent
    print("MyCodexVantaOS Navigation Validation")
    print()

    validate_navigation_files(root)

    if violations:
        print(f"\nViolations ({len(violations)}):")
        for v in violations:
            print(f"  {v}")
        error_count = sum(1 for v in violations if "[ERROR]" in v)
        if error_count > 0:
            print(f"\nNavigation validation: FAILED")
            return 1

    print(f"\nNavigation validation: PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
