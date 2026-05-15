#!/usr/bin/env bash
# Validate all YAML contracts in contracts/
set -euo pipefail

ERRORS=0

validate_yaml_dir() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        return
    fi
    for file in "$dir"/*.yaml; do
        if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            echo "OK: $file"
        else
            echo "FAIL: $file (invalid YAML)"
            ERRORS=$((ERRORS + 1))
        fi
    done
}

validate_yaml_dir "contracts/service-definitions"
validate_yaml_dir "contracts/events"
validate_yaml_dir "contracts/policies"
validate_yaml_dir "contracts/resource-kinds"

exit $ERRORS
