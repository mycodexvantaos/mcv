"""
MCV Auditor run_audit integration tests — MyCodexVantaOS v1.0.0

Tests the CLI entry point with --root, --output-dir, and --strict flags.

Document ID: IM-MCV-002
"""

from __future__ import annotations

import json
import pathlib

from mcv_auditor.run_audit import main


def test_run_audit_writes_report(tmp_path: pathlib.Path, monkeypatch) -> None:
    """Running audit with a valid repo structure should produce a report."""
    repo = tmp_path / "repo"
    repo.mkdir()

    (repo / "package.json").write_text('{"name":"fixture"}', encoding="utf-8")
    (repo / ".github" / "workflows").mkdir(parents=True)
    (repo / "packages" / "core" / "src" / "config").mkdir(parents=True)
    (repo / "packages" / "core" / "src" / "lib").mkdir(parents=True)
    (repo / "packages" / "core" / "src" / "config" / "domains.ts").write_text(
        "export const canonicalUrl = 'https://mycodexvantaos.com';",
        encoding="utf-8",
    )
    (repo / "packages" / "core" / "src" / "lib" / "security-headers.ts").write_text(
        "export const headers = {};",
        encoding="utf-8",
    )

    output = tmp_path / "out"

    monkeypatch.setattr(
        "sys.argv",
        ["run_audit.py", "--root", str(repo), "--output-dir", str(output)],
    )

    exit_code = main()

    assert exit_code == 0

    report_path = output / "mcv-audit-report.json"
    assert report_path.exists()

    report = json.loads(report_path.read_text(encoding="utf-8"))
    assert report["reportVersion"] == "1.0.0"
    assert report["summary"]["phaseCount"] == 5


def test_run_audit_strict_returns_failure_for_missing_environment(tmp_path: pathlib.Path, monkeypatch) -> None:
    """Running audit with --strict should return 1 when environment validation fails."""
    output = tmp_path / "out"

    monkeypatch.setattr(
        "sys.argv",
        ["run_audit.py", "--root", str(tmp_path), "--output-dir", str(output), "--strict"],
    )

    exit_code = main()

    assert exit_code == 1
