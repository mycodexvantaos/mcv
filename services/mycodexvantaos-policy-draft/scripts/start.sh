#!/usr/bin/env bash
# Script 2: Start / manage the MyCodeXvantaOS PolicyDraft app via supervisord
# Run this after install.sh (or on a shared image where install.sh already ran)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# ── Fetch Anthropic credentials from Claude settings ──────────────────────
echo "==> Reading Anthropic credentials from Claude settings..."
ANTHROPIC_BASE_URL=""
ANTHROPIC_AUTH_TOKEN=""
ANTHROPIC_MODEL=""

for SETTINGS_FILE in /root/.claude/settings.json /dev/shm/claude_settings.json; do
  if [ -f "$SETTINGS_FILE" ]; then
    ANTHROPIC_BASE_URL=$(python3 -c "import json; d=json.load(open('$SETTINGS_FILE')); print(d.get('env',{}).get('ANTHROPIC_BASE_URL',''))" 2>/dev/null || true)
    ANTHROPIC_AUTH_TOKEN=$(python3 -c "import json; d=json.load(open('$SETTINGS_FILE')); print(d.get('env',{}).get('ANTHROPIC_AUTH_TOKEN',''))" 2>/dev/null || true)
    ANTHROPIC_MODEL=$(python3 -c "import json; d=json.load(open('$SETTINGS_FILE')); print(d.get('env',{}).get('ANTHROPIC_MODEL',''))" 2>/dev/null || true)
    if [ -n "$ANTHROPIC_BASE_URL" ] && [ -n "$ANTHROPIC_AUTH_TOKEN" ]; then
      echo "    Found credentials in $SETTINGS_FILE"
      break
    fi
  fi
done

if [ -z "$ANTHROPIC_BASE_URL" ] || [ -z "$ANTHROPIC_AUTH_TOKEN" ]; then
  echo "WARNING: Could not read ANTHROPIC_BASE_URL / ANTHROPIC_AUTH_TOKEN from settings files"
fi

# Export globally so all child processes inherit them
export ANTHROPIC_BASE_URL
export ANTHROPIC_AUTH_TOKEN
export ANTHROPIC_MODEL

# ── Inject env vars into supervisord conf ─────────────────────────────────
echo "==> Updating supervisord config with credentials..."
sed "s|{{APP_DIR}}|$APP_DIR|g" "$SCRIPT_DIR/mcxos-policy-draft.conf" > /etc/supervisor/conf.d/mcxos-policy-draft.conf
# Append Anthropic env vars to the environment line
sed -i "s|^environment=PYTHONUNBUFFERED=\"1\"|environment=PYTHONUNBUFFERED=\"1\",ANTHROPIC_BASE_URL=\"$ANTHROPIC_BASE_URL\",ANTHROPIC_AUTH_TOKEN=\"$ANTHROPIC_AUTH_TOKEN\",ANTHROPIC_MODEL=\"$ANTHROPIC_MODEL\",CLAUDE_CODE_SIMPLE=\"1\"|" /etc/supervisor/conf.d/mcxos-policy-draft.conf

echo "==> Ensuring supervisord is running..."
if ! pgrep -x supervisord &>/dev/null; then
  supervisord -c /etc/supervisor/supervisord.conf 2>/dev/null \
    || supervisord 2>/dev/null \
    || { echo "ERROR: Cannot start supervisord"; exit 1; }
  sleep 1
fi

# Free port 3001 if a stale process is holding it
STALE_PID=$(lsof -ti :3001 2>/dev/null || true)
if [ -n "$STALE_PID" ]; then
  echo "    Killing stale process on port 3001 (pid $STALE_PID)..."
  kill "$STALE_PID" 2>/dev/null || true
  sleep 1
fi

echo "==> Reloading supervisord config..."
supervisorctl reread
supervisorctl update

echo "==> Starting MyCodeXvantaOS PolicyDraft backend..."
supervisorctl start mcxos-policy-draft 2>/dev/null || supervisorctl restart mcxos-policy-draft

echo "==> Backend running on port 3001"
echo ""
echo "--- Management commands ---"
echo "  supervisorctl status mcxos-policy-draft     # check status"
echo "  supervisorctl start mcxos-policy-draft      # start"
echo "  supervisorctl stop mcxos-policy-draft       # stop"
echo "  supervisorctl restart mcxos-policy-draft    # restart"
echo "  tail -f /var/log/supervisor/mcxos-policy-draft.log  # view logs"
