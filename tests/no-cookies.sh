#!/usr/bin/env bash
# tests/no-cookies.sh — spec 015, FR-07
#
# Greps every served JS file for the literal `document.cookie`. Fails
# with exit 1 if found.
#
# Exit codes:
#   0 — no matches
#   1 — at least one match (violation)
#   2 — I/O error (no JS files found, find failed)
#
# Env overrides:
#   NC_ROOT  default: .

set -euo pipefail

ROOT="${NC_ROOT:-.}"

FILES=$(find "$ROOT" -type f -name "*.js" \
  -not -path "./.git/*" \
  -not -path "./node_modules/*" \
  -not -path "./.specify/*" \
  -not -path "./specs/*" \
  -not -path "./docs/*" \
  -not -path "./backlog/*" \
  -not -path "./.reference/*" \
  -not -path "./tests/*" \
  -not -path "./legacy/*" \
  -not -path "./scripts/*" \
  -not -path "./.github/*" \
  2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "✗ no-cookies gate: no served JS files found under $ROOT" >&2
  exit 2
fi

FILE_COUNT=$(printf '%s\n' "$FILES" | wc -l | tr -d ' ')

VIOLATIONS=0
VIOLATION_FILES=0
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

while IFS= read -r f; do
  [ -z "$f" ] && continue
  if grep -nF "document.cookie" "$f" > "$TMP" 2>/dev/null; then
    HITS=$(wc -l < "$TMP" | tr -d ' ')
    VIOLATIONS=$((VIOLATIONS + HITS))
    VIOLATION_FILES=$((VIOLATION_FILES + 1))
    while IFS= read -r line; do
      echo "${f}:${line}"
    done < "$TMP"
  fi
done <<< "$FILES"

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "✗ no-cookies gate: $VIOLATIONS violation(s) across $VIOLATION_FILES file(s)"
  exit 1
fi

echo "✓ no-cookies gate ($FILE_COUNT files scanned)"
exit 0
