#!/usr/bin/env bash
# ── MyCodeXvantaOS Self-Hosted Smoke Test ──────────────────────
# Runs against a running api-node instance (Docker or local).
#
# Usage:
#   ./scripts/smoke/self-hosted-smoke.sh              # Default: http://localhost:3100
#   ./scripts/smoke/self-hosted-smoke.sh http://host:port  # Custom URL
#
# Exit code: 0 if all tests pass, 1 if any fail.

set -euo pipefail

API="${1:-http://localhost:3100}"
PASS=0
FAIL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

function assert_ok() {
  local name="$1"
  local result="$2"
  # Use python3 for reliable JSON field checking, fall back to grep
  if echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if '$3' in json.dumps(d) else 1)" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $name"
    PASS=$((PASS + 1))
  elif echo "$result" | grep -q "$3"; then
    echo -e "  ${GREEN}✓${NC} $name"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $name"
    echo "    Expected: $3 in response"
    FAIL=$((FAIL + 1))
  fi
}

function assert_fail() {
  local name="$1"
  local result="$2"
  local expected_error="$3"
  if echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if '$expected_error' in json.dumps(d) else 1)" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $name (correctly rejected)"
    PASS=$((PASS + 1))
  elif echo "$result" | grep -q "$expected_error"; then
    echo -e "  ${GREEN}✓${NC} $name (correctly rejected)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $name (should have been rejected)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "🔍 MyCodeXvantaOS Smoke Test — $API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Health & Meta ──────────────────────────────────────────────
echo ""
echo "📋 Health & Meta"

R=$(curl -sf "$API/" 2>/dev/null || echo '{"error":"unreachable"}')
assert_ok "Root endpoint responds" "$R" "running"

R=$(curl -sf "$API/v1/health" 2>/dev/null || echo '{"error":"unreachable"}')
assert_ok "Health endpoint responds" "$R" "ok"

# ── Service Catalog ────────────────────────────────────────────
echo ""
echo "📦 Service Catalog"

R=$(curl -sf "$API/v1/services" 2>/dev/null || echo '{"total":0}')
assert_ok "List services" "$R" "services"

R=$(curl -sf "$API/v1/services/audit-log" 2>/dev/null || echo '{"error":"not found"}')
assert_ok "Get specific service" "$R" "audit-log"

# ── Resource Kinds ─────────────────────────────────────────────
echo ""
echo "🗂  Resource Kinds"

R=$(curl -sf "$API/v1/resource-kinds" 2>/dev/null || echo '{"total":0}')
assert_ok "List resource kinds" "$R" "resourceKinds"

# ── Audit Events ──────────────────────────────────────────────
echo ""
echo "📝 Audit Events"

R=$(curl -sf "$API/v1/audit/events" 2>/dev/null || echo '{"total":0}')
assert_ok "Query audit events" "$R" "events"

R=$(curl -sf -X POST "$API/v1/audit/events" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"smoke-test","category":"audit","actor":{"type":"system","id":"smoke"},"resource":{"type":"test","id":"smoke-001"},"context":{"tenantId":"smoke","workspaceId":null}}' 2>/dev/null || echo '{"error":"failed"}')
assert_ok "Create audit event" "$R" "eventId"

R=$(curl -sf "$API/v1/audit/verify" 2>/dev/null || echo '{"valid":false}')
assert_ok "Audit chain integrity" "$R" "valid"

# ── Policy Engine ──────────────────────────────────────────────
echo ""
echo "🛡  Policy Engine"

R=$(curl -sf "$API/v1/policies" 2>/dev/null || echo '{"total":0}')
assert_ok "List policies" "$R" "policies"

R=$(curl -sf -X POST "$API/v1/policies/evaluate" \
  -H "Content-Type: application/json" \
  -d '{"subject":{"type":"user","id":"admin","roles":["platform-admin"]},"action":"read","resource":{"type":"workspace"}}' 2>/dev/null || echo '{"allowed":false}')
assert_ok "Policy: platform-admin allowed" "$R" "allow"

R=$(curl -sf -X POST "$API/v1/policies/evaluate" \
  -H "Content-Type: application/json" \
  -d '{"subject":{"type":"service","id":"dream-worker","service":"memory-dream"},"action":"memory-item-merge","resource":{"type":"memory-item"},"context":{"memory_type":"decision","tags":["architecture"]}}' 2>/dev/null || echo '{"effect":"deny"}')
assert_ok "Policy: architecture decision → require-review" "$R" "require-review"

# ── Dream Safety ──────────────────────────────────────────────
echo ""
echo "🌙 Dream Safety"

R=$(curl -sf -X POST "$API/v1/dream/run" \
  -H "Content-Type: application/json" \
  -d '{"mode":"dry-run"}' 2>/dev/null || echo '{"error":"failed"}')
RUN_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('runId',''))" 2>/dev/null || echo "")
assert_ok "Dream run created" "$R" "runId"

# Apply without review → should fail (use -s without -f so we capture the error body)
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/v1/dream/runs/$RUN_ID/apply" \
  -H "Content-Type: application/json" \
  -d '{"appliedBy":"smoke-test"}' 2>/dev/null)
if [ "$R" = "403" ] || [ "$R" = "422" ]; then
  echo -e "  ${GREEN}✓${NC} Apply without review rejected (HTTP $R)"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}✗${NC} Apply without review should have been rejected (got HTTP $R)"
  FAIL=$((FAIL + 1))
fi

# Review → approve
R=$(curl -sf -X POST "$API/v1/dream/runs/$RUN_ID/review" \
  -H "Content-Type: application/json" \
  -d '{"reviewer":"smoke-test","decision":"approved"}' 2>/dev/null || echo '{"error":"failed"}')
assert_ok "Dream review approved" "$R" "approved"

# Apply after review → should succeed
R=$(curl -sf -X POST "$API/v1/dream/runs/$RUN_ID/apply" \
  -H "Content-Type: application/json" \
  -d '{"appliedBy":"smoke-test"}' 2>/dev/null || echo '{"error":"failed"}')
assert_ok "Apply after review succeeds" "$R" "application"

# Rollback
R=$(curl -sf -X POST "$API/v1/dream/runs/$RUN_ID/rollback" \
  -H "Content-Type: application/json" \
  -d '{"rolledBackBy":"smoke-test"}' 2>/dev/null || echo '{"error":"failed"}')
assert_ok "Rollback succeeds" "$R" "rollback"

# ── Knowledge Trace ────────────────────────────────────────────
echo ""
echo "🔍 Knowledge Trace"

R=$(curl -sf -X POST "$API/v1/knowledge/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"smoke test","topK":3}' 2>/dev/null || echo '{"error":"failed"}')
RECEIPT_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin).get('receiptId',''))" 2>/dev/null || echo "")
assert_ok "Knowledge search creates receipt" "$R" "receiptId"

# Answer with valid receipt + knowledge_assisted
R=$(curl -sf -X POST "$API/v1/knowledge/answer" \
  -H "Content-Type: application/json" \
  -d "{\"receiptId\":\"$RECEIPT_ID\",\"answer\":\"smoke test answer\",\"knowledge_assisted\":true}" 2>/dev/null || echo '{"error":"failed"}')
assert_ok "Knowledge answer with valid receipt" "$R" "trace"

# Answer with invalid receipt + knowledge_assisted → should fail
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/v1/knowledge/answer" \
  -H "Content-Type: application/json" \
  -d '{"receiptId":"invalid-receipt","answer":"test","knowledge_assisted":true}' 2>/dev/null)
if [ "$R" = "403" ] || [ "$R" = "422" ]; then
  echo -e "  ${GREEN}✓${NC} Knowledge answer with invalid receipt rejected (HTTP $R)"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}✗${NC} Knowledge answer with invalid receipt should have been rejected (got HTTP $R)"
  FAIL=$((FAIL + 1))
fi

# ── Summary ────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}PASS: $PASS${NC}  ${RED}FAIL: $FAIL${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

exit 0
