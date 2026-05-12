# Phase 1 — Data Model: RSS, JSON-LD y SEO distribution

**Feature**: 011-rss-jsonld-seo
**Date**: 2026-05-12

> Sitio estático sin DB. Las "entidades" son **estructuras en memoria**
> consumidas por los módulos `scripts/lib/feeds.js` y `scripts/lib/jsonld.js`,
> y materializadas como XML, JSON y bloques JSON-LD inline en HTML.

---

## Feed

Representa un feed distribuible (RSS o JSON Feed).

| Atributo | Tipo | Origen | Notas |
|---|---|---|---|
| `format` | `'rss'` \| `'jsonfeed'` | hardcoded por renderer | Determina template. |
| `path` | string | hardcoded | `'blog/feed.xml'` o `'blog/feed.json'`. |
| `channelTitle` | string | constante | `"ardops.dev — Blog"` |
| `channelLink` | URL absoluta | constante | `"https://ardops.dev/blog/"` |
| `channelDescription` | string | constante | reusa `BLOG_INTRO_TEXT` de `build-blog.js`. |
| `language` | string | constante | `"es-CR"` |
| `lastBuildDate` | ISO 8601 internamente | derivado | `max(post.date) | sentinel '2026-01-01'`. |
| `selfHref` | URL absoluta | constante | `"https://ardops.dev/blog/feed.xml"` (RSS) o `feed.json`. |
| `items[]` | `FeedItem[]` | derivado | uno por post publicado, ordenado desc por fecha. |

**Validaciones invariantes** (gates):

- `feed.xml` parsea como XML bien formado (`feed-validate.sh`).
- `feed.json` parsea como JSON estricto.
- Exactamente 1 `<channel>` por RSS.
- Cada `<item>` tiene `<title>`, `<link>`, `<guid>`, `<pubDate>`.
- `<atom:link rel="self">` presente y apunta a sí mismo.

---

## FeedItem

Un post como aparece en un feed.

| Atributo | Tipo | Origen | Notas |
|---|---|---|---|
| `id` / `guid` | URL absoluta | derivado | `${CANONICAL_ORIGIN}/blog/${slug}.html` |
| `url` | URL absoluta | derivado | igual a `id` |
| `title` | string | `post.title` | escapado al renderizar (XML o JSON). |
| `summary` | string | `post.summary` | escapado. |
| `datePublished` | ISO 8601 internamente | `post.date + 'T00:00:00Z'` | RFC 822 al renderizar RSS. |
| `tags[]` | string[] | `post.tags` | opcional; omitir si vacío. |

**Reglas**:

- `id` estable a través de builds (slug es identidad permanente del post).
- Cero campos de runtime (cero `new Date()`).

---

## JsonLdBlock

Un `<script type="application/ld+json">` en una página.

| Atributo | Tipo | Notas |
|---|---|---|
| `pageType` | `'home'` \| `'blog-index'` \| `'blog-post'` \| `'talks'` \| `'interviews'` | qué página la emite. |
| `schemas[]` | array de objetos schema.org | uno o más nodos serializados en un solo `<script>`. |

**Schemas por pageType** (FR-008..FR-011):

| Página | Schemas emitidos |
|---|---|
| Home (`/`) | `Person` (con `@id`). |
| `/blog/` | `Blog` + `BreadcrumbList`. |
| `/blog/<slug>.html` | `Article` + `BreadcrumbList`. |
| `/talks/` | `ItemList` + `BreadcrumbList`. |
| `/interviews/` | `ItemList` + `BreadcrumbList`. |
| `/uses/` | YA emite `WebPage` + `Person` (spec 010). Sin cambios. |
| `/404` | sin JSON-LD (no aplica). |

**Reglas**:

- Cada `<script>` es JSON estricto (sin trailing commas, sin comentarios).
- Cuando se emiten múltiples schemas en una página, se hace en un único
  `<script>` con un array `[...]` o, alternativamente, en `<script>`s
  separados — el plan/contract decide. Por consistencia con specs 010
  (que usa un solo `<script>` con un solo objeto), se prefiere **un
  `<script>` por nodo** (más fácil de leer, parseo independiente).
- `@id` referenciado debe existir en la misma página o en la lista global
  conocida (`https://ardops.dev/#person`).

---

## Schemas individuales

### Person (Home, referenciado desde Article/Blog)

| Campo | Valor |
|---|---|
| `@context` | `"https://schema.org"` |
| `@type` | `"Person"` |
| `@id` | `"https://ardops.dev/#person"` |
| `name` | `"Victor Josue Ardón Rojas"` |
| `url` | `"https://ardops.dev/"` |
| `image` | `"https://ardops.dev/public/og/og-default.png"` |
| `jobTitle` | `"DevOps Engineer"` |
| `sameAs[]` | `["https://github.com/victorar42", "https://www.linkedin.com/in/victorar42/"]` |

### Article (por post)

| Campo | Valor |
|---|---|
| `@context` | `"https://schema.org"` |
| `@type` | `"Article"` |
| `@id` | `"${CANONICAL_ORIGIN}/blog/${slug}.html#article"` |
| `headline` | `post.title` |
| `datePublished` | `post.date + 'T00:00:00Z'` |
| `dateModified` | igual que `datePublished` |
| `author` | `{ "@id": "https://ardops.dev/#person" }` |
| `publisher` | `{ "@id": "https://ardops.dev/#person" }` |
| `image` | `cover` absoluto si existe; fallback `og-default.png`. |
| `mainEntityOfPage` | `"${CANONICAL_ORIGIN}/blog/${slug}.html"` |
| `keywords` | `post.tags.join(', ')` (omitido si vacío) |

### Blog (en /blog/)

| Campo | Valor |
|---|---|
| `@context` | `"https://schema.org"` |
| `@type` | `"Blog"` |
| `@id` | `"${CANONICAL_ORIGIN}/blog/#blog"` |
| `name` | `"ardops.dev — Blog"` |
| `url` | `"${CANONICAL_ORIGIN}/blog/"` |
| `inLanguage` | `"es-CR"` |
| `blogPost[]` | array de `{ "@id": "${CANONICAL_ORIGIN}/blog/${slug}.html#article" }` |

### ItemList (en talks/interviews)

| Campo | Valor |
|---|---|
| `@context` | `"https://schema.org"` |
| `@type` | `"ItemList"` |
| `itemListElement[]` | array de `{ "@type": "ListItem", "position": N, "url": ..., "name": ... }` |

### BreadcrumbList (en posts y listings)

| Campo | Valor |
|---|---|
| `@context` | `"https://schema.org"` |
| `@type` | `"BreadcrumbList"` |
| `itemListElement[]` | array de `{ "@type": "ListItem", "position": N, "name": ..., "item": URL }` |

---

## SeoMetaSet

Conjunto de meta tags que una página servida debe declarar.

| Tag | Selector | Requerido |
|---|---|---|
| canonical | `link[rel="canonical"][href]` | sí (excepto `404.html` por D-008) |
| description | `meta[name="description"][content]` | sí |
| og:title | `meta[property="og:title"][content]` | sí |
| og:description | `meta[property="og:description"][content]` | sí |
| og:url | `meta[property="og:url"][content]` | sí |
| og:image | `meta[property="og:image"][content]` | sí |
| og:type | `meta[property="og:type"][content]` | sí |
| twitter:card | `meta[name="twitter:card"][content]` | sí |
| theme-color | `meta[name="theme-color"][content]` | sí |

**Páginas cubiertas** (mismo discovery que `csp-no-unsafe-inline.sh`):

- Estáticas: `index.html`, `404.html`, `talks/index.html`, `uses/index.html`.
- Generadas: `blog/index.html`, `blog/<slug>.html`, `interviews/index.html`,
  `interviews/<slug>.html` (incluye fixtures cuando se construye con
  `--include-fixtures`).
