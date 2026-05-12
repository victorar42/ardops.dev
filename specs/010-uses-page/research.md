# Phase 0 — Research: `/uses/` page

**Feature**: 010-uses-page
**Date**: 2026-05-12

Esta página no introduce tecnología nueva ni dependencias. La investigación
se centra en decisiones editoriales y de integración con módulos compartidos
ya existentes (specs 008 y 009).

---

## D-001 — ¿Generador estático o HTML a mano?

- **Decisión**: HTML a mano en `uses/index.html`.
- **Rationale**: el contenido cambia 1-2 veces al año (cadencia editorial
  conocida del género `/uses/`). Construir un generador (`build-uses.js`,
  schema, parser, gates) cuesta más de lo que ahorra. Editar `<dt>`/`<dd>`
  en HTML es trivial y deja diffs autoexplicativos en git.
- **Alternativas evaluadas**:
  - `content/uses.md` + `scripts/build-uses.js`: rechazado — añade superficie
    sin beneficio (cadencia baja, schema trivial).
  - JSON drivers (e.g. `data/uses.json` + render): rechazado — duplica el
    modelo y oculta el diff editorial detrás de un build artifact.

## D-002 — Modelo HTML por item

- **Decisión**: `<dl>` por sección, `<dt>` para el nombre, `<dd>` para la
  justificación.
- **Rationale**: es exactamente el contrato del backlog (FR-03) y es la
  primitiva semántica para "término–definición" en HTML. Buena soporte de
  lectores de pantalla y Reader Mode. Permite estilos `dt { ... }` /
  `dd { ... }` simples.
- **Alternativas evaluadas**:
  - `<ul><li><strong>Nombre</strong> — desc</li>`: rechazado — pierde la
    relación término/definición a nivel de árbol semántico.
  - Tabla `<table>`: rechazado — no es una matriz tabular; es una lista de
    pares.

## D-003 — Componente CSS

- **Decisión**: intentar primero con selectores existentes (`.section`,
  `dl`, `dt`, `dd` heredados de `base.css`/`components.css`). Si la
  legibilidad o la consistencia con la estética terminal/code-first
  requiere ajustes (espaciado, color de `dt` con `--accent`, separación
  entre items), añadir un selector `.uses-list` aplicado al `<dl>` en
  `assets/css/components.css`.
- **Rationale**: cero CSS nuevo > poco CSS nuevo > muchos archivos nuevos.
  Sigue Principio II (identidad visual preservada).
- **Alternativas evaluadas**:
  - Archivo nuevo `uses.css`: rechazado — no se justifica un archivo para
    un selector. Aumenta requests.
  - Estilo inline: prohibido por Principio VIII (CSP sin `'unsafe-inline'`).

## D-004 — Posición en el nav global

- **Decisión**: añadir `{ href: '/uses/', label: 'Uses', match: ['/uses/'] }`
  al array `NAV` en `scripts/lib/layout.js`, **entre `Charlas` y `Contacto`**.
- **Rationale**: la convención del género es etiquetarlo "Uses" (en inglés,
  como `uses.tech`). Posicionarlo después de Charlas mantiene el grupo de
  contenidos juntos (Blog, Entrevistas, Charlas, Uses) antes del CTA de
  Contacto.
- **Alternativas evaluadas**:
  - Etiqueta "Stack" o "Herramientas": rechazado — pierde reconocibilidad
    SEO/cultural ("/uses/" es un género establecido).
  - Posición al final (después de Contacto): rechazado — Contacto es CTA y
    debe quedar al final visualmente.

## D-005 — JSON-LD (`WebPage` + `Person`)

- **Decisión**: emitir un único `<script type="application/ld+json">` con un
  array de dos nodos: un `WebPage` (`@id` = `https://ardops.dev/uses/#webpage`)
  y un `Person` (`@id` = `https://ardops.dev/#person`). El `WebPage` referencia
  al `Person` en `author` por `@id`. La forma del `Person` se reutiliza tal
  cual del JSON-LD de `index.html` para evitar drift.
- **Rationale**: `Person` con `@id` reutilizable es la forma canónica para
  schemas distribuidos. Cero datos inventados.
- **Alternativas evaluadas**:
  - Sólo `WebPage`: rechazado — el backlog FR-07 pide referenciar al autor.
  - `Article`: rechazado — `/uses/` no es contenido editorial fechado.

## D-006 — OG image

- **Decisión**: reutilizar `https://ardops.dev/public/og/og-default.png` (ya
  usada por `talks/index.html`).
- **Rationale**: cero diseño dedicado en este alcance; el og global cubre
  el caso. Si en el futuro se quiere arte propio, es un cambio aislado.

## D-007 — Fecha de "última actualización"

- **Decisión**: hardcoded en HTML como
  `<p class="uses-updated">Última actualización: <time datetime="2026-05-12">mayo 2026</time></p>`.
  En cada update editorial se modifica manualmente.
- **Rationale**: cero JS, cero `Date()` en runtime, diff explícito en git.
  Consistente con cómo `scripts/lib/layout.js` hardcodea el año en el
  footer (decisión D-010 de spec 008).
- **Alternativas evaluadas**:
  - Inyectar fecha desde `scripts/build-layout.js`: rechazado — overkill
    para un campo que cambia con el contenido editorial, no con cada build.
  - JS `document.write(new Date())`: rechazado — viola CSP y a11y.

## D-008 — Sin imágenes/íconos por item

- **Decisión**: cero `<img>` en el `<body>` de la página.
- **Rationale**: peso visual + a11y (cada `<img>` requiere `alt`
  significativo o `alt=""` justificado), mantenimiento (logos cambian),
  riesgo de cargar externos (viola Principio V) o de inflar el repo. El
  género `/uses/` se lee perfectamente como prosa lista.

## D-009 — Sitemap drift gate

- **Decisión**: la entrada de `/uses/` se añade a `sitemap.xml` (root). El
  gate `tests/sitemap-drift.sh` valida bidireccionalmente y debe pasar:
  - V-1 forward: `https://ardops.dev/uses/` resuelve a `uses/index.html`.
  - V-2 backward: el `<link rel="canonical">` de `uses/index.html` está en
    `sitemap.xml`.
- **Rationale**: el gate ya descubre páginas servidas vía un patrón que
  incluye `uses/`. No requiere modificar el script.

## D-010 — CSP / nav-consistency gates

- **Decisión**: añadir `uses/index.html` a `STATIC_PAGES` en
  `scripts/check-csp.js` y a `STATIC_PAGES` en
  `scripts/check-nav-consistency.js`. Sin esto, el gate no la cubre.
- **Rationale**: ambos gates declaran páginas estáticas explícitamente
  (no glob). Es un diff de una línea cada uno.

## D-011 — Etiqueta nav active state

- **Decisión**: la entrada en `NAV` declara `match: ['/uses/']`. Cuando
  `currentPath === '/uses/'` (pasado por `build-layout.js`), `renderHeader`
  añade `aria-current="page"` automáticamente.
- **Rationale**: comportamiento ya implementado y testeado en spec 008.

---

**Output**: cero unknowns, cero `NEEDS CLARIFICATION`. Listo para Phase 1.
