# Implementation Plan: Speaking Page (kit de prensa para invitaciones)

**Branch**: `012-speaking-page` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-speaking-page/spec.md`

## Summary

Construir una página estática nueva en `/speaking/` que actúe como kit
de prensa orientado a invitaciones: tres bios (corta/media/larga) con
"Copiar" opcional vía JS y fallback `<details>` nativo, headshot HD
con descarga directa, lista editorial de temas (4-8) con audiencia y
duración, idiomas/formatos/modalidad, CTA mailto con cuerpo
prellenado de 8 campos, y un puente curado a `/talks/`. Implementación
100 % vanilla siguiendo el contrato del sitio: HTML autoría manual,
nav/footer/head-meta inyectados por `scripts/build-layout.js`
(spec 008), CSP/Referrer/anti-tabnabbing (spec 009), JSON-LD
referenciando el `Person` canónico `https://ardops.dev/#person`
y aparición en `sitemap.xml` + meta SEO completos (spec 011). Sin
dependencias nuevas. Todo bajo las gates ya existentes; se agrega
una validación de tamaño del headshot.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2020 (vanilla, sin
build), Node 20 LTS para scripts CommonJS.
**Primary Dependencies**: ninguna nueva. Reutiliza `jsdom` (devDep ya
presente) si se necesita en gates; `assets/css/{tokens,layout,components}.css`;
`scripts/lib/layout.js`, `scripts/lib/jsonld.js`, `scripts/build-layout.js`.
**Storage**: filesystem estático. Headshot binario en `assets/img/speaking/headshot.jpg`.
**Testing**: bash gates ya existentes (`tests/no-placeholders.sh`,
`tests/external-links.sh`, `tests/csp-no-unsafe-inline.sh`,
`tests/nav-consistency.sh`, `tests/sitemap-drift.sh`,
`tests/seo-meta.sh`, `tests/jsonld-validate.sh`,
`tests/feed-validate.sh`), `npm run html-validate`,
`node tests/a11y.js`, `pa11y` ya configurado. Nueva gate ligera
`tests/headshot-size.sh` para validar el binario.
**Target Platform**: GitHub Pages estático en `https://ardops.dev`.
Browsers evergreen (Chrome/Firefox/Safari últimas 2 versiones) +
lectores de pantalla (VoiceOver, NVDA) + clientes de correo (Gmail
web, Apple Mail).
**Project Type**: Sitio estático single-tree (no hay frontend/backend
split). Una página HTML nueva + módulo JS opcional de ~30-60 LOC + un
binario.
**Performance Goals**: Lighthouse Perf ≥ 95, A11y = 100, SEO ≥ 95
(móvil). LCP < 2.5 s, CLS < 0.1, INP < 200 ms (constitución VII).
**Constraints**: Carga inicial ≤ 350 KB transferidos (excluye descarga
voluntaria del HD). Headshot HD ≤ 250 KB / ≥ 1200×1200 px / JPG
progresivo. Módulo `copy-bio.js` ≤ 1 KB minificado. Cero
`unsafe-inline`/`unsafe-eval`, cero externals en runtime, cero deps
nuevas. CSP idéntica al resto del sitio.
**Scale/Scope**: 1 página HTML nueva (~250-350 LOC HTML), 1 archivo
JS opcional (~30-60 LOC), 1 binario (≤ 250 KB), 0 nuevas variables
CSS. Modificaciones puntuales: `sitemap.xml` (+1 entrada),
`scripts/build-layout.js` (+1 entrada en `PAGES`),
`scripts/lib/layout.js` (+1 entrada en NAV_LINKS),
`scripts/check-jsonld.js` (+ ruta en `STATIC_PAGES`),
`tests/no-placeholders.sh` (+ candidato).

## Constitution Check

Constitución `.specify/memory/constitution.md` v1.2.0 — evaluación
gate por gate antes de Phase 0:

| # | Principio | Status | Justificación |
|---|-----------|--------|---------------|
| I | Spec-Driven obligatorio | PASS | Spec 012 aprobada, checklist 16/16, este plan es el siguiente paso del flujo. |
| II | Identidad visual preservada | PASS | Reutiliza `tokens.css`/`components.css`/`layout.css` y la estética terminal. Cero variables nuevas, cero fonts nuevas (JetBrains Mono + Outfit ya self-hosted). Cualquier estilo específico vivirá scoped (`.speaking-*`) en `components.css`. |
| III | Sitio 100 % estático | PASS | HTML autoría manual + JS vanilla opcional. Sin generador, sin server-side, sin DB. |
| IV | Cero deps JS terceros | PASS | `copy-bio.js` ~30-60 LOC vanilla. `navigator.clipboard` es Web API, no es dep. |
| V | Fonts y assets self-hosted | PASS | Headshot servido desde `/assets/img/speaking/`. Sin CDN externo. |
| VI | A11y WCAG 2.1 AA | PASS | `<details>` fallback, `aria-live="polite"` para feedback de copia, `alt` descriptivo, focus ring vía tokens, navegación 100 % por teclado. Gate `pa11y` + `node tests/a11y.js`. |
| VII | Performance es feature | PASS | Headshot ≤ 250 KB con `loading="lazy"` + `width`/`height` (no CLS). Carga inicial ≤ 350 KB. Sin scripts pesados. |
| VIII | Seguridad por defecto | PASS | Mismo CSP meta que el resto, listener por `data-*` (sin inline handler), `<a target="_blank">` externos con `rel="noopener noreferrer"`, referrer-policy via `head-meta` block (spec 009). |
| IX | Cada PR pasa todas las gates | PASS | Esta página se incorpora a CI vía `tests/no-placeholders.sh` + nav/sitemap/SEO/JSON-LD/CSP/external-links + nueva `tests/headshot-size.sh`. |
| X | Documentación versionada | PASS | spec.md, plan.md, research.md, data-model.md, quickstart.md, contracts/ todos commitean en `specs/012-speaking-page/`. |
| XI | Hosting y dominio fijos | PASS | GitHub Pages + dominio `ardops.dev`. Mailto usa `contacto@ardops.dev`. CSP via meta (no header). Cero cambio operativo. |

**Resultado**: 11/11 PASS. Cero violaciones, no hay entradas en
**Complexity Tracking**.

## Project Structure

### Documentation (this feature)

```text
specs/012-speaking-page/
├── plan.md                # This file
├── research.md            # Phase 0 output
├── data-model.md          # Phase 1 output (entidades editoriales)
├── quickstart.md          # Phase 1 output (cómo verificar local + prod)
├── contracts/
│   ├── speaking-html-contract.md
│   ├── copy-bio-contract.md
│   ├── mailto-template.md
│   └── headshot-asset.md
├── checklists/
│   └── requirements.md    # ya existe (16/16 PASS)
└── tasks.md               # se generará con /speckit.tasks
```

### Source Code (repository root)

```text
ardops.dev/
├── index.html
├── 404.html
├── sitemap.xml                       # + 1 entry: /speaking/
├── talks/index.html
├── uses/index.html
├── speaking/
│   └── index.html                    # NUEVO — la página
├── assets/
│   ├── css/
│   │   ├── tokens.css                # sin cambios
│   │   ├── layout.css                # sin cambios
│   │   └── components.css            # + estilos scoped .speaking-* (≤ 80 LOC)
│   ├── img/
│   │   ├── josue-256.webp
│   │   └── speaking/
│   │       └── headshot.jpg          # NUEVO — binario (≤ 250 KB, ≥ 1200×1200)
│   └── js/
│       └── copy-bio.js               # NUEVO — ~30-60 LOC vanilla, defer
├── scripts/
│   ├── build-layout.js               # + entrada en PAGES
│   ├── check-jsonld.js               # + ruta en STATIC_PAGES
│   └── lib/
│       └── layout.js                 # + entrada en NAV_LINKS
└── tests/
    ├── no-placeholders.sh            # + 'speaking/index.html' en candidatos
    ├── headshot-size.sh              # NUEVO — gate trivial
    └── ...
```

**Structure Decision**: Single-tree estático ya establecido por
constitución III/XI. La nueva página vive en su propio directorio
`speaking/` siguiendo el patrón de `talks/`, `uses/`, `interviews/`
para que la URL canónica sea `/speaking/`. Los pequeños touch-points
en `scripts/` y `tests/` reutilizan los mecanismos existentes (NAV
compartida spec 008, JSON-LD spec 011, CSP spec 009) en lugar de
introducir abstracciones nuevas.

## Phase 0 — Research

Decisiones técnicas resueltas en [research.md](./research.md):

1. **Patrón "Copiar bio" sin deps** — `navigator.clipboard.writeText`
   detrás de un listener registrado por `data-copy-target`, con
   fallback `<details>` siempre presente. Documenta por qué se
   descartan `document.execCommand('copy')` (deprecated) y libs como
   `clipboard.js` (viola IV).
2. **Servir un solo JPG vs LQIP/responsive `<picture>`** — un único
   JPG progresivo HD a ≤ 250 KB con `loading="lazy"` + `width/height`
   explícitos. Se rechaza pipeline multi-variante (sharp en build) por
   complejidad sin ROI claro a esta escala (1 imagen).
3. **Dónde vive el JSON-LD `Person`** — referencia por `@id` al nodo
   canónico de home, sin redefinir `name`/`url`/`sameAs`. Patrón ya
   probado en spec 011 (interviews/Article author).
4. **Mailto encoding** — RFC 6068 strict (`%20` para espacios, `%0A`
   para newline en `body`, `%3A` para `:`, `%2F` para `/`). Validación
   manual en Gmail web + Apple Mail.
5. **Charlas destacadas: sync vs hardcoded** — selección editorial
   manual hardcoded en HTML (3-5 entries). Justificación: zero
   coupling con `talks/index.html`, evita generador para 5 ítems, y
   respeta curaduría editorial (no son las "más recientes"; son las
   "más relevantes para un organizador").
6. **Gate de tamaño del headshot** — bash one-liner con `wc -c` +
   `file` para verificar `image data` y `≤ 256000 bytes`. Sin nuevas
   deps; integrable en CI en segundos.

**Output**: [research.md](./research.md) con todas las decisiones,
rationale y alternativas evaluadas. Cero `NEEDS CLARIFICATION`
pendientes.

## Phase 1 — Design & Contracts

### Data model

Ver [data-model.md](./data-model.md). Entidades editoriales puras (no
hay base de datos):

- **Bio** (3 instancias: short / medium / long): `id`, `label`,
  `wordTarget`, `paragraphCount`, `body` (texto plano).
- **SpeakingTopic** (4-8 instancias): `title`, `description`,
  `audience`, `duration`.
- **HighlightedTalk** (3-5 instancias): `title`, `event`, `year`,
  `talkAnchor` (opcional, link a `/talks/#…`).
- **HeadshotAsset**: `path`, `width`, `height`, `bytes`, `format`,
  `downloadFilename`.
- **MailtoTemplate**: `to`, `subjectPrefix`, `bodyFields[]` (8
  campos).
- **JsonLdReference**: `@type: Person`, `@id` apunta a
  `https://ardops.dev/#person`, sin propiedades adicionales.

Todas las entidades viven embebidas en el HTML (sin JSON externo). El
data-model existe para que `/tasks` y `/implement` no improvisen
estructura ni nombres.

### Interface contracts

El proyecto expone "contratos" hacia el exterior (organizadoras,
buscadores, lectores de pantalla, gates de CI). Documentados en
`contracts/`:

- [`contracts/speaking-html-contract.md`](./contracts/speaking-html-contract.md)
  — secciones, anclas, atributos `data-*`, landmarks ARIA, orden de
  tabulación.
- [`contracts/copy-bio-contract.md`](./contracts/copy-bio-contract.md)
  — API esperada del módulo `assets/js/copy-bio.js`.
- [`contracts/mailto-template.md`](./contracts/mailto-template.md) —
  destinatario, prefijo de subject, lista cerrada de 8 campos en el
  body, encoding RFC 6068.
- [`contracts/headshot-asset.md`](./contracts/headshot-asset.md) —
  formato, dimensiones, peso, nombre de descarga, ubicación
  canónica, cómo regenerar.

### Quickstart

[`quickstart.md`](./quickstart.md) documenta cómo:

1. Instalar deps (`npm ci`) y correr el build (`npm run build`).
2. Servir localmente (`python3 -m http.server` o `npx serve`) y
   verificar `/speaking/`.
3. Correr la suite local (`npm run check:distribution` + nuevas
   gates).
4. Validar manualmente: copiar las tres bios, descargar headshot,
   abrir el mailto en Gmail web + Apple Mail.
5. Smoke test post-deploy en `https://ardops.dev/speaking/`.

### Agent context update

Actualizar el bloque SPECKIT en
[.github/copilot-instructions.md](../../.github/copilot-instructions.md)
para que apunte al plan activo:

```html
<!-- SPECKIT START -->
**Plan activo**: [`specs/012-speaking-page/plan.md`](../specs/012-speaking-page/plan.md)
<!-- SPECKIT END -->
```

### Constitution re-check post-design

Re-evaluación tras Phase 1: 11/11 PASS sigue verde.

- Diseño no introdujo deps nuevas (solo `navigator.clipboard`, Web API
  nativa).
- Diseño no introdujo runtime externals (todos los assets self-hosted).
- Diseño no rompió CSP (`copy-bio.js` carga con `defer` desde
  `/assets/js/`, listener por data-attribute, sin inline handler).
- Diseño no degrada a11y (fallback `<details>` siempre presente,
  feedback `aria-live="polite"`).

**Output Phase 1**: data-model.md, contracts/*, quickstart.md, agent
context actualizado.

## Complexity Tracking

> No hay violaciones constitucionales que justificar. Tabla vacía
> intencionalmente.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (ninguna) | — | — |
