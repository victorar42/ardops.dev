#!/usr/bin/env bash
#
# tests/syntax-css-size.sh — spec 016 (Syntax highlighting)
#
# Verifies that assets/css/syntax.css stays under its byte budget.
#
# Contract: specs/016-syntax-highlighting/contracts/syntax-css-budget.md
#
# Usage: bash tests/syntax-css-size.sh
# Exit:  0 ok | 1 over budget | 2 missing
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

TARGET="assets/css/syntax.css"
BUDGET_GZIP="${SYNTAX_CSS_MAX:-5120}"

if [ ! -f "$TARGET" ]; then
  echo "syntax-css-size.sh:$TARGET: file missing"
  echo "  hint: run \`node scripts/build-syntax-css.js\`"
  exit 2
fi

RAW=$(wc -c < "$TARGET" | tr -d ' ')
GZ=$(gzip -c -9 "$TARGET" | wc -c | tr -d ' ')

if [ "$GZ" -gt "$BUDGET_GZIP" ]; then
  echo "syntax-css-size.sh:$TARGET: ✗ over budget gzip=$GZ B > $BUDGET_GZIP B (raw=$RAW B)"
  exit 1
fi

echo "✓ syntax-css-size.sh — $TARGET raw=$RAW B gzip=$GZ B / budget=$BUDGET_GZIP B"
exit 0
