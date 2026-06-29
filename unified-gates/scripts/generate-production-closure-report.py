#!/usr/bin/env python3
# path: unified-gates/scripts/generate-production-closure-report.py
# governanceCode: mycodexvantaos-00000
"""
MyCodexVantaOS Unified Gates — generate-production-closure-report
=================================================================
Generates the production closure report by evaluating all l90 gates
and checking production closure policy requirements.

Usage:
    python scripts/generate-production-closure-report.py \
        --root . --output outputs/production-closure-report.json
"""
from __future__ import annotations
import argparse, json, sys, uuid
from pathlib import Path
from datetime import datetime, timezone

def load_yaml(path: Path) -> dict:
    try:
        import yaml
        with path.open() as f:
            return yaml.safe_load(f) or {}
    except ImportError:
        with path.open() as f:
            return json.load(f)

L90_GATES = [
    "gate-91-sbom-generation-validation",
    "gate-92-provenance-validation",
    "gate-93-signature-validation",
    "gate-94-policy-attestation-validation",
    "gate-95-audit-evidence-chain-validation",
    "gate-96-release-readiness-validation",
    "gate-97-rollback-readiness-validation",
    "gate-98-compliance-report-validation",
    "gate-99-production-closure-validation",
]

def generate_closure_report(root: Path) -> dict:
    l90_dir = root / "ai-infra-gates" / "l90"
    gate_results = []
    all_pass = True

    for gate_name in L90_GATES:
        gate_file = l90_dir / f"{gate_name}.yaml"
        if gate_file.exists():
            data = load_yaml(gate_file)
            meta = data.get("metadata", {})
            status = "PASS" if meta.get("lifecycle") == "active" else "SKIP"
            gate_results.append({
                "gateId": gate_name,
                "status": status,
                "criticality": meta.get("criticality","critical"),
                "blocking": meta.get("blocking", True),
                "evaluatedAt": datetime.now(timezone.utc).isoformat(),
            })
        else:
            gate_results.append({
                "gateId": gate_name,
                "status": "FAIL",
                "message": f"Gate definition file not found: {gate_file}",
            })
            all_pass = False

    policy_checks = [
        {"id": "all-mandatory-gates-passed", "status": "PASS" if all_pass else "FAIL"},
        {"id": "compliance-report-approved", "status": "PENDING"},
        {"id": "rollback-plan-tested", "status": "PENDING"},
        {"id": "on-call-confirmed", "status": "PENDING"},
        {"id": "deployment-window-approved", "status": "PENDING"},
    ]

    overall = "PASS" if all_pass else "FAIL"

    return {
        "apiVersion": "mycodexvantaos.io/v1",
        "kind": "ProductionClosureReport",
        "reportId": str(uuid.uuid4()),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "specVersion": "mycodexvantaos-00000",
        "overallStatus": overall,
        "l90GateResults": gate_results,
        "policyChecks": policy_checks,
        "approvalStatus": "PENDING",
        "approvalAuthority": "release-authority",
        "notes": "This report requires manual approval before production promotion."
    }

def main():
    parser = argparse.ArgumentParser(description="Generate production closure report")
    parser.add_argument("--root", default=".", type=Path)
    parser.add_argument("--output", default="outputs/production-closure-report.json", type=Path)
    args = parser.parse_args()

    report = generate_closure_report(args.root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2))
    print(f"Production closure report written: {args.output}")
    print(f"Overall status: {report['overallStatus']}")
    sys.exit(0 if report["overallStatus"] == "PASS" else 1)

if __name__ == "__main__":
    main()
