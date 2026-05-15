#!/usr/bin/env bash
# scripts/rename-mycodexvantaos.sh
# Rename legacy org identity strings to the canonical mycodexvantaos form.
# Based on naming-spec-v1.md Sec.4, Appendix B.4
#
# Replaces:
#   mycodexvanta-os   → mycodexvantaos
#   codexvanta-os     → mycodexvantaos
#   codexvanta        → mycodexvantaos  (use with care — may affect unrelated strings)
#
# Usage:
#   ./scripts/rename-mycodexvantaos.sh [--dry-run] [--target-dir=<path>]
#
# Exit codes:
#   0 — success
#   1 — error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${SCRIPT_DIR}/.."
DRY_RUN=0

for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=1 ;;
    --target-dir=*) TARGET_DIR="${arg#*=}" ;;
    --help)
      echo "Usage: ./scripts/rename-mycodexvantaos.sh [--dry-run] [--target-dir=<path>]"
      echo "  --dry-run         Show replacements without modifying files"
      echo "  --target-dir=<p>  Directory to scan (default: repo root)"
      exit 0
      ;;
  esac
done

echo "=== mycodexvantaos legacy prefix renamer ==="
echo "  Target dir : ${TARGET_DIR}"
echo "  Dry run    : $([ $DRY_RUN -eq 1 ] && echo yes || echo no)"
echo ""

# File types to process
EXTENSIONS=( "*.yaml" "*.json" "*.ts" "*.js" "*.sh" "*.md" )

# Replacements: order matters — most specific first
declare -A REPLACEMENTS=(
  ["mycodexvanta-os"]="mycodexvantaos"
  ["codexvanta-os"]="mycodexvantaos"
)

CHANGED_FILES=0

for EXT in "${EXTENSIONS[@]}"; do
  while IFS= read -r -d '' FILE; do
    # Skip this script itself and spec docs
    [[ "${FILE}" == *"rename-mycodexvantaos.sh" ]] && continue
    [[ "${FILE}" == *"naming-spec-v1.md" ]] && continue

    NEEDS_CHANGE=0
    for PATTERN in "${!REPLACEMENTS[@]}"; do
      if grep -q "${PATTERN}" "${FILE}" 2>/dev/null; then
        NEEDS_CHANGE=1
        break
      fi
    done

    if [ $NEEDS_CHANGE -eq 1 ]; then
      echo "  Processing: ${FILE}"
      for PATTERN in "${!REPLACEMENTS[@]}"; do
        REPLACEMENT="${REPLACEMENTS[$PATTERN]}"
        if grep -q "${PATTERN}" "${FILE}" 2>/dev/null; then
          if [ $DRY_RUN -eq 0 ]; then
            sed -i "s/${PATTERN}/${REPLACEMENT}/g" "${FILE}"
          fi
          echo "    [$([ $DRY_RUN -eq 1 ] && echo DRY-RUN || echo CHANGED)] '${PATTERN}' → '${REPLACEMENT}'"
        fi
      done
      CHANGED_FILES=$((CHANGED_FILES + 1))
    fi
  done < <(find "${TARGET_DIR}" -name "${EXT}" -type f -print0 2>/dev/null)
done

echo ""
echo "=== Summary ==="
echo "  Files $([ $DRY_RUN -eq 1 ] && echo 'that would be changed' || echo 'changed'): ${CHANGED_FILES}"
[ $DRY_RUN -eq 1 ] && echo "  (Dry run — no files were modified.)"
