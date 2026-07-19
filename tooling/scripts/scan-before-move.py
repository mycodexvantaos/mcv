#!/usr/bin/env python3
"""
scan-before-move.py — Pre-flight dependency scanner for directory moves.

Before moving any directory, run this script to identify:
1. Which files import from the source directory
2. Which package.json files reference it
3. Which CI workflows reference its path
4. Whether the move is safe (0 unknown consumers)

Usage:
  python3 tooling/scripts/scan-before-move.py --source providers/
  python3 tooling/scripts/scan-before-move.py --source packages/auth --target services/auth
  python3 tooling/scripts/scan-before-move.py --check-all
  python3 tooling/scripts/scan-before-move.py --source services/ --check-only
"""

import sys
import os
import re
import json
import argparse
from pathlib import Path
from collections import defaultdict


# ─── CONSTANTS ────────────────────────────────────────────────────────────────

# File patterns to scan
CODE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".py", ".sh"}
CONFIG_EXTENSIONS = {".json", ".yaml", ".yml", ".toml", ".cfg"}

# Directories to skip
SKIP_DIRS = {"node_modules", ".git", ".cache", "dist", "build", "__pycache__"}


# ─── SCANNING FUNCTIONS ───────────────────────────────────────────────────────

def find_source_references(source_dir: str, repo_root: Path) -> dict:
    """
    Find all references to source_dir across the entire repository.
    Returns categorized references.
    """
    source_path = Path(source_dir)
    source_name = source_path.name
    source_str = str(source_path).replace("\\", "/")

    # Patterns to search for
    patterns = [
        source_str,           # Full relative path: providers/
        f"/{source_str}",     # With leading slash: /providers/
        f'"{source_name}"',   # Quoted directory name
        f"'{source_name}'",   # Single-quoted name
    ]

    results = {
        "typescript_imports": [],
        "python_imports": [],
        "package_json_refs": [],
        "ci_workflow_refs": [],
        "config_file_refs": [],
        "other_refs": [],
    }

    total_files_scanned = 0

    for file_path in repo_root.rglob("*"):
        # Skip non-files and skipped directories
        if not file_path.is_file():
            continue
        if any(skip in file_path.parts for skip in SKIP_DIRS):
            continue

        total_files_scanned += 1
        ext = file_path.suffix.lower()
        rel_path = str(file_path.relative_to(repo_root))

        # Don't report references within the source directory itself
        if rel_path.startswith(source_str + "/") or rel_path == source_str:
            continue

        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except (OSError, PermissionError):
            continue

        # Check each pattern
        for pattern in patterns:
            if pattern not in content:
                continue

            lines_with_refs = []
            for line_num, line in enumerate(content.splitlines(), 1):
                if pattern in line and not line.strip().startswith("#"):
                    lines_with_refs.append((line_num, line.strip()))

            if not lines_with_refs:
                continue

            ref_entry = {
                "file": rel_path,
                "pattern": pattern,
                "occurrences": lines_with_refs[:5],  # Show first 5 matches
                "total_matches": len(lines_with_refs),
            }

            # Categorize by file type
            if ext in {".ts", ".tsx", ".js", ".jsx"} and "workflow" not in rel_path:
                results["typescript_imports"].append(ref_entry)
            elif ext == ".py":
                results["python_imports"].append(ref_entry)
            elif file_path.name == "package.json":
                results["package_json_refs"].append(ref_entry)
            elif ".github/workflows" in rel_path:
                results["ci_workflow_refs"].append(ref_entry)
            elif ext in {".yaml", ".yml", ".toml", ".cfg"}:
                results["config_file_refs"].append(ref_entry)
            else:
                results["other_refs"].append(ref_entry)

            break  # Only count each file once

    results["_meta"] = {
        "source": source_str,
        "total_files_scanned": total_files_scanned,
        "total_references": sum(
            len(v) for k, v in results.items() if not k.startswith("_")
        ),
    }

    return results


def check_package_name_refs(source_dir: str, repo_root: Path) -> list[dict]:
    """
    Check for npm package name references (@mycodexvantaos/<name>) in package.json files.
    These are safe to move (pnpm workspace resolves by name, not path).
    """
    source_path = Path(source_dir)
    pkg_json = source_path / "package.json"

    if not (repo_root / pkg_json).exists():
        return []

    try:
        data = json.loads((repo_root / pkg_json).read_text())
        pkg_name = data.get("name", "")
    except (json.JSONDecodeError, OSError):
        return []

    if not pkg_name:
        return []

    refs = []
    for file_path in repo_root.rglob("package.json"):
        if any(skip in file_path.parts for skip in SKIP_DIRS):
            continue
        if file_path == repo_root / pkg_json:
            continue

        try:
            pkg_data = json.loads(file_path.read_text())
        except (json.JSONDecodeError, OSError):
            continue

        all_deps = {}
        for dep_section in ["dependencies", "devDependencies", "peerDependencies"]:
            all_deps.update(pkg_data.get(dep_section, {}))

        if pkg_name in all_deps:
            refs.append({
                "consumer": str(file_path.relative_to(repo_root)),
                "consumer_name": pkg_data.get("name", "(unknown)"),
                "version": all_deps[pkg_name],
            })

    return refs


def check_pnpm_workspace(source_dir: str, repo_root: Path) -> dict:
    """Check if source_dir pattern appears in pnpm-workspace.yaml."""
    workspace_file = repo_root / "pnpm-workspace.yaml"
    if not workspace_file.exists():
        return {"found": False, "content": None}

    content = workspace_file.read_text()
    source_name = Path(source_dir).name

    return {
        "found": source_name in content or source_dir in content,
        "relevant_lines": [
            (i + 1, line.strip())
            for i, line in enumerate(content.splitlines())
            if source_name in line or source_dir in line
        ],
    }


# ─── REPORTING ────────────────────────────────────────────────────────────────

def format_report(source_dir: str, results: dict, pkg_refs: list, workspace: dict,
                  target_dir: str = None) -> str:
    """Format the scan results as a human-readable report."""
    lines = []
    meta = results.get("_meta", {})

    lines.append("=" * 60)
    lines.append(f"SCAN BEFORE MOVE: {source_dir}")
    if target_dir:
        lines.append(f"TARGET: {target_dir}")
    lines.append("=" * 60)
    lines.append(f"Files scanned: {meta.get('total_files_scanned', 0)}")
    lines.append(f"Total path references: {meta.get('total_references', 0)}")
    lines.append("")

    # Package name references (safe to move)
    if pkg_refs:
        lines.append(f"📦 Package name consumers ({len(pkg_refs)}) — SAFE (pnpm resolves by name):")
        for ref in pkg_refs[:10]:
            lines.append(f"   {ref['consumer_name']} ({ref['consumer']})")
        if len(pkg_refs) > 10:
            lines.append(f"   ... and {len(pkg_refs) - 10} more")
        lines.append("")

    # pnpm workspace
    if workspace.get("found"):
        lines.append("⚠️  pnpm-workspace.yaml REQUIRES UPDATE:")
        for line_num, line in workspace.get("relevant_lines", []):
            lines.append(f"   line {line_num}: {line}")
        lines.append("")

    # TypeScript/JS imports (PATH-sensitive — need updating)
    ts_refs = results.get("typescript_imports", [])
    if ts_refs:
        lines.append(f"❗ TypeScript/JS path references ({len(ts_refs)}) — NEED UPDATING:")
        for ref in ts_refs[:15]:
            lines.append(f"   {ref['file']} ({ref['total_matches']} occurrences)")
            for line_num, line in ref['occurrences'][:2]:
                lines.append(f"     line {line_num}: {line[:80]}")
        if len(ts_refs) > 15:
            lines.append(f"   ... and {len(ts_refs) - 15} more files")
        lines.append("")

    # Python imports
    py_refs = results.get("python_imports", [])
    if py_refs:
        lines.append(f"❗ Python path references ({len(py_refs)}) — NEED UPDATING:")
        for ref in py_refs[:10]:
            lines.append(f"   {ref['file']}")
        lines.append("")

    # CI Workflows
    ci_refs = results.get("ci_workflow_refs", [])
    if ci_refs:
        lines.append(f"⚠️  CI Workflow references ({len(ci_refs)}) — NEED UPDATING:")
        for ref in ci_refs:
            lines.append(f"   {ref['file']} ({ref['total_matches']} occurrences)")
        lines.append("")

    # Config files
    cfg_refs = results.get("config_file_refs", [])
    if cfg_refs:
        lines.append(f"ℹ️  Config file references ({len(cfg_refs)}):")
        for ref in cfg_refs[:5]:
            lines.append(f"   {ref['file']}")
        lines.append("")

    # Safety assessment
    path_refs = len(ts_refs) + len(py_refs)
    ci_ref_count = len(ci_refs)
    ws_needs_update = workspace.get("found", False)

    lines.append("─" * 40)
    lines.append("SAFETY ASSESSMENT:")
    if path_refs == 0 and ci_ref_count == 0 and not ws_needs_update:
        lines.append("✅ SAFE TO MOVE — no path references found")
    else:
        lines.append("⚠️  REVIEW REQUIRED before moving:")
        if path_refs > 0:
            lines.append(f"   - {path_refs} code files reference this path directly")
        if ci_ref_count > 0:
            lines.append(f"   - {ci_ref_count} CI workflow(s) reference this path")
        if ws_needs_update:
            lines.append("   - pnpm-workspace.yaml needs updating")
        lines.append("")
        lines.append("   Update all references BEFORE or SIMULTANEOUSLY with the move.")
        lines.append("   Use the CI path-update commands in the relevant phase doc.")

    lines.append("=" * 60)
    return "\n".join(lines)


def check_all_directories(repo_root: Path) -> None:
    """Check all known directories for any broken path references."""
    print("=== Checking all target directories for internal consistency ===\n")

    target_dirs = [
        "contracts", "governance", "adapters", "services",
        "intelligence", "data", "infra", "apps", "release",
        "tooling", "tests", "docs", "runtime-mesh"
    ]

    issues_found = 0

    for dir_name in target_dirs:
        dir_path = repo_root / dir_name
        if not dir_path.exists():
            continue

        # Check if directory-contract.yaml exists
        contract = dir_path / "directory-contract.yaml"
        if not contract.exists():
            print(f"  ⚠️  {dir_name}: missing directory-contract.yaml")
            issues_found += 1
        else:
            print(f"  ✅ {dir_name}: contract present")

    print()

    # Check for any remaining references to renamed directories
    old_dirs = ["providers", "python", "runtimes", "argocd", "gitops-controlplane",
                "web-deploy", "migrations", "knowledge-graph", "vector-store",
                "artifacts", "staging", "scripts", "tools"]

    for old_dir in old_dirs:
        old_path = repo_root / old_dir
        if old_path.exists():
            print(f"  ❌ Old directory still exists: {old_dir}/")
            issues_found += 1

    print()
    if issues_found == 0:
        print("✅ All checks passed — architecture is consistent")
    else:
        print(f"⚠️  {issues_found} issue(s) found")
        sys.exit(1)


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Pre-flight dependency scanner for directory moves",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 tooling/scripts/scan-before-move.py --source providers/
  python3 tooling/scripts/scan-before-move.py --source packages/auth --target services/auth
  python3 tooling/scripts/scan-before-move.py --check-all
  python3 tooling/scripts/scan-before-move.py --source services/ --check-only
        """
    )

    parser.add_argument("--source", help="Source directory to scan")
    parser.add_argument("--target", help="Target directory (for report context)")
    parser.add_argument("--repo-root", default=".", help="Repo root (default: .)")
    parser.add_argument("--report-format", choices=["text", "json"], default="text",
                        help="Output format (default: text)")
    parser.add_argument("--check-only", action="store_true",
                        help="Exit with non-zero if any path refs found (for CI)")
    parser.add_argument("--check-all", action="store_true",
                        help="Check all target directories for consistency")

    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()

    if args.check_all:
        check_all_directories(repo_root)
        return

    if not args.source:
        parser.print_help()
        sys.exit(0)

    # Normalize source path
    source_dir = args.source.rstrip("/")

    print(f"Scanning references to: {source_dir}/")
    print(f"Repository root: {repo_root}")
    print()

    # Run scans
    results = find_source_references(source_dir, repo_root)
    pkg_refs = check_package_name_refs(source_dir, repo_root)
    workspace = check_pnpm_workspace(source_dir, repo_root)

    if args.report_format == "json":
        output = {
            "source": source_dir,
            "target": args.target,
            "direct_references": results["_meta"]["total_references"],
            "package_consumers": len(pkg_refs),
            "workspace_references": 1 if workspace.get("found") else 0,
            "ci_references": len(results.get("ci_workflow_refs", [])),
            "typescript_path_refs": len(results.get("typescript_imports", [])),
            "python_path_refs": len(results.get("python_imports", [])),
            "affected_workflows": [r["file"] for r in results.get("ci_workflow_refs", [])],
            "details": results,
        }
        print(json.dumps(output, indent=2))
    else:
        print(format_report(source_dir, results, pkg_refs, workspace, args.target))

    # Exit code for CI
    if args.check_only:
        path_refs = (len(results.get("typescript_imports", [])) +
                     len(results.get("python_imports", [])))
        if path_refs > 0 or workspace.get("found"):
            sys.exit(1)


if __name__ == "__main__":
    main()
