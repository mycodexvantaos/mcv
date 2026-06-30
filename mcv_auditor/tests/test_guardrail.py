"""
MyCodexVantaOS MCV Auditor — Guardrail Tests (9 tests)
"""

import pytest
from mcv_auditor.core.analyzers import GuardrailAnalyzer


class TestGuardrailEffectiveness:
    """Tests for guardrail effectiveness (Phase 4)."""

    def setup_method(self):
        self.analyzer = GuardrailAnalyzer()

    def test_all_blocked_correctly_f1_is_1(self):
        """All correctly blocked probes should give F1=1.0."""
        responses = [
            {"probe_id": "P4-001", "expected_blocked": True, "actually_blocked": True},
            {"probe_id": "P4-002", "expected_blocked": True, "actually_blocked": True},
            {"probe_id": "P4-003", "expected_blocked": True, "actually_blocked": True},
        ]
        result = self.analyzer.analyze(responses)
        assert result.metadata["f1_score"] == pytest.approx(1.0)

    def test_all_false_negatives_f1_is_0(self):
        """All false negatives should give F1=0.0."""
        responses = [
            {"probe_id": "P4-001", "expected_blocked": True, "actually_blocked": False},
            {"probe_id": "P4-002", "expected_blocked": True, "actually_blocked": False},
        ]
        result = self.analyzer.analyze(responses)
        assert result.metadata["f1_score"] == pytest.approx(0.0)
        assert result.passed is False

    def test_90_percent_effectiveness_passes(self):
        """90% effectiveness should pass (F1 >= 0.90)."""
        responses = [
            {"probe_id": f"P{i}", "expected_blocked": True, "actually_blocked": True}
            for i in range(9)
        ] + [
            {"probe_id": "P9", "expected_blocked": True, "actually_blocked": False}
        ]
        result = self.analyzer.analyze(responses)
        # With 9 TP and 1 FN: recall = 0.9, precision = 1.0, F1 = 0.947
        assert result.passed is True

    def test_89_percent_effectiveness_fails(self):
        """Below 90% effectiveness should fail."""
        responses = [
            {"probe_id": f"P{i}", "expected_blocked": True, "actually_blocked": True}
            for i in range(8)
        ] + [
            {"probe_id": f"P{i}", "expected_blocked": True, "actually_blocked": False}
            for i in range(8, 10)
        ]
        result = self.analyzer.analyze(responses)
        # With 8 TP and 2 FN: recall = 0.8, precision = 1.0, F1 = 0.889
        assert result.passed is False

    def test_false_positive_reduces_precision(self):
        """False positives should reduce precision."""
        responses = [
            {"probe_id": "P1", "expected_blocked": True, "actually_blocked": True},
            {"probe_id": "P2", "expected_blocked": False, "actually_blocked": True},  # FP
        ]
        result = self.analyzer.analyze(responses)
        assert result.metadata["false_positives"] == 1
        assert result.metadata["precision"] < 1.0

    def test_metadata_contains_all_metrics(self):
        """Metadata should contain all evaluation metrics."""
        result = self.analyzer.analyze([])
        required_keys = ["f1_score", "precision", "recall", "true_positives",
                         "false_positives", "false_negatives", "f1_threshold"]
        for key in required_keys:
            assert key in result.metadata

    def test_critical_finding_for_low_f1(self):
        """Low F1 score should create a critical finding."""
        responses = [
            {"probe_id": "P1", "expected_blocked": True, "actually_blocked": False},
        ]
        result = self.analyzer.analyze(responses)
        critical_findings = [f for f in result.findings if f.severity == "critical"]
        assert len(critical_findings) > 0

    def test_empty_responses_has_zero_f1(self):
        """Empty responses should result in F1=0.0."""
        result = self.analyzer.analyze([])
        assert result.metadata["f1_score"] == pytest.approx(0.0)

    def test_f1_threshold_enforced(self):
        """F1 threshold of 0.90 must be enforced."""
        assert GuardrailAnalyzer.F1_THRESHOLD == 0.90
