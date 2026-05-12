# Tasks: Shared nav & footer (single source of truth)

**Feature**: 008-shared-nav-and-footer · **Branch**: `008-shared-nav-and-footer`
**Input**: Design documents from `/specs/008-shared-nav-and-footer/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/)

**Tests**: La spec NO solicita unit tests dedicados. La validación se
realiza vía el gate `tests/nav-consistency.sh` (que ES un deliverable
de US2) más los gates existentes (`html-validate`, `a11y.js`). NO se
generan tareas de tests adicionales.

**Organization**: tareas agrupadas por user story. P1 (US1, US2) y P2
(US3). Cada fase entrega valor incremental verificable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: ejecutable en paralelo (archivos distintos, sin dependencias bloqueantes)
- **[Story]**: a qué user story pertenece (US1, US2, US3); fases compartidas no llevan label

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar la estructura de carpetas que esta spec introduce.

- [X] T001 Crear directorio `scripts/lib/` en la raíz del repo (`mkdir -p scripts/lib`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: el módulo de layout es la fuente de verdad que TODOS los
consumidores (US1, US2, US3) necesitan. Hasta que esto exista, ninguna
user story puede comenzar.

**⚠️ CRITICAL**: ningún trabajo de US1/US2/US3 puede arrancar antes de completar esta fase.

- [X] T002 Crear módulo `scripts/lib/layout.js` con: array `NAV` (6 items según [data-model.md](data-model.md)), función `normalizePath(p)`, función `escapeHTML(s)` (helper privado), función `renderHeader(currentPath)`, función `renderFooter()`. Exports CommonJS `{ NAV, renderHeader, renderFooter, normalizePath }`. Cumplir contratos [contracts/layout-module.md](contracts/layout-module.md), [contracts/nav-html-contract.md](contracts/nav-html-contract.md), [contracts/footer-html-contract.md](contracts/footer-html-contract.md) byte-equivalent.
- [X] T003 Verificación REPL del módulo: ejecutar `node -e 'const m=require("./scripts/lib/layout"); console.log(m.renderHeader("/blog/")); console.log("---"); console.log(m.renderFooter())'` y validar manualmente contra los contratos. NO modifica archivos; sirve como sanity check antes de que los consumidores lo usen.

**Checkpoint**: módulo `scripts/lib/layout.js` listo y verificado. Las user stories pueden empezar en paralelo.

---

## Phase 3: User Story 1 — Visitante navega entre secciones sin reaprender el menú (Priority: P1) 🎯 MVP

**Goal**: cada página servida (`/`, `/blog/`, `/interviews/`, `/talks/`, `/404`) renderiza el mismo `<nav>` (orden, labels, destinos) con `aria-current="page"` correcto, consumido desde la fuente única.

**Independent Test**: abrir dos páginas servidas en pestañas separadas y comparar visualmente el nav; deben ser idénticos salvo el item activo. Verificable también con `diff` después de extraer el `<nav>` de cada HTML servido.

### Implementation for User Story 1

- [X] T004 [P] [US1] Modificar `scripts/build-blog.js`: importar `{ renderHeader, renderFooter }` desde `./lib/layout`; reemplazar el HTML hardcoded del `<header>` y `<footer>` por interpolación de `renderHeader('/blog/')` y `renderFooter()` en la plantilla del listing y de cada post.
- [X] T005 [P] [US1] Modificar `scripts/build-interviews.js`: importar el módulo y reemplazar HTML hardcoded de `<header>`/`<footer>` por `renderHeader('/interviews/')` + `renderFooter()` en listing y posts.
- [X] T006 [US1] Crear `scripts/build-layout.js`: procesa los archivos estáticos `index.html`, `404.html`, `talks/index.html`. Para cada uno reemplaza el contenido entre `<!-- nav:start -->`/`<!-- nav:end -->` con `renderHeader(currentPath)` y entre `<!-- footer:start -->`/`<!-- footer:end -->` con `renderFooter()`. Soporta flag `--check` (no escribe; sale 1 si hay drift) siguiendo el patrón de [scripts/build-blog.js](../../scripts/build-blog.js). Mapping currentPath: `index.html`→`/`, `404.html`→`/404`, `talks/index.html`→`/talks/`.
- [X] T007 [US1] Editar `index.html`: insertar markers `<!-- nav:start -->...<!-- nav:end -->` rodeando el `<header>` actual y `<!-- footer:start -->...<!-- footer:end -->` rodeando el `<footer>` actual. Confirmar que el skip link queda dentro del bloque nav (ver [contracts/nav-html-contract.md](contracts/nav-html-contract.md) R-01).
- [X] T008 [US1] Editar `404.html`: agregar markers nav y footer en las posiciones equivalentes. Si no tiene `<header>`/`<footer>` actual, dejar los markers vacíos para que `build-layout.js` los rellene.
- [X] T009 [US1] Editar `talks/index.html`: agregar markers nav y footer del mismo modo.
- [X] T010 [US1] Ejecutar regeneración completa: `node scripts/build-layout.js && node scripts/build-blog.js && node scripts/build-interviews.js`. Confirmar que los HTML servidos quedan actualizados sin errores.
- [X] T011 [US1] Validar visualmente con `diff` extrayendo el bloque `<header>` de dos páginas distintas (p.ej. `blog/index.html` vs `interviews/index.html`); la única diferencia esperada es la línea con `aria-current="page"` (SC-002).

**Checkpoint**: User Story 1 funcional. Todas las páginas servidas muestran el mismo nav y footer desde la fuente única; un visitante puede recorrer secciones sin notar inconsistencias.

---

## Phase 4: User Story 2 — Editor agrega o renombra un item del menú una sola vez (Priority: P1)

**Goal**: editar `NAV` en `scripts/lib/layout.js` + ejecutar build = todas las páginas actualizadas; cualquier edición manual al `<nav>` o `<footer>` servido (drift) es detectada y bloqueada por gate de CI.

**Independent Test**: (a) cambiar un label del array `NAV`, ejecutar `node scripts/build-layout.js && node scripts/build-blog.js && node scripts/build-interviews.js`, confirmar que las páginas reflejan el cambio sin tocar más archivos. (b) editar a mano el `<nav>` de una página servida y ejecutar `bash tests/nav-consistency.sh` → debe fallar con mensaje claro.

### Implementation for User Story 2

- [X] T012 [US2] Crear `scripts/check-nav-consistency.js` (Node + jsdom): descubre páginas servidas (lista hardcoded `index.html`, `404.html`, `talks/index.html` + glob `blog/**/*.html`, `interviews/**/*.html`); para cada una valida V-1..V-8 contra `renderHeader(expectedPath)` y `renderFooter()` según [contracts/nav-consistency-gate.md](contracts/nav-consistency-gate.md). Mapping path: blog/* → `/blog/`, interviews/* → `/interviews/`, etc. Sale 0 en éxito, 1 en violación (con mensaje por archivo).
- [X] T013 [US2] Crear wrapper `tests/nav-consistency.sh` (`#!/usr/bin/env bash`, `set -euo pipefail`, `node scripts/check-nav-consistency.js "$@"`). `chmod +x tests/nav-consistency.sh`.
- [X] T014 [P] [US2] Editar `package.json`: agregar npm scripts `"build:layout": "node scripts/build-layout.js"`, `"check:layout": "node scripts/build-layout.js --check"`, `"check:nav": "bash tests/nav-consistency.sh"`. Agregar a `"build"` la invocación de `build:layout` antes de los demás builds existentes.
- [X] T015 [US2] Validación end-to-end de US2 caso (a): cambiar temporalmente el label `'Charlas'` por `'Talks'` en `scripts/lib/layout.js`, correr `npm run build`, verificar con `grep -r '>Talks<' .` que aparece en las 7+ páginas. Revertir el cambio.
- [X] T016 [US2] Validación end-to-end de US2 caso (b): editar a mano el label en `blog/index.html` (cambiar "Blog" por "Bloga"), correr `bash tests/nav-consistency.sh`, confirmar exit code 1 y mensaje claro. Revertir y volver a correr el gate hasta que pase.

**Checkpoint**: User Story 2 funcional. El contrato operacional está garantizado: una sola fuente de verdad + gate que impide drift.

---

## Phase 5: User Story 3 — Tecnología asistiva identifica la página actual (Priority: P2)

**Goal**: lectores de pantalla anuncian la página actual sin ambigüedad; axe-core no reporta violaciones de `aria-current`, `link-name`, `landmark-unique` en las páginas servidas.

**Independent Test**: ejecutar `node tests/a11y.js` sobre las páginas servidas; cero violaciones nuevas. Manualmente, abrir VoiceOver en `/blog/` y confirmar el anuncio de "página actual" en el item Blog.

### Implementation for User Story 3

- [X] T017 [US3] Servir el sitio localmente (`npx serve -l 8080 .` en background) y ejecutar `node tests/a11y.js`. Confirmar cero violaciones nuevas relacionadas a `aria-current`, `link-name`, `landmark-unique` en `index.html`, `blog/index.html`, `interviews/index.html`, `talks/index.html`, `404.html`.
- [X] T018 [US3] Smoke test manual con lector de pantalla: abrir `/blog/` con VoiceOver (macOS) o NVDA, navegar el `<nav>` con tab y confirmar que al llegar al item "Blog" se anuncia como página actual. Documentar el resultado en el commit message del PR.

**Checkpoint**: User Story 3 funcional. WCAG 2.1 AA cumplido para nav consistente en todas las páginas.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: integrar los nuevos gates al pipeline de CI y dejar el repo limpio.

- [X] T019 Editar [.github/workflows/ci.yml](../../.github/workflows/ci.yml): agregar steps `Layout sync check` (`node scripts/build-layout.js --check`) y `Nav consistency gate` (`bash tests/nav-consistency.sh`) después de los checks de build existentes. Asegurar que ambos steps son bloqueantes (sin `continue-on-error`).
- [X] T020 [P] Ejecutar la batería completa de gates localmente para confirmar que nada regresionó: `node scripts/build-layout.js --check && node scripts/build-blog.js --check && node scripts/build-interviews.js --check && node scripts/build-pipeline.js --check && bash tests/nav-consistency.sh && npm run html-validate`.
- [X] T021 [P] Validar el flujo descrito en [quickstart.md](quickstart.md) ejecutando los comandos de la sección "Validación local (todos los gates)" de principio a fin; corregir cualquier desfasaje entre el documento y la implementación real.
- [X] T022 Verificar checklist final: SC-001..SC-008 de [spec.md](spec.md) cumplidos. Documentar en el cuerpo del PR el estado de cada SC.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sin dependencias.
- **Phase 2 (Foundational)**: depende de Phase 1. **BLOQUEA** todas las user stories.
- **Phase 3 (US1)**: depende de Phase 2.
- **Phase 4 (US2)**: depende de Phase 2; el gate (T012-T013) puede desarrollarse en paralelo con US1 una vez Phase 2 esté hecho, pero las validaciones T015-T016 requieren que US1 (T010) esté completo (las páginas deben existir regeneradas).
- **Phase 5 (US3)**: depende de US1 completo (las páginas deben tener `aria-current` correcto para verificar a11y).
- **Phase 6 (Polish)**: depende de US1, US2, US3 completos.

### Within Each User Story

- **US1**: T004, T005, T006 son paralelizables (archivos distintos). T007, T008, T009 son paralelizables (archivos estáticos distintos) pero requieren T006 listo. T010 requiere T004-T009. T011 requiere T010.
- **US2**: T012 → T013 → T014 (T014 paralelizable con T013). T015, T016 requieren T014 + Phase 3 completa.
- **US3**: T017 → T018.

### Parallel Opportunities

- **Dentro de Phase 3 (US1)**: T004 y T005 corren en paralelo (`scripts/build-blog.js` y `scripts/build-interviews.js` son archivos distintos). T007, T008, T009 corren en paralelo entre sí.
- **Cross-phase tras Phase 2**: T012 (gate Node) puede arrancar en paralelo con la fase US1.
- **Phase 6**: T020 y T021 son lecturas/validaciones, paralelizables.

---

## Parallel Example: User Story 1

```bash
# Tras completar Phase 2, abrir 2 streams de trabajo en paralelo:

# Stream A — generadores
edit scripts/build-blog.js        # T004 [P]
edit scripts/build-interviews.js  # T005 [P]

# Stream B — script estático + markers
write scripts/build-layout.js     # T006
edit index.html                   # T007 [P]
edit 404.html                     # T008 [P]
edit talks/index.html             # T009 [P]

# Sync point: regenerar y diffear
node scripts/build-layout.js && node scripts/build-blog.js && node scripts/build-interviews.js  # T010
diff <(sed -n '/<header/,/<\/header>/p' blog/index.html) \
     <(sed -n '/<header/,/<\/header>/p' interviews/index.html)  # T011 — solo aria-current
```

---

## Implementation Strategy

### MVP scope = User Story 1 (Phase 1 + 2 + 3)

Entrega valor visible inmediato: el sitio servido pasa a tener nav y
footer consistentes en todas las páginas, consumidos desde la fuente
única. Sin esto, ninguna otra user story tiene sentido.

### Incremental delivery

1. **MVP** (Phase 1+2+3): nav consistente en producción.
2. **Operacional** (+Phase 4): gate de drift activo, garantía duradera.
3. **A11y certificado** (+Phase 5): WCAG 2.1 AA verificado.
4. **CI hardened** (+Phase 6): gates bloqueantes en CI, docs alineadas.

Cada paso es un commit independiente y un PR mergeable por separado si
se prefiere micro-PRs. Para esta feature lo natural es UN solo PR que
agrupa todas las fases (alcance contenido, ~22 tareas).

### Riesgo y mitigación

- **Riesgo**: regenerar `index.html` rompe edits en progreso del editor.
  **Mitigación**: T007 inserta markers SIN cambiar el contenido visible;
  el primer `node scripts/build-layout.js` debe producir output
  byte-equivalente al input (idempotente). T011 lo valida.
- **Riesgo**: el gate falla en CI por glob de blog/interviews que
  incluye drafts.
  **Mitigación**: T012 hardcoda solo archivos en disco al momento del run;
  drafts no publicados no se generan a HTML.
