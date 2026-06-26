#!/usr/bin/env python3
# path: unified-gates/scripts/generate-gate-catalog.py
# governanceCode: mycodexvantaos-00000
"""
MyCodexVantaOS Unified Gates — generate-gate-catalog
=====================================================
Scans ai-infra-gates/ and generates/updates the gate catalog YAML.

Usage:
    python scripts/generate-gate-catalog.py --root . --output outputs/gate-catalog-generated.yaml
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path
from datetime import datetime, timezone


def load_yaml(path: Path) -> dict:
    try:
        import yaml
        with path.open() as f:
            return yaml.safe_load(f) or {}
    except ImportError:
        import json
        with path.open() as f:
            return json.load(f)


VALID_LAYERS = ["l00", "l10", "l20", "l30", "l40", "l50", "l60", "l90"]


def generate_catalog(root: Path) -> str:
    ai_infra = root / "ai-infra-gates"
    lines = [
        "apiVersion: mycodexvantaos.io/v1",
        "kind: GateCatalog",
        "metadata:",
        "  name: unified-gate-catalog-generated",
        f"  generatedAt: {datetime.now(timezone.utc).isoformat()}",
        "  version: 1.0.0",
        "  ssot: false",
        "  authority: unified-gate-governance",
        "  governanceCode: mycodexvantaos-00000",
        "spec:",
        "  planes:",
    ]
    for layer in VALID_LAYERS:
        layer_dir = ai_infra / layer
        if not layer_dir.exists():
            continue
        gate_files = sorted(layer_dir.glob("gate-*.yaml"))
        if not gate_files:
            continue
        lines.append(f"    - id: {layer}")
        lines.append(f"      path: ./ai-infra-gates/{layer}/")
        lines.append("      gates:")
        for gf in gate_files:
            data = load_yaml(gf)
            meta = data.get("metadata", {})
            gate_id = meta.get("id", gf.stem)
            criticality = meta.get("criticality", "critical")
            blocking = meta.get("blocking", True)
            lifecycle = meta.get("lifecycle", "active")
            blocking_str = "true" if blocking else "false"
            lines.append(f"        - id: {gate_id}")
            lines.append(f"          criticality: {criticality}")
            lines.append(f"          blocking: {blocking_str}")
            lines.append(f"          lifecycle: {lifecycle}")
    newline = "\n"
    return newline.join(lines) + newline


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate gate catalog")
    parser.add_argument("--root", default=".", type=Path)
    parser.add_argument("--output", default="outputs/gate-catalog-generated.yaml", type=Path)
    args = parser.parse_args()

    catalog_yaml = generate_catalog(args.root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(catalog_yaml)
    print(f"Gate catalog generated: {args.output}")
    sys.exit(0)


if __name__ == "__main__":
    main()
