# Contract — `tests/no-trackers.sh`

## Propósito

Detectar la presencia de patrones de tracking conocidos en cualquier
archivo servido del sitio (`.html`, `.css`, `.js`). Fallar el build si
hay coincidencias.

## Entradas

| Input | Origen | Validación |
|---|---|---|
| `tests/tracker-domains.txt` | repo | existe, lectura OK, ≥ 1 patrón non-comment |
| Árbol del repo | filesystem | `find` debe ejecutar sin error |

## Configuración (env vars)

| Variable | Default | Propósito |
|---|---|---|
| `NT_PATTERN_FILE` | `tests/tracker-domains.txt` | override de ruta a la lista |
| `NT_ROOT` | `.` | raíz del barrido |

## Algoritmo

1. Validar que `NT_PATTERN_FILE` existe y es legible. Si no, exit 2 con
   `✗ no-trackers gate: pattern file unreadable`.
2. Cargar patrones: filtrar líneas que no comienzan con `#` y no son
   vacías. Si la lista queda vacía, exit 2.
3. Combinar patrones en una sola alternancia ERE: `pat1|pat2|…|patN`.
4. Construir lista de archivos: `find $NT_ROOT -type f \( -name "*.html"
   -o -name "*.css" -o -name "*.js" \) -not -path "./.git/*" -not
   -path "./node_modules/*" -not -path "./.specify/*" -not
   -path "./specs/*" -not -path "./docs/*" -not -path "./backlog/*"
   -not -path "./.reference/*" -not -path "./tests/*" -not
   -path "./legacy/*" -not -path "./scripts/*" -not
   -path "./.github/*"`.
5. Si la lista de archivos está vacía, exit 2.
6. Por cada archivo, ejecutar `grep -nE -- "<combined>" <file>`. Si
   produce líneas, agregarlas a violations.
7. Si `violations.length > 0`:
   - Imprimir cada match en formato `path:line:matched-text`.
   - Imprimir resumen `✗ no-trackers gate: K violation(s) across L file(s)`.
   - Exit 1.
8. Si `violations.length == 0`:
   - Imprimir `✓ no-trackers gate (N files scanned, M patterns)`.
   - Exit 0.

## Salida

- **stdout**: matches en formato `path:line:text` (orden por archivo,
  luego por línea) + resumen final.
- **stderr**: solo en exit 2 con el motivo del error.
- **exit code**: 0 / 1 / 2 según R-4.

## Performance

- Debe completar en ≤ 5 segundos en CI sobre el repo actual
  (~20 archivos servidos). Si excede, el gate puede paralelizar con
  `xargs -P` en una iteración futura — no es requisito en esta spec.

## Edge cases

- **Comentarios HTML que mencionan un tracker**: cuenta como violation.
  Decisión consciente: limpiar el repo.
- **`googleapis.com` para fonts**: no está en la lista; no produce
  falso positivo. Si alguien lo agrega por error a la lista, el gate
  fallará contra los preloads — esto es feature, no bug (refleja la
  política).
- **Línea con CR LF**: `grep` maneja correctamente; el archivo plano usa
  LF.
- **Patrón con `(`**: el archivo lo escribe como `gtag\(`. La alternancia
  ERE lo respeta porque `\(` significa "literal (".
- **Path con espacios**: ningún path actual los contiene; si en el
  futuro aparece, `find -print0` + `xargs -0` (out of scope hoy).

## Verificación local

```bash
# Pasa: cero coincidencias
bash tests/no-trackers.sh

# Falla intencionalmente:
echo '<script src="https://www.googletagmanager.com/gtag/js?id=FAKE"></script>' >> index.html
bash tests/no-trackers.sh   # exit 1, debe imprimir index.html:<line>:googletagmanager.com
git checkout -- index.html
```
