from pathlib import Path

from mycodexvantaos_doctor.cli import main, should_fail


def test_should_fail_threshold() -> None:
    assert should_fail({"severity_counts": {"critical": 1}}, "critical") is True
    assert should_fail({"severity_counts": {"high": 1}}, "critical") is False
    assert should_fail({"severity_counts": {"blocker": 1}}, "high") is True
    assert should_fail({"severity_counts": {"critical": 1}}, "none") is False


def test_cli_generates_reports(tmp_path: Path) -> None:
    source = tmp_path / "doc.md"
    source.write_text("# Tool Gateway\n\nMyCodexVantaOS Tool Gateway。\n", encoding="utf-8")

    output = tmp_path / "audit.json"
    markdown = tmp_path / "audit.md"

    code = main(["--path", str(tmp_path), "--output", str(output), "--markdown", str(markdown), "--fail-on", "none"])

    assert code == 0
    assert output.exists()
    assert markdown.exists()
