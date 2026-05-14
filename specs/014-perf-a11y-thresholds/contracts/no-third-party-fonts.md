# Contract — `tests/no-third-party-fonts.sh`

Gate ejecutable. Defensa en profundidad sobre la policy de fonts
(constitución V, VIII).

## Invocación

```bash
bash tests/no-third-party-fonts.sh
```

## Comportamiento

Cuatro chequeos secuenciales. Cualquier fallo → exit 1.

### Check 1 — HTML servidos sin Google Fonts

```text
grep -rn -E "fonts\.(googleapis|gstatic)\.com" \
  -- *.html blog/*.html interviews/*.html talks/*.html \
     speaking/*.html now/*.html 404.html 2>/dev/null
```

Si retorna alguna línea → fallo "third-party font reference".

### Check 2 — CSS `@font-face src:` externos

Para cada `assets/css/**/*.css`, awk recorre bloques `@font-face { ... }`.
Dentro de cada bloque, si encuentra `src:` con `url("http...")` o
`url('http...')` cuyo URL NO comienza con:
- `/assets/fonts/`
- `assets/fonts/`
- `../fonts/`
- `./` o relativo sin `://`

… falla con la ruta del CSS y la URL infractora.

### Check 3 — Inventario de `assets/fonts/`

```text
find assets/fonts -type f -not -name '*.woff2' -not -name 'LICENSE.md'
```

Si retorna algún archivo → falla listando archivos prohibidos
(woff, ttf, otf, eot, etc.).

### Check 4 — `font-display: swap` por cada `@font-face`

Para cada `@font-face` bloque en `assets/css/**/*.css`, verifica que
el bloque contiene `font-display: swap` (con o sin whitespace,
case-insensitive en el valor, case-sensitive en la propiedad).

Si falta → falla con la ruta del CSS y la font-family afectada
(extraída del `font-family:` del mismo bloque).

## Exit codes

| Code | Significado |
|---:|---|
| 0 | Policy respetada. |
| 1 | Al menos una violación. STDERR detalla. |
| 2 | Error de I/O. |

## Output (éxito)

```
✓ no-third-party-fonts gate
  HTML refs:          0 hits
  CSS @font-face:     5 blocks, all same-origin
  fonts/ inventory:   6 .woff2 + LICENSE.md, no foreign files
  font-display swap:  5/5 blocks
```

## Output (fallo de ejemplo)

```
✗ no-third-party-fonts gate
  index.html:23: <link href="https://fonts.googleapis.com/css?family=Inter">
  assets/css/base.css:12: @font-face "Outfit" missing font-display: swap
exit 1
```

## Tests de aceptación

| AC | Escenario | Exit |
|---|---|---:|
| AC-1 | Repo actual | 0 |
| AC-2 | Agregar `<link rel="preconnect" href="https://fonts.googleapis.com">` en cualquier HTML | 1 |
| AC-3 | Agregar `@font-face { src: url("https://cdn.example/foo.woff2"); ... }` | 1 |
| AC-4 | Copiar un `.woff` a `assets/fonts/` | 1 |
| AC-5 | Quitar `font-display: swap` de cualquier `@font-face` | 1 |

## Notas de implementación

- POSIX puro: `grep -E`, `find`, `awk`. Sin parser CSS externo.
- awk pattern para bloques `@font-face`: incremento de profundidad en
  `{` y reset en `}` (suficiente para CSS plano sin nested rules).
- `font-display` se busca con regex case-sensitive para la propiedad y
  case-insensitive para el valor (CSS spec permite `Swap`, `SWAP`).
