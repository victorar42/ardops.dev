# Contract — `tests/img-attrs.sh`

Gate ejecutable. Valida atributos requeridos en todo `<img>` de HTML
servido.

## Invocación

```bash
bash tests/img-attrs.sh
```

**Prerequisitos**: posts y interviews buildeados (mismos comandos que
`byte-budgets.sh`).

## Variables de entorno (opcionales)

| Variable | Default | Uso |
|---|---|---|
| `IMG_ATTRS_PAGES` | (lista interna) | CSV de paths HTML adicionales a inspeccionar |

## Comportamiento

1. Resuelve la lista de HTML servidos (alineada con `STATIC_PAGES` de
   `scripts/check-csp.js` + posts generados en `blog/*.html` + interviews
   emitidos `interviews/*.html` excepto `index.html` que ya está en la
   lista base, y excluyendo fixtures).
2. Invoca `node tests/lib/parse-img.js <path>` por archivo. Recibe JSON
   con array de imágenes y sus atributos.
3. Para cada `<img>`:
   - Todas: si falta `alt` (atributo ausente, no vacío), `width`,
     `height`, `decoding="async"`, o `loading` (cualquier valor:
     `lazy` o `eager`) → falla.
   - El valor concreto de `loading` queda a criterio del autor; el
     gate exige presencia del atributo para garantizar decisión
     consciente.
4. Acumula errores; si hay al menos 1, exit 1 listando los infractores.

## Exit codes

| Code | Significado |
|---:|---|
| 0 | Todas las `<img>` cumplen. |
| 1 | Al menos una infracción. STDERR detalla. |
| 2 | Error de I/O o jsdom. |

## Helper Node — `tests/lib/parse-img.js`

```js
// CommonJS. Requires jsdom (devDep).
// Usage: node tests/lib/parse-img.js path/to/file.html
// Outputs JSON to stdout:
//   { file: "...", images: [{ index, src, alt, width, height,
//     loading, decoding, fetchpriority, raw }] }
// Exit 0 on parse success even if 0 images; exit 2 on read error.
```

`alt` se reporta como `null` si el atributo no está presente, `""` si
está presente y vacío.

## Output (éxito)

```
✓ img-attrs gate (3 pages inspected, 2 <img> total)
```

## Output (fallo de ejemplo)

```
✗ img-attrs gate
  index.html:img[0] (src="/assets/img/josue-256.webp"): missing width, missing decoding
  speaking/index.html:img[1] (src="/assets/img/speaking/headshot.jpg"): missing loading="lazy"
exit 1
```

## Tests de aceptación

| AC | Escenario | Exit |
|---|---|---:|
| AC-1 | Repo actual | 0 |
| AC-2 | Quitar `width` de `<img>` en `index.html` | 1 |
| AC-3 | Quitar `alt` de cualquier `<img>` | 1 |
| AC-4 | Agregar imagen sin atributo `loading` | 1 |
| AC-5 | Imagen con `loading="eager"` y `fetchpriority="high"` | 0 |
| AC-6 | Imagen con `loading="lazy"` (cualquier posición) | 0 |
| AC-7 | `<img alt="" ...>` (decorativa, resto ok) | 0 |

## Notas de implementación

- jsdom es devDep ya presente en `package.json`.
- Helper retorna JSON estable (orden source de aparición).
- Shell parsea con `jq` si está disponible; fallback a `awk` simple.
