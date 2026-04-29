# Feature Specification: Sección de Entrevistas (Blog estático navegable)

**Feature Branch**: `003-interviews-section`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: Sección tipo blog en `ardops.dev` para publicar entrevistas a profesionales del sector tech. Cada entrevista se escribe en Markdown con frontmatter YAML estandarizado (5 preguntas, 3-5 líneas por respuesta, metadata del entrevistado: nombre, rol, empresa, foto circular, fecha, tags). Un script de build genera HTML estático en build time + un `index.json` para búsqueda client-side. El visitante puede leer entrevistas individuales por URL directa, ver el índice cronológico y buscar/filtrar por texto y tags. El sitio sigue siendo 100% estático sobre GitHub Pages, sin backend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Lector accede a una entrevista publicada (Priority: P1) 🎯 MVP

Un visitante recibe un link directo a `https://ardops.dev/interviews/jose-alvarez-pernix.html` (compartido por LinkedIn, mensaje, búsqueda en Google). Carga la página y ve: nombre, rol y empresa del entrevistado, su foto circular, fecha, tags, tiempo estimado de lectura, las 5 preguntas con sus respuestas formateadas, y un enlace para volver al índice de entrevistas. La página tiene `<title>` y meta description correctos para que los previews en redes sociales sean limpios.

**Why this priority**: Es la unidad mínima de valor del producto. Sin esto no hay contenido publicable. Una entrevista renderizada y accesible por URL es ya un entregable. El índice y el buscador son discoverability sobre encima de esto.

**Independent Test**: crear un archivo Markdown válido en `content/interviews/`, ejecutar el build, verificar que existe un HTML servible accesible por URL directa que muestra todo el contenido del MD renderizado más la metadata del frontmatter, con foto circular del entrevistado y un enlace de regreso al índice. No requiere que el índice exista para validar esta historia.

**Acceptance Scenarios**:

1. **Given** un archivo `content/interviews/2026-05-jose-alvarez-pernix.md` con frontmatter válido y `published: true`, **When** se ejecuta el build, **Then** se genera un archivo HTML estático servible que renderiza el contenido del Markdown como HTML semántico (encabezados, párrafos, listas, énfasis).
2. **Given** la página individual de la entrevista, **When** el visitante la carga, **Then** ve el nombre del entrevistado, su rol, empresa, foto circular, fecha en formato legible, tags clickeables que llevan al índice filtrado, tiempo de lectura estimado, y todas las preguntas/respuestas.
3. **Given** una entrevista con `published: false`, **When** se ejecuta el build, **Then** NO se genera el HTML correspondiente y la URL no existe en el sitio publicado.
4. **Given** un Markdown con frontmatter inválido (campo requerido faltante, fecha mal formateada, tag con caracteres prohibidos), **When** se ejecuta el build, **Then** el build falla con un mensaje de error que identifica el archivo, la línea y el problema concreto.
5. **Given** la página individual, **When** se inspeccionan los meta tags, **Then** existen `<title>`, `<meta name="description">` (poblada desde `summary` del frontmatter), y meta tags Open Graph básicos (`og:title`, `og:description`, `og:type=article`, `og:image` si hay foto del entrevistado).
6. **Given** la página individual, **When** el visitante hace click en "Volver a entrevistas", **Then** llega al índice de entrevistas.

---

### User Story 2 — Visitante explora el índice cronológico de entrevistas (Priority: P1)

Un visitante llega a `https://ardops.dev/interviews/`. Ve un listado de todas las entrevistas publicadas, ordenadas por fecha descendente (más recientes primero). Cada item muestra: foto circular del entrevistado, nombre, rol@empresa, fecha, tags, summary corto, y al hacer click navega a la entrevista individual. Hay un enlace al índice desde el menú principal del sitio.

**Why this priority**: el índice es la puerta de entrada principal a la sección. Sin él, las entrevistas son páginas huérfanas solo accesibles por link directo. Es P1 porque sin discoverability no hay producto publicable de cara al usuario casual del sitio.

**Independent Test**: con al menos 2 entrevistas publicadas y el build ejecutado, cargar `/interviews/` y verificar que ambas aparecen en orden descendente por fecha, que cada item enlaza a la página individual correcta, y que el menú principal del sitio incluye un enlace a esta página.

**Acceptance Scenarios**:

1. **Given** 5 entrevistas con `published: true` y fechas 2026-01, 2026-02, 2026-03, 2026-04, 2026-05, **When** se carga el índice, **Then** aparecen las 5 en orden 2026-05, 2026-04, 2026-03, 2026-02, 2026-01.
2. **Given** una mezcla de entrevistas con `published: true` y `published: false`, **When** se carga el índice, **Then** solo las publicadas aparecen.
3. **Given** un item del listado, **When** el visitante lo activa con click o `Enter`, **Then** navega a la entrevista individual correspondiente.
4. **Given** el menú principal del sitio (`index.html`, `talks/index.html`, etc.), **When** el visitante lo recorre, **Then** existe una entrada visible "Entrevistas" o equivalente que enlaza a `/interviews/`.
5. **Given** el directorio `dist/interviews/` (o equivalente) tras el build, **When** se inspecciona, **Then** existe un archivo `index.json` cuyo tamaño no excede 100KB con hasta 20 entrevistas y contiene la metadata necesaria para búsqueda (title, interviewee.name, company, role, tags, date, slug, summary).

---

### User Story 3 — Visitante busca y filtra entrevistas (Priority: P2)

Un visitante en el índice escribe en un input "scaling" para encontrar entrevistas que mencionen ese tema. Conforme escribe, la lista se filtra en vivo (sin recargar). También puede hacer click en uno o más tags para filtrar; al combinar búsqueda de texto + tags, ambos criterios se aplican como AND. Un botón "Limpiar" restaura el listado completo. La interacción funciona con teclado y los lectores de pantalla anuncian el número de resultados.

**Why this priority**: es valor agregado sobre US2. Hace la sección útil cuando el catálogo crezca (>10 entrevistas). No es bloqueante para publicar las primeras entrevistas; el listado cronológico de US2 es suficiente para 1-10 entrevistas.

**Independent Test**: en el índice con varias entrevistas, escribir texto en el input → la lista se filtra en vivo. Hacer click en un tag → se aplica filtro. Combinar texto + tag → resultados son la intersección. Botón "Limpiar" restaura todo. Recorrer toda la interfaz solo con teclado funciona. VoiceOver anuncia cambios de resultados.

**Acceptance Scenarios**:

1. **Given** el índice con 5 entrevistas y el input de búsqueda enfocado, **When** el visitante teclea letra por letra "scal", **Then** la lista se actualiza en vivo (sin Enter) mostrando solo entrevistas cuyo título, nombre del entrevistado, empresa, summary o tags contengan "scal".
2. **Given** el índice con tags visibles, **When** el visitante activa un tag (click o teclado), **Then** la lista filtra a entrevistas que contengan ese tag.
3. **Given** un filtro de texto activo y un tag activo, **When** ambos están aplicados, **Then** la lista muestra solo entrevistas que cumplan ambos criterios (AND).
4. **Given** filtros activos, **When** el visitante activa "Limpiar", **Then** se restaura el listado completo y los inputs/tags vuelven a su estado inicial.
5. **Given** un usuario navegando solo con teclado, **When** recorre el índice con `Tab`, **Then** alcanza el input de búsqueda, los tags y los items en orden lógico, y puede activar tags y abrir entrevistas con `Enter`/`Space`.
6. **Given** un usuario con lector de pantalla, **When** se actualiza la lista de resultados, **Then** se anuncia el número de resultados (vía `aria-live="polite"`).
7. **Given** el input de búsqueda y los tags, **When** se inspecciona el HTML servido, **Then** los handlers de eventos están conectados desde un script externo (no inline `onclick`/`onchange`), respetando CSP estricta.

---

### Edge Cases

- **Sin entrevistas publicadas**: el índice debe renderizarse con un mensaje vacío amistoso (ej. "Próximamente: nuevas entrevistas") en lugar de una página rota o vacía.
- **Búsqueda sin resultados**: cuando texto + filtros no coinciden con nada, mostrar mensaje claro "Sin resultados para [criterio]" y mantener visibles los controles para limpiar.
- **Frontmatter incompleto** (campo requerido faltante, fecha inválida, tag con caracteres no permitidos): el build debe fallar con error preciso, no producir HTML degradado.
- **Foto del entrevistado faltante** (campo `image` ausente o ruta inexistente): la entrevista debe seguir publicándose con un fallback visual (avatar genérico o iniciales del entrevistado), no debe romper el build ni el render.
- **Tags duplicados o inconsistentes** (`Liderazgo` vs `liderazgo`): el sistema debe normalizar (lowercase, slug) o validar contra una whitelist; entradas inconsistentes producen un warning en el build.
- **Markdown con HTML inline o tags peligrosos** (`<script>`, `<iframe>`): el HTML generado debe sanitizar la salida (sin ejecución de scripts inyectados), incluso aunque el autor sea de confianza, como defensa en profundidad.
- **`index.json` cerca del límite de 100KB**: cuando se acerque al límite, advertir en el build (warning, no error) para revisar la estrategia (paginación, índices parciales).
- **URL antigua de una entrevista despublicada**: si una entrevista pasa de `true` a `false`, su HTML deja de existir en el siguiente build; las URLs externas a esa entrevista retornarán 404. La feature no entrega redirecciones.
- **Caracteres especiales en `summary`** o tags: deben escaparse correctamente al insertarse en HTML, JSON y meta tags.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Las entrevistas DEBEN almacenarse como archivos Markdown bajo `content/interviews/`, con un archivo por entrevista.
- **FR-002**: Cada archivo DEBE tener frontmatter YAML con los siguientes campos requeridos: `title`, `interviewee.name`, `interviewee.role`, `interviewee.company`, `date` (formato `YYYY-MM-DD`), `tags` (lista no vacía), `summary`, `published` (boolean).
- **FR-003**: Cada archivo PUEDE tener los siguientes campos opcionales: `interviewee.image` (ruta a foto circular del entrevistado), `interviewee.linkedin` (URL del perfil).
- **FR-004**: El sistema DEBE generar automáticamente, en build time, un campo derivado `readingTime` (minutos estimados) por entrevista, basado en el conteo de palabras del cuerpo Markdown.
- **FR-005**: Solo las entrevistas con `published: true` DEBEN incluirse en el sitio publicado (HTML, índice, JSON).
- **FR-006**: El build DEBE generar un archivo HTML estático por entrevista publicada, accesible por URL directa con un slug derivado del nombre del archivo o del título.
- **FR-007**: El build DEBE generar una página índice listando todas las entrevistas publicadas, ordenadas por `date` descendente.
- **FR-008**: El build DEBE generar un archivo `index.json` con la metadata de todas las entrevistas publicadas (campos suficientes para búsqueda y filtrado), accesible al cliente.
- **FR-009**: El build DEBE fallar con un mensaje de error preciso (archivo + campo + razón) cuando un archivo Markdown tenga frontmatter inválido, campo requerido faltante, fecha mal formateada o tags fuera del formato permitido.
- **FR-010**: El build DEBE sanitizar el HTML generado a partir del Markdown para neutralizar HTML inline peligroso (scripts, iframes, handlers de eventos inline).
- **FR-011**: La página individual de cada entrevista DEBE mostrar nombre, rol, empresa, foto circular del entrevistado (con fallback si está ausente), fecha en formato legible en español, tags, tiempo estimado de lectura y el contenido renderizado.
- **FR-012**: La página individual DEBE incluir `<title>`, `<meta name="description">` poblada desde `summary`, y meta tags Open Graph (`og:title`, `og:description`, `og:type`, `og:image` cuando exista).
- **FR-013**: La página individual DEBE incluir un enlace de navegación de regreso al índice de entrevistas.
- **FR-014**: El índice DEBE ofrecer un campo de búsqueda libre que filtre los items en vivo (sin recargar) por coincidencia en `title`, `interviewee.name`, `company`, `summary` y `tags`.
- **FR-015**: El índice DEBE permitir filtrar por uno o más tags, combinándose con la búsqueda de texto como AND.
- **FR-016**: El índice DEBE incluir un control para limpiar todos los filtros y restaurar el listado completo.
- **FR-017**: Los cambios en la lista de resultados DEBEN anunciarse a tecnologías asistivas (`aria-live`).
- **FR-018**: La búsqueda y los filtros DEBEN ser totalmente operables por teclado.
- **FR-019**: El menú principal del sitio (`index.html` y otras superficies con navegación) DEBE incluir una entrada "Entrevistas" que enlace al índice.
- **FR-020**: NO se DEBEN introducir dependencias JS de terceros en runtime: la búsqueda/filtrado client-side se implementa con vanilla JS sin librerías externas. Las dependencias de build-time (parser de Markdown, parser de YAML, sanitizador) están permitidas y se justifican en el plan.
- **FR-021**: NO se DEBE incluir tracking de terceros, analítica, ni recursos cargados de CDNs externos en las páginas generadas.
- **FR-022**: Todos los assets (fotos de entrevistados, fonts) DEBEN servirse desde el propio dominio.
- **FR-023**: El `index.json` NO DEBE exceder 100KB para las primeras 20 entrevistas; superado ese umbral, el build DEBE emitir una advertencia.
- **FR-024**: El build DEBE integrarse con el pipeline existente de despliegue (GitHub Actions) sin requerir nuevos servicios externos ni secretos.
- **FR-025**: Los archivos generados por el build NO DEBEN commitarse al repositorio: viven solo como artefactos del pipeline de despliegue (alineado con el flujo actual del sitio).

### Key Entities

- **Entrevista (Interview)**: archivo Markdown con frontmatter YAML que representa una conversación con un profesional. Atributos lógicos: identificador (slug), título, fecha, contenido (preguntas y respuestas en Markdown), summary, lista de tags, estado de publicación, tiempo de lectura estimado.
- **Entrevistado (Interviewee)**: persona entrevistada. Atributos: nombre, rol, empresa, foto circular (opcional), URL de LinkedIn (opcional). Embebida en cada entrevista; no es entidad independiente con identidad propia (no se modela una persona que aparece en múltiples entrevistas en esta versión).
- **Tag**: etiqueta temática (ej. "liderazgo", "cto", "scaling"). Slug minúsculas con `[a-z0-9-]`. Se usa para clasificar y filtrar. No es entidad con datos propios; existe implícitamente como string normalizado.
- **Índice de entrevistas (InterviewIndex)**: archivo JSON generado en build time que contiene la metadata mínima de cada entrevista publicada para alimentar la búsqueda client-side. Atributos por entry: slug, title, interviewee (name, role, company, image), date, tags, summary, readingTime.
- **Lista inicial de entrevistados (operativo, no-funcional)**: José Álvarez (CTO Pernix), Luis Carlos Corrales (CTO HuliHealth), Santiago Merlo (Head of Digital Centers CR Babel), Bryan Campos (Solutions Architect Babel), Ismael Guerrero (Product Analyst Banco Galicia), Edgar Oviedo (VP CAMTIC / co-founder Babel), Alejandro Oconitrillo (DevOps Digital Centers Lead Babel). No es parte del modelo de datos; es backlog editorial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Crear un archivo Markdown válido en `content/interviews/` y hacer push a `main` resulta en que la página individual y el índice se actualicen en producción dentro del tiempo normal de despliegue del sitio (sin pasos manuales adicionales).
- **SC-002**: Una entrevista con `published: false` no aparece en ninguna página, JSON ni asset publicado del sitio (verificable inspeccionando los artefactos del build y haciendo `grep` del nombre del entrevistado en `dist/`).
- **SC-003**: Frontmatter inválido (campo requerido faltante o mal formateado) hace fallar el build con un mensaje que indica archivo, campo y razón en la primera línea relevante de la salida (verificable forzando un caso inválido en CI).
- **SC-004**: La búsqueda por texto retorna resultados conforme el visitante escribe, sin presionar Enter, en menos de 100ms percibidos sobre un dataset de hasta 20 entrevistas.
- **SC-005**: Combinar búsqueda + filtro de tags devuelve la intersección esperada (AND) en el 100% de los casos de prueba documentados.
- **SC-006**: El archivo `index.json` no excede 100KB con 20 entrevistas reales o representativas.
- **SC-007**: Cada página individual carga en menos de 1 segundo en una conexión 4G simulada (LCP < 2.5s, alineado con la constitución de performance del sitio).
- **SC-008**: Lighthouse Accessibility de `/interviews/` y de cualquier página individual de entrevista es **100**.
- **SC-009**: Lighthouse Performance de `/interviews/` y de páginas individuales es **≥ 95** y CLS ≤ 0.1.
- **SC-010**: Navegación por teclado completa: con solo `Tab`, `Shift+Tab`, `Enter` y `Space`, un visitante puede llegar al índice desde el menú principal, recorrer filtros, abrir una entrevista y volver al índice (verificable en pruebas manuales documentadas).
- **SC-011**: 0 violaciones WCAG 2.1 AA detectadas por axe-core/pa11y sobre `/interviews/` y al menos una página individual.
- **SC-012**: 0 ejecuciones de scripts inyectados desde Markdown malicioso de prueba (ej. una entrevista con `<script>alert(1)</script>` en el cuerpo NO produce alert al cargarse).
- **SC-013**: 0 referencias a CDNs externos o trackers de terceros en las páginas generadas (verificable con `grep` o un check de CSP).
- **SC-014**: Una persona nueva al repo puede agregar una entrevista válida siguiendo `content/interviews/README.md` en menos de 10 minutos sin asistencia.

## Assumptions

- **Templating**: el sitio actual no usa motor de plantillas; esta feature usa template strings de JavaScript dentro del script de build, sin introducir motores como Handlebars o EJS. Esto preserva el principio de mínimo de dependencias.
- **Imagen del entrevistado**: se incluye un campo opcional `interviewee.image` en el frontmatter para foto circular. La imagen vive en el repo bajo `content/interviews/images/` (o `assets/img/interviews/`) y se referencia por ruta relativa. El pipeline de optimización de imágenes (compresión, sizes, formatos modernos como AVIF/WebP) queda fuera de alcance de esta spec; las imágenes se sirven tal como se commitean. Si no hay imagen, se renderiza un avatar fallback (iniciales del entrevistado o placeholder neutro coherente con la estética del sitio).
- **Reading time**: se calcula en build time a partir del conteo de palabras del cuerpo Markdown (excluyendo frontmatter), usando un estimador estándar (200-250 palabras/minuto). El valor calculado se inserta en el HTML generado y en el `index.json`.
- **Idioma**: español. No hay i18n en esta versión.
- **Estética**: la sección hereda la paleta y tipografías del sitio (dark terminal aesthetic, JetBrains Mono + Outfit, tokens CSS existentes). No introduce nueva paleta.
- **Hosting**: GitHub Pages, dominio `ardops.dev`. El build se ejecuta en GitHub Actions; no hay secretos ni servicios externos pagos.
- **No commitear `dist/`**: los artefactos del build se generan en CI y se publican; el repo no contiene los HTML generados, alineado con el flujo de despliegue actual del sitio.
- **Workflow editorial**: cada entrevistado revisa su entrevista antes de marcar `published: true`. La revisión es un proceso humano fuera del alcance del software; esta spec entrega solo el mecanismo del flag.
- **Sanitización**: se asume que el autor de las entrevistas es de confianza, pero el HTML generado se sanitiza igualmente como defensa en profundidad. El parser de Markdown se configura para no permitir HTML inline crudo, o se aplica un sanitizador post-render.
- **Slugs**: se derivan automáticamente del nombre del archivo (`2026-05-jose-alvarez-pernix.md` → slug `jose-alvarez-pernix`) o del título normalizado. La autoridad final es el nombre de archivo para mantener URLs estables.
- **CSP**: el sitio ya enforza CSP estricta vía `<meta http-equiv>`. Las páginas generadas (índice + individuales) deben respetarla: scripts solo desde el propio dominio, sin `unsafe-inline`, sin `unsafe-eval`. Los handlers de eventos del buscador/filtros viven en un archivo `.js` externo, no inline.
- **Validación de tags**: lista permitida de caracteres `[a-z0-9-]`. Los tags se normalizan a lowercase. No se valida contra una whitelist cerrada en esta versión; se documenta la convención y se valida solo el formato.
- **Navegación principal**: agregar la entrada "Entrevistas" al menú implica modificar `index.html`, `talks/index.html` y `blog/index.html` (todas las superficies que ya tienen `nav-links`). El cambio mantiene la estructura de navegación existente.
- **Índice JSON**: la estructura del JSON se diseña para minimizar tamaño (campos cortos, sin contenido completo), de modo que se mantenga bajo 100KB hasta ~20 entrevistas con metadata estándar. Cuerpo del Markdown NO va al JSON.
- **Sin RSS/feed, sin comentarios, sin autoría múltiple, sin i18n**: explícitamente fuera de alcance.
- **Plan de rollback**: si el build falla, el deploy queda bloqueado por GitHub Actions (estado actual del pipeline). Si una entrevista publicada tiene contenido incorrecto, el operador cambia `published: false` o hace `git revert` del commit que la introdujo.
