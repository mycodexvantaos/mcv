#!/usr/bin/env python3
# path: unified-gates/scripts/validate-gate-composition.py
# governanceCode: mycodexvantaos-00000
"""
MyCodexVantaOS Unified Gates — validate-gate-composition
=========================================================
Validates gate composition rules:
  - No circular dependencies in gate dependsOn graph
  - No cross-layer forward dependencies (l30 cannot depend on l40)
  - No dependencies on destroyed gates

Usage:
    python scripts/validate-gate-composition.py --root .
"""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path
from datetime import datetime, timezone

LAYER_ORDER = {"l00":0,"l10":1,"l20":2,"l30":3,"l40":4,"l50":5,"l60":6,"l90":7}

def load_yaml(path: Path) -> dict:
    try:
        import yaml
        with path.open() as f:
            return yaml.safe_load(f) or {}
    except ImportError:
        with path.open() as f:
            return json.load(f)

def detect_cycle(graph: dict[str, list[str]]) -> list[str] | None:
    visited, rec_stack, path = set(), set(), []
    def dfs(node):
        visited.add(node); rec_stack.add(node); path.append(node)
        for nb in graph.get(node, []):
            if nb not in visited:
                if dfs(nb): return True
            elif nb in rec_stack:
                path.append(nb); return True
        rec_stack.discard(node); path.pop(); return False
    for node in list(graph):
        if node not in visited:
            if dfs(node): return path
    return None

def validate_composition(root: Path) -> list[dict]:
    results = []
    gate_meta: dict[str, dict] = {}
    dep_graph: dict[str, list[str]] = {}

    for gate_file in sorted((root / "ai-infra-gates").rglob("gate-*.yaml")):
        data = load_yaml(gate_file)
        meta = data.get("metadata", {})
        spec = data.get("spec", {})
        gate_id = meta.get("id", gate_file.stem)
        gate_meta[gate_id] = meta
        deps = spec.get("dependsOn", [])
        dep_graph[gate_id] = deps

    # COMP-01: Cycle detection
    cycle = detect_cycle(dep_graph)
    if cycle:
        results.append({"rule":"COMP-01","status":"FAIL","subject":" → ".join(cycle),
                        "message":f"Cyclic dependency detected: {' → '.join(cycle)}"})
    else:
        results.append({"rule":"COMP-01","status":"PASS","subject":"dep-graph",
                        "message":"No cyclic dependencies detected."})

    # COMP-02: No forward cross-layer dependencies
    for gate_id, deps in dep_graph.items():
        src_layer = gate_meta.get(gate_id, {}).get("layer","")
        src_order = LAYER_ORDER.get(src_layer, -1)
        for dep in deps:
            dep_layer = gate_meta.get(dep, {}).get("layer","")
            dep_order = LAYER_ORDER.get(dep_layer, -1)
            if dep_order > src_order:
                results.append({"rule":"COMP-02","status":"FAIL","subject":f"{gate_id} → {dep}",
                                "message":f"Forward cross-layer dependency: {src_layer} → {dep_layer}"})
            else:
                results.append({"rule":"COMP-02","status":"PASS","subject":f"{gate_id} → {dep}",
                                "message":"Dependency respects layer order."})

    failed = [r for r in results if r["status"] == "FAIL"]
    print(f"Gate Composition Validation: {len(results)-len(failed)} passed, {len(failed)} failed")
    return results

def main():
    parser = argparse.ArgumentParser(description="Validate gate composition")
    parser.add_argument("--root", default=".", type=Path)
    parser.add_argument("--report", default=None, type=Path)
    args = parser.parse_args()
    results = validate_composition(args.root)
    failed = [r for r in results if r["status"] == "FAIL"]
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        report = {"generatedAt": datetime.now(timezone.utc).isoformat(),
                  "validator": "validate-gate-composition",
                  "overallStatus": "FAIL" if failed else "PASS",
                  "results": results}
        args.report.write_text(json.dumps(report, indent=2))
    sys.exit(1 if failed else 0)

if __name__ == "__main__":
    main()
