#!/usr/bin/env python3
"""
classify-packages.py — Phase 4 Package Classifier

Classifies packages in packages/, services/, modules/ directories into:
- business_logic → target: services/
- deployment_stub → target: infra/deployments/
- yaml_manifest   → target: contracts/capabilities/ (should be done in Phase 1)
- already_moved   → contracts/ (done in Phase 1)
- hold            → packages/runtime (move last in Phase 4)

Usage:
  python3 tooling/scripts/classify-packages.py
  python3 tooling/scripts/classify-packages.py --source packages/ services/ modules/
  python3 tooling/scripts/classify-packages.py --output /tmp/classification.csv
"""

import sys
import os
import json
import csv
import argparse
from pathlib import Path
from dataclasses import dataclass, field


# ─── DATA CLASSES ─────────────────────────────────────────────────────────────

@dataclass
class PackageInfo:
    path: str
    name: str
    declared_name: str  # From package.json "name" field
    ts_files: int
    ts_lines: int
    yaml_files: int
    has_dockerfile: bool
    has_k8s_manifest: bool
    has_server_code: bool
    has_business_logic: bool
    is_held: bool       # True for @mycodexvantaos/runtime
    dependents: int     # How many packages depend on this
    classification: str = ""
    target: str = ""
    notes: str = ""


# ─── DETECTION HELPERS ────────────────────────────────────────────────────────

SKIP_DIRS = {"node_modules", ".git", "dist", "build", "__pycache__"}

# Indicators that code has HTTP server / deployment stub characteristics
SERVER_PATTERNS = [
    "express(", "fastify(", "new Koa(", "createServer(",
    "app.listen(", "server.listen(",
    "Router()", "@Controller", "http.createServer",
    "@Get(", "@Post(", "@Put(", "@Delete(",
]

# Indicators of business logic (domain operations)
BUSINESS_LOGIC_PATTERNS = [
    "class.*Service", "class.*Repository", "class.*UseCase",
    "interface.*Port", "implements.*Port",
    "createDomain", "DomainEvent", "AggregateRoot",
    "async.*execute(", "async.*handle(",
    "export.*function", "export.*class", "export.*interface",
]

# Packages that must be moved last (highest dependency count)
HOLD_PACKAGES = {"runtime"}

# Packages already moved in Phase 1
ALREADY_MOVED_PACKAGES = {"core", "ports", "contracts-sdk", "mycodexvantaos-contracts-sdk"}


def count_dependents(pkg_name: str, repo_root: Path) -> int:
    """Count how many package.json files list this package as a dependency."""
    if not pkg_name:
        return 0

    count = 0
    for pkg_json in repo_root.rglob("package.json"):
        if any(skip in pkg_json.parts for skip in SKIP_DIRS):
            continue
        try:
            data = json.loads(pkg_json.read_text())
        except (json.JSONDecodeError, OSError):
            continue

        all_deps = {}
        for section in ["dependencies", "devDependencies", "peerDependencies"]:
            all_deps.update(data.get(section, {}))

        # Check if this package is the declared package itself
        if data.get("name") == pkg_name:
            continue

        if pkg_name in all_deps:
            count += 1

    return count


def analyze_ts_content(dir_path: Path) -> tuple[int, int, bool, bool]:
    """
    Analyze TypeScript files in a directory.
    Returns: (file_count, line_count, has_server_code, has_business_logic)
    """
    file_count = 0
    line_count = 0
    has_server = False
    has_business = False

    for ts_file in dir_path.rglob("*.ts"):
        if any(skip in ts_file.parts for skip in SKIP_DIRS):
            continue
        if ts_file.suffix not in (".ts", ".tsx"):
            continue

        file_count += 1
        try:
            content = ts_file.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue

        lines = content.splitlines()
        line_count += len(lines)

        # Check content patterns
        for pattern in SERVER_PATTERNS:
            if pattern in content:
                has_server = True
                break

        for pattern in BUSINESS_LOGIC_PATTERNS:
            import re
            if re.search(pattern, content):
                has_business = True
                break

    return file_count, line_count, has_server, has_business


def has_k8s_manifests(dir_path: Path) -> bool:
    """Check if directory has Kubernetes manifests."""
    for yaml_file in dir_path.rglob("*.yaml"):
        try:
            content = yaml_file.read_text(encoding="utf-8", errors="ignore")
            if "kind:" in content and ("Deployment" in content or
                                       "Service" in content or
                                       "ConfigMap" in content):
                return True
        except OSError:
            continue
    return False


def classify_package(pkg_info: PackageInfo) -> tuple[str, str, str]:
    """
    Classify a package and return (classification, target, notes).
    """
    base_name = Path(pkg_info.path).name

    # Already moved in Phase 1
    if base_name in ALREADY_MOVED_PACKAGES:
        return "already_moved", "contracts/", "Moved in Phase 1"

    # Hold packages (move last)
    if base_name in HOLD_PACKAGES or pkg_info.is_held:
        return "hold", "services/runtime (move last in Phase 4.6)", \
               f"High-risk: {pkg_info.dependents} dependents"

    # Pure YAML manifest (no TS code)
    if pkg_info.ts_files == 0 and pkg_info.yaml_files > 0:
        return "yaml_manifest", "contracts/capabilities/", "Pure YAML, no TypeScript"

    # Deployment stub (has Dockerfile or K8s manifests + minimal TS)
    if pkg_info.has_dockerfile or pkg_info.has_k8s_manifest:
        if pkg_info.ts_lines < 500:
            return "deployment_stub", "infra/deployments/", \
                   "Has Dockerfile/K8s manifests, thin TS layer"
        else:
            return "deployment_stub", "infra/deployments/ (partial → services/)", \
                   "Has Dockerfile AND significant TS — split may be needed"

    # Business logic (substantial TS code)
    if pkg_info.ts_files > 0 and pkg_info.has_business_logic:
        return "business_logic", f"services/{Path(pkg_info.path).name}/", \
               f"{pkg_info.ts_lines} lines of business logic"

    # Has some TS but unclear
    if pkg_info.ts_files > 0:
        return "business_logic", f"services/{Path(pkg_info.path).name}/",\
               f"Default: {pkg_info.ts_lines} lines TS, review recommended"

    # Empty or unclear
    return "review_needed", "UNKNOWN", "Insufficient data for automatic classification"


# ─── SCANNER ──────────────────────────────────────────────────────────────────

def scan_directory(source_dir: Path, repo_root: Path) -> list[PackageInfo]:
    """Scan a source directory and return PackageInfo for each subdirectory."""
    packages = []

    if not source_dir.exists():
        return packages

    for subdir in sorted(source_dir.iterdir()):
        if not subdir.is_dir():
            continue
        if subdir.name in SKIP_DIRS:
            continue

        # Read package.json if exists
        pkg_json = subdir / "package.json"
        declared_name = ""
        if pkg_json.exists():
            try:
                data = json.loads(pkg_json.read_text())
                declared_name = data.get("name", "")
            except (json.JSONDecodeError, OSError):
                pass

        # Analyze TypeScript content
        ts_files, ts_lines, has_server, has_business = analyze_ts_content(subdir)

        # Count YAML files
        yaml_files = sum(
            1 for f in subdir.rglob("*.yaml")
            if not any(skip in f.parts for skip in SKIP_DIRS)
        )

        # Check for deployment markers
        has_dockerfile = (subdir / "Dockerfile").exists()
        has_k8s = has_k8s_manifests(subdir)

        # Check if this is a hold package
        is_held = subdir.name in HOLD_PACKAGES

        # Count dependents
        dependents = 0
        if declared_name:
            dependents = count_dependents(declared_name, repo_root)

        pkg_info = PackageInfo(
            path=str(subdir.relative_to(repo_root)),
            name=subdir.name,
            declared_name=declared_name,
            ts_files=ts_files,
            ts_lines=ts_lines,
            yaml_files=yaml_files,
            has_dockerfile=has_dockerfile,
            has_k8s_manifest=has_k8s,
            has_server_code=has_server,
            has_business_logic=has_business,
            is_held=is_held,
            dependents=dependents,
        )

        # Classify
        classification, target, notes = classify_package(pkg_info)
        pkg_info.classification = classification
        pkg_info.target = target
        pkg_info.notes = notes

        packages.append(pkg_info)

    return packages


# ─── REPORTING ────────────────────────────────────────────────────────────────

def print_summary(all_packages: list[PackageInfo]) -> None:
    """Print a summary report to stdout."""
    from collections import Counter
    counts = Counter(p.classification for p in all_packages)

    print("=" * 70)
    print("PACKAGE CLASSIFICATION SUMMARY (Phase 4)")
    print("=" * 70)
    print()
    print(f"  Total packages analyzed: {len(all_packages)}")
    print()
    print("  Classification breakdown:")
    print(f"    business_logic   → services/:           {counts['business_logic']}")
    print(f"    deployment_stub  → infra/deployments/:  {counts['deployment_stub']}")
    print(f"    yaml_manifest    → contracts/:          {counts['yaml_manifest']}")
    print(f"    already_moved    → contracts/ (done):   {counts['already_moved']}")
    print(f"    hold             → services/ (last):    {counts['hold']}")
    print(f"    review_needed    → manual review:       {counts['review_needed']}")
    print()

    # High-risk packages (many dependents)
    high_risk = [p for p in all_packages if p.dependents > 5]
    if high_risk:
        print("  ⚠️  High-risk packages (>5 dependents):")
        for p in sorted(high_risk, key=lambda x: -x.dependents):
            print(f"    {p.declared_name or p.name}: {p.dependents} dependents → {p.target}")
        print()

    # Packages needing review
    review = [p for p in all_packages if p.classification == "review_needed"]
    if review:
        print("  ❓ Packages needing manual review:")
        for p in review:
            print(f"    {p.path}")
        print()

    print("=" * 70)


def write_csv(packages: list[PackageInfo], output_path: str) -> None:
    """Write classification results to CSV."""
    fieldnames = [
        "Package", "DeclaredName", "Path", "TSFiles", "TSLines",
        "YAMLFiles", "HasDockerfile", "HasK8s", "HasServerCode",
        "HasBusinessLogic", "Dependents", "Classification", "Target", "Notes"
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for p in packages:
            writer.writerow({
                "Package": p.name,
                "DeclaredName": p.declared_name,
                "Path": p.path,
                "TSFiles": p.ts_files,
                "TSLines": p.ts_lines,
                "YAMLFiles": p.yaml_files,
                "HasDockerfile": p.has_dockerfile,
                "HasK8s": p.has_k8s_manifest,
                "HasServerCode": p.has_server_code,
                "HasBusinessLogic": p.has_business_logic,
                "Dependents": p.dependents,
                "Classification": p.classification,
                "Target": p.target,
                "Notes": p.notes,
            })

    print(f"✅ Classification written to: {output_path}")


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Phase 4 package classifier — classifies packages for architecture migration",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "--source", nargs="+",
        default=["packages", "services", "modules"],
        help="Source directories to scan (default: packages/ services/ modules/)"
    )
    parser.add_argument(
        "--output", default="/tmp/phase4-classification.csv",
        help="Output CSV path (default: /tmp/phase4-classification.csv)"
    )
    parser.add_argument(
        "--repo-root", default=".",
        help="Repo root path (default: .)"
    )
    parser.add_argument(
        "--format", choices=["text", "csv", "both"], default="both",
        help="Output format (default: both)"
    )

    args = parser.parse_args()
    repo_root = Path(args.repo_root).resolve()

    all_packages = []

    for source_name in args.source:
        source_dir = repo_root / source_name
        if not source_dir.exists():
            print(f"  ⚠️  Skipping {source_name}/ (not found)")
            continue

        print(f"Scanning {source_name}/...")
        pkgs = scan_directory(source_dir, repo_root)
        all_packages.extend(pkgs)
        print(f"  Found {len(pkgs)} packages")

    print()

    if not all_packages:
        print("No packages found. Ensure you're running from the repo root.")
        sys.exit(1)

    if args.format in ("text", "both"):
        print_summary(all_packages)

    if args.format in ("csv", "both"):
        write_csv(all_packages, args.output)

    # Exit with error if review_needed packages exist
    review_count = sum(1 for p in all_packages if p.classification == "review_needed")
    if review_count > 0:
        print(f"\n⚠️  {review_count} package(s) need manual review. Check the CSV.")
        # Don't exit with error — let the team review manually


if __name__ == "__main__":
    main()
