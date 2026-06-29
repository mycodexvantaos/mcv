#!/usr/bin/env python3
"""Validate L1 Constitution spec"""
import sys
import yaml
from pathlib import Path

def main() -> int:
    spec_path = Path(__file__).parent.parent / "docs/spec/l1-constitution/constitution.yaml"
    with open(spec_path) as f:
        spec = yaml.safe_load(f)
    assert spec.get("layer") == 1, "L1 Constitution must be layer 1"
    assert spec.get("identity", {}).get("machine") == "mycodexvantaos", "Machine identity must be mycodexvantaos"
    print("L1 Constitution validation: PASSED")
    return 0

if __name__ == "__main__":
    sys.exit(main())
