#!/usr/bin/env python3
"""
MyCodexVantaOS Provider Registry Validation Script
"""

import sys
import yaml
import re
from pathlib import Path

PROVIDER_ID_PATTERN = re.compile(
    r"^mycodexvantaos-[a-z0-9]+-[a-z0-9]+(?:-[a-z0-9]+)*$"
)

ALLOWED_CAPABILITIES = [
    "database", "storage", "auth", "queue", "state-store", "secrets",
    "repo", "deploy", "validation", "security", "observability",
    "notification", "scheduler", "vector-store", "embedding", "llm",
    "graph", "cache", "search", "quantum-runtime", "quantum-simulator",
    "quantum-processor", "quantum-circuit", "quantum-observability",
    "ai-ethics", "blockchain", "event-stream", "audio", "image", "realtime",
]

violations = []


def validate_provider_manifests(root: Path) -> None:
    """Validate all provider manifests."""
    provider_count = 0
    for manifest_path in root.glob("providers/**/provider-manifest.yaml"):
        provider_count += 1
        try:
            with open(manifest_path) as f:
                manifest = yaml.safe_load(f)

            provider_id = manifest.get("provider-id", "")
            capability = manifest.get("capability", "")

            if not PROVIDER_ID_PATTERN.match(provider_id):
                violations.append(
                    f"[ERROR] {manifest_path}: Invalid provider-id '{provider_id}'"
                )

            if capability not in ALLOWED_CAPABILITIES:
                violations.append(
                    f"[ERROR] {manifest_path}: Invalid capability '{capability}'. "
                    f"Must be one of: {', '.join(ALLOWED_CAPABILITIES)}"
                )

            runtime_modes = manifest.get("runtime-modes", [])
            valid_modes = {"native", "connected", "hybrid"}
            for mode in runtime_modes:
                if mode not in valid_modes:
                    violations.append(
                        f"[ERROR] {manifest_path}: Invalid runtime-mode '{mode}'"
                    )

            if not violations:
                print(f"✓ Provider: {provider_id} ({capability})")

        except Exception as e:
            violations.append(f"[ERROR] {manifest_path}: {e}")

    print(f"\nTotal providers found: {provider_count}")


def validate_provider_registry(root: Path) -> None:
    """Validate the provider registry file."""
    registry_path = root / "governance" / "provider-registry.yaml"
    if not registry_path.exists():
        violations.append(f"[ERROR] Missing provider registry: {registry_path}")
        return

    try:
        with open(registry_path) as f:
            registry = yaml.safe_load(f)
        providers = registry.get("providers", [])
        print(f"✓ Provider registry: {len(providers)} providers registered")
    except Exception as e:
        violations.append(f"[ERROR] Provider registry parse error: {e}")


def main() -> int:
    root = Path(__file__).parent.parent
    print("MyCodexVantaOS Provider Registry Validation")
    print()

    validate_provider_registry(root)
    validate_provider_manifests(root)

    if violations:
        print(f"\nViolations ({len(violations)}):")
        for v in violations:
            print(f"  {v}")
        print(f"\nProvider registry validation: FAILED")
        return 1

    print(f"\nProvider registry validation: PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
