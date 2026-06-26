#!/usr/bin/env bash
# scripts/namespace-governance-ci.sh
# MyCodexVantaOS — Namespace Governance CI Runner
# Governance Code: mycodexvantaos-00000
# Spec: docs/governance/namespace-governance-closure-spec.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CI_SCRIPT="${REPO_ROOT}/ci/namespace_check.py"
REPORT_DIR="${REPO_ROOT}/ci-reports"
REGISTRY="${REPO_ROOT}/config/namespace-registry-baseline.yaml"
DEP_GRAPH="${REPO_ROOT}/config/dependency-graph-baseline.yaml"

VERBOSE="${NAMESPACE_CI_VERBOSE:---verbose}"

# Ensure Python is available
if ! command -v python3 &>/dev/null; then
    echo "[FATAL] python3 not found in PATH" >&2
    exit 2
fi

# Ensure PyYAML is available for YAML parsing
python3 -c "import yaml" 2>/dev/null || {
    echo "[INFO] Installing PyYAML for YAML support..."
    pip install -q pyyaml
}

mkdir -p "${REPORT_DIR}"

echo "=== Namespace Governance CI ==="
echo "Repo:     ${REPO_ROOT}"
echo "Spec:     mycodexvantaos-00000"
echo "Registry: ${REGISTRY}"
echo "DepGraph: ${DEP_GRAPH}"
echo "Reports:  ${REPORT_DIR}"
echo ""

EXIT_CODE=0

# 1. Validate repository names from baseline registry
echo "--- Phase 1: Repository Name Validation ---"
while IFS= read -r repo; do
    if [ -n "${repo}" ]; then
        python3 "${CI_SCRIPT}" --repo-name "${repo}" ${VERBOSE} --report-dir "${REPORT_DIR}" || EXIT_CODE=1
    fi
done < <(python3 -c "
import yaml
with open('${REGISTRY}') as f:
    data = yaml.safe_load(f)
for r in data.get('spec', {}).get('records', []):
    print(r.get('repository', ''))
")

# 2. Validate governance codes from baseline registry
echo ""
echo "--- Phase 2: Governance Code Validation ---"
while IFS= read -r code; do
    if [ -n "${code}" ]; then
        python3 "${CI_SCRIPT}" --governance-code "${code}" ${VERBOSE} --report-dir "${REPORT_DIR}" || EXIT_CODE=1
    fi
done < <(python3 -c "
import yaml
with open('${REGISTRY}') as f:
    data = yaml.safe_load(f)
for r in data.get('spec', {}).get('records', []):
    gc = r.get('governanceCode', '')
    if gc:
        print(gc)
")

# 3. Validate namespace registry
echo ""
echo "--- Phase 3: Namespace Registry Validation ---"
if [ -f "${REGISTRY}" ]; then
    python3 "${CI_SCRIPT}" --registry "${REGISTRY}" ${VERBOSE} --report-dir "${REPORT_DIR}" || EXIT_CODE=1
else
    echo "[WARN] Registry file not found: ${REGISTRY}"
fi

# 4. Validate dependency graph
echo ""
echo "--- Phase 4: Dependency Graph Validation ---"
if [ -f "${DEP_GRAPH}" ]; then
    python3 "${CI_SCRIPT}" --dep-graph "${DEP_GRAPH}" ${VERBOSE} --report-dir "${REPORT_DIR}" || EXIT_CODE=1
else
    echo "[WARN] Dependency graph file not found: ${DEP_GRAPH}"
fi

# 5. File header path scan (skip node_modules, .git, ci-reports)
echo ""
echo "--- Phase 5: File Header Path Scan ---"
python3 "${CI_SCRIPT}" --scan-dir "${REPO_ROOT}" ${VERBOSE} --report-dir "${REPORT_DIR}" || EXIT_CODE=1

# Summary
echo ""
echo "=== Namespace Governance CI Complete ==="
echo "Exit code: ${EXIT_CODE}"
if [ "${EXIT_CODE}" -ne 0 ]; then
    echo "RESULT: FAIL — one or more MUST checks failed"
else
    echo "RESULT: PASS — all MUST checks passed"
fi

exit ${EXIT_CODE}
