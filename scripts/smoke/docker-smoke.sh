#!/usr/bin/env bash
# ── MyCodeXvantaOS Docker Runtime Smoke Test ─────────────────────────────────
# Builds the Docker image, starts a container, and curls the runtime endpoints.
#
# Usage:
#   ./scripts/smoke/docker-smoke.sh              # Default: mycodexvantaos:smoke-test
#   ./scripts/smoke/docker-smoke.sh imagename    # Custom image name/tag
#
# Exit code: 0 if all checks pass, 1 if any fail.

set -euo pipefail

IMAGE="${1:-mycodexvantaos:smoke-test}"
CONTAINER_NAME="smoke-test-$$"
PORT=9100
PASS=0
FAIL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

function cleanup() {
  echo ""
  echo -e "${YELLOW}Cleaning up container ${CONTAINER_NAME}...${NC}"
  docker stop "${CONTAINER_NAME}" 2>/dev/null || true
  docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true
}
trap cleanup EXIT

function assert_ok() {
  local name="$1"
  local status_code="$2"
  local body="$3"
  local expected="$4"

  if [ "${status_code}" -ge 200 ] && [ "${status_code}" -lt 300 ]; then
    if echo "${body}" | grep -q "${expected}"; then
      echo -e "  ${GREEN}✓${NC} ${name}"
      PASS=$((PASS + 1))
    else
      echo -e "  ${RED}✗${NC} ${name} — expected '${expected}' in response"
      FAIL=$((FAIL + 1))
    fi
  else
    echo -e "  ${RED}✗${NC} ${name} — HTTP ${status_code}"
    FAIL=$((FAIL + 1))
  fi
}

echo "=========================================="
echo " MyCodeXvantaOS Docker Runtime Smoke Test"
echo "=========================================="
echo ""

# ── Step 1: Build ────────────────────────────────────────────────────────────
echo -e "${YELLOW}Step 1: Building Docker image ${IMAGE}...${NC}"
if ! docker build -t "${IMAGE}" -f Dockerfile . 2>&1 | tail -5; then
  echo -e "${RED}✗ Docker build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Docker build succeeded${NC}"
echo ""

# ── Step 2: Run ──────────────────────────────────────────────────────────────
echo -e "${YELLOW}Step 2: Starting container ${CONTAINER_NAME} on port ${PORT}...${NC}"
docker run -d --name "${CONTAINER_NAME}" -p "${PORT}:${PORT}" -e NODE_ENV=production "${IMAGE}"
echo "Waiting for container to start..."
sleep 5

# Check if container is still running
if ! docker ps --format '{{.Names}}' | grep -q "${CONTAINER_NAME}"; then
  echo -e "${RED}✗ Container exited unexpectedly${NC}"
  docker logs "${CONTAINER_NAME}" 2>&1 | tail -20
  exit 1
fi
echo -e "${GREEN}✓ Container is running${NC}"
echo ""

# ── Step 3: Health Check ────────────────────────────────────────────────────
echo -e "${YELLOW}Step 3: Running health checks...${NC}"

RESP=$(curl -s -w "\n%{http_code}" "http://localhost:${PORT}/v1/health" 2>/dev/null || echo -e "\n000")
HTTP_CODE=$(echo "${RESP}" | tail -1)
BODY=$(echo "${RESP}" | sed '$d')
assert_ok "GET /v1/health" "${HTTP_CODE}" "${BODY}" '"ok"'

# ── Step 4: Version Check ───────────────────────────────────────────────────
echo -e "${YELLOW}Step 4: Running version checks...${NC}"

RESP=$(curl -s -w "\n%{http_code}" "http://localhost:${PORT}/v1/version" 2>/dev/null || echo -e "\n000")
HTTP_CODE=$(echo "${RESP}" | tail -1)
BODY=$(echo "${RESP}" | sed '$d')
assert_ok "GET /v1/version" "${HTTP_CODE}" "${BODY}" '"version"'

# ── Step 5: Runtime Check ───────────────────────────────────────────────────
echo -e "${YELLOW}Step 5: Running runtime checks...${NC}"

RESP=$(curl -s -w "\n%{http_code}" "http://localhost:${PORT}/v1/runtime" 2>/dev/null || echo -e "\n000")
HTTP_CODE=$(echo "${RESP}" | tail -1)
BODY=$(echo "${RESP}" | sed '$d')
assert_ok "GET /v1/runtime" "${HTTP_CODE}" "${BODY}" '"nodeVersion"'

# ── Step 6: Readiness Check ─────────────────────────────────────────────────
echo -e "${YELLOW}Step 6: Running readiness checks...${NC}"

RESP=$(curl -s -w "\n%{http_code}" "http://localhost:${PORT}/v1/ready" 2>/dev/null || echo -e "\n000")
HTTP_CODE=$(echo "${RESP}" | tail -1)
BODY=$(echo "${RESP}" | sed '$d')
assert_ok "GET /v1/ready" "${HTTP_CODE}" "${BODY}" '"ready"'

# ── Step 7: Service Catalog ─────────────────────────────────────────────────
echo -e "${YELLOW}Step 7: Running service catalog checks...${NC}"

RESP=$(curl -s -w "\n%{http_code}" "http://localhost:${PORT}/v1/services" 2>/dev/null || echo -e "\n000")
HTTP_CODE=$(echo "${RESP}" | tail -1)
BODY=$(echo "${RESP}" | sed '$d')
assert_ok "GET /v1/services" "${HTTP_CODE}" "${BODY}" '"services"'

# ── Step 8: Root endpoint ───────────────────────────────────────────────────
echo -e "${YELLOW}Step 8: Running root endpoint checks...${NC}"

RESP=$(curl -s -w "\n%{http_code}" "http://localhost:${PORT}/" 2>/dev/null || echo -e "\n000")
HTTP_CODE=$(echo "${RESP}" | tail -1)
BODY=$(echo "${RESP}" | sed '$d')
assert_ok "GET /" "${HTTP_CODE}" "${BODY}" '"MyCodeXvantaOS"'

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo -e " ${GREEN}PASS: ${PASS}${NC}  ${RED}FAIL: ${FAIL}${NC}"
echo "=========================================="

if [ "${FAIL}" -gt 0 ]; then
  echo ""
  echo "Container logs (last 20 lines):"
  docker logs "${CONTAINER_NAME}" 2>&1 | tail -20
  exit 1
fi

exit 0
