# Contract: Gate `tests/jsonld-validate.sh`

**Feature**: 011-rss-jsonld-seo
**Phase**: 1 (design)

## Propósito

Validar que cada `<script type="application/ld+json">` emitido por el sitio
es JSON parseable y que los `@id` referenciados internamente existen.

## Comando

```bash
bash tests/jsonld-validate.sh
```

## Implementación

- `tests/jsonld-validate.sh` exec `node scripts/check-jsonld.js`.
- `scripts/check-jsonld.js` descubre páginas servidas con el mismo patrón
  que `scripts/check-csp.js`:
  - STATIC_PAGES: `index.html`, `404.html`, `talks/index.html`, `uses/index.html`.
  - `blog/*.html`, `interviews/*.html` (excepto si gitignored y no rebuild).
- Para cada página, extrae todos los `<script type="application/ld+json">`
  vía `jsdom`, parsea el contenido con `JSON.parse` estricto, y valida.

## Validaciones

| ID | Validación | Severidad |
|---|---|---|
| V-1 | Cada `<script type="application/ld+json">` parsea con `JSON.parse` estricto. | error |
| V-2 | Cada bloque tiene `@context` (= `https://schema.org`) y `@type`. | error |
| V-3 | Si un bloque referencia un `@id` (dentro de `author`, `publisher`, `blogPost[]`, etc.), ese `@id` existe en la misma página o coincide con un `@id` global conocido (`https://ardops.dev/#person`). | error |
| V-4 | El `Person` global emitido en `index.html` declara `@id` === `https://ardops.dev/#person`. | error |
| V-5 | Cada `Article` declara `@id`, `headline`, `datePublished`, `author`, `mainEntityOfPage`. | error |
| V-6 | Cada `BreadcrumbList` declara `itemListElement[]` con `position` consecutivo desde 1. | error |
| V-7 | Cada `ItemList` declara `itemListElement[]` (puede ser `[]`). | error |

## Output esperado

**Éxito**:

```
✓ jsonld-validate gate: N page(s) checked, M JSON-LD block(s) validated, all pass.
```

Exit 0.

**Falla**: `jsonld-validate: <archivo>: <ID>: <descripción>`, exit 1.

## Integración CI

```yaml
jsonld-validate:
  runs-on: ubuntu-latest
  needs: build
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '20' }
    - run: npm ci || npm install
    - run: node scripts/build-blog.js
    - run: node scripts/build-interviews.js --strict --out interviews/
    - run: node scripts/build-layout.js
    - run: bash tests/jsonld-validate.sh
```
