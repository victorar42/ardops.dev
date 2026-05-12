# Feature Specification: `/uses/` page — stack & herramientas

**Feature Branch**: `010-uses-page`
**Created**: 2026-05-12
**Status**: Draft
**Input**: User description: "Implementar el backlog item 03 — uses-page. Página estática `/uses/index.html` con el stack actual: hardware, OS, editor, terminal, herramientas DevOps/security, librerías favoritas, servicios SaaS, y opcionalmente abandoned. Cada item es `<dl>` con justificación. JSON-LD WebPage+Person. Sin afiliados ni imágenes. Banner de última actualización. Reutiliza shared nav (depende de Backlog 01)."
**Source**: [`backlog/03-uses-page.md`](../../backlog/03-uses-page.md)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visitante curioso descubre el stack del autor (Priority: P1)

Una persona del gremio (recruiter, peer DevSecOps, asistente a una charla) entra a `ardops.dev/uses/` después de ver un link en LinkedIn, una bio o una mención en una charla. Quiere conocer rápidamente el stack real que usa el autor en 2026 (hardware, OS, editor, herramientas DevOps, security, cloud) y, sobre todo, **por qué** elige cada cosa. Cierra la página con una idea concreta del criterio técnico del autor y, eventualmente, lo recuerda cuando piensa en alguien para una charla, una colaboración o una posición.

**Why this priority**: Es la razón de existir de la página. Si esto no funciona, el resto sobra. Es el flujo único y central.

**Independent Test**: Abrir `/uses/` en un navegador desktop y mobile, escanear las secciones, leer 3-5 justificaciones, salir en menos de 2 minutos sin frustración. La página entrega valor sin depender de ninguna otra ruta del sitio.

**Acceptance Scenarios**:

1. **Given** la página `/uses/` publicada, **When** el visitante la abre desde un link externo, **Then** ve un encabezado claro, secciones jerárquicas con `<h2>` semánticos (Hardware, OS y shell, Editor, Terminal, Lenguajes, DevOps, Security, Cloud, Productividad, opcionalmente Hobbies y Abandoned) y puede llegar a cualquiera de ellas con tab + Enter desde el nav o scroll.
2. **Given** una sección cualquiera, **When** el visitante lee un item, **Then** ve el nombre de la herramienta como término (`<dt>`) y una justificación corta (1-2 líneas) como descripción (`<dd>`) que explica *por qué* el autor la usa, no solo *qué* es.
3. **Given** la página cargada, **When** el visitante mira el final, **Then** ve un banner discreto con la fecha de la última actualización (mes y año humanos, respaldado por `<time datetime="YYYY-MM-DD">`).
4. **Given** un lector de pantalla, **When** recorre la página por landmarks y headings, **Then** la jerarquía es navegable y todas las secciones tienen título único, sin saltos de nivel.

---

### User Story 2 — Buscador orgánico llega por long-tail (Priority: P2)

Alguien que busca en Google "stack devsecops 2026 costa rica", "terraform setup mac 2026" o "ide para kubernetes 2026" encuentra la página entre los resultados. La meta description y el title la describen con precisión. Al entrar, encuentra contenido coherente con la búsqueda, refuerza su percepción del autor como referente técnico de la región.

**Why this priority**: Refuerza autoridad técnica y posicionamiento orgánico recurrente; sin embargo, el SEO no es bloqueante para que la página exista y funcione (US1).

**Independent Test**: Auditar la página con Lighthouse SEO ≥ 95, validar que el `<title>`, `<meta description>`, OG tags, Twitter card, `<link rel="canonical">` y entrada en `sitemap.xml` describen consistentemente la página y que el JSON-LD `WebPage` + `Person` valida en validators externos.

**Acceptance Scenarios**:

1. **Given** la página servida, **When** se inspecciona su `<head>`, **Then** contiene `<title>`, `<meta name="description">` orientado a long-tail DevSecOps, `<link rel="canonical" href="https://ardops.dev/uses/">`, OG tags (`og:title`, `og:description`, `og:url`, `og:type=website`, `og:image`), Twitter card y los metas globales heredados (CSP, viewport, charset, referrer policy).
2. **Given** la página servida, **When** se inspecciona su JSON-LD, **Then** contiene un bloque `WebPage` que referencia un `Person` (Victor Josue Ardón Rojas) como `author`, sin datos inventados ni claims falsos.
3. **Given** el sitio publicado, **When** se consulta `sitemap.xml`, **Then** existe una entrada `<url><loc>https://ardops.dev/uses/</loc>...</url>` y la gate `tests/sitemap-drift.sh` no reporta drift.

---

### User Story 3 — Mantenimiento liviano cada 6-12 meses (Priority: P3)

El autor abre el repo, edita `uses/index.html` para cambiar 1-2 herramientas (por ejemplo: cambia de editor o añade una CLI nueva), actualiza el `<time datetime>` del banner y abre un PR. CI corre todas las gates y pasa sin warnings. Merge → publicado.

**Why this priority**: Es el flujo de operación recurrente del autor, no un journey de visitante. No bloquea el lanzamiento, pero es lo que mantiene la página relevante en el tiempo.

**Independent Test**: Modificar manualmente un `<dt>`/`<dd>`, cambiar la fecha del banner, correr en local `npm run html-validate`, `node tests/a11y.js`, `bash tests/no-placeholders.sh`, `bash tests/external-links.sh`, `bash tests/sitemap-drift.sh`, `bash tests/csp-no-unsafe-inline.sh` y `bash tests/nav-consistency.sh`. Todas verdes.

**Acceptance Scenarios**:

1. **Given** un cambio en un item del stack, **When** se commitea con título `uses: editor cambió de A a B`, **Then** el diff queda autoexplicativo y no hay rebuild de otras páginas necesario.
2. **Given** un cambio cualquiera en `uses/index.html`, **When** corre CI, **Then** todas las gates relevantes (html-validate, a11y, no-placeholders, csp, external-links, sitemap-drift, nav-consistency) pasan o el PR queda bloqueado.

---

### Edge Cases

- **Sección "Abandoned" vacía o ausente**: la sección es opcional. Si no aplica, se omite por completo (no se deja como "N/A" ni con placeholder). El resto de la página sigue siendo coherente.
- **Sección "Hobbies / off-topic" vacía o ausente**: ídem; opcional, se omite si no aporta.
- **Item sin link**: la mayoría de items pueden no tener link externo. La justificación (`<dd>`) sigue siendo el contenido principal; ningún `<dt>` queda vacío.
- **Item con link externo**: se renderiza con `rel="noopener noreferrer"`; cero `rel="sponsored"`, cero patrocinios, cero afiliados. Sin `target="_blank"` salvo justificación: si se usa, la gate `external-links.sh` exige el `rel` correcto.
- **Banner de actualización viejo (> 12 meses)**: la página sigue siendo válida; no falla ninguna gate por antigüedad. La frescura es un compromiso editorial, no una invariante técnica.
- **Imagen de OG ausente para `/uses/`**: si no hay arte dedicado, se reutiliza el `og:image` global del sitio (mismo asset que home). Cero imágenes embebidas en el `<body>`.
- **Lectura sin CSS** (modo lector / texto plano): la jerarquía `<h1> → <h2> → <dl><dt><dd>` debe seguir siendo legible y comprensible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sitio DEBE servir la página en la ruta `/uses/`, materializada como `uses/index.html` en el repositorio.
- **FR-002**: La página DEBE estructurar el contenido en secciones con encabezados `<h2>` semánticos en este orden: Hardware, Sistema operativo y shell, Editor / IDE, Terminal y CLI, Lenguajes y runtimes, DevOps & infra, Security & compliance, Cloud & servicios, Productividad y notas. Las secciones "Hobbies / off-topic" y "Abandoned" son opcionales y, si están, van al final.
- **FR-003**: Cada item dentro de una sección DEBE renderizarse como `<dl>` con `<dt>` (nombre de la herramienta) y `<dd>` (justificación de 1-2 líneas explicando *por qué* se usa). La justificación es el contenido principal; ningún item puede quedarse sin `<dd>`.
- **FR-004**: La página NO DEBE contener links de afiliado, patrocinados ni `rel="sponsored"`. Cualquier link externo informativo DEBE tener `rel="noopener noreferrer"` y la gate `tests/external-links.sh` no debe reportar incumplimientos.
- **FR-005**: La página DEBE incluir un banner discreto al final con la fecha de la última actualización en formato humano (mes y año), respaldada por `<time datetime="YYYY-MM-DD">` con la fecha exacta.
- **FR-006**: La página DEBE aparecer en el nav global compartido del sitio, reutilizando el módulo `scripts/lib/layout.js` y los marcadores `<!-- nav:start -->` / `<!-- nav:end -->` y `<!-- footer:start -->` / `<!-- footer:end -->` (consistente con las demás páginas estáticas como `index.html`, `404.html`, `talks/index.html`).
- **FR-007**: La página DEBE incluir un bloque JSON-LD con un `WebPage` y un `Person` (Victor Josue Ardón Rojas) referenciado como `author`. Sin claims inventados.
- **FR-008**: La página DEBE incluir `<link rel="canonical" href="https://ardops.dev/uses/">`, OG tags (`og:title`, `og:description`, `og:url`, `og:type=website`, `og:image`), Twitter card (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) y una entrada propia en `sitemap.xml`.
- **FR-009**: La página DEBE incluir `<meta name="description">` orientado a SEO long-tail DevSecOps (ejemplo de referencia: "Stack DevSecOps 2026: hardware, herramientas, CLIs y servicios que uso día a día como ingeniero en Costa Rica"), entre 120 y 200 caracteres.
- **FR-010**: La página DEBE cumplir la política de seguridad del sitio: la misma CSP canónica que el resto de páginas estáticas (`default-src 'self'`, `script-src 'self'`, `style-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`, `form-action 'self'`), `<meta name="referrer" content="strict-origin-when-cross-origin">` y los marcadores `<!-- head-meta:start -->` / `<!-- head-meta:end -->` para que `build-layout.js` la procese.
- **FR-011**: La página DEBE reutilizar componentes CSS existentes (`.section`, `.section-label`, `.section-title`, `.section-lead`, tokens de `assets/css/tokens.css`). Si se introduce un componente nuevo `.uses-list` para estilizar `<dl>`, DEBE vivir en uno de los archivos CSS existentes (`components.css` o `home.css`) y usar exclusivamente variables CSS — cero colores hardcodeados, cero fonts nuevas.
- **FR-012**: La página NO DEBE incluir imágenes embebidas en `<body>` (logos de herramientas, capturas, íconos de productos), JS inline, estilos inline, ratings, votaciones ni componentes interactivos.
- **FR-013**: La página DEBE cumplir las gates existentes del proyecto sin warnings: `npm run html-validate`, `node tests/a11y.js` (con `/uses/` añadido al array de URLs auditadas), `bash tests/no-placeholders.sh`, `bash tests/external-links.sh`, `bash tests/sitemap-drift.sh`, `bash tests/csp-no-unsafe-inline.sh` y `bash tests/nav-consistency.sh`.

### Key Entities

- **UsesPage**: la página `/uses/`. Atributos relevantes para humanos: `title`, `description`, `lastUpdated` (mes/año visible + ISO date en `datetime`), lista ordenada de `Section`. Tiene exactamente un `Person` autor.
- **Section**: agrupador semántico (`<section>` con `<h2>`). Atributos: `title`, `slug` (anclaje opcional), `optional` (true para Hobbies y Abandoned). Contiene 1..N `StackItem`.
- **StackItem**: par `<dt>`/`<dd>`. Atributos: `name` (texto plano), `rationale` (1-2 líneas), `link` (opcional, externo, sin afiliado). Cero metadata adicional (sin tags, sin ratings).
- **Person**: el autor del sitio (Victor Josue Ardón Rojas). Reutiliza la identidad ya presente en `index.html` y en JSON-LD existentes; no se duplica con datos divergentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante que entra a `/uses/` puede identificar el editor, el shell, el cloud y al menos una herramienta DevOps del autor en menos de 30 segundos de scroll, sin abrir links externos.
- **SC-002**: La página obtiene Lighthouse Performance ≥ 95, Accessibility = 100, Best Practices ≥ 95 y SEO ≥ 95 en una corrida móvil simulada.
- **SC-003**: Las 7 gates de CI (`html-validate`, `a11y`, `no-placeholders`, `external-links`, `sitemap-drift`, `csp-no-unsafe-inline`, `nav-consistency`) pasan en el PR de implementación sin warnings.
- **SC-004**: La búsqueda manual `grep -RIn "rel=\"sponsored\"\|affiliate\|amzn\.to" uses/` no devuelve resultados.
- **SC-005**: El JSON-LD de la página valida sin errores en un validador externo de Schema.org y declara exactamente un `WebPage` y un `Person`.
- **SC-006**: Una persona usando solo teclado y un lector de pantalla puede llegar a `/uses/` desde cualquier otra página del sitio, recorrer todas las secciones por landmarks/headings y entender cada item sin asistencia visual.
- **SC-007**: El banner de última actualización muestra una fecha real (no `[Mes Año]`, no `TODO`, no `2024-XX`) y `bash tests/no-placeholders.sh` lo confirma.
- **SC-008**: Mantener la página al día (cambiar 1-2 items y la fecha) toma menos de 10 minutos al autor: editar `uses/index.html`, correr gates locales, abrir PR. Sin builds extra, sin generadores, sin migrar contenido entre archivos.

## Assumptions

- El nav y footer compartidos (Backlog 01 — `scripts/lib/layout.js` y los marcadores `<!-- nav:* -->` / `<!-- footer:* -->`) ya están en producción y son la fuente de verdad. La integración de `/uses/` añade una entrada al nav vía ese módulo.
- El módulo `scripts/lib/head.js` (spec 009) provee el `META_REFERRER` y los marcadores `<!-- head-meta:start -->` / `<!-- head-meta:end -->` que `build-layout.js` inyecta. `/uses/` los incluye y participa de ese flujo igual que `index.html`, `404.html` y `talks/index.html`.
- La CSP canónica del sitio (definida y verificada en spec 009) aplica sin variaciones a `/uses/`. No se requieren hashes nuevos: la página no usa scripts ni estilos inline.
- La identidad del autor (Victor Josue Ardón Rojas) ya está modelada en JSON-LD en otras páginas; se reutiliza la misma forma para `Person`.
- La fecha inicial del banner es el mes/año en que se mergea el PR de implementación (mayo 2026 si se merge en este ciclo). La cadencia esperada de update editorial es 6-12 meses; eso es compromiso editorial, no requisito técnico.
- No se introduce un sistema de generación (ni script `build-uses.js`, ni archivo `content/uses.md`): el contenido vive directamente en `uses/index.html` porque cambia 1-2 veces al año (descartado un generador por costo > beneficio).
- El `og:image` global del sitio se reutiliza para `/uses/`; no se diseña arte dedicado en este alcance.

## Out of Scope

- Sistema CMS o generador estático para la lista de herramientas.
- Imágenes/íconos/logos de cada herramienta (peso, mantenimiento y a11y negativos).
- Comparativas, reviews o rankings ("X vs Y", "top 5 …"): contenido de blog, no de `/uses/`.
- Componentes interactivos (filtros, búsqueda dentro de la página, ratings, votaciones, copia-al-portapapeles).
- Links de afiliado, patrocinios, tracking, parámetros UTM.
- Traducción a inglés u otros idiomas en este alcance (la página vive en español, consistente con el resto del sitio salvo donde explícitamente sea bilingüe).
- Versionado o histórico público de cambios del stack ("changelog de /uses/"): el historial vive en git.
- Headers HTTP custom: GitHub Pages no los permite; la política de seguridad se expresa por meta CSP y queda como deuda documentada en `docs/05-security-spec.md`.

## Constitución relevante

- **I (Spec-Driven obligatorio)** — esta spec es prerequisito de `/plan`, `/tasks`, `/implement`.
- **II (Identidad visual preservada)** — paleta, tipografías y componentes existentes; cero colores hardcodeados; uso obligatorio de tokens CSS.
- **III (Sitio 100% estático)** — `uses/index.html` plano, sin backend.
- **IV (Cero deps JS de terceros sin justificación)** — la página no requiere JS propio; cero deps nuevas.
- **V (Fonts y assets self-hosted)** — cero requests externos en runtime.
- **VI (Accesibilidad WCAG 2.1 AA)** — Lighthouse Accessibility = 100, navegación por teclado, jerarquía semántica.
- **VII (Performance)** — Lighthouse Performance ≥ 95.
- **VIII (Seguridad por defecto)** — CSP canónica, referrer policy uniforme, anti-tabnabbing en cualquier link externo, cero externals.
- **IX (Cada PR pasa todas las gates)** — 7 gates listadas en FR-013.
- **X (Documentación versionada)** — esta spec se commitea bajo `specs/010-uses-page/`.
- **XI (Hosting y dominio fijos)** — sin headers HTTP custom; toda la política vía meta.
