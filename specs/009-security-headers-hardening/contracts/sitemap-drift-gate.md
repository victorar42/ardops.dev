# Contract — Gate `tests/sitemap-drift.sh`

**Spec**: [../spec.md](../spec.md) · **FRs**: FR-009, FR-010, FR-011

## Propósito

Detectar drift bidireccional entre `sitemap.xml` y los `<link rel="canonical">`
declarados por las páginas servidas.

## Implementación

- Wrapper bash: `tests/sitemap-drift.sh`
- Logic: `scripts/check-sitemap-drift.js` (Node + jsdom).

## Datos de entrada

1. **Sitemap entries**: parsear `sitemap.xml` con jsdom (modo XML).
   Extraer todos los `<loc>`.
2. **Canonical refs**: para cada `*.html` servido (excepto
   `legacy/`, `specs/`, `.reference/`, `node_modules/`), parsear y
   extraer el `<link rel="canonical">` si existe.

## Lista de exclusiones

Páginas servidas que NO deben aparecer en sitemap:

```js
const EXCLUDED_FROM_SITEMAP = [
  '404.html',
  'interviews/valid-minimal.html',
  'interviews/xss-attempt.html',
];
```

## Normalización de paths

Para comparar `loc` (URL absoluta del sitemap) con `canonical` (URL
absoluta del `<link>`):

1. Strip origin (`https://ardops.dev`).
2. Strip trailing slash si el path tiene >1 char.
3. Comparar como strings exactos (case-sensitive).

Ejemplo:
- `https://ardops.dev/blog/` → `/blog`
- `https://ardops.dev/blog/foo.html` → `/blog/foo.html`
- `https://ardops.dev/` → `/`

## Resolución a archivo en disco

Para validar que una `<loc>` corresponde a un archivo real:

| Path | Archivo esperado |
|---|---|
| `/` | `index.html` |
| `/blog/` | `blog/index.html` |
| `/blog/foo.html` | `blog/foo.html` |
| `/talks/` | `talks/index.html` |
| `/interviews/` | `interviews/index.html` |
| `/interviews/foo.html` | `interviews/foo.html` |

## Validaciones (V-N)

### V-1 — Forward: cada `<loc>` resuelve a un archivo existente

Para cada `SitemapEntry`:
- `expectedFile` debe existir en disco.

**Falla si**: archivo no existe.

### V-2 — Backward: cada canonical de página servida está en sitemap

Para cada página HTML servida con `<link rel="canonical">`:
- Si la página NO está en `EXCLUDED_FROM_SITEMAP`:
  - Su `canonical` (normalizado) debe coincidir con alguna `<loc>`
    (normalizada) del sitemap.

**Falla si**: la canonical no aparece en el sitemap.

### V-3 — Backward extendido: páginas sin `<link rel="canonical">`

Para cada página HTML servida que NO declara canonical y NO está en
`EXCLUDED_FROM_SITEMAP`:
- Reportar como **WARNING** (no falla el gate).
- Mensaje sugiere agregar `<link rel="canonical">`.

(Se mantiene como warning para no acoplar este gate al gate de SEO.
Una spec futura puede convertirlo en error.)

## Output

### Éxito (exit 0)

```
✓ Sitemap-drift gate:
    - 6 sitemap entries, all resolve to files
    - 7 served pages with canonicals, all present in sitemap
    - 0 served pages without canonical (excluding allowlist)
```

### Fallo (exit 1)

```
✗ Sitemap-drift gate: 1 violation(s) detected.

  V-2 (backward): canonical missing from sitemap
    - File: interviews/victor-ardon.html
      Canonical: https://ardops.dev/interviews/victor-ardon.html
      Action: add <url><loc>https://ardops.dev/interviews/victor-ardon.html</loc>...</url>
              to sitemap.xml

      Or, if intentional: add 'interviews/victor-ardon.html' to
      EXCLUDED_FROM_SITEMAP in scripts/check-sitemap-drift.js
```

## Comportamiento en CI

- Bloqueante para V-1 y V-2.
- V-3 emite warning a stdout pero no falla.
- Tiempo de ejecución esperado: < 2s.

## Caso del estado actual

Al ejecutar el gate **antes** del fix, debe reportar:

```
✗ Sitemap-drift gate: 1 violation(s) detected.

  V-2: interviews/victor-ardon.html missing from sitemap.xml
```

Como parte de la implementación de spec 009, se agrega esa entrada y
el gate pasa.

## Cómo extender

- Nuevos archivos a excluir: editar `EXCLUDED_FROM_SITEMAP`.
- Nuevas reglas de normalización: editar `normalizePath()` en
  `scripts/check-sitemap-drift.js` y actualizar este contrato.
