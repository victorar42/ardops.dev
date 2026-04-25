# Implementation Plan: Landing Page Redesign (v1)

**Branch**: `001-landing-redesign` | **Date**: 2026-04-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-landing-redesign/spec.md`

## Summary

Rediseñar la landing de `ardops.dev` como sitio estático puro (HTML5 + CSS3 con custom properties + JS vanilla mínimo), reproduciendo 1:1 la identidad visual de [`legacy/index.html`](../../legacy/index.html) (idéntica a `.reference/v1-design/index.html`), reorganizando el contenido en las 7 secciones definidas por el spec. La arquitectura se modulariza en hojas de estilo por capa (`tokens → base → motion → layout → components → home`) para habilitar futuras páginas (`blog/`, `talks/`) sin refactor. Fonts JetBrains Mono y Outfit se sirven self-hosted (`woff2`, subset latin) desde `assets/fonts/`. CSP estricta vía `<meta http-equiv>` (limitación de GitHub Pages). Lighthouse CI en GitHub Actions enforza los gates de performance/a11y/SEO/best-practices de la constitución antes de mergear.

## Technical Context

**Language/Version**: HTML5 living standard, CSS3 (custom properties, grid, flexbox), JavaScript ES2022 vanilla.
**Primary Dependencies**: Ninguna en runtime. CI usa `@lhci/cli`, `pa11y-ci`, `lychee`, `html-validate` (todas dev-only, no enviadas al cliente).
**Storage**: N/A — sitio estático.
**Testing**: Lighthouse CI (perf/a11y/SEO/BP), Pa11y (axe-core), Lychee (links), html-validate (HTML), comparación visual manual contra `legacy/index.html`.
**Target Platform**: Navegadores evergreen (Chromium, Firefox, Safari, Edge últimas 2 versiones); móviles iOS Safari 16+ y Android Chrome últimas 2.
**Project Type**: Sitio estático multipágina-ready (single repo, sin build).
**Performance Goals**: Lighthouse Performance ≥95 mobile/desktop; LCP <2.5s, CLS <0.1, INP <200ms (constitución VII).
**Constraints**: Lighthouse Accessibility =100, BP ≥95, SEO ≥95; cero deps JS de terceros (constitución IV); cero requests externos en runtime (constitución V); CSP estricta sin `unsafe-eval` y sin `unsafe-inline` (constitución VIII); GitHub Pages no permite headers HTTP custom → CSP via meta y se documenta el fallback.
**Scale/Scope**: 1 página real (home) + 2 placeholders (`blog/`, `talks/`) + `404.html`. ~6 hojas CSS (~15-25 KB sin gzip), 1 JS (~2 KB), 5 archivos `woff2` (~80-150 KB total).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principio (constitución) | Estado | Evidencia |
|---|---|---|---|
| I  | Spec-Driven obligatorio | ✅ | `spec.md` aprobada antes de este plan; `/tasks` después. |
| II | Identidad visual preservada | ✅ | Tokens/animaciones derivadas literalmente de `legacy/index.html`; documentadas en `data-model.md` (DesignTokens). |
| III | Sitio 100% estático | ✅ | Sin backend, sin SSG. HTML+CSS+JS planos servidos por GitHub Pages. |
| IV | Cero deps JS de terceros | ✅ | `assets/js/main.js` vanilla (year + skip-link). LHCI/pa11y/lychee son dev-only. |
| V | Fonts y assets self-hosted | ✅ | woff2 en `assets/fonts/`, OG en `public/og/`, favicons en `public/favicon/`. Cero CDNs externos. |
| VI | Accesibilidad WCAG 2.1 AA + Lighthouse a11y=100 | ✅ | Skip-link, landmarks, `prefers-reduced-motion`, contraste auditado, navegación por teclado completa. Pa11y + LHCI gating. |
| VII | Performance es feature | ✅ | LHCI con budgets (Perf ≥95, LCP <2.5s, CLS <0.1, TBT <200ms); fonts preload + `font-display: swap`. |
| VIII | Seguridad por defecto | ⚠️ Justificado | CSP estricta vía `<meta http-equiv>`; HSTS/Referrer-Policy/COOP/Permissions-Policy NO se pueden setear en GitHub Pages porque no permite headers custom. Riesgo aceptado para v1; documentado en `docs/05-security-spec.md` y en Complexity Tracking. Fallback: migrar a Cloudflare Pages cuando se justifique. |
| IX | Cada PR pasa todas las gates | ✅ | Workflows `ci.yml` (html-validate + pa11y + lychee), `lighthouse.yml` (LHCI), `pages-deploy.yml` (gated por los anteriores). |
| X | Documentación versionada | ✅ | `specs/`, `docs/`, `.specify/` todo committeado en branch `001-landing-redesign`. |

**Resultado**: PASS con una desviación documentada (principio VIII parcial por limitación de hosting). Ver Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-landing-redesign/
├── plan.md              # Este archivo
├── spec.md              # Spec aprobada
├── research.md          # Phase 0: decisiones técnicas (fonts, CSP, LHCI thresholds, deploy)
├── data-model.md        # Phase 1: entidades (Profile, Talk, PipelineStage, Stat, ContactChannel, DesignTokens)
├── quickstart.md        # Phase 1: cómo correr local + verificar gates
├── contracts/           # Phase 1: csp-policy, lighthouse-budgets, a11y-checklist, seo-meta, json-ld
└── checklists/
    └── requirements.md  # Generado por /speckit.specify
```

### Source Code (repository root)

```text
ardops.dev/
├── index.html                       # Home (la landing)
├── 404.html                         # Fallback con misma identidad visual
├── robots.txt
├── sitemap.xml
├── CNAME                            # ardops.dev
├── README.md
├── .gitignore
├── assets/
│   ├── css/
│   │   ├── tokens.css               # :root variables (paleta, tipografía, espaciado)
│   │   ├── base.css                 # reset, body, @font-face, focus styles, skip-link
│   │   ├── motion.css               # @keyframes + prefers-reduced-motion
│   │   ├── layout.css               # nav, footer, grain overlay
│   │   ├── components.css           # btn, card, badge, resource-link, stat-card, pipeline-step, contact-link
│   │   └── home.css                 # hero, talk, pipeline, about, blog-coming, contact + breakpoints
│   ├── js/
│   │   └── main.js                  # year en footer + skip-link helpers (defer)
│   ├── fonts/
│   │   ├── jetbrains-mono-400.woff2
│   │   ├── jetbrains-mono-700.woff2
│   │   ├── outfit-400.woff2
│   │   ├── outfit-600.woff2
│   │   ├── outfit-700.woff2
│   │   └── LICENSE.md               # OFL para ambas familias
│   ├── img/                         # imágenes futuras
│   └── icons/                       # SVGs reusables (futuro)
├── public/
│   ├── og/og-default.png            # 1200×630
│   └── favicon/                     # favicon.ico, .png 16/32/180, site.webmanifest
├── blog/
│   └── index.html                   # placeholder "Próximamente" reusando estilos
├── talks/
│   └── index.html                   # placeholder "Próximamente" reusando estilos
├── tests/
│   ├── lighthouserc.json            # config LHCI con assertions
│   ├── pa11y.config.js              # rutas y reglas WCAG2AA
│   └── links.config.json            # config lychee
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                   # html-validate + pa11y + lychee
│   │   ├── lighthouse.yml           # LHCI sobre PR
│   │   └── pages-deploy.yml         # actions/deploy-pages, gated
│   ├── ISSUE_TEMPLATE/
│   └── copilot-instructions.md
├── docs/                            # 01..09 specs (ya existen, se actualizan)
├── legacy/
│   └── index.html                   # referencia v0, read-only
└── specs/
    └── 001-landing-redesign/
```

**Structure Decision**: Adoptamos un layout estático multi-página plano. La home (`index.html`) y las páginas hermanas (`blog/index.html`, `talks/index.html`, `404.html`) consumen las **mismas** hojas en `assets/css/` y el mismo `assets/js/main.js`. No hay `src/` ni build pipeline — los archivos publicados son exactamente los del repo, lo que mantiene a GitHub Pages "Deploy from branch" como fallback simple aunque elegimos `actions/deploy-pages` para gating. Esta decisión satisface el FR-014 (multi-página sin refactor) sin introducir un SSG (excluido del v1 por scope).

## Complexity Tracking

> Una desviación al principio constitucional VIII (Seguridad por defecto) requiere justificación.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Headers HTTP de seguridad incompletos (HSTS, Referrer-Policy, COOP/COEP, Permissions-Policy) | GitHub Pages no permite enviar headers HTTP arbitrarios; solo soporta los que ellos definen. La parte controlable de la política se aplica vía `<meta http-equiv="Content-Security-Policy">`. | Migrar el hosting (Cloudflare Pages, Netlify) introduciría complejidad operativa, dependencia de un nuevo proveedor y un nuevo proceso de deploy fuera del scope de v1. Se acepta el riesgo limitado (CSP via meta sí mitiga XSS; el resto se considera "defense in depth" no crítico para un sitio estático sin formularios ni cookies) y se planifica revisión en una spec posterior cuando el contenido o las features lo justifiquen. |
