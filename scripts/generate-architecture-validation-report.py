#!/usr/bin/env python3
"""
MyCodexVantaOS Architecture Validation Report Generator
"""

import json
import sys
import datetime
from pathlib import Path

MACHINE_IDENTITY = "mycodexvantaos"
CANONICAL_URL = "https://mycodexvantaos.com"


def generate_report(root: Path) -> dict:
    """Generate architecture validation report."""
    report = {
        "report-id": f"arch-validation-{datetime.datetime.utcnow().strftime('%Y%m%d-%H%M%S')}",
        "platform": MACHINE_IDENTITY,
        "canonical-url": CANONICAL_URL,
        "generated-at": datetime.datetime.utcnow().isoformat() + "Z",
        "checks": [],
        "summary": {},
    }

    checks = []

    # Check identity policy
    identity_policy = root / "governance" / "identity-policy.yaml"
    checks.append({
        "check": "identity-policy-exists",
        "result": "pass" if identity_policy.exists() else "fail",
        "path": str(identity_policy.relative_to(root)),
    })

    # Check foundation directories
    foundations = [
        "compute-foundation", "data-foundation", "algorithm-foundation",
        "agent-foundation", "contract-foundation", "governance-foundation",
        "business-foundation"
    ]
    for foundation in foundations:
        foundation_path = root / "foundation" / foundation
        checks.append({
            "check": f"foundation-exists-{foundation}",
            "result": "pass" if foundation_path.exists() else "fail",
            "path": f"foundation/{foundation}",
        })

    # Check service catalog
    service_catalog = root / "platform" / "service-catalog.yaml"
    checks.append({
        "check": "service-catalog-exists",
        "result": "pass" if service_catalog.exists() else "fail",
        "path": str(service_catalog.relative_to(root)),
    })

    # Check CI rules
    ci_rules_dir = root / "ci" / "rules"
    ci_rule_count = len(list(ci_rules_dir.glob("*.ts"))) if ci_rules_dir.exists() else 0
    checks.append({
        "check": "ci-rules-count",
        "result": "pass" if ci_rule_count >= 18 else "fail",
        "expected": 18,
        "actual": ci_rule_count,
    })

    report["checks"] = checks

    passed = sum(1 for c in checks if c.get("result") == "pass")
    failed = sum(1 for c in checks if c.get("result") == "fail")
    report["summary"] = {
        "total": len(checks),
        "passed": passed,
        "failed": failed,
        "overall": "pass" if failed == 0 else "fail",
    }

    return report


def main() -> int:
    root = Path(__file__).parent.parent
    output_dir = root / "outputs"
    output_dir.mkdir(exist_ok=True)

    report = generate_report(root)
    output_path = output_dir / "architecture-validation-report.json"

    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)

    overall = report["summary"]["overall"]
    print(f"Architecture validation report: {overall.upper()}")
    print(f"Report saved to: {output_path}")

    return 0 if overall == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
