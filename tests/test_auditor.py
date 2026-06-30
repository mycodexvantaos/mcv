from pathlib import Path

from mycodexvantaos_doctor.auditor import MyCodexVantaOSAuditor


def test_auditor_classifies_native_markdown(tmp_path: Path) -> None:
    doc = tmp_path / "capabilities.md"
    doc.write_text(
        "# Cloud Runtime\n\n"
        "MyCodexVantaOS Cloud Runtime 提供持久雲端主機、Snapshot 與 Browser-Agent-VM。\n",
        encoding="utf-8",
    )

    report = MyCodexVantaOSAuditor(tmp_path).run()

    assert report.summary["total_files"] == 1
    assert report.classifications[0].category in {"服務", "能力", "產品", "工具", "類別"}
    assert "Cloud Runtime" in report.classifications[0].modules
    assert "Browser-Agent-VM" in report.classifications[0].modules


def test_auditor_detects_banned_external_terms(tmp_path: Path) -> None:
    doc = tmp_path / "architecture.md"
    doc.write_text("此文件不得引用 MuleRun 或 Zapier。\n", encoding="utf-8")

    report = MyCodexVantaOSAuditor(tmp_path).run()

    codes = [finding.code for finding in report.findings]
    assert codes.count("MCV-NAMING-001") == 2


def test_auditor_detects_python_security_risks(tmp_path: Path) -> None:
    py = tmp_path / "unsafe.py"
    py.write_text(
        "import os\n\n"
        "def run(x):\n"
        "    try:\n"
        "        return eval(x)\n"
        "    except:\n"
        "        os.system(x)\n",
        encoding="utf-8",
    )

    report = MyCodexVantaOSAuditor(tmp_path).run()
    codes = {finding.code for finding in report.findings}

    assert "MCV-PY-SEC-001" in codes
    assert "MCV-PY-SEC-002" in codes
    assert "MCV-PY-SEC-004" in codes


def test_auditor_writes_json_and_markdown(tmp_path: Path) -> None:
    doc = tmp_path / "README.md"
    doc.write_text("# MyCodexVantaOS\n\nKnowledge Network 與 Tool Gateway。\n", encoding="utf-8")

    auditor = MyCodexVantaOSAuditor(tmp_path)
    json_path = auditor.write_report(tmp_path / "report.json")
    md_path = auditor.write_markdown_architecture(tmp_path / "report.md")

    assert json_path.exists()
    assert md_path.exists()
    assert "Knowledge Network" in md_path.read_text(encoding="utf-8")
