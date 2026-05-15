# Phase 0 — Research: OG images dinámicas por post

**Feature**: 017-og-images-dynamic | **Date**: 2026-05-14

Decisiones tomadas para resolver todos los unknowns. Cero
`NEEDS CLARIFICATION` remanentes.

---

## R-01 — Render engine: SVG + `sharp`

**Decisión**: `sharp ^0.33.x` como devDependency build-only, con
plantilla SVG estática.

**Rationale**:
- Pipeline: cargar `scripts/og/template.svg` → sustituir placeholders
  (`{TITLE_SVG}`, `{TAGS_SVG}`, etc.) → pasar al constructor de
  `sharp` con `density` adecuado → `.png({ compressionLevel: 9 })` →
  buffer.
- `sharp` usa libvips, instalación binaria pre-built en macOS/Linux/CI,
  estable y bien mantenida.
- Solo build-time; cero impacto en runtime del sitio.

**Alternativas evaluadas y rechazadas**:
| Lib | Por qué se descarta |
|---|---|
| `satori` + `sharp` | Layout flex-like sería más cómodo, pero arrastra ~10 MB de devDeps (yoga-wasm-base, react-types). Para ~20 posts y un layout fijo simple, no compensa. |
| `node-canvas` | Nativo libcairo; histórico frágil en CI; APIs imperativas (no declarativo); peor reproducibilidad cross-platform. |
| `puppeteer screenshot` | Ya está en devDeps, pero levantar Chromium por post es lento; reproducibilidad cross-version frágil; overkill. |
| `resvg-js` | Renderer SVG puro, sin libvips. Decente alternativa; rechazada por menor adopción y menor cobertura de SVG advanced features (gradientes complejos, foreignObject). |

**Justificación constitucional (Principio IV)**:
- Peso unpacked: `sharp` ~30 MB con binarios pre-built (mac arm64).
  Sigue siendo devDep, no se sirve.
- Integridad: paquete oficial; mantenido por lovell.
- Licencia: Apache-2.0.

---

## R-02 — Plantilla SVG (Opción A confirmada)

**Decisión**: una sola plantilla `scripts/og/template.svg` con
placeholders ASCII safe que un transform de string sustituye antes de
pasar al render.

**Placeholders**:
- `{{TITLE_LINES}}` → fragmento SVG con 1-2 `<tspan>` de título.
- `{{TAGS_SVG}}` → fragmento SVG con chips de tags (puede ser vacío).
- `{{LOGO_TEXT}}` → siempre `"ardops.dev"` (estable).

**Por qué placeholders no atributo XML**: el wrap manual del título
necesita generar `<tspan>` propios; es más limpio inyectar el bloque
ya armado que parsear/manipular el SVG con jsdom en build (overkill).

**Versionado de plantilla**: constante
`const OG_TEMPLATE_VERSION = 'v1';` en `scripts/build-og.js`. Cualquier
cambio del layout que requiera regeneración global bumpa la versión
(p.ej. v2). El hash de drift incluye `OG_TEMPLATE_VERSION` → todos los
PNGs se regeneran en la misma PR que sube la versión.

---

## R-03 — Layout y tipografía

**Decisión**:

```text
┌──────────────────────────────────────────────────┐
│ // blog                                          │  <- section label (acento)
│                                                  │
│  Título del post en grande,                      │
│  máximo 2 líneas, Outfit 700                     │
│                                                  │
│                                                  │
│  #tag-a  #tag-b  #tag-c        ardops.dev   │   │  <- chips izq, logo der, rail
└──────────────────────────────────────────────────┘
       ↑                                       ↑
  padding 64 px                          accent rail (right edge)
```

Dimensiones:
- Canvas 1200 × 630, padding 64 px todos los lados.
- Section label: Outfit 600, 24 px, color `--accent`.
- Título: Outfit 700, 64 px primario, line-height 1.1, color `--text-primary`.
- Chips: Outfit 600, 22 px sobre fondo `--bg-card` con borde `--accent-dim`,
  color `--accent`.
- Logo: JetBrains Mono 700, 28 px, color `--text-primary`.
- Accent rail: 8 px de ancho, altura completa, color `--accent` glow al 60%.
- Gradient de fondo: lineal `--bg-primary` (esquina superior izquierda) →
  `--bg-secondary` (esquina inferior derecha).

**Validación de contraste WCAG AA** (ya cubierto por la paleta global):
- Título sobre fondo: ratio > 8:1.
- Chips sobre fondo: ratio > 5:1.
- Logo sobre fondo: ratio > 7:1.

---

## R-04 — Wrap manual y truncado

**Decisión**:
- Máximo **2 líneas** de título.
- Cortar por **palabras** (no por caracteres). Algoritmo greedy: ir
  acumulando palabras; cuando se pasa de ~28 chars por línea (ajuste
  empírico para Outfit 64 px en 1072 px de ancho útil), abrir nueva
  línea. Si excede 2 líneas, truncar la segunda con `…`.
- Tags: ordenar tal como vienen del frontmatter; mostrar **máximo 4
  chips**; si hay más, mostrar 3 + `+N`.

**Rationale**: la métrica exacta del ancho depende de la fuente. En vez
de medir con un layout engine, calibramos el límite por inspección
visual sobre títulos reales y dejamos un margen seguro. Es
determinista (cero ambiente).

**Edge cases manejados**:
- Título corto (< 28 chars): una sola línea, layout centrado vertical
  sobre el rectángulo de título.
- Sin tags: la fila de chips se omite por completo; el logo se
  mantiene en su posición.
- Tags muy largos (> 16 chars): chip se trunca con `…` interno.

---

## R-05 — Fuentes embebidas

**Decisión**: usar `<style>` dentro del SVG con `@font-face` que
referencia las fuentes self-hosted del proyecto **vía URL `data:` o
ruta `file://` absoluta** durante el render.

**Implementación práctica**: como `sharp` resuelve URLs externas en
SVGs con limitaciones, embebemos las fuentes como base64 dentro del
SVG en build. Variante alternativa: inyectar `font-family` con
fallback genérico y dejar que libvips use la versión system del nombre
de familia (frágil cross-platform).

**Decisión final**: embebido base64. Las fuentes están ya en
`assets/fonts/`. Las cargamos al inicio del builder, base64-las, y
las inyectamos en el `<style>` del SVG antes de cada render.

**Costo**: cada SVG generado pesa ~150-200 KB intermedios (no se
sirven; viven solo en memoria). El PNG resultante es < 100 KB.

---

## R-06 — Manifest y drift detection

**Decisión**: archivo JSON en
`public/og/blog/manifest.json`, commiteado, con estructura:

```json
{
  "version": 1,
  "templateVersion": "v1",
  "entries": {
    "<slug>": {
      "hash": "<sha256 hex>",
      "title": "<title>",
      "tags": ["<tag1>", "<tag2>"]
    }
  }
}
```

**Algoritmo del hash**:

```text
hash = sha256(
  templateVersion + '\n' +
  title + '\n' +
  sortedTags.join(',') + '\n'
)
```

**Por qué no leer metadata XMP del PNG**: sharp no escribe XMP
deterministicamente; mantener un archivo JSON paralelo es más simple,
auditable en code review, y reproducible.

**Drift detection (--check)**:
1. Cargar manifest del disco.
2. Para cada post publicado, calcular hash actual.
3. Si `manifest.entries[slug]?.hash !== currentHash` → drift.
4. Si `manifest.entries[slug]` existe pero el slug ya no es post → drift (orphan).
5. Si falta el PNG en disco → drift.

**Reproducibilidad**: el manifest se reescribe siempre en orden
alfabético de slugs con `JSON.stringify(obj, null, 2)` + `\n` final.

---

## R-07 — Inyección en `<head>` del post

**Decisión**: `build-blog.js` lee el manifest al iniciar. Para cada
post:
- Si el manifest tiene una entrada con el slug, emite
  `og:image=https://ardops.dev/public/og/blog/<slug>.png` (idem
  `twitter:image`), con `og:image:alt=<post.title>`.
- Si NO hay entrada (post recién creado, OG no generado todavía),
  emite el fallback genérico `og-default.png` y loguea un warning.

**Orden de ejecución en `npm run build`**:
1. `build:layout` (existente).
2. `build:syntax-css` (spec 016).
3. **`build:og`** (NEW).
4. `build:blog` (lee el manifest fresco).
5. `build:interviews` (existente).

**Drift gate en CI**: cualquiera de los siguientes hace fallar el
build:
- `build-og --check` reporta drift.
- `build-blog` emite el fallback warning (porque el post recién creado
  no tiene OG todavía).

---

## R-08 — Orphan cleanup

**Decisión**: al final del `writeAll` del builder OG, listar
`public/og/blog/*.png`, comparar con el set de slugs publicados, y
borrar los que ya no son post. Mismo patrón que usa
`build-blog.js` con HTML orphans.

---

## R-09 — Reproducibilidad byte-a-byte

Riesgos identificados:
- `sharp` puede meter timestamps/metadata en el PNG según versión de
  libvips. **Mitigación**: usar `.withMetadata(false)` + opciones
  explícitas (`{ palette: false, compressionLevel: 9, adaptiveFiltering: false }`).
- Orden de iteración de tags en JS: arrays preservan orden; el sort
  para el hash es deterministic (`.sort()` lexicográfico).

**Validación**: tarea `md5 → regenerar → md5` en quickstart.md.

---

## R-10 — Budget de 100 KB

**Decisión**: cada PNG individual ≤ 100 000 B (raw, no gzip).
Verificable con `wc -c`. Probablemente los PNGs pesarán 60-80 KB en
práctica (1200×630 con tipografía y gradient simple comprime bien).

**Si un PNG excede el budget**: el builder loguea el tamaño y falla.
Mitigación: simplificar el gradient, reducir tags visibles, o subir
el budget en una PR explícita.

---

## R-11 — Página de fallback para no-posts

**Decisión**: `og-default.png` sigue siendo el OG para:
- `index.html` (landing)
- `blog/index.html`
- `talks/`, `speaking/`, `interviews/`, `now/`, `privacy/`, `uses/`
- `404.html`

Solo `blog/<slug>.html` por post recibe el OG por slug. Esto evita
inflar el alcance.

---

## Cierre Phase 0

Todos los unknowns resueltos. Decisiones consolidadas en `plan.md`
(Constitution Check) y operacionalizadas en `data-model.md` y
`contracts/`. Procede Phase 1.
