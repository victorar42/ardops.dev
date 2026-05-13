#!/usr/bin/env bash
# tests/now-freshness.sh — spec 013
#
# Validates that /now/index.html was updated recently.
# Exits 0 if the first <time datetime="YYYY-MM-DD"> is no older than
# NOW_FRESHNESS_MAX_DAYS (default 90) and not in the future.
#
# Env vars (override for testing):
#   NOW_PAGE                 path to the now page (default now/index.html)
#   NOW_FRESHNESS_MAX_DAYS   threshold in days (default 90)
#
# Exit codes: 0 ok | 2 missing-time | 3 bad-format | 4 future-date | 5 stale
set -euo pipefail

NOW_PAGE="${NOW_PAGE:-now/index.html}"
MAX_DAYS="${NOW_FRESHNESS_MAX_DAYS:-90}"

if [[ ! -f "$NOW_PAGE" ]]; then
  echo "now-freshness: no existe $NOW_PAGE" >&2
  exit 2
fi

DATE="$(grep -Eo '<time[^>]*datetime="[0-9]{4}-[0-9]{2}-[0-9]{2}"' "$NOW_PAGE" \
        | head -n 1 \
        | grep -Eo '[0-9]{4}-[0-9]{2}-[0-9]{2}' || true)"

if [[ -z "${DATE:-}" ]]; then
  echo "now-freshness: no se encontró <time datetime> parseable en $NOW_PAGE" >&2
  exit 2
fi

if [[ ! "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "now-freshness: datetime \"$DATE\" no cumple formato YYYY-MM-DD" >&2
  exit 3
fi

# GNU date (Linux/CI) vs BSD date (macOS)
if date -u -d "$DATE" "+%s" >/dev/null 2>&1; then
  DATE_EPOCH=$(date -u -d "$DATE" "+%s")
else
  DATE_EPOCH=$(date -u -j -f "%Y-%m-%d" "$DATE" "+%s")
fi
TODAY_EPOCH=$(date -u "+%s")
DAYS=$(( (TODAY_EPOCH - DATE_EPOCH) / 86400 ))

if (( DAYS < 0 )); then
  TODAY=$(date -u "+%Y-%m-%d")
  echo "now-freshness: datetime \"$DATE\" está en el futuro (hoy UTC: $TODAY)" >&2
  exit 4
fi

if (( DAYS > MAX_DAYS )); then
  echo "now-freshness: /now/ no se actualiza desde $DATE ($DAYS días, máximo $MAX_DAYS). Actualizá $NOW_PAGE." >&2
  exit 5
fi

echo "✓ now-freshness gate: actualizada hace $DAYS días ($DATE)"
