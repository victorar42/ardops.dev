# Contract — `tests/now-freshness.sh`

**Feature**: spec 013 · **Audience**: implementor + CI.

Gate bash POSIX que valida que la página `/now/` se actualice con
regularidad. Función pura de `now/index.html` y la fecha UTC actual.

## Interfaz

### Inputs

- **Archivo**: `now/index.html` por defecto.
  Override con env var `NOW_PAGE=<path>`.
- **Umbral en días**: `90` por defecto.
  Override con env var `NOW_FRESHNESS_MAX_DAYS=<int>`.

### Outputs

- **stdout** (en éxito):
  ```
  ✓ now-freshness gate: actualizada hace N días (YYYY-MM-DD)
  ```
- **stderr** (en falla): mensaje específico según `status`.
- **exit code**: ver tabla de transiciones en `data-model.md`.

### Exit codes

| Code | Status | Mensaje |
|------|--------|---------|
| 0 | `ok` | `✓ now-freshness gate: actualizada hace N días (YYYY-MM-DD)` |
| 2 | `missing-time` | `now-freshness: no se encontró <time datetime> parseable en {NOW_PAGE}` |
| 3 | `bad-format` | `now-freshness: datetime "{VALUE}" no cumple formato YYYY-MM-DD` |
| 4 | `future-date` | `now-freshness: datetime "{VALUE}" está en el futuro (hoy UTC: YYYY-MM-DD)` |
| 5 | `stale` | `now-freshness: /now/ no se actualiza desde YYYY-MM-DD (N días, máximo {THRESHOLD}). Actualizá now/index.html.` |
| 1 | error inesperado | propagado por `set -euo pipefail` |

## Algoritmo (pseudocódigo bash)

```bash
#!/usr/bin/env bash
set -euo pipefail

NOW_PAGE="${NOW_PAGE:-now/index.html}"
MAX_DAYS="${NOW_FRESHNESS_MAX_DAYS:-90}"

[[ -f "$NOW_PAGE" ]] || { echo "now-freshness: no existe $NOW_PAGE" >&2; exit 2; }

# Extraer el primer datetime
DATE="$(grep -Eo '<time[^>]*datetime="[0-9]{4}-[0-9]{2}-[0-9]{2}"' "$NOW_PAGE" \
        | head -n 1 \
        | grep -Eo '[0-9]{4}-[0-9]{2}-[0-9]{2}' || true)"

if [[ -z "$DATE" ]]; then
  echo "now-freshness: no se encontró <time datetime> parseable en $NOW_PAGE" >&2
  exit 2
fi

# Validación de formato ya implícita en el regex anterior; doble check:
[[ "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || {
  echo "now-freshness: datetime \"$DATE\" no cumple formato YYYY-MM-DD" >&2
  exit 3
}

# Convertir a epoch UTC (GNU vs BSD)
if date -u -d "$DATE" "+%s" >/dev/null 2>&1; then
  DATE_EPOCH=$(date -u -d "$DATE" "+%s")            # GNU (Linux/CI)
else
  DATE_EPOCH=$(date -u -j -f "%Y-%m-%d" "$DATE" "+%s")   # BSD (macOS)
fi
TODAY_EPOCH=$(date -u "+%s")
DAYS=$(( (TODAY_EPOCH - DATE_EPOCH) / 86400 ))

if (( DAYS < 0 )); then
  TODAY=$(date -u "+%Y-%m-%d")
  echo "now-freshness: datetime \"$DATE\" está en el futuro (hoy UTC: $TODAY)" >&2
  exit 4
fi

if (( DAYS > MAX_DAYS )); then
  echo "now-freshness: /now/ no se actualiza desde $DATE ($DAYS días, máximo $MAX_DAYS). Actualizá now/index.html." >&2
  exit 5
fi

echo "✓ now-freshness gate: actualizada hace $DAYS días ($DATE)"
```

## Reglas

- Bash POSIX. `set -euo pipefail`. No requiere deps fuera de
  `coreutils` / BSD userland.
- Detección OS automática (GNU `date` vs BSD `date`).
- Cero llamadas a Node, Python, jq, etc.
- Permisos: `chmod +x tests/now-freshness.sh`.
- `package.json`: nuevo script `"check:now-freshness": "bash tests/now-freshness.sh"`,
  cableado dentro de `"check:distribution"` (después de `check:headshot` por orden alfa-ish).

## CI integration

Job en `.github/workflows/ci.yml`:

```yaml
  now-freshness:
    name: Now freshness gate (spec 013)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run now-freshness gate
        run: bash tests/now-freshness.sh
```

No requiere `npm ci` (gate puramente bash). No requiere `node`.
Concurrente con los demás gates.

## Cómo probar localmente

```bash
# Verde:
bash tests/now-freshness.sh

# Simular fecha vencida:
NOW_FRESHNESS_MAX_DAYS=0 bash tests/now-freshness.sh   # debería fallar exit 5

# Simular archivo sin <time>:
echo "<html><body></body></html>" > /tmp/now-empty.html
NOW_PAGE=/tmp/now-empty.html bash tests/now-freshness.sh   # exit 2

# Simular fecha futura:
printf '<time datetime="2099-12-31"></time>' > /tmp/now-future.html
NOW_PAGE=/tmp/now-future.html bash tests/now-freshness.sh   # exit 4
```
