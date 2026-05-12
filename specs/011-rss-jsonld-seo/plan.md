# Implementation Plan: RSS, JSON-LD y SEO distribution

**Branch**: `011-rss-jsonld-seo` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-rss-jsonld-seo/spec.md`

## Summary

Generar `/blog/feed.xml` (RSS 2.0) y `/blog/feed.json` (JSON Feed 1.1) en
build-time desde el dataset existente de posts publicados; emitir JSON-LD
estructurado (`Person` reusado, `Article` por post, `Blog` en listing,
`ItemList` en talks/interviews, `BreadcrumbList` en posts/listings); añadir
auto-discovery (`<link rel="alternate">`) en blog index y posts; introducir
3 gates bloqueantes (`feed-validate`, `jsonld-validate`, `seo-meta`) con
sus jobs en CI. Cero deps nuevas (templating XML/JSON a mano + escape
correcto + reuso de `jsdom` para gates). CSP intacta — JSON-LD se sirve
como `application/ld+json`, no es ejecutable bajo `script-src 'self'`.

Cambios concentrados en: (a) 2 módulos nuevos `scripts/lib/feeds.js` y
`scripts/lib/jsonld.js` (CommonJS puros, testeable sin mocks); (b)
extender `scripts/build-blog.js` para emitir feeds + JSON-LD por post + en
blog index; (c) extender `scripts/build-interviews.js` y `talks/index.html`
para emitir `ItemList`; (d) re-emitir el `Person` de `index.html` con `@id`
canónico (mínimo cambio, mantener mismo dataset); (e) 3 nuevos gates +
scripts de validación; (f) entradas nuevas en `sitemap.xml` y
`tests/no-placeholders.sh`; (g) jobs de CI.

## Technical Context

**Language/Version**: Node 20 LTS (build/CI), HTML5/XML/JSON (runtime estático).
**Primary Dependencies**: existentes — `jsdom`, `gray-matter`, `marked`, `dompurify`, `puppeteer`, `axe-core`, `html-validate`. **Cero deps nuevas** (FR-018 + SC-009).
**Storage**: filesystem. Feeds se escriben a `blog/feed.xml` y `blog/feed.json`. Ambos archivos generados (gitignored si la convención del repo lo es para `blog/*.html`; verificar en research).
**Testing**: 3 gates nuevas (`tests/feed-validate.sh`, `tests/jsonld-validate.sh`, `tests/seo-meta.sh`) + las existentes deben seguir verdes.
**Target Platform**: GitHub Pages (estático).
**Project Type**: sitio estático.
**Performance Goals**: Lighthouse SEO ≥ 95 en `/blog/` y posts (SC-006). El build de feeds debe ser O(N posts) sin overhead notable.
**Constraints**: cero deps nuevas, cero modificación a CSP, `lastBuildDate` derivado del post más reciente (build determinista), escape XML/JSON estricto.
**Scale/Scope**: ~1-50 posts publicados en horizonte 2026-2027. ~10 páginas servidas para gates SEO.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplicabilidad | Estado |
|---|---|---|
| **I. Spec-Driven obligatorio** | spec → plan → tasks → implement. | PASS |
| **II. Identidad visual preservada** | Cero cambios visuales: feeds + JSON-LD viven en `<head>` o en archivos no-HTML. Sin CSS nuevo. | PASS |
| **III. Sitio 100% estático** | Feeds generados en build-time. Cero backend. | PASS |
| **IV. Cero deps JS de terceros sin justificación** | FR-018 + SC-009. Templating manual con escape; gates usan `jsdom` ya presente. | PASS |
| **V. Fonts y assets self-hosted** | Feeds servidos desde `ardops.dev`. Cero externals. | PASS |
| **VI. Accesibilidad WCAG 2.1 AA** | Feeds y JSON-LD viven fuera del flujo a11y. Auto-discovery `<link>` no afecta a11y. | PASS |
| **VII. Performance** | Feeds <50KB esperados. JSON-LD inline <2KB por página. Cero impacto en LCP/CLS/INP. | PASS |
| **VIII. Seguridad por defecto** | FR-019 + SC-010. JSON-LD es MIME `application/ld+json`, NO ejecutable bajo CSP `script-src 'self'`. Cero hashes nuevos, cero `'unsafe-inline'`, cero externals. Escape XML/JSON estricto evita inyección. | PASS |
| **IX. Cada PR pasa todas las gates** | 3 gates nuevas bloqueantes + las existentes (csp, external-links, sitemap-drift, nav-consistency, no-placeholders, html-validate, blog-schema, interviews-xss, a11y). | PASS |
| **X. Documentación versionada** | `specs/011-rss-jsonld-seo/` commiteado. | PASS |
| **XI. Hosting y dominio fijos** | Feeds bajo `https://ardops.dev/blog/`. Sin headers HTTP custom. | PASS |

**Resultado**: 11/11 PASS. Cero violaciones, cero excepciones. Tabla de
Complexity Tracking queda vacía.

## Project Structure

### Documentation (this feature)

```text
specs/011-rss-jsonld-seo/
├── plan.md                          # Este archivo
├── research.md                      # Phase 0
├── data-model.md                    # Phase 1
├── quickstart.md                    # Phase 1
├── contracts/
│   ├── rss-2.0-contract.md          # Forma exacta de feed.xml
│   ├── jsonfeed-1.1-contract.md     # Forma exacta de feed.json
│   ├── jsonld-schemas.md            # Person/Article/Blog/ItemList/BreadcrumbList
│   ├── feeds-module.md              # API de scripts/lib/feeds.js
│   ├── jsonld-module.md             # API de scripts/lib/jsonld.js
│   ├── feed-validate-gate.md        # Gate: tests/feed-validate.sh
│   ├── jsonld-validate-gate.md      # Gate: tests/jsonld-validate.sh
│   └── seo-meta-gate.md             # Gate: tests/seo-meta.sh
├── checklists/
│   └── requirements.md              # PASS 16/16 (creado en /specify)
└── tasks.md                         # Phase 2 — generado por /speckit.tasks
```

### Source Code (repository root)

```text
scripts/
├── lib/
│   ├── feeds.js               # NEW — renderRss(channel, items), renderJsonFeed(channel, items)
│   └── jsonld.js              # NEW — personSchema(), articleSchema(post), blogSchema(posts),
│                              #       itemListSchema(items), breadcrumbsSchema(crumbs), serialize()
├── build-blog.js              # MOD — invoca feeds + jsonld; emite Article + BreadcrumbList por post,
│                              #       Blog + BreadcrumbList en /blog/index.html, auto-discovery <link>
├── build-interviews.js        # MOD — emite ItemList + BreadcrumbList en interviews/index.html
├── check-feeds.js             # NEW — valida feed.xml + feed.json (FR-015)
├── check-jsonld.js            # NEW — extrae y valida cada <script type="application/ld+json">
└── check-seo-meta.js          # NEW — valida meta tags requeridos en HTMLs servidos

tests/
├── feed-validate.sh           # NEW — bash wrapper de check-feeds.js
├── jsonld-validate.sh         # NEW — bash wrapper de check-jsonld.js
├── seo-meta.sh                # NEW — bash wrapper de check-seo-meta.js
└── no-placeholders.sh         # MOD — añadir blog/feed.xml + blog/feed.json a candidates

talks/
└── index.html                 # MOD — añadir <script type="application/ld+json"> con ItemList + BreadcrumbList

index.html                     # MOD — re-emitir Person con @id canónico (https://ardops.dev/#person)

sitemap.xml                    # MOD — añadir <url> para /blog/feed.xml y /blog/feed.json

package.json                   # MOD — scripts: check:feeds, check:jsonld, check:seo,
                               #       check:distribution (umbrella), html-validate extendido si aplica

.github/
├── workflows/
│   └── ci.yml                 # MOD — 3 jobs nuevos: feed-validate, jsonld-validate, seo-meta
└── copilot-instructions.md    # MOD — marker SPECKIT → 011

.gitignore                     # MOD (eventual) — si los feeds no deben commitearse,
                               #                  añadir blog/feed.xml y blog/feed.json
```

**Structure Decision**: estructura existente del sitio. Patrón espejo a
spec 009: módulos puros en `scripts/lib/`, gates en `tests/*.sh` con
backing en `scripts/check-*.js`, jobs en CI siguiendo el mismo template.
Cero estructura nueva.

## Complexity Tracking

> Sin violaciones constitucionales.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

---

## Phase 0 — Research

Ver [research.md](./research.md). Resumen de decisiones:

- **D-001**: RSS 2.0 vs Atom 1.0 → **RSS 2.0** (out-of-scope explícito, 99% reader coverage).
- **D-002**: Formato secundario → **JSON Feed 1.1** (mismo dataset, gratis).
- **D-003**: Library vs templating manual → **manual** (cero deps, escape XML/JSON probado).
- **D-004**: `lastBuildDate` → derivado del `date` más reciente de posts publicados (no `Date.now()`) → builds reproducibles.
- **D-005**: JSON-LD CSP risk → cero. MIME `application/ld+json` no es ejecutable bajo `script-src 'self'`.
- **D-006**: Forma del `Person` → reusar el ya emitido en `index.html`, añadir `@id` canónico (`https://ardops.dev/#person`) y eliminar campos innecesarios para fluir como referencia desde Article/Blog.
- **D-007**: `Article.image` fallback → `https://ardops.dev/public/og/og-default.png`.
- **D-008**: `dateModified` ausente → `= datePublished` (FR-009).
- **D-009**: Política `404.html` para `seo-meta.sh` → canonical opcional (allowlist documentada); resto requerido.
- **D-010**: Política `/uses/` para JSON-LD → ya emite `WebPage`+`Person` (spec 010); no se duplica `Article` ni `Blog`. La gate `jsonld-validate.sh` solo valida parseo + `@id` consistency.
- **D-011**: ¿Feeds commitados o gitignored? → siguiendo el patrón de `blog/*.html` (commitados), commitear `feed.xml`/`feed.json` también. Documentar.
- **D-012**: Estructura del bash wrapper → idéntica al patrón de spec 009 (`set -euo pipefail`, exec node script, exit 0/1).

## Phase 1 — Design & Contracts

Ver:

- [data-model.md](./data-model.md) — entidades `Feed`, `FeedItem`, `JsonLdBlock`, `SeoMetaSet`.
- [contracts/rss-2.0-contract.md](./contracts/rss-2.0-contract.md) — XML exacto.
- [contracts/jsonfeed-1.1-contract.md](./contracts/jsonfeed-1.1-contract.md) — JSON exacto.
- [contracts/jsonld-schemas.md](./contracts/jsonld-schemas.md) — formas Person/Article/Blog/ItemList/BreadcrumbList.
- [contracts/feeds-module.md](./contracts/feeds-module.md) — API `scripts/lib/feeds.js`.
- [contracts/jsonld-module.md](./contracts/jsonld-module.md) — API `scripts/lib/jsonld.js`.
- [contracts/feed-validate-gate.md](./contracts/feed-validate-gate.md) — gate FR-015.
- [contracts/jsonld-validate-gate.md](./contracts/jsonld-validate-gate.md) — gate FR-016.
- [contracts/seo-meta-gate.md](./contracts/seo-meta-gate.md) — gate FR-014.
- [quickstart.md](./quickstart.md) — pasos de validación local + manual.

### Agent context update

El marker `<!-- SPECKIT START --> ... <!-- SPECKIT END -->` en
`.github/copilot-instructions.md` se actualiza para apuntar a este plan
como parte de la implementación (tarea explícita en `tasks.md`).

---

## Re-evaluación Constitution Check (post-design)

Después de Phase 1, ningún artefacto introduce nuevas dependencias, scripts
ejecutables externos, ni patrones inseguros. JSON-LD viaja por MIME
no-ejecutable. Feeds son plain text/XML/JSON. Gates reusan `jsdom`
existente. Diff a CSP: cero. **Resultado**: 11/11 PASS sin cambios.

---

## Reportar

- **Branch**: `011-rss-jsonld-seo`
- **Plan**: [specs/011-rss-jsonld-seo/plan.md](specs/011-rss-jsonld-seo/plan.md)
- **Artefactos generados**:
  - [specs/011-rss-jsonld-seo/research.md](specs/011-rss-jsonld-seo/research.md)
  - [specs/011-rss-jsonld-seo/data-model.md](specs/011-rss-jsonld-seo/data-model.md)
  - [specs/011-rss-jsonld-seo/quickstart.md](specs/011-rss-jsonld-seo/quickstart.md)
  - [specs/011-rss-jsonld-seo/contracts/rss-2.0-contract.md](specs/011-rss-jsonld-seo/contracts/rss-2.0-contract.md)
  - [specs/011-rss-jsonld-seo/contracts/jsonfeed-1.1-contract.md](specs/011-rss-jsonld-seo/contracts/jsonfeed-1.1-contract.md)
  - [specs/011-rss-jsonld-seo/contracts/jsonld-schemas.md](specs/011-rss-jsonld-seo/contracts/jsonld-schemas.md)
  - [specs/011-rss-jsonld-seo/contracts/feeds-module.md](specs/011-rss-jsonld-seo/contracts/feeds-module.md)
  - [specs/011-rss-jsonld-seo/contracts/jsonld-module.md](specs/011-rss-jsonld-seo/contracts/jsonld-module.md)
  - [specs/011-rss-jsonld-seo/contracts/feed-validate-gate.md](specs/011-rss-jsonld-seo/contracts/feed-validate-gate.md)
  - [specs/011-rss-jsonld-seo/contracts/jsonld-validate-gate.md](specs/011-rss-jsonld-seo/contracts/jsonld-validate-gate.md)
  - [specs/011-rss-jsonld-seo/contracts/seo-meta-gate.md](specs/011-rss-jsonld-seo/contracts/seo-meta-gate.md)
- **Próximo paso**: `/speckit.tasks`.
