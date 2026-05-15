#!/usr/bin/env bash
# Review pending dream proposals
set -euo pipefail

echo "=== Dream Proposal Review ==="
echo ""
echo "Pending Proposals:"
echo "  (Query D1 for proposals with status='proposal')"
echo ""
echo "Usage:"
echo "  dream-review.sh --approve <proposal-id>"
echo "  dream-review.sh --reject <proposal-id>"
echo "  dream-review.sh --list"
echo ""

if [ "${1:-}" = "--list" ]; then
    echo "Listing all pending proposals..."
    # TODO: Query D1 for pending proposals
fi
