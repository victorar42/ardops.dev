# 07 — Accessibility Spec

## Estándar
- WCAG 2.1 nivel AA mínimo

## Criterios clave

- Contraste mínimo 4.5:1 (verificar paleta terminal)
- Navegación 100% por teclado
- Skip links
- ARIA labels donde aplique
- Lighthouse Accessibility = 100



---

## Implementación v1 — WCAG 2.1 AA

Cumplimiento medido con axe-core 4.x (WCAG 2.1 AA): **0 violaciones** en
las 4 URLs (`/`, `/blog/`, `/talks/`, `/404`).

**Notas técnicas del runner**:

- Pa11y (htmlcs+axe) reporta falsos positivos de contraste cuando la
  meta-CSP `script-src 'self'` bloquea la inyección de axe vía
  `<script>`. Para evitarlo, el gate de CI usa
  [tests/a11y.js](../tests/a11y.js): un runner propio basado en Puppeteer
  + `setBypassCSP(true)` + axe-core inyectado vía
  `evaluateOnNewDocument` (solo en test, jamás en producción).

**Implementaciones clave**:

- `<a class="skip-link" href="#main">` como primer elemento focusable.
- Único `<h1>` por página.
- `aria-label` en enlaces icon-only y `target="_blank"`.
- SVGs decorativos con `aria-hidden="true"`.
- "Próximamente" como `<span aria-disabled="true">` no focusable.
- Tokens de color ajustados para superar 4.5:1 vs `--bg-primary` y
  `--bg-card` (`--text-secondary: #b8c5d9`, `--text-muted: #9ea9bd`).
- `prefers-reduced-motion: reduce` desactiva animaciones decorativas.

---

## WCAG 2.1 AA enforcement (spec 014)

Spec [014-perf-a11y-thresholds](../specs/014-perf-a11y-thresholds/)
formaliza el nivel de cumplimiento exigido:

### Contraste

| Tipo | Ratio mínimo |
|---|---:|
| Texto normal (< 18 pt / < 14 pt bold) | 4.5 : 1 |
| Texto grande (≥ 18 pt / ≥ 14 pt bold) | 3.0 : 1 |
| Componentes UI y bordes informativos | 3.0 : 1 |

Verificación automática:

- **axe-core** (en `tests/a11y.js`) audita contraste en CI bajo el
  preset `wcag21aa` para todas las páginas servidas.
- **Lighthouse** Accessibility category con minScore = 1.0 (FR-01 de
  spec 014). Cualquier regresión de contraste hace fallar el job
  `lighthouse-desktop` y `lighthouse-mobile`.

### Image attributes (CLS + a11y)

Gate [tests/img-attrs.sh](../tests/img-attrs.sh) exige en cada `<img>`
servido (spec 014 FR-06): `alt` presente (vacío permitido si decorativa),
`width` y `height` explícitos, `loading` declarado (`lazy` o `eager`),
`decoding="async"`. Esto previene CLS y degradación de a11y.

### Fonts policy

Gate [tests/no-third-party-fonts.sh](../tests/no-third-party-fonts.sh)
verifica que no haya referencias a `fonts.googleapis.com` ni
`fonts.gstatic.com`, que `assets/fonts/` solo contenga `.woff2`, y que
cada `@font-face` declare `font-display: swap` (spec 014 FR-07..09).
