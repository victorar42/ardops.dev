#!/usr/bin/env bash
#
# tests/no-placeholders.sh — spec 004
#
# Asserts cero ocurrencias de placeholders sin resolver ([Tu Nombre], TODO,
# FIXME, XXX) en archivos HTML/XML/manifest servidos al visitante público.
#
# Contrato: specs/004-personal-bio-rewrite/contracts/no-placeholders-gate.md
#
# Uso:    bash tests/no-placeholders.sh
# Exit:   0 — sin hallazgos
#         1 — al menos un hallazgo (STDOUT lista archivo:línea: contenido)
#         2 — error de I/O (sin archivos a auditar)
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Whitelist de archivos servidos. Inexistentes se omiten silenciosamente.
declare -a candidates=(
  index.html
  404.html
  blog/index.html
  talks/index.html
  sitemap.xml
  robots.txt
  public/favicon/site.webmanifest
)

shopt -s nullglob
candidates+=(interviews/index.html interviews/*.html)

declare -a existing=()
for f in "${candidates[@]}"; do
  [ -f "$f" ] && existing+=("$f")
done

if [ ${#existing[@]} -eq 0 ]; then
  echo "FAIL: no served files found to audit" >&2
  exit 2
fi

PATTERNS='\[Tu Nombre\]|\bTODO\b|\bFIXME\b|\bXXX\b'

if grep -nHE "$PATTERNS" "${existing[@]}"; then
  echo "FAIL: placeholder hit in served file" >&2
  exit 1
fi

echo "OK: 0 placeholders found across ${#existing[@]} served files (patterns: [Tu Nombre], TODO, FIXME, XXX)"
