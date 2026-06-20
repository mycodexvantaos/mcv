#!/usr/bin/env bash
# Fast verification path: dependency presence check + smoke import + test run.
# Generates placeholder install hint if node_modules is missing (charter:
# auto-generate fixup guidance on dependency gaps).
set -euo pipefail
PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PKG_DIR"

if [ ! -d node_modules ]; then
  echo "[verify] dependencies missing -> run: npm install" >&2
  exit 10
fi
node --input-type=module -e "import('./src/app.js').then(m=>{if(!m.createApp)process.exit(1)})"
echo "[verify] smoke import OK"
npm run test:fast
echo "[verify] OK"
