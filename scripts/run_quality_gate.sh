#!/usr/bin/env bash
set -euo pipefail

python -m pytest tests
python scripts/project_doctor.py --path . --output reports/mycodexvantaos_audit.json --markdown reports/MyCodexVantaOS_Audit_Report.md --fail-on critical
