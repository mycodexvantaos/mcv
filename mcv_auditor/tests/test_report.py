"""
MyCodexVantaOS MCV Auditor — Report Generator Tests (6 tests)

Updated in v1.0.0: Uses AuditPhaseResult from the new 5-phase
function-based pipeline instead of the removed PromptAnalyzer
and GuardrailAnalyzer classes.
"""

import json
import pathlib
import tempfile

from mcv_auditor.core.analyzers import (
    AuditPhaseResult,
    Finding,
    evaluate_guardrails,
    sha256_text,
)
from mcv_auditor.reports.report import ReportGenerator


def _make_phase_result(phase: str, status: str = "PASS", findings: list[Finding] | None = None) -> AuditPhaseResult:
    """Helper to build an AuditPhaseResult for testing."""
    return AuditPhaseResult(
        phase=phase,
        status=status,
        findings=findings or [],
        metrics={"probe_count": 0},
    )


class TestReportGenerator:
    """Tests for ReportGenerator."""

    def setup_method(self):
        self.generator = ReportGenerator()

    def test_generate_report_from_phase_results(self):
        """Should generate a report from phase results."""
        results = [
            _make_phase_result("phase-1-system-prompt-extraction"),
            _make_phase_result("phase-2-domain-policy-analysis"),
        ]
        report = self.generator.generate(results)
        assert report.platform == "mycodexvantaos"
        assert report.canonical_url == "https://mycodexvantaos.com"
        assert len(report.phase_results) == 2

    def test_report_has_correct_canonical_url(self):
        """Report canonical URL must be https://mycodexvantaos.com."""
        report = self.generator.generate([])
        assert report.canonical_url == "https://mycodexvantaos.com"

    def test_to_json_produces_valid_json(self):
        """to_json should produce valid JSON."""
        report = self.generator.generate([])
        json_str = self.generator.to_json(report)
        parsed = json.loads(json_str)
        assert parsed["platform"] == "mycodexvantaos"
        assert parsed["canonical_url"] == "https://mycodexvantaos.com"

    def test_to_markdown_contains_report_title(self):
        """to_markdown should contain report title."""
        report = self.generator.generate([])
        md = self.generator.to_markdown(report)
        assert "MyCodexVantaOS Security Audit Report" in md

    def test_failed_phase_produces_failed_report(self):
        """Phase with ERROR findings should produce a FAILED report."""
        error_finding = Finding(
            severity="ERROR",
            code="PRODUCTION_PROVIDER_DOMAIN_FORBIDDEN",
            path="config.md",
            message="Forbidden provider-hosted domain found: .vercel.app",
            evidence_hash=sha256_text(".vercel.appconfig.md"),
        )
        results = [
            _make_phase_result("phase-2-domain-policy-analysis", "FAIL", [error_finding]),
        ]
        report = self.generator.generate(results)
        assert report.overall_status == "FAIL"

    def test_passing_phases_produce_passing_report(self):
        """All passing phase results should produce a PASSING report."""
        results = [
            _make_phase_result("phase-0-environment-validation"),
            _make_phase_result("phase-1-system-prompt-extraction"),
            _make_phase_result("phase-2-domain-policy-analysis"),
            _make_phase_result("phase-3-secret-pattern-analysis"),
        ]
        report = self.generator.generate(results)
        assert report.overall_status == "PASS"
