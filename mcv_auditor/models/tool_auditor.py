"""
MyCodexVantaOS MCV Auditor — Tool Auditor (Phase 3)
Secret pattern detection and tool schema security analysis.

Updated in v1.0.0: Delegates to analyze_secret_patterns instead
of the removed ToolAnalyzer class.
"""
from __future__ import annotations

import pathlib
from ..core.analyzers import AuditPhaseResult, analyze_secret_patterns


class ToolAuditor:
    """Phase 3: Secret pattern and tool schema security auditor.

    Wraps the function-based audit pipeline for callers that
    prefer a class interface.
    """

    def __init__(self, root: pathlib.Path | None = None) -> None:
        self._root = root or pathlib.Path.cwd()

    def audit(self, root: pathlib.Path | None = None) -> AuditPhaseResult:
        """Run Phase 3 audit — secret pattern detection."""
        return analyze_secret_patterns(root or self._root)
