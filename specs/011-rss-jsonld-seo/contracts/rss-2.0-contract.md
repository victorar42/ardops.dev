# Contract: RSS 2.0 — `blog/feed.xml`

**Feature**: 011-rss-jsonld-seo
**Phase**: 1 (design)

## Estructura exacta

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ardops.dev — Blog</title>
    <link>https://ardops.dev/blog/</link>
    <description>Notas técnicas en primera persona sobre lo que estoy construyendo.</description>
    <language>es-CR</language>
    <lastBuildDate>Mon, 11 May 2026 00:00:00 +0000</lastBuildDate>
    <atom:link href="https://ardops.dev/blog/feed.xml" rel="self" type="application/rss+xml"/>

    <item>
      <title>Cómo construí mi pipeline de seguridad spec-driven</title>
      <link>https://ardops.dev/blog/pipeline-seguridad-spec-driven.html</link>
      <guid isPermaLink="true">https://ardops.dev/blog/pipeline-seguridad-spec-driven.html</guid>
      <pubDate>Mon, 11 May 2026 00:00:00 +0000</pubDate>
      <description>Resumen del post, con &amp; ampersands escapados como entidades.</description>
      <category>devsecops</category>
      <category>spec-driven</category>
    </item>

    <!-- repetir <item> por cada post publicado, ordenado desc por fecha -->
  </channel>
</rss>
```

## Reglas

- **Encoding**: UTF-8 declarado en la primera línea.
- **Namespace `atom`**: declarado en el elemento raíz `<rss>`.
- **`<lastBuildDate>`**: derivado de `max(post.date)` de los publicados,
  formateado como **RFC 822** con offset `+0000`. Si no hay posts, usar
  fecha sentinel `Sun, 11 Jan 2026 00:00:00 +0000`.
- **`<atom:link rel="self">`**: obligatorio (Best Practice RSS 2.0).
- **`<item>` por post**: ordenado desc por `post.date`, asc por `slug` (mismo
  orden que `loadPosts` ya devuelve).
- **`<guid isPermaLink="true">`**: idéntico al `<link>` del item (URL
  absoluta).
- **`<pubDate>`**: `post.date` formateado como RFC 822 con `+0000`.
- **`<description>`**: `post.summary` con escape XML estricto (5 entidades:
  `&amp;`, `&lt;`, `&gt;`, `&apos;`, `&quot;`). **Cero CDATA**.
- **`<category>`**: una etiqueta por tag. Si `post.tags` es vacío, no se
  emiten `<category>`s.
- **Feed vacío** (cero posts publicados): el `<channel>` se emite igual
  con sus campos hardcoded; cero `<item>`s.

## Escape XML

Función `escapeXml(s)` en `scripts/lib/feeds.js`:

```js
function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

Aplicado a: `title`, `description`, `category` (cualquier texto que va
entre tags). NO aplicado a URLs en `<link>`, `<guid>`, `<atom:link href>`
(usar URL encoding si hace falta).

## Validación

- `xmllint --noout blog/feed.xml` → exit 0.
- `tests/feed-validate.sh` → cobertura completa (ver
  [feed-validate-gate.md](./feed-validate-gate.md)).
- Pegar `https://ardops.dev/blog/feed.xml` en https://validator.w3.org/feed/
  (smoke manual): cero errores.
