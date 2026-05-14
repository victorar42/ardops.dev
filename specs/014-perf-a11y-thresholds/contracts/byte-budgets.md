# Contract — `tests/byte-budgets.sh`

Gate ejecutable. Verifica budgets de tamaño post-build sobre los
artefactos servidos.

## Invocación

```bash
bash tests/byte-budgets.sh
```

**Prerequisitos**: el sitio debe estar buildeado. Si `blog/*.html` o
`interviews/*.html` se generan dinámicamente, ejecutar antes:

```bash
node scripts/build-blog.js
node scripts/build-interviews.js --include-fixtures --out interviews/
node scripts/build-layout.js
```

## Variables de entorno (opcionales)

| Variable | Default | Uso |
|---|---:|---|
| `BB_HTML_MAX` | 51200 | Override per-html budget (bytes gzip) |
| `BB_CSS_SUM_MAX` | 30720 | Override CSS sum budget (bytes gzip) |
| `BB_JS_SUM_MAX` | 51200 | Override JS sum budget (bytes gzip) |
| `BB_IMG_MAX` | 204800 | Override per-image raw budget (bytes) |

## Comportamiento

1. Calcula `gzip -c -9 < FILE | wc -c` para cada `*.html` servido y
   reporta tamaño y delta vs `BB_HTML_MAX`.
2. Concatena todos `assets/css/**/*.css` (orden alfabético), pipea a
   `gzip -c -9 | wc -c`, compara contra `BB_CSS_SUM_MAX`.
3. Idem para `assets/js/**/*.js` vs `BB_JS_SUM_MAX`.
4. Para cada archivo en `assets/img/**` (incluye subdirs, excluye
   `.gitkeep`), compara `wc -c` raw contra `BB_IMG_MAX`.

## Exit codes

| Code | Significado |
|---:|---|
| 0 | Todos los budgets dentro de límite. |
| 1 | Al menos un budget excedido. STDERR detalla cada infractor. |
| 2 | Error de I/O (archivo no legible, etc.). |

## Output (éxito)

```
✓ byte-budgets gate
  html-each:  max=6553 B (index.html)         ≤ 51200 B  [margin: +44647]
  css-sum:    9909 B                          ≤ 30720 B  [margin: +20811]
  js-sum:     5327 B                          ≤ 51200 B  [margin: +45873]
  img-each:   max=201964 B (speaking/headshot.jpg) ≤ 204800 B [margin: +2836]
```

## Output (fallo de ejemplo)

```
✗ byte-budgets gate
  css-sum: 35012 B exceeds budget 30720 B by 4292 B
exit 1
```

## Tests de aceptación

| AC | Escenario | Exit |
|---|---|---:|
| AC-1 | Repo en estado actual | 0 |
| AC-2 | Append 5000 bytes a `assets/css/components.css` (que llegue a > 30720 gzip) | 1 |
| AC-3 | Agregar `assets/js/dummy.js` de 60 KB que comprima > 51200 gzip | 1 |
| AC-4 | Agregar `assets/img/test.png` de 250 KB raw | 1 |
| AC-5 | `BB_HTML_MAX=1000 bash tests/byte-budgets.sh` (forzar fallo) | 1 |

## Notas de implementación

- POSIX puro: `gzip`, `wc`, `find`, `awk`, `printf`.
- `set -euo pipefail` obligatorio.
- Detección macOS BSD vs Linux GNU solo si hace falta (find -size flags).
- No depende de `npm ci`. Job CI separado puede correr sin Node.
