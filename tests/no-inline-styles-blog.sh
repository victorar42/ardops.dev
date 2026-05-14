#!/usr/bin/env bash
#
# tests/no-inline-styles-blog.sh — spec 016 (Syntax highlighting)
#
# Verifies that no HTML under blog/ contains any inline style="..."
# attribute. This is the third defense layer (after the build-time
# transform and DOMPurify FORBID_ATTR) protecting CSP style-src 'self'.
#
# Contract: specs/016-syntax-highlighting/contracts/csp-invariants.md (I2)
#
# Usage: bash tests/no-inline-styles-blog.sh
# Exit:  0 ok | 1 found inline style
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FAIL=0
shopt -s nullglob

# Match a literal style= attribute on any tag (not inside CSS, not inside text).
# We use a simple grep: any " style=" or '	style=' or '\nstyle=' on an HTML tag.
# Acceptable false-positive risk on the word "style=" inside text content is
# negligible because all post bodies pass through DOMPurify and the layout
# templates do not include the substring 'style="' anywhere.

for f in blog/*.html; do
  if matches=$(grep -nE '[[:space:]]style="' "$f" 2>/dev/null); then
    while IFS= read -r line; do
      ln="${line%%:*}"
      content="${line#*:}"
      echo "no-inline-styles-blog.sh:$f:$ln: $content"
      FAIL=1
    done <<< "$matches"
  fi
done

if [ "$FAIL" -eq 0 ]; then
  echo "✓ no-inline-styles-blog.sh — zero inline style= attributes under blog/"
  exit 0
fi
echo "✗ no-inline-styles-blog.sh — inline style detected"
exit 1
