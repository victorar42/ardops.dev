# Implementation Plan: Blog UX & Visual Polish

**Branch**: `007-blog-ux-polish` | **Date**: 2026-05-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/007-blog-ux-polish/spec.md`

## Summary

Elevar el blog (índice `/blog/` y páginas de post individual) al pulido visual del landing y entregar filtros + búsqueda usables, sin dependencias runtime nuevas y respetando la CSP estricta vigente.

**Enfoque técnico**:
1. **Tipografía y layout** del post se resuelven 100% en CSS (extensiones a `assets/css/components.css` y nuevos tokens en `tokens.css`).
2. **TOC** se genera **en build-time** dentro de `scripts/build-blog.js` (sin JS runtime).
3. **Filtros por tag** se resuelven con **CSS puro** vía radio inputs ocultos + `:has()` + `[hidden]` (sin JS, accesibles con teclado, deep-link compatible).
4. **Búsqueda** se resuelve con un **JS module mínimo** (`assets/js/blog-filter.js`, < 4 KB minificado) que es **enhancement progresivo**: con JS desactivado, los filtros por tag siguen funcionando y la caja de búsqueda se oculta vía `<noscript>`/`hidden` por defecto.
5. **Compartir** son enlaces estáticos generados en build-time (mailto + LinkedIn + X intent).
6. **Indicador de progreso de lectura** se omite en esta spec (no aporta valor proporcional a la complejidad CSS y de a11y; se difiere).

## Technical Context

**Language/Version**: HTML5, CSS3 (`:has()`, custom properties), JavaScript ES2022 (module, sin transpilación).
**Primary Dependencies**: ninguna nueva en runtime. DevDependencies ya existentes en spec 006: `marked`, `dompurify`, `jsdom`, `gray-matter`. **No** se añade ningún paquete.
**Storage**: archivos planos (`content/blog/*.md`, `assets/img/blog/*`).
**Testing**: html-validate (npm script), axe-core via puppeteer (`tests/a11y.js`), `tests/blog-schema.sh`, `node scripts/build-blog.js --check`, Lighthouse CI (`tests/lighthouserc.json`).
**Target Platform**: navegadores modernos (Chrome/Edge/Firefox/Safari, últimas dos versiones mayores). `:has()` requiere Safari 15.4+, Chrome 105+, Firefox 121+ — todos en soporte hoy.
**Project Type**: sitio estático generado.
**Performance Goals**: Lighthouse Performance ≥ 95 mobile en `/blog/` y `/blog/<slug>.html`; búsqueda en cliente < 100 ms para ≤ 100 posts; búsqueda < 200 ms para 500 posts.
**Constraints**: CSP `script-src 'self'` intacta; cero CDN runtime; cero dependencias runtime nuevas; build determinista (idempotente); CSS gzip-delta < 8 KB; JS bundle < 4 KB minificado.
**Scale/Scope**: hoy 1 post publicado; arquitectura cómoda hasta ~100 posts; paginación entra en escena ≥ 13.

## Constitution Check

| Principio | Estado | Justificación |
|---|---|---|
| **I. Spec-Driven** | ✅ | `/specify` → este `/plan` → `/tasks` → `/implement`. |
| **II. Identidad visual** | ✅ | Todos los colores via `var(--token)`. Tokens nuevos derivan de `--bg-card`, `--border`, `--accent`. Tipografía existente (Outfit + JetBrains Mono). |
| **III. 100% estático** | ✅ | HTML generado en build-time desde Markdown; sin server-side runtime. |
| **IV. Cero deps JS terceros** | ✅ | El JS de cliente (`blog-filter.js`) es vanilla, self-hosted, sin imports externos. Cero adiciones a `package.json` runtime. |
| **V. Fonts/assets self-hosted** | ✅ | Imágenes en `assets/img/blog/…`; no se introducen recursos externos. Enlaces de compartir apuntan a URLs públicas pero son links navegacionales, no recursos cargados. |
| **VI. A11y WCAG 2.1 AA** | ✅ | Filtros por tag implementados con `<input type="radio">` (nativos, teclado-friendly, focus-visible). Search input con `aria-controls` y `aria-live` para anuncio de resultados. TOC con `<nav aria-label="Tabla de contenidos">`. |
| **VII. Performance ≥95** | ✅ | CSS-only filters tienen costo ~0. JS bundle < 4 KB; no diferido por defecto (es del propio dominio) pero podemos usar `defer`. Sin frameworks. |
| **VIII. Seguridad por defecto** | ✅ | CSP intacta. Búsqueda opera sobre un `<script type="application/json">` inline (no `eval`). Enlaces de compartir son `<a href="https://…">` estáticos. |
| **IX. Gates en PR** | ✅ | Mismos gates de spec 006 + html-validate sobre nuevas páginas + axe-core sobre las dos rutas + Lighthouse + nuevo job `blog-build-check` ya existente. |
| **X. Documentación versionada** | ✅ | Todo este directorio se commitea. |
| **XI. Hosting/dominio fijos** | ✅ | Sin cambio. CSP sigue por `<meta>`. |

**Gate: PASS — sin violaciones**.

## Project Structure

### Documentation (this feature)

```text
specs/007-blog-ux-polish/
├── plan.md                  # este archivo
├── research.md              # Fase 0
├── data-model.md            # Fase 1
├── quickstart.md            # Fase 1
├── contracts/               # Fase 1
│   ├── frontmatter-schema-delta.md   # agrega campo opcional `cover`
│   ├── toc-contract.md               # contrato del HTML emitido para TOC
│   ├── filter-search-contract.md     # contrato CSS+JS de filtros/búsqueda
│   ├── share-links-contract.md       # contrato de enlaces compartir
│   └── render-contract-delta.md      # delta sobre 006/render-contract.md
└── checklists/
    └── requirements.md      # ya existe
```

### Source Code (repository root)

```text
ardops.dev/
├── scripts/
│   └── build-blog.js                    # MODIFICADO: TOC, share links, cover, plantilla post-article
├── assets/
│   ├── css/
│   │   ├── tokens.css                   # MODIFICADO: nuevos tokens (--code-bg, --blockquote-border, --toc-bg, --chip-bg-active)
│   │   ├── components.css               # MODIFICADO: .post-article, .post-toc, .post-share, .blog-filters, .blog-search, expanded .post-card, .blog-empty
│   │   └── motion.css                   # MODIFICADO: transitions hover .post-card, reducción para reduced-motion
│   ├── js/
│   │   └── blog-filter.js               # NUEVO: módulo ES2022, <4KB minificado, búsqueda en cliente
│   └── img/
│       └── blog/                        # NUEVO: imágenes de covers (opcional por post)
├── content/blog/                        # sin cambios estructurales; campo `cover` opcional
├── blog/
│   ├── index.html                       # regenerado por build-blog
│   └── <slug>.html                      # regenerado por build-blog (TOC inline, share, etc.)
└── tests/
    ├── blog-schema.sh                   # MODIFICADO: añade fixture cover-missing.md
    ├── a11y.js                          # sin cambios (ya cubre /blog/ y post)
    └── blog-no-js.sh                    # NUEVO opcional: smoke test que verifica que el HTML no requiere JS para renderizar la lista
```

**Structure Decision**: extensión incremental del scaffolding de spec 006. Cero archivos nuevos al nivel raíz; un único archivo JS nuevo (`assets/js/blog-filter.js`); todas las plantillas viven dentro del script de build (no introducimos un sistema de templates externos).

## Phase 0 — Research (resumen)

Decisiones técnicas documentadas en `research.md`:

1. **Filtros**: CSS-only via `<input type="radio" name="tag" hidden>` + `<label class="chip">` + `:has()` + `[data-tag~="…"]`. Deep link `?tag=ci` se resuelve con un único `<script>` inline mínimo (3–5 líneas) que marca el radio correspondiente al cargar — o, alternativa elegida, se delega al módulo de búsqueda.
2. **Búsqueda**: JS module `assets/js/blog-filter.js`. Lee un `<script id="blog-index" type="application/json">` con `[{slug,title,summary,tags}]`. Aplica `input` listener con debounce 60 ms, filtra `display: none` sobre `.post-card[data-slug=…]`. Anuncia conteo en `<span aria-live="polite">`.
3. **TOC**: generación en build con `jsdom`. Para cada `<h2>`/`<h3>` se inserta `id` derivado del texto (slug + sufijo numérico si colisiona) y se emite `<nav class="post-toc">…</nav>` en el HTML del post. Umbral: ≥ 3 H2.
4. **Compartir**: tres `<a href="…">` estáticos generados en build con `encodeURIComponent` sobre título + URL canónica.
5. **`cover`**: campo opcional `cover: "assets/img/blog/<slug>.webp"`. Validación en build: si está presente, el archivo debe existir; si no existe, build falla.
6. **Paginación**: con ≤ 12 posts, se muestran todos. Con > 12, se aplica filtro por **chunks de 12 visibles + botón "Cargar más"** controlado vía CSS counters o por el módulo JS. La spec entrega la arquitectura; la activación se diferirá hasta que sea necesario (no se implementa la UI ahora porque hay 1 post).
7. **Progress indicator**: descartado en este ciclo.

## Phase 1 — Design & Contracts (resumen)

- **`data-model.md`**: define `Post`, `TocEntry`, `Tag`, `BlogIndex` (JSON inline para el JS), `FilterState`.
- **`contracts/frontmatter-schema-delta.md`**: agrega `cover` opcional (string, path relativo desde repo root, debe terminar en `.webp`/`.png`/`.jpg`/`.jpeg`).
- **`contracts/toc-contract.md`**: estructura HTML exacta del bloque `<nav class="post-toc">` y reglas de slug-id.
- **`contracts/filter-search-contract.md`**: HTML/CSS del bloque de filtros + chips + caja de búsqueda; comportamiento sin JS; API del JS module.
- **`contracts/share-links-contract.md`**: formato exacto de cada enlace (mailto/LinkedIn/X) y URL-encoding.
- **`contracts/render-contract-delta.md`**: cambios sobre el contrato base de 006 (post-article wrapper, post-meta posicionamiento, post-footer estructura).
- **`quickstart.md`**: pasos para probar localmente (servir + abrir /blog/ + tipear en búsqueda + click chip).

### Agent context update

Plan marker en `.github/copilot-instructions.md` se actualizará entre `<!-- SPECKIT START -->` y `<!-- SPECKIT END -->` para apuntar a `specs/007-blog-ux-polish/plan.md`.

## Complexity Tracking

Sin violaciones. No aplica.
