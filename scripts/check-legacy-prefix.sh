#!/usr/bin/env bash
# scripts/check-legacy-prefix.sh
# Scan the repository for forbidden legacy prefixes.
# Based on naming-spec-v1.md Sec.4, Appendix B.4
#
# Forbidden prefixes:
#   - mycodexvanta-os
#   - codexvanta
#   - codexvanta-os
#
# Usage:
#   ./scripts/check-legacy-prefix.sh [<repo-root>]
#
# Exit codes:
#   0 — no forbidden prefixes found
#   1 — one or more forbidden prefixes found

set -euo pipefail

REPO_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# Patterns to detect (in resource names, not in comments or spec docs)
PATTERNS=(
  "mycodexvanta-os"
  "codexvanta-os"
  "codexvanta"
)

# Directories and files to scan
SCAN_DIRS=(
  "services"
  "modules"
  "packages"
  "providers"
  "infra"
  "vector-store"
  "knowledge-graph"
  "search-indexes"
  "catalog"
)

# File extensions to scan
EXTENSIONS="*.yaml *.json *.ts *.js *.sh *.md"

# Exclusions: don't scan spec docs or the checker itself
EXCLUDED_PATHS=(
  "docs/naming-spec-v1.md"
  "scripts/check-legacy-prefix.sh"
  "ci/fixtures/invalid-names.yaml"
)

echo "Scanning for forbidden legacy prefixes in: ${REPO_ROOT}"
echo "Patterns: ${PATTERNS[*]}"
echo ""

FOUND=0
TOTAL_SCANNED=0

for SCAN_DIR in "${SCAN_DIRS[@]}"; do
  FULL_DIR="${REPO_ROOT}/${SCAN_DIR}"
  if [ ! -d "${FULL_DIR}" ]; then
    continue
  fi

  while IFS= read -r -d '' FILE; do
    # Skip excluded paths
    SKIP=0
    for EXCL in "${EXCLUDED_PATHS[@]}"; do
      if [[ "${FILE}" == *"${EXCL}"* ]]; then
        SKIP=1
        break
      fi
    done
    [ $SKIP -eq 1 ] && continue

    TOTAL_SCANNED=$((TOTAL_SCANNED + 1))

    for PATTERN in "${PATTERNS[@]}"; do
      # Use grep -E to avoid matching the correct prefix 'mycodexvantaos'
      # We look for the pattern as a whole word or followed by something other than 'os'
      if grep -qE "(^|[^a-zA-Z0-9])${PATTERN}([^a-zA-Z0-9]|$)" "${FILE}" 2>/dev/null; then
        MATCHES=$(grep -nE "(^|[^a-zA-Z0-9])${PATTERN}([^a-zA-Z0-9]|$)" "${FILE}" | head -5)
        echo "VIOLATION: Legacy prefix '${PATTERN}' found in ${FILE}"
        echo "${MATCHES}" | while IFS= read -r LINE; do
          echo "  ${LINE}"
        done
        echo ""
        FOUND=$((FOUND + 1))
      fi
    done
  done < <(find "${FULL_DIR}" -type f \( -name "*.yaml" -o -name "*.json" -o -name "*.ts" -o -name "*.js" -o -name "*.sh" \) -print0)
done

echo "Scanned ${TOTAL_SCANNED} files."

if [ $FOUND -gt 0 ]; then
  echo ""
  echo "RESULT: FAIL — ${FOUND} file(s) contain forbidden legacy prefixes."
  echo "Remove or rename all occurrences of: ${PATTERNS[*]}"
  exit 1
else
  echo "RESULT: PASS — No forbidden legacy prefixes found."
  exit 0
fi
