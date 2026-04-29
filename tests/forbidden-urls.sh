#!/usr/bin/env bash
# tests/forbidden-urls.sh
# Gate: ningún archivo HTML servido debe contener URLs sensibles
# del evento Techno Week 8.0 mientras el flag esté en estado "teaser".
#
# Spec: specs/002-techno-week-coming-soon/contracts/forbidden-urls.md
# Run:  bash tests/forbidden-urls.sh
# Exit: 0 OK, 1 violación detectada o estado inconsistente.

set -euo pipefail

SCANNED=(
  "index.html"
  "404.html"
  "talks/index.html"
  "blog/index.html"
  "legacy/index.html"
)

# Sólo escanear archivos que existen para evitar falsos negativos por path.
EXISTING=()
for f in "${SCANNED[@]}"; do
  [[ -f "$f" ]] && EXISTING+=("$f")
done

if [[ ${#EXISTING[@]} -eq 0 ]]; then
  echo "ERROR: ningún archivo bajo escaneo existe. Revisar lista en el script."
  exit 1
fi

# Patrones prohibidos (regex extendido, case-insensitive vía -i).
PATTERNS='victorar42/techno-week|github\.com/[^"'"'"' ]*techno-?week|slides[._-]?techno|techno[-_ ]week.*\.(pdf|pptx?|key)|bcr[-_]demo|(speakerdeck|slideshare|docs\.google\.com/presentation).*ardon'

teaser_count=$( { grep -lE 'TALK-STATE:teaser START' "${EXISTING[@]}" 2>/dev/null || true; } | wc -l | tr -d ' ')
published_count=$( { grep -lE 'TALK-STATE:published START' "${EXISTING[@]}" 2>/dev/null || true; } | wc -l | tr -d ' ')

if [[ "$teaser_count" -gt 0 && "$published_count" -gt 0 ]]; then
  echo "ERROR: Mezcla de estados teaser/published entre surfaces. Liberar todas o ninguna."
  exit 1
fi

if [[ "$published_count" -gt 0 && "$teaser_count" -eq 0 ]]; then
  echo "OK: estado published. forbidden-urls gate en modo skip."
  exit 0
fi

# Estado teaser (o ningún marcador presente todavía) → aplicar gate estricto.
if grep -InEi "$PATTERNS" "${EXISTING[@]}"; then
  echo ""
  echo "ERROR: URLs prohibidas detectadas. Ver salida arriba."
  echo "Ver specs/002-techno-week-coming-soon/contracts/forbidden-urls.md"
  exit 1
fi

echo "OK: cero URLs prohibidas en estado teaser."
exit 0
