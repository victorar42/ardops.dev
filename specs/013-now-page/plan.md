# Implementation Plan: `/now/` page — qué estoy haciendo este mes

**Branch**: `013-now-page` | **Date**: 2026-05-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-now-page/spec.md`

## Summary

Publicar una página estática `/now/index.html` siguiendo la convención
[nownownow.com](https://nownownow.com): banner superior con
"Última actualización" envuelto en `<time datetime="YYYY-MM-DD">`, de
3 a 5 secciones temáticas (Trabajo, Aprendiendo, Leyendo, Hablando,
Vida) con listas cortas (1-5 ítems c/u), credit al movimiento y link
hacia ella desde el footer global más un enlace sutil en la home.
Implementación 100 % HTML/CSS vanilla, cero JS propio. Reutiliza el
layout compartido de spec 008, el head-meta y JSON-LD `WebPage` de
spec 011 y los gates ya cableados (csp, seo-meta, jsonld-validate,
sitemap-drift, nav-consistency, no-placeholders, external-links,
a11y, lighthouse). Se agrega un nuevo gate `tests/now-freshness.sh`
que parsea el `<time datetime>` y falla si la página tiene >90 días
de antigüedad o si la fecha es futura. Cero dependencias nuevas.

## Technical Context

**Language/Version**: HTML5, CSS3 (variables de `assets/css/tokens.css`),
Bash POSIX para gates, Node 20 LTS CommonJS para scripts existentes.
**Primary Dependencies**: ninguna nueva. Reutiliza
`scripts/lib/layout.js` (renderHeader/renderFooter — spec 008),
`scripts/build-layout.js` (inyector de markers), `scripts/lib/jsonld.js`
(spec 011), `assets/css/{tokens,layout,components}.css`. `jsdom`
(devDep) sólo si los gates existentes lo usan — no se introduce uso
nuevo.
**Storage**: filesystem estático. Único asset nuevo: ninguno binario
(la página es texto puro). No requiere fuentes ni imágenes nuevas.
**Testing**: gates bash ya existentes (`tests/no-placeholders.sh`,
`tests/external-links.sh`, `tests/csp-no-unsafe-inline.sh`,
`tests/nav-consistency.sh`, `tests/sitemap-drift.sh`,
`tests/seo-meta.sh`, `tests/jsonld-validate.sh`),
`npm run html-validate`, `node tests/a11y.js`, `pa11y`. Nueva gate:
`tests/now-freshness.sh`.
**Target Platform**: GitHub Pages estático en `https://ardops.dev/now/`.
Browsers evergreen (Chrome/Firefox/Safari últimas 2 versiones),
lectores de pantalla (VoiceOver, NVDA), navegación por teclado completa.
**Project Type**: sitio estático single-tree. Una página HTML nueva
sin JS propio y sin binarios.
**Performance Goals**: Lighthouse Perf ≥ 95, A11y = 100, SEO ≥ 95,
Best-Practices ≥ 95 (mobile). LCP < 2.5 s, CLS < 0.1, INP < 200 ms.
**Constraints**: peso transferido total ≤ 25 KB sobre la línea base
del sitio. Cero `unsafe-inline`/`unsafe-eval`, cero externals en
runtime, cero deps nuevas, CSP idéntica al resto. Gate de freshness
con umbral 90 días calculado en UTC.
**Scale/Scope**: 1 página HTML nueva (~120-180 LOC), 0 archivos JS
nuevos, 0 binarios. Modificaciones puntuales:
- `scripts/lib/layout.js` (link `/now/` en footer)
- `scripts/build-layout.js` (+1 entrada en `PAGES`)
- `scripts/check-csp.js`, `check-external-links.js`,
  `check-seo-meta.js`, `check-jsonld.js`,
  `check-nav-consistency.js` (agregar `now/index.html` a `STATIC_PAGES`)
- `package.json` `html-validate` + script `check:now-freshness`
- `tests/no-placeholders.sh` (+ candidato)
- `tests/a11y.js`, `tests/pa11y.config.js`,
  `tests/lighthouserc.json`, `tests/lighthouserc.mobile.json` (+URL)
- `sitemap.xml` (+1 entry)
- `index.html` (+1 link sutil hacia `/now/`)
- nuevo: `tests/now-freshness.sh`
- nuevo: job en `.github/workflows/ci.yml`

## Constitution Check

Constitución `.specify/memory/constitution.md` v1.2.0 — evaluación
gate por gate antes de Phase 0:

| # | Principio | Status | Justificación |
|---|-----------|--------|---------------|
| I | Spec-Driven obligatorio | PASS | Spec 013 aprobada (checklist 16/16). Este plan es el paso siguiente del flujo. |
| II | Identidad visual preservada | PASS | Reutiliza `tokens.css`/`layout.css`/`components.css`. Cero variables nuevas, cero fonts nuevas. Estilos scoped `.now-*` si se requieren, dentro de `components.css`. |
| III | Sitio 100 % estático | PASS | HTML autoría manual. Sin build server-side, sin DB, sin generador nuevo. |
| IV | Cero deps JS terceros | PASS | Cero JS propio en la página. Cero deps npm nuevas. Gate de freshness es bash + `date` POSIX. |
| V | Fonts y assets self-hosted | PASS | Sin assets nuevos. Texto puro. |
| VI | A11y WCAG 2.1 AA | PASS | `<time datetime>`, `<h1>` único, listas semánticas, headings sin saltos, skip link reutilizado del layout compartido. Gate `pa11y` + `node tests/a11y.js`. |
| VII | Performance es feature | PASS | Página de texto ≤ 25 KB. Sin imágenes ni scripts ni fonts adicionales. |
| VIII | Seguridad por defecto | PASS | Mismo CSP meta. `<a target="_blank">` externos (nownownow.com y posibles enlaces de bullets) con `rel="noopener noreferrer"`. Referrer-policy via head-meta (spec 009). |
| IX | Cada PR pasa todas las gates | PASS | Página incorporada a `no-placeholders`, `csp`, `seo-meta`, `jsonld-validate`, `sitemap-drift`, `nav-consistency`, `external-links`, `a11y`, `lighthouse`. Nueva `tests/now-freshness.sh` se suma al pipeline. |
| X | Documentación versionada | PASS | spec.md, plan.md, research.md, data-model.md, quickstart.md, contracts/ todos commitean en `specs/013-now-page/`. |
| XI | Hosting y dominio fijos | PASS | GitHub Pages + dominio `ardops.dev`. CSP via meta. Cero cambio operativo. |

**Resultado**: 11/11 PASS. Cero violaciones — no hay entradas en
**Complexity Tracking**.

## Project Structure

### Documentation (this feature)

```text
specs/013-now-page/
├── plan.md              # This file
├── research.md          # Phase 0 output (decisiones técnicas)
├── data-model.md        # Phase 1 output (entidades: Page, Section, Item, Freshness)
├── quickstart.md        # Phase 1 output (cómo correr/validar localmente)
├── contracts/
│   ├── now-html-contract.md         # contrato del documento HTML servido
│   ├── now-freshness-gate.md        # contrato del gate bash
│   └── jsonld-webpage.md            # forma del JSON-LD WebPage con dateModified
└── checklists/
    └── requirements.md  # ya generado en /specify (16/16 PASS)
```

### Source Code (repository root)

```text
ardops.dev/
├── now/
│   └── index.html               # NUEVO — página servida en /now/
├── index.html                   # MOD — agregar link sutil hacia /now/ cerca del bio o en el outro
├── assets/
│   └── css/
│       └── components.css       # MOD (si requiere layout específico) — bloque `/* Now page (spec 013) */`
├── scripts/
│   ├── lib/
│   │   └── layout.js            # MOD — agregar link `/now/` en sección FOOTER (no en NAV)
│   ├── build-layout.js          # MOD — agregar `now/index.html` a PAGES
│   ├── check-csp.js             # MOD — agregar a STATIC_PAGES
│   ├── check-external-links.js  # MOD — agregar a STATIC_PAGES
│   ├── check-seo-meta.js        # MOD — agregar a STATIC_PAGES
│   ├── check-jsonld.js          # MOD — agregar a STATIC_PAGES
│   └── check-nav-consistency.js # MOD — agregar a STATIC_PAGES (sin currentPath para nav, footer-only)
├── tests/
│   ├── no-placeholders.sh       # MOD — agregar `now/index.html` a candidates
│   ├── a11y.js                  # MOD — agregar URL `/now/`
│   ├── pa11y.config.js          # MOD — agregar URL `/now/`
│   ├── lighthouserc.json        # MOD — agregar URL `/now/`
│   ├── lighthouserc.mobile.json # MOD — agregar URL `/now/`
│   └── now-freshness.sh         # NUEVO — gate bash umbral 90 días
├── sitemap.xml                  # MOD — entry `/now/` priority 0.6 changefreq monthly
├── package.json                 # MOD — script `check:now-freshness` + html-validate + chain en `check:distribution`
└── .github/
    └── workflows/
        └── ci.yml               # MOD — job `now-freshness` (consistente con headshot-size)
```

**Structure Decision**: sitio estático single-tree. No hay separación
frontend/backend. La página vive bajo `now/index.html` siguiendo el
patrón de `/talks/`, `/uses/`, `/speaking/`, `/blog/` y `/interviews/`.

## Phase 0 — Outline & Research

Producto: [research.md](./research.md) con decisiones cerradas
sobre:

- R-1: Cantidad y orden de secciones canónicas (3 mínimo, hasta 5)
- R-2: Formato del banner — fecha humana legible + `<time datetime>` ISO
- R-3: JSON-LD `WebPage` mínimo: `@context`, `@type`, `url`,
  `dateModified`, `inLanguage`, `isPartOf` (WebSite), `mainEntityOfPage`
- R-4: Ubicación del link en home (footer del hero, near-bio, o outro)
- R-5: Estrategia del gate de freshness — parser, umbral, manejo de
  fechas futuras, zona horaria UTC, comportamiento ante falta de `<time>`
- R-6: Política de CSS — reutilizar clases existentes
  vs. introducir `.now-*` scoped
- R-7: Política de bullets con enlaces externos
  (`rel="noopener noreferrer"` siempre)
- R-8: Footer link consolidado en `scripts/lib/layout.js`
  vs. agregado manual por página

**Output**: research.md con todas las decisiones bajo formato
(Decision / Rationale / Alternatives).

## Phase 1 — Design & Contracts

Producto:

1. [data-model.md](./data-model.md) describiendo entidades:
   `Page` (atributos: url, lang, dateModified, sectionsCount),
   `Section` (heading, slug, items[]),
   `Item` (text, optional href, optional rel),
   `FreshnessReport` (datetime, days, status).
2. `contracts/now-html-contract.md` — estructura HTML requerida:
   markers `<!-- head-meta:start -->`, `<!-- nav:start -->`,
   `<!-- footer:start -->`; banner con `<time>`; `<h1>` único;
   ≥ 3 `<section>` con `<h2>` + lista; credit a nownownow;
   JSON-LD bloque.
3. `contracts/now-freshness-gate.md` — interfaz del gate
   (`tests/now-freshness.sh`):
   - Entrada: archivo `now/index.html`
   - Salida exit 0 con `✓ now-freshness gate: actualizada hace N días (YYYY-MM-DD)`
   - Exit ≠ 0 con mensaje específico si falta `<time>`, si la fecha
     no parsea, si está en el futuro o si supera 90 días.
   - Variables de entorno: `NOW_PAGE` (override path),
     `NOW_FRESHNESS_MAX_DAYS` (override umbral, default 90).
4. `contracts/jsonld-webpage.md` — forma exacta del bloque JSON-LD.
5. [quickstart.md](./quickstart.md) con:
   - Comandos para regenerar layout, correr gates,
     verificar a11y, verificar lighthouse local.
   - Workflow mensual de update (≤ 15 min objetivo).
   - Cómo simular fecha vencida para probar el gate (override env var).

**Update agent context**: ya hecho — `.github/copilot-instructions.md`
marcador SPECKIT apunta a `specs/013-now-page/spec.md`. Será
actualizado al cierre de esta fase para apuntar a este `plan.md`.

## Phase 2 — Tasks (out of scope para `/plan`)

`/speckit.tasks` generará `tasks.md` con descomposición
dependency-ordered. Estimación gruesa (referencia, no exhaustiva):

- Setup: research.md, data-model.md, contracts/, quickstart.md (4)
- HTML scaffold: head-meta markers, banner, secciones, JSON-LD, credit (4-5)
- Layout wiring: footer link en `scripts/lib/layout.js`, build-layout PAGES (2)
- Home link sutil + sitemap + script lists (STATIC_PAGES) (4-5)
- Gate nuevo: `tests/now-freshness.sh` + `package.json` script + CI job (3)
- Gate integrations: agregar URL a a11y/pa11y/lighthouserc (1-2)
- CSS scoped (si necesario) (1)
- Validation: correr toda la suite local, ajustar (2-3)
- Polish: actualizar `backlog/06`, marcar tasks `[X]`, stop&report (1-2)

Total estimado ≈ 22-26 tareas. La cifra exacta saldrá en `/speckit.tasks`.

## Complexity Tracking

> Sin violaciones constitucionales. Tabla vacía.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
