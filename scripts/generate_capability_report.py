#!/usr/bin/env python3
"""Rationale: 為治理倉庫產生正式 MyCodexVantaOS 原廠能力架構書。"""

from __future__ import annotations

import argparse
from pathlib import Path

from mycodexvantaos_doctor.auditor import MyCodexVantaOSAuditor


def main() -> int:
    parser = argparse.ArgumentParser(description="產生 MyCodexVantaOS 原廠能力架構稽核報告")
    parser.add_argument("--path", default=".", help="專案根目錄")
    parser.add_argument("--output", default="reports/MyCodexVantaOS_Capabilities_Audit.md", help="Markdown 輸出路徑")
    args = parser.parse_args()

    auditor = MyCodexVantaOSAuditor(args.path)
    output = auditor.write_markdown_architecture(Path(args.output))
    print(str(output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
