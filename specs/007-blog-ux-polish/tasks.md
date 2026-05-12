# Tasks — Spec 007: Blog UX & Visual Polish

**Feature**: [spec.md](./spec.md) · [plan.md](./plan.md)
**Branch**: `007-blog-ux-polish`
**Generated**: 2026-05-11

User stories from spec (priorities):
- **US1 (P1)** — Leer un post con tipografía y jerarquía cuidadas.
- **US2 (P2)** — Explorar y filtrar el índice del blog.
- **US3 (P2)** — Continuidad visual con el landing.

> Tests are NOT requested by the user nor by the spec; no test-first tasks are generated. Existing automated gates (html-validate, axe-core, blog-schema.sh, --check) are reused and extended where the contracts require it.

---

## Phase 1 — Setup

- [X] T001 Crear directorio `assets/img/blog/` con un `.gitkeep`, para alojar los `cover` opcionales de futuros posts.
- [X] T002 [P] Añadir nuevos tokens en `assets/css/tokens.css`: `--code-bg`, `--code-border`, `--blockquote-border`, `--toc-bg`, `--toc-text`, `--chip-active-bg`, `--chip-active-text`. Valores derivados de la paleta existente (sin nuevos hex literales fuera del `tokens.css`).

## Phase 2 — Foundational (blocking prerequisites)

- [X] T003 Extender `scripts/build-blog.js` con utilidades de slug y validación auxiliar:
  - `slugifyHeading(text)` — slugifica texto ASCII para `id` de heading.
  - `slugifyTag(label)` — produce `[a-z0-9-]+` y trim.
  - `urlEncodeForShare(text)` — wrapper de `encodeURIComponent`.
  - `validateCoverField(file, fm)` — valida path, extensión, existencia, prefijo `assets/img/blog/`.
  - Sin cambios de comportamiento todavía; estas funciones se usan en fases siguientes.
- [X] T004 Añadir al loader de `scripts/build-blog.js` el reconocimiento del campo opcional `cover` en el frontmatter, integrando `validateCoverField()` con los mensajes de error documentados en `contracts/frontmatter-schema-delta.md`. Posts existentes sin `cover` deben seguir construyendo.
- [X] T005 Centralizar en `scripts/build-blog.js` la URL canónica del post `https://ardops.dev/blog/<slug>.html` y exponerla como helper `canonicalUrl(slug)` reutilizable por share-links, sitemap y meta tags.

## Phase 3 — User Story 1 (P1): Lectura de post con tipografía y jerarquía cuidadas

**Story goal**: la página `/blog/<slug>.html` se ve consistente con el landing y es cómoda de leer en desktop y mobile.

**Independent test**: abrir `/blog/pipeline-seguridad-spec-driven.html`, validar tipografía, jerarquía, código, blockquotes, TOC, footer; axe-core sin violations; Lighthouse Perf ≥ 95.

- [X] T006 [US1] Reescribir la plantilla `renderPostPage()` en `scripts/build-blog.js` para emitir la estructura definida en `contracts/render-contract-delta.md`: `<div class="post-layout">` con `<aside class="post-toc--aside">` (condicional), `<article class="post-article">` con header, `<details class="post-toc--mobile">` (condicional), `<div class="post-article-body">` y `<footer class="post-article-footer">`.
- [X] T007 [US1] Implementar en `scripts/build-blog.js` la función `buildToc(bodyHtml)`:
  - Usa `jsdom` (ya dependencia) sobre el HTML sanitizado.
  - Asigna `id` único a `h2`/`h3`/`h4`/`h5`/`h6` con `slugifyHeading()` y desambiguación numérica.
  - Devuelve `{ items: TocEntry[], bodyHtmlWithIds }`.
  - Solo se renderiza la TOC visual si `items.filter(i => i.level === 2).length >= 3`.
- [X] T008 [US1] Implementar en `scripts/build-blog.js` la función `renderToc(items)` que emite los bloques HTML `aside.post-toc--aside` y `details.post-toc--mobile` exactamente como en `contracts/toc-contract.md`. Cuando la condición de umbral no se cumple, devuelve `{ aside: '', mobile: '' }`.
- [X] T009 [US1] Implementar en `scripts/build-blog.js` la función `renderShareLinks(post)` que emite el bloque `<aside class="post-share">` según `contracts/share-links-contract.md`, con URL canónica y título URL-encodeados y `rel`/`target` correctos.
- [X] T010 [US1] Integrar `renderToc()` y `renderShareLinks()` dentro de `renderPostPage()`. El footer también incluye los tags repetidos y el botón "← Volver a todos los posts" (`<a class="btn btn-ghost" href="/blog/">`).
- [X] T011 [P] [US1] Añadir en `assets/css/components.css` los estilos del **layout** del post: `.post-layout` (grid 1 col mobile, `260px 1fr` ≥1024px), `.post-article` (max-width ~720px), `.post-article-header` con `border-bottom` color `--border`, `.post-article-meta` mono.
- [X] T012 [P] [US1] Añadir en `assets/css/components.css` los estilos **tipográficos del cuerpo** según la tabla del contrato: `.post-article-body p`, `h2`, `h3`, `h4`, `ul/ol`, `code` inline (usa `--code-bg`/`--code-border`), `pre > code` (con `border-left: 2px solid var(--accent)` y `overflow-x: auto`), `blockquote` (usa `--blockquote-border`), `table` (responsive con scroll horizontal), `img` (border-radius, max-width:100%).
- [X] T013 [P] [US1] Añadir en `assets/css/components.css` los estilos de la **TOC**: `.post-toc`, `.post-toc--aside` (`position: sticky; top: …`, visible solo `≥1024px`), `.post-toc--mobile` (`<details>`, visible solo `<1024px`), `.post-toc-list`, `.post-toc-item--h3` (padding-left).
- [X] T014 [P] [US1] Añadir en `assets/css/components.css` los estilos del **footer del post**: `.post-article-footer`, `.post-share`, `.post-share-links` (fila horizontal), `.post-share-link` (chip-like). Aplica reglas de `prefers-reduced-motion` en `assets/css/motion.css` si se introducen transiciones.
- [X] T015 [US1] Verificar idempotencia: ejecutar `node scripts/build-blog.js` dos veces y confirmar `git diff --stat` vacío sobre `blog/`.
- [X] T016 [US1] Validar HTML emitido: `npm run html-validate` debe pasar sobre `blog/pipeline-seguridad-spec-driven.html` con la nueva estructura.
- [X] T017 [US1] Validar `tests/no-placeholders.sh` y `tests/forbidden-urls.sh` siguen verdes.
- [X] T018 [US1] **Manual smoke (US1 Independent Test)**: servir el sitio, abrir el post en desktop y mobile, revisar contra los Acceptance Scenarios 1–4 de US1 en `spec.md`. Documentar resultados en el cuerpo del PR.

## Phase 4 — User Story 2 (P2): Explorar y filtrar el índice del blog

**Story goal**: `/blog/` muestra header de sección, chips de tag, búsqueda y grilla de cards refinadas; filtra por tag con CSS puro y por texto con JS módulo.

**Independent test**: con ≥3 posts (fixtures temporales si hace falta), click en chip filtra; tipear en search filtra; sin JS solo el filtro por tag funciona; estado vacío y limpiar filtros operativos.

- [X] T019 [US2] Reescribir `renderBlogIndex()` en `scripts/build-blog.js` para emitir la estructura completa de `contracts/filter-search-contract.md`: `section.blog-index` con `section-label`/`section-title`/`section-lead`, `div.blog-filters-radios` (con un `<input type="radio">` por tag único + el de "Todos"), `div.blog-filters` (con `ul.blog-chips` y `div.blog-search` con `hidden`), `<output class="blog-results-count" aria-live="polite">`, `ol.post-list#blog-post-list`, `p.blog-empty[hidden]`, `button.blog-clear-filters[hidden]`, y `<script id="blog-index" type="application/json">…</script>`.
- [X] T020 [US2] En el mismo archivo, emitir un `<style id="blog-tag-rules">` inline dentro de `/blog/index.html` con las reglas `:has()` por cada tag presente (una por tag), garantizando orden alfabético determinista. Documentar en el script un comentario explicando por qué no vive en `components.css`.
- [X] T021 [US2] Refactorizar `renderPostCard()` (helper compartido entre landing teaser y blog index) para producir el HTML extendido de `contracts/render-contract-delta.md`:
  - Atributos `data-card`, `data-slug`, `data-tags` (lista space-separated de slugs), `data-index`.
  - `<img class="post-card-cover">` opcional solo si `post.cover` está presente.
  - `post-meta`, `post-card-title`, `post-card-summary`, `post-tags`, `post-card-cta` ("Leer →").
- [X] T022 [US2] Asegurar que el `<script id="blog-index" type="application/json">` solo contiene posts publicados, no futuros, en el mismo orden que la grilla. Validar que los campos serializados son `slug, title, summary, tags` y que el JSON está minificado (sin espacios extra).
- [X] T023 [P] [US2] Crear `assets/js/blog-filter.js` siguiendo `contracts/filter-search-contract.md`:
  - Módulo ES2022, `import` libre (no necesario), top-level code.
  - Debounce 60 ms.
  - Anuncio en `<output aria-live>`.
  - Botón "Limpiar filtros".
  - Bundle target: < 4 KB minificado. Comentarios mínimos.
- [X] T024 [P] [US2] Añadir en `assets/css/components.css` los estilos del **header y filtros del índice**: `.blog-index`, `.section-lead`, `.blog-filters-radios` (`display: none`), `.blog-filters`, `.blog-chips` (flex wrap, gap), `.chip--filter` (estado base y `:hover`/`:focus-visible`), `.chip-count` (mono, color `--text-muted`), `.blog-search` (input estilo terminal), `.blog-results-count` (mono, `--text-muted`), `.blog-empty`, `.blog-clear-filters` (`btn-ghost`-like).
- [X] T025 [P] [US2] Añadir en `assets/css/components.css` los estilos de la **grilla y cards refinadas**: `.post-list` (grid responsive 1/2/3 col), `.post-card` (border, padding, radius, bg-card, hover border-accent + translateY -2px), `.post-card-cover` (aspect-ratio 16/9, object-fit cover, full-width interno), `.post-card-title`, `.post-card-summary`, `.post-card-cta` (con flecha y subrayado en hover).
- [X] T026 [P] [US2] Añadir en `assets/css/motion.css` las transiciones de `.post-card` y respetar `prefers-reduced-motion: reduce` (sin `translateY` ni transiciones cuando aplica).
- [X] T027 [US2] Generar **3 posts fixture publicados temporales** (no commitear si la spec entrega solo 1 post visible; en este caso, **generar localmente** para el smoke de US2 pero **no incluirlos en `content/blog/`**; usar `tests/blog-index-fixtures/` o un flag `--with-fixtures` del build). Decisión recomendada: agregar flag `--with-fixtures` al build que inyecta posts dummy in-memory solo para QA local; no se invoca en CI. Documentar el flag en `content/blog/README.md`.
- [X] T028 [US2] Incluir `<script type="module" src="/assets/js/blog-filter.js" defer></script>` dentro de `/blog/index.html` justo antes de `</body>`. Verificar que no se incluye en `index.html` (landing) ni en las páginas de post.
- [X] T029 [US2] Actualizar la CSP `<meta>` en `/blog/index.html` solo si el contrato actual ya no incluye `'self'` para `script-src` (debería estar). Si no requiere cambio, dejar nota en `contracts/render-contract-delta.md`. (Esperado: cambio CERO.)
- [X] T030 [US2] Verificar bundle size del JS: `wc -c assets/js/blog-filter.js` debe ser < 4096. Si excede, refactorizar.
- [X] T031 [US2] **Manual smoke (US2 Independent Test)**: con `--with-fixtures`, recorrer Acceptance Scenarios 1–5 de US2 en `spec.md`. Documentar en PR.

## Phase 5 — User Story 3 (P2): Continuidad visual con el landing

**Story goal**: confirmar que la estética del blog es indistinguible del landing en componentes repetidos.

**Independent test**: revisión visual side-by-side; `grep` confirma cero hex literales fuera de `tokens.css`; `prefers-reduced-motion` respetado.

- [X] T032 [US3] Auditar `assets/css/components.css` y cualquier `<style>` inline emitido por el build: `grep -nE "#[0-9a-fA-F]{3,6}"` debe retornar **cero matches fuera de `tokens.css`**. Corregir cualquier hex hardcodeado introducido por error.
- [X] T033 [US3] Validar que `nav` del header marca `aria-current="page"` en:
  - `/blog/index.html` sobre el link a `/blog/`,
  - `/blog/<slug>.html` sobre el link a `/blog/`.
  Ajustar la plantilla del nav en `scripts/build-blog.js` si el comportamiento se rompió.
- [X] T034 [US3] Validar que el footer es idéntico entre landing, `/blog/` y post individual (mismo HTML emitido, mismas variantes de copyright/year si las hay). Reutilizar un helper `renderFooter()` compartido si todavía no existe.
- [X] T035 [US3] **Manual smoke (US3 Independent Test)**: capturar screenshots a 1440px y 375px de landing, `/blog/` y post; comparar paleta, tipografía, espaciado, componentes (botones, chips, stat cards). Documentar en PR.

## Phase 6 — Polish & cross-cutting

- [X] T036 [P] Actualizar `content/blog/README.md` con:
  - El nuevo campo opcional `cover`.
  - El flag `--with-fixtures` del build (solo QA local).
  - Notas sobre la TOC automática (umbral, IDs).
  - Notas sobre los share links (sin tracker, sin JS).
- [X] T037 [P] Actualizar `tests/blog-schema.sh` con un nuevo fixture negativo `content/blog/__fixtures__/invalid-cover-missing.md` (frontmatter válido pero `cover` apuntando a archivo inexistente). Aserción: build falla.
- [X] T038 [P] Actualizar `tests/blog-schema.sh` con un nuevo fixture negativo `content/blog/__fixtures__/invalid-cover-bad-ext.md` (cover con extensión `.gif`). Aserción: build falla con mensaje claro.
- [X] T039 Actualizar `sitemap.xml` si la spec introduce nuevas URLs (en esta spec no agrega rutas, solo enriquece las existentes; verificar que `/blog/` y `/blog/pipeline-seguridad-spec-driven.html` siguen listadas con `<lastmod>` correcto).
- [X] T040 Re-ejecutar gates locales: `node scripts/build-blog.js --check`, `bash tests/blog-schema.sh`, `bash tests/no-placeholders.sh`, `bash tests/forbidden-urls.sh`, `npm run html-validate`, `node scripts/build-pipeline.js --check`. Todos verdes.
- [X] T041 Re-ejecutar axe-core: `(nohup npx --yes serve -l 8080 . > /tmp/serve.log 2>&1 &); sleep 3; node tests/a11y.js; pkill -f "serve -l 8080"`. Esperado: `✓ all N URLs pass WCAG 2.1 AA`.
- [X] T042 Re-ejecutar Lighthouse: `npm run lhci`. Verificar Performance ≥ 95, Accessibility = 100, Best Practices ≥ 95, SEO ≥ 95 en `/blog/` y `/blog/<slug>.html`.
- [X] T043 Confirmar `git diff package.json package-lock.json` muestra **cero dependencias runtime nuevas**. Cualquier devDependency añadida (no debería haberla) justificada en `plan.md`.
- [X] T044 Confirmar que el CSS total servido al cliente crece menos de 8 KB gzip respecto a la baseline post-spec 006: `gzip -c assets/css/*.css | wc -c` antes vs después. Documentar en PR.
- [X] T045 Marcar todas las tasks completadas en este `tasks.md` (`- [ ]` → `- [X]`) y verificar `grep -c '^- \[ \] T'` = 0.
- [X] T046 Preparar descripción del PR siguiendo `.github/copilot-instructions.md` cláusula 7:
  - Spec ID: 007.
  - Constitución relevante: II, III, IV, V, VI, VII, VIII, IX.
  - Checklist de gates (html-validate, no-placeholders, forbidden-urls, blog-schema, a11y, lighthouse).
  - AC checklist: SC-001..SC-015.
  - Nota: cero dependencias runtime nuevas.

---

## Dependencias entre fases

```
Setup (T001-T002) ──┐
                    ├──► Foundational (T003-T005) ──┐
                    │                                ├──► US1 (T006-T018) ──┐
                    │                                ├──► US2 (T019-T031) ──┼──► US3 (T032-T035) ──► Polish (T036-T046)
                    └────────────────────────────────┘                      │
                                                                            │
                                                                  US1 y US2 son independientes entre sí.
```

- US1 y US2 son **independientes** y pueden trabajarse en paralelo una vez completados Setup + Foundational.
- US3 depende de US1 + US2 estar visualmente terminados (revisión visual side-by-side).
- Polish cierra todos los gates y prepara PR.

## Paralelización

Dentro de cada User Story, las tasks marcadas `[P]` son paralelizables (archivos diferentes, sin dependencias):

- **US1 [P]**: T011, T012, T013, T014 (todas son secciones distintas de CSS dentro del mismo archivo pero en bloques disjuntos; revisar para evitar conflictos de merge).
- **US2 [P]**: T023 (JS), T024, T025 (CSS bloques distintos), T026 (motion.css). T021 y T022 dependen de la plantilla creada en T019.
- **Polish [P]**: T036, T037, T038 son archivos distintos.

## MVP sugerido

Implementar US1 completa (T001–T018 + porciones de Polish) es un MVP entregable que ya entrega el 80% del valor visual y desbloquea publicar más posts con calidad. US2 puede entrar en un segundo PR si se prefiere mergear incremental.

## Validación de formato

Todas las tasks siguen `- [ ] T### [P?] [US?] Descripción con path`. Total: **46 tasks**.

- Setup: 2 tasks.
- Foundational: 3 tasks.
- US1: 13 tasks.
- US2: 13 tasks.
- US3: 4 tasks.
- Polish: 11 tasks.

Paralelizables: 12 tasks marcadas `[P]`.
