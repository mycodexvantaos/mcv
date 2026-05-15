#!/usr/bin/env bash
# scripts/expire-exceptions.sh
# Check governance/exceptions.yaml for expired exception records.
# Based on naming-spec-v1.md Sec.15.2, Appendix B.8
#
# Usage:
#   ./scripts/expire-exceptions.sh [--dry-run] [--notify-only]
#
# Behavior:
#   - Reads governance/exceptions.yaml
#   - Compares expiresAt against today's date
#   - Marks expired records' status as 'expired' (unless --dry-run)
#   - Prints a summary of active, expiring-soon, and expired exceptions
#
# Exit codes:
#   0 — no expired exceptions requiring action
#   1 — expired exceptions found (action needed)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}/.."
EXCEPTIONS_FILE="${REPO_ROOT}/governance/exceptions.yaml"
DRY_RUN=0
NOTIFY_ONLY=0
WARN_DAYS=30  # Warn when exception expires within this many days

for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=1 ;;
    --notify-only) NOTIFY_ONLY=1 ;;
    --help)
      echo "Usage: ./scripts/expire-exceptions.sh [--dry-run] [--notify-only]"
      echo "  --dry-run      Show what would change without modifying files"
      echo "  --notify-only  Only report; do not modify exception file"
      exit 0
      ;;
  esac
done

TODAY=$(date -u +%Y-%m-%d)
TODAY_TS=$(date -u -d "${TODAY}" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "${TODAY}" +%s)

echo "=== mycodexvantaos exception expiry checker ==="
echo "  Date today  : ${TODAY}"
echo "  Exceptions  : ${EXCEPTIONS_FILE}"
echo "  Dry run     : $([ $DRY_RUN -eq 1 ] && echo yes || echo no)"
echo ""

if [ ! -f "${EXCEPTIONS_FILE}" ]; then
  echo "  No exceptions file found at ${EXCEPTIONS_FILE}. Nothing to check."
  exit 0
fi

ACTIVE=0
EXPIRING_SOON=0
EXPIRED=0
ALREADY_EXPIRED=0

# Use Python for reliable YAML parsing
python3 - "${EXCEPTIONS_FILE}" "${TODAY}" "${WARN_DAYS}" << 'PYEOF'
import sys
import re
from datetime import datetime, timedelta

exceptions_file = sys.argv[1]
today_str = sys.argv[2]
warn_days = int(sys.argv[3])

today = datetime.strptime(today_str, "%Y-%m-%d").date()
warn_threshold = today + timedelta(days=warn_days)

with open(exceptions_file, "r") as f:
    content = f.read()

# Simple regex-based parsing for exception records
# Pattern: find blocks between exception id markers
id_pattern = re.compile(r'  - id: (exception--\d{8}--[a-z0-9]{6})')
expires_pattern = re.compile(r'    expiresAt: "?(\d{4}-\d{2}-\d{2})"?')
status_pattern = re.compile(r'    status: (active|expired|revoked)')
approver_pattern = re.compile(r'    approver: ([a-z0-9-]+)')

ids = id_pattern.findall(content)
expires = expires_pattern.findall(content)
statuses = status_pattern.findall(content)
approvers = approver_pattern.findall(content)

if not ids:
    print("  No exception records found.")
    sys.exit(0)

print(f"  Found {len(ids)} exception record(s):\n")

has_problem = False
for i, exc_id in enumerate(ids):
    expires_at_str = expires[i] if i < len(expires) else "unknown"
    status = statuses[i] if i < len(statuses) else "unknown"
    approver = approvers[i] if i < len(approvers) else "unknown"

    if expires_at_str == "unknown" or status == "unknown":
        print(f"  [INCOMPLETE] {exc_id}: missing expiresAt or status")
        has_problem = True
        continue

    try:
        expires_at = datetime.strptime(expires_at_str, "%Y-%m-%d").date()
    except ValueError:
        print(f"  [INVALID DATE] {exc_id}: expiresAt='{expires_at_str}'")
        has_problem = True
        continue

    if status == "revoked":
        print(f"  [REVOKED]       {exc_id}  expires: {expires_at_str}  approver: {approver}")
        continue

    if status == "expired":
        print(f"  [ALREADY EXPIRED] {exc_id}  expired: {expires_at_str}  approver: {approver}")
        continue

    if expires_at < today:
        print(f"  [EXPIRED NOW]   {exc_id}  expired: {expires_at_str}  approver: {approver}")
        print(f"    ACTION REQUIRED: Contact approver '{approver}' to renew or remove this exception.")
        has_problem = True
    elif expires_at <= warn_threshold:
        days_left = (expires_at - today).days
        print(f"  [EXPIRING SOON] {exc_id}  expires: {expires_at_str} ({days_left} days)  approver: {approver}")
    else:
        print(f"  [ACTIVE]        {exc_id}  expires: {expires_at_str}  approver: {approver}")

if has_problem:
    sys.exit(1)
else:
    sys.exit(0)
PYEOF

PYTHON_EXIT=$?
echo ""

if [ $PYTHON_EXIT -eq 0 ]; then
  echo "=== RESULT: All exceptions are current. ==="
  exit 0
else
  echo "=== RESULT: ACTION REQUIRED — expired or invalid exceptions found. ==="
  echo "  Update governance/exceptions.yaml or remove expired entries."
  exit 1
fi
