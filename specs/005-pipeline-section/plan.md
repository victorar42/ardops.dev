# Implementation Plan: Sección "Pipeline" (roadmap público de contenido)

**Branch**: `005-pipeline-section` | **Date**: 2026-04-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/005-pipeline-section/spec.md`

## Summary

Reemplazar la sección actual `#blog` ("Artículos / contenido_en_desarrollo") del landing por una nueva sección **"Pipeline"** que renderiza un roadmap público de contenido (entrevistas, labs, charlas, posts) leído desde `content/pipeline.json`. Visualización tipo lista vertical con badges de tipo y estado (metáfora pipeline), agrupada por estado en orden canónico `coming-soon → review → in-progress → backlog`.

Implementación **build-time** (Node script `scripts/build-pipeline.js`) que valida el JSON estricto, ordena los items y reemplaza el bloque entre dos marcadores HTML (`<!-- pipeline:start -->` / `<!-- pipeline:end -->`) en `index.html`. Sin JS de runtime (constitución VII), sin nuevas dependencias (reusa `node:fs` puro). Una nueva CI gate verifica que `index.html` esté sincronizado con el JSON. Se preserva el ancla legacy `#blog` mediante alias.

## Technical Context

**Language/Version**: HTML5 + CSS3 con custom properties + ES2020 vanilla (sin frameworks). Build script en Node.js 20 LTS (CI = `actions/setup-node@v4` con `node-version: 20`, ya instalado para spec 003).
**Primary Dependencies**: cero dependencias nuevas. Build script usa solo `node:fs` y `node:path` (stdlib). Validación con regex puras y un schema declarado in-script (sin `ajv`). El runtime del sitio NO carga JS para esta sección — el HTML ya viene resuelto.
**Storage**: archivo plano `content/pipeline.json` (versionado). Es la única fuente de verdad.
**Testing**:
- Build dry-run + validación estricta (`scripts/build-pipeline.js --check`) en CI.
- `tests/pipeline-schema.sh` — fixture negativo (id duplicado, stage inválido, etc.) que MUST hacer fallar el build.
- `tests/a11y.js` (axe-core, ya existente) re-ejecutado contra el landing.
- `tests/no-placeholders.sh` (spec 004) cubre que la nueva sección no introduce placeholders.
- `tests/forbidden-urls.sh` (spec 002) sigue verde.
- `npx html-validate index.html` 0 errores.

**Target Platform**: GitHub Pages estático, navegadores evergreen + Safari iOS. Móvil mínimo 320 px.
**Project Type**: sitio estático single-page-landing + páginas auxiliares.
**Performance Goals**: Lighthouse Performance ≥ 95 (constitución VII), LCP < 2.5 s, CLS < 0.1, INP < 200 ms. La sección NO añade requests de runtime (cero `fetch`, cero JS extra). El peso del HTML adicional es ~3–5 KB gzipped por ≤12 items.
**Constraints**:
- Estática (constitución III).
- CSP estricto vigente: `default-src 'self'; script-src 'self'; ...` — la sección no requiere flexibilizarlo.
- Cero deps JS de terceros nuevas (constitución IV).
- Self-hosted (constitución V).
- WCAG 2.1 AA no-negociable (constitución VI).

**Scale/Scope**: ≤12 items visibles en el primer iterado, expectativa estable ≤20 a mediano plazo. Catálogo cerrado: 4 estados × 5 tipos = 20 combinaciones posibles.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Notas |
|---|---|---|
| **I. Spec-Driven obligatorio** | ✅ | spec.md aprobado, este plan vive en `specs/005-pipeline-section/`. |
| **II. Identidad visual preservada** | ✅ | Reusa tokens existentes (`--accent`, `--green`, `--bg-primary`, JetBrains Mono). El `section-label` `// pipeline` y `section-title` siguen el patrón establecido. Los nuevos estilos viven en `assets/css/components.css` extendiendo `.section`/`.section-label`/`.section-title`; ningún nuevo color hardcodeado. |
| **III. Sitio 100% estático** | ✅ | Build script en Node corre en CI (build-time); el sitio servido es HTML/CSS/JS plano. Sin backend ni base de datos. |
| **IV. Cero deps JS sin justificación** | ✅ | Cero dependencias nuevas. Build script usa solo `node:fs` y `node:path`. Runtime del sitio: cero JS añadido (la sección es HTML estático generado). |
| **V. Fonts y assets self-hosted** | ✅ | No introduce assets externos. |
| **VI. Accesibilidad WCAG 2.1 AA** | ✅ | Semántica: `<section aria-labelledby>`, `<ul role="list">` para items, badges con texto + icono SVG inline (no solo color), foco visible. Validado vía `tests/a11y.js`. |
| **VII. Performance ≥ 95** | ✅ | Cero requests adicionales de runtime, ~3–5 KB de HTML extra. SVG icons inline (sin sprite externo). |
| **VIII. Seguridad por defecto** | ✅ | Build script escapa todo contenido user-controlled del JSON antes de inyectarlo en HTML (whitelist de chars, escape de `<`, `>`, `"`, `'`, `&`). Items con `link` validan `https://` (mismo regex que spec 003). CSP no requiere cambios. |
| **IX. Cada PR pasa todas las gates** | ✅ | Nueva gate `pipeline-build-check` se añade al workflow; gates existentes (a11y, html-validate, links, forbidden-urls, no-placeholders, interviews-*) siguen verdes. |
| **X. Documentación versionada** | ✅ | spec, plan, research, data-model, contracts, quickstart, tasks: todos en `specs/005-pipeline-section/`. |
| **XI. Hosting fijo** | ✅ | Sin cambios de hosting/dominio. |

**Resultado**: PASA. No hay violaciones. Sección "Complexity Tracking" vacía.

## Project Structure

### Documentation (this feature)

```text
specs/005-pipeline-section/
├── plan.md                     # This file
├── research.md                 # Phase 0 — decisiones técnicas
├── data-model.md               # Phase 1 — schema PipelineItem + estados/tipos
├── quickstart.md               # Phase 1 — workflow de mantenimiento
├── contracts/
│   ├── pipeline-schema.json    # Phase 1 — JSON Schema estricto del data file
│   ├── render-contract.md      # Phase 1 — contrato HTML/ARIA del fragmento
│   └── ci-gate.md              # Phase 1 — qué verifica `pipeline-build-check`
├── checklists/
│   └── requirements.md         # Ya creado en /speckit.specify
└── tasks.md                    # Phase 2 — generado por /speckit.tasks
```

### Source Code (repository root)

```text
ardops.dev/
├── index.html                              # MODIFY — reemplaza bloque #blog por sección Pipeline + ancla legacy
├── content/
│   ├── interviews/                         # (existente, spec 003)
│   ├── pipeline.json                       # NUEVO — fuente de verdad del pipeline
│   └── pipeline.fixtures/                  # NUEVO — fixtures para gate negativa (no servidos)
│       ├── invalid-duplicate-id.json
│       ├── invalid-unknown-stage.json
│       ├── invalid-missing-title.json
│       └── invalid-bad-link.json
├── scripts/
│   ├── build-interviews.js                 # (existente)
│   └── build-pipeline.js                   # NUEVO — valida JSON + inyecta HTML entre marcadores
├── tests/
│   ├── a11y.js                             # (existente, sin cambios)
│   ├── pipeline-schema.sh                  # NUEVO — corre cada fixture y exige exit≠0
│   └── ... (resto sin cambios)
├── assets/css/
│   └── components.css                      # MODIFY — agregar `.pipeline-*` classes
├── .github/workflows/
│   └── ci.yml                              # MODIFY — agregar job `pipeline-build-check`
└── .gitignore                              # SIN cambios (no hay output generado fuera del index.html)
```

**Structure Decision**: extiende el patrón establecido por spec 003 (build-time Node script) pero más simple: en lugar de generar archivos nuevos en `interviews/`, este script **edita in-place** un bloque marcado dentro de `index.html`. La inyección por marcadores hace el resultado auditable en git diff (cualquier cambio del pipeline produce un diff visible en `index.html` además de `content/pipeline.json`), y la gate `pipeline-build-check` corre el script con `--check` (re-genera y compara) — si el `index.html` commiteado no coincide con lo que el JSON produciría, el CI falla.

## Complexity Tracking

> **No hay violaciones constitucionales.** Esta sección queda vacía.
