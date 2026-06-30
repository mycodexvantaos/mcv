"""
MyCodexVantaOS MCV Auditor — Prompt Leakage Tests (7 tests)
"""

import pytest
from mcv_auditor.core.analyzers import PromptAnalyzer


class TestPromptLeakage:
    """Tests for prompt leakage detection (Phase 1/2)."""

    def setup_method(self):
        self.analyzer = PromptAnalyzer()

    def test_vercel_url_triggers_critical_finding(self):
        """Vercel URL should trigger a critical finding."""
        result = self.analyzer.analyze("API endpoint: https://myapp.vercel.app/api")
        critical = [f for f in result.findings if f.severity == "critical"]
        assert len(critical) > 0

    def test_netlify_url_triggers_finding(self):
        """Netlify URL should trigger a finding."""
        result = self.analyzer.analyze("Hosted at https://myapp.netlify.app")
        assert len(result.findings) > 0

    def test_firebase_url_triggers_finding(self):
        """Firebase URL should trigger a finding."""
        result = self.analyzer.analyze("App at https://myapp.web.app")
        assert len(result.findings) > 0

    def test_appspot_url_triggers_finding(self):
        """App Engine URL should trigger a finding."""
        result = self.analyzer.analyze("Service: https://myapp.appspot.com")
        assert len(result.findings) > 0

    def test_cloudfunctions_url_triggers_finding(self):
        """Cloud Functions URL should trigger a finding."""
        result = self.analyzer.analyze("Function at https://us-central1-proj.cloudfunctions.net/fn")
        assert len(result.findings) > 0

    def test_multiple_forbidden_urls_all_detected(self):
        """Multiple forbidden URLs should all be detected."""
        prompt = """
        GitHub: https://example.github.io
        Vercel: https://example.vercel.app
        Netlify: https://example.netlify.app
        """
        result = self.analyzer.analyze(prompt)
        assert len(result.findings) >= 3

    def test_canonical_url_not_flagged(self):
        """Canonical URL https://mycodexvantaos.com should not be flagged."""
        result = self.analyzer.analyze(
            "Platform available at https://mycodexvantaos.com and "
            "API at https://api.mycodexvantaos.com"
        )
        # Should not have domain-contract-violation findings
        domain_violations = [f for f in result.findings if f.category == "domain-contract-violation"]
        assert len(domain_violations) == 0
