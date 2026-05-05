# Feature Specification: Sección "Pipeline" (roadmap público de contenido)

**Feature Branch**: `005-pipeline-section`
**Created**: 2026-04-29
**Status**: Draft
**Input**: Brief del autor (2026-04-27): reemplazar la sección actual "Blog / Artículos" del landing por una nueva sección llamada **"Pipeline"** que comunica honestamente qué contenido está en preparación (entrevistas, labs, charlas, posts), con etapas inspiradas en un pipeline DevSecOps (`backlog → in-progress → review → coming-soon`), datos en `content/pipeline.json`, y visualización pipeline lineal coherente con la narrativa del sitio.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visitante entiende qué contenido viene (Priority: P1)

Un visitante (recruiter, colega DevSecOps, organizador de meetup) llega al landing por primera vez y, al desplazarse, encuentra la sección "Pipeline". En menos de 10 segundos comprende que es un roadmap público de contenido en preparación, distingue qué está cerca de publicarse de lo que es solo un backlog, y reconoce el tipo de cada item (entrevista, lab, charla, post) sin ambigüedad. Esto refuerza la sensación de que el sitio es un proyecto activo y honesto, no una pieza estática.

**Why this priority**: es la razón de existir de la sección. Sin esto, no hay valor para el visitante. Es además la única funcionalidad imprescindible para reemplazar el placeholder actual "contenido_en_desarrollo" del bloque `#blog`.

**Independent Test**: cargar el landing, navegar a la sección Pipeline (vía nav o scroll). El visitante debe poder responder, sin abrir DevTools y solo leyendo: (a) "¿qué es esta sección?", (b) "¿qué cosas están a punto de salir?", (c) "¿qué tipo de contenido es cada item?". La sección entrega valor incluso si los items son simulados/manuales.

**Acceptance Scenarios**:

1. **Given** el visitante llega al landing en desktop, **When** hace scroll hasta la nueva sección, **Then** ve un encabezado claro "Pipeline" (con su `section-label` `// pipeline`), una intro de 1–2 líneas explicando el concepto, y una visualización con al menos los items cargados desde `content/pipeline.json`.
2. **Given** hay items en estado `coming-soon`, **When** el visitante mira la sección, **Then** esos items se distinguen visualmente del resto (énfasis de color/peso/posición) y aparecen primero en orden de lectura.
3. **Given** un item es de tipo `interview`, otro `lab`, otro `talk`, otro `post`, **When** el visitante observa la lista, **Then** cada uno expone una etiqueta o icono que identifica su tipo sin ambigüedad y sin requerir hover.
4. **Given** la sección reemplaza al actual bloque "Artículos" / `#blog`, **When** un enlace previo apunta a `#blog`, **Then** ese ancla sigue navegando a la sección Pipeline (compatibilidad de anclas legacy).

---

### User Story 2 — Mantenedor edita el pipeline sin tocar código (Priority: P2)

El autor del sitio (yo, Victor) decide agregar una nueva entrevista al pipeline o cambiar el estado de un item de `in-progress` a `review`. Abre `content/pipeline.json`, edita un objeto, hace commit, y al desplegar el sitio el cambio se refleja sin haber tocado HTML, CSS o JS.

**Why this priority**: la mantenibilidad es lo que hace que el pipeline siga vivo. Sin esto, en 2 meses la sección queda desactualizada y produce el efecto contrario (degradación de credibilidad). No es P1 porque el primer despliegue puede tener items hardcodeados con datos manuales si el flujo de datos no está listo, pero sin esta historia la spec no se considera completa.

**Independent Test**: agregar un item nuevo a `content/pipeline.json`, ejecutar el build (o un refresh estático equivalente), y verificar que el item aparece en la sección con su tipo, estado, título, fecha estimada y descripción correctos. Quitar el item, rebuild, verificar que desaparece.

**Acceptance Scenarios**:

1. **Given** un nuevo item en `content/pipeline.json` con campos válidos, **When** el sitio se rebuilds y se sirve, **Then** el item aparece renderizado con todos sus campos visibles (tipo, título, estado, estimado, descripción).
2. **Given** un item existente cambia de estado de `backlog` a `in-progress`, **When** se rebuilds, **Then** el badge/indicador visual del estado cambia y el orden de aparición del item se actualiza.
3. **Given** `content/pipeline.json` queda con `items: []`, **When** se rebuilds, **Then** la sección muestra un mensaje vacío respetuoso (sin error, sin layout roto) y el resto del sitio funciona.
4. **Given** un item tiene un campo `link` opcional apuntando a contenido ya publicado parcialmente (ej. teaser de entrevista), **When** se renderiza, **Then** ese item incluye un enlace navegable; los items sin `link` se renderizan sin enlace.

---

### User Story 3 — Visitante con limitaciones de color identifica estados (Priority: P3)

Un visitante con daltonismo o usando un tema de alto contraste accede al landing. Aún sin distinguir matices de color, puede identificar el estado de cada item del pipeline (backlog/in-progress/review/coming-soon) gracias a etiquetas de texto, iconos o patrones, no solo color.

**Why this priority**: requisito derivado de la constitución VI (WCAG 2.1 AA). No es P1 porque US1 ya entrega el valor principal; pero el sitio no se mergea sin cumplir esta historia. Validación automatizada vía la gate `tests/a11y.js` ya existente.

**Independent Test**: cargar la sección Pipeline en modo grayscale (DevTools → Rendering → Emulate vision deficiencies → Achromatopsia) y verificar que el estado de cada item sigue siendo identificable. Ejecutar `node tests/a11y.js` y obtener cero violaciones WCAG 2.1 AA en la URL del landing.

**Acceptance Scenarios**:

1. **Given** la sección Pipeline está renderizada y el visitante usa simulación de Achromatopsia, **When** observa los items, **Then** cada estado es identificable por texto y/o forma adicional al color.
2. **Given** la suite a11y corre contra el landing con la nueva sección, **When** se completa, **Then** reporta cero violaciones WCAG 2.1 AA (axe-core).
3. **Given** un visitante navega solo con teclado, **When** entra a la sección Pipeline, **Then** los items con enlace son alcanzables vía Tab y el foco es visible respetando los tokens del sitio.

---

### Edge Cases

- ¿Qué pasa si `content/pipeline.json` no es JSON válido en build? El build debe fallar con un mensaje claro y la CI debe quedar roja, no silenciosamente publicar una sección vacía.
- ¿Qué pasa si un item tiene un `stage` no reconocido (typo, ej. `in_progres`)? El build debe fallar (estricto) o ese item debe omitirse con warning visible (decidir en plan).
- ¿Qué pasa si todos los items son `backlog` (nada cerca de publicarse)? La sección sigue mostrándose con su intro; no se inventa un destacado.
- ¿Qué pasa con los items publicados? Spec actual los considera fuera de alcance — el flujo manual de "remover del pipeline cuando se publique" se documenta en quickstart, no se automatiza.
- ¿Qué pasa en viewports muy estrechos (≤ 380 px)? La metáfora pipeline lineal degrada a lista vertical legible sin scroll horizontal forzado.
- ¿Qué pasa si dos items comparten `id`? Build debe fallar (id es clave única).
- ¿Qué pasa si `estimated` está vacío? Se renderiza sin esa línea; no se inventa una fecha.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El landing MUST exponer una sección identificable como "Pipeline" con `section-label` (`// pipeline`) y `section-title` ("Pipeline" o equivalente), reemplazando la sección actual `#blog` (Artículos / placeholder "contenido_en_desarrollo").
- **FR-002**: La sección MUST incluir un texto introductorio de 1–2 líneas que explique brevemente la metáfora ("así como un pipeline CI/CD muestra qué hay en cada etapa antes del deploy, esta sección muestra qué hay en cada etapa antes de la publicación") en la voz cálida y honesta del sitio (ver spec 004).
- **FR-003**: El sistema MUST leer los items de un archivo de datos versionado en el repo (`content/pipeline.json`) — los items NO se hardcodean en el HTML del landing.
- **FR-004**: Cada item MUST exponer al visitante: tipo, título, estado, fecha estimada (si está presente), descripción breve.
- **FR-005**: Cada item MUST incluir un indicador visual del **estado** que sea distinguible sin depender únicamente del color (texto del badge, icono, o patrón).
- **FR-006**: Cada item MUST incluir un indicador visual del **tipo** que lo identifique inequívocamente (icono o etiqueta visible, sin requerir hover).
- **FR-007**: Items en estado `coming-soon` MUST destacarse visualmente sobre el resto (énfasis de color/borde/posición).
- **FR-008**: El orden visual por defecto MUST ser: `coming-soon` → `review` → `in-progress` → `backlog`. Dentro de cada grupo, el orden secundario es estable y predecible (definir en plan: por `estimated` ascendente o por orden de aparición en el JSON).
- **FR-009**: Cada item MAY incluir un enlace opcional (`link`) a contenido ya publicado parcialmente (ej. teaser); cuando esté presente, el item se renderiza como navegable; cuando no, se renderiza estático.
- **FR-010**: El sistema MUST soportar al menos los 5 tipos: `interview`, `lab`, `talk`, `post`, `other`, cada uno con su etiqueta visible y un indicador visual propio.
- **FR-011**: El sistema MUST validar al build (estricto, modo CI) que cada item del JSON tiene `id` único, `type` en la lista permitida, `stage` en la lista permitida, `title` no vacío y `description` no vacío. Cualquier item inválido MUST hacer fallar el build con un mensaje accionable.
- **FR-012**: El ancla `#blog` (existente, referenciada desde el nav y posibles enlaces externos) MUST seguir navegando a la nueva sección, ya sea reutilizando ese `id` o aplicando un alias compatible.
- **FR-013**: La sección MUST renderizarse correctamente en viewports desde 320 px de ancho hasta desktop sin scroll horizontal y con todos los items legibles.
- **FR-014**: La sección MUST cumplir WCAG 2.1 AA (validable con `tests/a11y.js`): foco visible, contraste mínimo, semántica adecuada (`section`, `aria-labelledby`, listas marcadas como tales), navegación por teclado.
- **FR-015**: Si `content/pipeline.json` está vacío (`items: []`) o no contiene items renderizables, la sección MUST mostrar un estado vacío respetuoso con la voz del sitio, sin layout roto y sin errores en consola.
- **FR-016**: La sección MUST integrarse con el flujo de build/CI existente sin agregar dependencias JS de runtime (constitución III/IV); el procesamiento del JSON puede ocurrir en build-time.
- **FR-017**: Agregar, editar o remover un item del pipeline MUST requerir editar únicamente `content/pipeline.json` (y opcionalmente `README` o `quickstart`); NO debe requerir modificar HTML, CSS ni JS.

### Key Entities

- **PipelineItem**: representa un trabajo de contenido en preparación. Atributos: `id` (string, único, slug-style), `type` (enum: interview | lab | talk | post | other), `title` (string), `stage` (enum: backlog | in-progress | review | coming-soon), `estimated` (string opcional, formato libre legible: "2026-Q3", "Mayo 2026", "Pronto"), `description` (string corto, 1–2 líneas), `link` (URL opcional a teaser/borrador publicado).
- **PipelineDataFile**: archivo JSON en `content/pipeline.json` con forma `{ "items": [PipelineItem, ...] }`. Es la única fuente de verdad de qué se muestra en la sección.
- **PipelineStage**: catálogo cerrado de estados con orden canónico `coming-soon (0) → review (1) → in-progress (2) → backlog (3)`. Cada estado tiene una etiqueta visible en español y un identificador visual no solo cromático.
- **PipelineType**: catálogo cerrado de tipos de contenido con etiqueta visible y un indicador visual (icono o texto) consistente con la estética terminal/code-first del sitio.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante nuevo puede explicar correctamente qué representa la sección "Pipeline" tras 10 segundos de lectura, validado en pruebas con al menos 3 personas no técnicas familiarizadas con el sitio.
- **SC-002**: 100% de los items del pipeline se renderizan exclusivamente desde `content/pipeline.json`; cero items hardcodeados en `index.html` (validable por inspección de diff).
- **SC-003**: El tiempo entre "editar `content/pipeline.json`" y "ver el cambio reflejado" en un build local es ≤ 60 segundos sin tocar otros archivos.
- **SC-004**: La gate de accesibilidad (`tests/a11y.js` con axe-core, WCAG 2.1 AA) reporta cero violaciones en la URL del landing tras agregar la sección.
- **SC-005**: La sección renderiza correctamente y sin scroll horizontal en al menos los breakpoints 320 px, 360 px, 768 px, 1024 px y 1440 px.
- **SC-006**: Un PipelineItem con datos inválidos (id duplicado, stage desconocido, title vacío) MUST hacer fallar el build/CI; verificable mediante un fixture negativo automatizado.
- **SC-007**: Lighthouse Performance del landing se mantiene ≥ 95 (constitución VII) tras agregar la sección.
- **SC-008**: Al menos 4 PipelineItems reales (mezcla de tipos: como mínimo 1 interview, 1 lab, 1 talk, 1 post) están cargados al merge inicial, demostrando los 5 tipos de tarjeta y al menos 3 de los 4 estados.
- **SC-009**: La distinción visual de estados es identificable por un usuario en simulación de Achromatopsia (validable manual + axe automated checks de contraste).

---

## Assumptions

- El nav superior actual (`#blog`) se actualizará a "Pipeline" como label visible, pero el ancla se mantiene compatible (alias o reuso del id) para no romper enlaces externos. No se pide redirección server-side (no hay backend, constitución III).
- La sección "Publicados" o el flujo automático de archivar items publicados están **fuera de alcance** de esta spec. Cuando una entrevista del pipeline pase a publicada (vía spec 003), el mantenedor manualmente la quita o cambia su estado en `content/pipeline.json`. Este flujo manual se documenta en `quickstart.md`.
- La cadencia de revisión del pipeline (mensual sugerido en el brief) se documenta en `quickstart.md` como recomendación; no se implementa un recordatorio automático en este spec.
- "Pipeline lineal" como metáfora visual final queda confirmada por el brief (sección 4.1, opción recomendada). El plan podrá refinar la implementación concreta (columnas Kanban vs. flecha lineal vs. lista con badges) respetando la estética terminal del sitio.
- Las 4 etapas son fijas y suficientes; añadir una quinta (ej. `published`, `archived`) requiere PR a esta spec.
- Los 5 tipos (`interview`, `lab`, `talk`, `post`, `other`) cubren los casos previstos. `other` actúa como categoría de escape; añadir un tipo nuevo nombrado requiere editar el catálogo.
- Los items del pipeline NO incluyen información sensible ni datos personales de terceros sin consentimiento (ej. nombres de entrevistados solo si la entrevista ya fue acordada y comunicada).
- La sección no requiere búsqueda, filtros ni paginación en este iterado: el volumen esperado es ≤ 12 items visibles. Si crece más allá, se reevalúa en spec futura.
- El sitio sigue siendo 100% estático (constitución III): el render del JSON puede hacerse en build-time (Node script tipo `scripts/build-pipeline.js`, alineado con el patrón de spec 003) o en client-time vanilla `fetch` si se justifica en plan; la spec no obliga a un enfoque concreto, pero prohíbe dependencias JS de terceros sin justificación (constitución IV).
