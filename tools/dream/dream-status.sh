#!/usr/bin/env bash
# Check dream system status
set -euo pipefail

echo "=== Dream System Status ==="
echo ""

# Check if dream worker is running
if pgrep -f "dream-worker" > /dev/null 2>&1; then
    echo "Dream Worker: RUNNING"
else
    echo "Dream Worker: STOPPED"
fi

echo ""
echo "Recent Dream Jobs:"
echo "  (Query D1 for dream job status)"

echo ""
echo "Memory Statistics:"
echo "  (Query D1 for memory item counts by status)"
