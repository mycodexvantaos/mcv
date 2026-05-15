#!/usr/bin/env bash
# Validate resource kind definitions
set -euo pipefail

KINDS_DIR="contracts/resource-kinds"
ERRORS=0
COUNT=0

for kind_file in "$KINDS_DIR"/*.yaml; do
    COUNT=$((COUNT + 1))
    # Check required fields
    if ! python3 -c "
import yaml, sys
with open('$kind_file') as f:
    d = yaml.safe_load(f)
required = ['kind', 'apiVersion', 'spec']
for r in required:
    if r not in d:
        print(f'Missing: {r}')
        sys.exit(1)
" 2>/dev/null; then
        echo "FAIL: $kind_file (missing required fields)"
        ERRORS=$((ERRORS + 1))
    else
        echo "OK: $kind_file"
    fi
done

echo "Validated $COUNT resource kinds ($ERRORS errors)"
exit $ERRORS
