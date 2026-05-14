# Implementation Plan: Performance & a11y thresholds (refinamiento del baseline)

**Branch**: `014-perf-a11y-thresholds` | **Date**: 2026-05-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/014-perf-a11y-thresholds/spec.md`

## Summary

Endurecer enforcement de los principios constitucionales VI (a11y),
VII (performance), VIII (seguridad) y IX (gates) **sin agregar features
visibles**. Tres componentes:

1. **Lighthouse thresholds**: ya están en su lugar para desktop
   (`tests/lighthouserc.json` cumple FR-01..03). Falta agregar
   `interviews/index.html` y el último blog post a las URLs (FR-02), y
   subir el threshold de performance de **mobile** a 0.95 (de 0.9
   actual) para alinearlo con el spec.
2. **Tres nuevos gates bash** (`tests/byte-budgets.sh`,
   `tests/img-attrs.sh`, `tests/no-third-party-fonts.sh`) wired a
   `package.json` (`check:byte-budgets`, `check:img-attrs`,
   `check:fonts`) y a `.github/workflows/ci.yml` como jobs separados.
3. **Documentación** actualizada en `docs/06-performance-spec.md` y
   `docs/07-accessibility-spec.md`.

Cero deps nuevas. Cero cambios de contenido. Cero ajustes visuales.

## Technical Context

**Language/Version**: Bash POSIX (target macOS BSD + Linux GNU) + Node 20
LTS (CommonJS) para scripts existentes que no se tocan.
**Primary Dependencies**: ninguna nueva. Reuso de `gzip`, `wc`, `find`,
`grep`, `awk` (POSIX), `jsdom` (devDep ya presente) opcionalmente
invocado desde un helper Node si la regex bash resulta frágil para
`img-attrs`.
**Storage**: N/A (sitio estático).
**Testing**: scripts shell ejecutables idempotentes con exit codes
explícitos; integrados como steps de CI.
**Target Platform**: GitHub Actions Ubuntu runner + macOS dev local.
**Project Type**: Sitio estático single-project (estructura existente).
**Performance Goals**: cada gate nuevo termina en < 5 s sobre el repo
actual; suite agregada < 30 s wall time (SC-008).
**Constraints**: 0 deps nuevas; bash puro (+ jsdom Node helper si
necesario); sin tocar el contenido publicado; ningún archivo del sitio
actual debe fallar los nuevos gates (verificado en research R-2).
**Scale/Scope**: ~13 páginas HTML servidas, 4 archivos JS, 8 CSS, 6
fonts woff2, 4 imágenes. Sub-segundo por gate.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio | Estado | Justificación |
|---|---|---|---|
| I | Spec-Driven | PASS | Spec → plan → tasks → implement. |
| II | Identidad visual | PASS | Esta spec no toca HTML/CSS de contenido; ningún color, font o animación cambia. |
| III | Sitio estático | PASS | Todo es build-time. |
| IV | Cero deps JS sin justificación | PASS | Cero deps nuevas; bash puro + jsdom (devDep ya existente). |
| V | Fonts self-hosted | PASS | FR-07/08 lo refuerzan con gate dedicada. |
| VI | a11y WCAG AA | PASS | FR-01 (Accessibility = 1.0) lo formaliza; doc actualizado. |
| VII | Performance es feature | PASS | FR-01/03 formaliza los thresholds; byte budgets son refuerzo. |
| VIII | Seguridad por defecto | PASS | FR-07 refuerza "cero externals"; CSP gate intacto. |
| IX | Cada PR pasa todas las gates | PASS | Los 3 gates nuevos suman jobs CI; FR-01 promueve assertions Lighthouse a error. |
| X | Documentación versionada | PASS | FR-10 obliga a actualizar docs/06 y docs/07. |
| XI | Hosting/dominio fijos | PASS | Sin impacto. |

**Resultado**: 11/11 PASS. Cero excepciones a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/014-perf-a11y-thresholds/
├── plan.md                           # This file
├── spec.md                           # ✓
├── research.md                       # Phase 0 (R-1..R-8)
├── data-model.md                     # Phase 1
├── quickstart.md                     # Phase 1
├── contracts/
│   ├── byte-budgets.md
│   ├── img-attrs.md
│   ├── no-third-party-fonts.md
│   └── lighthouse-thresholds.md
├── checklists/
│   └── requirements.md               # ✓
└── tasks.md                          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
# Modificados
tests/
├── lighthouserc.json                 # MOD — agrega URLs (interviews/, último post)
├── lighthouserc.mobile.json          # MOD — sube performance a 0.95 (de 0.9); LCP/TBT mobile permanecen permisivos (3000/300)
├── byte-budgets.sh                   # NUEVO — gate de tamaño gzip/raw
├── img-attrs.sh                      # NUEVO — gate de atributos <img>
└── no-third-party-fonts.sh           # NUEVO — gate de fonts policy

docs/
├── 06-performance-spec.md            # MOD — sección "Thresholds & budgets (spec 014)"
└── 07-accessibility-spec.md          # MOD — sección "WCAG 2.1 AA enforcement (spec 014)"

package.json                          # MOD — scripts check:byte-budgets, check:img-attrs, check:fonts; encadenado en check:distribution

.github/workflows/ci.yml              # MOD — 3 nuevos jobs: byte-budgets, img-attrs, fonts-policy
.github/copilot-instructions.md       # MOD — marker SPECKIT → tasks 014
```

**Structure Decision**: Sitio estático single-project. Los gates nuevos
viven en `tests/` siguiendo la convención establecida por
`tests/no-placeholders.sh`, `tests/headshot-size.sh` y
`tests/now-freshness.sh`. CI integra cada gate como job paralelo
separado para feedback rápido (SC-002: byte-budgets debe fallar en
< 90 s, independiente de Lighthouse).

## Complexity Tracking

> Not applicable — Constitution Check passes 11/11.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | (none)     | (none)                              |

## Phase 0 — Research

Ver [research.md](research.md). Decisiones cerradas:

- **R-1** Unidad de medida de byte budgets (KB decimal vs KiB binario).
- **R-2** Verificación de que el sitio actual cumple todos los budgets.
- **R-3** Algoritmo de cálculo de gzip determinístico (`gzip -c -9`).
- **R-4** Parser de `<img>` (regex bash vs jsdom helper Node).
- **R-5** Detección de "primera imagen" del documento (LCP candidate).
- **R-6** Exception list para `assets/img/speaking/headshot.jpg`.
- **R-7** URLs faltantes en Lighthouse (interviews, último post) y
  alineación desktop↔mobile.
- **R-8** Cómo expresar policy de fonts en bash sin parser CSS completo.

## Phase 1 — Design & Contracts

Ver:
- [data-model.md](data-model.md) — Entidades: ThresholdConfig, ByteBudget, ImgRule, FontPolicy.
- [contracts/byte-budgets.md](contracts/byte-budgets.md)
- [contracts/img-attrs.md](contracts/img-attrs.md)
- [contracts/no-third-party-fonts.md](contracts/no-third-party-fonts.md)
- [contracts/lighthouse-thresholds.md](contracts/lighthouse-thresholds.md)
- [quickstart.md](quickstart.md)

## Phase 2 — Tasks (out of scope here)

`/speckit.tasks` generará `tasks.md` con orden de dependencia y
marcadores `[P]` para tareas paralelas. Aproximadamente: setup (3) +
foundational (2) + US1 lighthouse (4) + US2 byte-budgets (5) + US3
img-attrs (5) + US4 fonts (4) + polish (4) ≈ 27 tareas.

## Post-Design Constitution Re-check

11/11 PASS — sin cambios desde el pre-design check. Cero deps nuevas
introducidas en data-model. Cero contratos rompen principios.
