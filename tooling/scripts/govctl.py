#!/usr/bin/env python3
"""
govctl.py — MyCodeXvantaOS Governance Control CLI
Validates directory-contract.yaml files and checks architecture health.

Usage:
  python3 tooling/scripts/govctl.py validate <directory>
  python3 tooling/scripts/govctl.py validate-all
  python3 tooling/scripts/govctl.py check-deps <directory>
  python3 tooling/scripts/govctl.py status
"""

import sys
import os
import json
import argparse
from pathlib import Path

# Try to import yaml; fall back to basic parser if not available
try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


# ─── CONSTANTS ────────────────────────────────────────────────────────────────

VALID_LAYERS = {
    "contract", "governance", "adapter", "service",
    "intelligence", "data", "infrastructure", "application",
    "release", "tooling", "testing", "documentation"
}

VALID_BLAST_RADIUS = {"none", "low", "medium", "high", "critical"}

VALID_FALLBACK_TYPES = {
    "graceful-degrade", "degraded-mode", "emergency-mode",
    "maintenance-page", "previous-revision", "circuit-break", "none"
}

TARGET_DIRECTORIES = [
    "contracts", "governance", "adapters", "services",
    "intelligence", "data", "infra", "apps", "release",
    "tooling", "tests", "docs", "runtime-mesh"
]

REQUIRED_CONTRACT_FIELDS = ["apiVersion", "kind", "metadata", "spec"]


# ─── YAML LOADING ─────────────────────────────────────────────────────────────

def load_yaml_file(path: Path) -> dict:
    """Load a YAML file. Falls back to basic key: value parser if PyYAML is unavailable."""
    if not path.exists():
        return {}

    if HAS_YAML:
        with open(path, encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    else:
        # Basic YAML parser for simple key: value structures
        result = {}
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.rstrip()
                if line.startswith("#") or not line.strip():
                    continue
                if ":" in line and not line.startswith(" "):
                    key, _, value = line.partition(":")
                    value = value.strip().strip('"').strip("'")
                    if value:
                        result[key.strip()] = value
        return result


# ─── VALIDATION ───────────────────────────────────────────────────────────────

class ValidationError:
    def __init__(self, field: str, message: str, severity: str = "ERROR"):
        self.field = field
        self.message = message
        self.severity = severity  # ERROR or WARNING

    def __str__(self):
        return f"[{self.severity}] {self.field}: {self.message}"


def validate_contract(contract_path: Path) -> list[ValidationError]:
    """Validate a single directory-contract.yaml file."""
    errors = []

    if not contract_path.exists():
        errors.append(ValidationError(
            "file", f"directory-contract.yaml not found at {contract_path}", "ERROR"
        ))
        return errors

    data = load_yaml_file(contract_path)

    if not data:
        errors.append(ValidationError("file", "File is empty or unparseable", "ERROR"))
        return errors

    # Check required top-level fields (apiVersion/kind/metadata/spec schema)
    for field in REQUIRED_CONTRACT_FIELDS:
        if field not in data:
            errors.append(ValidationError(field, f"Required field '{field}' is missing", "ERROR"))

    # Validate apiVersion
    if "apiVersion" in data:
        api_version = str(data["apiVersion"])
        if not api_version.startswith("mycodexvantaos.io/"):
            errors.append(ValidationError(
                "apiVersion", f"Expected 'mycodexvantaos.io/v<N>', got '{api_version}'", "ERROR"
            ))

    # Validate kind
    if "kind" in data and data["kind"] != "DirectoryContract":
        errors.append(ValidationError(
            "kind", f"Expected kind 'DirectoryContract', got '{data['kind']}'", "ERROR"
        ))

    # Extract spec for further validation
    spec = data.get("spec", {}) if isinstance(data.get("spec"), dict) else {}

    # Validate layer (inside spec)
    if spec:
        layer = spec.get("layer", "")
        if layer:
            layer = layer.lower() if isinstance(layer, str) else ""
            if layer not in VALID_LAYERS:
                errors.append(ValidationError(
                    "spec.layer",
                    f"Invalid layer '{layer}'. Must be one of: {', '.join(sorted(VALID_LAYERS))}",
                    "ERROR"
                ))
        else:
            errors.append(ValidationError("spec.layer", "spec.layer is required", "ERROR"))

        # Validate blast_radius (inside spec)
        br = spec.get("blastRadius", spec.get("blast_radius", ""))
        if br:
            br = br.lower() if isinstance(br, str) else ""
            if br not in VALID_BLAST_RADIUS:
                errors.append(ValidationError(
                    "spec.blastRadius",
                    f"Invalid blastRadius '{br}'. Must be: {', '.join(sorted(VALID_BLAST_RADIUS))}",
                    "WARNING"
                ))

        # Validate ownedBy is present (warning only)
        if "ownedBy" not in spec and "owned_by" not in spec:
            errors.append(ValidationError(
                "spec.ownedBy", "Ownership not declared (recommended)", "WARNING"
            ))

        # Validate lastReviewed is present (warning only)
        if "lastReviewed" not in spec and "last_reviewed" not in spec:
            errors.append(ValidationError(
                "spec.lastReviewed", "Last review date not declared (recommended)", "WARNING"
            ))

    return errors


def validate_directory(dir_name: str, repo_root: Path = None) -> tuple[bool, list[ValidationError]]:
    """Validate a directory's governance contract."""
    if repo_root is None:
        repo_root = Path.cwd()

    dir_path = repo_root / dir_name
    contract_path = dir_path / "directory-contract.yaml"

    if not dir_path.exists():
        return False, [ValidationError("directory", f"Directory '{dir_name}' does not exist", "ERROR")]

    errors = validate_contract(contract_path)
    has_errors = any(e.severity == "ERROR" for e in errors)
    return not has_errors, errors


def validate_all(repo_root: Path = None) -> dict[str, tuple[bool, list[ValidationError]]]:
    """Validate all target directories."""
    if repo_root is None:
        repo_root = Path.cwd()

    results = {}
    for dir_name in TARGET_DIRECTORIES:
        dir_path = repo_root / dir_name
        if dir_path.exists():
            passed, errors = validate_directory(dir_name, repo_root)
            results[dir_name] = (passed, errors)

    return results


# ─── DEPENDENCY CHECKING ──────────────────────────────────────────────────────

def check_deps(dir_name: str, repo_root: Path = None) -> dict:
    """Check for broken internal dependencies in a directory."""
    if repo_root is None:
        repo_root = Path.cwd()

    dir_path = repo_root / dir_name
    if not dir_path.exists():
        return {"error": f"Directory '{dir_name}' does not exist"}

    broken_deps = []
    checked_files = 0

    # Scan TypeScript import statements
    ts_files = list(dir_path.rglob("*.ts")) + list(dir_path.rglob("*.tsx"))
    for ts_file in ts_files:
        if "node_modules" in str(ts_file):
            continue
        checked_files += 1
        try:
            content = ts_file.read_text(encoding="utf-8", errors="ignore")
            for line_num, line in enumerate(content.splitlines(), 1):
                if "from '" in line or 'from "' in line:
                    # Extract import path
                    import_path = None
                    for quote in ["'", '"']:
                        if f"from {quote}" in line:
                            start = line.index(f"from {quote}") + len(f"from {quote}")
                            end = line.index(quote, start)
                            import_path = line[start:end]
                            break

                    if import_path and (import_path.startswith("../") or import_path.startswith("./")):
                        # Resolve relative path
                        resolved = (ts_file.parent / import_path).resolve()
                        # For TypeScript ESM imports, .js specifiers resolve to .ts sources
                        # e.g. "../node/src/bootstrap.js" -> "../node/src/bootstrap.ts"
                        ts_candidate = resolved.parent / (resolved.stem + ".ts")
                        tsx_candidate = resolved.parent / (resolved.stem + ".tsx")
                        if (not resolved.exists()
                                and not ts_candidate.exists()
                                and not tsx_candidate.exists()):
                            broken_deps.append({
                                "file": str(ts_file.relative_to(repo_root)),
                                "line": line_num,
                                "import": import_path,
                            })
        except (OSError, UnicodeDecodeError):
            continue

    return {
        "directory": dir_name,
        "checked_files": checked_files,
        "broken_dependencies": broken_deps,
        "broken_count": len(broken_deps),
    }


# ─── STATUS OVERVIEW ──────────────────────────────────────────────────────────

def show_status(repo_root: Path = None) -> None:
    """Show overall architecture health status."""
    if repo_root is None:
        repo_root = Path.cwd()

    print("╔══════════════════════════════════════════════════════╗")
    print("║  MyCodeXvantaOS Architecture Health Status           ║")
    print("╚══════════════════════════════════════════════════════╝")
    print()

    # Count top-level directories
    all_dirs = [d for d in repo_root.iterdir()
                if d.is_dir() and not d.name.startswith(".")
                and d.name not in ("node_modules",)]
    target_present = [d.name for d in all_dirs if d.name in TARGET_DIRECTORIES]
    non_target = [d.name for d in all_dirs if d.name not in TARGET_DIRECTORIES]

    print(f"  Top-level directories: {len(all_dirs)} (target: ≤13)")
    print(f"  Target dirs present:   {len(target_present)}/13")
    if non_target:
        print(f"  ⚠️  Non-target dirs:   {', '.join(sorted(non_target))}")

    print()

    # Count CI workflows
    workflow_dir = repo_root / ".github" / "workflows"
    if workflow_dir.exists():
        wf_count = len(list(workflow_dir.glob("*.yml")))
        status = "✅" if wf_count <= 12 else "⚠️ "
        print(f"  {status} CI Workflows: {wf_count} (target: ≤12)")
    else:
        print("  ℹ️  .github/workflows/ not found")

    print()

    # Validate all target directories
    print("  Directory Contract Validation:")
    all_passed = True
    for dir_name in TARGET_DIRECTORIES:
        dir_path = repo_root / dir_name
        if not dir_path.exists():
            print(f"    ⬜  {dir_name:<20} (not yet created)")
            continue

        contract_path = dir_path / "directory-contract.yaml"
        if not contract_path.exists():
            print(f"    ❌  {dir_name:<20} (no directory-contract.yaml)")
            all_passed = False
            continue

        passed, errors = validate_directory(dir_name, repo_root)
        error_count = sum(1 for e in errors if e.severity == "ERROR")
        warn_count = sum(1 for e in errors if e.severity == "WARNING")

        if passed and warn_count == 0:
            print(f"    ✅  {dir_name:<20} (clean)")
        elif passed:
            print(f"    ⚠️   {dir_name:<20} ({warn_count} warnings)")
        else:
            print(f"    ❌  {dir_name:<20} ({error_count} errors)")
            all_passed = False

    print()
    if all_passed:
        print("  🎉 All directory contracts valid!")
    else:
        print("  ⚠️  Some contracts need attention. Run 'govctl validate <dir>' for details.")


# ─── CLI ENTRY POINT ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="MyCodeXvantaOS Governance Control CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 tooling/scripts/govctl.py validate contracts
  python3 tooling/scripts/govctl.py validate-all
  python3 tooling/scripts/govctl.py check-deps services
  python3 tooling/scripts/govctl.py status
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # validate command
    validate_parser = subparsers.add_parser("validate", help="Validate a directory contract")
    validate_parser.add_argument("directory", help="Directory name to validate")
    validate_parser.add_argument("--repo-root", default=".", help="Repo root path (default: .)")

    # validate-all command
    validate_all_parser = subparsers.add_parser("validate-all", help="Validate all target directories")
    validate_all_parser.add_argument("--repo-root", default=".", help="Repo root path (default: .)")

    # check-deps command
    deps_parser = subparsers.add_parser("check-deps", help="Check for broken dependencies")
    deps_parser.add_argument("directory", help="Directory to scan")
    deps_parser.add_argument("--repo-root", default=".", help="Repo root path (default: .)")

    # status command
    status_parser = subparsers.add_parser("status", help="Show architecture health status")
    status_parser.add_argument("--repo-root", default=".", help="Repo root path (default: .)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    repo_root = Path(args.repo_root).resolve()

    # ── validate ──
    if args.command == "validate":
        passed, errors = validate_directory(args.directory, repo_root)

        if not errors:
            print(f"✅ {args.directory}/directory-contract.yaml — valid (no issues)")
            sys.exit(0)

        has_error_level = any(e.severity == "ERROR" for e in errors)

        for e in errors:
            icon = "❌" if e.severity == "ERROR" else "⚠️ "
            print(f"{icon} {e}")

        if has_error_level:
            print(f"\n❌ {args.directory}: FAILED ({sum(1 for e in errors if e.severity=='ERROR')} errors)")
            sys.exit(1)
        else:
            print(f"\n⚠️  {args.directory}: PASSED with {len(errors)} warnings")
            sys.exit(0)

    # ── validate-all ──
    elif args.command == "validate-all":
        results = validate_all(repo_root)
        total_pass = 0
        total_fail = 0

        for dir_name, (passed, errors) in results.items():
            error_count = sum(1 for e in errors if e.severity == "ERROR")
            warn_count = sum(1 for e in errors if e.severity == "WARNING")

            if passed and warn_count == 0:
                print(f"✅ {dir_name}")
                total_pass += 1
            elif passed:
                print(f"⚠️  {dir_name} ({warn_count} warnings)")
                total_pass += 1
            else:
                print(f"❌ {dir_name} ({error_count} errors)")
                for e in errors:
                    if e.severity == "ERROR":
                        print(f"     → {e.message}")
                total_fail += 1

        print(f"\n{'='*40}")
        print(f"PASS: {total_pass}  FAIL: {total_fail}")

        if total_fail > 0:
            sys.exit(1)

    # ── check-deps ──
    elif args.command == "check-deps":
        result = check_deps(args.directory, repo_root)

        if "error" in result:
            print(f"❌ {result['error']}")
            sys.exit(1)

        broken = result["broken_dependencies"]
        print(f"Directory: {result['directory']}")
        print(f"Files checked: {result['checked_files']}")
        print(f"Broken dependencies: {result['broken_count']}")

        if broken:
            print("\nBroken imports:")
            for dep in broken[:20]:  # Show first 20
                print(f"  {dep['file']}:{dep['line']} → {dep['import']}")
            if len(broken) > 20:
                print(f"  ... and {len(broken) - 20} more")
            sys.exit(1)
        else:
            print("✅ No broken dependencies found")

    # ── status ──
    elif args.command == "status":
        show_status(repo_root)


if __name__ == "__main__":
    main()
