from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping


@dataclass(frozen=True)
class ValidationIssue:
    code: str
    message: str
    path: str
    severity: str = "error"


@dataclass(frozen=True)
class ValidationResult:
    ok: bool
    issues: tuple[ValidationIssue, ...] = field(default_factory=tuple)
    metrics: Mapping[str, Any] = field(default_factory=dict)

    @classmethod
    def pass_with(cls, metrics: Mapping[str, Any] | None = None) -> "ValidationResult":  # noqa: E501
        return cls(ok=True, issues=(), metrics=metrics or {})

    @classmethod
    def fail_with(
        cls,
        issues: list[ValidationIssue],
        metrics: Mapping[str, Any] | None = None,
    ) -> "ValidationResult":
        return cls(ok=False, issues=tuple(issues), metrics=metrics or {})

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "issues": [issue.__dict__ for issue in self.issues],
            "metrics": dict(self.metrics),
        }
