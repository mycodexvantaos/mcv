"""
MyCodexVantaOS MCV Auditor — Tool Auditor (Phase 3)
Tool schema security analysis.
"""
from __future__ import annotations
from typing import Any
from ..core.analyzers import ToolAnalyzer, AnalyzerResult


class ToolAuditor:
    """Phase 3: Tool schema security auditor."""

    def __init__(self) -> None:
        self._analyzer = ToolAnalyzer()

    def audit(self, tools: list[dict[str, Any]]) -> AnalyzerResult:
        """Run Phase 3 audit on tool definitions."""
        return self._analyzer.analyze(tools)
