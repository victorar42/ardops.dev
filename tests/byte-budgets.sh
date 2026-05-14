#!/usr/bin/env bash
#
# tests/byte-budgets.sh — spec 014 (Performance & a11y thresholds)
#
# Verifies post-build byte budgets:
#   - html-each:  *.html servido <= 51200 B gzip-9
#   - css-sum:    sum of assets/css/**/*.css <= 30720 B gzip-9
#   - js-sum:     sum of assets/js/**/*.js  <= 51200 B gzip-9
#   - img-each:   each assets/img/** binary <= 204800 B raw
#
# Contract: specs/014-perf-a11y-thresholds/contracts/byte-budgets.md
#
# Usage:    bash tests/byte-budgets.sh
# Exit:     0 ok | 1 budget exceeded | 2 I/O error
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Budgets (KiB binario). Overridable por env.
HTML_MAX="${BB_HTML_MAX:-51200}"
CSS_SUM_MAX="${BB_CSS_SUM_MAX:-30720}"
JS_SUM_MAX="${BB_JS_SUM_MAX:-51200}"
IMG_MAX="${BB_IMG_MAX:-204800}"

# HTML servido: páginas estáticas + posts/interviews emitidos.
# Excluye fixtures de interviews.
collect_html() {
  ls -1 *.html 2>/dev/null || true
  for dir in blog interviews talks speaking now; do
    [ -d "$dir" ] || continue
    for f in "$dir"/*.html; do
      [ -f "$f" ] || continue
      case "$f" in
        interviews/valid-minimal.html|interviews/xss-attempt.html) continue ;;
      esac
      echo "$f"
    done
  done
}

gzsize() {
  gzip -c -9 < "$1" | wc -c | tr -d ' '
}

FAIL=0
errors=()

# 1) html-each
max_html=0
max_html_file=""
while IFS= read -r f; do
  [ -n "$f" ] || continue
  sz=$(gzsize "$f")
  if [ "$sz" -gt "$max_html" ]; then
    max_html=$sz
    max_html_file=$f
  fi
  if [ "$sz" -gt "$HTML_MAX" ]; then
    over=$((sz - HTML_MAX))
    errors+=("html-each: $f is $sz B gzip exceeds budget $HTML_MAX B by $over B")
    FAIL=1
  fi
done < <(collect_html)

# 2) css-sum
css_files=$(find assets/css -type f -name '*.css' 2>/dev/null | sort)
if [ -n "$css_files" ]; then
  # shellcheck disable=SC2086
  css_sum=$(cat $css_files | gzip -c -9 | wc -c | tr -d ' ')
else
  css_sum=0
fi
if [ "$css_sum" -gt "$CSS_SUM_MAX" ]; then
  over=$((css_sum - CSS_SUM_MAX))
  errors+=("css-sum: $css_sum B gzip exceeds budget $CSS_SUM_MAX B by $over B")
  FAIL=1
fi

# 3) js-sum
js_files=$(find assets/js -type f -name '*.js' 2>/dev/null | sort)
if [ -n "$js_files" ]; then
  # shellcheck disable=SC2086
  js_sum=$(cat $js_files | gzip -c -9 | wc -c | tr -d ' ')
else
  js_sum=0
fi
if [ "$js_sum" -gt "$JS_SUM_MAX" ]; then
  over=$((js_sum - JS_SUM_MAX))
  errors+=("js-sum: $js_sum B gzip exceeds budget $JS_SUM_MAX B by $over B")
  FAIL=1
fi

# 4) img-each
max_img=0
max_img_file=""
while IFS= read -r f; do
  [ -n "$f" ] || continue
  case "$(basename "$f")" in .gitkeep) continue ;; esac
  sz=$(wc -c < "$f" | tr -d ' ')
  if [ "$sz" -gt "$max_img" ]; then
    max_img=$sz
    max_img_file=$f
  fi
  if [ "$sz" -gt "$IMG_MAX" ]; then
    over=$((sz - IMG_MAX))
    errors+=("img-each: $f is $sz B raw exceeds budget $IMG_MAX B by $over B")
    FAIL=1
  fi
done < <(find assets/img -type f 2>/dev/null)

if [ "$FAIL" -eq 0 ]; then
  printf '✓ byte-budgets gate\n'
  printf '  html-each:  max=%d B (%s)  ≤ %d B  [margin: +%d]\n' \
    "$max_html" "$max_html_file" "$HTML_MAX" $((HTML_MAX - max_html))
  printf '  css-sum:    %d B  ≤ %d B  [margin: +%d]\n' \
    "$css_sum" "$CSS_SUM_MAX" $((CSS_SUM_MAX - css_sum))
  printf '  js-sum:     %d B  ≤ %d B  [margin: +%d]\n' \
    "$js_sum" "$JS_SUM_MAX" $((JS_SUM_MAX - js_sum))
  if [ -n "$max_img_file" ]; then
    printf '  img-each:   max=%d B (%s)  ≤ %d B  [margin: +%d]\n' \
      "$max_img" "$max_img_file" "$IMG_MAX" $((IMG_MAX - max_img))
  else
    printf '  img-each:   (no images)\n'
  fi
  exit 0
fi

printf '✗ byte-budgets gate\n' >&2
for e in "${errors[@]}"; do
  printf '  %s\n' "$e" >&2
done
exit 1
