# Contract: `scripts/lib/feeds.js` API

**Feature**: 011-rss-jsonld-seo
**Phase**: 1 (design)

## Exports

```js
module.exports = {
  renderRss,         // (channel, items) => string (XML)
  renderJsonFeed,    // (channel, items) => string (JSON)
  toRfc822,          // (isoDateString) => string  (helper, exported for tests)
  escapeXml,         // (s) => string              (helper, exported for tests)
};
```

## `renderRss(channel, items)`

**Input**:

```js
channel = {
  title: 'ardops.dev — Blog',
  link: 'https://ardops.dev/blog/',
  description: 'Notas técnicas…',
  language: 'es-CR',
  lastBuildDate: '2026-05-11T00:00:00Z',     // ISO 8601 internamente
  selfHref: 'https://ardops.dev/blog/feed.xml',
};

items = [
  {
    id: 'https://ardops.dev/blog/<slug>.html',
    url: 'https://ardops.dev/blog/<slug>.html',
    title: 'Título',
    summary: 'Resumen…',
    datePublished: '2026-05-11T00:00:00Z',
    tags: ['devsecops', 'spec-driven'],
  },
  // …más items
];
```

**Output**: string XML completo (con `<?xml version="1.0" encoding="UTF-8"?>`),
terminado en `\n`. Ver [rss-2.0-contract.md](./rss-2.0-contract.md).

**Comportamiento**:

- Pure function: mismo input → mismo output (cero `Date.now()`).
- Aplica `escapeXml` a `title`, `description`, cada `category`.
- `lastBuildDate` y `pubDate` se convierten a RFC 822 vía `toRfc822`.
- Si `items.length === 0`, emite `<channel>` sin `<item>`s pero sigue siendo
  válido.
- Throws `TypeError` si `channel` o `items` no son del tipo esperado.

## `renderJsonFeed(channel, items)`

**Input**: idéntico a `renderRss`.

**Output**: string JSON (indentación 2 espacios, terminado en `\n`).

**Comportamiento**:

- Pure function.
- `JSON.stringify` se encarga del escape de strings.
- `tags` se omite del item si `item.tags.length === 0`.
- Si `items.length === 0`, emite `"items": []`.

## `toRfc822(iso)`

**Input**: string ISO 8601 (e.g. `'2026-05-11T00:00:00Z'`).
**Output**: string RFC 822 con offset `+0000` (e.g. `'Mon, 11 May 2026 00:00:00 +0000'`).

**Comportamiento**:

- Usa `new Date(iso)` solo para extraer componentes (year, month, day, hour,
  minute, second, weekday). NO depende de la TZ del runtime: siempre `UTC`.
- Mes y día de semana en inglés (estándar RFC 822).
- Throws `TypeError` si el string no es ISO 8601 válido.

## `escapeXml(s)`

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

Pure, idempotente (`escapeXml(escapeXml(x)) !== escapeXml(x)` por diseño —
los `&amp;` se vuelven a escapar; nunca se llama dos veces sobre el mismo
contenido en el flujo real).

## Reglas adicionales

- Cero I/O: el módulo no lee ni escribe archivos.
- Cero deps externas: solo `node:` builtins (ninguno requerido en realidad).
- CommonJS (`module.exports`), consistente con `scripts/lib/layout.js` y
  `scripts/lib/head.js`.
- JSDoc opcional pero recomendado en cada exportada.
