# Implementation Plan: Sección "Blog" en landing + página `/blog/` refactorizada

**Branch**: `006-blog-section` | **Date**: 2026-05-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/006-blog-section/spec.md`

## Summary

Reemplazar la sección actual `#security-pipeline` del landing por una nueva sección `#blog` que renderiza los **3 posts más recientes** leídos desde `content/blog/*.md`, refactorizar la página standalone `/blog/` para que sea el índice completo (todos los posts publicados ordenados por fecha desc), y emitir una página estática individual por post en `blog/<slug>.html`. El primer post (`pipeline-seguridad-spec-driven`) absorbe la narrativa del pipeline DevSecOps en primera persona y embebe inline las 4 stat cards técnicas (7 etapas / 0 costo / 100% cobertura / <5 min). Las 4 stat cards de `#about` se reemplazan por stats personales (17 / 10 / +12 / 1%) y se añade una foto circular 256×256 webp.

Implementación **build-time** vía `scripts/build-blog.js` (Node 20, **reusa** `marked` + `dompurify` + `gray-matter` + `jsdom` ya instalados por spec 003 — cero dependencias nuevas). El script: (1) parsea frontmatter estricto; (2) calcula reading time; (3) sanitiza el cuerpo con un whitelist DOMPurify **ampliado** respecto al de interviews para permitir el patrón de stat cards inline (`div.post-stats`, `div.stat-card`, `p.stat-value`, `p.stat-label`, `span` con `class`); (4) emite cada post a `blog/<slug>.html` con CSP meta estricta (mismo patrón interviews); (5) regenera `blog/index.html` completo; (6) actualiza el bloque marker-delimited `<!-- blog:start -->`…`<!-- blog:end -->` en `index.html` con los 3 más recientes y el link "Ver todos". Soporta `--check` (drift detection en landing **y** `blog/index.html` **y** posts) y `--check-only-validation` (para fixtures negativos en CI). Una nueva gate `blog-build-check` ejecuta ambos modos.

## Technical Context

**Language/Version**: HTML5 + CSS3 con custom properties + ES2020 vanilla (sin frameworks). Build script en Node.js 20 LTS (ya instalado en CI por spec 003 y spec 005).
**Primary Dependencies**: cero dependencias nuevas. Reusa `marked@^12`, `dompurify@^3` (vía `jsdom@^24`), `gray-matter@^4` ya en `devDependencies`. Runtime del sitio: cero JS añadido para el blog (HTML pre-renderizado); `assets/js/main.js` ya gestiona el nav.
**Storage**: archivos planos `content/blog/*.md` con frontmatter YAML. Es la única fuente de verdad de los posts. Más `content/blog/__fixtures__/invalid-*.md` para gate negativa (no servidos).
**Testing**:
- Build estricto (`node scripts/build-blog.js --check`) en CI: re-genera y compara contra `index.html` (entre markers), `blog/index.html` y cada `blog/<slug>.html`. Falla si hay drift.
- `tests/blog-schema.sh` — itera sobre fixtures inválidos con `--check-only-validation` y exige exit≠0 en cada uno.
- `tests/a11y.js` (axe-core via Puppeteer, ya existente) re-ejecutado contra `index.html`, `blog/index.html` y al menos un post individual.
- `npx html-validate index.html blog/index.html blog/<slug>.html` 0 errores.
- `tests/no-placeholders.sh` (spec 004), `tests/forbidden-urls.sh` (spec 002) siguen verdes.

**Target Platform**: GitHub Pages estático, navegadores evergreen + Safari iOS. Móvil mínimo 320 px.
**Project Type**: sitio estático single-page-landing + páginas auxiliares (`/blog/`, `/blog/<slug>.html`, `/interviews/`, etc.).
**Performance Goals**: Lighthouse Performance ≥ 95 (constitución VII), LCP < 2.5 s, CLS < 0.1, INP < 200 ms. Cero requests adicionales de runtime; el HTML adicional en landing es ~3–5 KB gzipped (3 cards). La foto de `#about` (256×256 webp) ≤ 25 KB con `loading="lazy"` y `decoding="async"`.
**Constraints**:
- Sitio 100% estático (constitución III).
- CSP estricta vigente: `default-src 'self'; script-src 'self'; ...` se mantiene en cada HTML emitido (meta tag, mismo patrón interviews; constitución XI).
- Cero deps JS de terceros nuevas (constitución IV) — todo el toolchain ya está en repo.
- Self-hosted assets (constitución V); la foto vive en `assets/img/josue-256.webp`.
- WCAG 2.1 AA no-negociable (constitución VI).
- Sin inline JS, sin inline styles (excepto el CSS crítico ya declarado en `<head>`).

**Scale/Scope**: 1 post real al merge (`pipeline-seguridad-spec-driven`), expectativa estable ≤ 50 posts a mediano plazo. Sin paginación en este iterado. Sin tags enlazables, sin RSS, sin búsqueda — explícitamente fuera de alcance (ver Assumptions de spec.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|---|---|---|
| **I. Spec-Driven obligatorio** | ✅ | spec.md aprobado, este plan vive en `specs/006-blog-section/`. |
| **II. Identidad visual preservada** | ✅ | Reusa tokens existentes (`--accent`, `--green`, `--bg-primary`, JetBrains Mono + Outfit). El `section-label` `// blog` y `section-title` siguen el patrón establecido. Las stat cards inline reusan exactamente las clases `.stat-card`/`.stat-value`/`.stat-label` ya definidas en `assets/css/components.css` para `#about`. Los nuevos estilos (`.post-card`, `.post-stats`, etc.) extienden `components.css` reutilizando `var(--*)`. Cero colores nuevos. |
| **III. Sitio 100% estático** | ✅ | Build script Node corre en CI (build-time); el sitio servido es HTML/CSS/JS plano. Sin backend, sin DB, sin SSR de runtime. |
| **IV. Cero deps JS sin justificación** | ✅ | **Cero dependencias nuevas**. `marked`, `dompurify`, `jsdom`, `gray-matter` ya están en `package.json` (instaladas por spec 003). Ver R-001 y R-002 de research. |
| **V. Fonts y assets self-hosted** | ✅ | Fonts ya self-hosted. La foto circular vive en `assets/img/josue-256.webp` (provista por el autor); cero CDNs. |
| **VI. Accesibilidad WCAG 2.1 AA** | ✅ | `<article>` por post-card con `aria-labelledby`, `<time datetime>` para fechas, `<ul>` semánticas para listings, foco visible heredado de `base.css`. La foto de `#about` lleva `alt` descriptivo no vacío y `loading="lazy"`. Validado por `tests/a11y.js` contra landing, `/blog/`, y un post individual (SC-004). |
| **VII. Performance ≥ 95** | ✅ | Cero requests adicionales en landing. La foto 256×256 webp es ≤ 25 KB con `loading="lazy"` y `decoding="async"`, fuera del LCP. Cada post individual es HTML estático ~5–15 KB gzip. Ver R-009. |
| **VIII. Seguridad por defecto** | ✅ | Sanitización build-time con DOMPurify + whitelist explícito (R-003). Bloquea `<script>`, `<iframe>`, `on*=`, `javascript:`. CSP meta estricta en cada post (idéntico patrón interviews). Cero secrets, cero CDNs. Fixture negativo `xss-attempt.md` valida en CI. |
| **IX. Cada PR pasa todas las gates** | ✅ | Nueva gate `blog-build-check` se añade al workflow; gates existentes (a11y, html-validate, links, forbidden-urls, no-placeholders, interviews-*, pipeline-build-check) siguen verdes. Ver `contracts/ci-gate.md`. |
| **X. Documentación versionada** | ✅ | spec, plan, research, data-model, contracts/, quickstart, tasks: todos en `specs/006-blog-section/`. Una entrada `content/blog/README.md` documenta el formato para el autor. |
| **XI. Hosting fijo** | ✅ | Sin cambios de hosting/dominio. URLs de posts: `blog/<slug>.html` (GitHub Pages no soporta clean URLs sin redirects; mantenemos la convención que ya usa interviews). El nav mantiene `/blog/` (ya servible por GitHub Pages como `blog/index.html`). |

**Resultado**: PASA. Ninguna violación. Sección "Complexity Tracking" vacía.

## Project Structure

### Documentation (this feature)

```text
specs/006-blog-section/
├── plan.md                        # This file
├── research.md                    # Phase 0 — decisiones técnicas
├── data-model.md                  # Phase 1 — BlogPost, frontmatter, derivados
├── quickstart.md                  # Phase 1 — workflow del autor para agregar/editar posts
├── contracts/
│   ├── frontmatter-schema.md      # Phase 1 — schema YAML estricto del frontmatter
│   ├── sanitizer-whitelist.md     # Phase 1 — whitelist DOMPurify (tags/attrs/schemes)
│   ├── render-contract.md         # Phase 1 — contrato HTML/ARIA: card landing, /blog/, post individual
│   ├── csp-policy.md              # Phase 1 — meta CSP por post (referencia spec 003)
│   └── ci-gate.md                 # Phase 1 — qué verifica `blog-build-check`
├── checklists/
│   └── requirements.md            # Ya creado en /speckit.specify
└── tasks.md                       # Phase 2 — generado por /speckit.tasks
```

### Source Code (repository root)

```text
ardops.dev/
├── index.html                              # MODIFY — reemplaza #security-pipeline por sección #blog (entre markers); reemplaza stat cards de #about + agrega <img> circular
├── blog/
│   ├── index.html                          # REGENERATED — listado completo de posts (refactor del teaser actual)
│   └── pipeline-seguridad-spec-driven.html # NEW (generated) — primer post emitido
├── content/
│   ├── blog/
│   │   ├── README.md                       # NEW — guía rápida formato/frontmatter (refleja quickstart.md)
│   │   ├── 2026-05-pipeline-seguridad-spec-driven.md  # NEW — primer post real
│   │   └── __fixtures__/                   # NEW — fixtures negativos para tests/blog-schema.sh
│   │       ├── valid-minimal.md
│   │       ├── invalid-missing-title.md
│   │       ├── invalid-bad-date.md
│   │       ├── invalid-duplicate-slug.md   # par con valid-minimal (ambos slug=test-foo)
│   │       ├── invalid-summary-too-short.md
│   │       ├── invalid-summary-too-long.md
│   │       ├── invalid-published-not-bool.md
│   │       └── xss-attempt.md              # <script>, on*=, javascript:, <iframe>
│   └── interviews/                         # (existente, spec 003, sin cambios)
├── scripts/
│   ├── build-interviews.js                 # (existente, spec 003)
│   ├── build-pipeline.js                   # (existente, spec 005)
│   └── build-blog.js                       # NEW — el orquestador descrito en Summary
├── tests/
│   ├── a11y.js                             # MODIFY — agregar URLs de /blog/ y un post a la lista de páginas auditadas
│   ├── blog-schema.sh                      # NEW — itera __fixtures__/invalid-*.md, exige exit≠0
│   └── ... (resto sin cambios)
├── assets/
│   ├── css/
│   │   ├── components.css                  # MODIFY — agrega `.post-card`, `.post-meta`, `.post-tags`, `.post-list`, `.post-stats`, `.about-portrait` (extendiendo `.stat-card`)
│   │   └── home.css                        # MODIFY — ajustes mínimos de la sección #blog en landing si necesario
│   └── img/
│       └── josue-256.webp                  # NEW — foto circular 256×256 (provista por el autor)
├── .github/workflows/
│   └── ci.yml                              # MODIFY — agregar job `blog-build-check`
├── package.json                            # MODIFY — agregar script npm `build:blog`
└── .gitignore                              # SIN cambios (HTML emitido en blog/ se commitea, igual que interviews)
```

**Structure Decision**: extiende los dos patrones ya consolidados:
- **Spec 003 (interviews)** para todo el pipeline de markdown: `gray-matter` para frontmatter, `marked` para md→html, `dompurify`+`jsdom` para sanitización, template strings JS, escape manual, fixtures negativos en `__fixtures__/`. La diferencia clave es el **whitelist más amplio** (`contracts/sanitizer-whitelist.md`) para permitir el HTML inline de las stat cards.
- **Spec 005 (pipeline)** para el render in-place del listado del landing entre markers `<!-- blog:start -->` y `<!-- blog:end -->`, y para la gate `--check` que detecta drift. Aquí el `--check` es **triple**: verifica el bloque del landing, el contenido completo de `blog/index.html`, y cada `blog/<slug>.html` emitido.

El HTML emitido en `blog/<slug>.html` se commitea (igual que `interviews/<slug>.html`) para que GitHub Pages los sirva sin build remoto.

## Complexity Tracking

> **No hay violaciones constitucionales.** Esta sección queda vacía.
