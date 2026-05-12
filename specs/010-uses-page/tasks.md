# Tasks: `/uses/` page — stack & herramientas

**Input**: Design documents from `/specs/010-uses-page/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓
**Branch**: `010-uses-page`
**Tests**: NO test tasks generadas — la spec no pide TDD; la cobertura viene de las gates existentes (html-validate, a11y, csp, nav-consistency, sitemap-drift, external-links, no-placeholders) que se ejercitan en Phase 6.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias).
- **[Story]**: A qué user story pertenece (US1, US2, US3).
- Cada tarea incluye **path absoluto del workspace** o ruta relativa al repo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Crear el directorio destino. No hay deps nuevas, no hay tooling nuevo.

- [X] T001 Crear directorio `uses/` en la raíz del repo (`mkdir -p uses`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cambios en módulos compartidos que TODAS las user stories asumen ya en su lugar. Sin esto, ni el HTML nuevo ni las gates funcionan.

⚠️ **CRITICAL**: ninguna tarea de US1/US2/US3 puede comenzar hasta que esta fase termine.

- [X] T002 [P] Extender `NAV` en `scripts/lib/layout.js` añadiendo entrada `{ href: '/uses/', label: 'Uses', match: ['/uses/'] }` entre Charlas y Contacto, según [contracts/shared-modules-update.md](./contracts/shared-modules-update.md) §D-1.
- [X] T003 [P] Extender `PAGES` en `scripts/build-layout.js` añadiendo `{ file: 'uses/index.html', currentPath: '/uses/' }`, según [contracts/shared-modules-update.md](./contracts/shared-modules-update.md) §D-2.
- [X] T004 [P] Extender `STATIC_PAGES` en `scripts/check-csp.js` añadiendo `'uses/index.html'`, según [contracts/shared-modules-update.md](./contracts/shared-modules-update.md) §D-3.
- [X] T005 [P] Extender `STATIC_PAGES` en `scripts/check-nav-consistency.js` añadiendo `{ file: 'uses/index.html', currentPath: '/uses/' }`, según [contracts/shared-modules-update.md](./contracts/shared-modules-update.md) §D-4.
- [X] T006 Rebuild de páginas dependientes para que el nuevo nav item "Uses" se materialice en blog, interviews y estáticas: `npm run build` (debe terminar sin errores; `tests/nav-consistency.sh` quedará en rojo hasta que `uses/index.html` exista — esperado).

**Checkpoint**: módulos compartidos preparados. La gate `tests/nav-consistency.sh` reportará drift en `uses/index.html` (el archivo aún no existe); todas las demás gates pueden ejecutarse y deberían pasar para las páginas existentes.

---

## Phase 3: User Story 1 — Visitante curioso descubre el stack (Priority: P1) 🎯 MVP

**Goal**: Un visitante puede abrir `/uses/`, ver secciones jerárquicas con `<h2>`, recorrer items `<dl>`/`<dt>`/`<dd>` y leer la justificación de cada herramienta. La página existe, es navegable por teclado/lector de pantalla, y se integra al shell del sitio.

**Independent Test**: abrir `http://localhost:8080/uses/` tras `npx http-server`, verificar header con "Uses" activo, recorrer secciones con tab, leer ≥5 items con su justificación.

### Implementation for User Story 1

- [X] T007 [US1] Crear `uses/index.html` con el `<head>` canónico (CSP idéntica a `talks/index.html`, marcadores `<!-- head-meta:start/end -->`, canonical, OG, Twitter card, favicon, preload de fonts, link a 6 CSS, `<script defer src="/assets/js/main.js">`), según [contracts/uses-page-html.md](./contracts/uses-page-html.md) §C-1. **Sin** JSON-LD todavía (eso es US2).
- [X] T008 [US1] En `uses/index.html`, añadir el `<body>` con marcadores `<!-- nav:start/end -->` y `<!-- footer:start/end -->` rellenados con el HTML que `renderHeader('/uses/')` y `renderFooter()` emiten (estado inicial; `build-layout.js` lo mantendrá sincronizado), según [contracts/uses-page-html.md](./contracts/uses-page-html.md) §C-2.
- [X] T009 [US1] En `uses/index.html`, añadir la sección hero: `<section class="section" aria-labelledby="uses-heading">` con `<p class="section-label">// uses</p>`, `<h1 id="uses-heading" class="section-title">Stack & herramientas</h1>` y `<p class="section-lead">…</p>`. Único `<h1>` de la página.
- [X] T010 [US1] En `uses/index.html`, añadir las **9 secciones obligatorias** en orden (`hardware`, `os-shell`, `editor`, `terminal-cli`, `lenguajes`, `devops`, `security`, `cloud`, `productividad`), cada una con `<section class="section" id="<slug>" aria-labelledby="<slug>-heading">` + `<h2 id="<slug>-heading" class="section-title">` + `<dl class="uses-list">` con ≥1 par `<dt>`/`<dd>`. Contenido editorial real del autor (ningún placeholder); `<dd>` explica *por qué*. Ver [data-model.md](./data-model.md) §Section.
- [X] T011 [US1] En `uses/index.html`, añadir las **2 secciones opcionales** SOLO si aplican (Hobbies, Abandoned). Si no aplican, omitirlas por completo (no dejar como "N/A").
- [X] T012 [US1] En `uses/index.html`, añadir la sección final con banner de actualización: `<p class="uses-updated">Última actualización: <time datetime="2026-05-12">mayo 2026</time></p>` + `<p class="back-cta"><a class="btn btn-ghost" href="/">← Volver al inicio</a></p>`, según [contracts/uses-page-html.md](./contracts/uses-page-html.md) §C-4 y `data-model.md` §UsesPage.lastUpdated.
- [X] T013 [US1] Correr `node scripts/build-layout.js` para que normalice los marcadores nav/footer/head-meta de `uses/index.html` y verificar con `node scripts/build-layout.js --check` (debe quedar en sync).
- [X] T014 [US1] Correr `npm run html-validate` (config existente sólo cubre páginas conocidas — confirmar que pasa) y agregar `uses/index.html` al script `html-validate` en `package.json` si fuese necesario para que la gate la cubra.
- [X] T015 [US1] Decidir y, si procede, añadir el componente CSS `.uses-list` al final de `assets/css/components.css` con banner `/* uses page — spec 010 */`, según [contracts/uses-list-css.md](./contracts/uses-list-css.md). Sólo variables CSS, cero `!important`. Si los selectores genéricos bastan, dejar nota en el commit y omitir.
- [X] T016 [US1] Verificación visual local: `npx http-server -p 8080 -c-1 .` + abrir `http://localhost:8080/uses/`, recorrer con teclado, confirmar que el item "Uses" del nav muestra `aria-current="page"` y que la jerarquía h1→h2 es coherente.

**Checkpoint US1**: la página existe, renderiza, está integrada al shell, y un visitante puede usarla. Las gates de a11y/SEO/sitemap aún no la cubren — eso es US2/US3 + Phase 6.

---

## Phase 4: User Story 2 — Buscador orgánico llega por long-tail (Priority: P2)

**Goal**: La página es indexable y descubrible. Tiene title, description, canonical, OG, Twitter card, JSON-LD WebPage+Person consistente, y entrada en `sitemap.xml`. Lighthouse SEO ≥ 95.

**Independent Test**: inspeccionar `<head>` y JSON-LD; ejecutar Lighthouse SEO contra `/uses/`; correr `bash tests/sitemap-drift.sh` (debe pasar).

### Implementation for User Story 2

- [X] T017 [US2] En `uses/index.html`, añadir el `<script type="application/ld+json">` con dos nodos (`WebPage` con `@id` y `author` referenciando `Person` por `@id`; `Person` con la **misma forma exacta** que el que ya emite `index.html` — copiarlo literal para evitar drift), según [contracts/uses-page-html.md](./contracts/uses-page-html.md) §C-1 y [data-model.md](./data-model.md) §Person.
- [X] T018 [US2] Confirmar/ajustar `<title>`, `<meta name="description">` (120-200 chars, long-tail DevSecOps), `<link rel="canonical" href="https://ardops.dev/uses/">`, OG tags y Twitter card en `uses/index.html` según [contracts/uses-page-html.md](./contracts/uses-page-html.md) §C-1 (FR-008, FR-009).
- [X] T019 [US2] Añadir entrada `<url><loc>https://ardops.dev/uses/</loc><lastmod>2026-05-12</lastmod><changefreq>yearly</changefreq><priority>0.6</priority></url>` a `sitemap.xml` antes de `</urlset>`, según [contracts/shared-modules-update.md](./contracts/shared-modules-update.md) §D-6.
- [X] T020 [US2] Validar JSON-LD pegándolo en https://validator.schema.org/ (smoke manual): cero errores; ambos nodos detectados.
- [X] T021 [US2] Correr `bash tests/sitemap-drift.sh`: debe pasar (forward + backward, sin warnings sobre `/uses/`).

**Checkpoint US2**: la página es completamente descubrible. Search engines y validators externos la consumen sin errores.

---

## Phase 5: User Story 3 — Mantenimiento liviano (Priority: P3)

**Goal**: La página se actualiza editorialmente en minutos: edit → gates locales → PR. Cobertura completa por las gates de CI.

**Independent Test**: modificar 1 `<dt>`/`<dd>` y la fecha del banner, correr el one-liner de gates de [quickstart.md](./quickstart.md), todo verde.

### Implementation for User Story 3

- [X] T022 [US3] Añadir `'http://localhost:8080/uses/'` al array `URLS` de `tests/a11y.js` (después de `/talks/`), según [contracts/shared-modules-update.md](./contracts/shared-modules-update.md) §D-7.
- [X] T023 [US3] Verificar que `bash tests/no-placeholders.sh` cubre `uses/index.html` (lista los served files dinámicamente o explícitamente). Si no la cubre, extender la lista hardcoded del script.
- [X] T024 [US3] Smoke a11y local: `npx http-server -p 8080 -c-1 .` en una terminal y `node tests/a11y.js` en otra. Esperado: `0 violations` en `/uses/`.
- [X] T025 [US3] Smoke Lighthouse mobile: `npx lighthouse http://localhost:8080/uses/ --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --quiet`. Esperado: Performance ≥ 95, Accessibility = 100, BP ≥ 95, SEO ≥ 95 (SC-002).
- [X] T026 [US3] Smoke editorial: cambiar 1 `<dt>` y la fecha del banner, correr el one-liner de gates de [quickstart.md](./quickstart.md), confirmar 100% verde, revertir el cambio (validamos workflow, no contenido).

**Checkpoint US3**: la página está lista para vida útil. Mantenimiento documentado y probado.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validación end-to-end, sincronizar metadata del proyecto, dejar el repo en estado mergeable.

- [X] T027 Correr el one-liner completo de gates de [quickstart.md](./quickstart.md): `npm run build && node scripts/build-blog.js --check && node scripts/build-layout.js --check && npm run html-validate && bash tests/no-placeholders.sh && bash tests/csp-no-unsafe-inline.sh && bash tests/external-links.sh && bash tests/sitemap-drift.sh && bash tests/nav-consistency.sh`. Todas verdes.
- [X] T028 Correr `grep -RIn 'rel="sponsored"\|affiliate\|amzn\.to' uses/`: cero resultados (SC-004).
- [X] T029 [P] Confirmar que el marker SPECKIT en `.github/copilot-instructions.md` apunta a `specs/010-uses-page/plan.md` (ya hecho en /plan; verificar).
- [X] T030 Code cleanup: `git diff` final. Confirmar cero `<style>` o `<script>` inline en `uses/index.html`, cero atributos `style="..."`, cero `<img>` en `<body>`, cero colores hardcodeados en cualquier CSS modificado.
- [X] T031 Preparar PR description con: spec ID (010), sección de constitución relevante (II/VI/VII/VIII/IX), checklist de gates aplicables (html-validate, a11y, csp, external-links, sitemap-drift, nav-consistency, no-placeholders), screenshot móvil de `/uses/`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sin dependencias.
- **Phase 2 (Foundational)**: depende de Phase 1. **Bloquea US1/US2/US3** parcialmente: T002-T005 pueden hacerse en paralelo; T006 cierra la fase.
- **Phase 3 (US1)**: depende de Phase 2. T007 antes que T008-T012; T013-T016 después del HTML base.
- **Phase 4 (US2)**: técnicamente puede empezar después de Phase 2, pero en práctica se hace tras US1 porque comparte el archivo `uses/index.html` (T007 ya creó la estructura del `<head>`; T017-T018 sólo añaden/ajustan tags).
- **Phase 5 (US3)**: depende de US1 (página existe) y US2 (canonical + sitemap presentes para que las gates pasen).
- **Phase 6 (Polish)**: depende de US1 + US2 + US3 completas.

### User Story Dependencies

- **US1 (P1)**: independiente del resto en términos de "valor entregable" (la página existe y se navega); requiere Phase 2.
- **US2 (P2)**: requiere US1 (necesita el HTML base donde inyectar JSON-LD y meta tags).
- **US3 (P3)**: requiere US1 + US2 (cobertura de gates completa).

### Within Each User Story

- T007 antes de T008-T012 (head antes que body).
- T010 antes de T011 (obligatorias antes que opcionales).
- T013 antes de T014 (build-layout sincroniza marcadores antes de validar HTML).
- T015 puede hacerse antes o después del contenido editorial (cosmético).
- T017 después de T010 (JSON-LD se añade cuando la estructura ya está estable).
- T021 al final de US2 (necesita T019 hecho).

### Parallel Opportunities

- **Phase 2**: T002, T003, T004 y T005 son archivos distintos sin dependencias entre sí → paralelizables.
- **Phase 6**: T029 es un grep de verificación independiente del resto.
- US2 y partes de US3 no son paralelas con US1 porque comparten `uses/index.html`.

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Las 4 ediciones tocan archivos distintos; pueden ejecutarse en paralelo.
# Cada uno aplica el diff exacto documentado en contracts/shared-modules-update.md.
$ task T002  # scripts/lib/layout.js — NAV
$ task T003  # scripts/build-layout.js — PAGES
$ task T004  # scripts/check-csp.js — STATIC_PAGES
$ task T005  # scripts/check-nav-consistency.js — STATIC_PAGES

# Una vez todas terminadas, secuencial:
$ task T006  # npm run build
```

## Implementation Strategy

### MVP (User Story 1 sólo)

Phases 1 + 2 + 3 = página `/uses/` existe, integrada al shell, navegable.
Suficiente para abrir un PR temprano si fuese necesario, aunque no pasa
todas las gates aún (le falta canonical + sitemap, JSON-LD opcional).

### Incremental Delivery

1. **MVP** (Phases 1+2+3, US1): página renderizada e integrada. Demo posible.
2. **US2** añadido (Phase 4): SEO completo, JSON-LD, sitemap. Lighthouse SEO ≥ 95.
3. **US3** añadido (Phase 5): cobertura de gates completa, smoke a11y/Lighthouse pasados.
4. **Polish** (Phase 6): one-liner final + grep de afiliados + PR.

Recomendado: ejecutar las 4 fases en una sola sesión por la cantidad
pequeña de cambios y porque comparten el mismo archivo `uses/index.html`.

---

## Format validation

Todas las tareas (T001..T031) cumplen el formato estricto:

- ✓ `- [ ]` checkbox.
- ✓ `T0xx` ID secuencial.
- ✓ `[P]` sólo donde aplica (T002-T005, T029).
- ✓ `[US1]/[US2]/[US3]` en tareas de fases 3-5; sin label en Setup/Foundational/Polish.
- ✓ Path explícito o referencia al contract en cada descripción.

**Total**: 31 tareas. **MVP scope sugerido**: T001-T016 (Phases 1+2+3, US1).
