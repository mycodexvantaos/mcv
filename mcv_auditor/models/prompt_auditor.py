"""
MyCodexVantaOS MCV Auditor — Prompt Auditor (Phase 2)
System prompt consistency analysis.
"""
from __future__ import annotations
from ..core.analyzers import PromptAnalyzer, AnalyzerResult


class PromptAuditor:
    """Phase 2: System prompt consistency auditor."""

    def __init__(self) -> None:
        self._analyzer = PromptAnalyzer()

    def audit(self, system_prompt: str) -> AnalyzerResult:
        """Run Phase 2 audit on a system prompt."""
        return self._analyzer.analyze(system_prompt)

    def audit_multiple(self, prompts: list[str]) -> list[AnalyzerResult]:
        """Audit multiple system prompts."""
        return [self._analyzer.analyze(p) for p in prompts]
