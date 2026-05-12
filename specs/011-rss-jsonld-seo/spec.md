# Feature Specification: RSS, JSON-LD y SEO distribution

**Feature Branch**: `011-rss-jsonld-seo`
**Created**: 2026-05-12
**Status**: Draft
**Input**: User description: "Implementar el Backlog 04 — RSS, JSON-LD y SEO distribution. Generar /blog/feed.xml (RSS 2.0) y /blog/feed.json (JSON Feed 1.1) en build-time, auto-discovery con `<link rel=alternate>`, JSON-LD Article en cada post + Person en home + Blog en listing + BreadcrumbList. Gates para validar feeds y JSON-LD parseables. OG images dinámicas quedan fuera (backlog separado)."
**Source**: [`backlog/04-rss-jsonld-seo.md`](../../backlog/04-rss-jsonld-seo.md)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Lector técnico se suscribe al blog por RSS (Priority: P1) 🎯 MVP

Una persona del gremio (DevOps/security) descubre un post del blog y le gusta lo suficiente para querer enterarse de los próximos. Hoy no tiene cómo: no hay newsletter, no hay botón "follow". Después de esta feature, en el `<head>` del blog su lector RSS (Feedly, Inoreader, NetNewsWire) detecta el feed automáticamente, lo agrega con un click y empieza a recibir cada nuevo post sin esfuerzo. Si su lector prefiere JSON Feed, también funciona — ambos formatos se publican.

**Why this priority**: es el ROI principal del backlog. RSS sigue siendo el estándar de la comunidad técnica y resuelve la pregunta "¿cómo te sigo?". Sin esto, el blog pierde retención de audiencia técnica.

**Independent Test**: pegar `https://ardops.dev/blog/feed.xml` en Feedly → carga, parsea, muestra los posts; visitar `/blog/` con un lector RSS instalado → auto-discovery sugiere suscribirse; descargar `feed.xml` y validar con `xmllint --noout` → exit 0.

**Acceptance Scenarios**:

1. **Given** el sitio publicado, **When** un cliente HTTP solicita `/blog/feed.xml`, **Then** recibe un RSS 2.0 válido con `<channel>` (title, link, description, language `es-CR`, lastBuildDate, `<atom:link rel="self">`) y un `<item>` por post publicado (title, link, guid permaLink, pubDate, description = summary, `<category>` por tag).
2. **Given** el sitio publicado, **When** un cliente solicita `/blog/feed.json`, **Then** recibe JSON Feed 1.1 válido con el mismo dataset que el RSS (title, home_page_url, feed_url, language, items array con id, url, title, summary, content_html opcional, date_published, tags).
3. **Given** un visitante en `/blog/` o en cualquier `/blog/<slug>.html`, **When** su navegador o lector RSS inspecciona el `<head>`, **Then** encuentra `<link rel="alternate" type="application/rss+xml" title="ardops.dev — Blog" href="/blog/feed.xml">` y `<link rel="alternate" type="application/feed+json" title="ardops.dev — Blog" href="/blog/feed.json">`.
4. **Given** los feeds publicados, **When** se consulta `sitemap.xml`, **Then** ambos URLs (`/blog/feed.xml` y `/blog/feed.json`) están listados como `<url><loc>` propios.
5. **Given** un post con título o resumen que contiene `&`, `<`, `>`, `'`, `"`, **When** se renderiza en el RSS, **Then** los caracteres están correctamente escapados como entidades XML y el feed sigue parseando.
6. **Given** que `published.length === 0`, **When** se construye el feed, **Then** `feed.xml` y `feed.json` se emiten igual con `<channel>` o `items: []` vacíos y siguen siendo válidos.

---

### User Story 2 — Buscadores entienden la autoría y los artículos (Priority: P1)

Google indexa el sitio. Hoy el `index.html` ya emite JSON-LD `Person`. Los posts del blog **no** emiten ningún JSON-LD; los listings (`/blog/`, `/talks/`, `/interviews/`) tampoco. Tras esta feature, cada página tiene metadata estructurada que permite al motor de búsqueda asociar al autor con los artículos, mostrar rich snippets (título, fecha, autor, tags), y presentar breadcrumbs en los resultados. Un validador externo ([validator.schema.org](https://validator.schema.org)) acepta los schemas sin errores ni warnings críticos.

**Why this priority**: visibilidad estructurada en buscadores. Sin esto, el blog compite ciego en los resultados orgánicos.

**Independent Test**: pegar el HTML renderizado de home, blog index, un post, talks index, interviews index en validator.schema.org → cada página declara sus tipos esperados sin errores. Lighthouse SEO ≥ 95 en blog y posts. `bash tests/jsonld-validate.sh` → cada `<script type="application/ld+json">` parsea como JSON estricto.

**Acceptance Scenarios**:

1. **Given** la home publicada, **When** se inspecciona su JSON-LD, **Then** existe un `Person` (Victor Josue Ardón Rojas) con `@id` estable, `name`, `jobTitle`, `url`, `sameAs` (LinkedIn + GitHub) e `image`.
2. **Given** un post `/blog/<slug>.html` publicado, **When** se inspecciona su JSON-LD, **Then** existe un `Article` con `headline`, `datePublished` (ISO 8601), `dateModified` (= `datePublished` si no hay modificación explícita), `author` referenciando al `Person` por `@id`, `image` (cover si existe, fallback `og-default.png`), `publisher`, `mainEntityOfPage` (= URL canónica del post) y `keywords` (= tags separados por coma).
3. **Given** `/blog/index.html` publicada, **When** se inspecciona su JSON-LD, **Then** existe un `Blog` con `@id`, `name`, `url`, `inLanguage`, y `blogPost[]` referenciando los `Article` por `@id`.
4. **Given** `/talks/index.html` o `/interviews/index.html`, **When** se inspecciona su JSON-LD, **Then** existe un `ItemList` con `itemListElement[]` (uno por talk o entrevista listada).
5. **Given** cualquier post o listing del blog, **When** se inspecciona su JSON-LD, **Then** existe un `BreadcrumbList` con la jerarquía Home → Blog → (slug del post si aplica).
6. **Given** todos los `<script type="application/ld+json">` del sitio, **When** se ejecuta `bash tests/jsonld-validate.sh`, **Then** cada bloque parsea como JSON estricto sin error y, si declara `@id`, los `@id` referenciados internamente existen.

---

### User Story 3 — Cobertura SEO uniforme verificada por gate (Priority: P2)

Cualquier cambio futuro en una página del sitio debe mantener la cobertura mínima de meta tags SEO (canonical, description, OG tags, Twitter card, theme-color). Hoy esto se verifica a ojo. Tras esta feature, una gate automatizada `tests/seo-meta.sh` corre en CI y bloquea PRs que olviden meta tags requeridos en cualquier HTML servido. La regresión que el spec 009 evitó (CSP `'unsafe-inline'`) se replica como patrón aquí: contrato + gate.

**Why this priority**: mantiene la salud SEO del sitio en el tiempo sin dependencia de revisión humana. No bloquea US1/US2 (feeds + JSON-LD pueden mergearse antes), pero cierra el ciclo.

**Independent Test**: correr `bash tests/seo-meta.sh` localmente → verde. Borrar deliberadamente un `<meta name="description">` en `talks/index.html` → la gate falla con un mensaje claro indicando archivo y meta faltante. Restaurar → verde otra vez.

**Acceptance Scenarios**:

1. **Given** todas las páginas servidas (home, blog index, blog post, talks index, interviews index, interviews details, uses, 404), **When** se ejecuta `bash tests/seo-meta.sh`, **Then** la gate verifica en cada una la presencia de: `<link rel="canonical">`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:url">`, `<meta property="og:image">`, `<meta property="og:type">`, `<meta name="twitter:card">`, `<meta name="theme-color">`. Sale 0 si todas pasan, 1 si falta cualquiera.
2. **Given** un PR que añade una nueva página HTML servida sin los meta tags requeridos, **When** corre el job de CI correspondiente, **Then** la gate falla y bloquea el merge.
3. **Given** un cambio que quita uno de los meta tags requeridos de una página existente, **When** corre la gate, **Then** falla con mensaje `seo-meta: <archivo> falta <meta>`.

---

### Edge Cases

- **Feeds vacíos**: `published.length === 0` debe emitir feeds válidos (RSS con `<channel>` sin `<item>`s; JSON Feed con `items: []`). Los lectores no deben romperse.
- **Caracteres especiales en title/summary**: escape XML correcto en RSS (`&amp;`, `&lt;`, `&gt;`, `&apos;`, `&quot;`); en JSON, escape JSON estándar.
- **`dateModified` ausente**: usar `datePublished`. No inventar fechas ni omitir el campo.
- **Cover ausente en `Article.image`**: fallback a `https://ardops.dev/public/og/og-default.png`. Nunca dejar el campo ausente o vacío.
- **Tags vacíos o ausentes**: `Article.keywords` se omite (no se emite cadena vacía). En RSS, no se emiten `<category>`s.
- **Posts en estado teaser** (sin contenido publicado todavía): no aparecen en el feed (solo `published === true`).
- **Listings vacíos** (talks o interviews sin items en una iteración): `ItemList.itemListElement` puede ser `[]`; sigue siendo schema válido.
- **Validador externo flaky**: la gate local `tests/jsonld-validate.sh` valida parseo y consistencia interna de `@id`. La validación contra schema.org es smoke manual (AC-04 del backlog), no bloqueante en CI.
- **Página `/uses/`**: incluida en la gate `seo-meta.sh`, pero NO necesita JSON-LD adicional (ya tiene `WebPage` + `Person` por spec 010).
- **Página `/404`**: incluida en la gate `seo-meta.sh` con la salvedad documentada en código si no aplica algún tag (e.g. canonical podría apuntar a `/`); la spec define el contrato exacto en el plan.

## Requirements *(mandatory)*

### Functional Requirements

#### Feeds

- **FR-001**: El sistema DEBE generar `/blog/feed.xml` como RSS 2.0 válido en build-time, sin runtime deps. El archivo se emite por `scripts/build-blog.js` (o un módulo invocado por él).
- **FR-002**: El RSS DEBE contener: `<channel>` con `<title>`, `<link>` (`https://ardops.dev/blog/`), `<description>`, `<language>es-CR</language>`, `<lastBuildDate>` (RFC 822), `<atom:link rel="self" href="https://ardops.dev/blog/feed.xml" type="application/rss+xml">`. Por cada post publicado, un `<item>` con `<title>`, `<link>` (URL absoluta del post), `<guid isPermaLink="true">` (= `<link>`), `<pubDate>` (RFC 822 desde `datePublished`), `<description>` (= summary, escapado), y un `<category>` por cada tag.
- **FR-003**: El sistema DEBE generar `/blog/feed.json` como JSON Feed 1.1 válido (campos `version` = `https://jsonfeed.org/version/1.1`, `title`, `home_page_url`, `feed_url`, `language` = `es-CR`, `items[]` con `id` (= URL absoluta), `url`, `title`, `summary`, `date_published` (ISO 8601), `tags[]`).
- **FR-004**: El sistema DEBE escapar correctamente todos los caracteres especiales (`&`, `<`, `>`, `'`, `"`) en el RSS y aplicar escape JSON estándar en el JSON Feed. Cero CDATA salvo justificación explícita en el plan.
- **FR-005**: Cada `/blog/index.html` y cada `/blog/<slug>.html` DEBEN incluir en `<head>`, exactamente una vez cada uno: `<link rel="alternate" type="application/rss+xml" title="ardops.dev — Blog" href="/blog/feed.xml">` y `<link rel="alternate" type="application/feed+json" title="ardops.dev — Blog" href="/blog/feed.json">`.
- **FR-006**: Ambos feeds DEBEN aparecer como entradas propias en `sitemap.xml` (con `<lastmod>` igual al `lastBuildDate` del RSS). La gate `tests/sitemap-drift.sh` no debe reportar drift.
- **FR-007**: Si no hay posts publicados, los feeds DEBEN emitirse igualmente válidos (`<channel>` sin `<item>`; `items: []`). El build no falla.

#### JSON-LD estructurado

- **FR-008**: `index.html` DEBE seguir emitiendo (o emitir, si actualmente no lo hace con esa forma) un `<script type="application/ld+json">` con un `Person` con `@id` estable (`https://ardops.dev/#person`), `name`, `jobTitle`, `url`, `image`, `sameAs` (LinkedIn + GitHub).
- **FR-009**: Cada `/blog/<slug>.html` DEBE emitir un `<script type="application/ld+json">` con un `Article` con `@type`, `headline`, `datePublished`, `dateModified` (= `datePublished` si no hay modificación), `author` (referenciando el `Person` por `@id`), `image` (cover absoluto si existe, fallback `https://ardops.dev/public/og/og-default.png`), `publisher`, `mainEntityOfPage` (= URL canónica del post) y `keywords` (string con tags separados por coma) si hay tags. PLUS un `BreadcrumbList` con Home → Blog → Post.
- **FR-010**: `/blog/index.html` DEBE emitir un `<script type="application/ld+json">` con un `Blog` con `@id`, `name`, `url`, `inLanguage`, `blogPost[]` referenciando los `Article` por `@id`. PLUS un `BreadcrumbList` con Home → Blog.
- **FR-011**: `/talks/index.html` y `/interviews/index.html` DEBEN emitir cada uno un `<script type="application/ld+json">` con un `ItemList` con `itemListElement[]` por cada talk o entrevista listada (incluso si el array es vacío, el `ItemList` se emite). PLUS un `BreadcrumbList` con Home → (Talks o Entrevistas).
- **FR-012**: Todo `<script type="application/ld+json">` DEBE ser un JSON parseable (sin trailing comma, sin comentarios). Cualquier `@id` referenciado en `author`/`blogPost`/`itemListElement` DEBE existir como `@id` declarado en la misma página o documentado como referencia entre páginas (e.g. `Person` referenciado por `@id` global).

#### SEO meta uniforme

- **FR-013**: TODA página HTML servida (no fixtures) DEBE incluir: `<link rel="canonical">`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:url">`, `<meta property="og:image">`, `<meta property="og:type">`, `<meta name="twitter:card">`, `<meta name="theme-color">`. La política de qué pasa con `404.html` (canonical opcional o apuntando a `/`) se define en el plan; la gate respeta esa decisión vía allowlist documentada.
- **FR-014**: El sistema DEBE incluir una gate `tests/seo-meta.sh` (con su backing en `scripts/check-seo-meta.js`) que valide FR-013 en cada HTML servido. Sale 0 si todas las páginas cumplen, 1 si falta cualquier meta requerido (con mensaje `seo-meta: <archivo> falta <meta>`).

#### Validación

- **FR-015**: El sistema DEBE incluir una gate `tests/feed-validate.sh` que valide:
  - `/blog/feed.xml` parsea como XML bien formado.
  - Contiene exactamente un `<channel>`.
  - Cada `<item>` tiene `<title>`, `<link>`, `<guid>`, `<pubDate>`.
  - `<atom:link rel="self">` está presente y apunta a `/blog/feed.xml`.
  - `/blog/feed.json` parsea como JSON estricto.
  - `version` es `https://jsonfeed.org/version/1.1`.
  - Cada item tiene `id`, `url`, `title`, `date_published`.
- **FR-016**: El sistema DEBE incluir una gate `tests/jsonld-validate.sh` (con `scripts/check-jsonld.js`) que para cada HTML servido extraiga todo `<script type="application/ld+json">`, lo parsee como JSON estricto y, si declara `@id`s referenciados, valide que existen en la misma página (o que coinciden con los `@id` globales conocidos como `https://ardops.dev/#person`).
- **FR-017**: Las nuevas gates (`feed-validate.sh`, `jsonld-validate.sh`, `seo-meta.sh`) DEBEN integrarse a `.github/workflows/ci.yml` como jobs bloqueantes, siguiendo el mismo patrón que las gates existentes (spec 009).

#### Restricciones técnicas

- **FR-018**: Cero deps JS de terceros nuevas en runtime ni en build. Los feeds se generan con string templating + escape correcto. Cero `fast-xml-parser`, cero generadores RSS externos. La gate puede usar `jsdom` (ya en devDeps).
- **FR-019**: Los `<script type="application/ld+json">` NO deben contener marcadores `'unsafe-inline'`, hashes nuevos en CSP, ni cualquier modificación a la política CSP existente. Son scripts no-ejecutables; la CSP actual (`script-src 'self'`) los permite sin cambios.

### Key Entities

- **Feed**: representación distribuible del blog. Atributos: `format` (`rss` | `jsonfeed`), `path` (`/blog/feed.xml` | `/blog/feed.json`), `lastBuildDate`, `items[]`. Se genera en build-time desde el dataset de posts publicados.
- **FeedItem**: un post como aparece en un feed. Atributos: `id`/`guid` (URL absoluta del post), `url`, `title` (texto plano, escapado al renderizar), `summary` (escapado), `datePublished` (ISO 8601 internamente; RFC 822 al renderizar RSS), `tags[]`.
- **JsonLdBlock**: un `<script type="application/ld+json">` emitido en una página. Atributos: `type` (`Person` | `Article` | `Blog` | `ItemList` | `BreadcrumbList`), `id` (opcional, URL con fragment), `properties` específicas por tipo.
- **SeoMetaSet**: el conjunto de meta tags SEO requeridos por página. Atributos esperados: `canonical`, `description`, `og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `twitter:card`, `theme-color`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pegar `https://ardops.dev/blog/feed.xml` en Feedly carga el feed sin errores y muestra todos los posts publicados.
- **SC-002**: Ejecutar `xmllint --noout https://ardops.dev/blog/feed.xml` (o equivalente offline contra el archivo generado) sale con código 0.
- **SC-003**: Ejecutar `python -m json.tool < blog/feed.json` (o equivalente) sale 0 y muestra JSON Feed 1.1 válido.
- **SC-004**: Cada `/blog/<slug>.html` contiene exactamente un `<script type="application/ld+json">` con tipo `Article` válido y exactamente uno con `BreadcrumbList`.
- **SC-005**: Pegar el HTML completo de la home y de un post en [validator.schema.org](https://validator.schema.org) reporta cero errores.
- **SC-006**: Lighthouse SEO ≥ 95 en `/blog/` y en cada `/blog/<slug>.html` (corrida móvil simulada).
- **SC-007**: `bash tests/feed-validate.sh && bash tests/jsonld-validate.sh && bash tests/seo-meta.sh` sale 0 en main y bloquea PRs que rompan cualquiera.
- **SC-008**: Auto-discovery: cargar `/blog/` o un post en un navegador con un lector RSS (e.g. extensión NetNewsWire en Safari) sugiere suscribirse al feed sin acción manual del visitante.
- **SC-009**: La feature no introduce ninguna nueva dep de runtime ni de build (`package.json` `dependencies` y `devDependencies` no crecen, salvo justificación documentada en el plan).
- **SC-010**: La CSP de toda página servida sigue siendo idéntica a la canónica de spec 009 (verificado por `tests/csp-no-unsafe-inline.sh`); cero hashes nuevos.

## Assumptions

- El blog ya emite páginas por post via `scripts/build-blog.js` (spec 006/007) y mantiene un dataset de posts con `slug`, `title`, `summary`, `date`, `tags`, `published`, opcionalmente `cover`. Esa estructura se reutiliza tal cual.
- La identidad del autor (`Person`) ya está modelada en `index.html`; esta feature reutiliza los mismos campos. Si la forma actual diverge mínimamente del FR-008, se ajusta a la canónica documentada en el plan (sin agregar/quitar datos sensibles).
- El nuevo módulo `scripts/lib/feeds.js` y `scripts/lib/jsonld.js` son CommonJS puros sin I/O ni `Date()` global (consistentes con el patrón de spec 008/009/010 — testeable sin mocks).
- El `lastBuildDate` del RSS se deriva del `date` más reciente de los posts publicados, no de `Date.now()`. Esto mantiene los builds reproducibles.
- Los listings de talks e interviews (FR-011) usan los datasets ya existentes (`talks/index.html` curado a mano, `interviews/` generado por `scripts/build-interviews.js`).
- La gate `seo-meta.sh` reutiliza `jsdom` (ya devDep, usado por las gates 008/009).
- La integración a CI sigue el patrón de spec 009: bash wrapper en `tests/`, Node.js script en `scripts/`, job en `.github/workflows/ci.yml` que rebuilda blog + interviews antes de correr la gate.
- Se asume que el sitemap.xml continuará siendo gestionado a mano (no auto-generado para el root); las nuevas entradas (`feed.xml`, `feed.json`) se añaden manualmente en este PR.

## Out of Scope

- **OG images dinámicas** (Satori, `@vercel/og`, similar): requiere devDep nueva — diferido a backlog separado.
- **Feed por sección** (interviews-feed, talks-feed): solo blog en esta iteración.
- **Atom 1.0**: RSS 2.0 + JSON Feed cubren el 99% de readers; no se justifica un tercer formato.
- **Webmentions / IndieWeb endpoints**: diferido.
- **Microformats2 (h-card, h-entry)**: JSON-LD ya cubre máquinas; mf2 sería redundante para esta audiencia.
- **JSON-LD `Event`** para charlas: el `index.html` ya tiene un `Event` específico (Techno Week 8.0); no se generaliza en esta iteración. `talks/index.html` emitirá `ItemList`, no `Event` por talk (diferido).
- **Auto-actualización de `<lastmod>` en `sitemap.xml`** ante cada build: el sitemap sigue gestionado a mano para entradas existentes; solo se añaden las dos nuevas entradas de feeds.
- **Submission a Search Console / Bing Webmaster**: tarea operativa post-deploy, no parte del PR.

## Constitución relevante

- **I (Spec-Driven obligatorio)** — esta spec precede a `/plan`, `/tasks`, `/implement`.
- **III (Sitio 100% estático)** — feeds y JSON-LD se generan en build-time; cero runtime server.
- **IV (Cero deps JS de terceros sin justificación)** — FR-018 + SC-009 prohíben deps nuevas. XML/JSON a mano con escape correcto.
- **V (Fonts y assets self-hosted)** — feeds servidos desde el propio dominio.
- **VIII (Seguridad por defecto)** — FR-019 + SC-010 garantizan que la CSP existente no se relaja. JSON-LD no es ejecutable bajo `script-src 'self'` (la spec MIME `application/ld+json` lo deshabilita como código).
- **IX (Cada PR pasa todas las gates)** — FR-014/FR-015/FR-016/FR-017 + SC-007 establecen 3 gates nuevas bloqueantes.
- **X (Documentación versionada)** — `specs/011-rss-jsonld-seo/` se commitea.
- **XI (Hosting y dominio fijos)** — sin headers HTTP custom; las URLs de feeds viven bajo `https://ardops.dev/`.
