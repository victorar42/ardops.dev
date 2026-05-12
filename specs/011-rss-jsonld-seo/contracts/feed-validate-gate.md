# Contract: Gate `tests/feed-validate.sh`

**Feature**: 011-rss-jsonld-seo
**Phase**: 1 (design)

## Propósito

Validar que `blog/feed.xml` y `blog/feed.json` cumplen sus respectivos
contratos (RSS 2.0 y JSON Feed 1.1).

## Comando

```bash
bash tests/feed-validate.sh
```

## Implementación

- `tests/feed-validate.sh` es un wrapper que `exec node scripts/check-feeds.js`.
- `scripts/check-feeds.js` (CommonJS, usa `jsdom` para parsear XML como
  `text/xml`).

## Validaciones — RSS (`blog/feed.xml`)

| ID | Validación | Severidad |
|---|---|---|
| V-1 | Archivo existe y es leíble. | error |
| V-2 | Parsea como XML bien formado (sin errores de `JSDOM` en modo `text/xml`). | error |
| V-3 | Contiene exactamente un elemento `<rss version="2.0">`. | error |
| V-4 | Contiene exactamente un `<channel>`. | error |
| V-5 | `<channel>` declara `<title>`, `<link>`, `<description>`, `<language>`, `<lastBuildDate>`. | error |
| V-6 | `<channel>` contiene un `<atom:link rel="self" href="…feed.xml" type="application/rss+xml">`. | error |
| V-7 | Cada `<item>` declara `<title>`, `<link>`, `<guid>`, `<pubDate>`. | error |
| V-8 | Cada `<guid>` es URL absoluta y `isPermaLink="true"` se respeta. | error |
| V-9 | Cero `'unsafe-inline'`, cero `<script>`, cero entidades HTML inseguras (`<iframe>`, etc.) en cuerpo de `<description>`. | error |

## Validaciones — JSON Feed (`blog/feed.json`)

| ID | Validación | Severidad |
|---|---|---|
| V-10 | Archivo existe y parsea como JSON estricto. | error |
| V-11 | `version` === `"https://jsonfeed.org/version/1.1"`. | error |
| V-12 | `title`, `home_page_url`, `feed_url`, `language` presentes y son strings no vacíos. | error |
| V-13 | `items` es array. | error |
| V-14 | Cada item declara `id`, `url`, `title`, `date_published` (ISO 8601). | error |

## Output esperado

**Éxito**:

```
✓ feed-validate gate:
    - blog/feed.xml: 1 channel, N item(s) validated
    - blog/feed.json: 1.1 manifest, N item(s) validated
```

Exit 0.

**Falla**: mensaje por línea `feed-validate: <archivo>: <ID>: <descripción>`,
exit 1.

## Integración CI

Job `feed-validate` en `.github/workflows/ci.yml`:

```yaml
feed-validate:
  runs-on: ubuntu-latest
  needs: build
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '20' }
    - run: npm ci || npm install
    - run: node scripts/build-blog.js
    - run: bash tests/feed-validate.sh
```
