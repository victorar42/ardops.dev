# Backlog 11 — OG images dinámicas por post (diferido)

> **Estado**: implementado · spec 017 · **Prioridad**: P5 (deferido — feature de pulido)
> **Esfuerzo estimado**: M (~1 día) · **ROI networking**: medio (CTR de social)

---

## Por qué

Cuando compartas un post en LinkedIn / Twitter / Mastodon, la preview
muestra `og-default.png` (genérico del sitio). Tener una **OG image
única por post**, con título y tags, mejora CTR significativamente
(estudios indican +30-40% en redes sociales).

**Diferida** porque hoy hay 1 post. Justificada cuando haya 5+ posts y la
distribución activa importe.

## Objetivo

Generar `public/og/blog/<slug>.png` (1200x630) automáticamente por cada
post, con título + tags + branding consistente, en build-time.

## Alcance funcional (FRs)

- **FR-01** — Por cada post publicado, generar PNG 1200x630 en
  `public/og/blog/<slug>.png`.
- **FR-02** — Plantilla visual consistente:
  - Fondo: gradient de paleta del sitio (`--bg-primary` → `--bg-secondary`).
  - Título del post en grande (Outfit 64-72px).
  - Tags como chips abajo a la izquierda.
  - Logo "ardops.dev" abajo a la derecha en mono.
  - Accent rail vertical o ornament a la derecha (consistente con marca).
- **FR-03** — `<meta property="og:image">` apunta a la imagen generada.
- **FR-04** — `<meta property="og:image:width" content="1200">` +
  `og:image:height` + `og:image:alt` (= título del post).
- **FR-05** — Modo `--check` falla si una imagen está out of sync (slug
  o título cambió).
- **FR-06** — Imágenes generadas se commitean al repo (no .gitignore).
  Tradeoff: peso del repo vs simplicidad de deploy. Preferimos commitear
  porque GH Pages no genera en CI.

## Alcance técnico

### Decisión clave: cómo generar el PNG

Tres opciones, ranked por preferencia:

#### Opción A — Plantilla SVG + sharp (preferida)

- Una plantilla `scripts/og-template.svg` con placeholders `{TITLE}`, `{TAGS}`.
- En build, sustituir placeholders y convertir SVG → PNG con `sharp`.
- **Pros**: control total del diseño, ~2 MB devDep (`sharp` ya estándar
  en pipelines de imágenes), sin React.
- **Contras**: SVG con texto largo requiere wrap manual (no auto).

#### Opción B — Satori + sharp

- `satori` de Vercel: genera SVG desde JSX en Node.
- `sharp`: SVG → PNG.
- **Pros**: layout flex-like, text wrap automático.
- **Contras**: arrastra ~10 MB de devDeps (yoga-wasm-base, react types).

#### Opción C — Canvas API (node-canvas)

- `node-canvas`: dibujar pixels a mano.
- **Pros**: control total.
- **Contras**: nativo (libcairo), hard to install in CI, frágil.

**Decisión recomendada**: Opción A. Si el wrap manual es muy doloroso
(títulos > 80 chars), evaluar Opción B.

### Otros aspectos

- Fonts embebidas en SVG vía `<style>` con `@font-face` referenciando
  `../assets/fonts/outfit-700.woff2` (relativo al PNG output).
- Cache: si el PNG existe y el frontmatter del post no cambió, no
  regenerar (idempotencia).
- `--check` compara slug + título + tags hash con XMP metadata del PNG
  (o con un manifest `.public/og/blog/manifest.json`).

## Gates / tests

- `tests/og-images.sh`: verifica que cada post tiene su PNG, y que el PNG
  existe físicamente.
- `--check` falla si OG drift.
- `tests/byte-budgets.sh`: cada PNG debe ser < 100 KB.
- Validación visual manual con [opengraph.xyz](https://www.opengraph.xyz)
  o LinkedIn Post Inspector.

## Out of scope

- OG images para listings (`/blog/`, `/interviews/`, `/talks/`) — usan
  `og-default.png`.
- OG video / Twitter player card.
- Multi-idioma OG (sitio es es-CR primario).
- A/B testing de diseños OG.
- OG dinámico server-side (requiere backend, viola GH Pages).

## Edge cases

- Título muy largo (>80 chars): truncar con `…` y warning en build.
- Sin tags: omitir la fila de chips (no romper layout).
- Caracteres especiales en título (`<`, `&`, emoji): escape XML correcto
  en SVG; emoji renderizado depende de fuente embebida (Twemoji opcional).
- Re-render forzado: flag `--regenerate-og` para invalidar cache.

## Criterios de aceptación

- AC-01: Cada post tiene `public/og/blog/<slug>.png` 1200x630.
- AC-02: El PNG se ve consistente con la marca (revisión visual manual).
- AC-03: LinkedIn Post Inspector muestra el OG correcto.
- AC-04: `--check` falla si el título del post cambia y la imagen no se
  regenera.
- AC-05: `git diff package.json` muestra deps justificadas en research.md.
- AC-06: Cada PNG < 100 KB.

## Constitución relevante

- III (devDeps justificadas), V (perf), VIII (tokens), IX (validation).

## Notas para `/specify`

> "Generar OG images 1200x630 por post en build-time desde plantilla SVG
> + sharp (Opción A). Plantilla con título + tags + logo + paleta del
> sitio. Cache por hash de frontmatter, modo --check valida drift. Evitar
> Satori (peso devDeps). Esperar a tener 5+ posts antes de implementar."
