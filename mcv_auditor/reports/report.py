"""
MyCodexVantaOS MCV Auditor — Report Generator v1.0.0

Generates JSON, Markdown, and JSONL audit reports from AuditPhaseResult data.

Updated in v1.0.0: Replaced legacy AnalyzerResult with AuditPhaseResult.
The ReportGenerator now accepts a list of AuditPhaseResult objects produced
by the 5-phase deterministic audit pipeline.

Document ID: IM-MCV-002
"""

from __future__ import annotations

import json
import datetime
from dataclasses import asdict, dataclass, field
from typing import Any

from ..core.analyzers import AuditPhaseResult, Finding, utc_now, CANONICAL_URL, MACHINE_IDENTITY

DOC_ID = "IM-MCV-002"


@dataclass
class AuditReport:
    """Complete audit report with phase-level results."""
    report_id: str
    report_version: str = "1.0.0"
    platform: str = MACHINE_IDENTITY
    doc_id: str = DOC_ID
    canonical_url: str = CANONICAL_URL
    generated_at: str = field(default_factory=utc_now)
    phase_results: list[AuditPhaseResult] = field(default_factory=list)
    overall_status: str = "PASS"
    summary: dict[str, Any] = field(default_factory=dict)


class ReportGenerator:
    """
    Generates audit reports in multiple formats from AuditPhaseResult data.
    """

    def generate(self, results: list[AuditPhaseResult]) -> AuditReport:
        """Generate a complete audit report from phase results."""
        report_id = f"audit-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S')}"

        total_findings = sum(len(r.findings) for r in results)
        error_findings = sum(
            1 for r in results for f in r.findings if f.severity == "ERROR"
        )
        warn_findings = sum(
            1 for r in results for f in r.findings if f.severity == "WARN"
        )

        overall_status = "PASS" if error_findings == 0 else "FAIL"

        summary = {
            "phase_count": len(results),
            "passed_phases": sum(1 for r in results if r.status == "PASS"),
            "failed_phases": sum(1 for r in results if r.status == "FAIL"),
            "total_findings": total_findings,
            "error_findings": error_findings,
            "warning_findings": warn_findings,
            "overall_status": overall_status,
        }

        return AuditReport(
            report_id=report_id,
            phase_results=results,
            overall_status=overall_status,
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
            f"**Report Version:** {report.report_version}",
            f"**Platform:** {report.platform}",
            f"**Canonical URL:** {report.canonical_url}",
            f"**Generated:** {report.generated_at}",
            f"**Overall Result:** {'✅ PASSED' if report.overall_status == 'PASS' else '❌ FAILED'}",
            f"",
            f"## Summary",
            f"",
            f"| Metric | Value |",
            f"|--------|-------|",
        ]

        for key, value in report.summary.items():
            lines.append(f"| {key.replace('_', ' ').title()} | {value} |")

        lines.append("")
        lines.append("## Phase Results")
        lines.append("")

        for result in report.phase_results:
            status = "✅ PASS" if result.status == "PASS" else "❌ FAIL"
            lines.append(f"### {result.phase} — {status}")
            lines.append(f"**Metrics:** {result.metrics}")
            lines.append("")

            if result.findings:
                lines.append("#### Findings")
                lines.append("")
                for finding in result.findings:
                    lines.append(f"- **[{finding.severity}]** `{finding.code}` — {finding.message}")
                    lines.append(f"  - Path: `{finding.path}`")
                    lines.append(f"  - Evidence: `{finding.evidence_hash[:16]}…`")
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
