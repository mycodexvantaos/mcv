"""
MyCodexVantaOS MCV Auditor — Prompt Leakage Tests (7 tests)

Updated in v1.0.0: Uses analyze_domain_policy (Phase 2) instead
of the removed PromptAnalyzer class. Domain violations are detected
by scanning file content for forbidden provider domains.
"""

import pathlib
import tempfile

from mcv_auditor.core.analyzers import analyze_domain_policy, Finding


class TestPromptLeakage:
    """Tests for forbidden provider domain detection (Phase 2)."""

    def _make_repo(self, content: str, filename: str = "config.md") -> pathlib.Path:
        """Create a temporary repository with a single file containing the given content."""
        tmp = pathlib.Path(tempfile.mkdtemp())
        (tmp / filename).write_text(content, encoding="utf-8")
        return tmp

    def test_vercel_url_triggers_error_finding(self):
        """Vercel URL should trigger an ERROR finding."""
        root = self._make_repo("API endpoint: https://myapp.vercel.app/api")
        result = analyze_domain_policy(root)
        errors = [f for f in result.findings if f.severity == "ERROR"]
        assert len(errors) > 0

    def test_netlify_url_triggers_finding(self):
        """Netlify URL should trigger a finding."""
        root = self._make_repo("Hosted at https://myapp.netlify.app")
        result = analyze_domain_policy(root)
        assert len(result.findings) > 0

    def test_firebase_url_triggers_finding(self):
        """Firebase URL should trigger a finding."""
        root = self._make_repo("App at https://myapp.web.app")
        result = analyze_domain_policy(root)
        assert len(result.findings) > 0

    def test_appspot_url_triggers_finding(self):
        """App Engine URL should trigger a finding."""
        root = self._make_repo("Service: https://myapp.appspot.com")
        result = analyze_domain_policy(root)
        assert len(result.findings) > 0

    def test_cloudfunctions_url_triggers_finding(self):
        """Cloud Functions URL should trigger a finding."""
        root = self._make_repo("Function at https://us-central1-proj.cloudfunctions.net/fn")
        result = analyze_domain_policy(root)
        assert len(result.findings) > 0

    def test_multiple_forbidden_urls_all_detected(self):
        """Multiple forbidden URLs should all be detected."""
        prompt = """
        GitHub: https://example.github.io
        Vercel: https://example.vercel.app
        Netlify: https://example.netlify.app
        """
        root = self._make_repo(prompt)
        result = analyze_domain_policy(root)
        assert len(result.findings) >= 3

    def test_canonical_url_not_flagged(self):
        """Canonical URL https://mycodexvantaos.com should not be flagged."""
        root = self._make_repo(
            "Platform available at https://mycodexvantaos.com and "
            "API at https://api.mycodexvantaos.com"
        )
        domain_violations = [
            f for f in result.findings
            if f.code == "PRODUCTION_PROVIDER_DOMAIN_FORBIDDEN"
        ] if (result := analyze_domain_policy(root)) else []
        assert len(domain_violations) == 0
