# Backlog 04 — RSS, JSON-LD y SEO distribution

> **Estado**: backlog · **Prioridad**: P1
> **Esfuerzo estimado**: M (~1 día) · **ROI networking**: **muy alto**

---

## Por qué

Hoy alguien que llega al blog y le gusta un post **no tiene forma de
suscribirse**. Para una audiencia técnica (DevOps/security), RSS sigue siendo
estándar (Feedly, Inoreader, NetNewsWire). Es cero esfuerzo en build y
máxima portabilidad.

Además, agregar **JSON-LD estructurado** (Article, Person, BreadcrumbList)
le permite a Google entender quién sos y qué publicás, mejorando rich
snippets y autoría.

## Objetivo

Generar feeds y metadata estructurada en build time, sin runtime deps,
para que el blog sea "descubrible y suscribible".

## Alcance funcional (FRs)

### Feeds

- **FR-01** — RSS 2.0 en `/blog/feed.xml`, generado por
  `scripts/build-blog.js`. Incluye:
  - `<channel>` con `<title>`, `<link>`, `<description>`, `<language>es-CR`,
    `<lastBuildDate>`, `<atom:link rel="self">`.
  - `<item>` por post publicado: `<title>`, `<link>`, `<guid isPermaLink>`,
    `<pubDate>`, `<description>` (= summary, escapado), `<category>` por tag.
- **FR-02** — JSON Feed 1.1 en `/blog/feed.json` (mismo dataset que RSS).
- **FR-03** — Auto-discovery: cada `/blog/index.html` y `/blog/<slug>.html`
  incluye en `<head>`:
  ```html
  <link rel="alternate" type="application/rss+xml" title="ardops.dev — Blog"
        href="/blog/feed.xml">
  <link rel="alternate" type="application/feed+json" title="ardops.dev — Blog"
        href="/blog/feed.json">
  ```
- **FR-04** — Los feeds se incluyen en `sitemap.xml` (ambos URLs).

### JSON-LD estructurado

- **FR-05** — `index.html` (home) emite JSON-LD `Person` con:
  `name`, `jobTitle`, `url`, `sameAs` (LinkedIn, GitHub), `image`,
  `worksFor` (opcional).
- **FR-06** — Cada `/blog/<slug>.html` emite JSON-LD `Article` con:
  `headline`, `datePublished`, `dateModified` (= datePublished si no hay
  modificación), `author` (referenciando al `Person`), `image`
  (cover si existe, sino OG default), `publisher`, `mainEntityOfPage`,
  `keywords` (= tags).
- **FR-07** — `/blog/index.html` emite JSON-LD `Blog` referenciando los posts.
- **FR-08** — `/talks/index.html` y `/interviews/index.html` emiten
  JSON-LD `ItemList` (no `Event` por ahora — diferido).
- **FR-09** — Posts y listings emiten `BreadcrumbList` (Home → Blog → Post).

### SEO meta

- **FR-10** — Verificar que **todas** las páginas tienen:
  `<link rel="canonical">`, `<meta name="description">`, `<meta property="og:*">`,
  `<meta name="twitter:card">`, `<meta name="theme-color">`.
- **FR-11** — Gate `tests/seo-meta.sh` que valida la presencia de todos los
  meta tags requeridos en cada HTML servido.

## Alcance técnico

- Nuevo módulo `scripts/lib/feeds.js` con `renderRss(posts)` y
  `renderJsonFeed(posts)`. Cero deps (XML a mano con escape correcto).
- Nuevo módulo `scripts/lib/jsonld.js` con builders por tipo
  (`personSchema()`, `articleSchema(post)`, `blogSchema(posts)`,
  `breadcrumbsSchema(path)`).
- `scripts/build-blog.js` invoca ambos módulos.
- JSON-LD se emite como `<script type="application/ld+json">…</script>`.
  Esto **no viola CSP** (`script-src 'self'`) porque scripts type
  `application/ld+json` no son ejecutables.

## Gates / tests

- `tests/feed-validate.sh`: valida XML del RSS con un parser simple
  (puede usar el `jsdom` ya en devDeps con application/xml mode, o
  `fast-xml-parser` si se justifica).
- `tests/jsonld-validate.sh`: parsea cada `<script type="application/ld+json">`
  como JSON estricto (debe parsear sin errores).
- `tests/seo-meta.sh`: nuevo, ver FR-11.
- `npm run html-validate` debe pasar.

## Out of scope

- **OG images dinámicas** (Satori / @vercel/og) — diferido a backlog
  separado por costo de devDep.
- Feed por sección (interviews, talks) — solo blog en esta iteración.
- Atom 1.0 — RSS 2.0 + JSON Feed cubren 99% de readers.
- Webmentions / IndieWeb — diferido.
- Microformats2 (h-card, h-entry) — diferido, JSON-LD ya cubre máquinas.

## Edge cases

- Si `published.length === 0`, el RSS debe emitirse igual con `<channel>`
  vacío (no romper readers existentes).
- Posts con caracteres especiales en title/summary: escape XML correcto
  (`&`, `<`, `>`, `'`, `"`).
- `dateModified` ausente → usar `datePublished` (no inventar fechas).
- Cover ausente en JSON-LD `image` → fallback a `og-default.png`.

## Criterios de aceptación

- AC-01: `curl https://ardops.dev/blog/feed.xml | xmllint --noout -` exit 0.
- AC-02: Pegar `https://ardops.dev/blog/feed.xml` en Feedly funciona.
- AC-03: Cada post tiene exactamente un `<script type="application/ld+json">`
  con un `Article` válido.
- AC-04: [validator.schema.org](https://validator.schema.org) acepta el
  JSON-LD del home y de un post.
- AC-05: Lighthouse SEO ≥ 95 en blog y posts.
- AC-06: `bash tests/seo-meta.sh && bash tests/feed-validate.sh` pasan.

## Constitución relevante

- I (intencionalidad — visibilidad), III (zero deps), IV (security — JSON-LD
  no es ejecutable), IX (validation).

## Notas para `/specify`

> "Generar /blog/feed.xml (RSS 2.0) y /blog/feed.json (JSON Feed 1.1) en
> build-time, auto-discovery con `<link rel=alternate>`, JSON-LD Article
> en cada post + Person en home + Blog en listing + BreadcrumbList. Gates
> para validar feeds y JSON-LD parseables. OG images dinámicas quedan fuera
> (backlog separado)."
