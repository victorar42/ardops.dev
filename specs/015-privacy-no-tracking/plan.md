# Implementation Plan: Privacy policy + no-tracking enforcement

**Branch**: `015-privacy-no-tracking` | **Date**: 2026-05-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/015-privacy-no-tracking/spec.md`

## Summary

Publica una página estática `/privacy/` (≈250 palabras es-CR) que declara
explícitamente la política de no-tracking del sitio, agrega el enlace en el
footer global de cada página servida, blinda la política con dos gates de CI
nuevos (`tests/no-trackers.sh`, `tests/no-cookies.sh`) basados en una lista
versionada de patrones (`tests/tracker-domains.txt`), y promueve la regla a
principio constitucional permanente ("Privacy by Default").

Aproximación técnica:

- HTML estático puro siguiendo la estética ya pactada
  (`.reference/v1-design/index.html`) y reutilizando las clases de
  `assets/css/{tokens,base,layout,components}.css`. Sin JS de página.
- Dos scripts bash POSIX (`grep -nE`, `find -prune`) con exit code claro y
  reporte archivo:línea. Cero dependencias nuevas.
- Lista de patrones en archivo de texto plano `tests/tracker-domains.txt`
  (un patrón ERE por línea, líneas con `#` ignoradas).
- Actualización del footer en cada HTML servido y en
  `scripts/build-interviews.js` (`siteFooter()`) + `scripts/build-blog.js`
  para que las páginas generadas también incluyan el enlace.
- Promoción del principio: la constitución ya tiene principios I–XI; el
  nuevo entra como **Principio XII — Privacy by Default** (no se renumeran
  los existentes) con bump MINOR a v1.3.0 y sync-impact-report.

## Technical Context

**Language/Version**: HTML5 + CSS (variables del sitio) + Bash POSIX (zsh/bash en
macOS 14, bash 5 en GitHub Actions ubuntu-latest); Node 20 LTS solo para los
builders existentes que tocaremos (`scripts/build-blog.js`,
`scripts/build-interviews.js`).
**Primary Dependencies**: ninguna nueva. Reutiliza `grep`, `find`, `awk` y los
gates Node ya en repo.
**Storage**: archivos versionados en git (`privacy/index.html`,
`tests/tracker-domains.txt`).
**Testing**: gates POSIX existentes en `tests/*.sh`, html-validate,
external-links, no-placeholders, nav-consistency, sitemap-drift, seo-meta,
jsonld-validate, byte-budgets (spec 014), img-attrs (spec 014). Nuevos:
`tests/no-trackers.sh`, `tests/no-cookies.sh`.
**Target Platform**: navegadores evergreen (mobile-first) sirviendo páginas
estáticas vía GitHub Pages con dominio `ardops.dev`.
**Project Type**: sitio estático (Principio III).
**Performance Goals**: misma página debe cumplir thresholds de spec 014
(Performance ≥ 0.95 mobile, CLS ≤ 0.1, LCP ≤ 3000 ms mobile / 2500 ms
desktop). HTML ≤ 51 200 B gzip (presupuesto html-each ya activo).
**Constraints**:

- Cero JS en la página.
- Cero externals en runtime (Principio VIII).
- CSP estricta de spec 009 sin cambios.
- Sin banner de cookies (out of scope explícito).
- Los gates corren sobre archivos servidos; excluyen `node_modules/`,
  `.specify/`, `specs/`, `docs/`, `backlog/`, `.reference/`, `tests/`,
  `legacy/`, `.git/`, `scripts/` y archivos de configuración del workspace.

**Scale/Scope**: 1 página HTML nueva (~5 KB), 2 scripts bash (~80 LOC c/u),
1 archivo de patrones (~30 líneas), 1 entry en sitemap, 1 entry en footer
global × N HTMLs ya servidos, 1 principio constitucional +
sync-impact-report.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio | Status | Cómo se cumple |
|---|---|---|---|
| I | Spec-Driven obligatorio | ✅ | Spec 015 aprobada antes de plan; este plan precede tasks/implement. |
| II | Identidad visual preservada | ✅ | `/privacy/` reutiliza tokens, fuentes y layout existentes. Sin nuevos colores ni fonts. |
| III | Sitio 100% estático | ✅ | HTML estático + bash gates. Sin backend, sin build server. |
| IV | Cero deps JS de terceros sin justificación | ✅ | Cero deps nuevas (npm o bash). Solo `grep`/`find`/`awk` ya disponibles. |
| V | Fonts y assets self-hosted | ✅ | La página usa los `.woff2` ya hospedados; cero CDNs. |
| VI | Accesibilidad WCAG 2.1 AA | ✅ | HTML semántico (`<main>`, `<article>`, h1 único, `<time>`), foco visible, contraste heredado de tokens. Sin formularios, sin widgets dinámicos. |
| VII | Performance es feature | ✅ | Página HTML mínima (≤ 5 KB); reusa CSS preempaquetado; sin JS adicional. Cumple thresholds de spec 014 (verificado en SC-07). |
| VIII | Seguridad por defecto | ✅ | Misma CSP, referrer policy, anti-tabnabbing (los enlaces externos a `github.com` van con `rel="noopener noreferrer"`). El gate `no-trackers` refuerza la invariante "cero externals". |
| IX | Cada PR pasa todas las gates | ✅ | Los dos gates nuevos se integran en CI (`.github/workflows/ci.yml`) y en `package.json` (`check:distribution`). |
| X | Documentación versionada | ✅ | Spec, plan, research, data-model, contracts, quickstart, tasks viven en `specs/015-…`. Constitución actualizada con sync-impact-report. |
| XI | Hosting y dominio fijos | ✅ | Sin cambios al hosting GitHub Pages ni al dominio GoDaddy. |

**Principio nuevo a introducir**: **XII — Privacy by Default** (no se
renumeran X y XI existentes; el backlog usaba "X" como nomenclatura
genérica pero la constitución vigente ya consume ese número). El bump
constitucional es MINOR (v1.2.0 → v1.3.0). Procedimiento documentado en
research R-5.

**Resultado**: 11/11 PASS, 0 desviaciones. No requiere tabla de Complexity
Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/015-privacy-no-tracking/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── privacy-page.md
│   ├── no-trackers-gate.md
│   └── no-cookies-gate.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (generado por /speckit.tasks)
```

### Source Code (repository root)

```text
privacy/
└── index.html                          # NEW

tests/
├── no-trackers.sh                      # NEW
├── no-cookies.sh                       # NEW
└── tracker-domains.txt                 # NEW

scripts/
├── build-blog.js                       # MODIFIED — footer con link /privacy/
└── build-interviews.js                 # MODIFIED — siteFooter() incluye /privacy/

# HTMLs servidos
index.html, 404.html, blog/index.html, blog/*.html,
talks/index.html, speaking/index.html, now/index.html,
interviews/index.html (regenerado), uses/index.html (si existe)
                                        # MODIFIED — footer con <a href="/privacy/">

.specify/memory/constitution.md         # MODIFIED — Principio XII + sync-impact-report
.github/workflows/ci.yml                # MODIFIED — jobs no-trackers, no-cookies
package.json                            # MODIFIED — scripts check:no-trackers, check:no-cookies
sitemap.xml                             # MODIFIED — entry de /privacy/
docs/05-security-spec.md                # MODIFIED — nota a la política
```

**Structure Decision**: el sitio sigue la estructura estática plana ya en uso
(carpeta por sección a la raíz del repo + `assets/` + `tests/`). La nueva
página vive en `privacy/index.html` siguiendo el patrón de
`now/index.html`. Los gates van junto a los existentes en `tests/`. La
lista de patrones es un archivo plano para que sea mantenible sin tocar
bash.

## Complexity Tracking

Sin violaciones constitucionales. Tabla vacía intencional.
