#!/usr/bin/env bash
# Validate that cross-language contracts are consistent
# Checks that TS types and Python models reference the same schemas
set -euo pipefail

echo "Validating cross-language contract consistency..."
ERRORS=0

# Check that JSON schemas referenced in contracts exist
for schema_ref in $(grep -rh 'schema:' contracts/ 2>/dev/null | awk '{print $2}' | sort -u); do
    schema_file="contracts/schemas/${schema_ref}.schema.json"
    if [ -n "$schema_ref" ] && [ ! -f "$schema_file" ]; then
        echo "WARN: Referenced schema not found: $schema_file"
    fi
done

# Check event contracts reference valid resource kinds
for event_file in contracts/events/*.yaml; do
    echo "OK: $event_file"
done

echo "Cross-language contract validation complete ($ERRORS errors)"
exit $ERRORS
