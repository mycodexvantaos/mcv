#!/usr/bin/env python3
"""Stable changed-file lint gate.

Rationale: this gate avoids recurring Super-Linter breakage caused by remote
Docker image drift, language auto-detection surprises, deprecated bundled
linters, and branch-diff ambiguity. It validates syntax and repository hygiene
with deterministic Python standard-library checks suitable for CI blocking.
"""

from __future__ import annotations

import argparse
import ast
import json
import re
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class Issue:
    path: str
    code: str
    message: str
    severity: str = "error"


TEXT_SUFFIXES = {
    ".bash",
    ".css",
    ".env",
    ".graphql",
    ".gql",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".mjs",
    ".py",
    ".sh",
    ".sql",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml",
}

SKIP_PARTS = {
    ".git",
    ".pnpm-store",
    ".yarn",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "outputs",
    "vendor",
}

MAX_TEXT_BYTES = 2_000_000
SAFE_PATH_PATTERN = re.compile(r"^[A-Za-z0-9._/@:+-]+$")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="stable-lint-gate")
    parser.add_argument("--file-list", required=True)
    parser.add_argument("--report", required=True)
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    files = read_file_list(Path(args.file_list))
    issues = lint_files(files)
    payload = {
        "ok": not any(issue.severity == "error" for issue in issues),
        "checkedFiles": len(files),
        "issues": [asdict(issue) for issue in issues],
    }
    write_json(Path(args.report), payload)
    print(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True))
    return 0 if payload["ok"] else 1


def read_file_list(path: Path) -> list[Path]:
    if not path.exists():
        return []

    result: list[Path] = []
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        value = raw_line.strip()
        if not value:
            continue
        if not SAFE_PATH_PATTERN.match(value):
            continue

        candidate = Path(value)
        if candidate.is_absolute():
            continue
        if ".." in candidate.parts:
            continue
        if any(part in SKIP_PARTS for part in candidate.parts):
            continue
        if candidate.exists() and candidate.is_file():
            result.append(candidate)

    return sorted(set(result), key=lambda item: item.as_posix())


def lint_files(files: Iterable[Path]) -> list[Issue]:
    issues: list[Issue] = []
    for path in files:
        issues.extend(lint_common(path))
        if is_text_like(path):
            issues.extend(lint_text(path))
        suffix = path.suffix.lower()
        if suffix == ".json":
            issues.extend(lint_json(path))
        elif suffix in {".yaml", ".yml"}:
            issues.extend(lint_yaml_parseable(path))
        elif suffix == ".py":
            issues.extend(lint_python(path))
        elif suffix in {".sh", ".bash"}:
            issues.extend(lint_shell(path))
    return issues


def lint_common(path: Path) -> list[Issue]:
    issues: list[Issue] = []
    raw = path.as_posix()

    if "\\" in raw:
        issues.append(
            make_issue(path, "invalid-path-separator", "path must use forward slashes")
        )

    if path.stat().st_size > MAX_TEXT_BYTES and is_text_like(path):
        issues.append(
            make_issue(
                path,
                "text-file-too-large",
                f"text-like file exceeds {MAX_TEXT_BYTES} bytes",
            )
        )

    return issues


def is_text_like(path: Path) -> bool:
    name = path.name.lower()
    return path.suffix.lower() in TEXT_SUFFIXES or name in {
        "dockerfile",
        "makefile",
        ".gitignore",
        ".dockerignore",
    }


def lint_text(path: Path) -> list[Issue]:
    issues: list[Issue] = []
    try:
        content = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return [make_issue(path, "utf8-invalid", "text-like file must be valid UTF-8")]

    if "\r\n" in content:
        issues.append(
            make_issue(path, "crlf-line-ending", "file must use LF line endings")
        )

    if content and not content.endswith("\n"):
        issues.append(
            make_issue(path, "missing-final-newline", "file must end with newline")
        )

    for number, line in enumerate(content.splitlines(), start=1):
        if line.rstrip() != line:
            issues.append(
                make_issue(
                    path,
                    "trailing-whitespace",
                    f"line {number} contains trailing whitespace",
                )
            )

    return issues


def lint_json(path: Path) -> list[Issue]:
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [
            make_issue(
                path,
                "json-syntax-invalid",
                f"line {exc.lineno}, column {exc.colno}: {exc.msg}",
            )
        ]
    return []


def lint_yaml_parseable(path: Path) -> list[Issue]:
    content = path.read_text(encoding="utf-8")
    issues: list[Issue] = []

    tab_lines = [
        number
        for number, line in enumerate(content.splitlines(), start=1)
        if line.startswith("\t")
    ]
    if tab_lines:
        issues.append(
            make_issue(
                path,
                "yaml-tab-indentation",
                "YAML indentation must not use tabs: "
                + ",".join(str(number) for number in tab_lines[:10]),
            )
        )

    duplicate_keys = detect_probable_yaml_duplicate_keys(content)
    for line_number, key in duplicate_keys:
        issues.append(
            make_issue(
                path,
                "yaml-probable-duplicate-key",
                f"probable duplicate key '{key}' at line {line_number}",
            )
        )

    return issues


def detect_probable_yaml_duplicate_keys(content: str) -> list[tuple[int, str]]:
    stack: list[tuple[int, set[str]]] = [(-1, set())]
    duplicates: list[tuple[int, str]] = []
    key_pattern = re.compile(r"^(\s*)([A-Za-z0-9_.\"'-]+):(?:\s|$)")

    for line_number, line in enumerate(content.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("- "):
            continue

        match = key_pattern.match(line)
        if not match:
            continue

        indent = len(match.group(1))
        key = match.group(2).strip("\"'")

        while stack and indent <= stack[-1][0]:
            stack.pop()
        if not stack:
            stack.append((-1, set()))

        current_keys = stack[-1][1]
        if key in current_keys:
            duplicates.append((line_number, key))
        else:
            current_keys.add(key)

        stack.append((indent, set()))

    return duplicates


def lint_python(path: Path) -> list[Issue]:
    try:
        ast.parse(path.read_text(encoding="utf-8"), filename=path.as_posix())
    except SyntaxError as exc:
        return [
            make_issue(
                path,
                "python-syntax-invalid",
                f"line {exc.lineno}: {exc.msg}",
            )
        ]
    return []


def lint_shell(path: Path) -> list[Issue]:
    completed = subprocess.run(
        ["bash", "-n", path.as_posix()],
        check=False,
        capture_output=True,
        text=True,
    )
    if completed.returncode == 0:
        return []
    return [make_issue(path, "shell-syntax-invalid", completed.stderr.strip())]


def make_issue(path: Path, code: str, message: str) -> Issue:
    return Issue(
        path=path.as_posix(),
        code=code,
        message=message,
    )


def write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    temporary.replace(path)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
