#!/usr/bin/env bash
# Validate policy contracts
set -euo pipefail

POLICIES_DIR="contracts/policies"
ERRORS=0

for policy_file in "$POLICIES_DIR"/*.yaml; do
    if python3 -c "
import yaml, sys
with open('$policy_file') as f:
    d = yaml.safe_load(f)
required = ['name', 'description', 'rules']
for r in required:
    if r not in d:
        print(f'Missing: {r}')
        sys.exit(1)
" 2>/dev/null; then
        echo "OK: $policy_file"
    else
        echo "FAIL: $policy_file"
        ERRORS=$((ERRORS + 1))
    fi
done

exit $ERRORS
