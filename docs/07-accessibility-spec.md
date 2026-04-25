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
