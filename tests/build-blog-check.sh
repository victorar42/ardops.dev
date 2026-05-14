#!/usr/bin/env bash
#
# tests/build-blog-check.sh — spec 016 (Syntax highlighting)
#
# Verifies:
#   1. `node scripts/build-blog.js --check` reports no drift between
#      Markdown sources under content/blog/*.md and HTML artifacts.
#   2. The syntax-highlighting fixture validates end-to-end via
#      `--check-only-validation` (covers all 21 allowlisted languages,
#      fallback paths, inline-code, and the XSS smoke test).
#
# Contract: specs/016-syntax-highlighting/contracts/shiki-integration.md
#
# Usage: bash tests/build-blog-check.sh
# Exit:  0 ok | 1 drift | 2 fixture failure
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FIXTURE="content/blog/_fixtures/2026-05-syntax-highlighting-demo.md"
FAIL=0

# ---- 1. drift on published posts ------------------------------------------

if ! node scripts/build-blog.js --check >/dev/null 2>&1; then
  echo "build-blog-check.sh:scripts/build-blog.js:--check: drift detected"
  echo "  hint: run \`node scripts/build-blog.js\` and commit the result"
  FAIL=1
fi

# ---- 2. fixture validates end-to-end --------------------------------------

if [ ! -f "$FIXTURE" ]; then
  echo "build-blog-check.sh:$FIXTURE: fixture missing"
  exit 2
fi

if ! node scripts/build-blog.js --check-only-validation --input "$FIXTURE" >/dev/null 2>&1; then
  echo "build-blog-check.sh:$FIXTURE: fixture failed validation/highlight pipeline"
  FAIL=2
fi

# ---- 3. fixture produces tokenized output (sanity for Shiki integration) --

TMP_HTML="$(mktemp)"
if node scripts/build-blog.js --check-only-validation --emit-sanitized \
   --input "$FIXTURE" > "$TMP_HTML" 2>/dev/null; then
  TOKENIZED=$(grep -c '<pre class="shiki"' "$TMP_HTML" || true)
  FALLBACK=$(grep -cE '<pre><code( class="language-[^"]+")?>' "$TMP_HTML" || true)
  if [ "$TOKENIZED" -lt 21 ]; then
    echo "build-blog-check.sh:$FIXTURE: expected ≥21 <pre class=\"shiki\">, got $TOKENIZED"
    FAIL=2
  fi
  if [ "$FALLBACK" -lt 2 ]; then
    echo "build-blog-check.sh:$FIXTURE: expected ≥2 fallback blocks, got $FALLBACK"
    FAIL=2
  fi
  if grep -qE '\sstyle="' "$TMP_HTML"; then
    echo "build-blog-check.sh:$FIXTURE: residual inline style= attribute detected (CSP violation)"
    FAIL=2
  fi
fi
rm -f "$TMP_HTML"

if [ "$FAIL" -eq 0 ]; then
  echo "✓ build-blog-check.sh — drift clean + fixture OK (21 langs + fallback + CSP)"
  exit 0
fi
echo "✗ build-blog-check.sh — failed"
exit "$FAIL"
