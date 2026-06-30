#!/usr/bin/env python3
# path: unified-gates/scripts/validate-gate-schema.py
# governanceCode: mycodexvantaos-00000
"""
MyCodexVantaOS Unified Gates — validate-gate-schema
====================================================
Validates gate YAML definition files against schemas/ai-infra-gate.schema.json.

Usage:
    python scripts/validate-gate-schema.py --root . [--gate ai-infra-gates/l00/gate-01-*.yaml]
"""
from __future__ import annotations
import argparse, json, sys
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

REQUIRED_METADATA = ["id", "version", "layer", "plane", "blocking", "lifecycle", "owner", "governanceCode"]
REQUIRED_SPEC = ["description", "validates"]
VALID_LAYERS = {"l00","l10","l20","l30","l40","l50","l60","l90"}
VALID_LIFECYCLE = {"proposed","active","deprecated","archived","destroyed"}
VALID_PLANES = {"ai-infra","quality","production"}

import re
GATE_ID_RE = re.compile(r"^gate-[0-9]{2}-[a-z0-9-]+$")
GOV_CODE_RE = re.compile(r"^mycodexvantaos-[0-9]{5}$")

def validate_gate_file(path: Path) -> list[dict]:
    results = []
    subject = str(path)
    data = load_yaml(path)
    meta = data.get("metadata", {})
    spec = data.get("spec", {})

    # Schema-01: apiVersion
    if data.get("apiVersion") != "mycodexvantaos.io/v1":
        results.append({"rule":"Schema-01","status":"FAIL","subject":subject,
                        "message":f"apiVersion must be 'mycodexvantaos.io/v1', got {data.get('apiVersion')!r}"})
    else:
        results.append({"rule":"Schema-01","status":"PASS","subject":subject,"message":"apiVersion is correct."})

    # Schema-02: Required metadata fields
    for field in REQUIRED_METADATA:
        if not meta.get(field):
            results.append({"rule":"Schema-02","status":"FAIL","subject":subject,
                            "message":f"Missing required metadata field: {field}"})
        else:
            results.append({"rule":"Schema-02","status":"PASS","subject":subject,
                            "message":f"metadata.{field} is present."})

    # Schema-03: Gate ID pattern
    gate_id = meta.get("id","")
    if not GATE_ID_RE.match(gate_id):
        results.append({"rule":"Schema-03","status":"FAIL","subject":subject,
                        "message":f"Gate ID {gate_id!r} does not match ^gate-[0-9]{{2}}-[a-z0-9-]+$"})
    else:
        results.append({"rule":"Schema-03","status":"PASS","subject":subject,"message":"Gate ID matches pattern."})

    # Schema-04: Governance code pattern
    gov_code = meta.get("governanceCode","")
    if not GOV_CODE_RE.match(gov_code):
        results.append({"rule":"Schema-04","status":"FAIL","subject":subject,
                        "message":f"governanceCode {gov_code!r} does not match ^mycodexvantaos-[0-9]{{5}}$"})
    else:
        results.append({"rule":"Schema-04","status":"PASS","subject":subject,"message":"governanceCode is valid."})

    # Schema-05: Layer validity
    layer = meta.get("layer","")
    if layer not in VALID_LAYERS:
        results.append({"rule":"Schema-05","status":"FAIL","subject":subject,
                        "message":f"Invalid layer: {layer!r}. Must be one of {sorted(VALID_LAYERS)}"})
    else:
        results.append({"rule":"Schema-05","status":"PASS","subject":subject,"message":f"Layer '{layer}' is valid."})

    # Schema-06: Lifecycle validity
    lifecycle = meta.get("lifecycle","")
    if lifecycle not in VALID_LIFECYCLE:
        results.append({"rule":"Schema-06","status":"FAIL","subject":subject,
                        "message":f"Invalid lifecycle: {lifecycle!r}"})
    else:
        results.append({"rule":"Schema-06","status":"PASS","subject":subject,"message":f"Lifecycle '{lifecycle}' is valid."})

    # Schema-07: Required spec fields
    for field in REQUIRED_SPEC:
        if not spec.get(field):
            results.append({"rule":"Schema-07","status":"FAIL","subject":subject,
                            "message":f"Missing required spec field: {field}"})
        else:
            results.append({"rule":"Schema-07","status":"PASS","subject":subject,
                            "message":f"spec.{field} is present."})

    return results

def main():
    parser = argparse.ArgumentParser(description="Validate gate schema")
    parser.add_argument("--root", default=".", type=Path)
    parser.add_argument("--gate", default=None, type=Path)
    parser.add_argument("--report", default=None, type=Path)
    args = parser.parse_args()

    if args.gate:
        gate_files = [args.gate]
    else:
        gate_files = sorted((args.root / "ai-infra-gates").rglob("gate-*.yaml"))

    all_results = []
    for gf in gate_files:
        all_results.extend(validate_gate_file(gf))

    failed = [r for r in all_results if r["status"] == "FAIL"]
    print(f"Gate Schema Validation: {len(all_results)-len(failed)} passed, {len(failed)} failed")

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        report = {"generatedAt": datetime.now(timezone.utc).isoformat(),
                  "validator": "validate-gate-schema",
                  "overallStatus": "FAIL" if failed else "PASS",
                  "results": all_results}
        args.report.write_text(json.dumps(report, indent=2))

    sys.exit(1 if failed else 0)

if __name__ == "__main__":
    main()
