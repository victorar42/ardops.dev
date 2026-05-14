#!/usr/bin/env bash
#
# tests/syntax-css-conditional.sh — spec 016 (Syntax highlighting)
#
# Verifies that the syntax.css stylesheet is linked from a post page if
# and only if the post contains at least one tokenized code block.
#
# Contract: specs/016-syntax-highlighting/spec.md (US3, SC-02)
#
# Usage: bash tests/syntax-css-conditional.sh
# Exit:  0 ok | 1 violation
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FAIL=0

shopt -s nullglob
for f in blog/*.html; do
  base="$(basename "$f")"
  [ "$base" = "index.html" ] && continue

  HAS_SHIKI=0
  HAS_LINK=0
  grep -q '<pre class="shiki"' "$f" && HAS_SHIKI=1
  grep -q '/assets/css/syntax\.css' "$f" && HAS_LINK=1

  if [ "$HAS_SHIKI" -eq 1 ] && [ "$HAS_LINK" -eq 0 ]; then
    echo "syntax-css-conditional.sh:$f: has tokenized block(s) but no <link> to /assets/css/syntax.css"
    FAIL=1
  fi
  if [ "$HAS_SHIKI" -eq 0 ] && [ "$HAS_LINK" -eq 1 ]; then
    echo "syntax-css-conditional.sh:$f: loads syntax.css but has no tokenized block (perf regression)"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 0 ]; then
  echo "✓ syntax-css-conditional.sh — syntax.css load matches tokenized-block presence"
  exit 0
fi
echo "✗ syntax-css-conditional.sh — failed"
exit 1
