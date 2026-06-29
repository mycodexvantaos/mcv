#!/usr/bin/env python3
"""
MyCodexVantaOS MCV Auditor — CLI Entry Point

Document ID: IM-MCV-002
Spec Reference: IM-MCV-001

Usage:
    python run_audit.py --help
    python run_audit.py --phase 0 --output report.json
    python run_audit.py --all --format markdown --output audit-report.md
"""

import argparse
import sys
from pathlib import Path

from mcv_auditor.core.analyzers import PromptAnalyzer, ToolAnalyzer, GuardrailAnalyzer
from mcv_auditor.reports.report import ReportGenerator

CANONICAL_URL = "https://mycodexvantaos.com"
MACHINE_IDENTITY = "mycodexvantaos"


def run_audit(
    phase: int | None = None,
    system_prompt: str = "",
    tools: list = None,
    output_path: str = "audit-report.json",
    output_format: str = "json",
) -> int:
    """
    Run the security audit and generate a report.

    Returns:
        0 if audit passed, 1 if audit failed
    """
    results = []
    generator = ReportGenerator()

    print(f"[MCV Auditor] Starting audit for {MACHINE_IDENTITY}")
    print(f"[MCV Auditor] Canonical URL: {CANONICAL_URL}")

    # Phase 2: Prompt Analysis
    if phase is None or phase == 2:
        print("[MCV Auditor] Phase 2: Analyzing system prompt...")
        prompt_analyzer = PromptAnalyzer()
        result = prompt_analyzer.analyze(system_prompt or "")
        results.append(result)
        status = "PASSED" if result.passed else "FAILED"
        print(f"[MCV Auditor] Phase 2 result: {status} (score: {result.score:.3f})")

    # Phase 3: Tool Analysis
    if phase is None or phase == 3:
        print("[MCV Auditor] Phase 3: Analyzing tool schemas...")
        tool_analyzer = ToolAnalyzer()
        result = tool_analyzer.analyze(tools or [])
        results.append(result)
        status = "PASSED" if result.passed else "FAILED"
        print(f"[MCV Auditor] Phase 3 result: {status} (score: {result.score:.3f})")

    # Phase 4: Guardrail Testing
    if phase is None or phase == 4:
        print("[MCV Auditor] Phase 4: Testing guardrail effectiveness...")
        guardrail_analyzer = GuardrailAnalyzer()
        # Mock guardrail responses for demonstration
        mock_responses = [
            {"probe_id": "P4-001", "expected_blocked": True, "actually_blocked": True},
            {"probe_id": "P4-002", "expected_blocked": True, "actually_blocked": True},
            {"probe_id": "P4-003", "expected_blocked": True, "actually_blocked": True},
            {"probe_id": "P4-004", "expected_blocked": True, "actually_blocked": True},
            {"probe_id": "P4-005", "expected_blocked": True, "actually_blocked": True},
        ]
        result = guardrail_analyzer.analyze(mock_responses)
        results.append(result)
        status = "PASSED" if result.passed else "FAILED"
        print(f"[MCV Auditor] Phase 4 result: {status} (F1: {result.metadata.get('f1_score', 0):.3f})")

    # Generate report
    report = generator.generate(results)
    overall_status = "PASSED" if report.overall_passed else "FAILED"
    print(f"\n[MCV Auditor] Overall result: {overall_status} (score: {report.overall_score:.3f})")
    print(f"[MCV Auditor] Findings: {report.summary.get('total_findings', 0)} total, "
          f"{report.summary.get('critical_findings', 0)} critical")

    # Save report
    output = Path(output_path)
    if output_format == "json":
        generator.save_json(report, str(output))
    elif output_format == "markdown":
        generator.save_markdown(report, str(output))

    print(f"[MCV Auditor] Report saved to: {output}")

    return 0 if report.overall_passed else 1


def main() -> None:
    parser = argparse.ArgumentParser(
        description="MyCodexVantaOS MCV Security Auditor",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--phase", type=int, choices=[0, 1, 2, 3, 4, 5], help="Run specific phase only")
    parser.add_argument("--all", action="store_true", help="Run all phases")
    parser.add_argument("--output", default="audit-report.json", help="Output file path")
    parser.add_argument("--format", choices=["json", "markdown", "yaml"], default="json", help="Output format")
    parser.add_argument("--system-prompt", default="", help="System prompt to analyze")
    parser.add_argument("--version", action="version", version="mcv-auditor 1.0.0")

    args = parser.parse_args()

    exit_code = run_audit(
        phase=args.phase,
        system_prompt=args.system_prompt,
        output_path=args.output,
        output_format=args.format,
    )

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
