# Phase 1 — Data Model: Security headers hardening

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Research**: [research.md](research.md)

## Entidades

### `CSP`

La política servida en
`<meta http-equiv="Content-Security-Policy" content="...">` de cada
página HTML.

| Campo | Tipo | Notas |
|---|---|---|
| `raw` | string | El valor completo del atributo `content`. |
| `directives` | `Map<string, string[]>` | Parseado: clave = nombre de la directiva (`default-src`, `style-src`, ...), valor = array de tokens (`'self'`, `'unsafe-inline'`, `'sha256-XXX'`, URLs). |

**Reglas (post-cambio)**: ver [contracts/csp-contract.md](contracts/csp-contract.md).

### `ExternalLink`

Un anchor potencialmente sujeto al gate de tabnabbing.

| Campo | Tipo | Notas |
|---|---|---|
| `file` | string | Ruta relativa del HTML. |
| `line` | number? | Best-effort (puede ser `null` si jsdom no preserva). |
| `href` | string | Valor del atributo `href`. |
| `target` | string? | Valor del atributo `target` (esperado: `"_blank"`). |
| `rel` | string? | Valor del atributo `rel`. |
| `isExternal` | boolean | `true` si `href` apunta a un dominio distinto de `ardops.dev` y scheme `http(s)`. |

**Reglas de clasificación**:

```
isExternal = true sii:
  - parseURL(href).protocol in ['http:', 'https:']
  - AND parseURL(href).host !== 'ardops.dev'
  - AND parseURL(href).host !== ''
```

`mailto:`, `tel:`, paths relativos, fragments → `isExternal = false`.

### `SitemapEntry`

Una URL canónica listada en `sitemap.xml`.

| Campo | Tipo | Notas |
|---|---|---|
| `loc` | string | URL absoluta (`https://ardops.dev/...`). |
| `lastmod` | string? | ISO date opcional. |
| `path` | string | `loc` sin el origen (`/blog/`, `/blog/foo.html`, ...). |
| `expectedFile` | string | Ruta de archivo esperado en disco: `/X/` → `X/index.html`; `/X.html` → `X.html`. |

### `CanonicalRef`

La URL declarada por una página vía
`<link rel="canonical" href="...">`.

| Campo | Tipo | Notas |
|---|---|---|
| `file` | string | Ruta del HTML que la declara. |
| `canonicalUrl` | string | URL absoluta. |
| `path` | string | URL sin origen. |

### `HeadMeta`

Datos comunes emitidos por `scripts/lib/head.js`. **En esta spec**
solo se utiliza la constante `META_REFERRER`; el resto de datos
(charset, viewport, theme-color, color-scheme, author) seguirán
hardcoded en cada generador hasta que una spec futura los consolide.

| Campo | Tipo | Valor |
|---|---|---|
| `META_REFERRER` | string | `<meta name="referrer" content="strict-origin-when-cross-origin">` |

## Relaciones

```
HTML page ──emits──► CSP
HTML page ──contains──► ExternalLink (×N)
HTML page ──may declare──► CanonicalRef
sitemap.xml ──contains──► SitemapEntry (×N)

Gates:
  csp-no-unsafe-inline:    HTML page → CSP (validate)
  external-links:          HTML page → ExternalLink[] (validate)
  sitemap-drift:           SitemapEntry[] ⟷ CanonicalRef[] (bidirectional)
```

## Reglas de validación

### CSP gate

Para cada `<meta http-equiv="Content-Security-Policy">` encontrado:

1. **NO** debe contener los tokens literales `'unsafe-inline'` o
   `'unsafe-eval'` en ninguna directiva.
2. **DEBE** contener todas las directivas:
   - `default-src 'self'`
   - `script-src 'self'` (puede tener hashes adicionales `'sha256-...'`)
   - `frame-ancestors 'none'`
   - `base-uri 'self'`
   - `object-src 'none'`
   - `form-action 'self'`

### External links gate

Para cada `<a target="_blank">`:

1. Si `isExternal === false` → ignorar.
2. Si `isExternal === true`:
   - Parsear `rel` (split por whitespace, lowercase).
   - DEBE contener tanto `noopener` como `noreferrer`.
   - Otros tokens (`external`, `nofollow`, ...) son permitidos.

### Sitemap drift gate

Bidireccional:

**Forward**: para cada `SitemapEntry`:
- `expectedFile` debe existir en disco.

**Backward**: para cada página HTML servida con `CanonicalRef`:
- Si el archivo NO está en `EXCLUDED_FROM_SITEMAP`:
  - `canonicalRef.path` debe coincidir con alguna
    `sitemapEntry.path` (normalización: `/X/` y `/X` son
    equivalentes para el match).

**Lista de exclusiones**:
```
404.html
interviews/valid-minimal.html
interviews/xss-attempt.html
```

## Estado / persistencia

- `CSP`, `ExternalLink`, `CanonicalRef`: derivados del HTML servido,
  recalculados en cada run del gate.
- `SitemapEntry`: parseado de `sitemap.xml` en cada run.
- `META_REFERRER`: constante en código (`scripts/lib/head.js`).

Sin storage, sin BD.

## Migración desde el estado actual

| Página | Estado actual | Estado tras migración |
|---|---|---|
| `blog/index.html` | CSP con `'unsafe-inline'`, `<style id="blog-tag-rules">` inline, sin meta referrer | CSP `'self'`, `<link>` a CSS externo, meta referrer presente |
| `blog/<slug>.html` | CSP con `'unsafe-inline'`, sin meta referrer | CSP `'self'`, meta referrer presente |
| `index.html` | Sin meta referrer | Meta referrer presente (vía marker `<!-- head-meta:start -->`) |
| `404.html` | Sin meta referrer | Meta referrer presente (vía marker) |
| `talks/index.html` | Sin meta referrer | Meta referrer presente (vía marker) |
| `interviews/index.html` | Sin meta referrer | Meta referrer presente (vía generator) |
| `interviews/<slug>.html` | Sin meta referrer | Meta referrer presente (vía generator) |
| `assets/css/blog-tag-rules.css` | No existe | Generado por `build-blog.js` en cada build |
| `sitemap.xml` | Le falta `interviews/victor-ardon.html` | Entrada agregada |
