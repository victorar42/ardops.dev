# Feature Specification: OG images dinámicas por post

**Feature Branch**: `017-og-images-dynamic`
**Created**: 2026-05-14
**Status**: Draft
**Input**: Backlog 11 — OG images dinámicas por post (`backlog/11-og-images-dynamic.md`)

---

## Resumen ejecutivo

Hoy cada post del blog comparte la misma OG image genérica
(`public/og/og-default.png`). Cuando alguien comparte un link en
LinkedIn, X, Mastodon o Slack, la preview es indistinguible entre
posts. Esta feature genera **una OG image única por post** en
`public/og/blog/<slug>.png` (1200×630), con título + tags + branding
consistente, **en build-time**, sin runtime nuevo. Las imágenes se
commitean al repo (GitHub Pages no genera nada en CI). Un modo
`--check` detecta drift (post cambió, imagen no se regeneró). Cada
PNG pesa < 100 KB; cada post lleva `og:image`/`width`/`height`/`alt`
apuntando a su artefacto.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Lector encuentra el post compartido y le da clic (Priority: P1)

Alguien comparte un post de ardops.dev en LinkedIn. La preview muestra
una imagen 1200×630 con el **título real del post**, los **tags** del
post como chips, y el logo "ardops.dev" en mono. Es visualmente
distinguible de otros posts del mismo sitio.

**Why this priority**: el objetivo de la feature es CTR de social. Sin
esto, todo el resto es plomería.

**Independent Test**: tomar la URL de un post (ej. el post existente)
y pegarla en LinkedIn Post Inspector / opengraph.xyz; ver una imagen
con el título de **ese** post, no el OG genérico.

**Acceptance Scenarios**:

1. **Given** un post publicado con título "Mi post de prueba",
   **When** se inspecciona su `<head>`, **Then** `<meta property="og:image">`
   apunta a `https://ardops.dev/public/og/blog/<slug>.png`.
2. **Given** la PNG generada, **When** se abre, **Then** mide
   exactamente 1200×630 y muestra el título real del post.
3. **Given** un crawler de LinkedIn, **When** descarga la URL del PNG,
   **Then** recibe `200 OK`, `Content-Type: image/png`, archivo < 100 KB.

---

### User Story 2 — Autor publica un post sin pensar en la imagen (Priority: P1)

Como autor, escribo el Markdown del post con frontmatter habitual
(`title`, `slug`, `tags`, `date`, `summary`, `published: true`) y al
correr `node scripts/build-blog.js` (o el script de OG) **se genera
automáticamente** `public/og/blog/<slug>.png`. No tengo que abrir
Figma, no edito SVGs a mano.

**Why this priority**: la feature debe ser invisible para el flujo de
autoría. Si requiere pasos manuales, los voy a olvidar.

**Independent Test**: agregar un post fixture con título largo + 3
tags; correr el builder; comprobar que el PNG aparece en disco con el
título y los tags renderizados correctamente.

**Acceptance Scenarios**:

1. **Given** un post nuevo con `published: true`, **When** corre el
   builder, **Then** `public/og/blog/<slug>.png` se crea idempotente.
2. **Given** un post con `published: false` o `draft: true`, **When**
   corre el builder, **Then** no se crea PNG para ese slug.
3. **Given** un post con título largo (> 80 caracteres), **When**
   corre el builder, **Then** el título se trunca con `…` en la imagen
   y se loguea una advertencia non-fatal.
4. **Given** un post sin tags, **When** corre el builder, **Then** la
   fila de chips se omite y el layout no se rompe.

---

### User Story 3 — Drift detectado en CI (Priority: P1)

Como revisor de PR, espero que CI **falle** si el autor cambió el
título o los tags de un post pero olvidó regenerar la OG image. No
debe llegar a `main` un post con OG image desactualizada.

**Why this priority**: la integridad entre fuente y artefactos
generados es no-negociable; es el mismo patrón que ya usan
`build-layout --check`, `build-blog --check`, `build-syntax-css --check`.

**Independent Test**: editar el `title` del post fixture sin regenerar
la imagen; correr el gate; espera exit ≠ 0 con `path:line:reason`.

**Acceptance Scenarios**:

1. **Given** un post cuyo título cambió, **When** corre el gate de
   OG drift en modo `--check`, **Then** termina con exit ≠ 0 y reporta
   `path/to/post.md:N:og-drift`.
2. **Given** todos los posts en sync, **When** corre el gate, **Then**
   exit 0 con resumen "✓ N OG image(s) up to date".

---

### User Story 4 — Performance y deploy: imágenes commiteadas, livianas (Priority: P2)

Como mantenedor del repo, las imágenes commiteadas no deben hinchar
el repo ni romper el budget de bytes. Cada PNG pesa < 100 KB; el
job de byte-budgets verifica esto automáticamente.

**Why this priority**: GitHub Pages no genera en CI; las imágenes
viven en `public/og/blog/` y se sirven tal cual. Si pesan demasiado,
el budget global y la velocidad de clone degradan.

**Independent Test**: `find public/og/blog -name '*.png' -size +100k`
→ vacío; `bash tests/byte-budgets.sh` exit 0.

**Acceptance Scenarios**:

1. **Given** un post fixture con título normal, **When** se genera el
   PNG, **Then** pesa < 100 KB (verificable con `wc -c`).
2. **Given** la suite local, **When** corre `byte-budgets`, **Then** el
   límite `img-each ≤ 204 800 B` (existente) se cumple. Si introducimos
   un límite específico para OG (≤ 100 000 B), también se cumple.

---

### Edge Cases

- **Título extremadamente largo** (> 80 chars): truncar con `…`
  warning non-fatal; el build no falla.
- **Sin tags**: la fila de chips se omite; layout se mantiene; no hay
  espacio en blanco rasgado.
- **Caracteres especiales en el título** (`<`, `>`, `&`, emoji, acentos):
  escape XML correcto en la plantilla SVG; acentos se rinden por la
  font embebida; emojis pueden caer a tofu si la font no los cubre
  (aceptable; el alt text los conserva).
- **Re-render forzado**: flag `--regenerate-og` invalida el caché y
  regenera todos los PNGs (útil cuando se cambia la plantilla).
- **Post con slug que cambia**: el viejo PNG queda huérfano; el builder
  lo borra (mismo patrón que el blog builder usa con orphans HTML).
- **Posts en `_fixtures/` o `__fixtures__/`** o `published: false`: no
  generan PNG.
- **Frontmatter sin `title`**: error pre-existente del builder; esta
  feature no lo cubre.
- **El repo en clones nuevos**: las PNGs ya vienen versionadas; no se
  requiere ningún paso de bootstrap más allá de `npm install`.
- **Cambio de fuente o paleta global**: el builder detecta drift en la
  imagen aunque el frontmatter del post no haya cambiado, porque el
  hash incluye también la versión de la plantilla.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-01** — Por cada post publicado (`published: true`, fuera de
  fixtures), el builder genera `public/og/blog/<slug>.png` de
  exactamente 1200×630 pixeles.
- **FR-02** — Plantilla visual consistente con la identidad del sitio
  (Principio II):
  - Fondo: gradiente entre `--bg-primary` y `--bg-secondary`.
  - Título del post en Outfit, ~64-72 px, blanco/`--text-primary`.
  - Tags como chips abajo a la izquierda, con accent.
  - Logo "ardops.dev" abajo a la derecha en JetBrains Mono.
  - Accent rail/ornament vertical a la derecha (coherente con marca).
- **FR-03** — El `<head>` de cada post incluye
  `<meta property="og:image" content="https://ardops.dev/public/og/blog/<slug>.png">`
  apuntando al PNG generado (reemplaza el OG genérico actual).
- **FR-04** — `<head>` también incluye `<meta property="og:image:width" content="1200">`,
  `<meta property="og:image:height" content="630">`, y
  `<meta property="og:image:alt" content="<title>">` con el título del post.
  También se emite `<meta name="twitter:image">` consistente.
- **FR-05** — Modo `--check` falla con exit ≠ 0 cuando alguna PNG
  está fuera de sync (slug, título o tags del post cambiaron desde
  la última generación, o falta el archivo, o la plantilla cambió).
- **FR-06** — Las imágenes se versionan en git (no se ignoran), bajo
  `public/og/blog/`. PNGs huérfanos (slug que ya no existe) se
  eliminan automáticamente por el builder, igual que el blog builder
  hace con HTML orphan.

### Key Entities

- **OgImageJob**: una tupla `{ slug, title, tags[], templateVersion,
  outputPath }` derivada del frontmatter del post + versión de la
  plantilla; entrada para el generador.
- **OgManifest**: estructura interna (en memoria + en disco) que mapea
  `slug → hash` donde `hash = sha256(title, sorted(tags),
  templateVersion)`. Permite la detección de drift idempotente. Se
  persiste en `public/og/blog/manifest.json`.
- **OgTemplate**: plantilla SVG en `scripts/og/template.svg` con
  placeholders `{TITLE}`, `{TAGS}`, `{LOGO}`. Versionada con un
  identificador semántico en su header (`<!-- v1 -->`); cambios bumpean
  la versión y forzan regeneración.
- **OgArtifact**: archivo `public/og/blog/<slug>.png`, 1200×630, < 100 KB.
- **OgBuildLog**: salida del builder con cantidad de imágenes
  generadas, cacheadas (sin cambios), regeneradas, y huérfanas
  eliminadas.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-01** — Para cada post publicado existe exactamente un PNG en
  `public/og/blog/<slug>.png` (verificable: `ls public/og/blog/*.png |
  wc -l` == cantidad de posts publicados).
- **SC-02** — Cada PNG mide **1200×630** (verificable con `file public/og/blog/<slug>.png`).
- **SC-03** — Cada PNG pesa **< 100 KB** (verificable con `wc -c`).
- **SC-04** — El `<head>` de cada post servido referencia su OG
  correspondiente (`grep -c "/public/og/blog/<slug>.png" blog/<slug>.html` ≥ 1).
- **SC-05** — Reproducibilidad: dos corridas consecutivas del builder
  producen los mismos bytes (`md5 public/og/blog/<slug>.png` idéntico
  entre runs).
- **SC-06** — Idempotencia: si nada cambió, el segundo run NO toca
  los PNGs (verificable: `stat -f '%m'` no cambia o el builder loguea
  "0 regenerated, N cached").
- **SC-07** — Drift detection: editar el `title` de un post y correr
  `--check` termina con exit ≠ 0 en < 5 s.
- **SC-08** — Suite local completa sigue verde, incluyendo nuevo gate
  de OG (cobertura + tamaño + drift).
- **SC-09** — Lighthouse Performance ≥ 95 mantenido (las PNGs solo
  pesan en social previews, no en runtime web; no se hace `<img>`
  embebido de la OG).
- **SC-10** — `git diff package.json` introduce **solo** las
  dependencias justificadas en `research.md` (probablemente `sharp`),
  todas como **devDependencies**. Cero deps en runtime.

---

## Assumptions

- Hoy hay 1 post real publicado + 1 fixture (spec 016). La feature
  funciona con cualquier cantidad, pero el ROI real aparece a partir
  de 5+ posts (lo declara el backlog).
- Mantenemos el flujo: Markdown en `content/blog/*.md` → builder Node
  → artefactos en `blog/` y ahora también en `public/og/blog/`.
- Se mantiene `public/og/og-default.png` como fallback para páginas
  no-post (home, blog index, talks, etc.). Solo posts cambian a OG
  por slug.
- Generación elegida: **Opción A del backlog** (plantilla SVG +
  `sharp`). `satori` y `node-canvas` se rechazan en research.md
  (peso/complejidad).
- Las fuentes embebidas en el SVG son las mismas que el sitio
  (`assets/fonts/outfit-*.woff2`, `assets/fonts/jetbrains-mono-*.woff2`),
  ya self-hosted (Principio V). El SVG las referencia por path local
  durante el render con `sharp`.
- Crawlers OG (LinkedIn, X, Facebook, Slack) descargan el PNG por HTTP
  estándar sin autenticación; GitHub Pages sirve `public/og/blog/*.png`
  con `Content-Type: image/png` automáticamente.
- El SVG nunca llega al navegador del lector: es una representación
  intermedia que solo `sharp` consume en build. No hay superficie CSP
  nueva.

---

## Out of Scope

- OG images para listings (`/blog/`, `/interviews/`, `/talks/`,
  `/speaking/`, `/now/`): siguen usando `og-default.png`.
- OG video / Twitter player card.
- A/B testing de diseños OG.
- Generación dinámica server-side (requiere backend; viola Principio III).
- Multi-idioma OG (sitio primario es es-CR).
- Cache invalidation por LinkedIn/Twitter (responsabilidad de los
  inspectors de cada red, no del sitio).
- Plantillas alternativas por tag o por categoría — una sola plantilla.
- OG para posts en `_fixtures/` o `published: false`.
- Avatares/firmas en la imagen — solo título + tags + logo.
- Soporte para emoji a color (Twemoji): aceptable que caigan a tofu.

---

## Decisiones pendientes para `/speckit.plan`

- **Render engine**: confirmar `sharp ^0.33.x` como única devDep nueva
  (probable). Documentar peso unpacked vs alternativas.
- **Versionado de la plantilla**: cómo expresar `templateVersion`
  (string en SVG header, hash del archivo, o constante en el script).
  Recomendación: constante `OG_TEMPLATE_VERSION = 'v1'` en
  `scripts/build-og.js`.
- **Truncado de título**: límite exacto (¿80 chars?, ¿2 líneas?).
- **Truncado de tags**: máximo de chips visibles (¿3?, ¿4?) si el post
  tiene muchos.
- **Format del manifest**: JSON minified vs pretty; orden estable por
  slug; commiteado o regenerado.
- **CI**: ¿el gate corre en cada PR (`check:og`) o solo en main?
  Recomendación: cada PR.
- **Allowlist de cambios de plantilla**: si bumpeamos versión de
  plantilla, ¿todas las PNGs deben regenerarse en la misma PR?
  Recomendación: sí.

---

## Constitución relevante

- **II — Identidad visual preservada**: la plantilla usa exactamente
  la paleta y las fuentes existentes; no se introduce un look-and-feel
  nuevo.
- **III — Sitio 100% estático**: la generación ocurre en build; los
  PNGs son archivos planos servidos por GitHub Pages.
- **IV — Cero deps JS sin justificación**: `sharp` se documenta en
  research.md como devDep (build-only), con alternativas evaluadas.
- **V — Fonts self-hosted**: la plantilla referencia las fuentes ya
  presentes en `assets/fonts/`.
- **VII — Performance**: budget < 100 KB por PNG; cero impacto en
  Lighthouse del sitio (las OGs no se cargan en el browser web,
  solo por crawlers).
- **VIII — Seguridad**: cero CSP impact (los PNGs son `img-src 'self'`
  ya permitido; el SVG no se sirve).
- **IX — Cada PR pasa todas las gates**: nuevo gate `tests/og-images.sh`
  + integración con `byte-budgets`.
- **XII — Privacy by Default**: los crawlers de social descargan las
  imágenes desde el dominio; no se cargan ni hojas, ni cookies, ni
  trackers desde el PNG.
