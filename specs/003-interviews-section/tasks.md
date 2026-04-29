# Tasks: Sección de Entrevistas (Blog estático navegable)

**Input**: Design documents from [`specs/003-interviews-section/`](.)
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Tests no fueron solicitados como TDD en la spec. Se incluyen únicamente las gates automatizadas exigidas por la constitución (a11y, html-validate, XSS, size budget) y fixtures de validación del generador. No se generan tareas de unit tests adicionales.

**Organization**: Tareas agrupadas por fase y user story. US1 + US2 son P1 y comparten artefactos físicos del generador (US2 produce el índice consumido por la búsqueda de US3); se ordenan secuencialmente para entregar MVP coherente. US3 (P2) depende del `index.json` que produce US2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: US1, US2, US3 (omitido en Setup, Foundational, Polish)
- Rutas absolutas o relativas al repo siempre incluidas

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar el repo para soportar el pipeline de generación.

- [X] T001 Crear estructura de directorios: `content/interviews/`, `content/interviews/images/`, `content/interviews/__fixtures__/`, `scripts/`, e `interviews/` (vacío) en la raíz del repo
- [X] T002 Agregar `devDependencies` (`gray-matter@^4`, `marked@^12`, `dompurify@^3`, `jsdom@^24`) en `package.json` y regenerar `package-lock.json` con `npm install`
- [X] T003 [P] Agregar reglas a `.gitignore` para artefactos generados: `interviews/*.html`, `interviews/index.html`, `interviews/index.json`, `interviews/images/` (directorio gitignored porque se copia en build; las imágenes fuente viven en `content/interviews/images/`)
- [X] T004 [P] Crear `content/interviews/README.md` con la convención de autoría (resumen del runbook A de [quickstart.md](quickstart.md))

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: el generador y los assets compartidos. Sin esto ninguna user story puede emitir HTML.

**⚠️ CRITICAL**: ninguna tarea de US1/US2/US3 puede empezar hasta completar esta fase.

- [X] T005 Crear `scripts/build-interviews.js` con CLI: flags `--strict`, `--include-fixtures`, `--out <dir>`, `--dry-run`. Esqueleto que: lee `content/interviews/*.md`, valida frontmatter contra [contracts/frontmatter-schema.md](contracts/frontmatter-schema.md), emite errores formato `[error] <file>: <issue> (field='<path>')`, retorna exit 1 en `--strict` con errores
- [X] T006 En `scripts/build-interviews.js`, implementar parser de frontmatter usando `gray-matter` y validador completo de campos (title, interviewee.{name,role,company,image?,linkedin?}, date, tags, summary, published) según [contracts/frontmatter-schema.md](contracts/frontmatter-schema.md)
- [X] T007 En `scripts/build-interviews.js`, implementar pipeline Markdown → HTML: `marked` con `gfm:true`, `mangle:false`, `headerIds:true`, custom renderer que escapa HTML inline, headings empezando en `<h2>` (decisión R-002 de [research.md](research.md))
- [X] T008 En `scripts/build-interviews.js`, integrar `dompurify` + `jsdom` con whitelist conservadora: `ALLOWED_TAGS`, `ALLOWED_ATTR`, `ALLOWED_URI_REGEXP=/^(?:https?:|mailto:|#)/i`, `FORBID_TAGS`, `FORBID_ATTR` según R-004 y [contracts/csp-policy.md](contracts/csp-policy.md)
- [X] T009 En `scripts/build-interviews.js`, implementar `escapeHtml(value)` (4 líneas, sin deps) y derivar `readingTime = Math.max(1, Math.ceil(words/220))` excluyendo bloques fenced de code (R-007)
- [X] T010 En `scripts/build-interviews.js`, implementar derivación de slug desde filename (`YYYY-MM-<slug>.md` o basename), validar contra `^[a-z0-9-]{1,80}$`, garantizar unicidad
- [X] T011 [P] Crear fixture `content/interviews/__fixtures__/valid-minimal.md` con frontmatter mínimo válido y body de 50–80 palabras
- [X] T012 [P] Crear fixture `content/interviews/__fixtures__/invalid-missing-title.md` (frontmatter sin `title`) — debe causar error en `--strict`
- [X] T013 [P] Crear fixture `content/interviews/__fixtures__/xss-attempt.md` con `<script>alert(1)</script>`, `[link](javascript:alert(1))`, `<a href="javascript:alert(1)">`, `<img src=x onerror=alert(1)>` en el cuerpo
- [X] T014 [P] Crear `assets/css/interviews.css` con selectores específicos de la sección (interview-page, interviews-page, interview-card, interview-tag, interviews-controls, interviews-search, interviews-tag-filter, interviews-clear, interviews-count, interviews-empty, interview-avatar, interview-author, interview-tags, interview-body) — usando exclusivamente tokens de [assets/css/tokens.css](../../assets/css/tokens.css). Mobile-first.
- [X] T015 [P] Crear `assets/js/interviews.js` (vanilla, `defer`): `fetch('/interviews/index.json')`, normalize NFD, render lista, chips de tags, debounce 80ms, aria-live updates, soporte `?tag=` en URL — según [contracts/index-html-template.md](contracts/index-html-template.md) y R-008
- [X] T016 Agregar entrada `<li><a href="/interviews/">Entrevistas</a></li>` al `<ul class="nav-links">` en `index.html`, `talks/index.html`, y `blog/index.html` — entre "Charla" y "About" (R-013)

**Checkpoint**: el generador es ejecutable y puede emitir HTML para una entrevista de fixture; el shell del listado puede cargar `index.json`.

---

## Phase 3: User Story 1 — Lector accede a una entrevista publicada (Priority: P1) 🎯 MVP

**Goal**: ante una URL `/interviews/<slug>.html` un visitante recibe la entrevista con metadata, foto/avatar, cuerpo legible, y CSP estricta.

**Independent Test**: con `valid-minimal.md` como fuente, ejecutar `node scripts/build-interviews.js --strict --include-fixtures --out _site/interviews/`; abrir `_site/interviews/<slug>.html` en el navegador y validar visualmente título, autor, foto/avatar, fecha, reading time, tags. `npx html-validate _site/interviews/<slug>.html` → 0 errores. `node tests/a11y.js` con esa URL → 0 violations.

### Implementation for User Story 1

- [X] T017 [US1] En `scripts/build-interviews.js`, implementar template `renderInterviewHtml(interview)` siguiendo [contracts/interview-html-template.md](contracts/interview-html-template.md): `<!DOCTYPE html>`, `<html lang="es">`, head con CSP idéntica al sitio, link a stylesheets, JSON-LD Article
- [X] T018 [US1] En `scripts/build-interviews.js`, integrar `<header class="site-header">` y `<footer class="site-footer">` extraídos como string constante desde [index.html](../../index.html) (replicación textual, sin includes; el item nav "Entrevistas" se marca con `aria-current="page"` solo en surfaces de la sección)
- [X] T019 [US1] En `scripts/build-interviews.js`, implementar render de avatar: `<img>` cuando `interviewee.image` existe; `<svg role="img" aria-label="Avatar de {name}">` con iniciales + color `--accent-dim` cuando ausente (R-011)
- [X] T020 [US1] En `scripts/build-interviews.js`, implementar emisión de archivo: escribir HTML en `<out>/<slug>.html`, copiar `content/interviews/images/<slug>.*` a `<out>/images/<slug>.*` cuando aplique
- [X] T021 [US1] En `scripts/build-interviews.js`, formatear `date` humano en español (`15 de mayo de 2026`) usando `Intl.DateTimeFormat('es', { dateStyle: 'long' })`; mantener `<time datetime="YYYY-MM-DD">`
- [X] T022 [US1] [P] Crear `tests/interviews-xss.sh` ejecutable: tras build con `--include-fixtures`, ejecuta `grep -niE 'alert\(1\)|javascript:|onerror=|<script[^>]*>(?!.*application/ld\+json)' _site/interviews/<xss-fixture-slug>.html` — fail si hay match
- [X] T023 [US1] Extender `tests/a11y.js` para incluir `http://localhost:3000/interviews/<smoke-slug>.html` (slug de la fixture válida) en el array de URLs auditadas
- [X] T024 [US1] Validar manualmente: ejecutar `node scripts/build-interviews.js --strict --include-fixtures --out _site/interviews/` y verificar (a) HTML emitido contiene CSP exacta de [contracts/csp-policy.md](contracts/csp-policy.md), (b) `<h1>` único, (c) `<article aria-labelledby>`, (d) JSON-LD válido, (e) tras `npx html-validate _site/interviews/*.html` → 0 errores

**Checkpoint**: User Story 1 es funcional. Cualquier `.md` válido produce una página individual conforme.

---

## Phase 4: User Story 2 — Visitante explora el índice cronológico de entrevistas (Priority: P1)

**Goal**: la página `/interviews/` lista todas las entrevistas publicadas en orden cronológico desc, con metadata mínima y links a las páginas individuales.

**Independent Test**: con al menos 2 entrevistas válidas (fixtures o reales), ejecutar build; abrir `_site/interviews/index.html` y verificar (a) ambas listadas en orden por fecha desc, (b) link a cada `<slug>.html` funciona, (c) `index.json` se descarga con contenido conforme a [contracts/index-json-schema.md](contracts/index-json-schema.md), (d) item "Entrevistas" en nav con `aria-current="page"`.

### Implementation for User Story 2

- [X] T025 [US2] En `scripts/build-interviews.js`, implementar `renderIndexJson(interviews)` produciendo JSON conforme a [contracts/index-json-schema.md](contracts/index-json-schema.md): `version:1`, `generated` ISO, array `interviews` ordenado por `date` desc, sin `bodyHtml`. Serializar con `JSON.stringify(obj)` (sin pretty-print)
- [X] T026 [US2] En `scripts/build-interviews.js`, implementar `renderIndexHtml()` siguiendo [contracts/index-html-template.md](contracts/index-html-template.md): shell con `<header>`, hero, controles (search input, tag-filter group, clear button), `<ul id="interviews-list">` vacío, `<p id="interviews-count" aria-live="polite">`, `<noscript>`, `<script src="/assets/js/interviews.js" defer>`. NO renderizar items en server-side (los pinta `interviews.js` desde `index.json`)
- [X] T027 [US2] En `scripts/build-interviews.js`, emitir `<out>/index.html` y `<out>/index.json` desde el flujo principal del CLI; integrar conteo final en stdout (`✓ 7 interviews emitted, index.json: 6.2KB`)
- [X] T028 [US2] En `assets/js/interviews.js`, implementar carga inicial: `fetch('/interviews/index.json', { credentials:'omit' })`, render de cards en `<ul id="interviews-list">` ordenadas por date desc, conteo inicial en `#interviews-count`
- [X] T029 [US2] [P] Crear `tests/interviews-size.sh` ejecutable: `wc -c < _site/interviews/index.json`; fail si > 102400 bytes
- [X] T030 [US2] Extender `tests/a11y.js` para incluir `http://localhost:3000/interviews/` en la lista
- [X] T031 [US2] Validar manualmente: con 2+ fixtures válidas (crear una segunda fixture mínima si necesario en `__fixtures__/valid-second.md` con date distinta), ejecutar build, abrir `index.html` localmente con `npx serve .`, verificar orden, navegación, contador, y que `npx html-validate _site/interviews/index.html` → 0 errores

**Checkpoint**: US1 + US2 son MVP funcional. Un autor puede publicar entrevistas y un lector puede descubrirlas y leerlas.

---

## Phase 5: User Story 3 — Visitante busca y filtra entrevistas (Priority: P2)

**Goal**: en la página `/interviews/` el visitante puede tipear texto libre y/o seleccionar tags para filtrar la lista en vivo, sin recarga.

**Independent Test**: con ≥ 5 entrevistas válidas, abrir `/interviews/`, tipear parte del nombre de un entrevistado → la lista se reduce a coincidencias en < 100ms. Click en un chip de tag → filtra. Click en "Limpiar" → restaura. Probar `/interviews/?tag=devops` → chip activo + lista filtrada al cargar.

### Implementation for User Story 3

- [X] T032 [US3] En `assets/js/interviews.js`, implementar `normalize(s)` (NFD + strip diacritics + lowercase) y función `matches(item, query, activeTags)` que aplica AND entre query y tags, OR entre tags
- [X] T033 [US3] En `assets/js/interviews.js`, render de chips de tags: agrupar todos los tags del index, contar frecuencias, ordenar desc, top 20, emitir `<button type="button" aria-pressed="false" data-tag="X">#X</button>`
- [X] T034 [US3] En `assets/js/interviews.js`, wire-up del input de búsqueda con debounce 80ms, click en chips toggleando `aria-pressed`, click en "Limpiar" reseteando todo, sincronización con `?tag=` y `?q=` en `URLSearchParams` (sin push history en cada keystroke; solo replaceState)
- [X] T035 [US3] En `assets/js/interviews.js`, manejar estado vacío: ocultar `<ul>`, mostrar `#interviews-empty`, actualizar `#interviews-count` con `aria-live="polite"`
- [X] T036 [US3] Validar performance manualmente: con 20 fixtures sintéticas (script puntual o duplicación temporal), medir tiempo de keystroke→re-render con DevTools Performance ≤ 100ms (SC-004); revertir las fixtures sintéticas tras validar
- [X] T037 [US3] Validar manualmente: tab order funcional (skip → nav → search → chips → clear → cards), foco visible en cada elemento, lector de pantalla anuncia cambios de count vía `aria-live`

**Checkpoint**: las 3 user stories son funcionales e independientes.

---

## Phase 6: CI Integration & Polish

**Purpose**: cerrar las gates, integrar con el pipeline de Pages, y refinar.

- [X] T038 Modificar [.github/workflows/pages-deploy.yml](../../.github/workflows/pages-deploy.yml): agregar steps `Setup Node` (v20, cache npm), `npm ci`, `node scripts/build-interviews.js --strict --out interviews/` ANTES del `Stage site`/rsync existente. Verificar que el rsync existente NO excluye `interviews/`
- [X] T039 Modificar [.github/workflows/ci.yml](../../.github/workflows/ci.yml): agregar job `build-interviews` (Setup Node, `npm ci`, `node scripts/build-interviews.js --strict --include-fixtures --out _site/interviews/`); agregar jobs dependientes `interviews-xss` (`bash tests/interviews-xss.sh`) e `interviews-size` (`bash tests/interviews-size.sh`). Asegurar que el job a11y existente arranca un servidor que sirva `_site/` o el repo con los artefactos generados
- [X] T040 [P] Asegurar que el job `html-validate` existente en `ci.yml` audita también `_site/interviews/**/*.html` (extender el patrón de `npx html-validate`)
- [X] T041 [P] Actualizar `tests/links.config.toml` (lychee) para incluir las URLs de la sección `/interviews/` y al menos una individual cuando exista una entrevista real publicada (omitible si la sección queda vacía hasta que se publique la primera entrevista)
- [X] T042 [P] Actualizar `sitemap.xml` para incluir entradas dinámicas de `/interviews/` y cada `/interviews/<slug>.html`. Implementar generación en `scripts/build-interviews.js` que produzca un sitemap parcial `_site/interviews/sitemap.xml` o que extienda el sitemap raíz (decisión: emitir `_site/interviews/sitemap.xml` separado, referenciado desde un sitemap index si existe; si no existe, mantener `sitemap.xml` raíz manual con un comentario `<!-- /interviews/ entries appended at build -->`)
- [X] T043 [P] Actualizar [README.md](../../README.md) agregando una sección "Entrevistas" con link a [quickstart.md](quickstart.md) y resumen del flujo editorial
- [X] T044 Ejecutar end-to-end del runbook B de [quickstart.md](quickstart.md) localmente: build → html-validate → a11y → size gate → xss gate, todos en verde
- [X] T045 Verificar que ningún archivo de `interviews/*.html`, `interviews/index.html`, `interviews/index.json` quedó accidentalmente trackeado por git (`git status --porcelain interviews/ | grep -v '^!!' && exit 1 || true`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sin dependencias.
- **Phase 2 (Foundational)**: depende de Phase 1. **Bloquea US1, US2, US3.**
- **Phase 3 (US1)**: depende de Phase 2.
- **Phase 4 (US2)**: depende de Phase 2. Independiente de US1 a nivel funcional, pero comparte `build-interviews.js` (mismo archivo, edits secuenciales).
- **Phase 5 (US3)**: depende de Phase 4 (necesita `index.json` y la página índice ya operando con render inicial).
- **Phase 6 (CI/Polish)**: depende de Phases 3–5 completas.

### Within-Story Dependencies

- US1: T017 → T018 → T019 → T020 (todos en `build-interviews.js`, secuencial). T021 puede entremezclarse. T022 [P] (archivo separado). T023 [P] (archivo separado). T024 al final.
- US2: T025 → T026 → T027 (mismo archivo, secuencial). T028 (`assets/js/interviews.js`, paralelizable con tareas de `build-interviews.js`). T029 [P]. T030 [P]. T031 al final.
- US3: T032 → T033 → T034 → T035 (mismo archivo `assets/js/interviews.js`, secuencial). T036 y T037 al final.

### Parallel Opportunities

- Phase 1: T003 || T004.
- Phase 2: T011 || T012 || T013 || T014 || T015. T005–T010 son secuenciales (mismo archivo `build-interviews.js`); T016 puede solaparse con cualquiera.
- Phase 3: T022 || T023 con tareas de `build-interviews.js` (archivo distinto).
- Phase 4: T029 || T030 con tareas de `build-interviews.js`/`interviews.js`.
- Phase 6: T040 || T041 || T042 || T043 una vez T038 y T039 estén planteados.

### Cross-Story Parallelization

Tras Phase 2, US1 y US2 podrían iniciarse en paralelo solo si dos personas trabajan en archivos distintos (US1 ⇒ secciones de `build-interviews.js` que producen HTML individual; US2 ⇒ secciones de index.json + index.html y `assets/js/interviews.js` carga inicial). En la práctica con un solo desarrollador, ejecutar US1 → US2 → US3 secuencialmente.

---

## Implementation Strategy

### MVP scope (mínimo deployable)

Phases 1, 2, 3, 4 + T038 + T039 + T040 + T044. Esto entrega US1 + US2 (ambas P1) en producción con CI verde. US3 puede merger en una segunda iteración.

### Incremental delivery

1. **Iteración 1 (MVP)**: Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → CI integration esencial (T038, T039, T040) → T044. Deploy.
2. **Iteración 2**: Phase 5 (US3). Deploy.
3. **Iteración 3**: Pulido (T041, T042, T043, T045) + creación de las primeras entrevistas reales del backlog.

### Risk mitigation

- T013 (fixture XSS) + T022 (`tests/interviews-xss.sh`) deben quedar funcionales antes de que cualquier entrevista real se mergee, para garantizar la gate de seguridad.
- T029 (size gate) debe quedar funcional antes de mergear ≥ 5 entrevistas reales.
- T038 puede romper el deploy de Pages si el rsync excluye accidentalmente `interviews/`. Validar primero en una rama de prueba.

---

## Format Validation

Todas las tareas siguen `- [ ] T### [P?] [Story?] Descripción con ruta`. Verificable con:

```bash
grep -nE '^- \[ \] T[0-9]{3}' specs/003-interviews-section/tasks.md | wc -l
# debe coincidir con el conteo total (45)
```

## Resumen

- **Total tasks**: 45
- **Setup**: 4 (T001–T004)
- **Foundational**: 12 (T005–T016)
- **US1**: 8 (T017–T024)
- **US2**: 7 (T025–T031)
- **US3**: 6 (T032–T037)
- **CI/Polish**: 8 (T038–T045)
- **Parallelizable [P]**: 14 tareas
- **MVP scope**: T001–T031 + T038 + T039 + T040 + T044 (≈ 35 tareas)
