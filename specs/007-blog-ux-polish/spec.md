# Feature Specification: Blog UX & Visual Polish

**Feature Branch**: `007-blog-ux-polish`
**Created**: 2026-05-11
**Status**: Draft
**Input**: Mejorar el diseño visual y la experiencia de uso del blog de ardops.dev. La spec 006 entregó la infraestructura (build, sanitizado, CI gate, primer post) pero el resultado visual no está al nivel del resto del sitio. Esta spec eleva la calidad visual y de interacción del índice `/blog/` y de las páginas de post individual al mismo pulido que el landing, agrega filtros por tag y búsqueda en cliente, y asegura legibilidad tipográfica.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Leer un post con tipografía y jerarquía cuidadas (Priority: P1)

Como visitante interesado en el contenido técnico de Josue, abro un post desde el landing o desde el índice `/blog/` y leo el artículo completo en una sola sentada. Espero una experiencia de lectura cómoda: ancho de línea óptimo, jerarquía clara entre títulos y subtítulos, bloques de código diferenciados y citas resaltadas. El contenido se siente parte de ardops.dev, no un volcado plano del navegador.

**Why this priority**: Es la promesa central del blog. Sin esto, el contenido —por más bueno que sea— se percibe como amateur y rompe la marca técnica del resto del sitio. La spec 006 entregó funcionalidad; esta spec entrega legibilidad, sin la cual el blog no cumple su propósito.

**Independent Test**: Abrir `/blog/pipeline-seguridad-spec-driven.html` en desktop y mobile, leer el artículo de principio a fin, y validar que la paleta, tipografía y componentes son visualmente consistentes con la home. Lighthouse Performance ≥ 95, axe-core sin violations.

**Acceptance Scenarios**:

1. **Given** un post publicado con encabezados H2/H3, listas, bloques de código, blockquotes y un `<div class="post-stats">`, **When** el visitante abre la URL del post en desktop, **Then** ve un contenedor de artículo con ancho legible (~680–760px), header con título grande + metadata mono, cuerpo con jerarquía tipográfica clara, código con fondo diferenciado y stat cards alineadas al estilo del landing.
2. **Given** el mismo post abierto en un viewport de 375px, **When** scrollea, **Then** el cuerpo ocupa el ancho completo con márgenes laterales mínimos, los bloques `<pre>` permiten scroll horizontal sin romper layout y las tablas se desplazan horizontalmente con indicador visual.
3. **Given** un post con al menos 3 encabezados H2, **When** se renderiza en desktop ≥ 1024px, **Then** una tabla de contenidos generada en build-time queda visible (lateral sticky o `<details>` colapsable arriba del cuerpo) con enlaces ancla a cada sección.
4. **Given** un visitante terminó de leer el post, **When** llega al footer del artículo, **Then** encuentra los tags del post, un botón "← Volver a todos los posts" y enlaces de compartir estáticos (mailto, LinkedIn share URL, X/Twitter share URL) sin scripts ni trackers.

---

### User Story 2 — Explorar y filtrar el índice del blog (Priority: P2)

Como visitante que ya conoce el blog, abro `/blog/` para encontrar un post específico. Necesito (a) ver las tarjetas con jerarquía visual clara, (b) filtrar por tag con un click, (c) buscar por texto para localizar un post puntual. La página debe seguir siendo navegable si JavaScript está desactivado.

**Why this priority**: A medida que crezca el blog, una lista plana de tarjetas se vuelve inutilizable. Filtros y búsqueda son la diferencia entre un blog que se usa y uno que se abandona. Es P2 porque con un solo post hoy la utilidad es baja, pero la arquitectura debe quedar lista para el segundo y tercer post.

**Independent Test**: Con al menos 3 posts publicados (pueden ser fixtures temporales en el build), validar que: clickear un chip de tag muestra solo los posts con ese tag; tipear en la caja de búsqueda filtra por título/summary/tags; deshabilitar JS muestra todos los posts sin filtros pero con tarjetas legibles y links funcionales.

**Acceptance Scenarios**:

1. **Given** el visitante abre `/blog/` y hay N posts publicados, **When** la página carga, **Then** ve un header de sección con título "Blog" + sublínea descriptiva, una fila de chips con todos los tags únicos (orden alfabético, con conteo opcional), una caja de búsqueda y una grilla de tarjetas de post con borde, hover y jerarquía coherente con las cards de Talks/Pipeline.
2. **Given** el visitante hace click sobre un chip de tag, **When** se activa el filtro, **Then** solo se muestran las tarjetas cuyos tags incluyen ese valor, el chip queda visualmente marcado como activo y se indica el número de resultados con `aria-live="polite"`.
3. **Given** el visitante escribe "pipeline" en la caja de búsqueda, **When** el input tiene foco y cambia, **Then** las tarjetas se filtran en menos de 100ms por substring case-insensitive sobre título + summary + tags, sin recargar la página.
4. **Given** la búsqueda no encuentra coincidencias, **When** la grilla queda vacía, **Then** se muestra un estado vacío amigable ("No encontré nada con eso. Probá otra palabra o limpiá los filtros.") con un botón "Limpiar filtros".
5. **Given** un visitante con JS desactivado, **When** abre `/blog/`, **Then** ve todas las tarjetas, los chips de tag funcionan como enlaces con `?tag=…` (o se ocultan si no se implementa la vía sin-JS), y la caja de búsqueda queda oculta o deshabilitada con un aviso, pero los posts siguen siendo navegables.

---

### User Story 3 — Continuidad visual con el landing (Priority: P2)

Como visitante que viene del landing y hace click en "Blog" o en un post, espero que el cambio de página no rompa la marca: misma paleta cyan-on-dark, misma tipografía (display + mono), mismos componentes (botones, chips, stat cards) y misma sensación general. Cualquier inconsistencia hace que el blog se sienta "pegado" al sitio.

**Why this priority**: La continuidad visual es lo que convierte un sitio en una marca. Sin esto, AC-001 falla y el trabajo de spec 001 + 005 pierde fuerza. Es P2 porque depende de US1 y US2 (entregar elementos visuales pulidos), pero el chequeo de consistencia es transversal.

**Independent Test**: Capturar screenshots side-by-side de landing, `/blog/` y un post individual; validar que la paleta, los componentes y la tipografía son indistinguibles. Ejecutar `grep` sobre el CSS para confirmar que no hay colores hardcodeados nuevos fuera de `tokens.css`.

**Acceptance Scenarios**:

1. **Given** el visitante navega desde el landing al `/blog/` y luego a un post, **When** compara visualmente las tres páginas, **Then** todos los elementos repetidos (nav, footer, botones, chips, stat cards, tipografía de headings) son visualmente idénticos.
2. **Given** un revisor inspecciona el CSS, **When** corre `grep -E "#[0-9a-fA-F]{3,6}" assets/css/`, **Then** todos los colores hex viven exclusivamente en `tokens.css`; los demás archivos CSS usan únicamente `var(--token)`.
3. **Given** el usuario activa `prefers-reduced-motion`, **When** interactúa con los chips, hovers y transiciones del blog, **Then** todas las animaciones se reducen o eliminan según `motion.css`, sin afectar la funcionalidad.

---

### Edge Cases

- **Post sin encabezados H2/H3**: la tabla de contenidos no se renderiza (no se muestra un widget vacío).
- **Post con un solo H2**: la TOC no se renderiza si los encabezados son menos del umbral configurado (por defecto: 3).
- **Post con frontmatter `cover:` ausente**: la tarjeta del índice se renderiza sin imagen, sin reservar espacio vacío.
- **Post con frontmatter `cover:` apuntando a un archivo inexistente**: el build falla con error claro (no se publica con imagen rota).
- **Tag con espacios o caracteres especiales**: se normaliza a slug en build-time para usarse en `?tag=` y en clases CSS; el chip muestra el label original.
- **Búsqueda con caracteres que rompen regex**: se escapa el input antes de comparar; nunca se interpreta como regex.
- **Búsqueda con resultados parciales en tag y título**: los matches en título pesan igual o más que matches en summary; orden interno definido por el build (no por el JS).
- **JS bloqueado por CSP o por el usuario**: el filtro por tag debe funcionar como fallback (enlaces con `?tag=…` o anclas) y la búsqueda se oculta limpiamente.
- **Más de 12 posts publicados**: la página debe seguir siendo usable; la paginación o "Cargar más" entra en escena.
- **Bloque `<pre><code>` muy ancho en mobile**: scroll horizontal interno, nunca rompe el viewport global.
- **Tabla muy ancha en mobile**: scroll horizontal interno con indicador visual.
- **Imagen embebida en el cuerpo del post sin `alt`**: el build rechaza el post con error claro.
- **Post con `<div class="post-stats">` en el cuerpo** (caso ya existente): se renderiza con el mismo estilo que en el landing, sin colisión con la nueva tipografía del cuerpo.
- **Compartir en mailto/LinkedIn/X cuando el título tiene caracteres especiales**: el título se URL-encodea correctamente.
- **TOC con encabezados que se repiten textualmente**: los IDs generados son únicos (sufijo numérico si colisionan).

## Requirements *(mandatory)*

### Functional Requirements

#### A. Página de post individual

- **FR-001**: Cada post renderizado en `/blog/<slug>.html` MUST envolverse en un `<article class="post-article">` con ancho de lectura controlado (entre ~640px y ~760px) en desktop y full-width en mobile.
- **FR-002**: El header del post MUST mostrar título (H1), fecha, tiempo de lectura y lista de tags en una fila o bloque visualmente diferenciado del cuerpo, usando tipografía mono para los metadatos.
- **FR-003**: El cuerpo del post MUST aplicar estilos diferenciados a H2, H3, H4, párrafos, listas (`ul`/`ol`), `<blockquote>`, `<code>` inline, `<pre><code>`, tablas e imágenes, reutilizando tokens existentes en `tokens.css`.
- **FR-004**: Los bloques `<pre><code>` MUST tener fondo diferenciado, padding interno, scroll horizontal en mobile, y MUST NO romper el layout en viewports ≥ 320px.
- **FR-005**: El sistema MUST soportar bloques HTML inline whitelistados (`<div class="post-stats">`, `<figure>`, `<table>`, etc., según el whitelist de spec 006) y renderizarlos con coherencia visual al landing.
- **FR-006**: El footer del post MUST mostrar (a) los tags del post, (b) un botón "← Volver a todos los posts" con clase y estilo coherente al CTA del landing, (c) tres enlaces de compartir estáticos: mailto, LinkedIn share URL, X/Twitter share URL.
- **FR-007**: Los enlaces de compartir MUST construirse en build-time con el título y URL del post correctamente URL-encodeados; MUST NO depender de JavaScript runtime ni cargar recursos third-party.
- **FR-008**: El build MUST generar una tabla de contenidos (TOC) en build-time a partir de los `<h2>` y `<h3>` del post, con IDs únicos sobre cada heading. Si el post tiene menos de un umbral configurable (por defecto 3 encabezados de nivel H2), la TOC se omite.
- **FR-009**: La TOC, si se renderiza, MUST ser visible como sticky lateral en desktop ≥ 1024px o como `<details>` colapsable arriba del cuerpo en viewports menores.
- **FR-010**: Todas las imágenes dentro del cuerpo del post MUST tener atributo `alt`. El build MUST fallar si una imagen en el body markdown no tiene texto alternativo.

#### B. Página de índice `/blog/`

- **FR-011**: La página `/blog/` MUST mostrar un header de sección con el título "Blog" y una sublínea descriptiva, consistente con el patrón `section-label` + `section-title` del landing.
- **FR-012**: Las tarjetas de post (`.post-card`) MUST tener borde, estado hover con `border-accent` y leve elevación o desplazamiento (respetando `prefers-reduced-motion`), y un layout interno con título, metadata (fecha · tiempo), summary, tags y CTA "Leer →".
- **FR-013**: La tarjeta MUST soportar un campo opcional `cover:` en el frontmatter del post; cuando está presente, se muestra una imagen al inicio de la tarjeta con `loading="lazy"`, `decoding="async"`, dimensiones explícitas y `alt` obligatorio.
- **FR-014**: El índice MUST mostrar una fila de chips de tag generada en build-time, con todos los tags únicos de los posts publicados, en orden alfabético, cada uno con su conteo entre paréntesis. Un chip "Todos" (default activo) permite limpiar el filtro.
- **FR-015**: El usuario MUST poder filtrar la grilla por tag con un único click sobre un chip, con feedback visual del chip activo y anuncio del nuevo conteo de resultados vía `aria-live="polite"`.
- **FR-016**: El usuario MUST poder buscar posts mediante una caja de texto que filtra por substring case-insensitive sobre título + summary + tags, con respuesta en menos de 100ms en cliente para hasta 100 posts.
- **FR-017**: Cuando los filtros (tag + búsqueda) no producen resultados, MUST mostrarse un estado vacío con mensaje amigable y un botón "Limpiar filtros".
- **FR-018**: Si hay más de 12 posts publicados, MUST aplicarse paginación o un mecanismo "Cargar más"; con ≤12 posts, todos se muestran en una sola vista.
- **FR-019**: El índice MUST funcionar sin JavaScript: todos los posts visibles, tarjetas navegables, búsqueda oculta o deshabilitada con aviso, filtros por tag operativos vía enlaces con `?tag=<slug>` o anclas `:target` (decisión técnica diferida a `/plan`).

#### C. Cross-cutting

- **FR-020**: Toda regla CSS nueva MUST referenciar tokens de `tokens.css`. No se introducen colores hex, valores RGB ni nombres de color literales fuera de `tokens.css`.
- **FR-021**: Si la spec requiere nuevos tokens (e.g. `--code-bg`, `--blockquote-border`, `--toc-bg`), MUST agregarse a `tokens.css` con valores derivados de la paleta existente y documentarse brevemente con un comentario adyacente.
- **FR-022**: Toda animación o transición nueva MUST vivir en `motion.css` o respetar las reglas globales de `prefers-reduced-motion` ya definidas.
- **FR-023**: El build MUST permanecer determinista: dos corridas consecutivas de `node scripts/build-blog.js` sobre el mismo input MUST producir output byte-idéntico.
- **FR-024**: El gate `node scripts/build-blog.js --check` MUST seguir verde tras la implementación, validando que el HTML emitido está en sync con el contenido fuente.
- **FR-025**: Si se introduce JavaScript de cliente, MUST servirse desde el propio dominio (`assets/js/…`), MUST cumplir con la CSP vigente (`script-src 'self'`), y MUST pesar menos de 4 KB minificado por archivo.
- **FR-026**: Toda la página del blog (índice + post) MUST pasar axe-core WCAG 2.1 AA sin violations.
- **FR-027**: El sistema MUST mantener cero dependencias runtime nuevas en `package.json`. Se permiten devDependencies adicionales si y solo si están justificadas en el plan y se ejecutan solo en build/CI.
- **FR-028**: Toda nueva página o variante (`/blog/`, `/blog/<slug>.html`) MUST listarse en `sitemap.xml` con su `<lastmod>` derivado de la fecha del post.
- **FR-029**: La meta `<title>` y `<meta name="description">` de las páginas de post MUST derivarse del título y summary del frontmatter; las de `/blog/` se mantienen estáticas.
- **FR-030**: El nav del header MUST marcar "Blog" con `aria-current="page"` tanto en `/blog/` como en cualquier `/blog/<slug>.html`.

### Key Entities

- **Post**: artículo en `content/blog/<YYYY-MM-slug>.md` con frontmatter (`title`, `slug`, `date`, `summary`, `tags`, `published`, opcional `cover`) y cuerpo Markdown. Esta spec añade el campo opcional `cover` (path a imagen en `assets/img/blog/…`).
- **TOC entry**: representación interna build-time de un heading (H2/H3) extraído del HTML sanitizado, con `id`, `level`, `text` y `slug-ancla`.
- **Tag**: string normalizado a slug para uso en URL y clases CSS; conserva el label original para mostrar al usuario.
- **Filter state** (cliente): combinación `{ tag: string|null, query: string }` aplicada sobre el conjunto de posts visibles; no persiste entre cargas salvo si se refleja en la URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La página `/blog/pipeline-seguridad-spec-driven.html` es visualmente coherente con el landing: paleta, tipografía y componentes (botones, chips, stat cards) idénticos en revisión side-by-side.
- **SC-002**: Un visitante puede leer un post de 1500 palabras (≈10 min) en desktop y mobile sin reportar fatiga visual por ancho de línea, contraste o jerarquía (validado por revisión manual contra criterios WCAG de legibilidad).
- **SC-003**: Los bloques de código son legibles, seleccionables y no rompen el layout en viewports desde 320px hasta 1920px.
- **SC-004**: En `/blog/`, las tarjetas se perciben como entidades cohesivas con jerarquía clara (título > meta > summary > tags > CTA), validado por revisión visual y por estructura semántica HTML.
- **SC-005**: Un usuario puede filtrar por tag con exactamente un click y ver el resultado en menos de 100ms.
- **SC-006**: Un usuario puede buscar posts por substring en título/summary/tags y ver el resultado en menos de 100ms para hasta 100 posts publicados.
- **SC-007**: Con JavaScript desactivado en el navegador, el 100% de los posts del índice siguen visibles y navegables.
- **SC-008**: axe-core reporta 0 violations WCAG 2.1 AA en `/blog/` y en `/blog/<slug>.html`.
- **SC-009**: Lighthouse Performance ≥ 95 mobile en `/blog/` y en `/blog/<slug>.html`.
- **SC-010**: Lighthouse Accessibility = 100, Best Practices ≥ 95 y SEO ≥ 95 en ambas páginas.
- **SC-011**: `git diff package.json package-lock.json` después de la implementación NO muestra dependencias runtime nuevas; cualquier nueva devDependency está justificada en `plan.md`.
- **SC-012**: `node scripts/build-blog.js --check` y `bash tests/blog-schema.sh` siguen pasando sin modificación funcional del gate negativo.
- **SC-013**: El bundle de JavaScript de cliente (si se introduce) pesa menos de 4 KB minificado.
- **SC-014**: El build es idempotente: dos corridas consecutivas producen HTML byte-idéntico (verificable con `git status` limpio tras la segunda corrida).
- **SC-015**: El CSS total servido al cliente crece menos de 8 KB después de gzip respecto a la baseline post-spec 006.

## Assumptions

- El visitante objetivo lee en español, en desktop o mobile reciente (últimas dos versiones mayores de Chrome, Firefox, Safari y Edge). `:has()` y CSS modernas se asumen soportados.
- El primer post (`pipeline-seguridad-spec-driven`) es la referencia de contenido válida; sirve como caso de prueba canónico para tipografía, código, blockquotes, listas y `<div class="post-stats">`.
- No se requiere migrar contenido existente fuera de regenerar el HTML del único post publicado tras los cambios de plantilla.
- El sitio sigue desplegándose en GitHub Pages como sitio estático; no hay edge runtime ni server-side rendering en runtime.
- La CSP vigente (`script-src 'self'`) no se relaja; cualquier JS de cliente vive en `assets/js/` y se sirve desde el mismo origen.
- Los nuevos tokens CSS, si se agregan, derivan visualmente de la paleta existente sin introducir contraste fuera del rango WCAG AA.
- La búsqueda en cliente trabaja sobre un índice JSON inline (`<script type="application/json">…</script>`) generado en build-time, no sobre el DOM. El tamaño de ese índice se proyecta < 50 KB hasta tener > 100 posts.
- El campo `cover` del frontmatter es opcional; los posts existentes sin ese campo se renderizan correctamente.
- El umbral mínimo de encabezados H2 para renderizar TOC se fija en 3 por defecto, configurable en el script de build si se justifica.
- Los enlaces de compartir apuntan a URLs públicas de los servicios respectivos (LinkedIn share, X/Twitter intent, mailto), sin tracking de origen.

## Dependencies

- **Spec 001 (landing-redesign)**: provee tokens, componentes base y CSP.
- **Spec 006 (blog-section)**: provee build pipeline, sanitización, schema gate y el primer post. Esta spec NO modifica el contrato de frontmatter excepto para agregar el campo opcional `cover`.
- **Constitución (II, III, IV, V, VI, VII, VIII, IX)**: gates aplicables sin excepciones.
- **Referencia visual**: `.reference/v1-design/index.html` para paleta, tipografías, escalas y componentes.

## Out of Scope

- Sistema de comentarios.
- Suscripción / newsletter.
- Analytics o tracking de cualquier tipo.
- RSS / Atom feed (puede ser una spec separada).
- Sistema de categorías o taxonomías más allá de los tags planos existentes.
- Posts relacionados / "leer también" (puede ser una spec separada).
- Internacionalización del contenido del blog.
- Editor visual o CMS; los posts se siguen creando como Markdown en el repo.
- Conversión automática de imágenes a WebP o generación de srcset; se asume que el autor entrega las imágenes en el formato correcto.

## Deferred to `/plan`

- ¿Filter/search 100% CSS (`:has()`, `:target`, checkboxes ocultos) vs. JavaScript mínimo (<4 KB) servido desde `assets/js/blog-filter.js`?
- ¿Tabla de contenidos generada en build-time (HTML estático en aside) o en runtime con JS? La preferencia documentada es build-time.
- ¿Indicador de progreso de lectura CSS puro vs. omitido? Decisión basada en relación valor/complejidad.
- Definición exacta del campo `cover` (formato esperado, tamaño máximo, ubicación en `assets/img/blog/…`).
- Estrategia de paginación para > 12 posts: numeración clásica vs. "Cargar más" con `<button>` que altera el filtro de visibilidad.
