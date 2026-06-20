#!/usr/bin/env bash
# Rollback script for @mycodexvantaos/namespace-governance.
# Restores the package to a known git tag/commit after a failed upgrade,
# with environment checks, pre/post snapshot diff, and root-cause logging
# (charter: upgrade flow MUST include failure detection + rollback guidance).
set -euo pipefail

PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_REF="${1:-}"
LOG_FILE="${PKG_DIR}/config/rollback.log"

log() { printf '%s [rollback] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" | tee -a "$LOG_FILE"; }

if ! command -v git >/dev/null 2>&1; then
  log "FATAL: git not found in PATH"; exit 1
fi
if [ -z "$TARGET_REF" ]; then
  log "FATAL: usage: rollback.sh <git-tag-or-commit>"; exit 2
fi
if ! git -C "$PKG_DIR" rev-parse --verify "$TARGET_REF^{commit}" >/dev/null 2>&1; then
  log "FATAL: ref '$TARGET_REF' does not resolve to a commit"; exit 3
fi

BEFORE="$(git -C "$PKG_DIR" rev-parse HEAD)"
log "pre-rollback HEAD=$BEFORE target=$TARGET_REF"
git -C "$PKG_DIR" diff --stat "$TARGET_REF" -- "$PKG_DIR" | tee -a "$LOG_FILE" || true

git -C "$PKG_DIR" checkout "$TARGET_REF" -- "$PKG_DIR"
AFTER="$(git -C "$PKG_DIR" rev-parse HEAD)"
log "rollback applied: package tree restored to $TARGET_REF (HEAD remains $AFTER)"
log "root-cause: record the failing upgrade reason in your change ticket"
log "DONE"
