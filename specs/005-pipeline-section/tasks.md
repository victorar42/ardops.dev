---

description: "Task list for Sección 'Pipeline' (spec 005)"
---

# Tasks: Sección "Pipeline" (roadmap público de contenido)

**Input**: Design documents from `/specs/005-pipeline-section/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: la spec NO solicita TDD ni tests unitarios; sí solicita explícitamente fixtures negativas para la gate `pipeline-build-check` (contracts/ci-gate.md). Esos fixtures son tareas de implementación, no tests opcionales.

**Organization**: tareas agrupadas por user story (US1, US2, US3) para entrega incremental.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: paralelizable (diferente archivo, sin dependencias pendientes).
- **[Story]**: US1/US2/US3 cuando aplica; setup/foundational/polish sin etiqueta.
- Cada tarea incluye rutas absolutas relativas al repo (`/Users/josue/Desktop/Personal/ardops.dev/...`) o paths workspace-relativos como `index.html`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: scaffolding mínimo del feature antes de tocar nada compartido.

- [X] T001 Verify active branch is `005-pipeline-section` and clean working tree (run `git branch --show-current && git status --short` from repo root). Abort if branch differs.
- [X] T002 Create empty data-file shell `content/pipeline.json` con contenido `{ "$schema": "../specs/005-pipeline-section/contracts/pipeline-schema.json", "items": [] }`. Verifies UTF-8 + 2-space indent (ver [quickstart.md](quickstart.md)).
- [X] T003 [P] Create empty fixtures dir `content/pipeline.fixtures/` and add a `.gitkeep` to commit the directory (real fixtures se agregan en US2).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: build script + estilos base que TODAS las US dependen. Sin esto, ninguna US puede implementarse.

⚠️ **CRITICAL**: T004–T008 deben completarse antes de iniciar cualquier US.

- [X] T004 Implement core of `scripts/build-pipeline.js` — header CLI, JSON load, schema validation (regex + enums según [data-model.md](data-model.md) y [contracts/pipeline-schema.json](contracts/pipeline-schema.json)), `escapeHTML()` helper, error messages aligned con [contracts/ci-gate.md](contracts/ci-gate.md) §1. Exit codes: 0 ok, 1 fallo. NO renderiza HTML aún (solo valida y emite mensajes).
- [X] T005 [P] Add SVG icon registry inline al script `scripts/build-pipeline.js` — funciones `stageIcon(slug)` y `typeIcon(slug)` que devuelven el SVG según los catálogos de [data-model.md](data-model.md) §Entidad 3 y §Entidad 4. Iconos en `currentColor`, 16×16 viewBox, `aria-hidden="true"`, `focusable="false"`.
- [X] T006 Implement `renderItem(item)` y `renderEmpty()` in `scripts/build-pipeline.js` que producen el HTML exacto definido en [contracts/render-contract.md](contracts/render-contract.md) §2 y §3 (con escape, omit-when-empty para `estimated`/`link`, `target/rel` solo para HTTPS externos, BEM modifier `pipeline-item--<stage>`).
- [X] T007 Implement `renderSection(items)` en `scripts/build-pipeline.js` que ordena por stage canónico (`coming-soon → review → in-progress → backlog`) preservando orden de aparición dentro de cada stage (R-004), y produce el bloque completo entre los marcadores HTML (incluye el alias `<a id="blog" aria-hidden="true" tabindex="-1"></a>` y el `<section id="pipeline">`).
- [X] T008 [P] Add base CSS in `assets/css/components.css` para todas las clases `.pipeline-*` listadas en [contracts/render-contract.md](contracts/render-contract.md) §4. Solo `var(--*)` tokens, sin colores hardcoded; layout vertical mobile-first con grid 2-col en `min-width: 768px`. Énfasis visual extra para `.pipeline-item--coming-soon` (FR-007). Includes `.pipeline-empty` y `.pipeline-intro`.

**Checkpoint**: el script puede validar JSON y emitir HTML; el CSS soporta todas las clases. Las US ahora pueden avanzar.

---

## Phase 3: User Story 1 - Visitante entiende qué contenido viene (Priority: P1) 🎯 MVP

**Goal**: el landing muestra la sección Pipeline real en lugar del placeholder `#blog`, con items reales del JSON, badges visibles, orden canónico, y empty-state cálido si no hay items.

**Independent Test**: cargar `index.html` en navegador desktop, hacer scroll hasta la sección "Pipeline". Confirmar que (a) hay un section-label `// pipeline`, (b) un H2 "Pipeline", (c) una intro de 1–2 líneas, (d) ≥4 items renderizados desde `content/pipeline.json`, (e) los `coming-soon` aparecen primero, (f) cada item tiene badge de stage + badge de tipo con texto. Validar que el ancla `index.html#blog` sigue navegando a esta sección.

### Implementation for User Story 1

- [X] T009 [US1] Implement `--write` (default) mode in `scripts/build-pipeline.js` — lee `index.html`, localiza marcadores `<!-- pipeline:start -->` y `<!-- pipeline:end -->`, reemplaza el bloque entre ellos con `renderSection()` output, escribe in-place, e imprime resumen (`pipeline-build: ✓ rendered N item(s) in <stage-counts> — index.html updated`). Si los marcadores no existen, exit 1 con mensaje accionable.
- [X] T010 [US1] Modify `index.html` — reemplazar el bloque actual `<!-- Blog -->` … `</section>` (líneas ~272–281) por los marcadores `<!-- pipeline:start -->` y `<!-- pipeline:end -->` con un fragmento placeholder mínimo entre ellos (será sobrescrito por el script en T012). Mantener el orden de secciones del landing.
- [X] T011 [US1] Update nav in `index.html` (línea 134) — cambiar `<li><a href="#blog">Blog</a></li>` a `<li><a href="#pipeline">Pipeline</a></li>` (el ancla `#blog` queda como alias invisible vía `<a id="blog">` emitido por T009/T007).
- [X] T012 [US1] Seed `content/pipeline.json` con al menos 4 items reales (cumple SC-008): 1 `interview` (estado `coming-soon` o `review`, ej. la entrevista de spec 003 si aplica), 1 `lab`, 1 `talk`, 1 `post`. Mezcla mínimo 3 stages distintos. Cada item con `id` slug-único, `title`, `stage`, `description` (10–280 chars), `type`, opcionalmente `estimated` y `link`. Validar localmente con `node scripts/build-pipeline.js --check-only-validation` antes de seguir.
- [X] T013 [US1] Run `node scripts/build-pipeline.js` (write mode) y verificar que `index.html` se reescribe correctamente: los marcadores se preservan, el `<section id="pipeline">` aparece, el alias `<a id="blog">` precede a la section, y los items aparecen en orden canónico. Capturar el diff con `git diff -- index.html`.
- [X] T014 [US1] Run `npx html-validate index.html blog/index.html talks/index.html 404.html` y confirmar 0 errores. Si fallan reglas (ej. `id` duplicado entre `blog` alias y otra parte), corregir antes de seguir.
- [X] T015 [US1] Empty-state smoke check: copiar `content/pipeline.json` a `/tmp/pipeline.bak`, sobreescribir con `{"items": []}`, correr `node scripts/build-pipeline.js`, validar que `index.html` muestra el `<p class="pipeline-empty">…</p>` exacto definido en R-010, sin errores en consola al servir. Restaurar el JSON original (`mv /tmp/pipeline.bak content/pipeline.json && node scripts/build-pipeline.js`).
- [X] T016 [US1] Mobile smoke check (320 px / 360 px / 768 px) en navegador local servido con `npx serve -l 8080 .` — verificar que (a) no hay scroll horizontal en la sección Pipeline, (b) los badges de stage y tipo siguen legibles, (c) el grupo `coming-soon` se distingue visualmente, (d) los items con `link` son clickeables. Mantener el resto del landing intacto.
- [X] T017 [US1] Anchor compatibility check: en el navegador, navegar a `http://localhost:8080/#blog` y confirmar que el browser hace scroll a la sección Pipeline (alias funcional, FR-012, R-005).
- [X] T018 [US1] Run `bash tests/no-placeholders.sh` (gate spec 004) y `bash tests/forbidden-urls.sh` (gate spec 002) para asegurar que el contenido del seed JSON no introduce placeholders prohibidos ni URLs prohibidas en estado teaser.

**Checkpoint US1**: la sección Pipeline está viva en el landing con items reales, html-validate verde, mobile OK, ancla legacy preservada, gates de specs anteriores siguen verdes. **MVP entregable**.

---

## Phase 4: User Story 2 - Mantenedor edita el pipeline sin tocar código (Priority: P2)

**Goal**: agregar/editar/quitar items en `content/pipeline.json` y rebuild refleja los cambios sin tocar HTML/CSS/JS. El CI detecta out-of-sync entre `pipeline.json` y `index.html`. Fixtures negativas garantizan que JSON inválido aborta el build.

**Independent Test**: (a) agregar un nuevo item al JSON, correr build, ver el item aparecer en `index.html` sin tocar otros archivos. (b) Inyectar un fixture inválido (id duplicado) y verificar que el build aborta con exit 1 y mensaje accionable. (c) Hacer commit con `pipeline.json` cambiado pero sin regenerar `index.html` y verificar que la gate `--check` falla en CI.

### Implementation for User Story 2

- [X] T019 [US2] Implement `--check` flag en `scripts/build-pipeline.js` — modo dry-run según [contracts/ci-gate.md](contracts/ci-gate.md) §1: re-genera el bloque en memoria, compara byte-a-byte con la sección actual entre marcadores en `index.html`, exit 0 si idéntico o 1 si difiere (con diff acotado en stderr).
- [X] T020 [US2] Implement `--check-only-validation` y `--input <path>` flags en `scripts/build-pipeline.js` — para correr la fase de validación contra un JSON arbitrario sin tocar `index.html`. Necesario para el gate negativo de T022.
- [X] T021 [P] [US2] Create 4 negative fixtures en `content/pipeline.fixtures/`:
  - `invalid-duplicate-id.json` (dos items con mismo `id`)
  - `invalid-unknown-stage.json` (un item con `stage: "in_progres"`)
  - `invalid-missing-title.json` (un item sin campo `title`)
  - `invalid-bad-link.json` (un item con `link: "javascript:alert(1)"`)
  Cada fixture es un JSON mínimo (1–2 items) que fuerza solo el defecto declarado.
- [X] T022 [US2] Create `tests/pipeline-schema.sh` (executable, `chmod +x`) — itera `content/pipeline.fixtures/invalid-*.json`, ejecuta `node scripts/build-pipeline.js --input <fixture> --check-only-validation` y exige exit ≠ 0 para cada uno. Imprime OK/FAIL por fixture y resumen final. Exit 1 si algún fixture pasó cuando no debía.
- [X] T023 [US2] Add `pipeline-build-check` job al `.github/workflows/ci.yml` siguiendo el contrato exacto de [contracts/ci-gate.md](contracts/ci-gate.md) §1 (steps: checkout, setup-node@v4 con node 20, `node scripts/build-pipeline.js --check`, `bash tests/pipeline-schema.sh`). Job paralelo a las gates existentes.
- [X] T024 [US2] Local end-to-end smoke: agregar un nuevo item dummy al JSON, correr build, verificar que aparece; correr `--check` después → exit 0; modificar `index.html` manualmente para introducir un drift, correr `--check` → exit 1; revertir y correr `--check` → exit 0. Después correr `bash tests/pipeline-schema.sh` y confirmar que las 4 fixtures se rechazan.

**Checkpoint US2**: el pipeline es mantenible solo desde el JSON; CI protege contra desincronización y JSON inválido.

---

## Phase 5: User Story 3 - Visitante con limitaciones de color identifica estados (Priority: P3)

**Goal**: la sección cumple WCAG 2.1 AA verificable por axe-core; estados distinguibles sin color (texto + icono); navegación por teclado; foco visible.

**Independent Test**: ejecutar `node tests/a11y.js` con el server local activo y obtener cero violaciones para `/`. En DevTools → Rendering → Emulate vision deficiencies → Achromatopsia, los 4 estados siguen siendo distinguibles.

### Implementation for User Story 3

- [X] T025 [US3] Run a11y suite — start `npx serve -l 8080 .` en background, `node tests/a11y.js`, verificar `✓ all 6 URLs pass WCAG 2.1 AA` (incluido `http://localhost:8080/`). Si falla, capturar violaciones específicas y corregir CSS/HTML antes de seguir. Cleanup: `pkill -f "serve -l 8080"`.
- [X] T026 [US3] Manual achromatopsia smoke (DevTools → Rendering → Emulate vision deficiencies → Achromatopsia): verificar que (a) los 4 estados son identificables por texto + icono, (b) el énfasis visual de `coming-soon` se mantiene perceptible (borde, posición), (c) los tipos siguen distinguibles por icono + etiqueta. Documentar el resultado en una nota breve en el PR description.
- [X] T027 [US3] Keyboard nav smoke — Tab desde el inicio del landing hasta la sección Pipeline, verificar que (a) los enlaces de items con `link` son alcanzables, (b) el foco es visible respetando los tokens, (c) el alias `<a id="blog">` NO aparece en el orden de tabulación (gracias a `tabindex="-1"`).
- [X] T028 [US3] Run focused contrast spot-check — usar el inspector de contraste de DevTools sobre los 4 colores de stage en su layout final (texto del badge sobre el fondo de la card). Confirmar ≥ 4.5:1 para texto normal y ≥ 3:1 para texto large/bold. Ajustar tokens `--*` en `tokens.css` SI Y SOLO SI alguno falla — preferir cambiar el peso/tamaño de fuente antes que tocar tokens.

**Checkpoint US3**: a11y verde automatizado + manual; sección apta para WCAG 2.1 AA.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: cerrar ciclo de gates, documentación cruzada, marker SPECKIT, PR prep.

- [X] T029 Run full regression sweep — todos los gates en orden: `bash tests/no-placeholders.sh && bash tests/forbidden-urls.sh && npx html-validate index.html blog/index.html talks/index.html 404.html && bash tests/interviews-xss.sh && bash tests/interviews-size.sh && bash tests/interviews-negative.sh && bash tests/pipeline-schema.sh && node scripts/build-pipeline.js --check`. Todos deben exit 0.
- [X] T030 [P] Re-run a11y suite a la salida de Phase 6 (after any final tweaks) — `npx serve -l 8080 .` background + `node tests/a11y.js`, confirmar `✓ all 6 URLs pass WCAG 2.1 AA`.
- [X] T031 [P] Verify SPECKIT marker — `grep -A1 "SPECKIT START" .github/copilot-instructions.md` debe apuntar a `specs/005-pipeline-section/plan.md` (ya actualizado en `/speckit.plan`, validar que sigue ahí).
- [X] T032 Update `README.md` (sección Architecture/Content) si existe una entrada para "Blog/Artículos" — reemplazar por mención breve a "Pipeline" + apuntar a `content/pipeline.json` y `specs/005-pipeline-section/quickstart.md`. Si no existe esa sección, omitir esta tarea (no crear sección nueva solo para esto).
- [X] T033 Update `sitemap.xml` — la URL `/#pipeline` no requiere entry separada (es ancla del home), pero si `sitemap.xml` listaba `/#blog` explícitamente, removerlo o cambiarlo a `/#pipeline`. Verificar con `grep -nE 'blog|pipeline' sitemap.xml`.
- [X] T034 Mark all tasks T001..T034 as completed in this `tasks.md` (`sed -i '' -E 's/^- \[ \] (T0[0-3][0-9])/- [X] \1/' specs/005-pipeline-section/tasks.md`). Verify with `grep -c '^- \[X\] T' specs/005-pipeline-section/tasks.md` → 34, `grep -c '^- \[ \] T' specs/005-pipeline-section/tasks.md` → 0.
- [X] T035 PR preparation — open PR titled `spec 005: pipeline section (roadmap público)` con descripción que incluya: (a) Spec ID `005-pipeline-section`, (b) sección constitucional cubierta (II identidad visual, III estática, IV cero deps, VI a11y, VII performance, IX gates), (c) checklist de gates: html-validate, a11y, no-placeholders, forbidden-urls, pipeline-build-check (--check), pipeline-schema.sh, interviews-* unchanged, (d) screenshots desktop + mobile, (e) AC SC-001..SC-009 marcados según validación.

---

## Dependencies (graph)

```
Phase 1 (T001-T003)
    └─→ Phase 2 (T004-T008)         ← BLOQUEA TODAS las US
            ├─→ US1 (T009-T018)     ← MVP entregable solo
            ├─→ US2 (T019-T024)     ← independiente de US1 una vez T004-T008 listos
            └─→ US3 (T025-T028)     ← requiere US1 mergeado para tener algo que validar
Phase 6 (T029-T035) ← requiere US1 + US2 + US3
```

**Inter-task dependencies clave**:
- T005, T006 dependen de T004 (esqueleto del script).
- T007 depende de T005 + T006.
- T009 depende de T007.
- T010 + T011 dependen de T009 (necesitan los marcadores listos).
- T012 puede correr en paralelo con T010/T011, pero T013 los necesita a los tres.
- T014..T018 dependen de T013.
- T019 + T020 dependen de Phase 2 completa, pero pueden correr en paralelo con US1.
- T021 (fixtures) depende de T020 (`--input` flag listo para validar las fixtures localmente).
- T022 depende de T021.
- T023 depende de T019 + T022.
- T024 depende de T023 (gate completa para smoke E2E).
- US3 depende de US1 mergeado para tener la sección renderizada que axe pueda evaluar.

## Parallel execution opportunities

**Dentro de Phase 2**:
- T005 y T008 son `[P]` — cada uno toca un archivo distinto (`scripts/build-pipeline.js` vs `assets/css/components.css`).

**Dentro de US2**:
- T021 es `[P]` — tocan archivos nuevos en `content/pipeline.fixtures/` que no existen aún.

**Dentro de Phase 6**:
- T030 y T031 son `[P]` — operaciones independientes (a11y vs grep).

**Cross-US** (después de Phase 2):
- US1 y US2 implementación pueden coexistir si dos personas trabajan en paralelo (US1 toca `index.html` + `content/pipeline.json`; US2 toca `tests/`, `content/pipeline.fixtures/`, `.github/workflows/ci.yml`). Solo `scripts/build-pipeline.js` es compartido — coordinar sobre ese archivo.

## Implementation strategy (MVP first)

1. **Phase 1 + Phase 2 + US1** = MVP entregable. Tras T018, la sección Pipeline está viva con datos reales y reemplaza al placeholder. Valor inmediato al visitante.
2. **+ US2** = pipeline mantenible y protegido por CI. Tras T024, agregar/editar items es una operación de un commit, sin frágil duplicación de fuentes.
3. **+ US3** = compliance WCAG 2.1 AA verificado automatizado + manual.
4. **+ Phase 6** = listo para merge: todas las gates verdes, marker actualizado, PR preparado.

## Independent test criteria recap

| US | Independent Test | Status |
|---|---|---|
| US1 | Cargar landing → ver Pipeline con ≥4 items reales, ordenados, ancla `#blog` funcional | Test manual + html-validate + no-placeholders |
| US2 | Editar JSON → rebuild refleja cambios; fixture inválido → build aborta; drift JSON↔HTML → CI rojo | T024 smoke + `tests/pipeline-schema.sh` + `--check` |
| US3 | `node tests/a11y.js` cero violaciones; achromatopsia smoke OK | T025 + T026 |

## Format validation

Cada tarea sigue el formato estricto: `- [ ] [TaskID] [P?] [Story?] Description con file path`. Las 35 tareas (T001..T035) fueron auditadas:

- ✅ Cada una empieza con `- [ ] T###`.
- ✅ Las US-phase tasks llevan `[US1]`, `[US2]` o `[US3]`.
- ✅ Tareas de Setup, Foundational y Polish NO llevan etiqueta de Story.
- ✅ `[P]` aparece solo donde es seguro paralelizar.
- ✅ Cada descripción menciona file path concreto o gate específica.
