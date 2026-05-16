#!/usr/bin/env bash
# ── MyCodeXvantaOS Startup Script ─────────────────────────────────────
# Starts the self-hosted Docker runtime with governance enforcement
#
# Usage:
#   ./startup.sh              # Start all services
#   ./startup.sh dev          # Start with hot-reload (not yet supported)
#   ./startup.sh stop         # Stop all services
#   ./startup.sh status       # Check service status
#   ./startup.sh test         # Run smoke tests against running services
#   ./startup.sh clean        # Remove containers and volumes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yaml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function log() {
  echo -e "${BLUE}[mycodexvantaos]${NC} $1"
}

function log_ok() {
  echo -e "${GREEN}[✓]${NC} $1"
}

function log_warn() {
  echo -e "${YELLOW}[!]${NC} $1"
}

function log_err() {
  echo -e "${RED}[✗]${NC} $1"
}

case "${1:-up}" in
  up|start)
    log "Starting MyCodeXvantaOS platform..."
    docker compose -f "$COMPOSE_FILE" up -d
    log "Waiting for services to be healthy..."
    sleep 5
    # Check API health
    if curl -sf http://localhost:3100/ > /dev/null 2>&1; then
      log_ok "API Node is running on http://localhost:3100"
    else
      log_warn "API Node not yet responding (may still be starting)"
    fi
    echo ""
    log "Platform endpoints:"
    echo "  Health:       http://localhost:3100/"
    echo "  Services:     http://localhost:3100/v1/services"
    echo "  Resource Kinds: http://localhost:3100/v1/resource-kinds"
    echo "  Audit Events: http://localhost:3100/v1/audit/events"
    echo "  Policies:     http://localhost:3100/v1/policies"
    echo ""
    log "Governance enforcement: ACTIVE"
    echo "  - All mutations audited"
    echo "  - Policy engine evaluating"
    echo "  - Knowledge trace: receipts required"
    echo "  - Dream safety: auto-apply disabled, delete forbidden"
    ;;

  stop|down)
    log "Stopping MyCodeXvantaOS platform..."
    docker compose -f "$COMPOSE_FILE" down
    log_ok "Platform stopped"
    ;;

  status)
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    # Quick health check
    if curl -sf http://localhost:3100/ > /dev/null 2>&1; then
      log_ok "API Node: healthy"
    else
      log_err "API Node: not responding"
    fi
    ;;

  test|smoke)
    log "Running smoke tests..."
    API="http://localhost:3100"

    # Test 1: Health
    if curl -sf "$API/" | grep -q "running"; then
      log_ok "Root endpoint: OK"
    else
      log_err "Root endpoint: FAILED"
    fi

    # Test 2: Services
    if curl -sf "$API/v1/services" | grep -q "services"; then
      log_ok "Services endpoint: OK"
    else
      log_err "Services endpoint: FAILED"
    fi

    # Test 3: Resource Kinds
    if curl -sf "$API/v1/resource-kinds" | grep -q "resourceKinds"; then
      log_ok "Resource Kinds endpoint: OK"
    else
      log_err "Resource Kinds endpoint: FAILED"
    fi

    # Test 4: Audit Events
    if curl -sf "$API/v1/audit/events" | grep -q "events"; then
      log_ok "Audit Events endpoint: OK"
    else
      log_err "Audit Events endpoint: FAILED"
    fi

    # Test 5: Policies
    if curl -sf "$API/v1/policies" | grep -q "policies"; then
      log_ok "Policies endpoint: OK"
    else
      log_err "Policies endpoint: FAILED"
    fi

    # Test 6: Create audit event
    RESULT=$(curl -sf -X POST "$API/v1/audit/events" \
      -H "Content-Type: application/json" \
      -d '{"eventType":"smoke-test","category":"audit","actor":{"type":"system","id":"smoke-test"},"resource":{"type":"test","id":"smoke-001"},"context":{"tenantId":"test","workspaceId":null}}' 2>&1)
    if echo "$RESULT" | grep -q "event"; then
      log_ok "Create audit event: OK"
    else
      log_err "Create audit event: FAILED"
    fi

    log_ok "Smoke tests complete"
    ;;

  clean)
    log "Removing containers and volumes..."
    docker compose -f "$COMPOSE_FILE" down -v
    log_ok "Clean complete"
    ;;

  logs)
    docker compose -f "$COMPOSE_FILE" logs -f "${2:-}"
    ;;

  *)
    echo "Usage: $0 {up|stop|status|test|clean|logs [service]}"
    echo ""
    echo "Commands:"
    echo "  up/start  Start all services (default)"
    echo "  stop/down Stop all services"
    echo "  status    Check service status"
    echo "  test      Run smoke tests"
    echo "  clean     Remove containers and volumes"
    echo "  logs      Follow logs (optional: service name)"
    exit 1
    ;;
esac
