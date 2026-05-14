#!/usr/bin/env bash
# tests/no-trackers.sh — spec 015, FR-06
#
# Greps every served HTML/CSS/JS file for tracker patterns listed in
# tests/tracker-domains.txt. Fails with exit 1 if any match is found.
#
# Exit codes:
#   0 — no matches
#   1 — at least one match (violation)
#   2 — I/O error (pattern file unreadable, find failed, no files scanned)
#
# Env overrides:
#   NT_PATTERN_FILE  default: tests/tracker-domains.txt
#   NT_ROOT          default: .

set -euo pipefail

PATTERN_FILE="${NT_PATTERN_FILE:-tests/tracker-domains.txt}"
ROOT="${NT_ROOT:-.}"

if [ ! -r "$PATTERN_FILE" ]; then
  echo "✗ no-trackers gate: pattern file unreadable: $PATTERN_FILE" >&2
  exit 2
fi

# Load non-comment, non-blank lines.
PATTERNS=$(grep -vE '^[[:space:]]*(#|$)' "$PATTERN_FILE" || true)
if [ -z "$PATTERNS" ]; then
  echo "✗ no-trackers gate: pattern file has no usable patterns: $PATTERN_FILE" >&2
  exit 2
fi

PATTERN_COUNT=$(printf '%s\n' "$PATTERNS" | wc -l | tr -d ' ')

# Build a single ERE alternation pat1|pat2|...
COMBINED=$(printf '%s\n' "$PATTERNS" | paste -sd'|' -)

# Collect served files.
FILES=$(find "$ROOT" -type f \
  \( -name "*.html" -o -name "*.css" -o -name "*.js" \) \
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
  echo "✗ no-trackers gate: no served files found under $ROOT" >&2
  exit 2
fi

FILE_COUNT=$(printf '%s\n' "$FILES" | wc -l | tr -d ' ')

VIOLATIONS=0
VIOLATION_FILES=0
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

while IFS= read -r f; do
  [ -z "$f" ] && continue
  if grep -nE -- "$COMBINED" "$f" > "$TMP" 2>/dev/null; then
    HITS=$(wc -l < "$TMP" | tr -d ' ')
    VIOLATIONS=$((VIOLATIONS + HITS))
    VIOLATION_FILES=$((VIOLATION_FILES + 1))
    while IFS= read -r line; do
      echo "${f}:${line}"
    done < "$TMP"
  fi
done <<< "$FILES"

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "✗ no-trackers gate: $VIOLATIONS violation(s) across $VIOLATION_FILES file(s)"
  exit 1
fi

echo "✓ no-trackers gate ($FILE_COUNT files scanned, $PATTERN_COUNT patterns)"
exit 0
