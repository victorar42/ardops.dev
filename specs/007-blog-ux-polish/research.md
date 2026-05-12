# Phase 0 — Research: Blog UX & Visual Polish

## Decisions

### D-001: Filtros por tag — CSS puro con radios + `:has()`

- **Decision**: implementar filtrado por tag únicamente con HTML + CSS. Se emite un grupo de radios ocultos (`<input type="radio" name="blog-tag" id="tag-all" checked>`, `<input type="radio" name="blog-tag" id="tag-ci">`, …) y cada chip es un `<label for="tag-…">` estilizado. La grilla aplica `:has(#tag-ci:checked) ~ .post-grid .post-card:not([data-tags~="ci"]) { display: none }`.
- **Rationale**: cero JS para la funcionalidad principal de filtro; nativo del teclado; trabaja con `prefers-reduced-motion`; deep-link via fragment `#tag-ci` aprovecha el comportamiento por defecto del `<input>`.
- **Alternatives considered**:
  - `:target` con anclas: rompe el botón "atrás" del navegador y requiere `<a href="#tag-ci">` con scroll involuntario al chip; descartado.
  - `?tag=ci` puramente CSS: no es posible sin JS en CSS estándar; descartado.
  - JS-only: violaría el requisito de funcionamiento sin JS.

### D-002: Búsqueda — JS module mínimo, progressive enhancement

- **Decision**: `assets/js/blog-filter.js` como `<script type="module" defer>`. Lee `<script id="blog-index" type="application/json">` que contiene `{slug,title,summary,tags}` por post. Listener `input` con debounce 60 ms aplica `card.hidden = !matches(query)`. Anuncia conteo en `<output aria-live="polite">`. El bundle estimado: ~2 KB minificado.
- **Rationale**: la búsqueda full-text en cliente es inviable en CSS puro. JS module local respeta CSP `script-src 'self'`. `defer` evita bloqueo del render.
- **Alternatives considered**:
  - Server-side search (Algolia, Lunr.js hosted): viola constitución IV/V.
  - Lunr.js bundled: ~30 KB minificado; sobre-ingeniería para 1–100 posts.
  - CSS-only filter por título substring: imposible.
- **Fallback sin JS**: la caja de búsqueda se renderiza con `hidden` por defecto. El módulo JS la des-oculta al inicializar. Sin JS, solo los filtros por tag están disponibles.

### D-003: TOC — generación en build-time

- **Decision**: dentro de `scripts/build-blog.js`, tras sanitizar el HTML con DOMPurify y convertir Markdown con `marked`, usar `jsdom` (ya dependencia) para recorrer `h2`/`h3`, asignar `id` único, y emitir un `<nav class="post-toc" aria-label="Tabla de contenidos">` insertado justo antes de `<div class="post-article-body">`. Umbral: omitir si `h2.length < 3`.
- **Rationale**: HTML estático; sin JS runtime; SEO-friendly; deep-link compatible; cero costo de paint.
- **Alternatives considered**:
  - Runtime JS con `scrollspy`: descartado (costo, complejidad a11y).
  - `<details>` solo: implementado **además** del aside en mobile (`<details>` colapsable). En desktop ≥ 1024px, el aside es sticky lateral.

### D-004: Enlaces de compartir — estáticos en build

- **Decision**: tres `<a>` por post, generados en build con la URL canónica `https://ardops.dev/blog/<slug>.html` y el título URL-encoded.
  - mailto: `mailto:?subject=<title>&body=<url>`
  - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=<url>`
  - X / Twitter: `https://x.com/intent/post?text=<title>&url=<url>`
- **Rationale**: sin trackers, sin JS, sin recursos third-party cargados. Son enlaces navegacionales; cumplen CSP y constitución V (no se carga nada de third-party).
- **Alternatives considered**: widgets oficiales (LinkedIn, X) — descartados por cargar JS externo.

### D-005: Campo `cover` opcional

- **Decision**: nuevo campo opcional en frontmatter: `cover: assets/img/blog/<slug>.webp` (path relativo desde repo root). Extensiones aceptadas: `.webp`, `.png`, `.jpg`, `.jpeg`. El build valida existencia del archivo cuando el campo está presente. Si está ausente, la tarjeta se renderiza sin imagen, sin reservar espacio vacío.
- **Rationale**: cover es opcional para no romper el post existente. Validar existencia evita imágenes rotas en producción.
- **Alternatives considered**: cover obligatorio — descartado (rompe el post existente y obliga a generar imagen para posts conceptuales).

### D-006: Paginación

- **Decision**: arquitectura preparada (`data-index="N"` por tarjeta), implementación UI diferida hasta tener > 12 posts. Por ahora, todos los posts se renderizan visibles.
- **Rationale**: YAGNI. Hoy hay 1 post; sobre-ingeniería implementar y testear paginación sin necesidad.
- **Alternatives considered**: implementar ya — descartado.

### D-007: Indicador de progreso de lectura

- **Decision**: omitido en esta spec.
- **Rationale**: CSS-only progress indicator requiere `position: sticky` + `view-timeline` o `scroll-timeline` (Chrome 115+, no Safari). Implementarlo bien en todos los navegadores requiere JS (~1 KB extra) y testing de a11y (debe respetar reduced-motion, no debe atrapar focus). El valor agregado para posts de 5–10 min es marginal. Se deja para una spec dedicada si llega a haber demanda.
- **Alternatives considered**: omitir es la decisión.

### D-008: Tabla de contenidos en mobile

- **Decision**: en viewports < 1024px se renderiza el mismo `<nav class="post-toc">` pero envuelto en `<details>` colapsable, abierto por defecto en mobile? No, **cerrado** por defecto para no robar espacio. En desktop, `<details>` queda sin uso visual y el aside es sticky.
- **Rationale**: control de viewport vía CSS (`display: none` sobre `<details>` en desktop, `display: none` sobre `<aside>` en mobile).

### D-009: Slug-IDs para headings de la TOC

- **Decision**: slugify lowercase ascii del texto del heading. Si colisiona, sufijo `-2`, `-3`, etc.
- **Rationale**: deep-link friendly, predecible.

### D-010: Anuncio aria-live de resultados

- **Decision**: un único `<output aria-live="polite" aria-atomic="true">` con texto "{N} resultados" o "Sin resultados" actualizado tanto por el cambio de radio (vía CSS counter + `content` no es leíble por screen readers) — por lo tanto se actualiza desde JS cuando el JS está activo, y se omite el anuncio cuando solo CSS está activo. Trade-off aceptable: sin JS, el usuario ve la grilla actualizada visualmente.
- **Rationale**: CSS counters no son anunciados por NVDA/JAWS en `content`; `aria-live` requiere mutación DOM real.

## Resolved NEEDS CLARIFICATION

La spec no contenía `NEEDS CLARIFICATION`. Las 5 decisiones diferidas a `/plan` se resolvieron en D-001..D-007.

## References

- [CSS `:has()` browser support — caniuse](https://caniuse.com/css-has) (verificar al revisar el PR, no se asume estabilidad de la URL).
- `.specify/memory/constitution.md`
- `specs/006-blog-section/research.md` (foundation que esta spec extiende).
