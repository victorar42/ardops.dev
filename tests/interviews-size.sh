#!/usr/bin/env bash
# tests/interviews-size.sh — spec 003
#
# Enforces the budget for interviews/index.json: ≤ 100 KB.
# See specs/003-interviews-section/contracts/index-json-schema.md (I-3).
#
# Usage: bash tests/interviews-size.sh [<index-json-path>]
#   default: interviews/index.json

set -euo pipefail

TARGET="${1:-interviews/index.json}"
LIMIT=$((100 * 1024))

if [ ! -f "$TARGET" ]; then
  echo "FAIL: $TARGET not found. Run: node scripts/build-interviews.js --out interviews/"
  exit 1
fi

SIZE=$(wc -c < "$TARGET" | tr -d ' ')

if [ "$SIZE" -gt "$LIMIT" ]; then
  printf 'FAIL: %s size %s bytes exceeds %s bytes (100 KB)\n' "$TARGET" "$SIZE" "$LIMIT"
  exit 1
fi

printf 'OK: %s size %s bytes (limit %s)\n' "$TARGET" "$SIZE" "$LIMIT"
