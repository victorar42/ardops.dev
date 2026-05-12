# Implementation Plan: Shared nav & footer (single source of truth)

**Branch**: `008-shared-nav-and-footer` · **Date**: 2026-05-11
**Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-shared-nav-and-footer/spec.md`

---

## Summary

Consolidar `<header>` (con `<nav>`) y `<footer>` en una **única fuente de
verdad** consumida por la home estática (`index.html`) y por los tres
generadores existentes (`scripts/build-blog.js`,
`scripts/build-interviews.js`, `scripts/build-pipeline.js`). Validar
consistencia con un nuevo gate (`tests/nav-consistency.sh`) que bloquea
drift entre páginas.

**Approach**:

1. Crear `scripts/lib/layout.js` con un array `NAV` declarativo y dos
   funciones puras: `renderHeader(currentPath)` y `renderFooter()`.
2. Refactorizar los generadores para que importen y consuman ese módulo.
3. Aplicar **marker pattern** (Mecanismo B) a `index.html` — es el
   patrón ya establecido en el repo (`build-blog.js` usa
   `<!-- blog:start -->`, `build-pipeline.js` usa `<!-- pipeline:start -->`).
   Nuevo: `<!-- nav:start --> ... <!-- nav:end -->` y
   `<!-- footer:start --> ... <!-- footer:end -->` en `index.html`,
   procesados por un nuevo `scripts/build-layout.js` con modo `--check`.
4. Crear `tests/nav-consistency.sh` que parsea el HTML servido y valida
   que todos los `<nav>` y `<footer>` son equivalentes al contrato.

## Technical Context

**Language/Version**: Node.js 20 (build-time), HTML5 + CSS3 (runtime).
**Primary Dependencies**:
- Build-time: ya disponibles — `gray-matter`, `marked`, `dompurify`,
  `jsdom` (todas devDependencies del repo). **No se agregan deps nuevas.**
- Runtime: ninguna (sitio estático puro).
**Storage**: N/A (sitio estático).
**Testing**:
- `node scripts/build-layout.js --check` (idempotencia de markers).
- `node scripts/build-blog.js --check`, `build-interviews.js --check`,
  `build-pipeline.js --check` (siguen pasando).
- `bash tests/nav-consistency.sh` (nuevo).
- `npm run html-validate`.
- `node tests/a11y.js` (axe-core).
**Target Platform**: Navegadores modernos (last 2 versions de
Chrome/Firefox/Safari/Edge). Sin JS para nav (CSS-only).
**Project Type**: Sitio estático personal — **single project**.
**Performance Goals**:
- Cero impacto en runtime (todo el trabajo es a build-time).
- Lighthouse Performance ≥ 95 mantenido.
- HTML del nav/footer no debe crecer > 5% vs el actual.
**Constraints**:
- Constitución III: cero deps runtime.
- Constitución IV: CSP estricta `script-src 'self'` intacta. Sin JS
  inyectado para nav.
- Constitución II: paleta y tipografía no cambian.
- Constitución XI: GH Pages-only; no headers HTTP custom (irrelevante
  para esta spec).
**Scale/Scope**:
- Páginas servidas afectadas (al inicio): `index.html`, `blog/index.html`,
  `blog/<slug>.html` (×N), `interviews/index.html`,
  `interviews/<slug>.html` (×N), `talks/index.html`, `404.html`.
- 6 items en el array `NAV` inicial.
- Skip link + footer iguales en todas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Cumplimiento | Comentario |
|---|---|---|---|
| **I. Spec-Driven** | Sí | ✓ | Esta spec/plan/tasks/implement es la 008 ordenada. |
| **II. Identidad visual** | Sí | ✓ | El módulo emite el mismo HTML que hoy; CSS no cambia. |
| **III. Sitio 100% estático** | Sí | ✓ | Todo build-time. Output sigue siendo HTML+CSS. |
| **IV. Cero deps JS de terceros** | Sí | ✓ | No se agregan deps nuevas (ni dev ni runtime). |
| **V. Fonts/assets self-hosted** | N/A | — | Esta spec no toca assets externos. |
| **VI. Accesibilidad WCAG 2.1 AA** | Sí | ✓ | Refuerza `aria-current="page"` consistente. axe-core debe pasar. |
| **VII. Performance es feature** | Sí | ✓ | Cero impacto runtime. HTML emitido equivalente al actual. |
| **VIII. Seguridad por defecto** | Sí | ✓ | Sin JS nuevo. CSP intacta. |
| **IX. Cada PR pasa todas las gates** | Sí | ✓ | Nuevo gate `nav-consistency.sh` se suma; todos los existentes deben seguir verdes. |
| **X. Documentación versionada** | Sí | ✓ | Spec, plan, research, data-model, contracts, tasks, todo en git. |
| **XI. Hosting/dominio fijos** | N/A | — | No cambia hosting. |

**Resultado**: ✅ **PASS**. Ninguna violación, sin necesidad de tabla
de Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/008-shared-nav-and-footer/
├── spec.md              # Feature specification (exists)
├── plan.md              # This file
├── research.md          # Phase 0 — decisiones técnicas
├── data-model.md        # Phase 1 — estructura del NAV item, contrato del módulo
├── quickstart.md        # Phase 1 — runbook para ejecutar/validar localmente
├── contracts/
│   ├── layout-module.md       # API pública de scripts/lib/layout.js
│   ├── nav-html-contract.md   # Forma exacta del HTML emitido por renderHeader
│   ├── footer-html-contract.md# Forma exacta del HTML emitido por renderFooter
│   └── nav-consistency-gate.md# Contrato del gate tests/nav-consistency.sh
├── checklists/
│   └── requirements.md  # Quality checklist (exists, PASS)
└── tasks.md             # Phase 2 (creado por /speckit.tasks)
```

### Source Code (repository root)

```text
ardops.dev/
├── index.html                          # MODIFICA: agregar markers nav + footer
├── 404.html                            # MODIFICA: agregar markers nav + footer
├── scripts/
│   ├── lib/
│   │   └── layout.js                   # NUEVO: NAV array + renderHeader + renderFooter
│   ├── build-layout.js                 # NUEVO: aplica markers en index.html y 404.html
│   ├── build-blog.js                   # MODIFICA: importa renderHeader/Footer
│   ├── build-interviews.js             # MODIFICA: importa renderHeader/Footer
│   └── build-pipeline.js               # SIN CAMBIOS (solo toca section, no nav)
├── tests/
│   └── nav-consistency.sh              # NUEVO: gate de consistencia
└── package.json                        # MODIFICA: agregar npm scripts si aplica
```

**Structure Decision**: **Single project** — el repo es un sitio estático
personal. Los generadores ya viven todos en `scripts/`. Se introduce
`scripts/lib/` como subcarpeta para módulos compartidos puros (siguiendo
convención Node estándar). No se justifica un workspace multi-proyecto.

## Complexity Tracking

> No hay violaciones constitucionales, esta tabla queda vacía.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 — Research

Ver [research.md](research.md). Decisiones tomadas:

- **D-001** Mecanismo de inyección en home: **marker pattern** (B).
- **D-002** Lenguaje del módulo: **CommonJS** (alineado con resto del repo).
- **D-003** Estrategia de matching de `aria-current`: por path normalizado.
- **D-004** "Charla" vs "Charlas": **plural**.
- **D-005** Logo siempre `/`.
- **D-006** Anchors siempre absolutos (`/#pipeline`, `/#contact`).
- **D-007** `404.html` también debe emitir nav/footer compartidos.
- **D-008** Gate de consistencia: parser bash con `pup` o `node -e` con
  `jsdom` (ya disponible). Decidido: usar Node + jsdom para no agregar deps.
- **D-009** Skip link emitido por `renderHeader()` (parte del contrato).
- **D-010** Year en footer queda hardcoded a `2026` (no JS dinámico).

## Phase 1 — Design & Contracts

### Data model

Ver [data-model.md](data-model.md). Entidades:

- `NavItem` (`{ href, label, match, isAnchor }`).
- `LayoutContext` (`{ currentPath }`).
- `RenderedHeader`, `RenderedFooter` (string HTML).

### Contracts

- [contracts/layout-module.md](contracts/layout-module.md) — API
  pública de `scripts/lib/layout.js`.
- [contracts/nav-html-contract.md](contracts/nav-html-contract.md) —
  Forma exacta del HTML del header.
- [contracts/footer-html-contract.md](contracts/footer-html-contract.md) —
  Forma exacta del HTML del footer.
- [contracts/nav-consistency-gate.md](contracts/nav-consistency-gate.md) —
  Contrato del gate de validación.

### Quickstart

Ver [quickstart.md](quickstart.md). Runbook completo para regenerar
localmente, validar gates, y entender qué hacer si una página falla la
validación.

### Agent context update

El plan activo en [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md)
ya está apuntando a `specs/008-shared-nav-and-footer/spec.md` (actualizado
durante `/speckit.specify`). Se actualiza ahora a este plan.

## Re-evaluación post-diseño (Constitution Check #2)

Después de Phase 1 (data-model, contracts, quickstart), re-check:

| Principio | Estado |
|---|---|
| Todos los principios I-XI | ✅ Sin cambio respecto al check inicial. |
| Nuevas dependencias introducidas en Phase 1 | ✅ Ninguna. `jsdom` ya está como devDependency desde spec 006. |
| Cambios visuales emergentes | ✅ Cero. El HTML emitido es byte-equivalente al actual (modulo `aria-current` y normalización de logo/anchors). |

**Resultado**: ✅ **PASS**. Listo para Phase 2 (`/speckit.tasks`).

## Stop and Report

- **Branch activa**: `008-shared-nav-and-footer`.
- **IMPL_PLAN**: [`specs/008-shared-nav-and-footer/plan.md`](plan.md) — este archivo.
- **Artifacts generados**:
  - [research.md](research.md)
  - [data-model.md](data-model.md)
  - [quickstart.md](quickstart.md)
  - [contracts/layout-module.md](contracts/layout-module.md)
  - [contracts/nav-html-contract.md](contracts/nav-html-contract.md)
  - [contracts/footer-html-contract.md](contracts/footer-html-contract.md)
  - [contracts/nav-consistency-gate.md](contracts/nav-consistency-gate.md)
- **Constitution Check**: PASS (inicial y post-diseño).
- **Próximo paso**: `/speckit.tasks`.
