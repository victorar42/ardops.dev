# Contract: JSON Feed 1.1 — `blog/feed.json`

**Feature**: 011-rss-jsonld-seo
**Phase**: 1 (design)

## Estructura exacta

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "ardops.dev — Blog",
  "home_page_url": "https://ardops.dev/blog/",
  "feed_url": "https://ardops.dev/blog/feed.json",
  "description": "Notas técnicas en primera persona sobre lo que estoy construyendo.",
  "language": "es-CR",
  "authors": [
    {
      "name": "Victor Josue Ardón Rojas",
      "url": "https://ardops.dev/"
    }
  ],
  "items": [
    {
      "id": "https://ardops.dev/blog/pipeline-seguridad-spec-driven.html",
      "url": "https://ardops.dev/blog/pipeline-seguridad-spec-driven.html",
      "title": "Cómo construí mi pipeline de seguridad spec-driven",
      "summary": "Resumen del post, sin escape especial — JSON nativo lo maneja.",
      "date_published": "2026-05-11T00:00:00Z",
      "tags": ["devsecops", "spec-driven"],
      "language": "es-CR"
    }
  ]
}
```

## Reglas

- **`version`**: literal `"https://jsonfeed.org/version/1.1"`.
- **`feed_url`**: URL absoluta del propio feed.
- **`home_page_url`**: `https://ardops.dev/blog/`.
- **`authors`**: array con un único `Person` (mismo nombre + url que el
  `Person` de JSON-LD).
- **`items[]`**: ordenado desc por fecha, mismo orden que el RSS.
  - `id` = `url` = URL absoluta del post.
  - `summary` = `post.summary` (JSON.stringify maneja todo escape).
  - `date_published` = ISO 8601 con `Z` (UTC).
  - `tags` = `post.tags` (omitir el campo si vacío).
- **Indentación**: 2 espacios; salto de línea final.
- **Cero campos no-estándar** (e.g. `_attachments`, `_external`).
- **Feed vacío**: `"items": []`. El resto del documento idéntico.

## Serialización

```js
function renderJsonFeed(channel, items) {
  const obj = {
    version: 'https://jsonfeed.org/version/1.1',
    title: channel.title,
    home_page_url: channel.link,
    feed_url: channel.selfHref,
    description: channel.description,
    language: channel.language,
    authors: [{ name: 'Victor Josue Ardón Rojas', url: 'https://ardops.dev/' }],
    items: items.map(toJsonFeedItem),
  };
  return JSON.stringify(obj, null, 2) + '\n';
}
```

`toJsonFeedItem(item)` retorna `{ id, url, title, summary, date_published,
language: 'es-CR', tags? }` — `tags` se omite si `item.tags.length === 0`.

## Validación

- `python3 -m json.tool < blog/feed.json` → exit 0.
- `tests/feed-validate.sh` valida: parseo JSON estricto, `version` exacto,
  cada item con campos requeridos.
- https://validator.jsonfeed.org/ (smoke manual): cero errores.
