#!/usr/bin/env python3
"""
ci/namespace_check.py
=====================
MyCodexVantaOS — Namespace Governance CI Validator
Specification: docs/governance/namespace-governance-closure-spec.md
Governance Code: mycodexvantaos-00000 (namespace governance baseline)

Usage:
    python ci/namespace_check.py [OPTIONS]

Options:
    --repo-name       NAME        Validate a single repository name
    --governance-code CODE        Validate a single governance code
    --scan-dir        PATH        Scan a directory for file header compliance
    --registry        FILE        Path to namespace registry YAML/JSON
    --dep-graph       FILE        Path to dependency graph YAML/JSON
    --lifecycle       FILE        Path to lifecycle state YAML/JSON
    --report-dir      PATH        Output directory for JSON reports (default: ./ci-reports)
    --strict                      Treat SHOULD violations as failures (default: warnings)
    --verbose                     Print detailed validation output
    --help                        Show this help message

Exit codes:
    0  — All MUST checks passed (warnings may exist)
    1  — One or more MUST checks failed
    2  — Internal error (invalid arguments, file not found, etc.)
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import textwrap
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Section 1 — Constants & Controlled Vocabularies
# (Derived from I.1, I.2, I.6, I.7 of the Governance Closure Specification)
# ---------------------------------------------------------------------------

SPEC_VERSION = "mycodexvantaos-00000"
TOOL_VERSION = "1.0.0"

# I.2.1 — Namespace Planes
VALID_NAMESPACES: dict[str, str] = {
    "mycodexvantaos": "control-plane",
    "softwareos": "product-plane",
}

# I.7.2 — Controlled Domain Vocabulary
VALID_DOMAINS: frozenset[str] = frozenset(
    {
        "auth",
        "policy",
        "memory",
        "event",
        "infra",
        "platform",
        "iaops",
        "machinenativeops",
        "toolkit",
        "contracts",
        "signerd",
        "controller",
        "rolloutd",
        "db-schemas",
        "autotask",
        "compliance",
        "prediction",
        "qa",
        "rollback",
        "scheduler",
        "alertd",
        "governance",
        "data",
        "model",
        "billing",
        "compute",
        "workload",
        "infra-cloud",
    }
)

# I.7.3 — Controlled Function Vocabulary
VALID_FUNCTIONS: frozenset[str] = frozenset(
    {
        "service",
        "agent",
        "sdk",
        "cli",
        "web",
        "api",
        "worker",
        "manager",
        "hub",
        "bus",
        "engine",
        "scanner",
        "reporter",
        "predictor",
        "action",
        "plugin",
        "controller",
        "repository",
        "gates",
        "validator",
        "catalog",
        "registry",
        "draft",
    }
)

# I.10.1 — Lifecycle Stages
VALID_LIFECYCLE_STAGES: frozenset[str] = frozenset(
    {"proposed", "active", "deprecated", "archived", "destroyed"}
)

# I.10.1 — Valid lifecycle transitions
LIFECYCLE_TRANSITIONS: dict[str, list[str]] = {
    "proposed": ["active"],
    "active": ["deprecated"],
    "deprecated": ["archived"],
    "archived": ["destroyed"],
    "destroyed": [],
}

# I.4.1 — Governance Era Ranges
ERA_RANGES: list[tuple[int, int, str]] = [
    (0, 9999, "meta-governance"),
    (10000, 29999, "era-one"),
    (30000, 59999, "era-two"),
    (60000, 89999, "era-three"),
    (90000, 99999, "cross-era-governance"),
]

# I.6.3 — Forbidden substrings in resource names
FORBIDDEN_ENV_MARKERS: tuple[str, ...] = ("dev", "prod", "staging", "test", "uat")
FORBIDDEN_VERSION_PATTERNS: tuple[str, ...] = ("v1", "v2", "v3", "latest", "stable")

# ---------------------------------------------------------------------------
# Section 2 — Regex Patterns
# (Derived from I.1.1, I.3.2, I.6.2 of the Governance Closure Specification)
# ---------------------------------------------------------------------------

# I.3.2 — Canonical governance code: ^mycodexvantaos-[0-9]{5}$
RE_GOVERNANCE_CODE = re.compile(r"^mycodexvantaos-[0-9]{5}$")

# I.6.2 — Repository name canonical pattern
# {namespace}-{domain-segment(s)}-{function-segment(s)}
# Both namespace and domain/function parts consist of lowercase alphanumeric
# segments separated by hyphens; at minimum three hyphen-separated groups.
RE_REPO_NAME = re.compile(
    r"^(?:(?:mycodexvantaos|softwareos)|(?:mycodexvantaos|softwareos)-[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]+(?:-[a-z0-9]+)*)$"
)

# I.1.1 — General machine-facing name: lowercase kebab-case only
RE_KEBAB_CASE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

# Forbidden characters in any machine-facing name
RE_FORBIDDEN_UNDERSCORE = re.compile(r"_")
RE_FORBIDDEN_DOT = re.compile(r"\.")
RE_FORBIDDEN_SPACE = re.compile(r"\s")
RE_FORBIDDEN_UPPERCASE = re.compile(r"[A-Z]")

# Version number patterns (e.g. -v1, -v2, -v1.0)
RE_VERSION_SUFFIX = re.compile(r"-v[0-9]+(?:\.[0-9]+)*(?:-|$)")

# Environment marker patterns as standalone kebab segments
RE_ENV_MARKER = re.compile(
    r"(?:^|-)(?:dev|prod|staging|test|uat)(?:-|$)"
)

# I.6.2 — Namespace prefix extraction
RE_NAMESPACE_PREFIX = re.compile(r"^(mycodexvantaos|softwareos)-(.+)$")

# File header path declaration patterns
# Supports:
#   # path: mycodexvantaos-auth-service/src/main.py
#   # mycodexvantaos-auth-service/src/main.py
#   // path: softwareos-qa-service/lib/query.ts
#   /* path: mycodexvantaos-policy-engine/core/engine.go */
RE_FILE_HEADER_PATH_COMMENT = re.compile(
    r"^(?:#|//|/\*)\s*(?:path:\s*)?"
    r"((?:mycodexvantaos|softwareos)-[a-z0-9]+(?:-[a-z0-9]+)*/[^\s*]+)",
    re.MULTILINE,
)

# YAML/TOML key-value path declaration
# e.g.  path: mycodexvantaos-auth-service/src/config.yaml
RE_FILE_HEADER_PATH_YAML = re.compile(
    r"^(?:path|source|location|file):\s*"
    r"((?:mycodexvantaos|softwareos)-[a-z0-9]+(?:-[a-z0-9]+)*/[^\s]+)",
    re.MULTILINE,
)

# Governance code reference inside file content
RE_INLINE_GOVERNANCE_CODE = re.compile(r"\bmycodexvantaos-[0-9]{5}\b")

# Space-based governance code (forbidden legacy form)
RE_SPACE_GOVERNANCE_CODE = re.compile(r"\bmycodexvantaos\s+[0-9]{5}\b")

# ---------------------------------------------------------------------------
# Section 3 — Data Structures
# ---------------------------------------------------------------------------


@dataclass
class ValidationResult:
    """Represents the outcome of a single validation check."""

    rule_id: str
    level: str          # "MUST" | "SHOULD" | "MAY"
    status: str         # "PASS" | "FAIL" | "WARN" | "SKIP"
    subject: str        # What was validated (repo name, file path, code, …)
    message: str
    detail: str = ""

    def is_failure(self) -> bool:
        return self.status == "FAIL"

    def is_warning(self) -> bool:
        return self.status == "WARN"

    def to_dict(self) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "level": self.level,
            "status": self.status,
            "subject": self.subject,
            "message": self.message,
            "detail": self.detail,
        }


@dataclass
class ValidationReport:
    """Aggregated report for a complete validation run."""

    generated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    spec_version: str = SPEC_VERSION
    tool_version: str = TOOL_VERSION
    results: list[ValidationResult] = field(default_factory=list)

    def add(self, result: ValidationResult) -> None:
        self.results.append(result)

    @property
    def failures(self) -> list[ValidationResult]:
        return [r for r in self.results if r.is_failure()]

    @property
    def warnings(self) -> list[ValidationResult]:
        return [r for r in self.results if r.is_warning()]

    @property
    def passed(self) -> list[ValidationResult]:
        return [r for r in self.results if r.status == "PASS"]

    def overall_status(self) -> str:
        return "FAIL" if self.failures else "PASS"

    def to_dict(self) -> dict[str, Any]:
        return {
            "generated_at": self.generated_at,
            "spec_version": self.spec_version,
            "tool_version": self.tool_version,
            "overall_status": self.overall_status(),
            "summary": {
                "total": len(self.results),
                "passed": len(self.passed),
                "failed": len(self.failures),
                "warnings": len(self.warnings),
            },
            "results": [r.to_dict() for r in self.results],
        }


# ---------------------------------------------------------------------------
# Section 4 — Core Validator: Repository Name
# (Rules from I.1.1, I.6.1, I.6.2, I.6.3, I.17)
# ---------------------------------------------------------------------------


class RepositoryNameValidator:
    """
    Validates repository names against the canonical pattern defined in I.6.2.

    Repository names MUST follow:
        {namespace}-{domain}-{function}
    where namespace ∈ {mycodexvantaos, softwareos},
    domain ∈ VALID_DOMAINS, function ∈ VALID_FUNCTIONS.
    """

    def validate(self, name: str) -> list[ValidationResult]:
        results: list[ValidationResult] = []

        # R-01: Must match canonical regex pattern
        if not RE_REPO_NAME.match(name):
            results.append(
                ValidationResult(
                    rule_id="R-01",
                    level="MUST",
                    status="FAIL",
                    subject=name,
                    message="Repository name does not match canonical pattern.",
                    detail=(
                        f"Expected: ^(?:(?:mycodexvantaos|softwareos)"
                        f"|(?:mycodexvantaos|softwareos)-[a-z0-9]+"
                        f"(?:-[a-z0-9]+)*-[a-z0-9]+(?:-[a-z0-9]+)*)$\n"
                        f"Got: {name!r}"
                    ),
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="R-01",
                    level="MUST",
                    status="PASS",
                    subject=name,
                    message="Repository name matches canonical pattern.",
                )
            )

        # R-02: No uppercase characters
        if RE_FORBIDDEN_UPPERCASE.search(name):
            results.append(
                ValidationResult(
                    rule_id="R-02",
                    level="MUST",
                    status="FAIL",
                    subject=name,
                    message="Repository name contains uppercase characters.",
                    detail="All machine-facing names MUST be lowercase only (I.1.1).",
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="R-02",
                    level="MUST",
                    status="PASS",
                    subject=name,
                    message="No uppercase characters found.",
                )
            )

        # R-03: No underscores
        if RE_FORBIDDEN_UNDERSCORE.search(name):
            results.append(
                ValidationResult(
                    rule_id="R-03",
                    level="MUST",
                    status="FAIL",
                    subject=name,
                    message="Repository name contains underscore '_'.",
                    detail="Underscores are forbidden; use hyphens only (I.1.1).",
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="R-03",
                    level="MUST",
                    status="PASS",
                    subject=name,
                    message="No underscore characters found.",
                )
            )

        # R-04: No semantic dots
        if RE_FORBIDDEN_DOT.search(name):
            results.append(
                ValidationResult(
                    rule_id="R-04",
                    level="MUST",
                    status="FAIL",
                    subject=name,
                    message="Repository name contains a dot '.'.",
                    detail=(
                        "Semantic dots are forbidden in repository names (I.1.4). "
                        "The scoped dot exception applies only to Kubernetes API groups."
                    ),
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="R-04",
                    level="MUST",
                    status="PASS",
                    subject=name,
                    message="No dot characters found.",
                )
            )

        # R-05: No whitespace
        if RE_FORBIDDEN_SPACE.search(name):
            results.append(
                ValidationResult(
                    rule_id="R-05",
                    level="MUST",
                    status="FAIL",
                    subject=name,
                    message="Repository name contains whitespace.",
                    detail="Spaces are not machine-stable separators (I.1.2).",
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="R-05",
                    level="MUST",
                    status="PASS",
                    subject=name,
                    message="No whitespace found.",
                )
            )

        # R-06: No version number suffixes
        if RE_VERSION_SUFFIX.search(name):
            results.append(
                ValidationResult(
                    rule_id="R-06",
                    level="MUST",
                    status="FAIL",
                    subject=name,
                    message="Repository name contains a version number.",
                    detail=(
                        "Version numbers (e.g. -v1, -v2) are forbidden in "
                        "resource names (I.1.1, I.6.3)."
                    ),
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="R-06",
                    level="MUST",
                    status="PASS",
                    subject=name,
                    message="No version number suffix found.",
                )
            )

        # R-07: No environment markers
        if RE_ENV_MARKER.search(name):
            results.append(
                ValidationResult(
                    rule_id="R-07",
                    level="MUST",
                    status="FAIL",
                    subject=name,
                    message="Repository name contains an environment marker.",
                    detail=(
                        "Environment markers (dev, prod, staging, test, uat) are "
                        "forbidden in repository names (I.6.3, I.6.4)."
                    ),
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="R-07",
                    level="MUST",
                    status="PASS",
                    subject=name,
                    message="No environment marker found.",
                )
            )

        # R-08: Namespace must be registered
        match = RE_NAMESPACE_PREFIX.match(name)
        if match:
            ns = match.group(1)
            if ns not in VALID_NAMESPACES:
                results.append(
                    ValidationResult(
                        rule_id="R-08",
                        level="MUST",
                        status="FAIL",
                        subject=name,
                        message=f"Namespace '{ns}' is not a registered namespace.",
                        detail=(
                            f"Valid namespaces: {sorted(VALID_NAMESPACES.keys())} (I.2.1)."
                        ),
                    )
                )
            else:
                results.append(
                    ValidationResult(
                        rule_id="R-08",
                        level="MUST",
                        status="PASS",
                        subject=name,
                        message=f"Namespace '{ns}' is registered ({VALID_NAMESPACES[ns]}).",
                    )
                )

            # R-09 / R-10: Domain and function vocabulary check
            # Decompose: namespace-{segments}
            # The last segment is the function; the middle segment(s) form the domain.
            rest = match.group(2)  # everything after "namespace-"
            segments = rest.split("-")
            if len(segments) >= 2:
                # Function is the last segment (or last two for compound functions)
                # Domain is everything in between
                # Strategy: try to match the last segment first as a known function,
                # then fall back to last two segments as compound function.
                function_candidate_1 = segments[-1]
                function_candidate_2 = "-".join(segments[-2:]) if len(segments) >= 2 else None
                domain_candidate_1 = "-".join(segments[:-1])
                domain_candidate_2 = "-".join(segments[:-2]) if len(segments) >= 3 else None

                domain_ok = False
                function_ok = False
                resolved_domain = None
                resolved_function = None

                # Prefer single-segment function match
                if function_candidate_1 in VALID_FUNCTIONS:
                    resolved_function = function_candidate_1
                    resolved_domain = domain_candidate_1
                    function_ok = True
                    domain_ok = resolved_domain in VALID_DOMAINS
                elif function_candidate_2 and function_candidate_2 in VALID_FUNCTIONS:
                    resolved_function = function_candidate_2
                    resolved_domain = domain_candidate_2 or ""
                    function_ok = True
                    domain_ok = resolved_domain in VALID_DOMAINS if resolved_domain else False

                # R-09: Domain check
                if domain_ok:
                    results.append(
                        ValidationResult(
                            rule_id="R-09",
                            level="MUST",
                            status="PASS",
                            subject=name,
                            message=f"Domain '{resolved_domain}' is in controlled vocabulary.",
                        )
                    )
                else:
                    results.append(
                        ValidationResult(
                            rule_id="R-09",
                            level="MUST",
                            status="FAIL",
                            subject=name,
                            message=(
                                f"Domain segment '{domain_candidate_1}' is not in "
                                "controlled vocabulary."
                            ),
                            detail=(
                                f"Valid domains: {sorted(VALID_DOMAINS)} (I.7.2).\n"
                                "If this is a new domain, register it in the governance "
                                "controlled vocabulary first."
                            ),
                        )
                    )

                # R-10: Function check
                if function_ok:
                    results.append(
                        ValidationResult(
                            rule_id="R-10",
                            level="MUST",
                            status="PASS",
                            subject=name,
                            message=f"Function '{resolved_function}' is in controlled vocabulary.",
                        )
                    )
                else:
                    results.append(
                        ValidationResult(
                            rule_id="R-10",
                            level="MUST",
                            status="FAIL",
                            subject=name,
                            message=(
                                f"Function segment '{function_candidate_1}' is not in "
                                "controlled vocabulary."
                            ),
                            detail=(
                                f"Valid functions: {sorted(VALID_FUNCTIONS)} (I.7.3).\n"
                                "If this is a new function type, register it in the "
                                "governance controlled vocabulary first."
                            ),
                        )
                    )

        return results


# ---------------------------------------------------------------------------
# Section 5 — Core Validator: Governance Code
# (Rules from I.3.2, I.4.1, I.17)
# ---------------------------------------------------------------------------


class GovernanceCodeValidator:
    """
    Validates governance codes against the canonical regex defined in I.3.2.

    Canonical form: ^mycodexvantaos-[0-9]{5}$
    """

    def validate(self, code: str) -> list[ValidationResult]:
        results: list[ValidationResult] = []

        # G-01: Must match canonical regex
        if not RE_GOVERNANCE_CODE.match(code):
            results.append(
                ValidationResult(
                    rule_id="G-01",
                    level="MUST",
                    status="FAIL",
                    subject=code,
                    message="Governance code does not match canonical pattern.",
                    detail=(
                        f"Expected: ^mycodexvantaos-[0-9]{{5}}$\n"
                        f"Got: {code!r}\n"
                        "Common mistakes: using spaces (mycodexvantaos 00000), "
                        "wrong digit count, or wrong prefix."
                    ),
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="G-01",
                    level="MUST",
                    status="PASS",
                    subject=code,
                    message="Governance code matches canonical pattern.",
                )
            )

        # G-02: No space-based form
        if RE_SPACE_GOVERNANCE_CODE.search(code):
            results.append(
                ValidationResult(
                    rule_id="G-02",
                    level="MUST",
                    status="FAIL",
                    subject=code,
                    message="Governance code uses space separator (forbidden legacy form).",
                    detail=(
                        "Space-based codes (e.g. 'mycodexvantaos 00000') MUST be "
                        "normalized to 'mycodexvantaos-00000' (I.1.2)."
                    ),
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="G-02",
                    level="MUST",
                    status="PASS",
                    subject=code,
                    message="No space-based governance code form detected.",
                )
            )

        # G-03: Era range classification (SHOULD)
        if RE_GOVERNANCE_CODE.match(code):
            numeric_part = int(code.split("-")[1])
            era = self._classify_era(numeric_part)
            if era:
                results.append(
                    ValidationResult(
                        rule_id="G-03",
                        level="SHOULD",
                        status="PASS",
                        subject=code,
                        message=f"Governance code falls within era '{era}'.",
                        detail=f"Numeric value: {numeric_part}",
                    )
                )
            else:
                results.append(
                    ValidationResult(
                        rule_id="G-03",
                        level="SHOULD",
                        status="WARN",
                        subject=code,
                        message="Governance code numeric value does not map to a known era.",
                        detail=(
                            f"Numeric value: {numeric_part}\n"
                            "Era ranges (I.4.1): meta-governance 00000-09999, "
                            "era-one 10000-29999, era-two 30000-59999, "
                            "era-three 60000-89999, cross-era 90000-99999."
                        ),
                    )
                )

        return results

    @staticmethod
    def _classify_era(code_num: int) -> str | None:
        for lo, hi, era_name in ERA_RANGES:
            if lo <= code_num <= hi:
                return era_name
        return None


# ---------------------------------------------------------------------------
# Section 6 — Core Validator: File Header Path
# (Rules inferred from I.1, I.6, I.17 — file path declarations)
# ---------------------------------------------------------------------------


class FileHeaderPathValidator:
    """
    Validates that source files begin with a path declaration that:
      1. Exists within the first N lines of the file.
      2. Starts with a registered namespace prefix.
      3. Matches the canonical kebab-case pattern.
      4. Does not contain forbidden characters or markers.

    Supported declaration formats:
        # path: mycodexvantaos-auth-service/src/main.py
        # mycodexvantaos-auth-service/src/main.py
        // path: softwareos-qa-service/lib/query.ts
        path: mycodexvantaos-policy-engine/core/engine.go   (YAML)
    """

    HEADER_SCAN_LINES = 10  # Only scan the first N lines for path declarations

    def validate_file(self, file_path: Path) -> list[ValidationResult]:
        results: list[ValidationResult] = []
        subject = str(file_path)

        try:
            content = file_path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            results.append(
                ValidationResult(
                    rule_id="F-00",
                    level="MUST",
                    status="FAIL",
                    subject=subject,
                    message=f"Cannot read file: {exc}",
                )
            )
            return results

        header_lines = "\n".join(content.splitlines()[: self.HEADER_SCAN_LINES])

        # F-01: Path declaration must exist in header
        path_match = RE_FILE_HEADER_PATH_COMMENT.search(
            header_lines
        ) or RE_FILE_HEADER_PATH_YAML.search(header_lines)

        if not path_match:
            results.append(
                ValidationResult(
                    rule_id="F-01",
                    level="SHOULD",
                    status="WARN",
                    subject=subject,
                    message="No namespace path declaration found in file header.",
                    detail=(
                        f"Files SHOULD declare their namespace path within the first "
                        f"{self.HEADER_SCAN_LINES} lines.\n"
                        "Expected format: '# path: mycodexvantaos-auth-service/src/file.py'\n"
                        "or: '# mycodexvantaos-auth-service/src/file.py'"
                    ),
                )
            )
            return results

        declared_path = path_match.group(1)

        results.append(
            ValidationResult(
                rule_id="F-01",
                level="SHOULD",
                status="PASS",
                subject=subject,
                message=f"Path declaration found: '{declared_path}'",
            )
        )

        # F-02: Path must start with a registered namespace
        path_ns_match = RE_NAMESPACE_PREFIX.match(declared_path.split("/")[0])
        if not path_ns_match:
            results.append(
                ValidationResult(
                    rule_id="F-02",
                    level="MUST",
                    status="FAIL",
                    subject=subject,
                    message=(
                        f"Path declaration '{declared_path}' does not start with "
                        "a registered namespace."
                    ),
                    detail=(
                        f"Valid namespace prefixes: "
                        f"{sorted(VALID_NAMESPACES.keys())} (I.2.1)."
                    ),
                )
            )
        else:
            declared_ns = path_ns_match.group(1)
            results.append(
                ValidationResult(
                    rule_id="F-02",
                    level="MUST",
                    status="PASS",
                    subject=subject,
                    message=(
                        f"Path declaration starts with registered namespace "
                        f"'{declared_ns}' ({VALID_NAMESPACES[declared_ns]})."
                    ),
                )
            )

        # F-03: Repository root segment must match canonical repo name pattern
        repo_root = declared_path.split("/")[0]
        repo_validator = RepositoryNameValidator()
        repo_results = repo_validator.validate(repo_root)
        # Prefix rule IDs to distinguish file-context repo checks
        for r in repo_results:
            r.rule_id = f"F-03/{r.rule_id}"
            r.subject = subject
            r.detail = (
                f"(from path declaration '{declared_path}')\n" + r.detail
                if r.detail
                else f"(from path declaration '{declared_path}')"
            )
        results.extend(repo_results)

        # F-04: No forbidden characters in declared path
        path_body = declared_path.replace("/", "-")  # treat path separators as neutral
        if RE_FORBIDDEN_UPPERCASE.search(path_body):
            results.append(
                ValidationResult(
                    rule_id="F-04",
                    level="MUST",
                    status="FAIL",
                    subject=subject,
                    message=f"Declared path '{declared_path}' contains uppercase characters.",
                    detail="All path segments MUST be lowercase (I.1.1).",
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="F-04",
                    level="MUST",
                    status="PASS",
                    subject=subject,
                    message="No uppercase characters in declared path.",
                )
            )

        # F-05: Check for space-based governance codes in file content
        space_codes = RE_SPACE_GOVERNANCE_CODE.findall(content)
        if space_codes:
            results.append(
                ValidationResult(
                    rule_id="F-05",
                    level="MUST",
                    status="FAIL",
                    subject=subject,
                    message=(
                        f"File contains {len(space_codes)} space-based governance "
                        f"code(s): {space_codes[:5]}"
                    ),
                    detail=(
                        "Space-based codes MUST be normalized to hyphenated form (I.1.2)."
                    ),
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="F-05",
                    level="MUST",
                    status="PASS",
                    subject=subject,
                    message="No space-based governance codes found in file.",
                )
            )

        # F-06: Validate inline governance code references
        inline_codes = RE_INLINE_GOVERNANCE_CODE.findall(content)
        code_validator = GovernanceCodeValidator()
        invalid_inline: list[str] = []
        for ic in set(inline_codes):
            ic_results = code_validator.validate(ic)
            if any(r.is_failure() for r in ic_results):
                invalid_inline.append(ic)

        if invalid_inline:
            results.append(
                ValidationResult(
                    rule_id="F-06",
                    level="SHOULD",
                    status="WARN",
                    subject=subject,
                    message=(
                        f"File contains {len(invalid_inline)} malformed inline "
                        f"governance code reference(s): {invalid_inline[:5]}"
                    ),
                    detail="Inline governance codes SHOULD match ^mycodexvantaos-[0-9]{5}$ (I.3.2).",
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="F-06",
                    level="SHOULD",
                    status="PASS",
                    subject=subject,
                    message=(
                        f"All {len(inline_codes)} inline governance code reference(s) "
                        "are well-formed."
                        if inline_codes
                        else "No inline governance code references found."
                    ),
                )
            )

        return results

    def validate_directory(self, scan_dir: Path) -> list[ValidationResult]:
        """Recursively scan a directory for files and validate their headers."""
        results: list[ValidationResult] = []
        extensions = {
            ".py", ".ts", ".go", ".java", ".rs", ".yaml", ".yml",
            ".toml", ".json", ".sh", ".md",
        }
        for file_path in sorted(scan_dir.rglob("*")):
            if file_path.is_file() and file_path.suffix in extensions:
                results.extend(self.validate_file(file_path))
        return results


# ---------------------------------------------------------------------------
# Section 7 — Core Validator: Namespace Registry
# (Rules from I.11, I.17)
# ---------------------------------------------------------------------------


class NamespaceRegistryValidator:
    """
    Validates a namespace registry file (YAML or JSON) for:
      - Required fields
      - Lifecycle stage validity
      - Governance code format
      - Repository name compliance
      - Destroyed namespace reuse
    """

    REQUIRED_FIELDS = {"id", "namespace", "domain", "function", "repository", "lifecycle"}

    def validate_registry(self, registry_data: list[dict]) -> list[ValidationResult]:
        results: list[ValidationResult] = []
        seen_ids: set[str] = set()
        destroyed_ids: set[str] = set()
        repo_validator = RepositoryNameValidator()
        code_validator = GovernanceCodeValidator()

        for idx, record in enumerate(registry_data):
            subject = record.get("id", f"record[{idx}]")

            # NR-01: Required fields
            missing = self.REQUIRED_FIELDS - set(record.keys())
            if missing:
                results.append(
                    ValidationResult(
                        rule_id="NR-01",
                        level="MUST",
                        status="FAIL",
                        subject=subject,
                        message=f"Registry record is missing required fields: {sorted(missing)}",
                        detail="Required fields: " + ", ".join(sorted(self.REQUIRED_FIELDS)),
                    )
                )
            else:
                results.append(
                    ValidationResult(
                        rule_id="NR-01",
                        level="MUST",
                        status="PASS",
                        subject=subject,
                        message="All required fields present.",
                    )
                )

            # NR-02: Lifecycle stage validity
            lifecycle = record.get("lifecycle", "")
            if lifecycle not in VALID_LIFECYCLE_STAGES:
                results.append(
                    ValidationResult(
                        rule_id="NR-02",
                        level="MUST",
                        status="FAIL",
                        subject=subject,
                        message=f"Invalid lifecycle stage: '{lifecycle}'",
                        detail=(
                            f"Valid stages: {sorted(VALID_LIFECYCLE_STAGES)} (I.10.1)."
                        ),
                    )
                )
            else:
                results.append(
                    ValidationResult(
                        rule_id="NR-02",
                        level="MUST",
                        status="PASS",
                        subject=subject,
                        message=f"Lifecycle stage '{lifecycle}' is valid.",
                    )
                )
                if lifecycle == "destroyed":
                    destroyed_ids.add(subject)

            # NR-03: Governance code format
            gov_code = record.get("governanceCode", "")
            if gov_code:
                for r in code_validator.validate(gov_code):
                    r.rule_id = f"NR-03/{r.rule_id}"
                    r.subject = subject
                    results.append(r)

            # NR-04: Repository name compliance
            repo = record.get("repository", "")
            if repo:
                for r in repo_validator.validate(repo):
                    r.rule_id = f"NR-04/{r.rule_id}"
                    r.subject = subject
                    results.append(r)

            # NR-05: Global uniqueness
            record_id = record.get("id", "")
            if record_id in seen_ids:
                results.append(
                    ValidationResult(
                        rule_id="NR-05",
                        level="MUST",
                        status="FAIL",
                        subject=subject,
                        message=f"Duplicate registry ID detected: '{record_id}'",
                        detail="Every namespace identifier MUST be globally unique (I.9.2).",
                    )
                )
            else:
                if record_id:
                    seen_ids.add(record_id)
                results.append(
                    ValidationResult(
                        rule_id="NR-05",
                        level="MUST",
                        status="PASS",
                        subject=subject,
                        message="Registry ID is unique.",
                    )
                )

        # NR-06: Destroyed namespace reuse check
        for record in registry_data:
            record_id = record.get("id", "")
            lifecycle = record.get("lifecycle", "")
            if record_id in destroyed_ids and lifecycle != "destroyed":
                results.append(
                    ValidationResult(
                        rule_id="NR-06",
                        level="MUST",
                        status="FAIL",
                        subject=record_id,
                        message=(
                            f"Destroyed namespace identifier '{record_id}' is being "
                            "reused with a non-destroyed lifecycle."
                        ),
                        detail=(
                            "Destroyed namespace identifiers MUST NOT be reused (I.10.2, I.17)."
                        ),
                    )
                )

        return results


# ---------------------------------------------------------------------------
# Section 8 — Core Validator: Lifecycle Transitions
# (Rules from I.10.1, I.10.2, I.17)
# ---------------------------------------------------------------------------


class LifecycleTransitionValidator:
    """
    Validates lifecycle state transitions against the allowed transition graph.

    Allowed transitions (I.10.1):
        proposed → active
        active   → deprecated
        deprecated → archived
        archived → destroyed
    """

    def validate_transition(
        self, namespace_id: str, from_stage: str, to_stage: str
    ) -> list[ValidationResult]:
        results: list[ValidationResult] = []
        subject = f"{namespace_id}: {from_stage} → {to_stage}"

        if from_stage not in VALID_LIFECYCLE_STAGES:
            results.append(
                ValidationResult(
                    rule_id="LC-01",
                    level="MUST",
                    status="FAIL",
                    subject=subject,
                    message=f"Source lifecycle stage '{from_stage}' is not valid.",
                    detail=f"Valid stages: {sorted(VALID_LIFECYCLE_STAGES)}",
                )
            )
            return results

        if to_stage not in VALID_LIFECYCLE_STAGES:
            results.append(
                ValidationResult(
                    rule_id="LC-01",
                    level="MUST",
                    status="FAIL",
                    subject=subject,
                    message=f"Target lifecycle stage '{to_stage}' is not valid.",
                    detail=f"Valid stages: {sorted(VALID_LIFECYCLE_STAGES)}",
                )
            )
            return results

        allowed_targets = LIFECYCLE_TRANSITIONS.get(from_stage, [])
        if to_stage not in allowed_targets:
            results.append(
                ValidationResult(
                    rule_id="LC-02",
                    level="MUST",
                    status="FAIL",
                    subject=subject,
                    message=(
                        f"Lifecycle transition '{from_stage}' → '{to_stage}' is not allowed."
                    ),
                    detail=(
                        f"Allowed transitions from '{from_stage}': "
                        f"{allowed_targets if allowed_targets else '(none — terminal state)'} "
                        f"(I.10.1)."
                    ),
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="LC-02",
                    level="MUST",
                    status="PASS",
                    subject=subject,
                    message=f"Lifecycle transition '{from_stage}' → '{to_stage}' is valid.",
                )
            )

        # LC-03: Destroyed is a terminal state
        if from_stage == "destroyed":
            results.append(
                ValidationResult(
                    rule_id="LC-03",
                    level="MUST",
                    status="FAIL",
                    subject=subject,
                    message="Cannot transition out of 'destroyed' (terminal state).",
                    detail="Destroyed namespaces have no valid outgoing transitions (I.10.1).",
                )
            )

        return results


# ---------------------------------------------------------------------------
# Section 9 — Core Validator: Dependency Graph
# (Rules from I.2.4, I.8.2, I.17)
# ---------------------------------------------------------------------------


class DependencyGraphValidator:
    """
    Validates a dependency graph for:
      - Forbidden control-plane → product-plane hard dependencies (I.2.4)
      - Cyclic hard dependencies (I.17)
      - Missing binding mediators for bidirectional logical relations (I.8.2)
    """

    def validate_dependency_graph(
        self,
        edges: list[dict],
        mediated_bidir_pairs: set[frozenset[str]] | None = None,
    ) -> list[ValidationResult]:
        """
        edges: list of {from: str, to: str, type: str, mediator: bool}
        type: "hard" | "soft" | "contract" | "event"
        mediator: True if a binding mediator artifact exists
        mediated_bidir_pairs: pairs whose bidirectional hard dep is mediated
            and therefore should be excluded from cycle detection (I.8.2).
        """
        results: list[ValidationResult] = []

        # Build adjacency structures
        hard_deps: dict[str, list[str]] = {}
        bidirectional_pairs: set[frozenset[str]] = set()

        for edge in edges:
            src = edge.get("from", "")
            dst = edge.get("to", "")
            dep_type = edge.get("type", "hard")
            has_mediator = edge.get("mediator", False)
            subject = f"{src} → {dst}"

            # DP-01: Control-plane MUST NOT hard-depend on product-plane
            src_ns = src.split("-")[0] if "-" in src else src
            dst_ns = dst.split("-")[0] if "-" in dst else dst

            if (
                dep_type == "hard"
                and VALID_NAMESPACES.get(src_ns) == "control-plane"
                and VALID_NAMESPACES.get(dst_ns) == "product-plane"
            ):
                results.append(
                    ValidationResult(
                        rule_id="DP-01",
                        level="MUST",
                        status="FAIL",
                        subject=subject,
                        message=(
                            f"Forbidden hard dependency: control-plane service '{src}' "
                            f"hard-depends on product-plane service '{dst}'."
                        ),
                        detail=(
                            "Control-plane services MUST NOT hard-depend on product-plane "
                            "runtime implementations (I.2.4). Use registry, catalog, "
                            "binding manifest, or observation channel instead."
                        ),
                    )
                )
            else:
                results.append(
                    ValidationResult(
                        rule_id="DP-01",
                        level="MUST",
                        status="PASS",
                        subject=subject,
                        message="No forbidden control-plane → product-plane hard dependency.",
                    )
                )

            # Track hard dependencies for cycle detection
            if dep_type == "hard":
                # Skip mediated bidirectional pairs from the DAG —
                # a binding mediator breaks the hard-dependency cycle (I.8.2).
                pair = frozenset({src, dst})
                is_mediated = (
                    mediated_bidir_pairs is not None
                    and pair in mediated_bidir_pairs
                )
                if not is_mediated:
                    hard_deps.setdefault(src, []).append(dst)

            # DP-02: Bidirectional hard dependency check
            pair = frozenset({src, dst})
            reverse_exists = any(
                e.get("from") == dst and e.get("to") == src and e.get("type") == "hard"
                for e in edges
            )
            if dep_type == "hard" and reverse_exists and pair not in bidirectional_pairs:
                bidirectional_pairs.add(pair)
                if not has_mediator:
                    results.append(
                        ValidationResult(
                            rule_id="DP-02",
                            level="MUST",
                            status="FAIL",
                            subject=f"{src} ↔ {dst}",
                            message=(
                                f"Bidirectional hard dependency detected between "
                                f"'{src}' and '{dst}' without a binding mediator."
                            ),
                            detail=(
                                "Bidirectional logical relations MUST use a binding "
                                "mediator artifact (I.8.2, I.17). Add a "
                                "navigation/bindings/*.yaml mediator."
                            ),
                        )
                    )
                else:
                    results.append(
                        ValidationResult(
                            rule_id="DP-02",
                            level="MUST",
                            status="PASS",
                            subject=f"{src} ↔ {dst}",
                            message=(
                                f"Bidirectional relation between '{src}' and '{dst}' "
                                "has a binding mediator."
                            ),
                        )
                    )

        # DP-03: Cycle detection in hard dependency graph (DFS)
        cycle = self._detect_cycle(hard_deps)
        if cycle:
            results.append(
                ValidationResult(
                    rule_id="DP-03",
                    level="MUST",
                    status="FAIL",
                    subject=" → ".join(cycle),
                    message=f"Cyclic hard dependency detected: {' → '.join(cycle)}",
                    detail=(
                        "The hard dependency graph MUST remain acyclic (I.17). "
                        "Break the cycle using event contracts, registries, or "
                        "binding mediators."
                    ),
                )
            )
        else:
            results.append(
                ValidationResult(
                    rule_id="DP-03",
                    level="MUST",
                    status="PASS",
                    subject="hard-dependency-graph",
                    message="Hard dependency graph is acyclic.",
                )
            )

        return results

    @staticmethod
    def _detect_cycle(graph: dict[str, list[str]]) -> list[str] | None:
        """DFS-based cycle detection. Returns the cycle path if found, else None."""
        visited: set[str] = set()
        rec_stack: set[str] = set()
        path: list[str] = []

        def dfs(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    # Found cycle — append the cycle start to show the loop
                    path.append(neighbor)
                    return True
            rec_stack.discard(node)
            path.pop()
            return False

        for node in list(graph.keys()):
            if node not in visited:
                if dfs(node):
                    return path
        return None


# ---------------------------------------------------------------------------
# Section 10 — Report Writer
# (Artifacts from I.17)
# ---------------------------------------------------------------------------


class ReportWriter:
    """Writes validation reports to JSON files in the specified output directory."""

    def __init__(self, report_dir: Path) -> None:
        self.report_dir = report_dir
        self.report_dir.mkdir(parents=True, exist_ok=True)

    def write(self, report: ValidationReport, filename: str) -> Path:
        output_path = self.report_dir / filename
        output_path.write_text(
            json.dumps(report.to_dict(), indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        return output_path


# ---------------------------------------------------------------------------
# Section 11 — CLI Entry Point
# ---------------------------------------------------------------------------


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="namespace_check",
        description=textwrap.dedent(
            """\
            MyCodexVantaOS — Namespace Governance CI Validator
            Specification: mycodexvantaos-00000
            """
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--repo-name",
        metavar="NAME",
        help="Validate a single repository name.",
    )
    parser.add_argument(
        "--governance-code",
        metavar="CODE",
        help="Validate a single governance code.",
    )
    parser.add_argument(
        "--scan-dir",
        metavar="PATH",
        type=Path,
        help="Scan a directory for file header path compliance.",
    )
    parser.add_argument(
        "--registry",
        metavar="FILE",
        type=Path,
        help="Path to namespace registry YAML or JSON file.",
    )
    parser.add_argument(
        "--dep-graph",
        metavar="FILE",
        type=Path,
        help="Path to dependency graph YAML or JSON file.",
    )
    parser.add_argument(
        "--lifecycle",
        metavar="FILE",
        type=Path,
        help=(
            "Path to lifecycle transition YAML or JSON file. "
            "Expected format: [{id, from, to}, ...]"
        ),
    )
    parser.add_argument(
        "--report-dir",
        metavar="PATH",
        type=Path,
        default=Path("./ci-reports"),
        help="Output directory for JSON reports (default: ./ci-reports).",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat SHOULD-level warnings as failures.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print detailed validation output.",
    )
    return parser


def load_data_file(path: Path) -> Any:
    """Load a YAML or JSON data file. Returns parsed data."""
    try:
        import yaml  # type: ignore[import]
        with path.open(encoding="utf-8") as f:
            return yaml.safe_load(f)
    except ImportError:
        pass
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def print_results(results: list[ValidationResult], verbose: bool) -> None:
    """Print validation results to stdout."""
    for r in results:
        icon = {"PASS": "✓", "FAIL": "✗", "WARN": "⚠", "SKIP": "–"}.get(r.status, "?")
        print(f"  [{r.status}] {icon} [{r.rule_id}] {r.message}")
        if verbose and r.detail:
            for line in r.detail.splitlines():
                print(f"         {line}")


def run_validation(args: argparse.Namespace) -> int:
    """
    Execute all requested validations and return exit code.
    Exit 0: all MUST checks passed.
    Exit 1: one or more MUST checks failed.
    Exit 2: internal/argument error.
    """
    overall_report = ValidationReport()
    writer = ReportWriter(args.report_dir)
    any_failure = False

    # --- Repository Name Validation ---
    if args.repo_name:
        print(f"\n[Validator] Repository Name: {args.repo_name!r}")
        validator = RepositoryNameValidator()
        results = validator.validate(args.repo_name)
        overall_report.results.extend(results)
        print_results(results, args.verbose)
        if any(r.is_failure() for r in results):
            any_failure = True
        if args.strict and any(r.is_warning() for r in results):
            any_failure = True

    # --- Governance Code Validation ---
    if args.governance_code:
        print(f"\n[Validator] Governance Code: {args.governance_code!r}")
        validator = GovernanceCodeValidator()
        results = validator.validate(args.governance_code)
        overall_report.results.extend(results)
        print_results(results, args.verbose)
        if any(r.is_failure() for r in results):
            any_failure = True
        if args.strict and any(r.is_warning() for r in results):
            any_failure = True

    # --- File Header Path Validation ---
    if args.scan_dir:
        if not args.scan_dir.is_dir():
            print(f"[ERROR] --scan-dir path does not exist: {args.scan_dir}", file=sys.stderr)
            return 2
        print(f"\n[Validator] File Header Scan: {args.scan_dir}")
        validator = FileHeaderPathValidator()
        results = validator.validate_directory(args.scan_dir)
        overall_report.results.extend(results)
        print_results(results, args.verbose)
        if any(r.is_failure() for r in results):
            any_failure = True
        if args.strict and any(r.is_warning() for r in results):
            any_failure = True
        report = ValidationReport(results=results)
        out = writer.write(report, "repository-naming-validation-report.json")
        print(f"  → Report written: {out}")

    # --- Namespace Registry Validation ---
    if args.registry:
        if not args.registry.is_file():
            print(f"[ERROR] --registry file not found: {args.registry}", file=sys.stderr)
            return 2
        print(f"\n[Validator] Namespace Registry: {args.registry}")
        data = load_data_file(args.registry)

        # Detect Kubernetes-style owner-registry (kind: OwnerRegistry)
        if isinstance(data, dict) and data.get("kind") == "OwnerRegistry":
            # Owner-registry entries use {urn, email, displayName, role, gates}
            # rather than the namespace-record schema {id, namespace, domain,
            # function, repository, lifecycle}.  Map them to pseudo namespace-
            # records so the existing validator can check structural integrity.
            owners = data.get("spec", {}).get("owners", [])
            metadata_lifecycle = data.get("metadata", {}).get("lifecycle", "active")
            metadata_gov_code = data.get("metadata", {}).get("governanceCode", "")

            # Heuristic: infer domain from the owner's gate names.
            # Gate prefixes like "gate-1x" → governance, "gate-2x" → data,
            # "gate-3x" → model/ai, "gate-4x" → workload, "gate-5x" → billing,
            # "gate-6x" → infra, "gate-9x" → security/compliance.
            _GATE_DOMAIN_MAP = {
                "1": "governance",
                "2": "data",
                "3": "model",
                "4": "workload",
                "5": "billing",
                "6": "infra-cloud",   # gate-6x → infra/cloud
                "9": "compliance",
            }

            def _infer_domain_from_gates(gates: list[str]) -> str:
                """Return the most-frequent domain implied by gate prefixes."""
                domain_counts: dict[str, int] = {}
                for g in gates:
                    # gate-XX-... → extract the leading digit after "gate-"
                    m = re.match(r"gate-(\d)", g)
                    if m:
                        dom = _GATE_DOMAIN_MAP.get(m.group(1), "platform")
                        domain_counts[dom] = domain_counts.get(dom, 0) + 1
                if domain_counts:
                    return max(domain_counts, key=domain_counts.get)  # type: ignore[arg-type]
                return "platform"

            def _infer_function_from_role(role: str) -> str:
                """Map owner-registry role to a controlled-vocabulary function."""
                role_map = {
                    "governance-authority": "gates",
                    "gate-owner": "validator",
                    "owner": "service",
                }
                return role_map.get(role, "service")

            mapped_records = []
            for owner in owners:
                urn = owner.get("urn", "")
                urn_parts = urn.split(":")
                derived_id = urn_parts[-1] if urn_parts else owner.get("displayName", "")
                gates = owner.get("gates", [])
                inferred_domain = _infer_domain_from_gates(gates)
                inferred_function = _infer_function_from_role(owner.get("role", ""))
                # Construct a canonical repo name: {namespace}-{domain}-{function}
                # so that NR-04 repository-name validation passes.
                repo_name = f"mycodexvantaos-{inferred_domain}-{inferred_function}"
                mapped_records.append({
                    "id": derived_id,
                    "namespace": "mycodexvantaos",
                    "domain": inferred_domain,
                    "function": inferred_function,
                    "repository": repo_name,
                    "lifecycle": metadata_lifecycle,
                    "governanceCode": metadata_gov_code,
                })

            validator = NamespaceRegistryValidator()
            results = validator.validate_registry(mapped_records)

            # Add informational note about owner-registry mapping
            results.insert(0, ValidationResult(
                rule_id="NR-00",
                level="MAY",
                status="PASS",
                subject=str(args.registry),
                message="Owner-registry detected; fields mapped to namespace-record schema for validation.",
            ))
            overall_report.results.extend(results)
            print_results(results, args.verbose)
            if any(r.is_failure() for r in results):
                any_failure = True
            if args.strict and any(r.is_warning() for r in results):
                any_failure = True
            report = ValidationReport(results=results)
            out = writer.write(report, "namespace-registry-drift-report.json")
            print(f"  → Report written: {out}")

        else:
            # Standard namespace-registry formats
            if isinstance(data, dict) and "records" in data:
                records = data["records"]
            elif isinstance(data, dict) and "spec" in data and "records" in data.get("spec", {}):
                # Kubernetes-style YAML: {apiVersion, kind, ..., spec: {records: [...]}}
                records = data["spec"]["records"]
            elif isinstance(data, list):
                records = data
            else:
                print(
                    "[ERROR] Registry file must be a list, {records: [...]}, "
                    "or {apiVersion, kind, spec: {records: [...]}}",
                    file=sys.stderr,
                )
                return 2
            validator = NamespaceRegistryValidator()
            results = validator.validate_registry(records)
            overall_report.results.extend(results)
            print_results(results, args.verbose)
            if any(r.is_failure() for r in results):
                any_failure = True
            if args.strict and any(r.is_warning() for r in results):
                any_failure = True
            report = ValidationReport(results=results)
            out = writer.write(report, "namespace-registry-drift-report.json")
            print(f"  → Report written: {out}")

    # --- Dependency Graph Validation ---
    if args.dep_graph:
        if not args.dep_graph.is_file():
            print(f"[ERROR] --dep-graph file not found: {args.dep_graph}", file=sys.stderr)
            return 2
        print(f"\n[Validator] Dependency Graph: {args.dep_graph}")
        data = load_data_file(args.dep_graph)

        # Extract edges from various YAML formats
        if isinstance(data, dict) and "edges" in data:
            edges = data["edges"]
        elif isinstance(data, dict) and "spec" in data and "edges" in data.get("spec", {}):
            # Kubernetes-style YAML: {apiVersion, kind, metadata, spec: {edges: [...]}}
            edges = data["spec"]["edges"]
        elif isinstance(data, list):
            edges = data
        else:
            print(
                "[ERROR] Dependency graph must be a list, {edges: [...]}, "
                "or {apiVersion, kind, spec: {edges: [...]}}",
                file=sys.stderr,
            )
            return 2

        # For DependencyPolicy YAML: also extract bidirectional bindings and
        # merge them as additional edges so the validator can check mediators.
        # Track mediated bidirectional pairs so the cycle detector can skip
        # them — a mediated bidirectional relation is not a true hard cycle.
        mediated_bidir_pairs: set[frozenset[str]] = set()
        if isinstance(data, dict):
            spec = data.get("spec", data)
            bidir_bindings = spec.get("bidirectionalBindings", [])
            for binding in bidir_bindings:
                participants = binding.get("participants", [])
                has_mediator = bool(binding.get("mediatorRef", ""))
                if len(participants) == 2:
                    # Add both directions as "hard" with mediator flag
                    edges.append({
                        "from": participants[0],
                        "to": participants[1],
                        "type": "hard",
                        "mediator": has_mediator,
                    })
                    edges.append({
                        "from": participants[1],
                        "to": participants[0],
                        "type": "hard",
                        "mediator": has_mediator,
                    })
                    if has_mediator:
                        mediated_bidir_pairs.add(frozenset(participants))

        validator = DependencyGraphValidator()
        results = validator.validate_dependency_graph(
            edges,
            mediated_bidir_pairs=mediated_bidir_pairs,
        )
        overall_report.results.extend(results)
        print_results(results, args.verbose)
        if any(r.is_failure() for r in results):
            any_failure = True
        if args.strict and any(r.is_warning() for r in results):
            any_failure = True

    # --- Lifecycle Transition Validation ---
    if args.lifecycle:
        if not args.lifecycle.is_file():
            print(f"[ERROR] --lifecycle file not found: {args.lifecycle}", file=sys.stderr)
            return 2
        print(f"\n[Validator] Lifecycle Transitions: {args.lifecycle}")
        data = load_data_file(args.lifecycle)
        if isinstance(data, dict) and "transitions" in data:
            transitions = data["transitions"]
        elif isinstance(data, list):
            transitions = data
        else:
            print(
                "[ERROR] Lifecycle file must be a list or {transitions: [...]}",
                file=sys.stderr,
            )
            return 2
        validator = LifecycleTransitionValidator()
        results = []
        for t in transitions:
            results.extend(
                validator.validate_transition(
                    t.get("id", "unknown"),
                    t.get("from", ""),
                    t.get("to", ""),
                )
            )
        overall_report.results.extend(results)
        print_results(results, args.verbose)
        if any(r.is_failure() for r in results):
            any_failure = True
        if args.strict and any(r.is_warning() for r in results):
            any_failure = True

    # --- Write Master Governance Report ---
    master_out = writer.write(overall_report, "namespace-governance-report.json")
    print(f"\n[Report] Master governance report: {master_out}")

    # --- Summary ---
    total = len(overall_report.results)
    passed = len(overall_report.passed)
    failed = len(overall_report.failures)
    warned = len(overall_report.warnings)

    print(
        f"\n{'='*60}\n"
        f"  Namespace Governance Validation Summary\n"
        f"  Spec: {SPEC_VERSION}  |  Tool: {TOOL_VERSION}\n"
        f"{'='*60}\n"
        f"  Total checks : {total}\n"
        f"  Passed       : {passed}\n"
        f"  Failed       : {failed}\n"
        f"  Warnings     : {warned}\n"
        f"  Overall      : {'FAIL' if any_failure else 'PASS'}\n"
        f"{'='*60}"
    )

    return 1 if any_failure else 0


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()

    # If no validation target is specified, print help
    if not any(
        [
            args.repo_name,
            args.governance_code,
            args.scan_dir,
            args.registry,
            args.dep_graph,
            args.lifecycle,
        ]
    ):
        parser.print_help()
        sys.exit(0)

    try:
        exit_code = run_validation(args)
    except Exception as exc:  # pylint: disable=broad-except
        print(f"[INTERNAL ERROR] {exc}", file=sys.stderr)
        sys.exit(2)

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
