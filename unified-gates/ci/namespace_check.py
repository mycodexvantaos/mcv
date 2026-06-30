#!/usr/bin/env python3
"""
MyCodexVantaOS Unified Gates — Namespace Check CI Validator
"""
import sys
import re

MACHINE_IDENTITY = "mycodexvantaos"
FORBIDDEN_PREFIXES = ["mycodexvanta-os", "codexvanta-os", "codexvanta", "codevantaos", "kubo", "axiom"]

def check_namespace(name: str) -> bool:
    for prefix in FORBIDDEN_PREFIXES:
        if name.startswith(prefix):
            print(f"ERROR: '{name}' uses forbidden prefix '{prefix}'")
            return False
    return True

if __name__ == "__main__":
    print(f"Namespace check for: {MACHINE_IDENTITY}")
    sys.exit(0 if check_namespace(MACHINE_IDENTITY) else 1)
