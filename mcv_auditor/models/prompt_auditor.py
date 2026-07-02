"""
MyCodexVantaOS MCV Auditor — Prompt Auditor (Phase 1/2)
System prompt extraction and domain policy analysis.

Updated in v1.0.0: Delegates to extract_system_prompts and
analyze_domain_policy instead of the removed PromptAnalyzer class.
"""
from __future__ import annotations

import pathlib
from ..core.analyzers import (
    AuditPhaseResult,
    extract_system_prompts,
    analyze_domain_policy,
)


class PromptAuditor:
    """Phase 1/2: System prompt extraction and domain policy auditor.

    Wraps the function-based audit pipeline for callers that
    prefer a class interface.
    """

    def __init__(self, root: pathlib.Path | None = None) -> None:
        self._root = root or pathlib.Path.cwd()

    def audit(self, root: pathlib.Path | None = None) -> list[AuditPhaseResult]:
        """Run Phase 1 (prompt extraction) and Phase 2 (domain policy) audits."""
        target = root or self._root
        return [
            extract_system_prompts(target),
            analyze_domain_policy(target),
        ]

    def audit_prompts_only(self, root: pathlib.Path | None = None) -> AuditPhaseResult:
        """Run only Phase 1 (system prompt extraction)."""
        return extract_system_prompts(root or self._root)

    def audit_domains_only(self, root: pathlib.Path | None = None) -> AuditPhaseResult:
        """Run only Phase 2 (domain policy analysis)."""
        return analyze_domain_policy(root or self._root)
