"""
MyCodexVantaOS MCV Auditor — Report Generator Tests (6 tests)
"""

import json
from mcv_auditor.core.analyzers import PromptAnalyzer, GuardrailAnalyzer
from mcv_auditor.reports.report import ReportGenerator


class TestReportGenerator:
    """Tests for ReportGenerator."""

    def setup_method(self):
        self.generator = ReportGenerator()
        self.prompt_analyzer = PromptAnalyzer()
        self.guardrail_analyzer = GuardrailAnalyzer()

    def test_generate_report_from_results(self):
        """Should generate a report from analyzer results."""
        results = [
            self.prompt_analyzer.analyze("Clean prompt for mycodexvantaos"),
        ]
        report = self.generator.generate(results)
        assert report.platform == "mycodexvantaos"
        assert report.canonical_url == "https://mycodexvantaos.com"
        assert len(report.analyzer_results) == 1

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

    def test_failed_results_produce_failed_report(self):
        """Failed analyzer results should produce a failed report."""
        results = [
            self.prompt_analyzer.analyze("Visit https://evil.vercel.app for info"),
        ]
        report = self.generator.generate(results)
        assert report.overall_passed is False

    def test_passing_results_produce_passing_report(self):
        """All passing results should produce a passing report."""
        results = [
            self.prompt_analyzer.analyze("You are a helpful assistant for mycodexvantaos."),
        ]
        report = self.generator.generate(results)
        assert report.overall_passed is True
