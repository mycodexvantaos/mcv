#!/usr/bin/env bash
# Script 1: Install all dependencies for MyCodeXvantaOS PolicyDraft
# Run once after cloning the repo
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# ── System dependencies ───────────────────────────────────────────────────
echo "==> Checking system dependencies..."

# Ensure supervisord is installed
if ! command -v supervisord &>/dev/null; then
  echo "    Installing supervisord..."
  pip install --quiet supervisor
fi

# Ensure supervisord directories exist
mkdir -p /etc/supervisor/conf.d /var/log/supervisor

# Ensure supervisord is running
if ! pgrep -x supervisord &>/dev/null; then
  echo "    Starting supervisord..."
  supervisord -c /etc/supervisor/supervisord.conf 2>/dev/null \
    || supervisord 2>/dev/null \
    || echo "WARNING: Could not start supervisord automatically"
fi

# WeasyPrint system libraries (needed for PDF generation)
if command -v apt-get &>/dev/null; then
  echo "    Installing WeasyPrint system libs (apt)..."
  if apt-get update -qq && apt-get install -y -qq \
    libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 \
    libffi-dev libcairo2 2>/dev/null; then
    true
  fi
elif command -v yum &>/dev/null; then
  echo "    Installing WeasyPrint system libs (yum)..."
  if yum install -y -q pango cairo gdk-pixbuf2 libffi-devel 2>/dev/null; then
    true
  fi
fi

# Verify Claude Code CLI is available
if ! command -v claude &>/dev/null; then
  echo "WARNING: 'claude' CLI not found in PATH. The app requires Claude Code to generate documents."
fi

# ── Python dependencies ───────────────────────────────────────────────────
echo "==> Installing Python dependencies..."
pip install --quiet \
  fastapi \
  uvicorn \
  sse-starlette \
  pydantic \
  pydantic-settings \
  weasyprint \
  httpx \
  httpx-sse

echo "==> Creating storage directory..."
mkdir -p "$APP_DIR/generated_documents"

echo "==> Installing supervisord config..."
sed "s|{{APP_DIR}}|$APP_DIR|g" "$SCRIPT_DIR/mcxos-policy-draft.conf" > /etc/supervisor/conf.d/mcxos-policy-draft.conf

echo "==> Done. App directory: $APP_DIR"
echo "==> Image is ready to share."
