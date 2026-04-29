---
description: "Tasks: Techno Week 8.0 — Estado Coming Soon (spec 002)"
---

# Tasks: Techno Week 8.0 — Estado "Coming Soon"

**Input**: Design documents from `/specs/002-techno-week-coming-soon/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Esta feature NO solicitó suite de tests automatizados nuevos más allá del gate `forbidden-urls.sh` (que es un check de CI, no un test unitario), pa11y, y Lighthouse — todos cubiertos por gates existentes o documentados como contrato. No se generan tareas de tests TDD.

**Organization**: Tareas agrupadas por user story (P1/P1/P2 según `spec.md`) tras una fase compartida de Setup y Foundational.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencias activas).
- **[Story]**: `US1` (visitante ve teaser sin URLs), `US2` (operador libera con un flag), `US3` (a11y).
- Cada tarea indica ruta exacta de archivo.

## Path Conventions

Sitio estático single-repo (constitución III). Rutas relativas a la raíz del workspace `/Users/josue/Desktop/Personal/ardops.dev`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar el espacio de trabajo y verificar el baseline.

- [X] T001 Verificar branch activa: confirmar que `git branch --show-current` retorna `002-techno-week-coming-soon`. Si no, abortar y rebobinar al flow `/specify`.
- [X] T002 [P] Leer y revisar artifacts de la spec 002 antes de tocar código: [specs/002-techno-week-coming-soon/spec.md](specs/002-techno-week-coming-soon/spec.md), [specs/002-techno-week-coming-soon/plan.md](specs/002-techno-week-coming-soon/plan.md), [specs/002-techno-week-coming-soon/research.md](specs/002-techno-week-coming-soon/research.md), [specs/002-techno-week-coming-soon/data-model.md](specs/002-techno-week-coming-soon/data-model.md), [specs/002-techno-week-coming-soon/quickstart.md](specs/002-techno-week-coming-soon/quickstart.md), [specs/002-techno-week-coming-soon/contracts/teaser-block.html](specs/002-techno-week-coming-soon/contracts/teaser-block.html), [specs/002-techno-week-coming-soon/contracts/published-block.html](specs/002-techno-week-coming-soon/contracts/published-block.html), [specs/002-techno-week-coming-soon/contracts/forbidden-urls.md](specs/002-techno-week-coming-soon/contracts/forbidden-urls.md), [specs/002-techno-week-coming-soon/contracts/a11y-badge.md](specs/002-techno-week-coming-soon/contracts/a11y-badge.md).
- [X] T003 [P] Leer la constitución [.specify/memory/constitution.md](.specify/memory/constitution.md) y la referencia visual [.reference/v1-design/index.html](.reference/v1-design/index.html) para confirmar tokens y estética antes de editar CSS.
- [X] T004 Servir el sitio localmente como baseline para comparar antes/después: `python3 -m http.server 8080` (en una terminal separada) y abrir `http://localhost:8080/` y `http://localhost:8080/talks/`. Anotar capturas mentales del estado actual del hero y del bloque `#talk`.

**Checkpoint Phase 1**: workspace verificado, contratos conocidos, baseline visible.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: estilos CSS y gate de CI compartidos por las user stories US1 y US2. Estas tareas DEBEN completarse antes de tocar el HTML, porque US1 depende de las clases y del gate, y US2 reusa los mismos estilos al volver al estado `published` (badge sin variante `--coming`, mismas clases base).

- [X] T005 [P] Agregar al final de la sección `Talk card` de [assets/css/components.css](assets/css/components.css) la variante visual `.talk-badge--coming` reutilizando tokens existentes (`--accent`, `--accent-dim`, `--border`). Usar borde dashed para diferenciarla del badge "fecha" tradicional, sin introducir colores hardcoded. Cumple constitución II y FR-012.
- [X] T006 [P] Agregar al mismo bloque de [assets/css/components.css](assets/css/components.css) los estilos para `.talk-meta`, `.talk-meta-key` y `.talk-cta-info` siguiendo el snippet del runbook §1.4 en [specs/002-techno-week-coming-soon/quickstart.md](specs/002-techno-week-coming-soon/quickstart.md). Usar `var(--font-mono)`, `var(--text-secondary)`, `var(--text-muted)`, `var(--border)`. Sin nuevos tokens.
- [X] T007 Agregar regla `@media (prefers-reduced-motion: no-preference)` en [assets/css/motion.css](assets/css/motion.css) (o `components.css` si motion ya tiene los keyframes referenciados) para aplicar `pulse-glow` al `.talk-badge--coming` solo cuando el usuario no pidió reducción de movimiento. Verificar que `pulse-glow` ya existe en motion.css; si no, NO crearla — caer a un efecto estático sin animación. Cumple WCAG 2.3.3 y `contracts/a11y-badge.md`.
- [X] T008 Verificar contraste del badge en [assets/css/components.css](assets/css/components.css): texto `var(--accent)` sobre composición `var(--accent-dim) + var(--bg-card)`. Si DevTools/contrast checker reporta < 4.5:1, ajustar la opacidad de `--accent-dim` *solo dentro de `.talk-badge--coming`* (no tocar el token global) hasta cumplir AA. Documentar el ratio final en un comentario CSS adyacente. (Depende de T005.)
- [X] T009 Crear el script de gate `tests/forbidden-urls.sh` siguiendo la implementación de referencia en [specs/002-techno-week-coming-soon/contracts/forbidden-urls.md](specs/002-techno-week-coming-soon/contracts/forbidden-urls.md). Aplicar `chmod +x`. Validar que se ejecuta desde la raíz del repo y respeta los archivos escaneados/excluidos del contrato.
- [X] T010 [P] Validar localmente que `bash tests/forbidden-urls.sh` ejecutado contra el HEAD actual (HTML aún sin modificar) **falla** con código != 0 reportando la URL del repo demo en `index.html` línea ~152 y en `talks/index.html` línea ~76. Esto demuestra que el gate funciona antes de que la feature corrija el contenido. (Depende de T009.)
- [X] T011 Integrar el gate en CI: agregar un step en el workflow de GitHub Actions que ya despliega Pages (revisar `.github/workflows/`; si no existe workflow, crear uno mínimo o documentar la limitación en una nota dentro del propio script). El step ejecuta `bash tests/forbidden-urls.sh`. Falla del step bloquea el deploy. Cumple constitución IX. (Depende de T009.)

**Checkpoint Phase 2**: CSS listo, gate de CI listo y demostrablemente capaz de detectar fugas. Ahora se puede modificar HTML con red de seguridad.

---

## Phase 3: User Story 1 — Visitante descubre la charla sin acceso a material sensible (Priority: P1) 🎯 MVP

**Goal**: el visitante carga el sitio antes del 18 de mayo de 2026 y ve el badge "Próximamente", la fecha, audiencia, formato y descripción. NO existen URLs hacia slides ni repo demo en el HTML servido.

**Independent Test**: cargar `index.html` y `talks/index.html` localmente, inspeccionar `view-source:`, ejecutar `bash tests/forbidden-urls.sh`. El gate debe pasar (exit 0) y la inspección manual debe confirmar el badge visible. Spec acceptance scenarios 1, 2, 3, 4 de US1.

### Implementation for User Story 1

- [X] T012 [US1] Editar el bloque `<section id="talk">` de [index.html](index.html) reemplazando el `<article class="talk-card">` actual (líneas ~164–177) por la primera variante (con `<h3 class="talk-title">`) del contrato [specs/002-techno-week-coming-soon/contracts/teaser-block.html](specs/002-techno-week-coming-soon/contracts/teaser-block.html). PRESERVAR los marcadores `<!-- TALK-STATE:teaser START -->` y `<!-- TALK-STATE:teaser END -->` en el HTML servido — son requisito del gate. Cumple FR-001..FR-006, FR-008.
- [X] T013 [US1] Editar el CTA secundario del hero en [index.html](index.html) (líneas ~152–155): reemplazar `href="https://github.com/victorar42/techno-week"` (con sus atributos `target` y `rel`) y el texto "Ver Repositorio" por `href="#pipeline"` y texto "Ver el Pipeline". Reusar el SVG del icono `.resource-icon` para `#pipeline` (escudo) en vez del icono GitHub. Esto elimina la violación actual de FR-005 detectada en [research.md](specs/002-techno-week-coming-soon/research.md) R-003.
- [X] T014 [US1] Editar [talks/index.html](talks/index.html) reemplazando el `<article class="talk-card">` actual (líneas ~67–82) por la segunda variante (con `<h2 class="talk-title">`) del contrato [specs/002-techno-week-coming-soon/contracts/teaser-block.html](specs/002-techno-week-coming-soon/contracts/teaser-block.html). Eliminar el `<a class="resource-link" href="https://github.com/victorar42/techno-week">` (línea 76). PRESERVAR los marcadores `<!-- TALK-STATE:teaser START/END -->`. Cumple FR-001..FR-006 en la segunda surface.
- [X] T015 [US1] Verificar que el JSON-LD `Event` en [index.html](index.html) (líneas ~92–119) permanece intacto, con `url: "https://ardops.dev/#talk"` (anchor interno, no URL sensible). NO modificar el JSON-LD. Cumple research.md R-004.
- [X] T016 [US1] Verificar manualmente desde `view-source:http://localhost:8080/` y `view-source:http://localhost:8080/talks/` que NO existe ninguna ocurrencia de `victorar42/techno-week`, `slides`, `.pdf`, `.pptx` en los archivos servidos. Si aparece, regresar al task previo correspondiente. Acceptance scenario 4 de US1. (Depende de T012, T013, T014.)
- [X] T017 [US1] Ejecutar `bash tests/forbidden-urls.sh` y confirmar exit code 0 con mensaje `OK: cero URLs prohibidas en estado teaser.` Si falla, regresar a los tasks previos. Cumple SC-002. (Depende de T012, T013, T014, T009.)
- [X] T018 [US1] Smoke responsive: en DevTools simular viewports `320px` y `380px` para `index.html` y `talks/index.html`. Confirmar que el badge `.talk-badge--coming` no rompe el layout, no genera scroll horizontal, y `.talk-meta` se acomoda con `flex-wrap`. Cumple FR-009 y SC-006. (Depende de T012, T014, T005, T006.)

**Checkpoint US1**: el sitio en estado `teaser` está visualmente correcto y mecánicamente seguro. MVP entregable.

---

## Phase 4: User Story 2 — Operador libera el contenido el día del evento (Priority: P1)

**Goal**: existe documentación versionada y un mecanismo de "un solo cambio" que permite al operador alternar a estado `published` sin rediseñar la sección.

**Independent Test**: una persona nueva busca "techno week" o "publicar charla" en el repo y encuentra el runbook en menos de 60 segundos. Realiza un dry-run del runbook en una branch desechable: el resultado es exactamente el contenido del bloque published, sin URLs vacías. Acceptance scenarios 1, 2, 3 de US2.

### Implementation for User Story 2

- [X] T019 [US2] Agregar al [README.md](README.md) una sección visible (con entrada en el Table of Contents si existe; si no, una sección de primer nivel `## Liberación post-charla — Techno Week 8.0`) que contenga: (a) referencia al runbook completo en [specs/002-techno-week-coming-soon/quickstart.md](specs/002-techno-week-coming-soon/quickstart.md) §2; (b) los 3 puntos de edición clave (`index.html#talk`, `talks/index.html .talk-card`, hero CTA en `index.html`); (c) advertencia de no reescribir historia git para la liberación. Cumple FR-010 y SC-007.
- [X] T020 [US2] Confirmar que [specs/002-techno-week-coming-soon/contracts/published-block.html](specs/002-techno-week-coming-soon/contracts/published-block.html) contiene placeholders `{{REPO_URL}}`, `{{SLIDES_URL}}`, `{{EXTRA_RESOURCES}}` y NO URLs reales. Si aparece cualquier URL real, eliminarla del contrato. Cumple invariante I-1 de [data-model.md](specs/002-techno-week-coming-soon/data-model.md).
- [X] T021 [US2] Dry-run del runbook de liberación en una branch desechable local (NO commitear ni pushear): aplicar pasos §2.1, §2.2, §2.3 de [quickstart.md](specs/002-techno-week-coming-soon/quickstart.md) sustituyendo placeholders por URLs ficticias (`https://example.com/repo`, `https://example.com/slides`). Ejecutar `bash tests/forbidden-urls.sh` y verificar mensaje `OK: estado published. forbidden-urls gate en modo skip.` Después: `git restore .` para descartar todo. Cumple acceptance scenarios 2 y 3 de US2 y SC-003.
- [X] T022 [US2] Medir el diff del dry-run (`git diff --stat` antes del restore) y confirmar que el cambio total para liberación se concentra en los 3 archivos esperados (`index.html`, `talks/index.html`, opcionalmente CSS si se decide ajustar) y consiste en un swap de bloque + actualización de hero CTA. Documentar el conteo de líneas en un comentario del PR cuando se mergea US1+US2. Cumple SC-003.

**Checkpoint US2**: liberación post-charla validada como operación trivial; runbook localizable; gate detecta la transición.

---

## Phase 5: User Story 3 — Lector con tecnología asistiva entiende el estado (Priority: P2)

**Goal**: el badge y la sección comunican estado y fecha igual de bien con lector de pantalla y solo teclado.

**Independent Test**: VoiceOver/NVDA anuncia el `aria-label` completo; navegación por teclado no detiene el foco en elementos no-interactivos; pa11y y Lighthouse Accessibility = 100 sobre `index.html` y `talks/index.html`. Acceptance scenarios 1, 2, 3 de US3.

### Implementation for User Story 3

- [X] T023 [US3] Verificar que el atributo `aria-label="Contenido próximamente, disponible el 18 de mayo de 2026"` y `role="status"` están presentes en cada `<p class="talk-badge talk-badge--coming">` introducido por T012 y T014. Si falta, corregir el HTML para alinear con [specs/002-techno-week-coming-soon/contracts/a11y-badge.md](specs/002-techno-week-coming-soon/contracts/a11y-badge.md). (Depende de T012, T014.)
- [X] T024 [US3] Verificar que el `<span aria-hidden="true">★</span>` está dentro del badge para evitar que el lector de pantalla anuncie "estrella". Confirmar también que `.talk-cta-info` NO es focusable (es `<p>`, no `<a>` ni `<button>`). Cumple `contracts/a11y-badge.md`.
- [X] T025 [P] [US3] Ejecutar `npx pa11y --config tests/pa11y.config.js http://localhost:8080/` y `npx pa11y --config tests/pa11y.config.js http://localhost:8080/talks/`. Confirmar 0 issues. Si hay issues, corregir hasta cero. Cumple SC-004 y AC-A11Y-1. (Depende de Phase 3 completa.)
- [X] T026 [P] [US3] Ejecutar Lighthouse (mobile + desktop) sobre `http://localhost:8080/` y `http://localhost:8080/talks/` con la config existente (`tests/lighthouserc.json` y `tests/lighthouserc.mobile.json`). Confirmar Accessibility = 100, Performance ≥ 95, CLS ≤ 0.1, INP ≤ 200ms. Cumple SC-004, SC-005, constitución VI y VII. (Depende de Phase 3 completa.)
- [X] T027 [US3] Test manual con lector de pantalla (VoiceOver en macOS): tabular hasta la sección Talk; confirmar que el badge se anuncia con su `aria-label` íntegro. Documentar resultado en una nota interna o en el PR description. Cumple AC-A11Y-3.
- [X] T028 [US3] Test manual de teclado: solo con `Tab`/`Shift+Tab` recorrer el documento. Confirmar que el foco NO se detiene en `.talk-badge--coming` ni en `.talk-cta-info`, y que sí se detiene en los enlaces de navegación normales. Cumple AC-A11Y-4.

**Checkpoint US3**: a11y validada cuantitativa (pa11y, Lighthouse) y cualitativamente (lector de pantalla, teclado).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: cierre, integración con flow Spec Kit y verificación final antes del PR.

- [X] T029 [P] Actualizar [.github/copilot-instructions.md](.github/copilot-instructions.md) confirmando que el bloque `<!-- SPECKIT START --> ... <!-- SPECKIT END -->` apunta a `specs/002-techno-week-coming-soon/plan.md` (ya editado en Phase 1 de plan, pero revalidar tras cualquier rebase).
- [X] T030 [P] Ejecutar el link checker existente del proyecto (`tests/links.config.toml`) sobre `http://localhost:8080/` y `http://localhost:8080/talks/`. Confirmar 0 enlaces rotos y 0 enlaces a destinos prohibidos. Cumple constitución IX.
- [X] T031 [P] Cross-check final del HTML servido: `grep -nE 'TALK-STATE:teaser' index.html talks/index.html` debe encontrar exactamente 2 START y 2 END (uno por surface). Si hay desbalance, corregir.
- [X] T032 Ejecutar la suite completa de gates locales: `bash tests/forbidden-urls.sh && npx pa11y ... && npm run lh` (ajustar comandos a los scripts realmente disponibles en `package.json`). Todos deben pasar. (Depende de T017, T025, T026, T030.)
- [X] T033 Preparar mensaje de commit y PR description: incluir Spec ID `002`, sección de constitución relevante (VI a11y, VII performance, VIII seguridad, IX gates), y checklist de gates pasados. Mensaje de commit sugerido: `feat(talk): teaser state for Techno Week 8.0 (spec 002)`.
- [X] T034 Antes de pushear, ejecutar verificación de historia descrita en [research.md](specs/002-techno-week-coming-soon/research.md) R-006: `git --no-pager log -p HEAD..origin/main -- index.html talks/index.html | grep -iE 'techno-week|slides' || echo "OK: nada nuevo en historia"`. Si encuentra introducciones nuevas, abortar y revisar el diff antes de continuar. (Depende de Phase 3 completa.)

**Checkpoint final**: PR listo para abrir, todas las gates verdes, historia git limpia, runbook entregado.

---

## Dependencies

### Phase-level dependencies

```
Phase 1 (Setup) ─────► Phase 2 (Foundational) ─────► Phase 3 (US1)
                                                            │
                                                            ├─► Phase 4 (US2)
                                                            │
                                                            └─► Phase 5 (US3)
                                                                       │
                                            ┌──────────────────────────┘
                                            │
                                            ▼
                                       Phase 6 (Polish)
```

- **US2 (Phase 4)** depende solo de US1 a nivel funcional (necesita los marcadores `TALK-STATE:teaser` ya presentes para validar el dry-run de transición). En la práctica puede iniciar inmediatamente después de T012/T014/T017.
- **US3 (Phase 5)** depende de US1 (necesita el HTML modificado para auditar). Puede correr en paralelo con US2.
- **Phase 6 (Polish)** depende de US1, US2 y US3 estables.

### Task-level critical path

`T001 → T002/T003/T004 → T005/T006 → T007 → T008 → T009 → T010 → T012 → T014 → T017 → T021 → T025 + T026 → T032 → T034`.

Las tareas marcadas `[P]` son las que no comparten archivo y pueden correrse en paralelo.

---

## Parallel Execution Examples

### Phase 2 paralelizable

- T005 y T006 tocan zonas distintas de `components.css` pero el mismo archivo → **NO** correr literalmente en paralelo (riesgo de merge conflict en buffer). Marcar [P] indica que conceptualmente son independientes; ejecutar en serie sobre el mismo archivo.
- T009 (crear script bash) ↔ T010 (correr script) son secuenciales: T010 depende de T009.
- T011 (integrar en CI) puede ocurrir en paralelo con la edición de HTML de Phase 3 si el operador prefiere abrir dos PRs.

### US1 + US2 + US3 después del MVP de US1

Una vez completada Phase 3 (T012..T018):
- T019, T020, T021 (US2) y T023, T024, T025, T026 (US3) son trabajos sobre archivos distintos → puede dividirse en dos sesiones paralelas si hay dos personas. En solo, secuenciar US2 → US3.

### Polish paralelo

- T029 (`.github/copilot-instructions.md`), T030 (link checker), T031 (grep markers) tocan archivos/comandos disjuntos → pueden correrse en cualquier orden tras Phase 5.

---

## Implementation Strategy

### MVP scope (entregable mínimo viable)

**Phases 1 + 2 + 3 (US1)**. Esto es suficiente para mergear el sitio en estado seguro y cumplir el objetivo principal de la spec antes del 18 de mayo. Los visitantes ven el teaser, no hay URLs sensibles, gates pasan.

### Incremental delivery

1. **Iteración 1 (MVP)**: completar Phase 1 → 2 → 3. Abrir PR, mergear. Sitio queda en `teaser`.
2. **Iteración 2**: completar Phase 4 (US2). Agregar runbook al README. Validar dry-run. Mergear como follow-up.
3. **Iteración 3**: completar Phase 5 (US3) si pa11y/Lighthouse no se ejecutaron como blocker en iteración 1 (idealmente sí). Aplicar correcciones a11y si aparecen.
4. **Iteración 4**: completar Phase 6 (Polish) y abrir PR final / consolidado.

> Operativamente recomendado: **un solo PR con Phases 1–6 en cascada**, dado el tamaño reducido de la feature (~30–60 líneas de código real). Las "iteraciones" se conservan como puntos de revisión interna, no como PRs separados.

### Liberación post-charla (no es parte de este PR)

El PR de liberación (`release/talk-published`) se ejecuta el 2026-05-18 siguiendo §2 de [quickstart.md](specs/002-techno-week-coming-soon/quickstart.md). Ese PR no tiene tareas en este `tasks.md` porque está fuera del alcance de spec 002 (que entrega el estado `teaser` y el mecanismo, no la transición).

---

## Format validation

Todas las tareas siguen el formato `- [ ] T### [P?] [Story?] Descripción con ruta`:

- ✅ Setup (T001–T004): sin `[Story]`, con `[P]` donde aplica.
- ✅ Foundational (T005–T011): sin `[Story]`, con `[P]` donde aplica.
- ✅ US1 (T012–T018): todas con `[US1]`.
- ✅ US2 (T019–T022): todas con `[US2]`.
- ✅ US3 (T023–T028): todas con `[US3]`.
- ✅ Polish (T029–T034): sin `[Story]`, con `[P]` donde aplica.
- ✅ Cada tarea referencia archivos por ruta workspace-relativa con links markdown válidos.

**Total tareas**: 34.  
**Por user story**: US1 = 7, US2 = 4, US3 = 6, compartidas/setup/foundational/polish = 17.  
**Paralelizables**: 11 marcadas `[P]`.  
**MVP**: T001–T018 (Phases 1–3). El resto es polishing y validación.
