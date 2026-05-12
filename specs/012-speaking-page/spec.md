# Feature Specification: Speaking Page (kit de prensa para invitaciones)

**Feature Branch**: `012-speaking-page`
**Created**: 2026-05-12
**Status**: Draft
**Input**: User description: "Implementar Backlog 05 — Página `/speaking/` con tres bios (corta/media/larga), foto HD descargable, lista de temas con duración y audiencia, idiomas y formatos, mailto template estructurado. Diferenciada de `/talks/` (que es histórico). JSON-LD Person referenciado. Sin formularios ni third-party. Copiar bio como JS opcional con fallback de `<details>`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Organizadora de evento prepara invitación formal (Priority: P1)

Una organizadora de un meetup o conferencia descubre a Victor en
LinkedIn o en una charla previa y quiere invitarlo a hablar. Abre
`https://ardops.dev/speaking/` y en una sola página obtiene todo lo
que su comité necesita: bio en el formato exacto que pide la plantilla
del evento (corta para badge, media para programa, larga para press
kit), una foto HD lista para descargar, y un correo prellenado con los
campos clave (fecha, audiencia, duración, modalidad, compensación)
para arrancar la conversación con contexto.

**Why this priority**: Es el caso de uso central del backlog. Sin esta
página, el flujo termina en un correo vago "queremos invitarte" que
genera 3-4 rondas de aclaraciones. Esta página colapsa el ciclo a un
solo intercambio cualificado.

**Independent Test**: Cargar `/speaking/` en cualquier browser, copiar
una de las tres bios, descargar el headshot, y hacer clic en el CTA
mailto. El cliente de correo (Gmail web, Apple Mail) debe abrirse con
asunto y cuerpo prellenados, listos para que la organizadora rellene
los blanks.

**Acceptance Scenarios**:

1. **Given** una organizadora visita `/speaking/`, **When** copia la
   bio media usando el botón "Copiar", **Then** el portapapeles
   contiene el texto exacto de la bio sin marcado HTML residual.
2. **Given** la misma organizadora, **When** hace clic en el enlace de
   descarga del headshot, **Then** el navegador descarga un archivo
   JPG ≥ 1200×1200 px con el nombre `ardon-headshot.jpg`.
3. **Given** la misma organizadora, **When** hace clic en el CTA
   "Invitame a tu evento", **Then** se abre su cliente de correo con
   destinatario `contacto@ardops.dev`, asunto que arranca con
   "Invitación a speaking:" y cuerpo con los campos Evento, Fecha,
   Audiencia, Duración, Tema propuesto, Modalidad, Compensación,
   Contexto adicional.

---

### User Story 2 — Visitante con JS bloqueado o lector de pantalla (Priority: P1)

Una persona accede al sitio con JavaScript desactivado (NoScript, Tor
Browser strict, navegador con bloqueador agresivo) o con un lector de
pantalla. Necesita ver, leer y copiar manualmente las tres bios y
descargar la foto sin depender de scripts.

**Why this priority**: Constitución VI (a11y WCAG 2.1 AA) y IV (cero
deps JS sin justificación). El "Copiar bio" es un nice-to-have; el
contenido nunca puede depender de JS para ser accesible.

**Independent Test**: Desactivar JavaScript en DevTools y recargar
`/speaking/`. Las tres bios deben permanecer visibles (o expandibles
con `<details>`/`<summary>` nativo, sin script). El headshot se
descarga con el atributo `download` nativo del `<a>`. El mailto
funciona con el resolver del SO. axe-core pasa con 0 violaciones.

**Acceptance Scenarios**:

1. **Given** JavaScript está deshabilitado, **When** la persona abre
   `/speaking/`, **Then** las tres bios son legibles (visibles o
   expandibles vía `<details>` nativo) y seleccionables manualmente.
2. **Given** un usuario navega solo con teclado, **When** tabula por
   la página, **Then** todos los controles interactivos (botones de
   copiar, enlace de descarga, CTA mailto, links a `/talks/` y
   LinkedIn) son alcanzables en orden lógico y muestran focus ring
   visible.
3. **Given** un lector de pantalla, **When** anuncia la sección
   "Temas que doy", **Then** cada tema se anuncia como ítem de lista
   con título, audiencia y duración expresados como texto (no solo
   iconos).

---

### User Story 3 — Periodista o podcaster verifica credibilidad (Priority: P2)

Una periodista o host de podcast llega a `/speaking/` referida por un
tercero. Antes de enviar la invitación quiere validar que Victor tiene
charlas previas reales, idiomas, formatos que ofrece y que el material
luce profesional. Necesita un puente claro a `/talks/` (histórico) y a
LinkedIn.

**Why this priority**: Refuerza la conversión pero no es bloqueante.
Si las bios y el mailto están, la invitación llega igual. Subir
tráfico calificado a `/talks/` es una victoria secundaria.

**Independent Test**: Verificar que la sección "Eventos pasados
destacados" lista 3-5 charlas reales con enlace a `/talks/` para la
lista completa, y que el bloque "Idiomas y formatos" enumera idiomas
(español nativo, inglés profesional), formatos (keynote, workshop,
panel, podcast, AMA) y modalidad (presencial CR / remoto LATAM).

**Acceptance Scenarios**:

1. **Given** la periodista llega a la página, **When** scrollea a
   "Eventos pasados destacados", **Then** ve entre 3 y 5 charlas con
   título, evento y año, y un enlace "Ver historial completo" que
   apunta a `/talks/`.
2. **Given** la misma periodista, **When** lee la sección "Idiomas y
   formatos", **Then** identifica claramente idiomas, formatos
   ofrecidos y modalidad sin ambigüedad.

---

### Edge Cases

- **JS bloqueado**: el botón "Copiar" no debe lanzar errores ni dejar
  un estado roto. La página degrada a `<details>`/`<summary>` nativo
  y el texto sigue seleccionable. Sin spinners infinitos ni botones
  que parecen funcionales pero no hacen nada.
- **Clipboard API rechazada por el browser** (permisos, contexto no
  seguro): el handler atrapa la excepción y muestra un estado visible
  "Selección manual abajo ↓" sin lanzar al usuario a un alert.
- **Headshot pesado**: el JPG entregado debe estar comprimido a
  ≤ 250 KB sin sacrificar resolución mínima (1200×1200). Si por
  alguna razón el archivo supera ese umbral en build, una gate de
  performance falla.
- **Mailto sin cliente configurado**: la página debe seguir mostrando
  `contacto@ardops.dev` como texto copiable junto al CTA, no solo
  dentro del `href`.
- **Cambios al headshot futuros**: el nombre del archivo descargado
  debe ser estable (`ardon-headshot.jpg`) para que organizadoras que
  ya lo guardaron no terminen con duplicados.
- **Idiomas adicionales o nuevos formatos**: la sección debe ser
  fácil de extender editando solo HTML (sin tocar JS ni CSS) — listas
  planas, no widgets.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sitio MUST servir la ruta `/speaking/` mediante el
  archivo `speaking/index.html`.
- **FR-002**: La página MUST contener tres bios en `<section>`
  separadas con encabezados claros: bio corta (~30 palabras, 1
  párrafo), bio media (~80 palabras, 2 párrafos) y bio larga (~200
  palabras, 3-4 párrafos). Cada conteo de palabras es un objetivo de
  redacción ±15 %.
- **FR-003**: Cada bio MUST exponer un control "Copiar bio" que,
  cuando JS está disponible, copia al portapapeles solo el texto
  plano de esa bio (sin HTML, sin etiquetas, sin trailing whitespace
  excesivo) usando `navigator.clipboard.writeText`. El control debe
  dar feedback visual accesible (texto cambia a "Copiado ✓" durante
  ≥ 2 s, anunciado por `aria-live="polite"`).
- **FR-004**: Si JS está bloqueado o la API falla, el bloque MUST
  degradar a un `<details><summary>` nativo (o equivalente sin
  script) que expone el texto íntegro de la bio para selección
  manual. Sin JS, cero placeholders rotos.
- **FR-005**: El sitio MUST servir el headshot HD en
  `assets/img/speaking/headshot.jpg`, ≥ 1200×1200 px, JPG
  progresivo, comprimido a ≤ 250 KB. La página MUST incluir un
  enlace
  `<a href="/assets/img/speaking/headshot.jpg" download="ardon-headshot.jpg">`
  con etiqueta legible que indique tamaño aproximado en KB y
  dimensiones.
- **FR-006**: La página MUST mostrar una versión "preview" del
  headshot inline con `loading="lazy"`, `decoding="async"`,
  `width`/`height` explícitos y `alt` descriptivo. El preview puede
  ser el mismo archivo HD o una variante reducida — pero CLS debe
  permanecer < 0.1.
- **FR-007**: La sección "Temas que doy" MUST listar entre 4 y 8
  temas como `<article>`s, cada uno con: título, descripción de 1-2
  líneas, audiencia objetivo (ej: "ingenieros junior/mid", "líderes
  técnicos") y duración aproximada (ej: "45 min + 15 min Q&A").
  Texto real, sin Lorem.
- **FR-008**: La página MUST incluir una sección "Idiomas y
  formatos" con tres bloques: (a) idiomas (español nativo, inglés
  profesional), (b) formatos (keynote, workshop, panel, podcast,
  AMA), (c) modalidad (presencial Costa Rica, remoto LATAM).
- **FR-009**: La página MUST exponer un CTA principal "Invitame a tu
  evento" como `<a>` con `href` mailto a `contacto@ardops.dev`,
  `subject` prellenado "Invitación a speaking: [evento]" y `body`
  prellenado con los campos: Evento, Fecha, Audiencia, Duración,
  Tema propuesto, Modalidad (presencial/remoto), Compensación,
  Contexto adicional. URL-encoded correctamente, con saltos de línea
  (`%0A`).
- **FR-010**: La dirección `contacto@ardops.dev` MUST aparecer
  también como texto visible y seleccionable junto al CTA, no solo
  dentro del `href`, para clientes sin handler mailto.
- **FR-011**: La página MUST incluir una sección "Eventos pasados
  destacados" con 3-5 charlas (título, evento, año) y un enlace "Ver
  historial completo" que apunte a `/talks/`.
- **FR-012**: La página MUST emitir un bloque JSON-LD `Person` que
  referencie por `@id` al `Person` canónico declarado en home
  (`https://ardops.dev/#person`, ya establecido en spec 011),
  evitando duplicación de propiedades.
- **FR-013**: El enlace a `/speaking/` MUST aparecer en la
  navegación global compartida (`NAV_LINKS` en
  `scripts/build-layout.js`, alimentado por spec 008) y en el footer
  compartido. La consistencia se valida con la gate
  `tests/nav-consistency.sh`.
- **FR-014**: La página MUST cumplir el contrato CSP del sitio (sin
  `unsafe-inline`, sin `unsafe-eval`, mismo
  `Content-Security-Policy` meta que el resto), el contrato de SEO
  meta (canonical absoluto, description, OG/Twitter cards completas)
  y aparecer en `sitemap.xml`.
- **FR-015**: Cualquier enlace externo (LinkedIn, etc.) MUST llevar
  `target="_blank" rel="noopener noreferrer"` y pasar la gate
  `tests/external-links.sh`.
- **FR-016**: Si se introduce un módulo JS para "Copiar bio", MUST
  vivir en `assets/js/copy-bio.js`, ser cargado con `defer`, no
  superar 1 KB minificado (es vanilla, sin deps), y registrar
  listeners por `data-*` attributes (sin inline handlers). Debe
  pasar la gate `tests/csp-no-unsafe-inline.sh`.

### Key Entities

- **Bio**: texto plano en tres longitudes (corta / media / larga).
  Cada variante es contenido editorial estable, versionado en el
  HTML; no hay datos dinámicos.
- **Tema (speaking topic)**: ítem editorial con título, descripción,
  audiencia objetivo y duración. Editable directamente en HTML.
- **Charla destacada (past talk highlight)**: subset (3-5) curado de
  los datos canónicos de `/talks/`. La página NO sincroniza
  automáticamente — es selección editorial manual.
- **Headshot**: archivo binario en `assets/img/speaking/headshot.jpg`,
  servido como preview inline + descarga directa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una organizadora puede obtener bio + foto + iniciar
  correo prellenado en menos de 60 segundos desde que carga la
  página por primera vez.
- **SC-002**: Lighthouse Performance ≥ 95 y Accessibility = 100 en
  móvil para `/speaking/` (constitución VI y VII).
- **SC-003**: Lighthouse SEO ≥ 95 para `/speaking/` (mismo umbral
  que spec 011).
- **SC-004**: La página pesa ≤ 350 KB transferidos en la primera
  carga (HTML + CSS + JS + headshot preview), excluyendo la descarga
  voluntaria del headshot HD.
- **SC-005**: Cero violaciones axe-core / pa11y en `/speaking/`.
- **SC-006**: Con JavaScript deshabilitado, las tres bios son
  legibles (≥ 95 % del contenido textual visible o expandible
  nativamente) y la descarga del headshot funciona.
- **SC-007**: Las tres bios reproducen exactamente al portapapeles
  el texto visible (diff = 0 caracteres significativos: solo se
  permiten diferencias de whitespace colapsado).
- **SC-008**: El CTA mailto abre un cliente de correo con asunto y
  los 8 campos del cuerpo correctamente delimitados (verificación
  manual en Gmail web + Apple Mail).
- **SC-009**: Cero dependencias JS de terceros añadidas
  (constitución IV). Cero llamadas a CDNs externos en runtime
  (constitución V).
- **SC-010**: La página queda registrada en `sitemap.xml` y en la
  navegación global; las gates `nav-consistency`, `sitemap-drift`,
  `no-placeholders`, `csp-no-unsafe-inline`, `external-links`,
  `seo-meta`, `jsonld-validate` y `html-validate` pasan en CI.

## Assumptions

- La identidad visual reusa los tokens existentes
  (`assets/css/tokens.css`, `components.css`, `layout.css`); no se
  introducen variables de color ni tipografías nuevas. La estética
  terminal/code-first se preserva (constitución II).
- El correo de contacto canónico es `contacto@ardops.dev`. Si Victor
  prefiere otro alias dedicado para invitaciones (ej. `speaking@`),
  se decide en `/plan` o `/clarify`; el default usado aquí es
  `contacto@ardops.dev` por consistencia con el resto del sitio.
- La navegación global compartida ya existe (entregada por spec
  008). Esta spec añade un nodo más (`/speaking/`) sin modificar la
  arquitectura del builder.
- El JSON-LD `Person` canónico ya está declarado en home con
  `@id="https://ardops.dev/#person"` (entregado por spec 011). Esta
  página solo lo referencia.
- El headshot HD existe (o será proporcionado optimizado al iniciar
  `/implement`); su producción/optimización fotográfica está fuera
  de scope de esta spec.
- La curaduría editorial (qué temas, qué bios exactas, qué charlas
  destacadas) la define Victor antes o durante `/implement`. La
  spec define la **estructura** y **contratos**, no el copy final.
- El sitio sigue siendo 100 % estático en GitHub Pages (constitución
  III, XI). Cero formularios, cero backend, cero embebidos
  third-party (calendly, video reels, etc.).

## Out of Scope

- Formulario nativo de invitación (requiere backend o servicio
  externo → viola constitución III/V/VIII).
- Calendario embebido tipo Calendly / Cal.com (third-party runtime
  → viola constitución V/VIII).
- Video reel / showreel embebido por iframe (third-party → viola
  constitución V).
- Sistema de tracking o analytics de invitaciones recibidas
  (constitución VIII: cero tracking de terceros).
- Generación dinámica de variantes de la imagen (cuadrada,
  horizontal, B&N): si se quieren ofrecer, se commitean ya
  optimizadas como archivos adicionales; el pipeline de
  procesamiento queda fuera.
- Internacionalización completa de la página a inglés (la bio y
  temas pueden mencionar inglés como idioma ofrecido, pero la
  página en sí permanece en español en esta versión).
- Re-arquitectura de `/talks/`: esta página solo enlaza a la lista
  existente; cualquier cambio al builder de talks vive en otra
  spec.
