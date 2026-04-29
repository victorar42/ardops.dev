# Implementation Plan: Reescritura de Bio Personal (tono cálido)

**Branch**: `004-personal-bio-rewrite` | **Date**: 2026-04-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from [specs/004-personal-bio-rewrite/spec.md](spec.md)

## Summary

Reescribir la copia visible del hero (`index.html` § hero) y de la sección "Sobre mí" (`#about`) para que suene a Victor hablando en primera persona, integrando rol profesional (DevOps Engineer · DevSecOps banca CR) con un dato humano discreto (papá de tres — dos chicos y una chica — y aficionado al fútbol). Auditar los archivos servidos para erradicar placeholders huérfanos (`[Tu Nombre]`, `TODO`, `FIXME`, `XXX`) y, opcionalmente, exponer esta auditoría como un gate trivial de CI.

Enfoque técnico: cambios solo de contenido en HTML servido + meta tags. Sin nuevas dependencias, sin nuevo CSS estructural, sin nuevo JS. La validación reusa los gates existentes (`html-validate`, `tests/a11y.js`, `tests/forbidden-urls.sh`) y añade — opcionalmente — un nuevo gate `tests/no-placeholders.sh` que ejecuta `grep` sobre archivos servidos.

## Technical Context

**Language/Version**: HTML5 + CSS3 (existente, sin cambios) — sin JS nuevo
**Primary Dependencies**: ninguna nueva. Reusa `html-validate` (devDep), `puppeteer + axe-core` (`tests/a11y.js`), `lychee` (CI), `bash + grep` para gates.
**Storage**: N/A
**Testing**: gates existentes (`html-validate`, `tests/a11y.js`, `tests/forbidden-urls.sh`, `tests/interviews-*.sh`) + nuevo `tests/no-placeholders.sh` (bash + grep, decisión R-002)
**Target Platform**: GitHub Pages (sitio estático, navegadores modernos: Safari iOS 16+, Chrome Android 12+, evergreen desktop)
**Project Type**: sitio estático (constitución III)
**Performance Goals**: no regresión vs. baseline actual (Lighthouse Performance ≥ 95, LCP < 2.5 s, CLS < 0.1, INP < 200 ms — constitución VII). El cambio reduce el peso del HTML del hero (copy más corto), por lo que la dirección esperada es neutra-a-positiva.
**Constraints**: CSP estricto vigente (no se altera). Lectura del hero en mobile ≤ 380 px sin overflow horizontal (FR-008). Información personal sensible queda explícitamente prohibida (FR-007).
**Scale/Scope**: ~15 strings de contenido en 1 archivo principal (`index.html`) + 1–2 strings en metadatos (`<meta description>`, `og:description`). Auditoría de placeholders barre ≤ 10 archivos servidos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Estado | Justificación |
|---|---|---|---|
| **I. Spec-Driven obligatorio** | sí | ✅ | Spec aprobado, plan en curso, tasks vendrá después. |
| **II. Identidad visual preservada** | sí | ✅ | Solo se cambia el copy. No se tocan tokens, fuentes, animaciones, ni componentes. |
| **III. Sitio 100% estático** | sí | ✅ | Edita HTML servido. Sin server-side, sin build nuevo. |
| **IV. Cero dependencias JS de terceros** | sí | ✅ | No se añade JS. El nuevo gate (si se aprueba) es bash puro. |
| **V. Fonts y assets self-hosted** | sí | ✅ | No se introducen assets externos. |
| **VI. Accesibilidad WCAG 2.1 AA** | sí | ✅ | El cambio reduce densidad textual; mantiene `<h1>` único, `<p>` para prosa. Validación via `tests/a11y.js` (FR-009). |
| **VII. Performance es feature** | sí | ✅ | Copy más corto → menor HTML transferido. Sin impacto en CLS/INP. |
| **VIII. Seguridad por defecto** | sí | ✅ | CSP intacta. Sin secrets. Sin tracking. La auditoría de placeholders es de **higiene de contenido**, no de seguridad. |
| **IX. Cada PR pasa todas las gates** | sí | ✅ | Reuso gates existentes; no se relajan thresholds. |
| **X. Documentación versionada** | sí | ✅ | spec.md + plan.md + research.md + data-model.md + quickstart.md + contracts/ se commitean. |
| **XI. Hosting y dominio fijos** | sí | ✅ | Sin cambios de hosting ni DNS. |

**Resultado**: Sin violaciones constitucionales. No se requiere "Complexity Tracking".

## Project Structure

### Documentation (this feature)

```text
specs/004-personal-bio-rewrite/
├── plan.md              # este archivo
├── spec.md              # feature spec aprobada
├── research.md          # Phase 0 — decisiones tonales y técnicas
├── data-model.md        # Phase 1 — entidades de contenido (bio, about, meta)
├── quickstart.md        # Phase 1 — runbook editorial + verificación
├── contracts/
│   ├── copy-contract.md          # texto final aprobado (hero + about + meta)
│   └── no-placeholders-gate.md   # contrato del gate (regex y archivos cubiertos)
└── checklists/
    └── requirements.md  # quality checklist de la spec
```

### Source Code (repository root)

Esta feature edita archivos existentes; no crea nueva estructura.

**Archivos tocados**:

```text
ardops.dev/
├── index.html                         # hero (líneas ~143–158) + about (~241–270) + <meta>
├── 404.html                           # auditoría: revisar tono y placeholders
├── talks/index.html                   # auditoría: revisar placeholders
├── blog/index.html                    # auditoría: revisar placeholders
├── tests/
│   └── no-placeholders.sh             # NUEVO (opcional pero recomendado, ver R-002)
└── .github/workflows/
    └── ci.yml                         # NUEVO job `no-placeholders` (si gate adoptado)
```

**Estructura no afectada**: `assets/`, `scripts/`, `content/`, `interviews/`, `specs/` previas.

**Structure Decision**: feature de **contenido editorial** sobre `index.html` con extensión opcional de un gate de CI. No introduce nuevas carpetas ni tecnologías. La opción "single project" de la plantilla aplica trivialmente al sitio existente.

## Complexity Tracking

> *Sin violaciones constitucionales que justificar.* No aplica.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 — Research output

Resumen embebido de [research.md](research.md) (14 decisiones, prefijo R-XXX):

- **R-001 — Voz narrativa**: primera persona, registro cálido-técnico. Adoptado.
- **R-002 — Gate `no-placeholders.sh`**: opcional pero recomendado, bash + grep, ≤ 30 líneas. Adoptado.
- **R-003 — Patrones de placeholder a buscar**: `\[Tu Nombre\]`, `\bTODO\b`, `\bFIXME\b`, `\bXXX\b`. (Excluye sintaxis JSON/MD legítima al limitar a archivos servidos.)
- **R-004 — Archivos auditados**: `index.html`, `404.html`, `talks/index.html`, `blog/index.html`, `sitemap.xml`, `robots.txt`, `public/favicon/*.webmanifest`, `interviews/index.html` y `interviews/*.html` cuando existen. Excluye `docs/`, `specs/`, `tests/`, `scripts/`, `.specify/`, `assets/`, `content/`, `legacy/`.
- **R-005 — Longitud del hero copy**: 40–90 palabras (Spec FR-003). Decisión: target 60 palabras ± 10%.
- **R-006 — Mención humana**: una sola oración integrada en prosa que combine "papá de tres" + "fútbol", sin enumerar nombres ni edades.
- **R-007 — Firma corta**: "Victor Ardón" para referencias subsecuentes; nombre legal completo solo en `h1`.
- **R-008 — Encoding del nombre**: Unicode `ó` (U+00F3) directo en HTML; UTF-8 sin BOM. Confirmado en `index.html` actual.
- **R-009 — Meta descriptions**: actualizar `<meta name="description">` y `og:description` para reflejar voz nueva, ≤ 160 chars; mantener keywords clave (DevSecOps, banca CR) por SEO.
- **R-010 — JSON-LD `Person` schema**: revisar si el `<script type="application/ld+json">` actual del home referencia al autor; si sí, alinear `description` y `name`.
- **R-011 — Stack chip**: la línea `p.about-stack` ("GitHub Actions · DevSecOps · …") permanece como **chip técnico complementario** después de la prosa cálida — no es una lista de bullets, es una firma técnica visual.
- **R-012 — Tono regional**: 1 toque tico discreto máximo (ej. "del tico" o un giro coloquial); el resto en español neutro.
- **R-013 — 404.html**: revisar y, si el copy actual rompe la voz, ajustar a "se nos perdió esa página, escribime si era importante" o similar; out-of-scope solo si la copia actual ya es coherente.
- **R-014 — CI integration**: el nuevo gate es independiente y barato (< 1 s); se añade como job dedicado `no-placeholders` en `ci.yml`, paralelo al resto.

**Output**: `research.md` con todas las NEEDS CLARIFICATION resueltas (no había marcadores; el brief venía completo).

## Phase 1 — Design & Contracts

### Data Model

Ver [data-model.md](data-model.md). Entidades (todas son strings de contenido):

- **HeroBio**: copy en primera persona, 40–90 palabras, sin enumeración técnica.
- **AboutBlock**: 2–3 párrafos, expande hero, incluye dato humano explícito.
- **AboutStack**: línea decorativa con stack técnico (existente, se mantiene).
- **MetaDescription**: ≤ 160 chars, refleja la voz nueva.
- **OGDescription**: ≤ 160 chars, sincronizado con `MetaDescription`.

Invariantes I-1..I-5 documentados en `data-model.md`.

### Contracts

- [contracts/copy-contract.md](contracts/copy-contract.md): texto final aprobado del hero, about, meta — versión normativa que las tasks deben copiar literalmente.
- [contracts/no-placeholders-gate.md](contracts/no-placeholders-gate.md): contrato del gate de auditoría (regex, archivos, exit codes, falsos positivos esperados).

### Quickstart

Ver [quickstart.md](quickstart.md). Contiene dos runbooks:

- **Runbook A (editorial)**: cómo editar la bio paso a paso (qué archivos abrir, dónde encontrar el bloque, cómo verificar).
- **Runbook B (gate)**: cómo añadir el job `no-placeholders` en CI y verificar localmente.

### Agent context update

Marker `<!-- SPECKIT START/END -->` en `.github/copilot-instructions.md` se actualizará a la spec activa 004 al cierre de Phase 1.

## Re-evaluation post-design

| Principio | Estado |
|---|---|
| I–XI | ✅ sin cambios respecto al check inicial. El diseño no introduce ninguna desviación. |

**Resultado final**: Plan aprobado para `/speckit.tasks`.
