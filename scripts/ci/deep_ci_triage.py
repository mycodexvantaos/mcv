#!/usr/bin/env python3
"""
Deep CI triage for MyCodexVantaOS.

Rationale:
Provides deterministic local reproduction of CI topology failures:
- JSON syntax and duplicate-key detection
- YAML syntax and YAML 1.1 boolean-key trap detection
- GitHub workflow structural validation
- Workflow job `needs` graph validation
- Duplicate scanner workflow detection
- Security config presence validation

This script does not skip or weaken CI. It prevents CI failure classes from
being discovered only after remote execution.

Document ID: IM-MCV-003
"""

from __future__ import annotations

import json
import pathlib
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from typing import Any

try:
    import yaml
except ImportError as exc:
    print("ERROR: PyYAML is required. Install with: pip install pyyaml", file=sys.stderr)
    raise SystemExit(2) from exc


ROOT = pathlib.Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"

SCANNER_KEYWORDS = {
    "codeql": ("codeql", "github/codeql-action"),
    "semgrep": ("semgrep",),
    "trivy": ("trivy", "aquasecurity/trivy"),
    "checkov": ("checkov", "bridgecrewio/checkov"),
    "gitleaks": ("gitleaks",),
}


@dataclass(frozen=True)
class Finding:
    severity: str
    file: str
    message: str


class DuplicateKeyDetector(dict):
    """JSON object_pairs_hook that raises on duplicate keys."""

    def __init__(self, pairs: list[tuple[str, Any]]) -> None:
        seen: set[str] = set()
        dupes: list[str] = []
        for key, value in pairs:
            if key in seen:
                dupes.append(key)
            seen.add(key)
            self[key] = value
        if dupes:
            raise ValueError(f"duplicate JSON key(s): {', '.join(sorted(set(dupes)))}")


def rel(path: pathlib.Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def read(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8")


def is_ignored(path: pathlib.Path) -> bool:
    ignored = {"node_modules", ".next", "dist", "build", "coverage", ".turbo", ".git"}
    parts = path.parts
    if any(part in ignored for part in parts):
        return True
    # Helm templates contain Go template syntax {{ ... }} — not valid pure YAML
    if "templates" in parts and any(p in parts for p in ("helm", "charts")):
        return True
    # ArgoCD manifests are multi-document YAML with non-standard structure
    if "argocd" in parts:
        return True
    return False


def collect_json_findings() -> list[Finding]:
    findings: list[Finding] = []
    for path in ROOT.rglob("*.json"):
        if is_ignored(path):
            continue
        try:
            json.loads(read(path), object_pairs_hook=DuplicateKeyDetector)
        except Exception as exc:
            findings.append(Finding("ERROR", rel(path), f"invalid JSON: {exc}"))
    return findings


def collect_yaml_findings() -> list[Finding]:
    findings: list[Finding] = []
    for path in list(ROOT.rglob("*.yaml")) + list(ROOT.rglob("*.yml")):
        if is_ignored(path):
            continue

        text = read(path)

        if ".github/workflows" in rel(path):
            if re.search(r"(?m)^true:\s*$", text):
                findings.append(Finding("ERROR", rel(path), "workflow trigger key is `true:`; use quoted `\"on\":`"))
            if re.search(r"(?m)^on:\s*$", text):
                findings.append(Finding("WARN", rel(path), "bare `on:` is YAML 1.1 unsafe; use quoted `\"on\":`"))

        try:
            parsed = yaml.safe_load(text)
        except Exception as exc:
            findings.append(Finding("ERROR", rel(path), f"invalid YAML: {exc}"))
            continue

        if isinstance(parsed, dict):
            if True in parsed:
                findings.append(Finding("ERROR", rel(path), "boolean key True detected; likely `on:` coercion bug"))
            if False in parsed:
                findings.append(Finding("ERROR", rel(path), "boolean key False detected; likely YAML boolean-key coercion"))

    return findings


def normalize_needs(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [str(item) for item in value]
    return []


def collect_workflow_findings() -> list[Finding]:
    findings: list[Finding] = []
    if not WORKFLOWS.exists():
        return [Finding("ERROR", rel(WORKFLOWS), "workflow directory missing")]

    scanner_to_files: dict[str, list[str]] = defaultdict(list)

    for path in sorted(list(WORKFLOWS.glob("*.yml")) + list(WORKFLOWS.glob("*.yaml"))):
        text = read(path)
        lowered = text.lower()

        for scanner, needles in SCANNER_KEYWORDS.items():
            if any(needle in lowered for needle in needles):
                scanner_to_files[scanner].append(rel(path))

        try:
            doc = yaml.safe_load(text)
        except Exception:
            continue

        if not isinstance(doc, dict):
            findings.append(Finding("ERROR", rel(path), "workflow root must be mapping"))
            continue

        if "on" not in doc:
            findings.append(Finding("ERROR", rel(path), "workflow missing quoted `\"on\"` trigger key"))

        jobs = doc.get("jobs")
        if not isinstance(jobs, dict) or not jobs:
            findings.append(Finding("ERROR", rel(path), "workflow missing non-empty jobs map"))
            continue

        job_ids = set(jobs.keys())
        for job_id, job in jobs.items():
            if not isinstance(job, dict):
                findings.append(Finding("ERROR", rel(path), f"job `{job_id}` must be mapping"))
                continue
            for need in normalize_needs(job.get("needs")):
                if need not in job_ids:
                    findings.append(Finding("ERROR", rel(path), f"job `{job_id}` needs unknown job `{need}`"))

    for scanner, files in sorted(scanner_to_files.items()):
        if len(files) > 2:
            findings.append(
                Finding(
                    "WARN",
                    ".github/workflows",
                    f"scanner `{scanner}` appears in {len(files)} workflows: {', '.join(files)}",
                )
            )

    return findings


def collect_security_config_findings() -> list[Finding]:
    findings: list[Finding] = []
    expected_paths = [
        ".gitleaks.toml",
        ".semgrep.yml",
        ".trivyignore",
        ".checkov.yml",
    ]

    for item in expected_paths:
        path = ROOT / item
        if not path.exists():
            findings.append(Finding("WARN", item, "security scanner config missing; scanner may fail noisily"))

    return findings


def main() -> int:
    findings = (
        collect_json_findings()
        + collect_yaml_findings()
        + collect_workflow_findings()
        + collect_security_config_findings()
    )

    errors = [f for f in findings if f.severity == "ERROR"]
    warnings = [f for f in findings if f.severity == "WARN"]

    for finding in findings:
        prefix = "::error::" if finding.severity == "ERROR" else "::warning::"
        print(f"{prefix}{finding.file}: {finding.message}")

    print(f"Deep CI triage complete: {len(errors)} error(s), {len(warnings)} warning(s)")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
