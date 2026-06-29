#!/usr/bin/env python3
"""Validate L2 Capability Addendum spec"""
import sys
import yaml
from pathlib import Path

def main() -> int:
    spec_path = Path(__file__).parent.parent / "docs/spec/l2-structure/capability-architecture-addendum.yaml"
    with open(spec_path) as f:
        spec = yaml.safe_load(f)
    assert spec.get("layer") == 2, "L2 spec must be layer 2"
    print("L2 Capability Addendum validation: PASSED")
    return 0

if __name__ == "__main__":
    sys.exit(main())
