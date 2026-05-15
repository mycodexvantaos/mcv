#!/usr/bin/env bash
# Validate all JSON schemas in contracts/schemas/
set -euo pipefail

SCHEMA_DIR="contracts/schemas"
ERRORS=0

for schema in "$SCHEMA_DIR"/*.schema.json; do
    if python3 -c "import json; json.load(open('$schema'))" 2>/dev/null; then
        echo "OK: $schema"
    else
        echo "FAIL: $schema (invalid JSON)"
        ERRORS=$((ERRORS + 1))
    fi
done

exit $ERRORS
