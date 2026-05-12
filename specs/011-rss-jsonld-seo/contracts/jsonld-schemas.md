# Contract: JSON-LD Schemas

**Feature**: 011-rss-jsonld-seo
**Phase**: 1 (design)

> Cada bloque se emite como `<script type="application/ld+json">…</script>`.
> Múltiples nodos en una página → múltiples `<script>`s separados (uno por
> nodo), no un array dentro de un solo `<script>`.

---

## Person (Home + referenciado)

Emitido en `index.html`. Referenciado por `@id` desde Article/Blog.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://ardops.dev/#person",
  "name": "Victor Josue Ardón Rojas",
  "url": "https://ardops.dev/",
  "image": "https://ardops.dev/public/og/og-default.png",
  "jobTitle": "DevOps Engineer",
  "sameAs": [
    "https://github.com/victorar42",
    "https://www.linkedin.com/in/victorar42/"
  ]
}
</script>
```

**Reglas**:

- `@id` literal `"https://ardops.dev/#person"` — referenciable globalmente.
- Conservar el `Person` ya presente en `index.html` (extender con `@id`
  si falta; no remover campos como `description`, `email`, etc.).
- Solo el `@id` debe ser estable; el resto de campos puede crecer.

## Article (por post)

Emitido en cada `blog/<slug>.html`.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://ardops.dev/blog/pipeline-seguridad-spec-driven.html#article",
  "headline": "Cómo construí mi pipeline de seguridad spec-driven",
  "datePublished": "2026-05-11T00:00:00Z",
  "dateModified": "2026-05-11T00:00:00Z",
  "author": { "@id": "https://ardops.dev/#person" },
  "publisher": { "@id": "https://ardops.dev/#person" },
  "image": "https://ardops.dev/public/og/og-default.png",
  "mainEntityOfPage": "https://ardops.dev/blog/pipeline-seguridad-spec-driven.html",
  "keywords": "devsecops, spec-driven"
}
</script>
```

**Reglas**:

- `@id` con fragment `#article` para diferenciar del `mainEntityOfPage`.
- `datePublished` y `dateModified` en ISO 8601 UTC (`T00:00:00Z`).
- `author` y `publisher` referencian al `Person` global por `@id`.
- `image`: `cover` absoluto si existe; fallback `og-default.png`.
- `keywords`: omitir si `tags` vacío.

## Blog (en /blog/)

Emitido en `blog/index.html`.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": "https://ardops.dev/blog/#blog",
  "name": "ardops.dev — Blog",
  "url": "https://ardops.dev/blog/",
  "description": "Notas técnicas en primera persona sobre lo que estoy construyendo.",
  "inLanguage": "es-CR",
  "publisher": { "@id": "https://ardops.dev/#person" },
  "blogPost": [
    { "@id": "https://ardops.dev/blog/pipeline-seguridad-spec-driven.html#article" }
  ]
}
</script>
```

**Reglas**:

- `blogPost[]` siempre array (vacío si no hay posts).
- Cada elemento referencia al `Article` por `@id`.

## ItemList (en talks e interviews)

Emitido en `talks/index.html` y `interviews/index.html`.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://ardops.dev/talks/#talk-techno-week-8",
      "name": "Seguridad como Código: DevSecOps Spec-Driven sobre GitHub para Banca"
    }
  ]
}
</script>
```

**Reglas**:

- `position` 1-indexed.
- `url` puede ser un anchor (`/talks/#talk-id`) si la talk no tiene página
  propia (caso actual de `talks/`).
- Para `interviews/`, cada item apunta a su `interviews/<slug>.html`.
- `itemListElement` puede ser `[]` si no hay items.

## BreadcrumbList (en posts y listings)

Emitido junto al schema principal de cada página (Article, Blog, ItemList).

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://ardops.dev/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://ardops.dev/blog/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Cómo construí mi pipeline de seguridad spec-driven",
      "item": "https://ardops.dev/blog/pipeline-seguridad-spec-driven.html"
    }
  ]
}
</script>
```

**Jerarquías exactas** (D-014):

| Página | Crumbs |
|---|---|
| `/blog/<slug>.html` | Home → Blog → `<title del post>` |
| `/blog/` | Home → Blog |
| `/talks/` | Home → Charlas |
| `/interviews/` | Home → Entrevistas |
| `/interviews/<slug>.html` | Home → Entrevistas → `<title>` |
| `/uses/` | sin cambios (spec 010) |
| `/` | sin breadcrumb |

`name` por nivel: del nav compartido (`scripts/lib/layout.js` NAV).
