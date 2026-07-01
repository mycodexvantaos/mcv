"""Rationale: 提供 CI/CD 與本機終端一致的 MyCodexVantaOS Doctor 執行入口。"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from mycodexvantaos_doctor.auditor import MyCodexVantaOSAuditor


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="mycodexvantaos-doctor",
        description="MyCodexVantaOS 原廠命名規範與能力模組稽核器",
    )
    parser.add_argument("--path", required=True, help="欲分析的專案目錄或單一檔案")
    parser.add_argument("--output", default="reports/mycodexvantaos_audit.json", help="JSON 報告輸出路徑")
    parser.add_argument("--markdown", default="reports/MyCodexVantaOS_Audit_Report.md", help="Markdown 報告輸出路徑")
    parser.add_argument("--fail-on", choices=["none", "medium", "high", "critical", "blocker"], default="critical")
    return parser


def should_fail(summary: dict[str, object], threshold: str) -> bool:
    if threshold == "none":
        return False
    order = {"medium": 1, "high": 2, "critical": 3, "blocker": 4}
    severity_counts = summary.get("severity_counts", {})
    if not isinstance(severity_counts, dict):
        return False
    target = order[threshold]
    for severity, count in severity_counts.items():
        if order.get(str(severity), 0) >= target and int(count) > 0:
            return True
    return False


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        auditor = MyCodexVantaOSAuditor(args.path)
        json_path = auditor.write_report(args.output)
        md_path = auditor.write_markdown_architecture(args.markdown)
        report = json.loads(Path(json_path).read_text(encoding="utf-8"))
        result = {
            "status": "failed" if should_fail(report["summary"], args.fail_on) else "passed",
            "json_report": str(json_path),
            "markdown_report": str(md_path),
            "summary": report["summary"],
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 1 if result["status"] == "failed" else 0
    except Exception as exc:
        print(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False, indent=2), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
