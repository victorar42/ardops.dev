# Contract — `scripts/lib/head.js`

**Spec**: [../spec.md](../spec.md) · **FRs**: FR-005, FR-006

## Propósito

Single source of truth para metas comunes del `<head>`. En esta spec
expone el mínimo necesario para FR-006 (referrer policy uniforme).
Diseñado para extenderse en specs futuras sin breaking changes.

## API exportada (spec 009)

```js
// scripts/lib/head.js
'use strict';

/**
 * Meta tag para política de referrer.
 * Aplicado a TODAS las páginas servidas.
 * Cambiar requiere editar esta constante y regenerar el sitio.
 */
const META_REFERRER =
  '<meta name="referrer" content="strict-origin-when-cross-origin">';

module.exports = { META_REFERRER };
```

## Consumidores

- `scripts/build-blog.js` — emite `META_REFERRER` en el `<head>` de
  `blog/index.html` y cada `blog/<slug>.html`.
- `scripts/build-interviews.js` — emite `META_REFERRER` en el `<head>`
  de `interviews/index.html` y cada `interviews/<slug>.html`.
- `scripts/build-layout.js` — emite `META_REFERRER` entre los markers
  `<!-- head-meta:start -->` / `<!-- head-meta:end -->` en las
  páginas estáticas (`index.html`, `404.html`, `talks/index.html`).

## Marker pattern (páginas estáticas)

Cada página estática debe contener, en su `<head>`:

```html
<!-- head-meta:start -->
<meta name="referrer" content="strict-origin-when-cross-origin">
<!-- head-meta:end -->
```

Posición recomendada: justo después de
`<meta http-equiv="Content-Security-Policy">`.

`build-layout.js` reemplaza el contenido entre los markers (incluidos)
en cada run. Si los markers no existen → el script falla con instrucción
clara.

## Modos del orquestador (consistente con spec 008)

```
node scripts/build-layout.js          # write
node scripts/build-layout.js --check  # exit 1 si hay drift
```

## Garantías

- **Determinismo**: el output es función pura de la constante.
- **Idempotencia**: ejecutar `build-layout.js` dos veces produce el
  mismo resultado.
- **Sin runtime**: el módulo es CommonJS Node, nunca llega al navegador.

## Extensibilidad futura (no en spec 009)

Una spec futura puede agregar:
- `META_THEME_COLOR`
- `META_COLOR_SCHEME`
- `renderHeadMeta({ csp, title, canonical, ... })`
- `renderFavicons()` / `renderFontPreloads()`

Cualquier extensión es additive — los consumidores actuales siguen
funcionando.
