# Backlog 09 — Tag pages para el blog (`/blog/tag/<slug>/`)

> **Estado**: backlog · **Prioridad**: P4 (esperar a tener ≥ 5 posts)
> **Esfuerzo estimado**: S (~medio día) · **ROI networking**: bajo hasta tener masa crítica

---

Base Prompt:
/speckit.specify

Implementar el Backlog 11 — OG images dinámicas por post

Contexto completo y requisitos en backlog/11-og-images-dynamic.md

Por favor leé ese archivo entero antes de generar la spec, y usalo como
fuente de verdad para:

Problema y objetivo
FRs (FR-01 a FR-06)
Alcance técnico y archivos a tocar
Gates / tests
Out of scope
Edge cases
Criterios de aceptación
Generá la spec en specs/017-og-images-dynamic/spec.md respetando
la constitución (.specify/memory/constitution.md) y la referencia visual
en .reference/v1-design/index.html.

## Por qué

Hoy el blog tiene un solo post. Los filtros del index (spec 007) cubren
la necesidad. Pero cuando el blog crezca a 10+ posts, las **páginas de tag
indexables** (`/blog/tag/devops/`, `/blog/tag/security/`) tienen valor
SEO real:

- Cada tag puede rankear como long-tail keyword.
- Linkeables desde tweets/posts: "todo mi contenido sobre security".
- Permiten que el RSS por tag sea posible (ver backlog 04).

**Esperar a publicar 5+ posts** antes de implementar — es prematuro hoy.

## Objetivo

Generar una página HTML por tag, con el listado de posts que lo usan,
indexable y enlazada desde los chips del blog index y los tags de cada post.

## Alcance funcional (FRs)

- **FR-01** — Por cada tag único en posts publicados, generar
  `/blog/tag/<slug>/index.html`.
- **FR-02** — Cada página de tag muestra:
  - `<h1>Posts sobre {label}</h1>`
  - Lista de posts (mismo card layout que `/blog/`).
  - Breadcrumb: Home → Blog → Tag.
  - Link "← Ver todos los posts" a `/blog/`.
- **FR-03** — Los chips de filtro en `/blog/` siguen funcionando como hoy
  (CSS-only `:has()`), pero ahora **también enlazan a la página de tag**:
  ```html
  <li><a href="/blog/tag/devops/">DevOps</a></li>
  ```
  El comportamiento de filtro inline sigue en `/blog/?tag=devops` para
  compatibilidad.
- **FR-04** — Cada tag-page tiene `<link rel="canonical">`, JSON-LD
  `CollectionPage`, OG meta, sitemap entry.
- **FR-05** — `sitemap.xml` lista todas las tag-pages.
- **FR-06** — RSS opcional `/blog/tag/<slug>/feed.xml` (depende de Backlog 04).
  **Diferido**: solo implementar si hay tags con ≥ 3 posts.

## Alcance técnico

- Modifica `scripts/build-blog.js`:
  - Nuevo `renderTagPage(tagSlug, tagLabel, posts)`.
  - Loop sobre `collectTags(published)` y emite `blog/tag/<slug>/index.html`.
  - Modo `--check` valida que tag-pages estén en sync.
- Modifica `renderTags()` en cards para que cada tag sea `<a>` no `<span>`.

## Gates / tests

- `node scripts/build-blog.js --check` debe validar tag-pages.
- `bash tests/sitemap-drift.sh` (de Backlog 02) debe incluir tag-pages.
- `npm run html-validate` sobre todas las tag-pages.
- Lighthouse en una tag-page representativa.

## Out of scope

- Filtro multi-tag (`/blog/tag/devops+security/`) — combinatorio, low value.
- Búsqueda dentro de una tag-page — el listado es ya filtrado.
- Tag clouds visuales con tamaños proporcionales — meh.
- Renombrar tags retroactivamente con redirects (requeriría JS o
  meta refresh; defer).

## Edge cases

- Tag con un solo post: igual se genera la página (consistencia).
- Slug con caracteres no-ASCII: `slugifyTag()` ya normaliza a NFD.
- Si se renombra un tag (`devops` → `dev-ops`), las URLs viejas dan 404.
  Aceptable porque el blog es nuevo. Documentarlo.

## Criterios de aceptación

- AC-01: Cada tag publicado tiene `/blog/tag/<slug>/index.html`.
- AC-02: Los chips/tags en cards llevan a la tag-page.
- AC-03: La tag-page muestra solo posts con ese tag.
- AC-04: sitemap.xml incluye todas las tag-pages.
- AC-05: `--check` falla si hay drift entre posts y tag-pages.

## Constitución relevante

- I, II, III (zero deps), IX (validation).

## Notas para `/specify`

> "Generar /blog/tag/<slug>/index.html por cada tag en build-time.
> Breadcrumb + JSON-LD CollectionPage + sitemap. Chips del blog index
> ahora enlazan a tag-pages además del filtro inline. Sin multi-tag, sin
> redirects retroactivos. Esperar a 5+ posts antes de implementar."
