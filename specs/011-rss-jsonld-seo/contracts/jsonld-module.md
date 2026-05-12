# Contract: `scripts/lib/jsonld.js` API

**Feature**: 011-rss-jsonld-seo
**Phase**: 1 (design)

## Exports

```js
module.exports = {
  PERSON_ID,                     // 'https://ardops.dev/#person'
  CANONICAL_ORIGIN,              // 'https://ardops.dev'
  personSchema,                  // () => object
  articleSchema,                 // (post) => object
  blogSchema,                    // (channelMeta, posts) => object
  itemListSchema,                // (items) => object
  breadcrumbsSchema,             // (crumbs) => object
  serialize,                     // (schemaObj) => string  (HTML <script> wrapper)
};
```

## `personSchema()`

Devuelve el objeto `Person` canónico. Constante para todo el sitio.

```js
{
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://ardops.dev/#person',
  name: 'Victor Josue Ardón Rojas',
  url: 'https://ardops.dev/',
  image: 'https://ardops.dev/public/og/og-default.png',
  jobTitle: 'DevOps Engineer',
  sameAs: [
    'https://github.com/victorar42',
    'https://www.linkedin.com/in/victorar42/'
  ]
}
```

## `articleSchema(post)`

**Input**: `post` con `slug`, `title`, `date` (YYYY-MM-DD), `summary`, `tags`,
`cover` (opcional).

**Output**: objeto `Article` (ver [jsonld-schemas.md](./jsonld-schemas.md)).

- `datePublished` = `dateModified` = `${post.date}T00:00:00Z`.
- `image`: `${CANONICAL_ORIGIN}/${post.cover}` si existe, sino
  `${CANONICAL_ORIGIN}/public/og/og-default.png`.
- `keywords` se omite si `post.tags` vacío.

## `blogSchema(channelMeta, posts)`

**Input**:
- `channelMeta`: `{ name, url, description, inLanguage }`.
- `posts`: array de `{ slug }` (resto de campos no se usan).

**Output**: objeto `Blog` con `blogPost` referenciando posts por `@id`.

## `itemListSchema(items)`

**Input**: `items` = array de `{ url, name }`.

**Output**: objeto `ItemList` con `itemListElement` indexado desde 1.

- Si `items.length === 0`, retorna un `ItemList` con
  `itemListElement: []`.

## `breadcrumbsSchema(crumbs)`

**Input**: `crumbs` = array de `{ name, item }` (URL absoluta).

**Output**: objeto `BreadcrumbList` con `position` 1-indexed.

## `serialize(schemaObj)`

**Input**: cualquier objeto schema.org.

**Output**: string HTML completo:

```html
<script type="application/ld+json">
{ ... JSON.stringify(schemaObj, null, 2) ... }
</script>
```

- Indentación interna del JSON: 2 espacios.
- Salto de línea antes del `</script>`.
- Cero escape extra: `JSON.stringify` no produce `<` ni `>` literales en
  strings (los emite como `\u003c` cuando el caller usa el flag `
  ` adecuado, o como `<` directo). Para evitar `</script>` accidental
  en valores, ver regla siguiente.

**Regla de seguridad**: si un valor de string contiene `</`, se reemplaza
post-stringify por `<\/` para evitar romper el `<script>` enclosing
(práctica estándar de inline JSON en HTML):

```js
function serialize(obj) {
  const json = JSON.stringify(obj, null, 2).replace(/<\//g, '<\\/');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}
```

## Reglas adicionales

- Cero I/O.
- Cero deps externas.
- CommonJS.
- Pure functions: mismo input → mismo output.
- Las constantes (`PERSON_ID`, `CANONICAL_ORIGIN`) se exportan para que
  los gates puedan referenciarlas sin duplicar.
