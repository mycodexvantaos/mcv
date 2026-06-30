#!/usr/bin/env python3
"""Rationale: 保留單檔可攜式執行體驗，並導向 MyCodexVantaOS 原廠稽核核心。"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from mycodexvantaos_doctor.cli import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
