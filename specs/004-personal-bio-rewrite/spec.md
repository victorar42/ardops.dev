# Feature Specification: Reescritura de Bio Personal (tono cálido)

**Feature Branch**: `004-personal-bio-rewrite`
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "Reescritura de bio personal con tono cálido, reemplazo del placeholder [Tu Nombre] por Victor Josue Ardon Rojas, mención de papá de 3 (dos chicos + una chica), referencia a fútbol, mantener foco DevOps/DevSecOps en banca CR. Verificar también que no queden otros placeholders [..] o TODO en el sitio."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Bio principal del hero/about con tono humano (Priority: P1)

Una persona llega al sitio `ardops.dev` desde LinkedIn, GitHub, una charla, o el resultado de una búsqueda. En los primeros 8–10 segundos quiere entender **quién es Victor**, **a qué se dedica**, y **si vale la pena seguir leyendo o contactarlo**. Hoy se encuentra con un párrafo de tono CV/corporativo que pesa cognitivamente, sin elementos humanos. La nueva bio (en hero + sección "Sobre mí") suena a Victor hablando en primera persona: explica el rol (DevOps Engineer, DevSecOps en banca CR), por qué le importa (rapidez + seguridad sin fricción), e incluye un dato humano discreto (papá de 3 — dos chicos y una chica — y aficionado al fútbol).

**Why this priority**: Es el contenido más visible del sitio y el que define la primera impresión para todos los perfiles de visitante (peers, asistentes a Techno Week 8.0, reclutadores). El tono actual no diferencia a Victor de cualquier otra página de LinkedIn; el cálido sí.

**Independent Test**: Cargar `index.html` en navegador (desktop y mobile ≤ 380 px), confirmar que el hero y la sección "Sobre mí" muestran el copy nuevo en primera persona, mencionan rol + sector banca + dato humano (familia o fútbol), y que ningún literal `[Tu Nombre]` aparece visible. Lectura completa de la bio se hace en menos de 30 segundos sin retroceder.

**Acceptance Scenarios**:

1. **Given** un visitante en desktop carga `https://ardops.dev/`, **When** lee el hero, **Then** ve "Victor Josue Ardón Rojas" como nombre, rol "DevOps Engineer", y un párrafo en primera persona ("Soy …" / "Me dedico a …") de ≤ 90 palabras, sin enumeración de tecnologías.
2. **Given** un visitante en mobile (≤ 380 px), **When** abre la página, **Then** la bio del hero se lee sin overflow horizontal y sin truncar palabras a la mitad.
3. **Given** la sección "Sobre mí", **When** un visitante la lee tras el hero, **Then** encuentra al menos una mención humana (familia: tres hijos / dos chicos y una chica / fútbol) y al menos una mención profesional (DevSecOps · banca CR), ambas integradas en prosa, no como lista.
4. **Given** un screen reader recorre la página, **When** llega al hero, **Then** lee "Victor Josue Ardón Rojas" como `h1` y el párrafo siguiente como texto plano (sin landmarks rotos).

---

### User Story 2 — Auditoría de placeholders sin resolver (Priority: P2)

Antes de cerrar la spec, el sitio se revisa para confirmar que no quedan literales tipo `[Tu Nombre]`, `[Placeholder]`, `TODO`, `FIXME`, ni `XXX` visibles en archivos de **contenido publicable** (HTML servido, sitemap, OG metadata, README público, robots.txt). Estos artefactos rompen la confianza del visitante y son un olor a "trabajo a medias".

**Why this priority**: Es un riesgo de credibilidad bajo pero molesto; arreglarlo es trivial una vez identificado y se hace en el mismo PR. No bloquea US1 si se difiere, pero suma 5 minutos al merge.

**Independent Test**: Ejecutar una búsqueda en el repo limitada a archivos servidos (`*.html`, `sitemap.xml`, `robots.txt`, `404.html`, `*.webmanifest`) por los patrones `\[Tu Nombre\]`, `\bTODO\b`, `\bFIXME\b`, `\bXXX\b`, y por placeholders genéricos `\[[A-Z][^\]]*\]` que no formen parte de sintaxis legítima (links Markdown, JSON-LD escapado, etc.). El resultado debe ser **cero hallazgos** en archivos de contenido publicable.

**Acceptance Scenarios**:

1. **Given** la auditoría se ejecuta, **When** busca `[Tu Nombre]` en archivos servidos, **Then** retorna 0 ocurrencias.
2. **Given** la auditoría se ejecuta, **When** busca `TODO|FIXME|XXX` en archivos servidos, **Then** retorna 0 ocurrencias.
3. **Given** un placeholder se descubre, **When** se documenta, **Then** se reemplaza por contenido real **o** se marca con un comentario HTML invisible que justifica su presencia.

---

### User Story 3 — Coherencia tonal en micro-copies del sitio (Priority: P3)

Otras micro-copies del sitio (CTAs, sección "blog próximamente", footer, mensajes de la 404, etiquetas como "// whoami") se revisan para que no choquen con el tono cálido del hero/about. El criterio no es eliminar el tono técnico (es parte de la marca), sino evitar disonancias bruscas — por ejemplo, el hero diciendo "Soy Victor, papá de tres" y el footer diciendo "© Profesional con X años de experiencia".

**Why this priority**: Pulido editorial. Mejora la cohesión percibida pero no impacta el mensaje principal. Puede diferirse a un PR posterior si los descubrimientos son menores.

**Independent Test**: Lectura lineal del sitio (hero → about → talk → blog → footer + 404). Subjetivamente: "¿se siente la misma voz a lo largo del recorrido?". Si una micro-copy rompe la voz, se ajusta.

**Acceptance Scenarios**:

1. **Given** la lectura lineal del sitio, **When** se transita del hero al about, **Then** no hay cambio brusco de persona narrativa (primera persona en ambos) ni de registro (cálido pero técnico en ambos).
2. **Given** la página 404, **When** un visitante llega por error, **Then** el copy mantiene la misma voz (no es un mensaje genérico despersonalizado).
3. **Given** los CTAs del hero y de la sección Techno Week, **When** se comparan, **Then** ambos invitan a la acción sin imperativos agresivos ("Ver el Pipeline", "Techno Week 8.0" — no "¡HAZ CLIC AQUÍ!").

---

### Edge Cases

- **Mobile muy estrecho (≤ 320 px, dispositivos antiguos)**: la bio del hero (estimada en 60–80 palabras) podría requerir 6–8 líneas. Verificar que el line-height y el padding no rompan el flujo y que el botón primario "Techno Week 8.0" siga visible above-the-fold.
- **Lector de pantalla en español**: nombres como "Ardón Rojas" deben pronunciarse correctamente (la tilde en `ó` es relevante). Confirmar que el HTML usa Unicode `ó` (U+00F3), no `&oacute;` ni el dígrafo separado.
- **Visitante que llega desde una entrevista en `/interviews/`**: el header global ya marca la sección activa, pero la bio del hero principal (`/`) debe seguir siendo coherente con la voz que ese visitante leyó en la entrevista correspondiente.
- **Texto pegado desde un editor con caracteres invisibles** (ZWSP, U+200B): el copy final debe estar limpio (verificar antes de commit).
- **Accesibilidad cognitiva**: el copy cálido puede usar metáforas; mantenerlas concretas y evitar idiomatismos regionales fuera de uno o dos toques ticos opcionales.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La página principal (`index.html`) DEBE mostrar "Victor Josue Ardón Rojas" como nombre del `h1` del hero (con la tilde correcta en "Ardón").
- **FR-002**: NINGÚN archivo HTML servido (`index.html`, `talks/index.html`, `blog/index.html`, `404.html`, e `interviews/*.html` generados) DEBE contener el literal `[Tu Nombre]`.
- **FR-003**: El párrafo descriptivo del hero (`p.hero-desc` o equivalente) DEBE estar en primera persona ("Soy …", "Me dedico …", etc.), tener entre **40 y 90 palabras**, y NO contener una lista enumerada de tecnologías separadas por · o `,`.
- **FR-004**: El bloque "Sobre mí" en `index.html` DEBE incluir al menos UNA mención profesional (DevOps Engineer / DevSecOps / banca o sector financiero) y al menos UNA mención humana (familia: tres hijos, dos chicos y una chica; o el dato de fútbol). Ambas en prosa, no como bullets.
- **FR-005**: El nombre legal completo "Victor Josue Ardón Rojas" DEBE aparecer al menos UNA vez visible en `index.html`. La firma corta preferida es "Victor Ardón".
- **FR-006**: La auditoría de placeholders en archivos servidos DEBE retornar 0 ocurrencias para los patrones: `[Tu Nombre]`, `\bTODO\b`, `\bFIXME\b`, `\bXXX\b`. La auditoría NO aplica a archivos bajo `docs/`, `specs/`, `tests/`, `scripts/`, `content/`, `.specify/`, `assets/`.
- **FR-007**: El copy nuevo NO DEBE incluir información personal sensible: dirección física exacta, número de teléfono personal, fecha de nacimiento, nombres completos de los hijos.
- **FR-008**: El layout del hero NO DEBE romperse en viewports ≥ 320 px de ancho (sin overflow horizontal, sin texto truncado a media palabra, sin el CTA primario empujado bajo el fold en pantallas estándar).
- **FR-009**: El sitio DEBE permanecer compilable y desplegable: 0 errores de `npx html-validate index.html blog/index.html talks/index.html 404.html`, 0 violaciones de `tests/a11y.js` (axe-core WCAG 2.1 AA).
- **FR-010**: La meta descripción (`<meta name="description">`) y `og:description` DEBEN reflejar el nuevo tono — sin convertirlas en eslóganes vacíos, manteniéndolas ≤ 160 caracteres.

### Key Entities *(include if feature involves data)*

- **Bio principal**: párrafo del hero. Atributos relevantes: persona narrativa (1ra), longitud (40–90 palabras), tono (cálido + técnico), menciones obligatorias (rol, sector, motivación).
- **About**: bloque secundario en `#about`. Mismo tono, expande sobre el hero. Incluye al menos un dato humano (familia/fútbol) explícito.
- **Meta descripción**: cadena ≤ 160 chars en `<meta>` y OG. Refleja el tono nuevo.
- **Placeholder**: cualquier literal `[X]`, `TODO`, `FIXME`, `XXX` en archivo servido. Cardinalidad objetivo: 0.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cero (0) ocurrencias visibles de `[Tu Nombre]`, `TODO`, `FIXME`, `XXX` en archivos HTML servidos tras el merge.
- **SC-002**: El párrafo del hero pasa de ~110 palabras (estado actual, tono CV) a 40–90 palabras (estado deseado, tono cálido). Reducción mínima del 25% en longitud.
- **SC-003**: El hero menciona al menos 1 dato humano (familia o fútbol) y al menos 1 dato profesional (DevOps/DevSecOps/banca) integrados en prosa.
- **SC-004**: 100% de los visitantes que recorren la home pueden identificar el rol profesional de Victor leyendo solo el hero (validable pidiendo a 2–3 lectores que resuman lo leído).
- **SC-005**: Lighthouse Accessibility y axe-core (`tests/a11y.js`) reportan **0 violaciones** WCAG 2.1 AA tras el cambio (no regresión).
- **SC-006**: `npx html-validate` reporta **0 errores** sobre los HTML modificados.
- **SC-007**: Lectura del hero en mobile (≤ 380 px) sin scroll horizontal en navegadores modernos (Safari iOS 16+, Chrome Android 12+).
- **SC-008**: La bio resulta consistente con la firma corta "Victor Ardón" — el nombre completo aparece una sola vez como ancla autoritativa; las referencias subsiguientes usan "Victor" o "Josue" en primera persona ("Soy Victor, …").

## Assumptions

- El visitante tipo lee en español; la versión en inglés es out-of-scope para esta spec.
- La foto/avatar del autor NO entra en alcance de esta spec (se puede añadir en una spec posterior).
- Los CSS responsables del hero (`assets/css/home.css`) ya soportan textos de 40–90 palabras sin cambios estructurales; solo se ajusta el copy. Si surge un problema de layout, se documenta como fuera de alcance y se prioriza re-spec.
- Las redes sociales enlazadas (LinkedIn / GitHub / Twitter, si existen en el footer) NO se modifican en esta spec; la consistencia tonal con esos perfiles es responsabilidad del autor fuera de Spec Kit.
- El placeholder `[Tu Nombre]` ya está reemplazado en el `h1` del hero principal (verificación rápida confirma "Victor Josue Ardón Rojas" en `index.html`). La auditoría US2 se enfoca en barrer por si quedan ocurrencias en otros archivos servidos (`talks/`, `blog/`, `404.html`, sitemap, etc.).
- El dato humano elegido —familia + fútbol— está autorizado explícitamente por el autor y no se considera información sensible en su contexto profesional.
- La spec no introduce nuevos gates obligatorios de CI; la verificación de placeholders se puede ejecutar como parte de la validación del PR (o, opcionalmente, como un gate trivial `bash tests/no-placeholders.sh` decidido en `/speckit.plan`).
- El registro tonal tico se aplica con moderación (1–2 toques discretos máximo) para no alienar visitantes hispanohablantes de otras regiones.
