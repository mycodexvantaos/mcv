#!/usr/bin/env bash
# scripts/run-service-tests.sh
#
# Unified test aggregation entry point for all service-level unit tests.
#
# Dynamically discovers all `services/*/src/__tests__/*.test.ts` files and runs
# them through the Node.js built-in test runner (`node --import tsx --test`).
# This replaces the hardcoded file list previously in root `package.json` →
# `test:services`, ensuring new test files are automatically picked up without
# manual list maintenance.
#
# Exit codes:
#   0 — all discovered test files passed
#   1 — one or more test files failed, or no test files were found
#
# Usage:
#   ./scripts/run-service-tests.sh
#   pnpm test:services   (delegates to this script)

set -euo pipefail

# Resolve repo root (this script lives in scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "── run-service-tests.sh ──────────────────────────────────────────"
echo "  Repo: $REPO_ROOT"
echo "  Mode: dynamic discovery (services/*/src/__tests__/*.test.ts)"
echo ""

# Dynamically discover all service test files.
# Exclude files that import 'vitest' — those use a different test runner and
# are not compatible with `node --test`. (Only core-auth's jwt-token-manager
# test currently falls in this category.)
mapfile -t ALL_CANDIDATES < <(find services -path '*/src/__tests__/*.test.ts' -type f | sort)

TEST_FILES=()
SKIPPED_FILES=()
for f in "${ALL_CANDIDATES[@]}"; do
  if grep -qE "^import .* from 'vitest'" "$f" 2>/dev/null; then
    SKIPPED_FILES+=("$f")
  else
    TEST_FILES+=("$f")
  fi
done

if [ "${#TEST_FILES[@]}" -eq 0 ]; then
  echo "ERROR: No test files found matching services/*/src/__tests__/*.test.ts"
  exit 1
fi

echo "  Discovered ${#TEST_FILES[@]} test file(s):"
for f in "${TEST_FILES[@]}"; do
  echo "    • $f"
done
if [ "${#SKIPPED_FILES[@]}" -gt 0 ]; then
  echo ""
  echo "  Skipped ${#SKIPPED_FILES[@]} vitest-based test file(s) (incompatible with node --test):"
  for f in "${SKIPPED_FILES[@]}"; do
    echo "    ⊘ $f"
  done
fi
echo ""

# Run all discovered test files in a single node --test invocation
# (passing all files at once lets Node's test runner aggregate results)
FAILED=0
if ! node --import tsx --test "${TEST_FILES[@]}"; then
  FAILED=1
fi

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "✅ All ${#TEST_FILES[@]} test file(s) passed."
  exit 0
else
  echo "❌ One or more test files failed."
  exit 1
fi
