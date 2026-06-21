"""Safe repository IO helpers.

Rationale: validators must be deterministic across local, CI, and container
execution; centralizing path and YAML handling prevents inconsistent parsing
semantics.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml


class GateIoError(RuntimeError):
    pass


def repo_path(root: Path, relative_path: str) -> Path:
    candidate = (root / relative_path).resolve()
    root_resolved = root.resolve()
    if (
        root_resolved not in candidate.parents and candidate != root_resolved
    ):  # noqa: E501
        raise GateIoError(f"path escapes repository root: {relative_path}")
    return candidate


def read_yaml(path: Path) -> dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            value = yaml.safe_load(handle)
    except OSError as exc:
        raise GateIoError(f"failed to read yaml: {path}") from exc
    if not isinstance(value, dict):
        raise GateIoError(f"yaml root must be mapping: {path}")
    return value


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
    tmp.replace(path)
