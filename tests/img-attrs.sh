#!/usr/bin/env bash
#
# tests/img-attrs.sh — spec 014 (Performance & a11y thresholds)
#
# Enforces required attributes on every <img> in served HTML:
#   alt (present, value may be empty for decorative)
#   width  (explicit integer)
#   height (explicit integer)
#   loading (any value: "lazy" or "eager")
#   decoding="async"
#
# Contract: specs/014-perf-a11y-thresholds/contracts/img-attrs.md
#
# Usage:    bash tests/img-attrs.sh
# Exit:     0 ok | 1 violations | 2 I/O error
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

HELPER="tests/lib/parse-img.js"
if [ ! -f "$HELPER" ]; then
  echo "img-attrs: missing $HELPER" >&2
  exit 2
fi

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

FAIL=0
errors=()
pages=0
imgs=0

while IFS= read -r f; do
  [ -n "$f" ] || continue
  pages=$((pages + 1))
  json=$(node "$HELPER" "$f")
  count=$(printf '%s' "$json" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);console.log(j.images.length)})')
  imgs=$((imgs + count))
  if [ "$count" -eq 0 ]; then
    continue
  fi
  # Iterate images via node to keep parsing robust.
  violations=$(printf '%s' "$json" | node -e '
    let d=""; process.stdin.on("data",c=>d+=c).on("end",()=>{
      const j = JSON.parse(d);
      const out = [];
      for (const img of j.images) {
        const miss = [];
        if (img.alt === null) miss.push("missing alt");
        if (!img.width) miss.push("missing width");
        if (!img.height) miss.push("missing height");
        if (img.decoding !== "async") miss.push(`decoding="${img.decoding||""}" (need "async")`);
        if (!img.loading) miss.push("missing loading");
        else if (img.loading !== "lazy" && img.loading !== "eager")
          miss.push(`loading="${img.loading}" (need "lazy" or "eager")`);
        if (miss.length) {
          out.push(`${j.file}:img[${img.index}] (src="${img.src||""}"): ${miss.join(", ")}`);
        }
      }
      if (out.length) { console.log(out.join("\n")); process.exit(1); }
    });
  ' 2>&1) || true
  if [ -n "$violations" ]; then
    while IFS= read -r line; do
      [ -n "$line" ] || continue
      errors+=("$line")
      FAIL=1
    done <<< "$violations"
  fi
done < <(collect_html)

if [ "$FAIL" -eq 0 ]; then
  printf '✓ img-attrs gate (%d pages inspected, %d <img> total)\n' "$pages" "$imgs"
  exit 0
fi

printf '✗ img-attrs gate\n' >&2
for e in "${errors[@]}"; do
  printf '  %s\n' "$e" >&2
done
exit 1
