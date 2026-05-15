# Contract: OG template (SVG)

**Feature**: 017-og-images-dynamic

Especificación de `scripts/og/template.svg`.

---

## Dimensiones

- `viewBox="0 0 1200 630"`
- `width="1200" height="630"`
- `xmlns="http://www.w3.org/2000/svg"`

## Colores (deben provenir de tokens.css)

| Rol | Token | Hex |
|---|---|---|
| Fondo (gradient top-left) | `--bg-primary` | `#0a0e17` |
| Fondo (gradient bottom-right) | `--bg-secondary` | `#111827` |
| Chip background | `--bg-card` | `#1a2235` |
| Accent | `--accent` | `#22d3ee` |
| Texto primario | `--text-primary` | `#e2e8f0` |
| Texto secundario | `--text-secondary` | `#94a3b8` |

## Tipografías

Embebidas en base64 dentro de `<style>`:
- `Outfit` 600 → tag `font-weight: 600`
- `Outfit` 700 → tag `font-weight: 700`
- `JetBrains Mono` 700 → tag `font-weight: 700`

Fallbacks: `system-ui, -apple-system, sans-serif`.

## Layout (coordenadas)

| Elemento | x | y | font | tamaño |
|---|---|---|---|---|
| Section label `// blog` | 64 | 96 | Outfit 600 | 24 px, color `--accent` |
| Título (línea 1) | 64 | 230 | Outfit 700 | 64 px, color `--text-primary` |
| Título (línea 2, opcional) | 64 | 306 | Outfit 700 | 64 px, color `--text-primary` |
| Chips fila | 64 | 540 | Outfit 600 | 22 px, color `--accent`, fondo `--bg-card` rect rounded r=10 |
| Logo `ardops.dev` | 1136 (text-anchor end) | 555 | JetBrains Mono 700 | 28 px, color `--text-primary` |
| Accent rail | x=1192 | y=0 → y=630 | rect 8×630, fill `--accent` opacity 0.6 |

## Placeholders sustituibles

| Placeholder | Tipo | Producido por |
|---|---|---|
| `{{TITLE_LINES}}` | fragmento SVG (uno o dos `<text>` con `<tspan>` interno) | `scripts/og/render.js#renderTitleLines(title)` |
| `{{TAGS_SVG}}` | fragmento SVG con N chips (`<g>` con `<rect>` + `<text>`) o cadena vacía | `scripts/og/render.js#renderTagsSvg(tags)` |
| `{{LOGO_TEXT}}` | string XML-escaped | siempre `"ardops.dev"` |

## Escape XML

Todo texto de usuario (`title`, cada `tag`) DEBE pasar por:

```js
function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

Antes de inyectarse en el SVG. Test obligatorio (`tests/og-images.sh`):
generar un post con título que contenga `<script>alert(1)</script>` y
verificar que el SVG intermedio escape correctamente y el PNG se
genere sin errores.

## Wrap del título

`renderTitleLines(title)`:

```text
1. words = title.split(/\s+/)
2. line1, line2, rest = greedyPack(words, maxCharsPerLine = 28)
3. if rest.length > 0:
     line2 = line2 + '…'
4. emit <text x=64 y=230><tspan>line1</tspan></text>
5. if line2: emit <text x=64 y=306><tspan>line2</tspan></text>
6. (centrar verticalmente si line2 vacío: y de line1 pasa a 268)
```

## Chips

`renderTagsSvg(tags)`:

```text
1. visibleTags = tags.slice(0, 4)
2. overflow = tags.length - 4 > 0 ? '+' + (tags.length - 4) : null
3. layout horizontal con padding 16 px interno y gap 16 px entre chips.
4. cada chip: <g><rect fill=--bg-card rx=10 ry=10/><text fill=--accent>#tag</text></g>
5. truncar cada tag visible a 16 chars con '…' interno.
6. si overflow: agregar chip final con texto literal '+N'.
```

## Validación de invariantes

`tests/og-images.sh` verifica para cada PNG:
- `file <png>` reporta `1200 x 630, 8-bit/color RGB`.
- `wc -c <png>` ≤ 100 000.
- `identify -format "%[colorspace]"` reporta `sRGB` (si imagemagick disponible).
- el HTML del post correspondiente contiene
  `<meta property="og:image" content="https://ardops.dev/public/og/blog/<slug>.png">`.
