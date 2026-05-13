---

description: "Task list for spec 013 — /now/ page"
---

# Tasks: `/now/` page — qué estoy haciendo este mes

**Input**: Design documents from `/specs/013-now-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: NO se solicitó TDD. Los gates existentes + nuevo
`tests/now-freshness.sh` actúan como suite de validación.

**Organization**: agrupadas por user story (US1 visitante P1 MVP,
US2 recurrente P1, US3 freshness gate P2) más fases Setup,
Foundational y Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (distinto archivo, sin dependencia).
- **[Story]**: US1 / US2 / US3 (solo en fases de historia).

---

## Phase 1 — Setup

**Purpose**: scaffolding del feature en el árbol del repo.

- [X] T001 Crear carpeta `now/` en repo root (`mkdir -p now`)
- [X] T002 [P] Verificar que `scripts/lib/layout.js`, `scripts/build-layout.js` y `scripts/lib/jsonld.js` siguen presentes (precondición spec 008+011)

---

## Phase 2 — Foundational (Blocking Prerequisites)

**Purpose**: cambios al layout compartido y a los scripts de gate que
TODAS las user stories necesitan antes de poder validar la página.

**⚠️ CRITICAL**: ninguna user story puede comenzar sin estas tareas.

- [X] T003 Agregar entrada `{ file: 'now/index.html', currentPath: '/now/' }` (o sin `currentPath` si va solo en footer) al array `PAGES` en `scripts/build-layout.js`
- [X] T004 Agregar link `/now/` a la sección de footer en `scripts/lib/layout.js` (sin tocar el `NAV` principal — R-4/R-8)
- [X] T005 [P] Agregar `'now/index.html'` a `STATIC_PAGES` en `scripts/check-csp.js`
- [X] T006 [P] Agregar `'now/index.html'` a `STATIC_PAGES` en `scripts/check-external-links.js`
- [X] T007 [P] Agregar `'now/index.html'` a `STATIC_PAGES` en `scripts/check-seo-meta.js`
- [X] T008 [P] Agregar `'now/index.html'` a `STATIC_PAGES` en `scripts/check-jsonld.js`
- [X] T009 [P] Agregar entrada para `now/index.html` a `STATIC_PAGES` en `scripts/check-nav-consistency.js` (modo footer-only o currentPath='/now/' según diseño)
- [X] T010 [P] Agregar `now/index.html` al script `html-validate` en `package.json`
- [X] T011 [P] Agregar `now/index.html` al array `candidates` de `tests/no-placeholders.sh`

**Checkpoint**: layout compartido listo, gates configurados para
reconocer la nueva ruta. User stories pueden comenzar.

---

## Phase 3 — User Story 1: Visitante curioso descubre actividad (Priority: P1) 🎯 MVP

**Goal**: una persona llega a `/now/`, ve la fecha de última
actualización y al menos 3 secciones con bullets concretos en
menos de 30 segundos.

**Independent Test**: cargar `http://localhost:8080/now/` localmente,
verificar visualmente: banner con fecha real, 3+ secciones con
listas (Trabajo, Aprendiendo, Leyendo), credit a nownownow al pie.
Ejecutar `npm run html-validate`, `bash tests/csp-no-unsafe-inline.sh`,
`bash tests/no-placeholders.sh`, `bash tests/external-links.sh` —
todos PASS.

### Implementation for US1

- [X] T012 [US1] Crear `now/index.html` con esqueleto base: `<!DOCTYPE html>`, `<html lang="es">`, `<head>` con markers `<!-- head-meta:start --> ... :end -->`, links a `assets/css/{tokens,base,layout,components}.css`, `<body>` con markers `<!-- nav:start --> :end -->` y `<!-- footer:start --> :end -->`, `<main id="main" tabindex="-1">` vacío. Seguir [contracts/now-html-contract.md](./contracts/now-html-contract.md).
- [X] T013 [US1] Dentro de `<main>`, agregar `<section class="hero hero--compact">` con: banner `<p class="now-banner muted">Última actualización: <time datetime="2026-05-13">13 de mayo de 2026</time></p>`, `<h1>Now — qué estoy haciendo este mes</h1>` y `<p class="lead">` intro corta (1 oración).
- [X] T014 [US1] Agregar sección Trabajo: `<section class="section" data-now-section="trabajo"><h2>Trabajo</h2><ul class="list-clean">…</ul></section>` con 1-5 bullets reales (sin placeholders).
- [X] T015 [US1] Agregar sección Aprendiendo (misma estructura, `data-now-section="aprendiendo"`).
- [X] T016 [US1] Agregar sección Leyendo (misma estructura, `data-now-section="leyendo"`).
- [X] T017 [P] [US1] Agregar sección Hablando (opcional — incluir solo si hay contenido real, `data-now-section="hablando"`).
- [X] T018 [P] [US1] Agregar sección Vida (opcional — incluir solo si hay contenido real, `data-now-section="vida"`).
- [X] T019 [US1] Agregar bloque credit: `<section class="section now-credit"><p>Inspirado por el movimiento <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer">nownownow.com</a> de Derek Sivers.</p></section>`.
- [X] T020 [US1] Ejecutar `node scripts/build-layout.js` para inyectar `<head>` meta, `<nav>` y `<footer>` reales en `now/index.html`. Verificar que los markers están presentes y se completan.
- [X] T021 [US1] Correr `npm run html-validate`, `bash tests/csp-no-unsafe-inline.sh`, `bash tests/external-links.sh`, `bash tests/no-placeholders.sh`. Todos deben PASS.

**Checkpoint**: US1 funcional. La página renderiza correctamente con
banner + 3+ secciones + credit. Cumple HTML/CSP/no-placeholders/external-links.

---

## Phase 4 — User Story 2: Recurrente verifica que el sitio sigue vivo (Priority: P1)

**Goal**: visitante recurrente confirma frescura en 5 segundos vía
banner visible above the fold (mobile y desktop), respaldado por
JSON-LD `dateModified` y entrada en sitemap. Link desde footer
global + link sutil desde home.

**Independent Test**: abrir `/now/` en mobile (360px) — la fecha
debe ser visible sin scroll. Abrir cualquier otra página del sitio,
ir al footer, confirmar link "Now". Abrir home `/`, encontrar el
link sutil hacia `/now/`. Ejecutar `bash tests/sitemap-drift.sh`,
`bash tests/seo-meta.sh`, `bash tests/jsonld-validate.sh`,
`bash tests/nav-consistency.sh` — todos PASS.

### Implementation for US2

- [X] T022 [US2] Agregar bloque `<script type="application/ld+json">` en `<head>` de `now/index.html` con `WebPage` siguiendo [contracts/jsonld-webpage.md](./contracts/jsonld-webpage.md). `dateModified` MUST coincidir con el `datetime` del banner.
- [X] T023 [US2] Agregar entrada `<url>` para `/now/` en `sitemap.xml` con `<lastmod>2026-05-13</lastmod>`, `<changefreq>monthly</changefreq>`, `<priority>0.6</priority>`. Ubicar después de `/speaking/` o por orden alfabético si aplica.
- [X] T024 [US2] Editar `index.html` (home) para agregar un link sutil hacia `/now/` cerca del cierre del bloque bio (o en el outro, antes del footer). Texto sugerido: "¿En qué ando ahora? Mirá <a href=\"/now/\">/now/</a>." Sin CSS prominente.
- [X] T025 [US2] Regenerar layout para asegurar que el footer global ahora incluye el link `/now/` en todas las páginas: `node scripts/build-layout.js && node scripts/build-blog.js && node scripts/build-interviews.js --include-fixtures --out interviews/`.
- [X] T026 [US2] Correr `bash tests/sitemap-drift.sh`, `bash tests/seo-meta.sh`, `bash tests/jsonld-validate.sh`, `bash tests/nav-consistency.sh`. Todos PASS.
- [X] T027 [P] [US2] Verificar manualmente que el banner queda above the fold en mobile 360px (DevTools responsive) y desktop 1280px.

**Checkpoint**: US2 funcional. La página es discoverable desde footer
global y desde home, validada por JSON-LD + sitemap + nav-consistency.

---

## Phase 5 — User Story 3: Mantenedor evita olvidar actualizar (Priority: P2)

**Goal**: gate de freshness (90 días umbral) corre en CI y local;
falla con mensaje claro cuando la página está stale, en formato
inválido o con fecha futura.

**Independent Test**: ejecutar `bash tests/now-freshness.sh` con
fecha actual → exit 0. Ejecutar con `NOW_FRESHNESS_MAX_DAYS=0` →
exit 5 (stale). Ejecutar con fixture de fecha futura
(`/tmp/now-future.html`) → exit 4. Ejecutar con archivo sin `<time>`
→ exit 2. CI debe correr el gate y reportar verde.

### Implementation for US3

- [X] T028 [US3] Crear `tests/now-freshness.sh` siguiendo el pseudocódigo de [contracts/now-freshness-gate.md](./contracts/now-freshness-gate.md). Incluir: detección OS (GNU vs BSD `date`), env vars `NOW_PAGE` y `NOW_FRESHNESS_MAX_DAYS`, todos los exit codes (0/2/3/4/5).
- [X] T029 [US3] `chmod +x tests/now-freshness.sh`.
- [X] T030 [P] [US3] Agregar `"check:now-freshness": "bash tests/now-freshness.sh"` a `scripts` en `package.json`. Encadenar dentro de `"check:distribution"` (después de `check:headshot`).
- [X] T031 [P] [US3] Agregar URL `'http://localhost:8080/now/'` al array `URLS` de `tests/a11y.js`.
- [X] T032 [P] [US3] Agregar URL `/now/` a `tests/pa11y.config.js`.
- [X] T033 [P] [US3] Agregar URL `http://localhost/now/index.html` a `tests/lighthouserc.json` y `tests/lighthouserc.mobile.json`.
- [X] T034 [US3] Agregar job `now-freshness` a `.github/workflows/ci.yml` siguiendo el patrón de `headshot-size` (checkout + `bash tests/now-freshness.sh`, sin `npm ci`).
- [X] T035 [US3] Verificar los 4 escenarios del gate localmente: caso feliz, stale forzado con `NOW_FRESHNESS_MAX_DAYS=0`, archivo vacío con `NOW_PAGE=/tmp/now-empty.html`, fecha futura con `NOW_PAGE=/tmp/now-future.html` (ver [quickstart.md](./quickstart.md)).

**Checkpoint**: US3 funcional. El gate corre verde y falla con
mensajes claros y exit codes correctos en los 4 escenarios.

---

## Phase 6 — Polish & Cross-Cutting

**Purpose**: validar la suite completa, ajustar estilos si hace falta,
documentar cierre.

- [X] T036 (opcional) Si el banner o las secciones no se ven bien con clases existentes, agregar bloque `/* Now page (spec 013) */` a `assets/css/components.css` con clases scoped `.now-banner`, `.now-credit`, etc. Cero variables nuevas en `tokens.css`.
- [X] T037 Correr la suite completa local: `npm run build && npm run html-validate && bash tests/csp-no-unsafe-inline.sh && bash tests/external-links.sh && bash tests/no-placeholders.sh && bash tests/nav-consistency.sh && bash tests/sitemap-drift.sh && bash tests/seo-meta.sh && bash tests/jsonld-validate.sh && bash tests/now-freshness.sh`. Todos PASS.
- [X] T038 Correr `node tests/a11y.js` con servidor local en puerto 8080 levantado. 0 violaciones WCAG 2.1 AA en todas las URLs (incluyendo `/now/`).
- [X] T039 (manual) Correr Lighthouse mobile contra `/now/` en local. Targets: Perf ≥ 95, A11y = 100, Best-Practices ≥ 95, SEO = 100.
- [X] T040 Editar `backlog/06-now-page.md` cambiando la línea de estado a `> **Estado**: ✅ completado en spec [013-now-page](../specs/013-now-page/) · **Prioridad original**: P2` (patrón ya aplicado en backlogs 04 y 05).
- [X] T041 Marcar todas las tareas de este archivo como `[X]`: `sed -i '' 's/^- \[ \] T0/- [X] T0/g' specs/013-now-page/tasks.md` (verificar conteo: `grep -c '^- \[X\] T' specs/013-now-page/tasks.md` debe dar 41).
- [X] T042 (manual / post-deploy) Smoke test en `https://ardops.dev/now/`: cargar la página, verificar visualmente fecha + secciones + credit + link desde footer + link sutil desde home. Reportar.

---

## Dependencies / Story completion order

```
Setup (T001-T002)
   ↓
Foundational (T003-T011)   ← layout + scripts cableados; sin esto no se validan los siguientes pasos
   ↓
┌─────────────────────────┬─────────────────────────┐
│ US1 (T012-T021)         │ US3 (T028-T035)         │   ← US1 y US3 independientes entre sí
│ Visitante MVP           │ Freshness gate          │
└─────────────────────────┴─────────────────────────┘
   ↓
US2 (T022-T027)              ← depende de que la página HTML exista (US1) y del layout actualizado (Foundational)
   ↓
Polish (T036-T042)
```

- US1 entrega el MVP visible — se puede demoar solo con T001..T021.
- US3 puede desarrollarse en paralelo con US1 después de Foundational
  (es un script bash independiente del HTML).
- US2 cierra el loop de discovery + JSON-LD/sitemap.

## Parallel execution opportunities

- Dentro de **Foundational**: T005, T006, T007, T008, T009, T010,
  T011 son `[P]` (archivos distintos, sin colisión).
- Dentro de **US1**: T017 y T018 (secciones opcionales) pueden
  hacerse en paralelo con T014..T016 si se trabajan en regiones
  distintas del HTML; marcadas `[P]`.
- Dentro de **US3**: T030, T031, T032, T033 son `[P]` (archivos
  distintos).

## Implementation strategy (MVP first)

1. **MVP**: completar Setup + Foundational + US1 → ya hay
   página renderizable y discoverable manualmente (escribiendo
   la URL `/now/`).
2. **Incremento 1**: US3 → garantía mecánica de frescura.
3. **Incremento 2**: US2 → discovery vía footer global, JSON-LD,
   sitemap, link sutil desde home.
4. **Cierre**: Polish.

## Format validation

- [X] Todas las tareas usan `- [ ] TNNN [P?] [Story?] Descripción`.
- [X] Setup/Foundational/Polish NO llevan etiqueta `[US…]`.
- [X] US1/US2/US3 SÍ llevan etiqueta correspondiente.
- [X] Cada tarea con cambio en código menciona el archivo objetivo.
- [X] IDs T001..T042 sin huecos.

**Total**: 42 tareas (1 opcional T036).
