"""
MyCodexVantaOS MCV Auditor — Guardrail Tester (Phase 4)
Guardrail effectiveness testing. Minimum F1 >= 0.90.

Updated in v1.0.0: Delegates to evaluate_guardrails instead
of the removed GuardrailAnalyzer class.
"""
from __future__ import annotations

from ..core.analyzers import (
    AuditPhaseResult,
    GuardrailProbe,
    evaluate_guardrails,
    default_guardrail_probes,
)


class GuardrailTester:
    """Phase 4: Guardrail effectiveness tester.

    Wraps the function-based audit pipeline for callers that
    prefer a class interface.
    """

    F1_THRESHOLD = 0.90

    def __init__(self) -> None:
        pass

    def test(self, probes: list[GuardrailProbe] | None = None) -> AuditPhaseResult:
        """Run Phase 4 guardrail effectiveness test."""
        return evaluate_guardrails(probes)

    def meets_threshold(self, result: AuditPhaseResult) -> bool:
        """Check if result meets the F1 threshold."""
        f1 = result.metrics.get("f1", 0.0)
        return f1 >= self.F1_THRESHOLD
