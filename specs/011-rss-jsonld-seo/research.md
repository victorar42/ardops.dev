# Phase 0 — Research: RSS, JSON-LD y SEO distribution

**Feature**: 011-rss-jsonld-seo
**Date**: 2026-05-12

---

## D-001 — Formato primario de feed: RSS 2.0 vs Atom 1.0

- **Decisión**: **RSS 2.0**.
- **Rationale**: el backlog lo declara explícitamente. Cubre el ~99% de
  lectores (Feedly, Inoreader, NetNewsWire, NewsBlur, Reeder). Atom 1.0
  está fuera de scope.
- **Alternativas evaluadas**: Atom 1.0 (rechazado por out-of-scope), RSS 1.0
  (RDF, casi extinto), Atom + RSS dual (sobre-ingeniería).

## D-002 — Formato secundario: JSON Feed 1.1

- **Decisión**: **JSON Feed 1.1** (`https://jsonfeed.org/version/1.1`).
- **Rationale**: el backlog lo pide. Mismo dataset, costo marginal (un
  segundo template). Apto para readers modernos.
- **Alternativas evaluadas**: solo RSS (rechazado por backlog), JSON Feed 1.0
  (versión vieja).

## D-003 — Library vs templating manual

- **Decisión**: **templating manual** (string concat con escape estricto).
- **Rationale**: cero deps (Principio IV + FR-018 + SC-009). XML well-formed
  para RSS 2.0 es trivial: 5 entidades a escapar (`& < > ' "`). JSON Feed
  es JSON estándar, `JSON.stringify(obj, null, 2)` lo cubre todo.
- **Alternativas evaluadas**:
  - `feed` npm package (~150KB transitive): rechazado.
  - `fast-xml-parser`: solo serviría como writer (no usamos su parsing); el
    backlog lo lista como opción para validación pero `jsdom` ya cubre
    parsing en la gate sin dep nueva.
  - Templating con `<![CDATA[ ]]>` para summary/title: rechazado salvo
    justificación. Escape XML estándar es más portable y los feedreaders
    lo manejan idénticamente.

## D-004 — `lastBuildDate` y `dateModified` derivación

- **Decisión**: `lastBuildDate` (RSS) y `feed_url`/etc. son **funciones
  puras** del dataset:
  - `lastBuildDate` = max(`date`) de posts publicados (RFC 822). Si no hay
    posts, hardcoded a una fecha sentinel del repo (e.g. `'2026-01-01'`)
    documentada en el plan.
  - `dateModified` por post = `datePublished` (FR-009 + edge case del
    backlog).
- **Rationale**: builds reproducibles (cero `new Date()`). Mismo input
  → mismo output. Permite testear `lib/feeds.js` y `lib/jsonld.js` sin
  mocks (consistente con specs 008/009/010).

## D-005 — Riesgo CSP del JSON-LD

- **Decisión**: cero cambios a CSP. JSON-LD se sirve como
  `<script type="application/ld+json">…</script>`.
- **Rationale**: la spec WHATWG HTML define que cualquier `<script>` con
  `type` que NO es JavaScript (`type` distinto a `text/javascript`,
  `module`, etc.) es un "data block": el navegador NO lo ejecuta. La CSP
  `script-src 'self'` controla la **ejecución** de scripts, no la
  presencia de elementos `<script>` con types arbitrarios. Verificado en:
  - https://www.w3.org/TR/CSP3/#directive-script-src
  - https://html.spec.whatwg.org/multipage/scripting.html#data-block
- **Alternativas evaluadas**: emitir JSON-LD como archivo separado
  referenciado vía `<link rel="alternate">` (innecesario; los crawlers lo
  consumen inline sin problema).

## D-006 — Forma del `Person` (autor)

- **Decisión**: reusar el `Person` ya emitido en `index.html`, **añadiendo**
  `@id` canónico `https://ardops.dev/#person` (faltante hoy) para que
  `Article.author`/`Blog.publisher` puedan referenciarlo por `@id`. No
  se quitan campos existentes; sí se asegura que la forma es estable.
- **Rationale**: cero divergencia entre páginas; cero datos nuevos; el
  `@id` con fragment es la convención canónica para schemas distribuidos.
- **Alternativas evaluadas**:
  - Emitir el `Person` completo en cada `Article`: rechazado por
    duplicación. Crawlers entienden referencias `@id` perfectamente.

## D-007 — `Article.image` fallback

- **Decisión**: si el post no tiene `cover`, `Article.image` =
  `https://ardops.dev/public/og/og-default.png`. Si tiene `cover`, se
  emite la URL absoluta del cover (`CANONICAL_ORIGIN + '/' + post.cover`).
- **Rationale**: Schema.org `Article.image` es recomendado para rich
  snippets; nunca dejarlo vacío. El asset default ya existe (lo usan home,
  talks, uses).

## D-008 — Política `404.html` para `seo-meta.sh`

- **Decisión**: gate exige todos los meta tags de FR-013 EXCEPTO `canonical`
  (`404.html` no tiene canonical estable). Allowlist documentada en
  `scripts/check-seo-meta.js`:
  ```js
  const PER_PAGE_RULES = {
    '404.html': { skipCanonical: true },
  };
  ```
- **Rationale**: convención web — páginas 404 no deben tener `canonical`
  apuntando a sí mismas (no son indexables). El resto de meta tags
  (description, og:*, twitter:card, theme-color) sí aplican (404 también
  se shareea ocasionalmente).

## D-009 — Política `/uses/` para `jsonld-validate.sh`

- **Decisión**: la página `/uses/` ya emite `WebPage` + `Person` (spec 010).
  La gate `jsonld-validate.sh` valida solo:
  1. Cada `<script type="application/ld+json">` parsea como JSON estricto.
  2. Si declara `@id`s, los `@id` referenciados internamente existen
     (en la misma página o en la lista de `@id` globales conocidos).
- **Rationale**: la gate NO impone tipos por página (sería over-fitting).
  Cada página declara qué emite; la gate solo verifica well-formedness.
- **Alternativas evaluadas**:
  - Validar contra schema.org schemas localmente: requiere dep
    (`schema-dts`, `ajv` con json-schema): rechazado. La validación
    semántica se deja al validator externo de schema.org (smoke manual).

## D-010 — Feeds commitados vs gitignored

- **Decisión**: `blog/feed.xml` y `blog/feed.json` quedan **gitignored**,
  consistente con el patrón de `interviews/*.html` (también generados por
  build, también gitignored según `.gitignore` actual). CI los regenera
  antes de cada gate. La página `blog/*.html` actualmente está commiteada
  (revisar `.gitignore`); si el patrón cambia, este detalle se ajusta en
  research follow-up.
- **Rationale**: feeds son artefactos derivados; commitearlos genera
  diffs ruidosos en cada cambio menor.
- **Verificación**: leer `.gitignore` actual al implementar; si
  `blog/*.html` está commiteado, mantener consistencia (commit feeds
  también) para evitar half-and-half. **Lo importante** es que el patrón
  sea uniforme.

## D-011 — Estructura del bash wrapper

- **Decisión**: idéntica al patrón de spec 009. Header con `set -euo
  pipefail`, `cd "$(dirname "$0")/.."`, `exec node scripts/check-*.js`.
- **Rationale**: consistencia ≥ creatividad. Cualquier dev del repo
  reconoce el patrón.

## D-012 — Auto-discovery `<link rel="alternate">` placement

- **Decisión**: emitir los dos `<link rel="alternate" type="application/...">`
  en el `<head>` de `blog/index.html` y de cada `blog/<slug>.html`,
  inmediatamente después de los OG tags y antes de los `<link rel="stylesheet">`.
- **Rationale**: convención Google/Schema. La posición exacta no es
  semántica pero ayuda a la legibilidad y a que la gate los encuentre.

## D-013 — `ItemList` para talks/interviews

- **Decisión**: emitir `ItemList` siempre (incluso vacío). Cada
  `itemListElement` es un `ListItem` con `position`, `url`, `name`.
  Para `talks/index.html` (curado a mano), el módulo `lib/jsonld.js`
  recibe la lista hardcodeada como parámetro al renderizar la página
  (la página `talks/` se mantiene curada, no auto-generada).
- **Rationale**: schemas vacíos siguen siendo válidos. Permite a Google
  indexar estructura aunque el contenido esté vacío en una iteración.
- **Alternativa**: emitir `Event` por talk (rechazado en out-of-scope).

## D-014 — `BreadcrumbList` jerarquía

- **Decisión**:
  - `/blog/<slug>.html`: Home (`/`) → Blog (`/blog/`) → Post (`/blog/<slug>.html`).
  - `/blog/`: Home (`/`) → Blog (`/blog/`).
  - `/talks/`: Home (`/`) → Charlas (`/talks/`).
  - `/interviews/`: Home (`/`) → Entrevistas (`/interviews/`).
  - Home (`/`): NO emite breadcrumbs (es la raíz).
  - `/uses/`: NO se modifica en este alcance.
- **Rationale**: las jerarquías reflejan la nav real del sitio. Home no
  necesita breadcrumb. El `name` de cada nivel se toma del nav
  compartido (consistencia con spec 008).

---

**Output**: cero unknowns, cero `NEEDS CLARIFICATION`. Listo para Phase 1.
