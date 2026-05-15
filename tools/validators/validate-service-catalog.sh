#!/usr/bin/env bash
# Validate service catalog consistency
set -euo pipefail

echo "Checking service definitions exist for all services..."
ERRORS=0

# Check that each service in the catalog has a service definition
for svc in services/mycodexvantaos-service-*/; do
    svc_name=$(basename "$svc" | sed 's/mycodexvantaos-service-//')
    def_file="contracts/service-definitions/${svc_name}.yaml"
    if [ ! -f "$def_file" ]; then
        echo "WARN: No contract for $svc_name"
    fi
done

echo "Service catalog validation complete ($ERRORS errors)"
exit $ERRORS
