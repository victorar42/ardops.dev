---
description: "Tasks for 001-landing-redesign"
---

# Tasks: Landing Page Redesign (v1)

**Input**: Design documents from `/specs/001-landing-redesign/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: La spec NO solicita tests unitarios (TDD). Sí exige **gates** automatizados (Lighthouse CI, Pa11y, html-validate, lychee). Esos gates se modelan en la fase de Polish y como checkpoints por user story, no como tests TDD.

**Organization**: Tasks agrupadas por user story (US1..US5) según `spec.md`.

## Format

`[ID] [P?] [Story?] Description con file path`

- **[P]**: Paralelizable (distinto archivo, sin dependencias pendientes).
- **[USx]**: Mapea a User Story de `spec.md`. Setup/Foundational/Polish no llevan etiqueta.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffolding del repo: estructura de carpetas, dev dependencies, fonts y assets estáticos. Sin esto no se puede empezar.

- [X] T001 Crear estructura de carpetas vacías: `assets/css/`, `assets/js/`, `assets/fonts/`, `assets/img/`, `assets/icons/`, `public/og/`, `public/favicon/`, `blog/`, `talks/` (con `.gitkeep` donde aún no haya contenido).
- [X] T002 [P] Crear `package.json` en raíz con devDependencies pinneadas: `@lhci/cli@^0.14`, `pa11y-ci@^3`, `html-validate@^9`. Definir scripts `lhci`, `pa11y`, `html-validate`. NO publicar `node_modules` al sitio (incluir en `.gitignore`).
- [X] T003 [P] Descargar y commitear los 5 archivos `woff2` self-hosted en `assets/fonts/`: `jetbrains-mono-400.woff2`, `jetbrains-mono-700.woff2`, `outfit-400.woff2`, `outfit-600.woff2`, `outfit-700.woff2`. Ver fuentes en [research.md R-01](./research.md). Subset `latin` únicamente.
- [X] T004 [P] Crear `assets/fonts/LICENSE.md` consolidando OFL de JetBrains Mono y Outfit con atribución de cada repositorio fuente.
- [X] T005 [P] Generar set de favicons en `public/favicon/`: `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png` (180×180), `site.webmanifest` con `name="ardops.dev"`, `theme_color="#0a0e17"`, `background_color="#0a0e17"`.
- [X] T006 [P] Generar imagen OG placeholder en `public/og/og-default.png` (1200×630, fondo `--bg-primary #0a0e17`, texto "ardops.dev — DevOps Engineer · Security as Code"). Ver [research.md R-07](./research.md).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Sistema de diseño, JS mínimo y `<head>` reutilizable. Bloqueante para TODAS las user stories porque cada sección consume tokens, base, layout y componentes compartidos.

**⚠️ CRITICAL**: Ninguna user story puede comenzar hasta que esta fase esté completa.

- [X] T007 [P] Crear `assets/css/tokens.css` con `:root` exacto de [data-model.md §DesignTokens](./data-model.md): paleta (`--bg-primary` … `--border`), tipografía (`--font-mono`, `--font-body`), layout (`--max-content`, `--max-hero`, radii), motion (`--ease-out`, `--dur-*`). Espejo literal de `legacy/index.html` líneas `:root`.
- [X] T008 [P] Crear `assets/css/base.css` con: reset (`*{margin:0;padding:0;box-sizing:border-box}`), `html{scroll-behavior:smooth}`, body con `var(--font-body)` + `var(--bg-primary)` + `var(--text-primary)`, declaraciones `@font-face` para los 5 woff2 con `font-display: swap` y `unicode-range` latin, estilos de `.skip-link` (oculto fuera de foco, visible on focus, primer elemento focusable), estilos de `:focus-visible` con outline accesible (≥3:1 contraste).
- [X] T009 [P] Crear `assets/css/motion.css` con keyframes `fade-up`, `pulse-glow`, `blink` extraídos de `legacy/index.html`, y bloque `@media (prefers-reduced-motion: reduce)` que desactive estas animaciones y los `transition` decorativos. Ver [contracts/a11y-checklist.md §E1](./contracts/a11y-checklist.md).
- [X] T010 [P] Crear `assets/css/layout.css` con: nav fija (`position:fixed`, blur, border-bottom), `.nav-logo`, `.nav-links`, footer (`<footer>` styles, `.footer-mono`), grain overlay (`body::before` con SVG noise inline data-uri). Markup según `legacy/index.html`.
- [X] T011 [P] Crear `assets/css/components.css` con clases reusables: `.btn`, `.btn-primary`, `.btn-ghost`, `.section-label`, `.section-title`, `.talk-card`, `.talk-badge`, `.talk-title`, `.talk-event`, `.talk-desc`, `.talk-resources`, `.resource-link`, `.resource-icon`, `.pipeline-step`, `.step-number`, `.step-name`, `.step-tool`, `.step-desc`, `.stat-card`, `.stat-value`, `.stat-label`, `.contact-link`, `.terminal-cursor`, `.blog-coming`. Espejo literal de `legacy/index.html`.
- [X] T012 [P] Crear `assets/js/main.js` (ES2022 vanilla, sin imports): rellena `[data-year]` con año actual al `DOMContentLoaded`, gestiona foco del skip-link (`document.querySelector('.skip-link')` → en click mueve foco a `#main`). Cargado con `defer`. Sin acceso a APIs externas, sin `eval`. Total ≤ 2 KB.
- [X] T013 Crear `index.html` esqueleto (sin contenido de secciones aún) con: `<!doctype html>`, `<html lang="es">`, `<head>` completo según [contracts/seo-meta.md](./contracts/seo-meta.md) (charset, viewport, CSP `<meta http-equiv>` según [contracts/csp-policy.md](./contracts/csp-policy.md), title, description, canonical `https://ardops.dev/`, theme-color `#0a0e17`, OG completo, Twitter Card, favicons, preload de `outfit-400.woff2` + `jetbrains-mono-400.woff2`, links a las 6 hojas CSS en orden `tokens→base→motion→layout→components→home`, `<script defer src="/assets/js/main.js">`, JSON-LD según [contracts/json-ld.md](./contracts/json-ld.md) con `victorar42`, fecha `2026-05-18` y repo `victorar42/techno-week`), `<body>` con `<a class="skip-link" href="#main">Saltar al contenido</a>`, `<header><nav>` con `.nav-logo` y `.nav-links` (anchors a `#talk`, `#pipeline`, `#about`, `#blog`, `#contact`), `<main id="main">` vacío, `<footer>` con `<span data-year></span>`. Validar con `npx html-validate index.html` antes de cerrar la task. Depende de T007–T012.
- [X] T014 Crear `assets/css/home.css` vacío con sólo el bloque de breakpoints media `@media (max-width:768px)` y `@media (max-width:480px)` declarados como skeletons. Cada user story le agregará reglas específicas. Esto evita conflictos de merge entre stories y mantiene un único archivo de estilos por página. Depende de T007.

**Checkpoint**: Foundation lista — la home se sirve con head válido, nav visible, footer con año, sin sección de contenido. Listo para empezar user stories en paralelo.

---

## Phase 3: User Story 1 — Visitante técnico evalúa al profesional + ubica la charla (Priority: P1) 🎯 MVP

**Goal**: Hero + tarjeta de la charla visibles dentro de los primeros viewport(s); el visitante identifica nombre/rol/charla en <10 s y un click en el CTA "Techno Week 8.0" hace scroll a la sección de la charla con badge, título, evento y descripción.

**Independent Test**: Cargar `/` en desktop ≥1366×768 → hero completo (nombre, rol, descripción, 2 CTAs) sin scroll. Click en CTA "Techno Week 8.0" → scroll suave hasta `#talk` mostrando badge `18 MAYO 2026`, título de la charla, "Techno Week 8.0 — Banco de Costa Rica" y descripción. Repetir en mobile ≤480px sin overflow horizontal.

### Implementation for User Story 1

- [X] T015 [P] [US1] Agregar reglas `.hero`, `.hero-grid-bg`, `.hero-glow`, `.hero-content`, `.hero-tag`, `.hero-name` (con `.accent`), `.hero-role`, `.hero-desc`, `.hero-ctas` en `assets/css/home.css`. Animaciones `fade-up` con stagger (0.2s, 0.4s, 0.6s, 0.8s, 1s) reutilizando `motion.css`. Espejo literal de `legacy/index.html`.
- [X] T016 [P] [US1] Agregar reglas de la sección Talk en `assets/css/home.css`: estilos puente entre `<section id="talk">` y los componentes ya definidos en `components.css` (separadores, márgenes, ::before barra superior del talk-card si no quedó en components). Mobile: `.talk-card { padding: 1.5rem }` en breakpoint 768.
- [X] T017 [US1] Agregar la sección Hero en `<main>` de `index.html`: `<section class="hero">` con `<div class="hero-grid-bg" aria-hidden="true"></div>`, `<div class="hero-glow" aria-hidden="true"></div>`, `<div class="hero-content">`, `<p class="hero-tag">security_as_code.init()</p>`, `<h1 class="hero-name">Victor Josue Ardón Rojas<span class="accent">.</span></h1>`, `<p class="hero-role">DevOps Engineer <span class="hero-sep" aria-hidden="true">—</span> Security as Code</p>`, `<p class="hero-desc">…</p>` (texto largo de bio idéntico al de `legacy/index.html`), `<div class="hero-ctas">` con dos `<a class="btn btn-primary" href="#talk">Techno Week 8.0</a>` y `<a class="btn btn-ghost" href="https://github.com/victorar42/techno-week" target="_blank" rel="noopener noreferrer">…</a>` (SVG GitHub `aria-hidden="true"` + texto "Ver Repositorio"). Único `<h1>` del documento. Depende de T013, T015.
- [X] T018 [US1] Agregar la sección Talk core en `<main>` de `index.html`: `<section id="talk">` con `<p class="section-label">// featured</p>`, `<h2 class="section-title">Techno Week 8.0</h2>`, y `<article class="talk-card">` con `<p class="talk-badge"><span aria-hidden="true">★</span> 18 MAYO 2026</p>`, `<h3 class="talk-title">Seguridad como Código: DevSecOps Spec-Driven sobre GitHub para Banca</h3>`, `<p class="talk-event">Techno Week 8.0 — Banco de Costa Rica</p>`, `<p class="talk-desc">…</p>` (texto idéntico a la referencia). Los recursos se agregan en US2. Depende de T013, T016.

**Checkpoint US1**: Cargar `/`. Hero visible al primer viewport con animación de entrada. Nav lleva a `#talk`, scroll suave a la talk card con badge/título/evento/descripción. Comparar lado a lado contra `legacy/index.html` — debe ser visualmente idéntico en estas dos secciones. `npx pa11y-ci` y comparación visual deben pasar.

---

## Phase 4: User Story 2 — Asistente a la charla quiere los recursos (Priority: P1)

**Goal**: La sección Talk expone los 4 recursos (Repositorio, Pipeline, Slides, Guía) con estado correcto: publicados son `<a>` con `target="_blank"` + `rel="noopener noreferrer"`, los pendientes son `<span aria-disabled="true">…(Próximamente)</span>` no focusables.

**Independent Test**: Navegar a `/#talk`. Tabular con teclado: solo los recursos publicados reciben foco; los "Próximamente" se anuncian como texto pero no son interactivos. Click en Repositorio abre `https://github.com/victorar42/techno-week` en pestaña nueva. Click en Pipeline hace scroll a `#pipeline`.

### Implementation for User Story 2

- [X] T019 [US2] Agregar `<div class="talk-resources">` dentro de `<article class="talk-card">` en `index.html` (después de `.talk-desc`) con cuatro hijos:
  1. `<a class="resource-link" href="https://github.com/victorar42/techno-week" target="_blank" rel="noopener noreferrer" aria-label="Repositorio de la charla en GitHub (abre en nueva pestaña)">` + SVG GitHub icon `aria-hidden="true"` + texto "Repositorio".
  2. `<a class="resource-link" href="#pipeline">` + SVG escudo `aria-hidden="true"` + texto "Pipeline".
  3. `<span class="resource-link is-coming" aria-disabled="true">` + SVG slides `aria-hidden="true"` + texto "Slides (próximamente)".
  4. `<span class="resource-link is-coming" aria-disabled="true">` + SVG documento `aria-hidden="true"` + texto "Guía (próximamente)".
   Iconos copiados literal de `legacy/index.html`. Depende de T018.
- [X] T020 [US2] Agregar reglas `.resource-link.is-coming` en `assets/css/components.css`: cursor `not-allowed`, opacidad ≤0.55, sin hover transform, color = `var(--text-muted)`. NO debe verse como interactivo. Mantener ARIA disabled visible vía estilo distintivo (no solo opacidad — agregar `text-decoration: line-through` opcional o sufijo "(próximamente)" obligatorio en texto, ya cubierto por T019).

**Checkpoint US2**: Pa11y limpio. Tab navigation: Repositorio y Pipeline reciben foco; Slides y Guía NO. Lighthouse a11y = 100 sobre `index.html`.

---

## Phase 5: User Story 4 — Pipeline DevSecOps (Priority: P2)

**Goal**: Las 7 etapas del pipeline visibles en grid responsive, en orden, con número/nombre/herramienta/descripción correctos según [data-model.md §PipelineStage](./data-model.md).

**Independent Test**: Navegar a `/#pipeline`. Confirmar 7 tarjetas en orden Spec Lint → SAST → Secret Detection → Dependency Scan → DAST → Compliance → Semantic Analysis. Verificar grid en desktop y stack en mobile ≤768px sin overflow.

### Implementation for User Story 4

- [X] T021 [P] [US4] Agregar reglas `.pipeline` (grid auto-fit minmax 280px) y reglas hover de `.pipeline-step` (ya en `components.css`) más breakpoint mobile `.pipeline { grid-template-columns: 1fr; }` en `assets/css/home.css`.
- [X] T022 [US4] Agregar `<section id="pipeline">` en `<main>` de `index.html` (después de `#talk`): `<p class="section-label">// spec-driven</p>`, `<h2 class="section-title">El Pipeline de Seguridad</h2>`, `<p class="pipeline-intro">OpenAPI Spec → GitHub Actions → 7 etapas automáticas → Seguro o Bloqueado</p>`, `<div class="pipeline">` con 7 `<article class="pipeline-step">` cuyo contenido sigue el orden de [data-model.md §PipelineStage](./data-model.md). Cada uno con `.step-number` (ej. "ETAPA 01"), `.step-name`, `.step-tool`, `.step-desc`. Depende de T013, T021.
- [X] T023 [P] [US4] Agregar regla `.pipeline-intro { color: var(--text-secondary); margin-bottom: 1rem; }` en `assets/css/home.css` para reemplazar el `style="color:var(--text-secondary)"` inline de la referencia (FR-013 prohíbe inline styles).

**Checkpoint US4**: Las 7 tarjetas visibles. Lighthouse limpio. `rg 'style="' index.html` → 0 matches.

---

## Phase 6: User Story 3 — Reclutador valida credibilidad (About + Contact) (Priority: P2)

**Goal**: Sección "Sobre mí" con bio enfocada + 4 stat cards exactos, y sección Contacto con GitHub, LinkedIn (`victorar42`), email (`josuevjar@gmail.com`).

**Independent Test**: Ir a `#about` → ver bio + 4 stats (`7 / Etapas del Pipeline`, `0 / Costo de licencias`, `100% / Cobertura de la spec`, `<5m / Tiempo del pipeline`). Ir a `#contact` → click en email abre cliente con `mailto:josuevjar@gmail.com`. Tabular: cada enlace anuncia destino sin depender solo del icono.

### Implementation for User Story 3

- [X] T024 [P] [US3] Agregar reglas `.about-grid` (2 columnas, stack en ≤768px), `.about-text`, `.about-stats` (grid 2×2), `.about-stack` (lista de tags monospace) en `assets/css/home.css`. Reemplazo CSS de los `style="..."` inline que aparecen en la referencia para esta sección (FR-013).
- [X] T025 [US3] Agregar `<section id="about">` en `<main>` de `index.html`: `<p class="section-label">// whoami</p>`, `<h2 class="section-title">Sobre mí</h2>`, `<div class="about-grid">` con `<div class="about-text">` (tres párrafos espejo de la referencia, último con clase `.about-stack` para los tags monospace) y `<div class="about-stats">` con 4 `<div class="stat-card">` según [data-model.md §Stat](./data-model.md). Depende de T013, T024.
- [X] T026 [P] [US3] Agregar regla `.contact-links` (flex gap, wrap) y `.contact-intro` en `assets/css/home.css` — reemplazo de inline styles de la referencia.
- [X] T027 [US3] Agregar `<section id="contact">` en `<main>` de `index.html`: `<p class="section-label">// ping</p>`, `<h2 class="section-title">Contacto</h2>`, `<p class="contact-intro">Hablemos de DevSecOps, seguridad en banca, o cualquier idea de colaboración.</p>`, `<div class="contact-links">` con tres `<a class="contact-link">`:
  1. `href="https://github.com/victorar42" target="_blank" rel="noopener noreferrer" aria-label="Perfil de GitHub (abre en nueva pestaña)"` + SVG + "GitHub".
  2. `href="https://www.linkedin.com/in/victorar42/" target="_blank" rel="noopener noreferrer" aria-label="Perfil de LinkedIn (abre en nueva pestaña)"` + SVG + "LinkedIn".
  3. `href="mailto:josuevjar@gmail.com" aria-label="Enviar correo a josuevjar@gmail.com"` + SVG + "josuevjar@gmail.com".
   Depende de T013, T026.
- [X] T028 [P] [US3] Agregar sección Blog placeholder y reglas asociadas: en `assets/css/home.css` reglas de espaciado para `.blog-coming` (la base ya está en `components.css`). En `index.html`, `<section id="blog">` con `<p class="section-label">// blog</p>`, `<h2 class="section-title">Artículos</h2>`, `<div class="blog-coming">` con `<p>&gt; contenido_en_desarrollo<span class="terminal-cursor" aria-hidden="true"></span></p>` y `<p class="blog-coming-sub">Próximamente: guías, tutoriales y aprendizajes sobre DevSecOps en banca.</p>`. Reemplazar el `style="margin-top:0.5rem;font-size:0.8rem"` de la referencia con la clase `.blog-coming-sub`.

**Checkpoint US3**: Pa11y limpio. Click en email abre `mailto:josuevjar@gmail.com`. Lectores de pantalla anuncian "Perfil de GitHub", "Perfil de LinkedIn", "Enviar correo a josuevjar@gmail.com" sin ambigüedad. Sección Blog no rota la página y respeta el layout.

---

## Phase 7: User Story 5 — Multi-página scaffold (Priority: P3)

**Goal**: Crear `blog/index.html`, `talks/index.html`, `404.html`, `robots.txt`, `sitemap.xml`. Cada página HTML reusa exactamente las mismas hojas CSS y `main.js`, demuestra que tokens/components escalan sin refactor. Validar duplicación de `<header>`/`<footer>` aceptable según [research.md R-05](./research.md).

**Independent Test**: Servir el repo, abrir `/blog/`, `/talks/`, `/404.html`. Cada uno: misma identidad visual, nav y footer presentes, contenido "Próximamente" claro. `lychee` no detecta links rotos. Lighthouse SEO ≥95 en cada página.

### Implementation for User Story 5

- [X] T029 [P] [US5] Crear `blog/index.html` con `<head>` propio (title `Blog — ardops.dev`, description, canonical `https://ardops.dev/blog/`, OG/Twitter espejos), mismo CSS pipeline, mismo `<header><nav>` y `<footer>` literal que `index.html` (con anchors absolutos `/#talk`, `/#pipeline`, etc. para volver a la home), `<main id="main">` con `<h1>Blog</h1>` + bloque `.blog-coming` reutilizando estilos.
- [X] T030 [P] [US5] Crear `talks/index.html` con `<head>` propio (title `Charlas — ardops.dev`, canonical `https://ardops.dev/talks/`), mismo CSS+JS, mismo nav/footer, `<main>` con `<h1>Charlas</h1>` + tarjeta resumen de Techno Week 8.0 que enlaza a `/#talk` (anclaje a la home) y un bloque "Más charlas pronto".
- [X] T031 [P] [US5] Crear `404.html` con `<head>` propio (title `404 — ardops.dev`, `<meta name="robots" content="noindex">`), mismo CSS+JS, mismo nav/footer, `<main>` con `<h1>404</h1>` + mensaje terminal-style "ruta_no_encontrada" + CTA `<a class="btn btn-primary" href="/">Volver al inicio</a>`.
- [X] T032 [P] [US5] Crear `robots.txt` en raíz: `User-agent: *` / `Allow: /` / `Sitemap: https://ardops.dev/sitemap.xml`.
- [X] T033 [P] [US5] Crear `sitemap.xml` en raíz con tres `<url>`: `https://ardops.dev/`, `https://ardops.dev/blog/`, `https://ardops.dev/talks/`. `<lastmod>` con la fecha de creación; `<changefreq>monthly</changefreq>`; `<priority>` 1.0/0.7/0.7.

**Checkpoint US5**: `lychee 'index.html' 'blog/**/*.html' 'talks/**/*.html' '404.html'` sin errores. `npx html-validate` limpio en las 4 páginas. Cada página comparte el mismo bundle de CSS/JS sin duplicación.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Gates automatizados (CI), deploy, documentación viva. Bloqueante para merge a `main`.

- [X] T034 [P] Crear `tests/lighthouserc.json` con assertions de [contracts/lighthouse-budgets.md](./contracts/lighthouse-budgets.md) (Perf ≥0.95, A11y =1.0, BP ≥0.95, SEO ≥0.95, LCP <2500ms, CLS <0.1, TBT <200ms, total-byte-weight <512000). URLs: home, blog, talks, 404. `staticDistDir: "."`.
- [X] T035 [P] Crear `tests/pa11y.config.js` con `defaults.standard: 'WCAG2AA'`, runners `['axe', 'htmlcs']`, lista de URLs (`/`, `/blog/`, `/talks/`, `/404.html`).
- [X] T036 [P] Crear `tests/links.config.json` (config para `lycheeverse/lychee-action`) con `accept = [200, 206, 429]`, `exclude` para `mailto:` patterns problemáticos si los hubiera, `max_concurrency = 8`.
- [X] T037 [P] Crear `.github/workflows/ci.yml` con jobs: `html-validate` (npm + `npx html-validate index.html blog/index.html talks/index.html 404.html`), `pa11y` (server estático + `npx pa11y-ci`), `lychee` (`lycheeverse/lychee-action@v2`). Trigger: `pull_request` y `push` a `main`. Falla bloquea merge.
- [X] T038 [P] Crear `.github/workflows/lighthouse.yml` con `treosh/lighthouse-ci-action@v12` ejecutando `tests/lighthouserc.json`. Matrix: `formFactor: [mobile, desktop]`. Trigger PR. Falla bloquea merge.
- [X] T039 Crear `.github/workflows/pages-deploy.yml` con jobs `build` (artefacto = repo root excluyendo `specs/`, `legacy/`, `docs/`, `tests/`, `.specify/`, `.github/`, `node_modules/`), `deploy` con `actions/deploy-pages@v4`. `needs:` que el workflow `lighthouse` (vía `workflow_run`) haya completado verde sobre el commit. Trigger: `push` a `main` y `workflow_dispatch`. Permisos `pages: write`, `id-token: write`. Depende de T037, T038.
- [X] T040 [P] Actualizar [docs/05-security-spec.md](../../docs/05-security-spec.md) con la política CSP final aplicada (copia textual de [contracts/csp-policy.md](./contracts/csp-policy.md)) y documentar gap conocido de headers HTTP no controlables en GitHub Pages (HSTS, Referrer-Policy, etc.).
- [X] T041 [P] Actualizar [docs/06-performance-spec.md](../../docs/06-performance-spec.md) con budgets concretos del LHCI (Perf ≥95, LCP <2.5s, CLS <0.1, INP/TBT <200ms, total-byte <500 KB).
- [X] T042 [P] Actualizar [docs/07-accessibility-spec.md](../../docs/07-accessibility-spec.md) con el contract de [contracts/a11y-checklist.md](./contracts/a11y-checklist.md) (WCAG 2.1 AA, Lighthouse A11y =100).
- [X] T043 [P] Actualizar [docs/09-deployment-spec.md](../../docs/09-deployment-spec.md) describiendo el pipeline de deploy: `ci.yml` + `lighthouse.yml` como gates, `pages-deploy.yml` con `actions/deploy-pages`, dominio personalizado vía `CNAME`.
- [X] T044 Eliminar todos los `.gitkeep` de carpetas que ya tienen contenido real (`assets/css/`, `assets/js/`, `assets/fonts/`, `public/og/`, `public/favicon/`, `blog/`, `talks/`). Mantener `.gitkeep` solo en `assets/img/`, `assets/icons/`, `.github/ISSUE_TEMPLATE/` si siguen vacías.
- [X] T045 Verificación local final (Phase 7 de [plan.md](./plan.md)): correr en orden:
   1. `npx html-validate index.html blog/index.html talks/index.html 404.html` → 0 errores.
   2. `npx pa11y-ci --config tests/pa11y.config.js` → 0 violaciones serious/critical.
   3. `npx lychee --config tests/links.config.json '*.html' 'blog/**/*.html' 'talks/**/*.html'` → 0 broken.
   4. `npx @lhci/cli@latest autorun --config=tests/lighthouserc.json` (mobile y desktop) → todos los assertions pasan.
   5. `rg 'style="|onclick=' -g '!legacy/**' -g '!.reference/**' -g '!specs/**' -g '!docs/**' -g '!.specify/**' -g '!node_modules/**'` → 0 matches.
   6. DevTools Network filtrado por third-party → 0 entries.
   7. Comparación visual lado a lado contra `legacy/index.html` → equivalente en hero, talk, pipeline, about, blog placeholder, contact, footer.
   8. Test con DevTools "Emulate prefers-reduced-motion: reduce" → animaciones detenidas.
   9. Tab-only navigation desde top a footer → sin trampas, todos los enlaces alcanzables, foco visible.
- [X] T046 Verificación de previews sociales: pegar `https://ardops.dev/` (preview local con ngrok o tras primer deploy) en [opengraph.xyz](https://www.opengraph.xyz/) y [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) → preview correcto. Pegar el HTML en [validator.schema.org](https://validator.schema.org/) → JSON-LD `Person` + `Event` válidos.
- [X] T047 Crear PR con descripción siguiendo el formato de [.github/copilot-instructions.md](../../.github/copilot-instructions.md) §7: Spec ID `001-landing-redesign`, secciones de constitución cumplidas (I, II, III, IV, V, VI, VII, VIII con desviación documentada, IX, X) y checklist de gates (a11y, perf, security) referenciando los runs verdes de `ci.yml` y `lighthouse.yml`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias previas.
- **Foundational (Phase 2)**: depende de Setup. Bloquea todas las user stories. Internamente T013 depende de T007–T012; T014 depende de T007.
- **User Stories**:
  - US1 (Phase 3): depende de Foundational. Sin dependencias en otras stories.
  - US2 (Phase 4): depende de US1 (extiende la talk card creada en T018).
  - US4 (Phase 5): depende de Foundational. Independiente de US1/US2/US3.
  - US3 (Phase 6): depende de Foundational. Independiente.
  - US5 (Phase 7): depende de Foundational. Conviene tener al menos US1 mergeado para que la home referenciada por blog/talks tenga contenido real.
- **Polish (Phase 8)**: T034–T038 paralelos; T039 depende de T037+T038; T044–T047 al final, T045/T046 después de todo lo demás.

### User Story Independence

| Story | Bloqueante para | Independiente de |
|---|---|---|
| US1 | US2, US5 | US3, US4 |
| US2 | — | US3, US4, US5 |
| US3 | — | US1, US2, US4, US5 |
| US4 | — | US1, US2, US3, US5 |
| US5 | — | US2, US3, US4 (recomendable después de US1) |

### Within each user story

- Reglas CSS [P] (paralelo) antes del HTML que las usa (cuando aplica).
- HTML que introduce sección depende del CSS de esa sección y del esqueleto T013.
- Checkpoint corre Pa11y + revisión visual antes de cerrar la story.

### Parallel Opportunities

- Setup: T002, T003, T004, T005, T006 todas en paralelo después de T001.
- Foundational CSS: T007–T012 todas en paralelo (archivos distintos). T013 espera por todas. T014 espera solo por T007.
- US1 CSS y HTML core: T015 y T016 paralelos; T017 y T018 secuenciales tras T013/T015/T016.
- US3: T024, T026, T028 paralelos (archivos distintos); T025 y T027 secuenciales tras sus CSS.
- US4: T021, T023 paralelos; T022 después.
- US5: T029, T030, T031, T032, T033 todos en paralelo.
- Polish CI: T034, T035, T036, T037, T038 paralelos; T039 espera; docs T040–T043 paralelos.

---

## Parallel Example: Foundational

```bash
# Tras T001 (estructura) y T002–T006, ejecutar en paralelo:
Task T007: tokens.css
Task T008: base.css (incluye @font-face)
Task T009: motion.css (keyframes + reduced-motion)
Task T010: layout.css (nav, footer, grain)
Task T011: components.css
Task T012: assets/js/main.js

# Esperar a que terminen las 6 → ejecutar:
Task T013: esqueleto de index.html
Task T014: home.css con breakpoints skeleton (paralelo con T013)
```

## Parallel Example: User Story 5 (multi-página)

```bash
# Tras Foundational + US1, ejecutar las 5 en paralelo:
Task T029: blog/index.html
Task T030: talks/index.html
Task T031: 404.html
Task T032: robots.txt
Task T033: sitemap.xml
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 Setup (T001–T006).
2. Phase 2 Foundational (T007–T014). **CRITICAL**.
3. Phase 3 US1 (T015–T018).
4. **STOP & VALIDATE**: ver hero + talk card. Pa11y + comparación visual.
5. Demo / merge `001-landing-redesign` parcial si se quiere release temprano (la home funciona aunque pipeline/about/contact/multi-página falten).

### Incremental Delivery

1. Setup + Foundational ⇒ esqueleto desplegable.
2. + US1 (P1) ⇒ MVP demo-able.
3. + US2 (P1) ⇒ landing completa para asistentes a la charla.
4. + US4 (P2) ⇒ pipeline visible.
5. + US3 (P2) ⇒ about + contacto + blog placeholder.
6. + US5 (P3) ⇒ scaffold multi-página + sitemap.
7. + Polish ⇒ gates verdes y deploy a producción.

### Parallel Team Strategy

Tras Foundational, con dos personas:

- Dev A: US1 → US2.
- Dev B: US4 (paralelo) → US3.
- Cualquiera: US5 al final.
- Polish lo cierra quien quede con bandwidth.

---

## Notes

- `[P]` = archivo distinto, sin dependencia pendiente.
- `[USx]` mapea a la user story de [spec.md](./spec.md) para trazabilidad.
- Cada user story termina con un checkpoint de validación independiente.
- Commit recomendado al cerrar cada task (auto-commit por `after_*` hooks habilitado en `.specify/extensions.yml`).
- No introducir tests unitarios (no solicitados por la spec); los gates automatizados (Lighthouse/Pa11y/lychee/html-validate) hacen las veces de verificación.
- Cualquier desviación de tokens/animaciones de [legacy/index.html](../../legacy/index.html) constituye violación de la constitución (§II) y requiere PR a la constitución, no a este plan.
