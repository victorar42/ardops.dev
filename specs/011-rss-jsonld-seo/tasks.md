# Tasks: RSS, JSON-LD y SEO distribution

**Input**: Design documents from `/specs/011-rss-jsonld-seo/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Las "gates" (`feed-validate.sh`, `jsonld-validate.sh`, `seo-meta.sh`)
son **parte del deliverable**, no tests opcionales — son gates bloqueantes
de CI por FR-014/FR-015/FR-016/FR-017. No se generan unit tests adicionales
(consistente con specs 008/009/010 — los módulos puros se validan vía gates
end-to-end).

**Organization**: Tareas agrupadas por user story para entrega incremental.
US1 + US2 son P1 (MVP). US3 es P2 (cierra el ciclo de calidad SEO).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivos diferentes, sin dependencias).
- **[Story]**: US1, US2, US3.
- Rutas absolutas desde el repo root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: cero setup nuevo — el repo ya tiene Node 20 + `jsdom` + el
patrón de gates. La única tarea de setup es asegurar workspace limpio.

- [X] T001 Confirmar branch `011-rss-jsonld-seo` checkout y árbol limpio (`git status`); confirmar que `npm install` corre sin warnings nuevos en `package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: cero — los módulos `lib/feeds.js` y `lib/jsonld.js` son
específicos de US1 y US2 respectivamente; no hay infraestructura compartida
nueva entre ambas. Cada story trae su propio módulo. Esta fase está
intencionalmente vacía (consistente con specs 009/010 que también la
omitieron cuando no había bloqueador real).

> **Checkpoint**: foundation ya provista por specs anteriores
> (`scripts/lib/layout.js`, `scripts/lib/head.js`, `jsdom`, patrón de
> gates). US1 y US2 pueden iniciar en paralelo.

---

## Phase 3: User Story 1 — Lector técnico se suscribe al blog por RSS (Priority: P1) 🎯 MVP

**Goal**: `/blog/feed.xml` (RSS 2.0) y `/blog/feed.json` (JSON Feed 1.1)
generados en build-time, con auto-discovery en `<head>` de blog index y
posts, con gate de validación bloqueante en CI.

**Independent Test**: `bash tests/feed-validate.sh` sale 0; `xmllint
--noout blog/feed.xml` sale 0; `python3 -m json.tool < blog/feed.json` sale
0; pegar el feed en Feedly carga sin errores; ver el `<head>` de
`/blog/index.html` revela los dos `<link rel="alternate">`.

### Implementation for User Story 1

- [X] T002 [US1] Crear módulo `scripts/lib/feeds.js` exportando `renderRss`, `renderJsonFeed`, `toRfc822`, `escapeXml` según [contracts/feeds-module.md](./contracts/feeds-module.md). Pure CommonJS, cero I/O, cero deps externas, cero `Date.now()`.
- [X] T003 [US1] Extender `scripts/build-blog.js`: importar `lib/feeds.js`, derivar `lastBuildDate` = `max(post.date)` de publicados (sentinel `'2026-01-01'` si vacío), construir `channelMeta` + `feedItems[]`, escribir `blog/feed.xml` y `blog/feed.json` en `writeAll(...)` siguiendo formas exactas de [contracts/rss-2.0-contract.md](./contracts/rss-2.0-contract.md) y [contracts/jsonfeed-1.1-contract.md](./contracts/jsonfeed-1.1-contract.md).
- [X] T004 [US1] En `scripts/build-blog.js` `renderBlogIndex(...)` (línea ~822) y `renderPostPage(...)` (línea ~953, `<head>` ~961): inyectar en el `<head>` exactamente los dos `<link rel="alternate" type="application/rss+xml" title="ardops.dev — Blog" href="/blog/feed.xml">` y `<link rel="alternate" type="application/feed+json" title="ardops.dev — Blog" href="/blog/feed.json">`, posicionados después de OG tags y antes de los `<link rel="stylesheet">` (D-012).
- [X] T005 [US1] Actualizar `sitemap.xml` añadiendo `<url>` para `https://ardops.dev/blog/feed.xml` y `https://ardops.dev/blog/feed.json` con `<lastmod>` = fecha del `lastBuildDate` (en formato `YYYY-MM-DD`). Verificar que `bash tests/sitemap-drift.sh` sigue verde (FR-006).
- [X] T006 [US1] Crear `scripts/check-feeds.js` (Node CommonJS, usa `jsdom` con MIME `text/xml`) implementando todas las validaciones V-1..V-14 de [contracts/feed-validate-gate.md](./contracts/feed-validate-gate.md). Output exacto: `✓ feed-validate gate: …` en éxito; líneas `feed-validate: <archivo>: <ID>: <descripción>` + exit 1 en falla.
- [X] T007 [US1] Crear `tests/feed-validate.sh` con `set -euo pipefail`, `cd "$(dirname "$0")/.."`, `exec node scripts/check-feeds.js`. `chmod +x`.
- [X] T008 [P] [US1] Extender `tests/no-placeholders.sh` candidates con `blog/feed.xml` y `blog/feed.json` (FR-018 / consistencia).
- [X] T009 [P] [US1] Añadir `.gitignore` entries para `blog/feed.xml` y `blog/feed.json` SI el patrón actual del repo gitignora `blog/*.html` generados; sino, commitear los feeds (D-010 — verificar consistencia primero).
- [X] T010 [P] [US1] Añadir scripts en `package.json`: `"check:feeds": "bash tests/feed-validate.sh"`. Sin nuevas deps (FR-018 / SC-009).

**Checkpoint US1**: `npm run build && bash tests/feed-validate.sh && bash
tests/sitemap-drift.sh && bash tests/no-placeholders.sh` → todos verdes.
Auto-discovery visible en blog index + posts. Story entregable como MVP
independiente.

---

## Phase 4: User Story 2 — Buscadores entienden la autoría y los artículos (Priority: P1)

**Goal**: JSON-LD estructurado en home (`Person` con `@id` canónico),
posts (`Article` + `BreadcrumbList`), blog index (`Blog` +
`BreadcrumbList`), talks/interviews (`ItemList` + `BreadcrumbList`), con
gate de validación bloqueante.

**Independent Test**: `bash tests/jsonld-validate.sh` sale 0; pegar el HTML
de home + un post + blog index en https://validator.schema.org reporta
cero errores; Lighthouse SEO ≥ 95 en `/blog/` y posts.

### Implementation for User Story 2

- [X] T011 [US2] Crear módulo `scripts/lib/jsonld.js` exportando `PERSON_ID`, `CANONICAL_ORIGIN`, `personSchema`, `articleSchema`, `blogSchema`, `itemListSchema`, `breadcrumbsSchema`, `serialize` según [contracts/jsonld-module.md](./contracts/jsonld-module.md). Pure CommonJS. La función `serialize` aplica el escape `</` → `<\/` para evitar romper `<script>` enclosing.
- [X] T012 [US2] Modificar `index.html` (líneas ~60-91): mantener el `Person` actual pero garantizar `@id: "https://ardops.dev/#person"` (FR-008). Forma exacta según [contracts/jsonld-schemas.md](./contracts/jsonld-schemas.md). Cero remoción de campos existentes.
- [X] T013 [US2] Extender `scripts/build-blog.js` `renderPostPage(...)`: invocar `serialize(articleSchema(post))` y `serialize(breadcrumbsSchema([Home, Blog, Post]))`, inyectar ambos `<script>`s en el `<head>` (cada uno separado, no array). Forma según [contracts/jsonld-schemas.md](./contracts/jsonld-schemas.md) — Article + BreadcrumbList con jerarquía D-014.
- [X] T014 [US2] Extender `scripts/build-blog.js` `renderBlogIndex(...)`: invocar `serialize(blogSchema(channelMeta, posts))` y `serialize(breadcrumbsSchema([Home, Blog]))`, inyectar ambos `<script>`s en el `<head>` de `blog/index.html`.
- [X] T015 [US2] Modificar `talks/index.html`: emitir `<script type="application/ld+json">` con `ItemList` (uno por talk listada actualmente, `position` 1-indexed, `url` con anchor `#talk-id`, `name` = título de la talk) + `BreadcrumbList` (Home → Charlas). Insertar en `<head>` después de OG tags. Items hardcoded (la página es curada).
- [X] T016 [US2] Extender `scripts/build-interviews.js`: importar `lib/jsonld.js`, en el render del `interviews/index.html` inyectar `<script>` con `ItemList` (uno por entrevista publicada, `url` absoluta a `interviews/<slug>.html`, `name` = título) + `BreadcrumbList` (Home → Entrevistas). Para `interviews/<slug>.html` (si los hubiera), añadir BreadcrumbList Home → Entrevistas → Slug (omitir si no aplica al patrón actual).
- [X] T017 [US2] Crear `scripts/check-jsonld.js`: descubrir páginas servidas (mismo patrón que `scripts/check-csp.js` — STATIC_PAGES + `blog/*.html` + `interviews/*.html`), extraer cada `<script type="application/ld+json">` con `jsdom`, validar V-1..V-7 según [contracts/jsonld-validate-gate.md](./contracts/jsonld-validate-gate.md). `@id` global conocido = `https://ardops.dev/#person`.
- [X] T018 [US2] Crear `tests/jsonld-validate.sh` con header estándar (D-011) y `exec node scripts/check-jsonld.js`. `chmod +x`.
- [X] T019 [P] [US2] Añadir script en `package.json`: `"check:jsonld": "bash tests/jsonld-validate.sh"`.

**Checkpoint US2**: `npm run build && node scripts/build-blog.js && node
scripts/build-interviews.js --strict --out interviews/ && node
scripts/build-layout.js && bash tests/jsonld-validate.sh` → verde. Smoke
manual en validator.schema.org pasa para home + 1 post + blog index +
talks + interviews.

---

## Phase 5: User Story 3 — Cobertura SEO uniforme verificada por gate (Priority: P2)

**Goal**: gate `tests/seo-meta.sh` que valida los 9 meta tags requeridos
(canonical, description, OG×5, twitter:card, theme-color) en cada HTML
servido, con allowlist documentada para `404.html` (skipCanonical).

**Independent Test**: `bash tests/seo-meta.sh` sale 0 con todas las
páginas; borrar deliberadamente un `<meta name="description">` en
`talks/index.html` produce falla con mensaje claro; restaurar produce
verde.

### Implementation for User Story 3

- [X] T020 [US3] Crear `scripts/check-seo-meta.js`: descubrir páginas servidas (mismo patrón que `csp-no-unsafe-inline.sh`), validar V-1..V-4 de [contracts/seo-meta-gate.md](./contracts/seo-meta-gate.md). Constante `PER_PAGE_RULES = { '404.html': { skipCanonical: true } }` con comentario justificando (D-008). Output exacto: `✓ seo-meta gate: N page(s) validated, all meta tags present.` en éxito; líneas `seo-meta: <archivo>: falta <selector>` + exit 1 en falla.
- [X] T021 [US3] Crear `tests/seo-meta.sh` con header estándar y `exec node scripts/check-seo-meta.js`. `chmod +x`.
- [X] T022 [US3] Auditar cada HTML servido (`index.html`, `404.html`, `blog/index.html`, `blog/<slug>.html`, `talks/index.html`, `uses/index.html`, `interviews/index.html` y `<slug>.html` si existen): añadir cualquier meta tag faltante según FR-013. `404.html` puede omitir `canonical`. Verificar consistencia OG: `og:url` === `canonical`; `og:image` URL absoluta.
- [X] T023 [P] [US3] Añadir script en `package.json`: `"check:seo": "bash tests/seo-meta.sh"`.

**Checkpoint US3**: `bash tests/seo-meta.sh` → verde. Validar regresión
borrando un meta y confirmando exit 1 con mensaje correcto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: integración CI, scripts umbrella, documentación.

- [X] T024 Actualizar `.github/workflows/ci.yml` añadiendo 3 jobs nuevos: `feed-validate`, `jsonld-validate`, `seo-meta`. Cada job replica el patrón de los jobs existentes (spec 009): checkout + setup-node@v4 (Node 20) + `npm ci || npm install` + rebuild de artefactos necesarios + `bash tests/<gate>.sh`. Ver bloques exactos en [contracts/feed-validate-gate.md](./contracts/feed-validate-gate.md), [contracts/jsonld-validate-gate.md](./contracts/jsonld-validate-gate.md), [contracts/seo-meta-gate.md](./contracts/seo-meta-gate.md).
- [X] T025 [P] Añadir script umbrella en `package.json`: `"check:distribution": "npm run check:feeds && npm run check:jsonld && npm run check:seo"`.
- [X] T026 [P] Extender `package.json` `html-validate` config si es necesario para incluir nuevos archivos generados (`blog/feed.xml`, `blog/feed.json` NO se validan con html-validate — son XML/JSON; verificar que el matcher actual no los toca).
- [X] T027 Correr el one-liner completo de gates de [quickstart.md](./quickstart.md) y confirmar TODAS verdes (csp + external-links + sitemap-drift + nav-consistency + no-placeholders + html-validate + blog-schema + interviews-xss + a11y + feed-validate + jsonld-validate + seo-meta).
- [X] T028 Smoke manual: pegar `feed.xml` en https://validator.w3.org/feed/, `feed.json` en https://validator.jsonfeed.org/, JSON-LD de home + 1 post en https://validator.schema.org/. Documentar resultados (cero errores) — captura/log opcional.
- [X] T029 Smoke manual Lighthouse: `npx lighthouse <url-blog>` y `npx lighthouse <url-post>` con `--only-categories=seo --form-factor=mobile`. Confirmar SEO ≥ 95 (SC-006).
- [X] T030 Marcar `backlog/04-rss-jsonld-seo.md` como completado (mover a `backlog/done/` si esa convención aplica, o anotar status).

---

## Dependencias entre stories

```text
T001 (setup) → US1 ⇄ US2 (independientes en paralelo) → US3 (independiente, no depende de US1/US2 a nivel de código pero T022 audita páginas que US1 puede haber tocado)
                ↓        ↓        ↓
                └────────┴────────┴──→ T024..T030 (polish)
```

- **US1 ⇄ US2 paralelizables**: distintos archivos de salida (`blog/feed.*` vs `<script type="application/ld+json">`), distintos módulos (`lib/feeds.js` vs `lib/jsonld.js`). Pueden mergearse en orden.
- **US3 después de US1+US2**: T022 audita páginas. Si US1/US2 se mergearon antes, T022 valida que sus cambios mantienen los meta tags. Si US3 va primero, igual funciona — `seo-meta.sh` solo requiere los meta tags ya existentes.
- **Polish bloqueado por las 3 stories**: T024 (CI) y T027 (one-liner verde) requieren las 3 gates implementadas.

## Parallel execution opportunities

### Dentro de US1
- T008 (no-placeholders), T009 (.gitignore), T010 (package.json script): archivos diferentes, paralelizables.

### Dentro de US2
- T012 (`index.html`), T015 (`talks/index.html`), T019 (`package.json`): archivos diferentes, paralelizables.
- T011 (módulo) bloquea T013, T014, T015, T016 que lo importan.

### Dentro de Polish
- T025, T026: archivos / sub-tareas independientes, paralelizables.

## Implementation strategy — MVP-first

**MVP scope (entregable mínimo valioso)**: solo **US1** (T001..T010) + un
subset de Polish (T024 con un único job `feed-validate`, T027 con el
subset disponible). Esto entrega el bloque "lectores RSS pueden
suscribirse" sin esperar JSON-LD ni gate SEO.

**Iteración 2 (recomendada para mismo PR)**: añadir US2 (T011..T019) +
job CI `jsonld-validate`. Cierra el bloque de visibilidad para
buscadores.

**Iteración 3 (puede ir en PR separado)**: US3 (T020..T023) + job CI
`seo-meta` + T028..T030. Cierra el ciclo de calidad SEO con gate.

## Format validation

Todas las tareas T001..T030 siguen el formato:
`- [ ] T### [P?] [Story?] Descripción con ruta de archivo`.

- ✅ Setup tasks (T001): sin `[Story]`.
- ✅ User story tasks (T002..T023): con `[US1]`, `[US2]`, `[US3]`.
- ✅ Polish tasks (T024..T030): sin `[Story]`.
- ✅ Tareas paralelizables marcadas con `[P]`.
- ✅ Cada tarea cita rutas de archivo concretas.

## Total

- **30 tareas** distribuidas en 6 fases.
- **US1**: 9 tareas (T002..T010).
- **US2**: 9 tareas (T011..T019).
- **US3**: 4 tareas (T020..T023).
- **Setup + Foundational + Polish**: 8 tareas (T001 + T024..T030).
- **Tareas paralelizables**: 7 explícitamente marcadas `[P]`.
- **Tests/gates**: 3 nuevas (`feed-validate`, `jsonld-validate`, `seo-meta`) — todas son deliverables FR, no tests opcionales.
