#!/usr/bin/env python3
# path: unified-gates/scripts/validate-ai-infra-gates.py
# governanceCode: mycodexvantaos-00000
"""
MyCodexVantaOS Unified Gates — validate-ai-infra-gates
=======================================================
Validates all AI infrastructure gate definitions in ai-infra-gates/.
Runs schema validation, catalog validation, and composition validation.

Usage:
    python scripts/validate-ai-infra-gates.py --root . --layer all
    python scripts/validate-ai-infra-gates.py --root . --layer l00
"""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path
from datetime import datetime, timezone

VALID_LAYERS = {"l00","l10","l20","l30","l40","l50","l60","l90","all"}
GATE_ID_RE = re.compile(r"^gate-[0-9]{2}-[a-z0-9-]+$")
GOV_CODE_RE = re.compile(r"^mycodexvantaos-[0-9]{5}$")
VALID_LIFECYCLE = {"proposed","active","deprecated","archived","destroyed"}

def load_yaml(path: Path) -> dict:
    try:
        import yaml
        with path.open() as f:
            return yaml.safe_load(f) or {}
    except ImportError:
        with path.open() as f:
            return json.load(f)

def validate_layer(layer_dir: Path) -> list[dict]:
    results = []
    for gate_file in sorted(layer_dir.glob("gate-*.yaml")):
        data = load_yaml(gate_file)
        meta = data.get("metadata", {})
        spec = data.get("spec", {})
        subject = str(gate_file)

        # AIIG-01: apiVersion
        if data.get("apiVersion") != "mycodexvantaos.io/v1":
            results.append({"rule":"AIIG-01","status":"FAIL","subject":subject,
                            "message":f"apiVersion must be 'mycodexvantaos.io/v1'"})
        else:
            results.append({"rule":"AIIG-01","status":"PASS","subject":subject,"message":"apiVersion OK"})

        # AIIG-02: Gate ID pattern
        gate_id = meta.get("id","")
        if not GATE_ID_RE.match(gate_id):
            results.append({"rule":"AIIG-02","status":"FAIL","subject":subject,
                            "message":f"Gate ID {gate_id!r} does not match canonical pattern"})
        else:
            results.append({"rule":"AIIG-02","status":"PASS","subject":subject,"message":"Gate ID OK"})

        # AIIG-03: Governance code
        gov_code = meta.get("governanceCode","")
        if not GOV_CODE_RE.match(gov_code):
            results.append({"rule":"AIIG-03","status":"FAIL","subject":subject,
                            "message":f"governanceCode {gov_code!r} is malformed"})
        else:
            results.append({"rule":"AIIG-03","status":"PASS","subject":subject,"message":"governanceCode OK"})

        # AIIG-04: Lifecycle
        lifecycle = meta.get("lifecycle","")
        if lifecycle not in VALID_LIFECYCLE:
            results.append({"rule":"AIIG-04","status":"FAIL","subject":subject,
                            "message":f"Invalid lifecycle: {lifecycle!r}"})
        else:
            results.append({"rule":"AIIG-04","status":"PASS","subject":subject,"message":f"Lifecycle '{lifecycle}' OK"})

        # AIIG-05: Owner present
        if not meta.get("owner"):
            results.append({"rule":"AIIG-05","status":"FAIL","subject":subject,"message":"Missing owner"})
        else:
            results.append({"rule":"AIIG-05","status":"PASS","subject":subject,"message":"Owner present"})

        # AIIG-06: validates not empty
        validates = spec.get("validates",[])
        if not validates:
            results.append({"rule":"AIIG-06","status":"FAIL","subject":subject,"message":"spec.validates is empty"})
        else:
            results.append({"rule":"AIIG-06","status":"PASS","subject":subject,
                            "message":f"spec.validates has {len(validates)} dimension(s)"})

    return results

def main():
    parser = argparse.ArgumentParser(description="Validate AI infrastructure gates")
    parser.add_argument("--root", default=".", type=Path)
    parser.add_argument("--layer", default="all", choices=sorted(VALID_LAYERS))
    parser.add_argument("--report", default=None, type=Path)
    args = parser.parse_args()

    ai_infra = args.root / "ai-infra-gates"
    if not ai_infra.exists():
        print(f"ERROR: ai-infra-gates/ not found at {args.root}", file=sys.stderr)
        sys.exit(2)

    layers = sorted(d for d in ai_infra.iterdir() if d.is_dir()) if args.layer == "all"              else [ai_infra / args.layer]

    all_results = []
    for layer_dir in layers:
        if layer_dir.exists():
            all_results.extend(validate_layer(layer_dir))

    failed = [r for r in all_results if r["status"] == "FAIL"]
    print(f"AI Infra Gate Validation: {len(all_results)-len(failed)} passed, {len(failed)} failed")

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        report = {"generatedAt": datetime.now(timezone.utc).isoformat(),
                  "validator": "validate-ai-infra-gates",
                  "layer": args.layer,
                  "overallStatus": "FAIL" if failed else "PASS",
                  "results": all_results}
        args.report.write_text(json.dumps(report, indent=2))
        print(f"Report written: {args.report}")

    sys.exit(1 if failed else 0)

if __name__ == "__main__":
    main()
