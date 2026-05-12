---

description: "Task list for Sección 'Blog' (spec 006)"
---

# Tasks: Sección "Blog" en landing + página `/blog/` refactorizada

**Input**: Design documents from `/specs/006-blog-section/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: la spec NO solicita TDD ni tests unitarios; sí solicita explícitamente fixtures negativas para la gate `blog-build-check` ([contracts/ci-gate.md](contracts/ci-gate.md) §2) y validación XSS post-sanitización. Esos fixtures son tareas de implementación, no tests opcionales.

**Organization**: tareas agrupadas por user story (US1..US5) para entrega incremental, siguiendo el patrón de [spec 005 tasks.md](../005-pipeline-section/tasks.md).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: paralelizable (diferente archivo, sin dependencias pendientes).
- **[Story]**: US1..US5 cuando aplica; setup/foundational/polish sin etiqueta.
- Cada tarea incluye paths workspace-relativos (ej. `index.html`, `scripts/build-blog.js`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: scaffolding mínimo del feature antes de tocar nada compartido. Cero dependencias nuevas — todo el toolchain (`marked`, `dompurify`, `jsdom`, `gray-matter`) ya está en `package.json` desde spec 003.

- [X] T001 Verify active branch is `006-blog-section` and clean working tree (run `git branch --show-current && git status --short` from repo root). Abort if branch differs.
- [X] T002 Verify zero new runtime/devDeps required: `node -e "const p=require('./package.json'); ['marked','dompurify','jsdom','gray-matter'].forEach(d=>{ if(!p.devDependencies[d]) throw new Error('missing '+d) }); console.log('ok')"` debe imprimir `ok`. NO correr `npm install` con paquetes nuevos en ningún momento de este feature ([plan.md](plan.md) §Technical Context, constitución IV).
- [X] T003 [P] Create `content/blog/` directory (if not exists) and `content/blog/__fixtures__/` for negative fixtures. Add `.gitkeep` en `__fixtures__/` si quedará temporalmente vacío hasta US3.
- [X] T004 [P] Add npm script `build:blog` to `package.json` → `"build:blog": "node scripts/build-blog.js"`. NO modificar `devDependencies`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: build script core + estilos base que TODAS las US dependen. Sin esto, ninguna US puede implementarse.

⚠️ **CRITICAL**: T005–T011 deben completarse antes de iniciar cualquier US.

- [X] T005 Create `scripts/build-blog.js` skeleton — header CLI, argv parser para flags `--check`, `--check-only-validation`, `--input <path>`, `--emit-sanitized`. Imports de `node:fs`, `node:path`, `node:crypto`, `gray-matter`, `marked`, `jsdom`, `dompurify`. Exit codes: 0 ok, 1 fallo. Helper `escapeHTML()` (`& < > " '`). Stub de `main()` que solo imprime args parseados.
- [X] T006 Implement frontmatter validator en `scripts/build-blog.js` — función `validatePost(file, raw)` que aplica el schema completo de [contracts/frontmatter-schema.md](contracts/frontmatter-schema.md) y [data-model.md](data-model.md) §Entidad 1: `title` (1..120, no newlines), `date` (`^\d{4}-\d{2}-\d{2}$` + calendar válido), `slug` (`^[a-z0-9-]{1,80}$`, único entre todos los posts), `summary` (20..280 chars Unicode), `tags` (array, cada uno `^[a-z0-9-]{1,32}$`, máx 10), `published` (boolean exacto). Mensajes de error en formato `[error] <file>: <issue>` ([contracts/ci-gate.md](contracts/ci-gate.md) §1).
- [X] T007 Implement collection loader en `scripts/build-blog.js` — `loadAllPosts()` que (a) escanea `content/blog/*.md` (excluyendo `__fixtures__/`), (b) parsea con `gray-matter`, (c) corre `validatePost` por cada uno, (d) verifica que el filename matchea `YYYY-MM-<slug>.md` y el sufijo coincide con `slug` (warning, no fail), (e) detecta duplicate-slug entre todos los posts (fail), (f) construye `BlogPostCollection` con `posts`, `published` (filtra `published===true` y descarta fechas futuras según R-010), `recent` (top 3 de `published`). Orden: desc por `date`, desempate por `slug` asc ([data-model.md](data-model.md) §Entidad 2).
- [X] T008 Implement reading-time helper en `scripts/build-blog.js` — `computeReadingTime(bodyMd)` aplica heurística R-004 (200 wpm sobre texto plano del body, redondeo `Math.max(1, Math.ceil(words/200))`). Strip frontmatter ya removido por gray-matter; strip HTML inline y fences de código antes de contar palabras.
- [X] T009 Implement sanitizer en `scripts/build-blog.js` — `sanitizeHtml(rawHtml)` que (a) crea `JSDOM` window, (b) instancia `DOMPurify(window)`, (c) aplica config exacta de [contracts/sanitizer-whitelist.md](contracts/sanitizer-whitelist.md) §1–§5 (`ALLOWED_TAGS`, `ALLOWED_ATTR`, `ALLOW_DATA_ATTR: true`, `ALLOWED_URI_REGEXP`, `FORBID_TAGS`, `FORBID_ATTR`, `KEEP_CONTENT: true`), (d) aplica post-proceso de `<a>` (§6: external `target="_blank" rel="noopener noreferrer"`).
- [X] T010 Implement render functions en `scripts/build-blog.js` — `renderLandingBlock(recent)` (output exacto de [contracts/render-contract.md](contracts/render-contract.md) §1, incluye marcadores `<!-- blog:start -->`/`<!-- blog:end -->`, caso vacío con `.post-empty`), `renderBlogIndex(published)` (output exacto §2 — HTML completo con `<head>`/CSP/nav/footer copiados del landing), `renderPostPage(post)` (output exacto §3 — incluye OpenGraph, canonical, CSP meta de [contracts/csp-policy.md](contracts/csp-policy.md), body sanitizado vía T009).
- [X] T011 [P] Add base CSS in `assets/css/components.css` para todas las clases nuevas: `.post-list`, `.post-list--landing`, `.post-list--index`, `.post-card`, `.post-card-header`, `.post-card-title`, `.post-meta`, `.post-meta-sep`, `.post-date`, `.post-reading-time`, `.post-summary`, `.post-tags`, `.post-tag`, `.blog-intro`, `.blog-see-all`, `.blog-see-all-link`, `.post-empty`, `.post-article`, `.post-article-header`, `.post-article-title`, `.post-article-body`, `.post-article-footer`, `.post-back-link`, `.post-stats`, `.about-portrait`. Solo `var(--*)` tokens, sin colores hardcoded; layout mobile-first; `.post-stats` reusa `.stat-card` ya existente. Verificar que `.about-portrait` tiene `border-radius: 50%`, `width:256px`, `height:256px`, `max-width:100%`, `object-fit:cover`.

**Checkpoint**: el script puede validar/sanitizar/render en memoria; el CSS soporta todas las clases. Las US ahora pueden avanzar.

---

## Phase 3: User Story 1 — Visitante lee posts firmados desde el landing (Priority: P1) 🎯 MVP

**Goal**: el landing muestra la sección `#blog` con los 3 posts más recientes (cards con título, fecha, reading time, tags, summary + link "Ver todos"); el primer post real (`pipeline-seguridad-spec-driven`) existe como `blog/<slug>.html` con stat cards inline sanitizadas.

**Independent Test**: cargar `index.html` → desplazarse a `#blog` → confirmar 3 cards (o N<3 si hay menos) + link "Ver todos los posts →" hacia `/blog/`. Click en el primer post → cargar `blog/pipeline-seguridad-spec-driven.html` → ver título, fecha, reading time, tags, contenido en primera persona y las 4 stat cards técnicas (7 / $0 / 100% / <5 min) renderizadas inline con estilo consistente.

### Implementation for User Story 1

- [X] T012 [US1] Implement `--write` (default) mode en `scripts/build-blog.js` — `writeAll(collection)` que (a) lee `index.html`, localiza marcadores `<!-- blog:start -->`/`<!-- blog:end -->`, reemplaza el bloque con `renderLandingBlock(recent)`, escribe in-place; (b) escribe `blog/index.html` con `renderBlogIndex(published)`; (c) por cada post de `published` escribe `blog/<slug>.html` con `renderPostPage(post)`; (d) elimina `blog/<slug>.html` huérfano (sin `.md` publicado correspondiente, excluyendo `index.html`). Imprime resumen `blog-build: ✓ rendered N published post(s) — index.html (N cards), blog/index.html (N entries), blog/<slug>.html × N` + `blog-build: removed K orphan file(s)` si aplica. Si faltan los marcadores, exit 1 con el mensaje exacto de [contracts/ci-gate.md](contracts/ci-gate.md) §1.
- [X] T013 [US1] Modify `index.html` — eliminar el bloque actual `<section id="security-pipeline">` (líneas 188-216 según spec) y reemplazar con un par de marcadores `<!-- blog:start -->` / `<!-- blog:end -->` y un fragmento placeholder mínimo entre ellos (será sobrescrito por T015). Actualizar nav (línea correspondiente) para reemplazar cualquier enlace previo a `#security-pipeline` por `<li><a href="/blog/">Blog</a></li>` (FR-018, I-9).
- [X] T014 [US1] Create `content/blog/2026-05-pipeline-seguridad-spec-driven.md` — primer post real con frontmatter completo: `title: "Cómo construí mi pipeline de seguridad spec-driven"`, `date: 2026-05-11`, `slug: pipeline-seguridad-spec-driven`, `summary` (20..280 chars en español), `tags: [devsecops, github-actions, spec-driven]`, `published: true`. Body en primera persona narrando las 7 herramientas/etapas (Spectral, Semgrep, Gitleaks, npm audit, OWASP ZAP, Custom Action de compliance, CodeQL/GHAS) como decisiones de diseño (FR-030). Embeber inline el bloque normativo `<div class="post-stats">…</div>` de [contracts/sanitizer-whitelist.md](contracts/sanitizer-whitelist.md) §7 con las 4 stat cards técnicas (FR-031).
- [X] T015 [US1] Run `node scripts/build-blog.js` (write mode) y verificar: (a) `index.html` se reescribió con la nueva sección `#blog` entre los markers, (b) `blog/pipeline-seguridad-spec-driven.html` existe y abre correctamente, (c) `blog/index.html` se regeneró (será refinado en US2), (d) las stat cards inline aparecen intactas tras sanitización (verificar por inspección del HTML emitido). Capturar diff con `git diff -- index.html`.
- [X] T016 [US1] Run `npx html-validate index.html blog/pipeline-seguridad-spec-driven.html` y confirmar 0 errores. Si fallan reglas (heading hierarchy, atributos), corregir el render de T010 antes de seguir.
- [X] T017 [US1] Mobile smoke check (320 / 360 / 768 px) en `npx serve -l 8080 .` — verificar (a) sin scroll horizontal en `#blog` del landing, (b) las 3 (o menos) cards de post legibles, (c) el link "Ver todos" alcanzable, (d) en `blog/pipeline-seguridad-spec-driven.html` las stat cards inline degradan a 1 columna sin desbordamiento (edge case spec).
- [X] T018 [US1] Run `bash tests/no-placeholders.sh` y `bash tests/forbidden-urls.sh` — el contenido del primer post NO debe introducir placeholders prohibidos ni URLs prohibidas.

**Checkpoint US1**: el landing tiene la sección `#blog` viva con cards reales, hay un post individual servible y validado, html-validate verde, mobile OK, gates de specs anteriores siguen verdes. **MVP entregable** (US2 sigue inmediatamente para que el link "Ver todos" tenga destino real).

---

## Phase 4: User Story 2 — Visitante explora todo el blog en /blog/ (Priority: P1)

**Goal**: `/blog/index.html` lista todos los posts publicados ordenados desc por fecha, con el mismo header/nav/footer del sitio; el nav superior en todas las páginas apunta a `/blog/`.

**Independent Test**: navegar a `/blog/` directamente → confirmar listado completo de posts publicados con título (`<h2>`), fecha, reading time, tags y summary; ordenados desc por fecha. Verificar que el nav superior muestra "Blog" y enlaza a `/blog/` (no a `#blog`). Si todos los posts tienen `published:false`, ver estado vacío respetuoso.

### Implementation for User Story 2

- [X] T019 [US2] Verify `blog/index.html` regenerado por T015 cumple [contracts/render-contract.md](contracts/render-contract.md) §2 — `<h1 id="blog-index-heading">`, `<ul class="post-list post-list--index">`, cards con `<h2 class="post-card-title">`, header/nav/footer copiados literalmente del landing, CSP meta correcta, `<link rel="canonical" href="https://ardops.dev/blog/">`. Si difiere, ajustar `renderBlogIndex()` en T010 y rebuild.
- [X] T020 [US2] Update nav en otras páginas servibles (`talks/index.html`, `interviews/index.html`, `interviews/victor-ardon.html`, `404.html`, `legacy/index.html` si aplica) para que el enlace "Blog" apunte a `/blog/`. Verificar con `grep -nE 'href="[^"]*#?blog' index.html blog/index.html talks/index.html interviews/index.html 404.html` que ninguno apunta a `#blog` o `#security-pipeline`.
- [X] T021 [US2] Empty-state smoke check: cambiar `published: true` → `published: false` temporalmente en `content/blog/2026-05-pipeline-seguridad-spec-driven.md`, correr `node scripts/build-blog.js`, validar que (a) `index.html` muestra `<p class="post-empty">Aún no hay posts publicados — pronto.</p>`, (b) `blog/index.html` muestra `<p class="post-empty">Aún no hay posts publicados. Volvé pronto.</p>`, (c) `blog/pipeline-seguridad-spec-driven.html` fue eliminado por el script. Restaurar `published: true` y rebuild.
- [X] T022 [US2] Update `npm run html-validate` script en `package.json` para incluir `blog/pipeline-seguridad-spec-driven.html` en la lista validada. Re-correr `npm run html-validate` y confirmar 0 errores en `index.html`, `blog/index.html`, `blog/pipeline-seguridad-spec-driven.html`, `talks/index.html`, `404.html`.
- [X] T023 [US2] Verify sitemap — agregar entries para `/blog/` y `/blog/pipeline-seguridad-spec-driven.html` a `sitemap.xml` si no existen ya por descubrimiento dinámico. `grep -nE 'blog' sitemap.xml` para auditar.

**Checkpoint US2**: `/blog/` es el índice real del blog; el nav superior apunta consistentemente a `/blog/`; estado vacío funciona; html-validate verde sobre todas las superficies.

---

## Phase 5: User Story 3 — Mantenedor agrega un post nuevo sin tocar HTML (Priority: P2)

**Goal**: agregar/editar/quitar posts es una operación de un commit en `content/blog/` + rebuild; el CI detecta drift entre `.md` y HTML emitido; fixtures negativas garantizan que frontmatter inválido o XSS en body son rechazados.

**Independent Test**: (a) crear `content/blog/2026-06-test-post.md` válido → rebuild → ver el post aparecer en landing (si entra en top 3), `/blog/` y `blog/test-post.html`, sin tocar otros archivos; borrar el `.md`, rebuild, ver que desaparece. (b) Inyectar fixture `invalid-duplicate-slug.md` → `--check-only-validation` debe fallar exit 1. (c) Modificar un `.md` sin regenerar HTML → `--check` falla con mensaje accionable. (d) `xss-attempt.md` se procesa pero el HTML resultante NO contiene `<script>`, `onerror=`, `javascript:`, `<iframe>`, `style=`, `<form>`.

### Implementation for User Story 3

- [X] T024 [US3] Implement `--check` flag en `scripts/build-blog.js` — modo dry-run según [contracts/ci-gate.md](contracts/ci-gate.md) §1: re-genera todas las salidas en memoria, compara byte-a-byte (a) bloque entre markers de `index.html`, (b) `blog/index.html` completo, (c) cada `blog/<slug>.html` para posts publicados, (d) verifica ausencia de huérfanos. Exit 0 si todo coincide, exit 1 al primer mismatch con diff acotado en stderr y mensaje exacto del contracts (`blog-build: <file> is out of sync — run 'node scripts/build-blog.js' and commit.`).
- [X] T025 [US3] Implement `--check-only-validation` y `--input <path>` flags en `scripts/build-blog.js` — corre solo parse YAML + `validatePost` + sanitización dry-run sobre el `.md` indicado, sin tocar disco. Exit ≠ 0 al primer error. Implement también `--emit-sanitized` (escribe el HTML sanitizado a stdout) para soporte del paso XSS de `tests/blog-schema.sh`.
- [X] T026 [P] [US3] Create fixtures en `content/blog/__fixtures__/` (mínimo según [contracts/ci-gate.md](contracts/ci-gate.md) §2):
  - `valid-minimal.md` — post válido mínimo, `slug: test-foo` (par para duplicate-slug, no se ejecuta como negativo)
  - `invalid-missing-title.md` — sin `title`
  - `invalid-bad-date.md` — `date: 2026-13-01`
  - `invalid-duplicate-slug.md` — mismo `slug: test-foo` que `valid-minimal.md`
  - `invalid-summary-too-short.md` — summary `"hi"` (2 chars)
  - `invalid-summary-too-long.md` — summary > 280 chars
  - `invalid-published-not-bool.md` — `published: "true"` (string)
  - `xss-attempt.md` — body con `<script>alert(1)</script>`, `<a href="javascript:...">`, `<img src=x onerror=...>`, `<iframe>`, `<form>`, `<button onclick>`, `<div style=>`, `<a href="vbscript:...">`
  Cada fixture es un `.md` autocontenido. NOTA: viven en `__fixtures__/` que `loadAllPosts()` excluye explícitamente (T007).
- [X] T027 [US3] Create `tests/blog-schema.sh` (executable, `chmod +x`) — siguiendo [contracts/ci-gate.md](contracts/ci-gate.md) §2: itera `content/blog/__fixtures__/invalid-*.md`, ejecuta `node scripts/build-blog.js --check-only-validation --input <fixture>` y exige exit ≠ 0 para cada uno. Para `xss-attempt.md`: ejecuta con `--emit-sanitized`, captura stdout, verifica con `grep -E` que NO contiene `<script`, `<iframe`, `onerror=`, `onload=`, `javascript:`, `style=`, `<form`, `<button`, `vbscript:`. Imprime `OK <fixture>` / `FAIL <fixture>` y resumen. Exit 1 si cualquiera pasó cuando no debía.
- [X] T028 [US3] Add `blog-build-check` job al `.github/workflows/ci.yml` siguiendo el contrato exacto de [contracts/ci-gate.md](contracts/ci-gate.md) §1: steps `actions/checkout@v4`, `actions/setup-node@v4` (node 20), `npm ci`, `node scripts/build-blog.js --check`, `bash tests/blog-schema.sh`. Job paralelo a las gates existentes (`a11y`, `html-validate`, `pipeline-build-check`, `interviews-*`).
- [X] T029 [US3] Local end-to-end smoke: (a) crear `content/blog/2026-07-test-fake.md` válido temporal → `node scripts/build-blog.js` → confirmar `blog/test-fake.html` emitido y `index.html` actualizado → `--check` exit 0; (b) borrar el `.md` → rebuild → confirmar `blog/test-fake.html` removido como huérfano; (c) modificar manualmente un byte en `blog/index.html` y correr `--check` → exit 1 con mensaje de drift; (d) revertir y `--check` exit 0; (e) `bash tests/blog-schema.sh` → todas las fixtures correctamente rechazadas + XSS limpio.

**Checkpoint US3**: el blog es mantenible solo desde `content/blog/`; CI protege contra desincronización, frontmatter inválido y XSS.

---

## Phase 6: User Story 4 — Visitante reconoce a Victor en #about (Priority: P2)

**Goal**: la sección `#about` muestra una foto circular 256×256 webp de Victor + 4 stat cards personales (17 / 10 / +12 / 1%) reemplazando las técnicas (que ahora viven inline en el primer post).

**Independent Test**: cargar el landing → desplazarse a `#about` → confirmar foto circular (256×256, webp, `alt` no vacío, `loading="lazy"`) y 4 stat cards con valores 17 / 10 / +12 / 1% y etiquetas "Años en desarrollo de software" / "Años en DevOps" / "Clientes" / "Mejor cada día".

### Implementation for User Story 4

- [X] T030 [US4] Place `assets/img/josue-256.webp` (foto circular 256×256, ≤ 25 KB, provista por el autor). Si el autor aún no la entrega: usar un placeholder temporal con las dimensiones correctas y dejar TODO en el PR description; no bloquear el merge por la imagen real (puede entrar en commit follow-up del autor).
- [X] T031 [US4] Modify `index.html` sección `#about` (líneas ~247-266 según spec) — reemplazar las 4 stat cards técnicas actuales (7 etapas / 0 costo / 100% cobertura / <5 min) por las 4 personales: `17` (Años en desarrollo de software), `10` (Años en DevOps), `+12` (Clientes — bancos LATAM + corporaciones internacionales), `1%` (Mejor cada día). Reusa exactamente las clases `.stat-card`, `.stat-value`, `.stat-label`. Agregar `<img src="/assets/img/josue-256.webp" alt="Retrato de Victor Josue Ardón Rojas" width="256" height="256" loading="lazy" decoding="async" class="about-portrait">` dentro de la sección, posicionada según [data-model.md](data-model.md) §Entidad 6.
- [X] T032 [US4] Verify `.about-portrait` CSS en `assets/css/components.css` (creado en T011): `border-radius: 50%`, `width: 256px`, `height: 256px`, `max-width: 100%`, `object-fit: cover`. Ajustes responsive si el layout de `#about` cambia (mobile-first, sin scroll horizontal en 320 px).
- [X] T033 [US4] Mobile smoke check (320 / 360 / 768 / 1024 / 1440 px) — verificar (a) la foto se ve circular en todos los breakpoints, (b) las 4 stat cards personales se distribuyen sin desborde, (c) si la imagen falla en cargar, el `alt` se muestra y el layout no se rompe (probar con DevTools Network → Block image URL).
- [X] T034 [US4] Run `npm run html-validate` y `bash tests/no-placeholders.sh` para confirmar que los nuevos textos de stat cards y el `<img>` no introducen errores.

**Checkpoint US4**: `#about` muestra la nueva narrativa personal (foto + 4 stats personales); las stat cards técnicas viven exclusivamente inline en el primer post.

---

## Phase 7: User Story 5 — Visitante con limitaciones de color y de teclado navega el blog (Priority: P3)

**Goal**: landing, `/blog/` y al menos un post individual cumplen WCAG 2.1 AA (axe-core); estados/jerarquía distinguibles sin color; navegación por teclado con foco visible.

**Independent Test**: ejecutar `node tests/a11y.js` con server local activo y obtener cero violaciones para `/`, `/blog/`, `/blog/pipeline-seguridad-spec-driven.html`. En DevTools → Rendering → Achromatopsia, los componentes (cards, meta, tags, link "Ver todos") siguen distinguibles. Tab desde el inicio del landing alcanza cada card y el link "Ver todos" con foco visible.

### Implementation for User Story 5

- [X] T035 [US5] Modify `tests/a11y.js` — agregar `http://localhost:8080/blog/` y `http://localhost:8080/blog/pipeline-seguridad-spec-driven.html` a la lista de URLs auditadas. Mantener URLs preexistentes intactas.
- [X] T036 [US5] Run a11y suite — `npx serve -l 8080 .` background → `node tests/a11y.js` → verificar `✓ all N URLs pass WCAG 2.1 AA` incluyendo las nuevas. Si falla, capturar violaciones (contraste, missing labels, heading-order, link-name) y corregir CSS/HTML antes de seguir. Cleanup: `pkill -f "serve -l 8080"`.
- [X] T037 [US5] Manual achromatopsia smoke (DevTools → Rendering → Emulate vision deficiencies → Achromatopsia) sobre `#blog` del landing, `/blog/` y un post individual: verificar que (a) título, fecha, reading time, tags, summary, link "Ver todos" son distinguibles por jerarquía/peso/posición, (b) las stat cards inline del post mantienen contraste y legibilidad. Documentar resultado en PR description.
- [X] T038 [US5] Keyboard nav smoke — Tab desde el inicio del landing: confirmar que (a) cada card de post (o su `<a>` principal en el título) es alcanzable, (b) el link "Ver todos" es alcanzable, (c) en `blog/index.html` cada card es alcanzable, (d) en `blog/<slug>.html` el link "← Volver al blog" es alcanzable, (e) el foco siempre es visible respetando los tokens del sitio.

**Checkpoint US5**: a11y verde automatizado + manual; sección apta para WCAG 2.1 AA en las 3 superficies.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: cerrar ciclo de gates, documentación cruzada, marker SPECKIT, PR prep.

- [X] T039 Create `content/blog/README.md` — guía rápida del formato del frontmatter para el autor (refleja [quickstart.md](quickstart.md)): cómo crear/editar/despublicar/renombrar un post, el patrón normativo de stat cards inline, modos del script, link al schema completo en `contracts/frontmatter-schema.md`.
- [X] T040 Run full regression sweep — todos los gates en orden: `bash tests/no-placeholders.sh && bash tests/forbidden-urls.sh && npm run html-validate && bash tests/interviews-xss.sh && bash tests/interviews-size.sh && bash tests/interviews-negative.sh && bash tests/pipeline-schema.sh && node scripts/build-pipeline.js --check && bash tests/blog-schema.sh && node scripts/build-blog.js --check`. Todos deben exit 0.
- [X] T041 [P] Re-run a11y suite a la salida de Phase 8 — `npx serve -l 8080 .` background + `node tests/a11y.js`, confirmar `✓ all N URLs pass WCAG 2.1 AA`.
- [X] T042 [P] Verify SPECKIT marker — `grep -A1 "SPECKIT START" .github/copilot-instructions.md` debe apuntar a `specs/006-blog-section/plan.md`. Si no, actualizar el bloque entre `<!-- SPECKIT START -->` y `<!-- SPECKIT END -->` para que el `**Plan activo**` enlace a `specs/006-blog-section/plan.md`.
- [X] T043 [P] Re-verify zero new deps — `git diff package.json package-lock.json` NO debe mostrar entries añadidos en `dependencies` ni `devDependencies` salvo el script `build:blog` agregado en T004 (constitución IV). Si hay diff inesperado en lock, abortar y revisar.
- [X] T044 Mark all tasks T001..T044 as completed en este `tasks.md`: `sed -i '' -E 's/^- \[ \] (T0[0-4][0-9])/- [X] \1/' specs/006-blog-section/tasks.md`. Verificar con `grep -c '^- \[X\] T' specs/006-blog-section/tasks.md` → 44 y `grep -c '^- \[ \] T' specs/006-blog-section/tasks.md` → 0.
- [X] T045 PR preparation — open PR titled `spec 006: blog section + #about refresh` con descripción que incluya: (a) Spec ID `006-blog-section`, (b) secciones constitucionales cubiertas (II identidad visual, III estática, IV cero deps nuevas, VI a11y, VII performance, VIII seguridad, IX gates), (c) checklist de gates verdes: `html-validate` (incluye `blog/index.html` + `blog/<slug>.html`), `a11y` (incluye `/blog/` + un post), `no-placeholders`, `forbidden-urls`, `blog-build-check` (`--check`), `blog-schema.sh` (8 fixtures + XSS), `interviews-*` y `pipeline-build-check` unchanged, (d) screenshots desktop + mobile de `#blog` landing, `/blog/`, post individual y `#about` actualizado, (e) AC SC-001..SC-012 marcados según validación, (f) explicit note: zero new runtime/devDeps installed (verified by T002 + T043).

---

## Dependencies (graph)

```
Phase 1 (T001-T004)
    └─→ Phase 2 (T005-T011)         ← BLOQUEA TODAS las US
            ├─→ US1 (T012-T018)     ← MVP base, P1
            │       └─→ US2 (T019-T023)  ← P1, complementa US1 (mismo merge)
            ├─→ US3 (T024-T029)     ← P2, independiente de US1/US2 una vez Phase 2 listo
            ├─→ US4 (T030-T034)     ← P2, independiente (toca solo #about + img)
            └─→ US5 (T035-T038)     ← P3, requiere US1+US2 mergeados para tener páginas que auditar
Phase 8 (T039-T045) ← requiere US1..US5
```

**Inter-task dependencies clave**:
- T006, T007, T008, T009 dependen de T005 (esqueleto del script).
- T010 depende de T006 + T007 + T009.
- T012 depende de T010.
- T013 + T014 pueden correr en paralelo, pero T015 los necesita a ambos + T012.
- T016..T018 dependen de T015.
- T019 depende de T015 (HTML ya regenerado).
- T020..T023 dependen de T019.
- T024 + T025 dependen de Phase 2 completa, pueden correr en paralelo con US1/US2.
- T026 depende de T025 (`--input` flag listo) y T007 (loader excluye `__fixtures__/`).
- T027 depende de T026.
- T028 depende de T024 + T027.
- T029 depende de T028.
- US4 (T030-T034) es independiente de US1/US2/US3 una vez Phase 2 lista — toca solo `#about` y `assets/img/`.
- US5 depende de US1 + US2 mergeados (necesita las páginas reales para auditar).

## Parallel execution opportunities

**Dentro de Phase 1**:
- T003 y T004 son `[P]` — directorio de contenido vs `package.json`.

**Dentro de Phase 2**:
- T011 es `[P]` — `assets/css/components.css` no compite con `scripts/build-blog.js`.

**Dentro de US3**:
- T026 es `[P]` — fixtures viven en archivos nuevos en `content/blog/__fixtures__/`.

**Dentro de Phase 8**:
- T041, T042, T043 son `[P]` — operaciones independientes (a11y vs grep marker vs git diff).

**Cross-US** (después de Phase 2):
- US1 (toca `index.html` + `content/blog/`), US3 (toca `tests/`, `__fixtures__/`, `.github/workflows/ci.yml`) y US4 (toca `index.html` `#about` + `assets/img/`) pueden coexistir si dos personas trabajan en paralelo. Solo `index.html` es punto de coordinación entre US1 y US4 (`#blog` vs `#about` están en bloques distintos del archivo, conflict trivial).

## Implementation strategy (MVP first)

1. **Phase 1 + Phase 2 + US1 + US2** = MVP entregable. Tras T023, el blog está vivo: landing con cards reales, `/blog/` con índice completo, primer post servible. Valor inmediato al visitante (cumple SC-001, SC-008, SC-010).
2. **+ US3** = mantenibilidad y CI. Tras T029, agregar/editar posts es una operación de un commit; CI bloquea drift, frontmatter inválido y XSS (cumple SC-002, SC-006, SC-009).
3. **+ US4** = `#about` actualizado con la nueva narrativa personal (cumple SC-011).
4. **+ US5** = compliance WCAG 2.1 AA verificado (cumple SC-004).
5. **+ Phase 8** = listo para merge: todas las gates verdes, marker actualizado, cero deps nuevas verificado, PR preparado (cumple SC-005, SC-007, SC-012).

## Independent test criteria recap

| US | Independent Test | Status |
|---|---|---|
| US1 | Cargar landing → ver `#blog` con ≤3 cards reales + link "Ver todos"; abrir primer post con stat cards inline sanitizadas | T015–T018 manual + html-validate + no-placeholders |
| US2 | Navegar a `/blog/` → ver índice completo desc por fecha; nav apunta a `/blog/`; estado vacío si no hay publicados | T019–T023 |
| US3 | Crear `.md` válido → rebuild lo publica; fixture inválido → build aborta; drift `.md`↔HTML → CI rojo; XSS → sanitizado | T029 smoke + `tests/blog-schema.sh` + `--check` |
| US4 | `#about` muestra foto circular 256×256 webp + 4 stats personales (17 / 10 / +12 / 1%) | T031 + T033 inspección |
| US5 | `node tests/a11y.js` cero violaciones en `/`, `/blog/`, `/blog/<slug>.html`; achromatopsia smoke OK; Tab nav OK | T036 + T037 + T038 |

## Format validation

Cada tarea sigue el formato estricto: `- [ ] [TaskID] [P?] [Story?] Description con file path`. Las 45 tareas (T001..T045) fueron auditadas:

- ✅ Cada una empieza con `- [ ] T###`.
- ✅ Las US-phase tasks llevan `[US1]`..`[US5]`.
- ✅ Tareas de Setup, Foundational y Polish NO llevan etiqueta de Story.
- ✅ `[P]` aparece solo donde es seguro paralelizar.
- ✅ Cada descripción menciona file path concreto, contracto referenciado o gate específica.
