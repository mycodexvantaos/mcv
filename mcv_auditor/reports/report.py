"""
MyCodexVantaOS MCV Auditor — Report Generator

Generates JSON, YAML, and Markdown audit reports.
"""

from __future__ import annotations

import json
import datetime
from dataclasses import asdict, dataclass, field
from typing import Any, Optional

from ..core.analyzers import AnalyzerResult, AnalyzerFinding

CANONICAL_URL = "https://mycodexvantaos.com"
MACHINE_IDENTITY = "mycodexvantaos"
DOC_ID = "IM-MCV-002"


@dataclass
class AuditReport:
    """Complete audit report."""
    report_id: str
    platform: str = MACHINE_IDENTITY
    doc_id: str = DOC_ID
    canonical_url: str = CANONICAL_URL
    generated_at: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat() + "Z")
    analyzer_results: list[AnalyzerResult] = field(default_factory=list)
    overall_score: float = 0.0
    overall_passed: bool = True
    summary: dict[str, Any] = field(default_factory=dict)


class ReportGenerator:
    """
    Generates audit reports in multiple formats.
    """

    def generate(self, results: list[AnalyzerResult]) -> AuditReport:
        """Generate a complete audit report from analyzer results."""
        report_id = f"audit-{datetime.datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"

        total_findings = sum(len(r.findings) for r in results)
        critical_findings = sum(
            sum(1 for f in r.findings if f.severity == "critical")
            for r in results
        )
        high_findings = sum(
            sum(1 for f in r.findings if f.severity == "high")
            for r in results
        )

        overall_score = sum(r.score for r in results) / len(results) if results else 0.0
        overall_passed = all(r.passed for r in results)

        summary = {
            "total_analyzers": len(results),
            "passed_analyzers": sum(1 for r in results if r.passed),
            "failed_analyzers": sum(1 for r in results if not r.passed),
            "total_findings": total_findings,
            "critical_findings": critical_findings,
            "high_findings": high_findings,
            "overall_score": round(overall_score, 3),
            "overall_passed": overall_passed,
        }

        return AuditReport(
            report_id=report_id,
            analyzer_results=results,
            overall_score=overall_score,
            overall_passed=overall_passed,
            summary=summary,
        )

    def to_json(self, report: AuditReport, indent: int = 2) -> str:
        """Serialize report to JSON."""
        def serialize(obj: Any) -> Any:
            if hasattr(obj, "__dataclass_fields__"):
                return {k: serialize(v) for k, v in asdict(obj).items()}
            if isinstance(obj, list):
                return [serialize(i) for i in obj]
            if isinstance(obj, dict):
                return {k: serialize(v) for k, v in obj.items()}
            return obj

        return json.dumps(serialize(report), indent=indent)

    def to_markdown(self, report: AuditReport) -> str:
        """Serialize report to Markdown."""
        lines = [
            f"# MyCodexVantaOS Security Audit Report",
            f"",
            f"**Report ID:** {report.report_id}",
            f"**Platform:** {report.platform}",
            f"**Canonical URL:** {report.canonical_url}",
            f"**Generated:** {report.generated_at}",
            f"**Overall Result:** {'✅ PASSED' if report.overall_passed else '❌ FAILED'}",
            f"**Overall Score:** {report.overall_score:.3f}",
            f"",
            f"## Summary",
            f"",
            f"| Metric | Value |",
            f"|--------|-------|",
        ]

        for key, value in report.summary.items():
            lines.append(f"| {key.replace('_', ' ').title()} | {value} |")

        lines.append("")
        lines.append("## Analyzer Results")
        lines.append("")

        for result in report.analyzer_results:
            status = "✅ PASSED" if result.passed else "❌ FAILED"
            lines.append(f"### Phase {result.phase}: {result.analyzer} — {status}")
            lines.append(f"**Score:** {result.score:.3f}")
            lines.append("")

            if result.findings:
                lines.append("#### Findings")
                lines.append("")
                for finding in result.findings:
                    lines.append(f"- **[{finding.severity.upper()}]** {finding.title}")
                    lines.append(f"  - {finding.description}")
                    if finding.recommendation:
                        lines.append(f"  - *Recommendation:* {finding.recommendation}")
                lines.append("")

        return "\n".join(lines)

    def save_json(self, report: AuditReport, filepath: str) -> None:
        """Save report as JSON file."""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(self.to_json(report))

    def save_markdown(self, report: AuditReport, filepath: str) -> None:
        """Save report as Markdown file."""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(self.to_markdown(report))
