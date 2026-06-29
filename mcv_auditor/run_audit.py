#!/usr/bin/env python3
"""
MCV Auditor entrypoint — MyCodexVantaOS v1.0.0

Rationale:
Implements the five-phase deterministic audit pipeline:
- Phase 0: environment validation
- Phase 1: system prompt extraction
- Phase 2: domain policy analysis
- Phase 3: secret pattern detection
- Phase 4: guardrail probe evaluation

The audit is offline, reproducible, and CI-safe. No mock responses are used.

Document ID: IM-MCV-002
"""

from __future__ import annotations

import argparse
import pathlib
import sys

from mcv_auditor.core.analyzers import (
    aggregate_results,
    analyze_domain_policy,
    analyze_secret_patterns,
    evaluate_guardrails,
    extract_system_prompts,
    validate_environment,
    write_report,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run MyCodexVantaOS deep audit.")
    parser.add_argument(
        "--root",
        default=".",
        help="Repository root path.",
    )
    parser.add_argument(
        "--output-dir",
        default="outputs/mcv_auditor",
        help="Audit output directory.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero when report status is FAIL.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = pathlib.Path(args.root).resolve()
    output_dir = pathlib.Path(args.output_dir).resolve()

    results = [
        validate_environment(root),
        extract_system_prompts(root),
        analyze_domain_policy(root),
        analyze_secret_patterns(root),
        evaluate_guardrails(),
    ]

    report = aggregate_results(results)
    report_path = write_report(report, output_dir)

    print(f"MCV audit report: {report_path}")
    print(f"MCV audit status: {report['status']}")
    print(f"MCV audit errors: {report['summary']['errorFindings']}")
    print(f"MCV audit warnings: {report['summary']['warningFindings']}")

    if args.strict and report["status"] != "PASS":
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
