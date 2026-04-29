#!/usr/bin/env bash
# tests/interviews-xss.sh — spec 003
#
# Verifies that the XSS-attempt fixture, after build, does NOT propagate
# hostile tokens to the emitted HTML. Operates on the interview body only:
# the head (which legitimately contains <script type="application/ld+json">
# and <script defer src=...>) is excluded.
#
# Usage: bash tests/interviews-xss.sh [<out-dir>]
#   default <out-dir>: interviews/

set -euo pipefail

OUT_DIR="${1:-interviews}"
TARGET="${OUT_DIR}/xss-attempt.html"

if [ ! -f "$TARGET" ]; then
  echo "FAIL: $TARGET not found. Run: node scripts/build-interviews.js --include-fixtures --out ${OUT_DIR}/"
  exit 1
fi

# Extract just the interview body. The body opens with the literal token below
# (emitted by the renderer) and ends at the closing </div>.
BODY="$(awk '
  /<div class="interview-body">/ { inside=1; next }
  inside && /<\/div>/ { exit }
  inside { print }
' "$TARGET")"

if [ -z "$BODY" ]; then
  echo "FAIL: could not isolate interview-body from $TARGET"
  exit 1
fi

FAILED=0
check() {
  local pattern="$1" label="$2"
  if printf '%s' "$BODY" | grep -niE "$pattern" >/dev/null 2>&1; then
    echo "FAIL: hostile token survived: $label"
    printf '%s' "$BODY" | grep -niE "$pattern" | head -5
    FAILED=1
  fi
}

# Real attack vectors. Note: literal "javascript:" inside heading text is
# expected (the fixture mentions it as plain prose), so we look only for
# attribute contexts and tag opens.
check '<script\b'           '<script> tag'
check '=\s*"javascript:'    'javascript: in double-quoted attribute'
check "=\s*'javascript:"    'javascript: in single-quoted attribute'
check '\son[a-z]+\s*='       'inline event handler attribute'
check '<iframe\b'           '<iframe> tag'
check '<img\b'              '<img> tag (forbidden in interview body)'
check '<form\b'             '<form> tag'
check '<style\b'             '<style> tag'

if [ "$FAILED" -eq 0 ]; then
  echo "OK: $TARGET — no hostile tokens in interview body"
  exit 0
fi
exit 1
