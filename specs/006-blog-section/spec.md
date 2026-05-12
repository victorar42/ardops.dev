# Feature Specification: Sección "Blog" en landing + página /blog/ refactorizada

**Feature Branch**: `006-blog-section`
**Created**: 2026-05-11
**Status**: Draft
**Input**: Brief del autor (2026-05-11): reemplazar la sección actual `#security-pipeline` del landing por una sección `#blog` mantenible con los 3 posts más recientes; refactorizar la página standalone `/blog/` para que sea el índice completo; el primer post —"Cómo construí mi pipeline de seguridad spec-driven" (slug `pipeline-seguridad-spec-driven`)— absorbe el contenido del pipeline DevSecOps en tono de primera persona y embebe las 4 stat cards técnicas inline; las 4 stat cards de `#about` se reemplazan por stats personales y se agrega una foto circular (256×256 webp).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visitante lee posts firmados desde el landing (Priority: P1)

Un visitante técnico (recruiter, colega DevSecOps, organizador de meetup) llega al landing y, al desplazarse, encuentra la sección "Blog" donde antes existía el `#security-pipeline`. Ve los 3 posts más recientes con título, fecha, tiempo estimado de lectura, tags y un resumen breve, y un enlace claro "Ver todos" hacia `/blog/`. Al hacer click en cualquier post, llega al artículo completo en `/blog/<slug>/`, narrado en primera persona, donde —en el caso del primer post— las 4 stat cards técnicas (7 etapas / 0 costo / 100% cobertura / <5 min) aparecen embebidas inline dentro del contenido.

**Why this priority**: es el corazón del cambio. Sin esto, el sitio sigue mostrando un pipeline DevSecOps impersonal y `/blog/` sigue siendo un teaser vacío. Es además la única funcionalidad imprescindible para reemplazar `#security-pipeline` y dar voz propia al sitio.

**Independent Test**: cargar el landing → desplazarse a `#blog` → confirmar 3 cards de post visibles + enlace "Ver todos". Hacer click en el primer post → confirmar página `/blog/pipeline-seguridad-spec-driven/` con título, fecha, tiempo de lectura, tags, contenido en primera persona y las 4 stat cards técnicas renderizadas inline. La sección entrega valor incluso si solo existe el primer post.

**Acceptance Scenarios**:

1. **Given** existe al menos un post publicado en `content/blog/`, **When** el visitante carga el landing, **Then** ve la sección `#blog` con un encabezado "Blog" (con su `section-label` `// blog`) y hasta 3 cards de post ordenadas por fecha descendente.
2. **Given** existen menos de 3 posts publicados, **When** el visitante carga el landing, **Then** la sección muestra los posts disponibles sin layout roto y sin huecos visuales.
3. **Given** el visitante mira la sección `#blog` en el landing, **When** observa el final de la lista, **Then** ve un enlace "Ver todos" claramente identificable que navega a `/blog/`.
4. **Given** el visitante hace click en una card de post, **When** la página carga, **Then** ve `/blog/<slug>/` con título, fecha visible, tiempo estimado de lectura, tags y contenido completo del post.
5. **Given** el visitante abre el post `pipeline-seguridad-spec-driven`, **When** llega a la sección de beneficios, **Then** ve las 4 stat cards técnicas (7 etapas / 0 costo / 100% cobertura / <5 min) embebidas inline dentro del contenido, con el mismo estilo visual del resto de stat cards del sitio.

---

### User Story 2 — Visitante explora todo el blog en /blog/ (Priority: P1)

Un visitante interesado quiere ver todo lo que se ha publicado, no solo lo más reciente. Entra a `/blog/` (vía la entrada "Blog" del nav o vía el enlace "Ver todos" del landing) y ve el índice completo de posts publicados ordenados por fecha descendente. Cada entrada muestra título, fecha, tiempo estimado de lectura, tags y resumen, con enlace al post completo.

**Why this priority**: sin la página `/blog/` funcional, el enlace "Ver todos" del landing no entrega valor y el nav apunta a una página teaser. Es P1 porque ambos —landing y `/blog/`— deben quedar consistentes en el mismo merge para que el flujo de navegación tenga sentido.

**Independent Test**: navegar a `/blog/` directamente → confirmar listado completo de posts publicados, ordenados por fecha descendente, con título, fecha, tiempo de lectura, tags y resumen visibles para cada uno. Verificar que el nav superior muestra "Blog" y que ese enlace lleva a `/blog/` (no a `#blog` del landing).

**Acceptance Scenarios**:

1. **Given** existen posts publicados en `content/blog/`, **When** el visitante navega a `/blog/`, **Then** ve el listado completo ordenado por fecha descendente, sin paginación.
2. **Given** el visitante observa el nav superior en cualquier página, **When** mira los enlaces, **Then** ve una entrada "Blog" que enlaza a `/blog/` (no al ancla del landing).
3. **Given** un post tiene `published: false` en su frontmatter, **When** el visitante carga `/blog/`, **Then** ese post no aparece en el listado y tampoco se genera su página individual.
4. **Given** no hay posts publicados (`content/blog/` vacío o todos con `published: false`), **When** el visitante carga `/blog/`, **Then** ve un estado vacío respetuoso con la voz del sitio, sin layout roto.

---

### User Story 3 — Mantenedor agrega un post nuevo sin tocar HTML (Priority: P2)

El autor del sitio (Victor) decide publicar un post nuevo. Crea un archivo `.md` en `content/blog/` con frontmatter (título, fecha, slug, summary, tags, published) y el cuerpo en markdown, ejecuta el script de build, y al desplegar el sitio el post aparece automáticamente: como card en el landing (si está dentro de los 3 más recientes), como entrada en `/blog/`, y como página individual en `/blog/<slug>/`. No tocó `index.html`, ni `blog/index.html`, ni CSS, ni JS.

**Why this priority**: la mantenibilidad es lo que justifica refactorizar todo el sistema. Sin esto, agregar el segundo post obliga a editar HTML manualmente y la voz pública se estanca. No es P1 porque el primer merge puede entregarse con un solo post (el de pipeline) y validar el flujo, pero la spec no se considera completa sin esta historia.

**Independent Test**: crear `content/blog/2026-06-test-post.md` con frontmatter válido y body de 200 palabras → ejecutar `node scripts/build-blog.js` → verificar que (a) `blog/test-post.html` existe y se renderiza correctamente, (b) `/blog/index.html` lo lista, (c) `index.html` lo incluye entre los 3 más recientes (si corresponde por fecha). Borrar el archivo, rebuild, verificar que desaparece de los tres lugares.

**Acceptance Scenarios**:

1. **Given** un nuevo `.md` con frontmatter válido en `content/blog/`, **When** el mantenedor ejecuta el build, **Then** se genera la página individual del post, se actualiza el índice de `/blog/` y se actualiza el listado del landing entre markers, sin necesidad de editar HTML manualmente.
2. **Given** el mantenedor cambia `published: true` a `published: false` en un post, **When** rebuilds, **Then** el post desaparece del landing, de `/blog/` y su página individual ya no se genera (o se elimina si existía).
3. **Given** un nuevo post tiene fecha más reciente que los actuales, **When** rebuilds, **Then** ese post aparece en primera posición en el landing y en `/blog/`, y el más antiguo de los 3 del landing es desplazado fuera del listado del landing pero sigue presente en `/blog/`.
4. **Given** el archivo `.md` tiene frontmatter inválido (campo faltante, slug duplicado, fecha no parseable, summary fuera de rango), **When** el mantenedor ejecuta el build, **Then** el build falla con un mensaje accionable indicando archivo y problema, sin emitir HTML parcial.

---

### User Story 4 — Visitante reconoce a Victor en #about (Priority: P2)

Un visitante observa la sección `#about` del landing y ve una foto circular de Victor (256×256), junto con 4 stat cards que comunican trayectoria personal: 17 años en desarrollo de software, 10 años en DevOps, +12 clientes (bancos LATAM + corporaciones internacionales), 1% mejor cada día. Estas cifras reemplazan a las 4 stat cards técnicas que antes describían el pipeline DevSecOps, las cuales ahora viven embebidas dentro del primer post.

**Why this priority**: refuerza la narrativa de voz propia que el blog inaugura. Sin este cambio, `#about` sigue mostrando métricas técnicas del pipeline en un contexto donde el pipeline ya no es la sección principal. No es P1 porque US1 y US2 entregan el valor del blog en sí, pero el cambio de stats + foto debe acompañar al merge para que la página completa se sienta coherente.

**Independent Test**: cargar el landing → desplazarse a `#about` → confirmar foto circular (256×256, webp, alt no vacío, lazy load) y 4 stat cards con los números nuevos (17 / 10 / +12 / 1%) y sus etiquetas en español.

**Acceptance Scenarios**:

1. **Given** el visitante carga el landing, **When** llega a la sección `#about`, **Then** ve una imagen circular de 256×256 px en formato webp con atributo `alt` descriptivo no vacío y atributo `loading="lazy"`.
2. **Given** el visitante observa las stat cards de `#about`, **When** las lee, **Then** ve 4 tarjetas con los valores 17 / 10 / +12 / 1% y sus etiquetas correspondientes (años en desarrollo, años en DevOps, clientes, mejor cada día).
3. **Given** el visitante carga el landing en mobile (320 / 360 / 768 px), **When** mira `#about`, **Then** la foto y las stat cards se adaptan sin scroll horizontal, manteniendo legibilidad y proporciones.
4. **Given** la imagen no se puede cargar, **When** el navegador renderiza `#about`, **Then** se muestra el texto alternativo en su lugar y el layout no se rompe.

---

### User Story 5 — Visitante con limitaciones de color y de teclado navega el blog (Priority: P3)

Un visitante con daltonismo, con tema de alto contraste, o que navega solo con teclado, accede al landing y a `/blog/`. Aún sin distinguir matices de color, identifica qué es título, qué es metadato (fecha, tiempo de lectura) y qué es enlace; navega entre cards y al post completo usando solo Tab/Enter; el foco es siempre visible respetando los tokens del sitio.

**Why this priority**: requisito derivado de la constitución VI (WCAG 2.1 AA). No es P1 porque US1/US2 ya entregan el valor principal, pero el merge no se aprueba sin cumplirlo. Validación automatizada vía la gate `tests/a11y.js` ya existente.

**Independent Test**: cargar landing y `/blog/` en modo grayscale (DevTools → Rendering → Achromatopsia) y navegar solo con teclado. Confirmar que el contenido sigue siendo distinguible y que todas las cards y enlaces son alcanzables vía Tab con foco visible. Ejecutar `node tests/a11y.js` y obtener cero violaciones WCAG 2.1 AA en landing, `/blog/` y al menos un post individual.

**Acceptance Scenarios**:

1. **Given** la sección `#blog` del landing y la página `/blog/` están renderizadas y el visitante usa simulación de Achromatopsia, **When** observa las cards de post, **Then** título, fecha, tiempo de lectura, tags, summary y enlace son distinguibles por jerarquía/peso/posición, no solo por color.
2. **Given** la suite a11y corre contra el landing, `/blog/` y al menos un post individual, **When** se completa, **Then** reporta cero violaciones WCAG 2.1 AA (axe-core).
3. **Given** un visitante navega solo con teclado, **When** entra a `#blog` o a `/blog/`, **Then** cada card de post (o su enlace principal) es alcanzable vía Tab y el foco es visible.

---

### Edge Cases

- ¿Qué pasa si un `.md` en `content/blog/` no tiene frontmatter o tiene frontmatter inválido (campo faltante, fecha no parseable, slug duplicado, summary vacío o fuera de rango)? El build debe fallar con mensaje accionable que identifique archivo y problema; no debe emitir HTML parcial.
- ¿Qué pasa si dos posts tienen el mismo `slug`? Build debe fallar (slug es clave única para la URL).
- ¿Qué pasa si un post contiene HTML peligroso en el cuerpo (`<script>`, `on*=`, `javascript:`, `<iframe>`)? El sanitizador (igual patrón que spec 003) debe removerlo antes de emitir HTML; debe existir un fixture negativo automatizado que lo verifique.
- ¿Qué pasa si todos los posts tienen `published: false` o `content/blog/` está vacío? El landing muestra un estado vacío respetuoso en `#blog`, `/blog/` muestra un estado vacío equivalente, y no se generan páginas individuales.
- ¿Qué pasa si un post tiene fecha futura? Decisión a definir en plan: o se trata como `published: false` hasta que llegue la fecha, o se publica de inmediato. La spec acepta cualquiera de las dos siempre que el comportamiento sea determinista y documentado.
- ¿Qué pasa con anclas legacy hacia `#security-pipeline` (si existieran enlaces externos)? La sección desaparece; el ancla no se mantiene. El primer post absorbe todo el contenido y queda accesible en `/blog/pipeline-seguridad-spec-driven/`.
- ¿Qué pasa si el HTML inline embebido en un post (las 4 stat cards) se modifica para incluir clases o atributos no permitidos por el sanitizador? El sanitizador debe rechazarlo o limpiarlo; el post debe degradar a contenido textual sin romper layout.
- ¿Qué pasa en viewports muy estrechos (≤ 380 px)? Las cards del listado y la grilla de stat cards embebidas en el post degradan a una columna sin scroll horizontal forzado.
- ¿Qué pasa si el landing y `/blog/` quedan desincronizados del contenido en `content/blog/` (por ejemplo, alguien commitea sin correr el build)? La gate CI `blog-build-check` debe fallar y bloquear el merge.
- ¿Qué pasa si la imagen de `#about` falta? El sitio sigue funcionando (alt visible) pero un test de assets puede señalarlo en el plan.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Sección Blog en el landing

- **FR-001**: El landing MUST exponer una sección identificable como "Blog" con `section-label` (`// blog`) y `section-title` ("Blog" o equivalente), reemplazando completamente la sección actual `#security-pipeline` (líneas 188-216 de `index.html`).
- **FR-002**: La sección `#blog` del landing MUST listar exactamente los **3 posts más recientes** (por fecha descendente) entre los publicados; si hay menos de 3, MUST listar todos los disponibles sin layout roto.
- **FR-003**: Cada card de post en el landing MUST exponer al visitante: título, fecha, tiempo estimado de lectura, tags y summary breve.
- **FR-004**: La sección `#blog` del landing MUST incluir un enlace "Ver todos" claramente identificable que navegue a `/blog/`.
- **FR-005**: El listado de posts del landing MUST renderizarse entre marker comments (mismo patrón que spec 005 pipeline) y MUST regenerarse automáticamente al ejecutar el build, sin intervención manual sobre `index.html`.

#### Página /blog/

- **FR-006**: La página `/blog/` MUST listar **todos los posts publicados** (`published: true`), ordenados por fecha descendente, sin paginación en este iterado.
- **FR-007**: Cada entrada en `/blog/` MUST exponer: título, fecha, tiempo estimado de lectura, tags y summary, con enlace al post completo.
- **FR-008**: Si no hay posts publicados, `/blog/` MUST mostrar un estado vacío respetuoso con la voz del sitio, sin layout roto.
- **FR-009**: La página `/blog/` MUST regenerarse en build (ya sea por marker block o por reemplazo completo); el mantenedor NO debe editar manualmente su contenido al agregar/quitar posts.

#### Posts individuales

- **FR-010**: Cada post publicado MUST emitirse como página estática individual en `/blog/<slug>/` (o `blog/<slug>.html`, equivalente servible por GitHub Pages).
- **FR-011**: Cada post individual MUST mostrar: título, fecha visible, tiempo estimado de lectura, tags y contenido completo del cuerpo.
- **FR-012**: El sistema MUST calcular automáticamente el tiempo estimado de lectura de cada post (basado en conteo de palabras del cuerpo) y exponerlo tanto en la card del listado como en el post individual.
- **FR-013**: El sistema MUST permitir HTML inline dentro del markdown sanitizado para casos como las 4 stat cards técnicas embebidas en el primer post; el conjunto de etiquetas y atributos permitidos MUST quedar definido en el plan y MUST excluir vectores de XSS conocidos (`<script>`, `<iframe>`, `on*`, `javascript:`).

#### Storage y validación de contenido

- **FR-014**: Los posts MUST almacenarse en `content/blog/*.md`, un archivo por post, con frontmatter que incluye al menos: `title`, `date`, `slug`, `summary`, `tags`, `published`.
- **FR-015**: El sistema MUST validar al build (estricto, modo CI) que cada post tiene: `title` no vacío, `date` parseable, `slug` único en formato slug-style, `summary` no vacío y dentro de un rango de longitud razonable (definir cota concreta en plan), `tags` como lista (puede ser vacía), `published` booleano. Cualquier post inválido MUST hacer fallar el build con mensaje accionable indicando archivo y problema.
- **FR-016**: El sistema MUST sanitizar el cuerpo markdown antes de emitir HTML, removiendo o neutralizando vectores de XSS, siguiendo el mismo patrón que spec 003 (interviews) — sin agregar dependencias JS de runtime.
- **FR-017**: Posts con `published: false` MUST ser excluidos del landing, de `/blog/` y NO MUST tener página individual emitida.

#### Navegación

- **FR-018**: El nav superior MUST incluir una entrada visible "Blog" que enlace a `/blog/` (no al ancla del landing). Esta entrada reemplaza cualquier enlace previo a `#blog` o `#security-pipeline` en el nav.

#### Sección #about

- **FR-019**: La sección `#about` del landing MUST reemplazar las 4 stat cards técnicas actuales (líneas 247-266) por 4 stat cards personales con los siguientes valores y etiquetas:
  - 17 — Años en desarrollo de software
  - 10 — Años en DevOps
  - +12 — Clientes (bancos LATAM + corporaciones internacionales)
  - 1% — Mejor cada día
- **FR-020**: La sección `#about` MUST incluir una foto personal circular de 256×256 px en formato webp, con atributo `alt` descriptivo no vacío y carga diferida (lazy load).

#### Build, CI y mantenibilidad

- **FR-021**: Agregar, editar o remover un post MUST requerir editar únicamente archivos en `content/blog/` (y opcionalmente `README` o `quickstart`); NO debe requerir modificar `index.html`, `blog/index.html`, CSS ni JS.
- **FR-022**: Debe existir un script `scripts/build-blog.js` (alineado con el patrón de `scripts/build-interviews.js` y `scripts/build-pipeline.js`) que: valida frontmatter, sanitiza markdown, emite páginas individuales en `blog/<slug>.html`, regenera `blog/index.html` y actualiza el listado del landing entre markers.
- **FR-023**: Debe existir una gate CI nueva `blog-build-check` (mismo patrón que `pipeline-build-check`) que ejecute el build en modo `--check` y falle si `index.html` del landing o `blog/index.html` están desincronizados del contenido en `content/blog/`.
- **FR-024**: Debe existir una gate CI de validación de frontmatter de posts con fixtures negativos cubriendo al menos: frontmatter faltante o inválido, slug duplicado, fecha inválida, summary fuera de rango, HTML peligroso (script, on*, javascript:).
- **FR-025**: La feature MUST integrarse con el flujo de build/CI existente sin agregar dependencias JS de runtime (constitución III/IV); el procesamiento ocurre en build-time.

#### Compatibilidad técnica y estética

- **FR-026**: La sección `#blog` del landing y la página `/blog/` MUST renderizarse correctamente en viewports desde 320 px de ancho hasta desktop, sin scroll horizontal y con todo el contenido legible.
- **FR-027**: La feature MUST cumplir WCAG 2.1 AA (validable con `tests/a11y.js`) en landing, `/blog/` y al menos un post individual: foco visible, contraste mínimo, semántica adecuada (`section`, `article`, `aria-labelledby`, listas marcadas como tales), navegación por teclado.
- **FR-028**: La feature MUST reusar tokens del design system (variables CSS existentes); NO debe introducir colores ni fonts nuevas.
- **FR-029**: La feature MUST mantener la CSP estricta del sitio: sin inline JS, sin inline styles (excepto el CSS crítico ya declarado), sin dependencias de terceros en runtime.

#### Primer post

- **FR-030**: Debe crearse el primer post en `content/blog/` con `slug: pipeline-seguridad-spec-driven` y título "Cómo construí mi pipeline de seguridad spec-driven", narrado en primera persona, mencionando las 7 herramientas/etapas actuales (Spectral, Semgrep, Gitleaks, npm audit, OWASP ZAP, Custom Action de compliance, CodeQL/GHAS) como decisiones de diseño y no como cards de demo.
- **FR-031**: El primer post MUST embeber, dentro de su sección de beneficios, las 4 stat cards técnicas (7 etapas / 0 costo de licencias / 100% cobertura / <5 min) renderizadas como HTML inline sanitizado, conservando consistencia visual con las stat cards del sitio.

---

### Key Entities

- **BlogPost**: representa un post publicable. Atributos: `title` (string, no vacío), `date` (fecha parseable, visible), `slug` (string slug-style, único, define la URL), `summary` (string corto, dentro de rango definido en plan), `tags` (lista de strings, puede ser vacía), `published` (booleano), `body` (markdown, posiblemente con HTML inline restringido), `readingTime` (calculado, no parte del frontmatter).
- **BlogContentDirectory**: directorio `content/blog/` con un archivo `.md` por post. Es la única fuente de verdad de qué se publica.
- **LandingBlogList**: bloque marker-delimited dentro de `index.html` donde se renderizan en build las cards de los 3 posts más recientes. No editable manualmente.
- **BlogIndexPage**: página `/blog/index.html` regenerada en build a partir del contenido de `content/blog/`.
- **BlogPostPage**: página estática individual `/blog/<slug>.html` (o equivalente servible) emitida en build para cada post con `published: true`.
- **AboutStat**: stat card de la sección `#about` con valor (17, 10, +12, 1%) y etiqueta en español. Catálogo cerrado de 4 entradas en este iterado.
- **AboutPortrait**: imagen circular de Victor en `#about`, 256×256 px, formato webp, alt obligatorio, lazy load.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante nuevo, en menos de 15 segundos en el landing, identifica que existe una sección "Blog" con posts firmados y sabe a dónde ir para ver todos (validable manual con al menos 3 personas).
- **SC-002**: 100% de los posts mostrados en landing y `/blog/` se generan exclusivamente desde `content/blog/`; cero contenido de post hardcodeado en `index.html` o `blog/index.html` (validable por inspección de diff y por la gate `blog-build-check`).
- **SC-003**: El tiempo entre "agregar un `.md` válido en `content/blog/` y correr el build" y "ver el post publicado en landing, `/blog/` y `/blog/<slug>/`" es ≤ 60 segundos en local, sin tocar otros archivos.
- **SC-004**: La gate de accesibilidad (`tests/a11y.js` con axe-core, WCAG 2.1 AA) reporta cero violaciones en landing, `/blog/` y al menos un post individual tras el merge.
- **SC-005**: Landing, `/blog/` y al menos un post individual renderizan correctamente y sin scroll horizontal en al menos los breakpoints 320 px, 360 px, 768 px, 1024 px y 1440 px.
- **SC-006**: Un post con frontmatter inválido (campo faltante, slug duplicado, fecha inválida, summary fuera de rango, HTML peligroso) MUST hacer fallar el build/CI; verificable mediante fixtures negativos automatizados que cubran cada caso.
- **SC-007**: Lighthouse Performance se mantiene ≥ 95 en landing, `/blog/` y un post individual tras el merge (constitución VII).
- **SC-008**: Al menos 1 post real publicado al merge inicial (`pipeline-seguridad-spec-driven`), narrado en primera persona, con las 4 stat cards técnicas embebidas inline correctamente sanitizadas.
- **SC-009**: La gate `blog-build-check` falla en CI si alguien commitea un cambio en `content/blog/` sin regenerar `index.html` o `blog/index.html`; verificable mediante un PR de prueba.
- **SC-010**: El nav superior, en todas las páginas del sitio, muestra una entrada "Blog" que navega a `/blog/`; verificable por inspección automatizada del HTML de cada página.
- **SC-011**: La sección `#about` muestra las 4 stat cards personales (17 / 10 / +12 / 1%) y la foto circular 256×256 webp con alt no vacío y `loading="lazy"`; verificable por inspección automatizada del HTML.
- **SC-012**: Cero errores `html-validate` en landing, `/blog/` y al menos un post individual tras el merge.

---

## Assumptions

- La sección `#security-pipeline` actual (líneas 188-216 de `index.html`) se elimina por completo. Su contenido conceptual (las 7 herramientas/etapas) vive ahora dentro del primer post como narrativa de primera persona; el ancla `#security-pipeline` no se mantiene compatible (no se documentan enlaces externos hacia ella).
- Las 4 stat cards técnicas (7 etapas / 0 costo / 100% cobertura / <5 min) ya no aparecen en el landing; su única ocurrencia pública pasa a estar embebida inline en el primer post.
- En este iterado no se implementa: comentarios, RSS/Atom feed, páginas dedicadas por tag (los tags son metadato visual no enlazable), búsqueda/filtros en el blog (a diferencia de `/interviews/`), ni un componente de stat cards reusable entre posts (cualquier post futuro que necesite stat cards copia el HTML inline). Estos quedan explícitamente fuera de alcance, posibles para specs posteriores.
- El conjunto de etiquetas y atributos HTML permitidos por el sanitizador para HTML inline dentro de los posts (FR-013) se decide en `/plan`, partiendo del whitelist usado en spec 003 (interviews) y ampliándolo solo lo necesario para soportar las 4 stat cards.
- El comportamiento ante posts con fecha futura (publicar inmediatamente vs. tratar como `published: false` hasta esa fecha) se decide en `/plan`; cualquiera de las dos es aceptable mientras sea determinista y documentado.
- El listado del landing es estrictamente "los 3 más recientes"; no hay un campo `featured` ni override manual del orden en este iterado.
- La gate `blog-build-check` reusa el patrón ya validado por `pipeline-build-check`: ejecuta el script en modo `--check` y compara contra el HTML commiteado.
- El tiempo estimado de lectura se calcula a partir del conteo de palabras del cuerpo con una heurística estándar (definir constante en `/plan`, ej. 200 wpm); no requiere intervención manual.
- La foto de `#about` (256×256 webp) es responsabilidad del autor proveerla en `assets/img/`; el spec asume que existe al merge. El alt text concreto se decide en `/plan` o al implementar.
- El sitio sigue siendo 100% estático (constitución III): el render del markdown ocurre en build-time vía `scripts/build-blog.js`; no se usa fetch en runtime para cargar posts.
- El primer post puede entregarse al merge con la narrativa redactada por el autor; la spec no obliga a un autor de copy externo. La estructura sugerida en el brief (por qué lo construí → idea base → 7 etapas como decisiones → beneficios con stat cards inline → lecciones) es orientativa; el autor puede ajustarla.
