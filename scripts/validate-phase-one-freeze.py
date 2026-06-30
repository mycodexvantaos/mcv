#!/usr/bin/env python3
"""
MyCodexVantaOS Phase One Freeze Validation Script
"""

import sys
import yaml
from pathlib import Path

violations = []

FROZEN_ARTIFACTS = [
    "docs/spec/l0-meta/formalized-specification-architecture.yaml",
    "docs/spec/l1-constitution/constitution.yaml",
    "docs/spec/l2-structure/capability-architecture-addendum.yaml",
    "governance/identity-policy.yaml",
    "governance/platform-governance-spec.yaml",
    "governance/capability-set.yaml",
    "governance/naming-policy.schema.json",
    "platform/service-catalog.yaml",
]


def validate_phase_one_config(root: Path) -> None:
    """Validate phase one configuration."""
    config_path = root / "config" / "phase-one.config.yaml"
    if not config_path.exists():
        violations.append(f"[ERROR] Missing phase one config: {config_path}")
        return

    try:
        with open(config_path) as f:
            config = yaml.safe_load(f)

        freeze = config.get("freeze", {})
        if not freeze.get("enabled"):
            violations.append("[WARNING] Phase one freeze is not enabled")
        else:
            print(f"✓ Phase one freeze: enabled")

        status = freeze.get("status", "")
        if status != "frozen":
            violations.append(f"[WARNING] Phase one freeze status is '{status}', expected 'frozen'")
        else:
            print(f"✓ Freeze status: {status}")

    except Exception as e:
        violations.append(f"[ERROR] Phase one config parse error: {e}")


def validate_frozen_artifacts_exist(root: Path) -> None:
    """Validate that all frozen artifacts exist."""
    for artifact_path in FROZEN_ARTIFACTS:
        full_path = root / artifact_path
        if not full_path.exists():
            violations.append(f"[ERROR] Frozen artifact missing: {artifact_path}")
        else:
            print(f"✓ Frozen artifact: {artifact_path}")


def main() -> int:
    root = Path(__file__).parent.parent
    print("MyCodexVantaOS Phase One Freeze Validation")
    print()

    validate_phase_one_config(root)
    validate_frozen_artifacts_exist(root)

    if violations:
        print(f"\nViolations ({len(violations)}):")
        for v in violations:
            print(f"  {v}")
        error_count = sum(1 for v in violations if "[ERROR]" in v)
        if error_count > 0:
            print(f"\nPhase one freeze validation: FAILED")
            return 1

    print(f"\nPhase one freeze validation: PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
