# Implementation Plan: OG images dinámicas por post

**Branch**: `017-og-images-dynamic` | **Date**: 2026-05-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/017-og-images-dynamic/spec.md`

## Summary

Nuevo builder `scripts/build-og.js` (Node 20, devDep `sharp`) que, por
cada post publicado, materializa una plantilla SVG con el título y los
tags del post, la convierte a PNG 1200×630 < 100 KB y la deposita en
`public/og/blog/<slug>.png` (commiteado al repo). Idempotencia y drift
se gestionan con `public/og/blog/manifest.json` que mapea
`slug → sha256(title, sorted(tags), templateVersion)`. El builder
elimina PNGs huérfanos. `scripts/build-blog.js` se ajusta para que el
`<head>` de cada post apunte a su OG por slug (con fallback a
`og-default.png` si el PNG falta). Gates: `tests/og-images.sh`
(cobertura + dimensiones + tamaño), `tests/og-drift.sh`
(`build-og --check`), y reutilización de `byte-budgets.sh` con un
límite específico para `public/og/blog/*.png` ≤ 100 KB.

## Technical Context

**Language/Version**: Node.js 20 (build) · HTML5/CSS3 + vanilla JS (runtime).
**Primary Dependencies**: existentes — `gray-matter`, `marked`, `dompurify`, `jsdom`, `shiki`. Nueva (devDep build-only): **`sharp ^0.33.x`**.
**Storage**: filesystem (Markdown en `content/blog/*.md`; PNGs en `public/og/blog/<slug>.png`; manifest JSON).
**Testing**: bash POSIX gates (`set -euo pipefail`) + suite local. Nuevos: `tests/og-images.sh`, `tests/og-drift.sh`. Extensión: `tests/byte-budgets.sh` recibe un budget específico OG.
**Target Platform**: GitHub Pages (estático). Crawlers OG (LinkedIn, X, Slack, Facebook, Mastodon) descargan los PNGs por HTTP estándar.
**Project Type**: sitio estático single-project.
**Performance Goals**: cada PNG < 100 KB; build de OG ≤ 10 s para 20 posts. Lighthouse Performance ≥ 95 invariante.
**Constraints**: CSP intacta (los PNGs son `img-src 'self'` ya permitido). Cero JS runtime nuevo. PNGs reproducibles byte-a-byte. Fuentes embebidas son las mismas self-hosted.
**Scale/Scope**: ≤ 20 posts esperados; ≤ 10 tags por post (truncado a 3-4 chips visibles); título truncado a ~80 caracteres / 2 líneas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio | Aplica | Veredicto | Nota |
|---|---|---|---|---|
| I | Spec-Driven | ✓ | PASS | spec.md aprobada, 16/16 checklist. |
| II | Identidad visual | ✓ | PASS | Plantilla usa exactamente la paleta y fuentes existentes; sin colores nuevos. |
| III | 100% estático | ✓ | PASS | Build-time; PNGs servidos como archivos planos. |
| IV | Cero deps JS sin justificación | ✓ | PASS | `sharp` es devDep, build-only. Alternativas (`satori+sharp` ~10 MB, `node-canvas` nativo) rechazadas en research. |
| V | Assets self-hosted | ✓ | PASS | Plantilla embebe `assets/fonts/outfit-700.woff2` y `assets/fonts/jetbrains-mono-400.woff2` ya presentes. Cero CDN. |
| VI | A11y WCAG 2.1 AA | ✓ | PASS | `og:image:alt` con el título completo del post. Crawlers entregan alt a lectores de pantalla en feeds. |
| VII | Performance feature | ✓ | PASS | PNG ≤ 100 KB; OG no se carga en el sitio web (solo crawlers). Lighthouse intacto. |
| VIII | Seguridad por defecto | ✓ | PASS | Cero impacto CSP. PNGs `img-src 'self'`. Sin runtime JS. |
| IX | Todas las gates | ✓ | PASS | Nuevos gates: `og-images.sh`, `og-drift.sh`. Extensión de `byte-budgets.sh`. |
| X | Documentación versionada | ✓ | PASS | spec/plan/research/data-model/contracts/quickstart en `specs/017-*`. |
| XI | Hosting fijo | ✓ | PASS | Sin cambios. |
| XII | Privacy by Default | ✓ | PASS | PNGs servidos same-origin; cero trackers/cookies. |

**Gate result**: 12/12 PASS. Sin violaciones; no se requiere `Complexity Tracking`.

## Project Structure

### Documentation (this feature)

```text
specs/017-og-images-dynamic/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── og-build-pipeline.md         # builder ↔ template ↔ sharp
│   ├── og-template.md               # estructura del SVG, placeholders, layout
│   ├── og-manifest.md               # forma del manifest + algoritmo de drift
│   └── og-meta-injection.md         # cómo build-blog inyecta og:image por slug
├── checklists/
│   └── requirements.md              # 16/16 (creada en /speckit.specify)
└── tasks.md                          # /speckit.tasks
```

### Source Code (repository root)

```text
package.json                          # +sharp en devDependencies
scripts/
├── build-og.js                       # NEW: builder principal (CLI: <none>, --check, --regenerate)
├── build-blog.js                     # MODIFY: og:image/twitter:image por slug, con fallback condicional
└── og/
    ├── template.svg                  # NEW: plantilla con placeholders {TITLE} {TAGS_SVG} {LOGO}
    └── render.js                     # NEW: helpers de wrap, escape, manifest

public/og/
├── og-default.png                    # EXISTENTE (fallback para no-posts)
└── blog/
    ├── manifest.json                 # NEW (commiteado): { slug: { hash, title } }
    └── <slug>.png                    # NEW por cada post (commiteado)

tests/
├── og-images.sh                      # NEW: cobertura + dimensiones + tamaño + meta tags
├── og-drift.sh                       # NEW: wrapper sobre `node scripts/build-og.js --check`
└── byte-budgets.sh                   # MODIFY: agrega budget específico OG ≤ 100 000 B raw
```

**Structure Decision**: single-project estático. El nuevo builder vive
junto a `build-blog.js` y `build-syntax-css.js`, manteniendo el patrón
"un builder por concern, todos invocables vía `npm run build:*`". Los
artefactos viven bajo `public/og/blog/`, separados de
`public/og/og-default.png` que sigue sirviendo a pages no-post.

## Complexity Tracking

No aplica. Cero violaciones; cero justificaciones pendientes.
