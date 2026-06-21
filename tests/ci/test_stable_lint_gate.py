import json
from pathlib import Path

import pytest

from scripts.ci.stable_lint_gate import main, read_file_list


def test_read_file_list_accepts_existing_safe_file(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    source = tmp_path / "src" / "ok.py"
    source.parent.mkdir(parents=True)
    source.write_text("VALUE = 1\n", encoding="utf-8")

    file_list = tmp_path / "files.txt"
    file_list.write_text("src/ok.py\n../secret.txt\nbad path.py\n", encoding="utf-8")

    assert read_file_list(file_list) == [Path("src/ok.py")]


def test_valid_python_passes(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    source = tmp_path / "src" / "ok.py"
    source.parent.mkdir(parents=True)
    source.write_text("VALUE = 1\n", encoding="utf-8")

    file_list = tmp_path / "files.txt"
    report = tmp_path / "report.json"
    file_list.write_text("src/ok.py\n", encoding="utf-8")

    assert main(["--file-list", str(file_list), "--report", str(report)]) == 0

    payload = json.loads(report.read_text(encoding="utf-8"))
    assert payload["ok"] is True
    assert payload["checkedFiles"] == 1


def test_invalid_json_fails(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    source = tmp_path / "config" / "bad.json"
    source.parent.mkdir(parents=True)
    source.write_text('{"broken": true,,}\n', encoding="utf-8")

    file_list = tmp_path / "files.txt"
    report = tmp_path / "report.json"
    file_list.write_text("config/bad.json\n", encoding="utf-8")

    assert main(["--file-list", str(file_list), "--report", str(report)]) == 1

    payload = json.loads(report.read_text(encoding="utf-8"))
    assert payload["ok"] is False
    assert "json-syntax-invalid" in {issue["code"] for issue in payload["issues"]}


def test_trailing_whitespace_fails(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    source = tmp_path / "src" / "bad.txt"
    source.parent.mkdir(parents=True)
    source.write_text("bad   \n", encoding="utf-8")

    file_list = tmp_path / "files.txt"
    report = tmp_path / "report.json"
    file_list.write_text("src/bad.txt\n", encoding="utf-8")

    assert main(["--file-list", str(file_list), "--report", str(report)]) == 1

    payload = json.loads(report.read_text(encoding="utf-8"))
    assert "trailing-whitespace" in {issue["code"] for issue in payload["issues"]}


def test_missing_final_newline_fails(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    source = tmp_path / "src" / "bad.json"
    source.parent.mkdir(parents=True)
    source.write_text('{"ok": true}', encoding="utf-8")

    file_list = tmp_path / "files.txt"
    report = tmp_path / "report.json"
    file_list.write_text("src/bad.json\n", encoding="utf-8")

    assert main(["--file-list", str(file_list), "--report", str(report)]) == 1

    payload = json.loads(report.read_text(encoding="utf-8"))
    assert "missing-final-newline" in {issue["code"] for issue in payload["issues"]}


def test_shell_syntax_failure_is_detected(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.chdir(tmp_path)
    source = tmp_path / "scripts" / "bad.sh"
    source.parent.mkdir(parents=True)
    source.write_text("if true; then\n  echo ok\n", encoding="utf-8")

    file_list = tmp_path / "files.txt"
    report = tmp_path / "report.json"
    file_list.write_text("scripts/bad.sh\n", encoding="utf-8")

    assert main(["--file-list", str(file_list), "--report", str(report)]) == 1

    payload = json.loads(report.read_text(encoding="utf-8"))
    assert "shell-syntax-invalid" in {issue["code"] for issue in payload["issues"]}
