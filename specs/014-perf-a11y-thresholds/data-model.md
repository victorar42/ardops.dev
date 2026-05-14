# Data Model — Spec 014 Performance & a11y thresholds

Esta spec **no introduce datos de runtime**. Las entidades aquí
documentadas son configuraciones de build-time consumidas por los gates
de CI.

---

## ThresholdConfig

Configuración por preset (desktop / mobile) que define los mínimos
Lighthouse y los assertions de Core Web Vitals.

| Campo | Tipo | Desktop | Mobile |
|---|---|---|---|
| preset | string | "desktop" | (default) |
| numberOfRuns | int | 3 | 3 |
| categories.performance.minScore | float | 0.95 | 0.95 |
| categories.accessibility.minScore | float | 1.0 | 1.0 |
| categories.best-practices.minScore | float | 0.95 | 0.95 |
| categories.seo.minScore | float | 0.95 | 0.95 |
| largest-contentful-paint.maxNumericValue | int (ms) | 2500 | 3000 |
| cumulative-layout-shift.maxNumericValue | float | 0.1 | 0.1 |
| total-blocking-time.maxNumericValue | int (ms) | 200 | 300 |
| total-byte-weight.maxNumericValue | int (bytes) | 512000 | 512000 |

**URLs** (idénticas en desktop y mobile):
- `http://localhost/index.html`
- `http://localhost/blog/index.html`
- `http://localhost/blog/<latest-post-slug>.html` (último post real)
- `http://localhost/interviews/index.html`
- `http://localhost/talks/index.html`
- `http://localhost/speaking/index.html`
- `http://localhost/now/index.html`
- `http://localhost/404.html`

**Validación**: cada URL debe responder 200 y pasar todos los
assertions. Asserts nivel "error" hacen fallar `lhci autorun`.

**Persistencia**: archivos JSON `tests/lighthouserc.json` y
`tests/lighthouserc.mobile.json`.

---

## ByteBudget

Tupla `(bucket, scope, max_bytes, unit)`.

| bucket | scope | max_bytes | unit | comentario |
|---|---|---:|---|---|
| `html-each` | `*.html` servido (excluye `fixtures/`) | 51200 | gzip-9 | 50 KiB |
| `css-sum` | `assets/css/**/*.css` (concatenado) | 30720 | gzip-9 | 30 KiB |
| `js-sum` | `assets/js/**/*.js` (concatenado) | 51200 | gzip-9 | 50 KiB |
| `img-each` | `assets/img/**/*` (cualquier extensión binaria) | 204800 | raw | 200 KiB |

**Excepciones**: ninguna hard-coded (R-6). El gate
`tests/headshot-size.sh` existente sigue aplicando reglas
adicionales más estrictas sobre `assets/img/speaking/headshot.jpg`
(JPEG + ≥1200×1200), independiente de este budget.

**Persistencia**: constantes definidas en cabecera de
`tests/byte-budgets.sh`.

---

## ImgRule

Regla por elemento `<img>` en HTML servido.

| Atributo | Requerido | Valor permitido | Excepción |
|---|---|---|---|
| `alt` | sí | cualquiera (vacío = decorativa) | — |
| `width` | sí | entero positivo | — |
| `height` | sí | entero positivo | — |
| `loading` | sí | `lazy` o `eager` | autor decide según rol de la imagen (hero LCP suele ser `eager` + `fetchpriority="high"`; resto `lazy`) |
| `decoding` | sí | `async` | — |

**Nota R-5 (ajuste post-implementación)**: la heurística "primera `<img>` =
LCP candidate" se descartó porque en este sitio la LCP suele ser texto, no
imagen. El gate exige el atributo `loading` (cualquier valor válido)
para forzar decisión consciente del autor; no impone el valor concreto.

**Scope**: HTML servidos definidos en `STATIC_PAGES` (alineado con
`scripts/check-csp.js` etc.):
- `index.html`, `404.html`, `blog/index.html`, `interviews/index.html`,
  `talks/index.html`, `speaking/index.html`, `now/index.html`.
- Posts generados: `blog/*.html` (post-build).
- Interviews emitidos: `interviews/*.html` excepto `index.html`
  (post-build).

**Out of scope**: fixtures (`interviews/valid-minimal.html`,
`interviews/xss-attempt.html`), referencias en `.reference/`, archivos
en `legacy/`.

**Persistencia**: lógica en `tests/img-attrs.sh` + helper
`tests/lib/parse-img.js` (Node + jsdom).

---

## FontPolicy

Reglas de policy aplicadas a fonts del sitio.

| # | Regla | Donde se verifica |
|---|---|---|
| FP-1 | Cero referencias a `fonts.googleapis.com` y `fonts.gstatic.com` | HTML + CSS servidos |
| FP-2 | Cero `@font-face { src: url("https://...") }` con dominio externo | `assets/css/**/*.css` |
| FP-3 | `assets/fonts/` solo contiene `.woff2`, `LICENSE.md` o subdirectorios | inventory `find` |
| FP-4 | Cada `@font-face` declara `font-display: swap` | `assets/css/**/*.css` |

**Excepciones**: ninguna.

**Persistencia**: lógica en `tests/no-third-party-fonts.sh` (grep+awk
sobre `@font-face` blocks; sin parser CSS externo).

---

## Relaciones

```text
ThresholdConfig (2 instancias: desktop, mobile)
  ─ asserts ─→ URLs (sitio servido)

ByteBudget (4 buckets)
  ─ aplica a ─→ artefactos build (*.html, assets/css, assets/js, assets/img)

ImgRule (1 ruleset)
  ─ aplica a ─→ <img> en STATIC_PAGES ∪ posts generados

FontPolicy (4 reglas)
  ─ aplica a ─→ HTML servido ∪ assets/css ∪ assets/fonts
```

Sin relaciones runtime. Sin estado mutable. Sin migraciones.
