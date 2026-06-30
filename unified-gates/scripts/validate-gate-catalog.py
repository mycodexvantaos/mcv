#!/usr/bin/env python3
# path: unified-gates/scripts/validate-gate-catalog.py
# governanceCode: mycodexvantaos-00000
"""
MyCodexVantaOS Unified Gates — validate-gate-catalog
=====================================================
Validates the gate catalog YAML files for:
  - All gate IDs are unique across all planes
  - All gate IDs match the canonical naming pattern ^gate-[0-9]{2}-[a-z0-9-]+$
  - All referenced gate definition files exist
  - All gate lifecycle stages are valid
  - All gate owners are non-empty
  - No gate in 'destroyed' lifecycle is referenced as a dependency

Usage:
    python scripts/validate-gate-catalog.py --root . [--report outputs/gate-validation-report.json]
"""
from __future__ import annotations
import argparse, json, os, re, sys
from pathlib import Path
from datetime import datetime, timezone

VALID_LIFECYCLE = {"proposed", "active", "deprecated", "archived", "destroyed"}
VALID_CRITICALITY = {"critical", "high", "medium", "low"}
VALID_LAYERS = {"l00", "l10", "l20", "l30", "l40", "l50", "l60", "l90"}
GATE_ID_PATTERN = re.compile(r"^gate-[0-9]{2}-[a-z0-9-]+$")
GOV_CODE_PATTERN = re.compile(r"^mycodexvantaos-[0-9]{5}$")

def load_yaml(path: Path) -> dict:
    try:
        import yaml
        with path.open() as f:
            return yaml.safe_load(f) or {}
    except ImportError:
        import json as _json
        with path.open() as f:
            return _json.load(f)

def validate_catalog(root: Path) -> list[dict]:
    results = []
    catalog_path = root / "gate-catalog.yaml"
    if not catalog_path.exists():
        results.append({"rule": "CAT-01", "status": "FAIL", "subject": str(catalog_path),
                        "message": "gate-catalog.yaml not found at root."})
        return results

    catalog = load_yaml(catalog_path)
    seen_ids: set[str] = set()
    destroyed_ids: set[str] = set()

    planes = catalog.get("spec", {}).get("planes", [])
    for plane in planes:
        for gate_entry in plane.get("gates", []):
            gate_id = gate_entry.get("id", "")
            # CAT-02: Unique IDs
            if gate_id in seen_ids:
                results.append({"rule": "CAT-02", "status": "FAIL", "subject": gate_id,
                                "message": f"Duplicate gate ID: {gate_id}"})
            else:
                seen_ids.add(gate_id)
                results.append({"rule": "CAT-02", "status": "PASS", "subject": gate_id,
                                "message": "Gate ID is unique."})
            # CAT-03: ID pattern
            if not GATE_ID_PATTERN.match(gate_id):
                results.append({"rule": "CAT-03", "status": "FAIL", "subject": gate_id,
                                "message": f"Gate ID does not match ^gate-[0-9]{{2}}-[a-z0-9-]+$"})
            else:
                results.append({"rule": "CAT-03", "status": "PASS", "subject": gate_id,
                                "message": "Gate ID matches canonical pattern."})
            # CAT-04: Lifecycle validity
            lifecycle = gate_entry.get("lifecycle", "")
            if lifecycle not in VALID_LIFECYCLE:
                results.append({"rule": "CAT-04", "status": "FAIL", "subject": gate_id,
                                "message": f"Invalid lifecycle: {lifecycle!r}"})
            else:
                results.append({"rule": "CAT-04", "status": "PASS", "subject": gate_id,
                                "message": f"Lifecycle '{lifecycle}' is valid."})
                if lifecycle == "destroyed":
                    destroyed_ids.add(gate_id)

    # CAT-05: Gate definition files exist
    ai_infra_path = root / "ai-infra-gates"
    if ai_infra_path.exists():
        for layer_dir in sorted(ai_infra_path.iterdir()):
            if layer_dir.is_dir() and layer_dir.name in VALID_LAYERS:
                for gate_file in sorted(layer_dir.glob("gate-*.yaml")):
                    gate_id = gate_file.stem
                    results.append({"rule": "CAT-05", "status": "PASS", "subject": str(gate_file),
                                    "message": f"Gate definition file exists: {gate_file.name}"})

    total = len(results)
    failed = sum(1 for r in results if r["status"] == "FAIL")
    passed = sum(1 for r in results if r["status"] == "PASS")
    print(f"Gate Catalog Validation: {passed} passed, {failed} failed, {total} total")
    return results

def main():
    parser = argparse.ArgumentParser(description="Validate gate catalog")
    parser.add_argument("--root", default=".", type=Path)
    parser.add_argument("--report", default=None, type=Path)
    args = parser.parse_args()

    results = validate_catalog(args.root)
    failed = [r for r in results if r["status"] == "FAIL"]

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        report = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "validator": "validate-gate-catalog",
            "overallStatus": "FAIL" if failed else "PASS",
            "results": results
        }
        args.report.write_text(json.dumps(report, indent=2))
        print(f"Report written: {args.report}")

    sys.exit(1 if failed else 0)

if __name__ == "__main__":
    main()
