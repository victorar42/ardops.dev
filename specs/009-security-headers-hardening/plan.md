# Implementation Plan: Security headers hardening (subset realmente aplicable)

**Branch**: `009-security-headers-hardening` · **Date**: 2026-05-11
**Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-security-headers-hardening/spec.md`

---

## Summary

Subset hardening de seguridad **realmente aplicable** a un sitio
estático servido por GitHub Pages:

1. **Eliminar `'unsafe-inline'`** del CSP del blog: extraer el bloque
   `<style id="blog-tag-rules">` (generado por `renderTagCssRules()`)
   a un archivo CSS externo `assets/css/blog-tag-rules.css` durante
   el build. La CSP del blog vuelve a ser byte-equivalente a la del
   resto del sitio (`style-src 'self'`).
2. **Referrer policy** consolidada: agregar
   `<meta name="referrer" content="strict-origin-when-cross-origin">`
   a TODAS las páginas servidas via un único punto de emisión
   (`scripts/lib/head.js`, hermano de `scripts/lib/layout.js` de spec 008).
3. **Tres gates Node + jsdom** nuevos, bloqueantes en CI:
   - `tests/csp-no-unsafe-inline.sh` — prohíbe `'unsafe-inline'` /
     `'unsafe-eval'` y exige directivas mínimas.
   - `tests/external-links.sh` — todo `<a target="_blank">` externo
     debe tener `rel` con `noopener` y `noreferrer`.
   - `tests/sitemap-drift.sh` — bidireccional sitemap ↔ canonicals.
4. **Documentación**: actualizar `docs/05-security-spec.md` y
   constitución (principio IV) con el invariante "cero externals en
   runtime, excepciones requieren spec con SRI".

**Approach**:
- **Mecanismo A** (CSS externo) elegido sobre Mecanismo B (hash CSP) —
  decisión justificada en research.md.
- **Node + jsdom** para los gates — consistencia con
  `scripts/check-nav-consistency.js` de spec 008. Cero deps nuevas
  (jsdom ya devDep desde spec 006).
- **Punto único de emisión del referrer meta** vía `scripts/lib/head.js`,
  que también centraliza otros metas comunes (charset, viewport, CSP,
  theme-color, color-scheme). Reduce drift permanente.

## Technical Context

**Language/Version**: Node.js 20 (build-time), HTML5 + CSS3 (runtime).
**Primary Dependencies**:
- Build-time: ya disponibles — `gray-matter`, `marked`, `dompurify`,
  `jsdom` (devDeps existentes). **Cero deps nuevas.**
- Runtime: ninguna (sitio estático).
**Storage**: N/A.
**Testing**:
- `node scripts/build-blog.js --check` (debe seguir pasando, ahora
  emite también `assets/css/blog-tag-rules.css`).
- `bash tests/csp-no-unsafe-inline.sh` (nuevo).
- `bash tests/external-links.sh` (nuevo).
- `bash tests/sitemap-drift.sh` (nuevo).
- `bash tests/nav-consistency.sh` (existente, debe seguir pasando).
- `npm run html-validate`, `node tests/a11y.js` (sin cambios, deben
  pasar).
**Target Platform**: navegadores modernos. Sin JS adicional para
runtime.
**Project Type**: sitio estático personal — **single project**.
**Performance Goals**:
- Lighthouse Performance ≥ 95 mantenido.
- El nuevo CSS externo `blog-tag-rules.css` (~2-3 KB sin gzip) se
  agrega a la cascada del blog. Net: -1 bloque inline en HTML
  (~equivalente bytes), +1 request HTTP cacheable. HTTP/2
  multiplexing en GH Pages → impacto despreciable. Sub-budget de
  total-byte-weight (512KB).
**Constraints**:
- Constitución III: cero deps runtime nuevas. ✅
- Constitución IV: CSP estricta — esta spec **fortalece** el principio.
- Constitución VII: budget perf no se degrada.
- Constitución XI: GH Pages-only; sin headers HTTP custom (out of
  scope técnico permanente, documentado).
**Scale/Scope**:
- Páginas afectadas para CSP fix: `blog/index.html`,
  `blog/<slug>.html` (×N).
- Páginas afectadas para referrer meta: TODAS las servidas (7+).
- 3 gates nuevos en CI.
- 1 archivo CSS nuevo emitido.
- 1 módulo nuevo `scripts/lib/head.js`.

## Constitution Check

*GATE: Must pass before Phase 0. Re-check after Phase 1.*

| Principio | Aplica | Cumplimiento | Comentario |
|---|---|---|---|
| **I. Spec-Driven** | Sí | ✓ | Spec/plan/tasks/implement 009 ordenada. |
| **II. Identidad visual** | Sí | ✓ | Cero cambios visuales. CSS externalizado emite reglas idénticas. |
| **III. Sitio 100% estático** | Sí | ✓ | Todo build-time. Sin runtime nuevo. |
| **IV. Cero deps JS de terceros** | Sí | ✓ | Cero deps nuevas (ni runtime ni dev). Esta spec **refuerza** la invariante con FR-017. |
| **V. Fonts/assets self-hosted** | Sí | ✓ | El nuevo CSS es self-hosted. |
| **VI. Accesibilidad WCAG 2.1 AA** | Sí | ✓ | Cero cambios al DOM accesible. axe-core debe pasar. |
| **VII. Performance es feature** | Sí | ✓ | Net delta ~0 bytes; HTTP/2 absorbe el extra request. Lighthouse no degrada. |
| **VIII. Seguridad por defecto** | Sí | ✓ | Esta spec **es** el principio. Refuerza CSP, referrer, anti-tabnabbing. |
| **IX. Cada PR pasa todas las gates** | Sí | ✓ | 3 gates nuevos bloqueantes; existentes intactos. |
| **X. Documentación versionada** | Sí | ✓ | `docs/05-security-spec.md` actualizado; constitución IV anotada. |
| **XI. Hosting/dominio fijos** | Sí | ✓ | Sin cambios. La spec documenta explícitamente las limitaciones de GH Pages como out-of-scope permanente. |

**Resultado**: ✅ **PASS**. Cero violaciones, cero deuda técnica
introducida. Esta spec es **net-positive** sobre los principios IV y
VIII.

## Project Structure

### Documentation (this feature)

```text
specs/009-security-headers-hardening/
├── spec.md                  # Feature specification (exists)
├── plan.md                  # This file
├── research.md              # Phase 0 — decisiones técnicas
├── data-model.md            # Phase 1 — entidades del sistema (CSP, sitemap, link)
├── quickstart.md            # Phase 1 — runbook
├── contracts/
│   ├── csp-contract.md             # CSP canónica del sitio (post-cambio)
│   ├── head-module.md              # API de scripts/lib/head.js
│   ├── csp-gate.md                 # Comportamiento de tests/csp-no-unsafe-inline.sh
│   ├── external-links-gate.md      # Comportamiento de tests/external-links.sh
│   └── sitemap-drift-gate.md       # Comportamiento de tests/sitemap-drift.sh
├── checklists/
│   └── requirements.md      # Quality checklist (exists, PASS)
└── tasks.md                 # Phase 2 (creado por /speckit.tasks)
```

### Source Code (repository root)

```text
ardops.dev/
├── assets/
│   └── css/
│       └── blog-tag-rules.css            # NUEVO: emitido por build-blog.js
├── blog/
│   ├── index.html                        # MODIFICA: CSP sin 'unsafe-inline', <link> al CSS nuevo, <meta name="referrer">
│   └── <slug>.html                       # MODIFICA: CSP sin 'unsafe-inline', <meta name="referrer">
├── index.html                            # MODIFICA: <meta name="referrer">
├── 404.html                              # MODIFICA: <meta name="referrer">
├── talks/index.html                      # MODIFICA: <meta name="referrer">
├── interviews/index.html                 # MODIFICA: <meta name="referrer">
├── interviews/<slug>.html                # MODIFICA: <meta name="referrer">
├── scripts/
│   ├── lib/
│   │   ├── layout.js                     # SIN CAMBIOS (spec 008)
│   │   └── head.js                       # NUEVO: emite head common (CSP, referrer, theme-color, ...)
│   ├── build-blog.js                     # MODIFICA: emite assets/css/blog-tag-rules.css; CSP sin 'unsafe-inline'; usa head.js
│   ├── build-interviews.js               # MODIFICA: usa head.js para emitir referrer meta
│   ├── build-layout.js                   # MODIFICA: orquesta también el meta referrer en pages estáticas (vía marker o reescritura puntual)
│   └── check-nav-consistency.js          # SIN CAMBIOS
├── tests/
│   ├── csp-no-unsafe-inline.sh           # NUEVO + scripts/check-csp.js
│   ├── external-links.sh                 # NUEVO + scripts/check-external-links.js
│   └── sitemap-drift.sh                  # NUEVO + scripts/check-sitemap-drift.js
├── sitemap.xml                           # MODIFICA: agregar /interviews/victor-ardon.html (drift detectado)
├── docs/
│   └── 05-security-spec.md               # MODIFICA: documentar GH Pages limits + CSP canónica
├── .specify/memory/
│   └── constitution.md                   # MODIFICA: nota a IV (cero externals en runtime)
└── .github/workflows/
    └── ci.yml                            # MODIFICA: 3 jobs nuevos
```

**Structure Decision**: **Single project**. Continúa la convención de
spec 008 (módulos compartidos en `scripts/lib/`). El nuevo
`scripts/lib/head.js` es hermano de `layout.js` y aporta una API
mínima para emitir meta tags comunes que hoy están duplicados.

## Complexity Tracking

> Sin violaciones. Tabla vacía.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 — Research

Ver [research.md](research.md). Decisiones tomadas:

- **D-001** Mecanismo CSP fix: **A — CSS externo** (no hash).
- **D-002** Implementación de gates: **Node + jsdom** (consistente
  con check-nav-consistency.js).
- **D-003** Punto único de emisión del meta referrer:
  `scripts/lib/head.js` (nuevo módulo hermano de layout.js).
- **D-004** Sitemap: **mantenido a mano** (no auto-generado en esta
  spec). Se agrega entrada faltante (`interviews/victor-ardon.html`)
  como parte del fix.
- **D-005** Lista de exclusiones del sitemap: hardcoded en
  `scripts/check-sitemap-drift.js` (404, fixtures de blog/interviews).
- **D-006** CSP también limpiada en `blog/<slug>.html` (los posts
  individuales **no** tienen `<style>` inline, solo el listing — pero
  comparten la constante `CSP` en `build-blog.js`).
- **D-007** El nuevo CSS `assets/css/blog-tag-rules.css` se emite a un
  path estable (sin hash en el nombre); el cache-busting se gestiona
  vía la `:root` cascade del sitio (la regla cambia poco).
- **D-008** Linkeo: `<link rel="stylesheet" href="/assets/css/blog-tag-rules.css">`
  al final de la cascada CSS del blog (después de components.css).
- **D-009** Aplicación del meta referrer en páginas estáticas
  (`index.html`, `404.html`, `talks/index.html`): vía marker
  `<!-- head-meta:start --> ... <!-- head-meta:end -->` en una
  ubicación específica del `<head>` (consistente con el patrón de
  spec 008), procesado por `build-layout.js`.
- **D-010** Nivel de validación de gates: el gate de CSP además
  exige directivas mínimas (FR-013) — es activo, no solo prohibitivo.

## Phase 1 — Design & Contracts

### Data model

Ver [data-model.md](data-model.md). Entidades:

- `CSP` (string + tokens parseados).
- `ExternalLink` (`{ file, line, href, rel, target }`).
- `SitemapEntry` (`{ loc, lastmod }`).
- `CanonicalRef` (`{ file, canonicalUrl }`).
- `HeadMeta` (atributos comunes: charset, viewport, csp, referrer,
  theme-color, color-scheme).

### Contracts

- [contracts/csp-contract.md](contracts/csp-contract.md) — CSP
  canónica del sitio post-cambio.
- [contracts/head-module.md](contracts/head-module.md) — API de
  `scripts/lib/head.js`.
- [contracts/csp-gate.md](contracts/csp-gate.md) — gate
  `csp-no-unsafe-inline.sh`.
- [contracts/external-links-gate.md](contracts/external-links-gate.md) —
  gate `external-links.sh`.
- [contracts/sitemap-drift-gate.md](contracts/sitemap-drift-gate.md) —
  gate `sitemap-drift.sh`.

### Quickstart

Ver [quickstart.md](quickstart.md). Runbook completo: setup,
workflows (agregar link externo, agregar página, regenerar sitemap),
validation, troubleshooting.

### Agent context update

El plan activo en
[.github/copilot-instructions.md](../../.github/copilot-instructions.md)
ya apunta a `specs/009-security-headers-hardening/spec.md` (de
`/speckit.specify`). Se actualiza ahora a este plan.

## Re-evaluación post-diseño (Constitution Check #2)

Después de Phase 1 (data-model, contracts, quickstart):

| Principio | Estado |
|---|---|
| Todos los principios I-XI | ✅ Sin cambio. |
| Nuevas dependencias en Phase 1 | ✅ Ninguna. |
| Cambios visuales emergentes | ✅ Cero. |
| Net-positive sobre IV (Cero externals) | ✅ FR-017 lo formaliza. |
| Net-positive sobre VIII (Seguridad) | ✅ Es el corazón de la spec. |

**Resultado**: ✅ **PASS**. Listo para Phase 2 (`/speckit.tasks`).

## Stop and Report

- **Branch activa**: `009-security-headers-hardening`.
- **IMPL_PLAN**: [`specs/009-security-headers-hardening/plan.md`](plan.md).
- **Artifacts generados**:
  - [research.md](research.md)
  - [data-model.md](data-model.md)
  - [quickstart.md](quickstart.md)
  - [contracts/csp-contract.md](contracts/csp-contract.md)
  - [contracts/head-module.md](contracts/head-module.md)
  - [contracts/csp-gate.md](contracts/csp-gate.md)
  - [contracts/external-links-gate.md](contracts/external-links-gate.md)
  - [contracts/sitemap-drift-gate.md](contracts/sitemap-drift-gate.md)
- **Constitution Check**: PASS (inicial y post-diseño).
- **Próximo paso**: `/speckit.tasks`.
