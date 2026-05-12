# Implementation Plan: `/uses/` page — stack & herramientas

**Branch**: `010-uses-page` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-uses-page/spec.md`

## Summary

Crear una página estática nueva en `/uses/` (`uses/index.html`) que lista el
stack del autor (hardware, OS, editor, terminal, lenguajes, DevOps, security,
cloud, productividad; opcionalmente hobbies y abandoned). Cada item se modela
como `<dl>` con `<dt>` (nombre) y `<dd>` (justificación corta). La página
participa del shell compartido (nav + footer + head meta) vía
`scripts/lib/layout.js` + marker pattern (spec 008) y de la política de
seguridad canónica (CSP, referrer, anti-tabnabbing) vía spec 009. No requiere
generador propio: el contenido se edita a mano 1-2 veces al año.

Los cambios se concentran en: (a) un HTML nuevo con la misma forma que
`talks/index.html`, (b) extender 4 listas en módulos compartidos
(`scripts/lib/layout.js`, `scripts/build-layout.js`, `scripts/check-csp.js`,
`scripts/check-nav-consistency.js`; `scripts/check-sitemap-drift.js` la cubre
automáticamente al añadir la entrada al sitemap), (c) sumar 1 entrada a
`sitemap.xml` y 1 URL a `tests/a11y.js`, (d) un componente CSS opcional
`.uses-list` que vive en `assets/css/components.css`.

## Technical Context

**Language/Version**: HTML5 + CSS3 + zero-runtime JS (Node 20 LTS sólo en build/CI).
**Primary Dependencies**: ninguna nueva. Reutiliza `jsdom`, `axe-core`, `puppeteer`, `html-validate` ya presentes.
**Storage**: filesystem (sitio estático). El contenido vive en `uses/index.html` versionado en git.
**Testing**: gates existentes — `npm run html-validate`, `node tests/a11y.js`, `tests/no-placeholders.sh`, `tests/external-links.sh`, `tests/sitemap-drift.sh`, `tests/csp-no-unsafe-inline.sh`, `tests/nav-consistency.sh`.
**Target Platform**: GitHub Pages (estático). Navegadores modernos (last 2 versions de Chromium/Firefox/Safari).
**Project Type**: sitio estático (HTML + CSS + vanilla JS).
**Performance Goals**: Lighthouse Performance ≥ 95, Accessibility = 100, BP ≥ 95, SEO ≥ 95 (mobile sim). LCP < 2.5s, CLS < 0.1, INP < 200ms.
**Constraints**: cero deps JS de terceros en runtime, cero externals, cero `'unsafe-inline'`, cero scripts/styles inline, cero imágenes embebidas en `<body>`, cero links de afiliado.
**Scale/Scope**: 1 página nueva (`uses/index.html`), ~9 secciones obligatorias + 2 opcionales, ~30-60 items totales esperados. Edits anuales.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplicabilidad | Estado |
|---|---|---|
| **I. Spec-Driven obligatorio** | Esta spec + plan + tasks + implement; el contenido se edita después siguiendo el flujo. | PASS |
| **II. Identidad visual preservada** | Reutiliza `tokens.css`, `components.css`, `home.css`, `base.css`, `layout.css`, `motion.css`. Nuevo selector `.uses-list` (si se introduce) usa exclusivamente variables CSS y respeta paleta + tipografía. Cero colores hardcodeados, cero fonts nuevas. | PASS |
| **III. Sitio 100% estático** | HTML plano servido por GitHub Pages. Cero backend. | PASS |
| **IV. Cero deps JS de terceros sin justificación** | Cero deps nuevas. La página no carga JS propio (sólo `main.js` global heredado). | PASS |
| **V. Fonts y assets self-hosted** | Cero requests externos. Reutiliza fonts ya self-hosted. | PASS |
| **VI. Accesibilidad WCAG 2.1 AA** | Jerarquía `h1 → h2`, `<dl>/<dt>/<dd>` semánticos, navegación por teclado, contraste AA, skip-link via header compartido. URL `/uses/` se añade a `tests/a11y.js`. | PASS |
| **VII. Performance** | Sin imágenes embebidas, sin JS adicional, sin estilos inline. Reutiliza CSS ya cargado por las otras páginas (caché compartido). | PASS |
| **VIII. Seguridad por defecto** | Misma CSP canónica que `talks/index.html`; `<meta name="referrer">` vía marker procesado por `build-layout.js`; `rel="noopener noreferrer"` en cualquier link externo (gate `external-links.sh`). Cero `'unsafe-inline'` (gate `csp-no-unsafe-inline.sh`). Cero externals. | PASS |
| **IX. Cada PR pasa todas las gates** | 7 gates declarados como bloqueantes en FR-013 + html-validate. CI corre todas. | PASS |
| **X. Documentación versionada** | `specs/010-uses-page/` commiteado. | PASS |
| **XI. Hosting y dominio fijos** | Sin headers HTTP custom; toda la política vía meta. Ningún cambio de hosting. | PASS |

**Resultado**: 11/11 PASS. Cero violaciones, cero excepciones.

## Project Structure

### Documentation (this feature)

```text
specs/010-uses-page/
├── plan.md                    # Este archivo
├── research.md                # Phase 0
├── data-model.md              # Phase 1
├── quickstart.md              # Phase 1
├── contracts/
│   ├── uses-page-html.md      # Estructura HTML de uses/index.html
│   ├── uses-list-css.md       # Componente .uses-list (opcional)
│   └── shared-modules-update.md  # Diff esperado en NAV / STATIC_PAGES / sitemap / a11y
├── checklists/
│   └── requirements.md        # PASS 16/16 (creado en /specify)
└── tasks.md                   # Phase 2 — generado por /speckit.tasks
```

### Source Code (repository root)

```text
uses/
└── index.html                 # NEW — la página

scripts/
├── lib/
│   └── layout.js              # MOD — añadir { href: '/uses/', label: 'Uses', match: ['/uses/'] } a NAV
├── build-layout.js            # MOD — añadir { file: 'uses/index.html', currentPath: '/uses/' } a PAGES
├── check-csp.js               # MOD — añadir 'uses/index.html' a STATIC_PAGES
├── check-nav-consistency.js   # MOD — añadir { file: 'uses/index.html', currentPath: '/uses/' } a STATIC_PAGES
└── check-sitemap-drift.js     # NO CHANGE — descubre páginas servidas; OK con sólo añadir entrada a sitemap.xml

assets/
└── css/
    └── components.css         # MOD — agregar selector .uses-list (sólo si justificado por contracts/uses-list-css.md)

sitemap.xml                    # MOD — añadir <url><loc>https://ardops.dev/uses/</loc>...</url>

tests/
└── a11y.js                    # MOD — añadir 'http://localhost:8080/uses/' al array URLS

.github/
└── copilot-instructions.md    # MOD — actualizar marker SPECKIT al plan.md de esta feature
```

**Structure Decision**: estructura existente del sitio estático. La página
nueva vive en `uses/index.html` (mismo patrón que `talks/index.html`). Los
módulos compartidos se extienden con una entrada cada uno; ningún módulo
nuevo. Sin nuevo CSS file, sin nuevo gate, sin nuevo build script.

## Complexity Tracking

> Sin violaciones constitucionales. Tabla vacía.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

---

## Phase 0 — Research

Ver [research.md](./research.md). Resumen de decisiones:

- **D-001**: Página estática a mano vs generador → **a mano** (cadencia anual, costo de generador > beneficio).
- **D-002**: Modelo HTML por item → **`<dl>`/`<dt>`/`<dd>`** (contrato del backlog FR-03 y semánticamente apropiado).
- **D-003**: Componente CSS → **`.uses-list` en `components.css`** sólo si los selectores genéricos no logran la legibilidad esperada.
- **D-004**: Nav item → entrada `{ href: '/uses/', label: 'Uses', match: ['/uses/'] }` después de `Charlas`, antes de `Contacto`.
- **D-005**: Identidad del autor en JSON-LD → reutilizar la misma forma que en `index.html`.
- **D-006**: OG image → reutilizar `public/og/og-default.png`.
- **D-007**: Fecha "última actualización" → hardcoded en HTML, en español + `<time datetime>`. Sin JS.
- **D-008**: Sin imágenes/íconos por item.
- **D-009**: Sitemap drift gate → cubierto vía actualización de `sitemap.xml`.
- **D-010**: CSP / nav-consistency gates → añadir `uses/index.html` a sus `STATIC_PAGES`.
- **D-011**: Active state → `match: ['/uses/']` y `currentPath` lo activa.

## Phase 1 — Design & Contracts

Ver:

- [data-model.md](./data-model.md) — entidades editoriales (`UsesPage`, `Section`, `StackItem`, `Person`).
- [contracts/uses-page-html.md](./contracts/uses-page-html.md) — esqueleto HTML, head obligatorio, marker pattern, JSON-LD, banner de actualización.
- [contracts/uses-list-css.md](./contracts/uses-list-css.md) — selector `.uses-list` opcional con tokens.
- [contracts/shared-modules-update.md](./contracts/shared-modules-update.md) — diff exacto esperado en `NAV`, `PAGES`, `STATIC_PAGES`, `tests/a11y.js`, `sitemap.xml`.
- [quickstart.md](./quickstart.md) — pasos de validación local + manual.

### Agent context update

El marker `<!-- SPECKIT START --> ... <!-- SPECKIT END -->` en
`.github/copilot-instructions.md` se actualiza para apuntar a este plan
como parte de la implementación (tarea explícita en `tasks.md`).

---

## Re-evaluación Constitution Check (post-design)

Después de Phase 1, ningún artefacto introduce nuevas dependencias, scripts
de terceros, requests externos ni patrones inseguros. Los contracts
documentan diffs mínimos y reutilización exhaustiva de módulos existentes.
**Resultado**: 11/11 PASS sin cambios.

---

## Reportar

- **Branch**: `010-uses-page`
- **Plan**: [specs/010-uses-page/plan.md](specs/010-uses-page/plan.md)
- **Artefactos generados**:
  - [specs/010-uses-page/research.md](specs/010-uses-page/research.md)
  - [specs/010-uses-page/data-model.md](specs/010-uses-page/data-model.md)
  - [specs/010-uses-page/quickstart.md](specs/010-uses-page/quickstart.md)
  - [specs/010-uses-page/contracts/uses-page-html.md](specs/010-uses-page/contracts/uses-page-html.md)
  - [specs/010-uses-page/contracts/uses-list-css.md](specs/010-uses-page/contracts/uses-list-css.md)
  - [specs/010-uses-page/contracts/shared-modules-update.md](specs/010-uses-page/contracts/shared-modules-update.md)
- **Próximo paso**: `/speckit.tasks`.
