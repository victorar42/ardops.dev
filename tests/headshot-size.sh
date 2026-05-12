#!/usr/bin/env bash
#
# tests/headshot-size.sh — spec 012 (Speaking page)
#
# Asserts:
#   - assets/img/speaking/headshot.jpg existe.
#   - file(1) reporta JPEG image data.
#   - tamaño <= 256000 bytes (250 KB binarios).
#   - si sips está disponible: pixelWidth >= 1200 y pixelHeight >= 1200.
#
# Contrato: specs/012-speaking-page/contracts/headshot-asset.md
#
# Uso:    bash tests/headshot-size.sh
# Exit:   0 — ok
#         1 — falla (mensaje a STDERR)
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FILE="assets/img/speaking/headshot.jpg"
MAX_BYTES=256000

if [ ! -f "$FILE" ]; then
  echo "headshot-size: missing $FILE" >&2
  exit 1
fi

KIND="$(file -b "$FILE")"
case "$KIND" in
  *"JPEG image data"*) ;;
  *) echo "headshot-size: $FILE is not JPEG (file: $KIND)" >&2; exit 1 ;;
esac

BYTES="$(wc -c < "$FILE" | tr -d ' ')"
if [ "$BYTES" -gt "$MAX_BYTES" ]; then
  echo "headshot-size: $FILE is $BYTES bytes (> $MAX_BYTES)" >&2
  exit 1
fi

DIMS=""
if command -v sips >/dev/null 2>&1; then
  W="$(sips -g pixelWidth  "$FILE" 2>/dev/null | awk '/pixelWidth/  {print $2}')"
  H="$(sips -g pixelHeight "$FILE" 2>/dev/null | awk '/pixelHeight/ {print $2}')"
  if [ -n "${W:-}" ] && [ -n "${H:-}" ]; then
    if [ "$W" -lt 1200 ] || [ "$H" -lt 1200 ]; then
      echo "headshot-size: $FILE is ${W}x${H} (< 1200x1200)" >&2
      exit 1
    fi
    DIMS=", ${W}x${H}"
  fi
fi

echo "✓ headshot-size gate: $FILE ($BYTES bytes${DIMS})"
