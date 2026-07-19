#!/usr/bin/env python3
"""CLI entrypoint for MyCodexVantaOS unified gate validation.

Rationale: CI and local verification require a stable executable boundary that
returns non-zero only when a constitutional gate invariant is violated.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from scripts.unified_gates.io import write_json
from scripts.unified_gates.validator import validate_unified_gate_index


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="validate-unified-gates")
    parser.add_argument("--root", default=".", help="repository root")
    parser.add_argument(
        "--index",
        default="config/unified-gates/unified-gate-index.yaml",
        help="unified gate index path",
    )
    parser.add_argument(
        "--output",
        default="outputs/unified-gate-summary.json",
        help="machine-readable validation output",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    root = Path(args.root).resolve()
    result = validate_unified_gate_index(root, args.index)
    write_json(root / args.output, result.to_dict())
    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))