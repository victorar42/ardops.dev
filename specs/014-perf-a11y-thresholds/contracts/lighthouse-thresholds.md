# Contract — Lighthouse threshold configs

Versión normativa de `tests/lighthouserc.json` (desktop) y
`tests/lighthouserc.mobile.json` (mobile) tras la spec 014.

## Cambios vs estado actual

| Campo | Antes | Después |
|---|---|---|
| desktop `url[]` | 6 URLs (sin `interviews/index.html` ni último post) | 8 URLs (suma `interviews/index.html` + último post) |
| mobile `url[]` | 6 URLs (idem) | 8 URLs (idem desktop) |
| mobile `categories:performance` minScore | 0.9 | **0.95** |
| desktop categorías | 0.95 / 1.0 / 0.95 / 0.95 | sin cambio |
| desktop CWV (LCP/CLS/TBT) | 2500 / 0.1 / 200 | sin cambio |
| mobile CWV (LCP/CLS/TBT) | 3000 / 0.1 / 300 | sin cambio |
| `numberOfRuns` | 3 | sin cambio |
| `skipAudits` | (lista actual) | sin cambio |
| `total-byte-weight.maxNumericValue` | 512000 | sin cambio |

## URLs canónicas (idénticas en desktop y mobile)

```json
[
  "http://localhost/index.html",
  "http://localhost/blog/index.html",
  "http://localhost/blog/<latest>.html",
  "http://localhost/interviews/index.html",
  "http://localhost/talks/index.html",
  "http://localhost/speaking/index.html",
  "http://localhost/now/index.html",
  "http://localhost/404.html"
]
```

**Nota sobre "último post"**: durante `/speckit.tasks` se determinará el
slug actual leyendo el HTML de `blog/index.html` (primer link a
`/blog/<slug>.html`). Si no hay posts publicados (solo fixtures), la
URL del post se omite hasta que exista contenido real.

## Asserts (idénticos en ambos archivos para categorías; CWV difieren)

```json
{
  "categories:performance":     ["error", { "minScore": 0.95 }],
  "categories:accessibility":   ["error", { "minScore": 1.0 }],
  "categories:best-practices":  ["error", { "minScore": 0.95 }],
  "categories:seo":             ["error", { "minScore": 0.95 }],
  "cumulative-layout-shift":    ["error", { "maxNumericValue": 0.1 }],
  "total-byte-weight":          ["error", { "maxNumericValue": 512000 }],

  // desktop
  "largest-contentful-paint":   ["error", { "maxNumericValue": 2500 }],
  "total-blocking-time":        ["error", { "maxNumericValue": 200 }],

  // mobile
  "largest-contentful-paint":   ["error", { "maxNumericValue": 3000 }],
  "total-blocking-time":        ["error", { "maxNumericValue": 300 }]
}
```

## Mantenimiento

- Cuando se agrega una página nueva al sitio, agregar también su URL
  aquí. Auditoría humana en code review (no hay gate automática que lo
  verifique en esta spec).
- Cuando se publica un nuevo blog post, actualizar el slug "<latest>".
  Tarea trivial documentada en `docs/04-content-spec.md` (post-publish
  checklist).
- Cambios futuros a thresholds (subir o bajar) requieren PR con
  justificación y referencia a la sección "Performance" de
  `docs/06-performance-spec.md`.

## Validación

```bash
# Local
npx --yes @lhci/cli@latest autorun --config=tests/lighthouserc.json
npx --yes @lhci/cli@latest autorun --config=tests/lighthouserc.mobile.json
```

CI (existing): job `lighthouse` corre el comando equivalente.
