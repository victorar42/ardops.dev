#!/usr/bin/env bash
#
# tests/no-third-party-fonts.sh — spec 014
#
# Enforces font policy:
#   1) No <link>/refs to fonts.googleapis.com or fonts.gstatic.com in HTML.
#   2) No @font-face src: url("https://...") with foreign domain.
#   3) assets/fonts/ contains only .woff2 files (+ LICENSE.md).
#   4) Every @font-face block declares font-display: swap.
#
# Contract: specs/014-perf-a11y-thresholds/contracts/no-third-party-fonts.md
#
# Usage:    bash tests/no-third-party-fonts.sh
# Exit:     0 ok | 1 violations | 2 I/O error
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FAIL=0
errors=()

# --- Check 1: HTML refs to Google Fonts ---
html_hits=$(grep -rnE 'fonts\.(googleapis|gstatic)\.com' \
  --include='*.html' \
  index.html 404.html blog interviews talks speaking now 2>/dev/null || true)
if [ -n "$html_hits" ]; then
  while IFS= read -r line; do
    errors+=("third-party font ref: $line")
  done <<< "$html_hits"
  FAIL=1
fi

# --- Check 2 & 4: per-block @font-face analysis (single-pass awk per file) ---
analyze_css() {
  awk -v file="$1" '
    BEGIN { in_block=0; depth=0; body=""; start_line=0; block_count=0; }
    {
      line = $0;
      if (!in_block && match(line, /@font-face/)) {
        in_block = 1; depth = 0; body = ""; start_line = NR;
      }
      if (in_block) {
        body = body " " line;
        n_open  = gsub(/\{/, "{", line);
        n_close = gsub(/\}/, "}", line);
        depth += n_open - n_close;
        if (depth <= 0 && index(body, "{") > 0) {
          block_count++;
          if (!match(tolower(body), /font-display[[:space:]]*:[[:space:]]*swap/)) {
            print "MISSING_SWAP\t" file ":" start_line;
          }
          tmp = body;
          while (match(tmp, /url\([^)]+\)/)) {
            url = substr(tmp, RSTART + 4, RLENGTH - 5);
            gsub(/^[" \047\t]+|[" \047\t]+$/, "", url);
            if (url ~ /^https?:\/\// || url ~ /^\/\//) {
              print "EXTERNAL\t" file ":" start_line "\t" url;
            }
            tmp = substr(tmp, RSTART + RLENGTH);
          }
          in_block = 0; body = "";
        }
      }
    }
    END { print "BLOCKCOUNT\t" file "\t" block_count; }
  ' "$1"
}

total_blocks=0
css_files=$(find assets/css -type f -name '*.css' 2>/dev/null | sort)
for css in $css_files; do
  while IFS=$'\t' read -r kind a b; do
    case "$kind" in
      MISSING_SWAP)
        errors+=("$a @font-face missing font-display: swap")
        FAIL=1
        ;;
      EXTERNAL)
        errors+=("$a external @font-face src: $b")
        FAIL=1
        ;;
      BLOCKCOUNT)
        total_blocks=$((total_blocks + b))
        ;;
    esac
  done < <(analyze_css "$css")
done

# --- Check 3: assets/fonts/ inventory ---
foreign=$(find assets/fonts -type f \
  ! -name '*.woff2' \
  ! -name 'LICENSE.md' \
  ! -name 'LICENSE' \
  2>/dev/null || true)
if [ -n "$foreign" ]; then
  while IFS= read -r f; do
    errors+=("foreign font file in assets/fonts/: $f")
  done <<< "$foreign"
  FAIL=1
fi

woff2_count=$(find assets/fonts -type f -name '*.woff2' 2>/dev/null | wc -l | tr -d ' ')

if [ "$FAIL" -eq 0 ]; then
  printf '✓ no-third-party-fonts gate\n'
  printf '  HTML refs:          0 hits\n'
  printf '  CSS @font-face:     %d blocks, all same-origin\n' "$total_blocks"
  printf '  fonts/ inventory:   %d .woff2 (+ LICENSE.md), no foreign files\n' "$woff2_count"
  printf '  font-display swap:  %d/%d blocks\n' "$total_blocks" "$total_blocks"
  exit 0
fi

printf '✗ no-third-party-fonts gate\n' >&2
for e in "${errors[@]}"; do
  printf '  %s\n' "$e" >&2
done
exit 1
