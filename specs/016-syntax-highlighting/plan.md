# Implementation Plan: Syntax highlighting build-time (Shiki)

**Branch**: `016-syntax-highlighting` | **Date**: 2026-05-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/016-syntax-highlighting/spec.md`

## Summary

Integrar **Shiki** (build-time) en `scripts/build-blog.js` para que cada
bloque ```` ```{lang} ```` con `lang` en una **allowlist cerrada de 21
gramáticas** se renderice como HTML pre-tokenizado, usando el modo
`cssVariables` (sin atributos `style=` inline). Un stylesheet único
self-hosted `assets/css/syntax.css` (≤ 5 KB gzip) materializa los
colores; se enlaza condicionalmente desde el `<head>` del post **solo
si el post contiene ≥ 1 bloque tokenizado**. Bloques sin lenguaje o
fuera de la allowlist conservan el render mono actual (fallback). El
flag `--check` del builder gana detección de drift Markdown ↔ HTML.
Cero runtime JS; CSP `style-src 'self'` permanece intacta;
`package.json` solo gana `shiki` como devDep.

## Technical Context

**Language/Version**: Node.js 20 (build) · HTML5/CSS3 + vanilla JS (runtime).
**Primary Dependencies**: existentes — `marked`, `dompurify`, `jsdom`,
`gray-matter`. Nueva (devDep build-only): **`shiki ^3.x`**.
**Storage**: filesystem (Markdown en `content/blog/*.md` → HTML en
`blog/<slug>.html`); stylesheet en `assets/css/syntax.css`.
**Testing**: bash POSIX gates (`set -euo pipefail`) + suite local
existente (`html-validate`, `byte-budgets`, `csp-no-unsafe-inline`,
`no-trackers`, `no-cookies`). Nuevos gates: `tests/syntax-css-size.sh`,
`tests/no-inline-styles-blog.sh`, `tests/build-blog-check.sh`.
**Target Platform**: GitHub Pages (estático, sin headers HTTP custom).
**Project Type**: sitio estático single-project.
**Performance Goals**: Lighthouse Performance ≥ 95 mantenido. Build de
un post típico ≤ 5 s local / ≤ 8 s CI. `syntax.css` ≤ 5 KB gzip.
**Constraints**: CSP `style-src 'self'`, `script-src 'self'`; cero
`'unsafe-inline'`; cero JS runtime nuevo; HTML reproducible byte-a-byte.
**Scale/Scope**: blog (≤ 20 posts); ≤ 10 bloques de código promedio
por post; allowlist fija de 21 lenguajes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio | Aplica | Veredicto | Nota |
|---|---|---|---|---|
| I | Spec-Driven | ✓ | PASS | spec.md aprobado, 16/16 checklist. |
| II | Identidad visual | ✓ | PASS | Tema dark único; mapping vía CSS vars contra `--bg-primary`/`--bg-secondary`/`--accent`. |
| III | 100% estático | ✓ | PASS | Shiki opera build-time; emite HTML + CSS estático. |
| IV | Cero deps JS sin justificación | ✓ | PASS | `shiki` es **devDependency**, build-only. Alternativas (Prism, highlight.js) requieren runtime JS y CSS más pesado — rechazadas. Justificación en `research.md`. |
| V | Assets self-hosted | ✓ | PASS | `syntax.css` commiteado en `assets/css/`. Cero CDN. Gramáticas Shiki cargadas desde `node_modules` en build. |
| VI | A11y WCAG 2.1 AA | ✓ | PASS | Contraste mínimo 4.5:1 verificado en research para cada token contra `--bg-secondary`. |
| VII | Performance feature | ✓ | PASS | CSS condicional, ≤ 5 KB gzip, cero JS runtime. Lighthouse ≥ 95 invariante. |
| VIII | Seguridad por defecto | ✓ | PASS | Modo `cssVariables` evita `style=` inline. CSP intacta. `FORBID_ATTR` ya incluye `style`. Cero externals nuevos. |
| IX | Todas las gates | ✓ | PASS | Nuevos: `syntax-css-size`, `no-inline-styles-blog`, `build-blog-check`. Suite existente verde. |
| X | Documentación versionada | ✓ | PASS | spec/plan/research/data-model/contracts/quickstart en `specs/016-*`. |
| XI | Hosting fijo | ✓ | PASS | Sin cambios. |
| XII | Privacy by Default | ✓ | PASS | Sin trackers, sin cookies, sin runtime fetch. |

**Gate result**: 12/12 PASS. Sin violaciones; no se requiere `Complexity Tracking`.

## Project Structure

### Documentation (this feature)

```text
specs/016-syntax-highlighting/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── shiki-integration.md
│   ├── language-allowlist.md
│   ├── syntax-css-budget.md
│   └── csp-invariants.md
├── checklists/
│   └── requirements.md
└── tasks.md          # /speckit.tasks
```

### Source Code (repository root)

```text
package.json                         # +shiki (devDependencies)
scripts/
├── build-blog.js                    # MODIFY: paso Shiki entre marked.parse() y sanitizeHtml(); --check ampliado
├── build-syntax-css.js              # NEW: genera/regenera assets/css/syntax.css
└── lib/
    └── shiki-highlight.js           # NEW: utilidad pura (HTML → HTML con tokens)

assets/css/
└── syntax.css                       # NEW (commiteado): ≤ 5 KB gzip

content/blog/
└── _fixtures/                       # NEW: post multi-lang para tests
    └── syntax-highlighting-demo.md

tests/
├── syntax-css-size.sh               # NEW
├── no-inline-styles-blog.sh         # NEW
└── build-blog-check.sh              # NEW
```

**Structure Decision**: single-project estático. La integración vive
en `scripts/` (build-time). El runtime del sitio gana **un solo CSS
condicional** (`assets/css/syntax.css`). DOMPurify whitelist actual ya
contiene `span`, `pre`, `code`, `class` — solo verificamos que las
clases que Shiki emite atraviesen el filtro; no se afloja whitelist.

## Complexity Tracking

No aplica. Cero violaciones; cero justificaciones pendientes.
