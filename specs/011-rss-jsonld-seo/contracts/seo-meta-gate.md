# Contract: Gate `tests/seo-meta.sh`

**Feature**: 011-rss-jsonld-seo
**Phase**: 1 (design)

## Propósito

Validar que toda página HTML servida declara los meta tags SEO mínimos
(canonical, description, OG, Twitter card, theme-color), evitando que un
PR olvide alguno por accidente.

## Comando

```bash
bash tests/seo-meta.sh
```

## Implementación

- `tests/seo-meta.sh` exec `node scripts/check-seo-meta.js`.
- Descubre páginas servidas idéntico a `csp-no-unsafe-inline.sh`.

## Meta tags requeridos (FR-013)

| Tag | Selector |
|---|---|
| canonical | `link[rel="canonical"][href]` |
| description | `meta[name="description"][content]` |
| og:title | `meta[property="og:title"][content]` |
| og:description | `meta[property="og:description"][content]` |
| og:url | `meta[property="og:url"][content]` |
| og:image | `meta[property="og:image"][content]` |
| og:type | `meta[property="og:type"][content]` |
| twitter:card | `meta[name="twitter:card"][content]` |
| theme-color | `meta[name="theme-color"][content]` |

## Reglas por página (allowlist)

```js
const PER_PAGE_RULES = {
  '404.html': { skipCanonical: true },
};
```

Cualquier otra excepción debe documentarse explícitamente en este archivo
y en `scripts/check-seo-meta.js` con un comentario justificando.

## Validaciones

| ID | Validación | Severidad |
|---|---|---|
| V-1 | Cada página declara cada meta tag requerido (excepto los marcados `skip*` en allowlist). | error |
| V-2 | El valor (`href` o `content`) es una string no vacía después de `trim()`. | error |
| V-3 | `og:url` y `canonical`, cuando ambos están, apuntan a la misma URL absoluta. | error |
| V-4 | `og:image` es URL absoluta (`https://ardops.dev/...`). | error |

## Output esperado

**Éxito**:

```
✓ seo-meta gate: N page(s) validated, all meta tags present.
```

Exit 0.

**Falla**: `seo-meta: <archivo>: falta <selector>` (una línea por
violación), exit 1.

## Integración CI

```yaml
seo-meta:
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
    - run: bash tests/seo-meta.sh
```
