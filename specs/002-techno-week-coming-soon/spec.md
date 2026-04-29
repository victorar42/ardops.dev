# Feature Specification: Techno Week 8.0 — Estado "Coming Soon"

**Feature Branch**: `002-techno-week-coming-soon`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: Mantener visible la sección Techno Week 8.0 en `ardops.dev` como teaser informativo hasta el día de la charla (18 de mayo de 2026), comunicando título, fecha, audiencia y formato sin filtrar slides, repo demo ni materiales descargables. Tras la charla, el operador debe poder "liberar" el contenido cambiando un único interruptor.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visitante descubre la charla sin acceso a material sensible (Priority: P1)

Un visitante (reclutador, asistente potencial, colega del sector financiero) llega al landing de `ardops.dev` antes del 18 de mayo de 2026. En la sección "Techno Week 8.0" entiende, sin ambigüedad, que existe una charla del autor, de qué trata a alto nivel, cuándo y dónde será, y que el material completo se publicará el día del evento. No encuentra ningún enlace clickeable que lo lleve a slides, repositorio demo o recursos descargables.

**Why this priority**: Es el objetivo primario de la spec. Sin esta historia no hay valor: comunica el evento sin filtrar contenido sensible. Es lo único que necesita estar listo antes del 18 de mayo para que el sitio esté en estado correcto.

**Independent Test**: Cargar el landing con un navegador limpio antes de la fecha del evento. La sección Techno Week debe mostrar un indicador visible de "Próximamente", la fecha, la descripción de alto nivel, audiencia y formato. Inspeccionar el DOM y el HTML servido: no debe existir ninguna URL hacia slides, repositorio demo u otros materiales privados, ni siquiera oculta vía CSS, atributo `hidden`, `data-*` o comentario HTML.

**Acceptance Scenarios**:

1. **Given** el sitio en producción antes del 18 de mayo de 2026, **When** un visitante carga `https://ardops.dev/`, **Then** ve un badge claramente visible que dice "Próximamente" en la sección Techno Week 8.0, junto con la fecha "18 de mayo de 2026".
2. **Given** la misma sección, **When** el visitante revisa el contenido textual, **Then** encuentra título de la charla, descripción breve (2–4 líneas), audiencia objetivo (sector financiero / banca CR) y formato (60 minutos, presencial).
3. **Given** la sección en estado teaser, **When** el visitante intenta hacer click en cualquier elemento que parezca un enlace a slides, repo demo o recursos, **Then** no existe tal enlace o el elemento es informativo no-interactivo (texto, no `<a>`).
4. **Given** un usuario inspecciona el código fuente HTML servido, **When** busca URLs hacia slides, repos privados, descargas o recursos del evento, **Then** no encuentra ninguna (ni visible, ni oculta, ni comentada).

---

### User Story 2 — Operador libera el contenido el día del evento (Priority: P1)

El propietario del sitio (Josue) llega al día del evento (o inmediatamente después de la charla) y necesita "liberar" el material publicando slides, enlace al repo demo y recursos asociados, sin tener que rediseñar la sección. Espera cambiar un único interruptor (variable, constante o flag explícito en el código fuente) y, opcionalmente, completar las URLs reales de los materiales, para que la sección pase del estado teaser al estado publicado.

**Why this priority**: Sin esta historia, la spec falla en su segundo objetivo: que el cambio post-charla sea trivial y de bajo riesgo. Es P1 porque define el contrato de la solución (un solo punto de cambio) y debe estar lista antes de la charla, no después.

**Independent Test**: Cambiar el valor del interruptor documentado (ej. `TALK_PUBLISHED = true` o equivalente) y reabrir el sitio. La sección debe ocultar el badge "Próximamente" y mostrar los enlaces a materiales (asumiendo que sus URLs ya están provistas). El cambio debe estar documentado en `README.md` o equivalente versionado.

**Acceptance Scenarios**:

1. **Given** el repositorio en estado teaser, **When** Josue lee el `README.md`, **Then** encuentra instrucciones explícitas de qué archivo y qué línea/variable cambiar para liberar el contenido post-charla.
2. **Given** el flag de publicación cambiado a "publicado", **When** se despliega el sitio, **Then** el badge "Próximamente" desaparece, los enlaces a materiales aparecen, y la sección queda en estado de talk publicada sin cambios visuales adicionales requeridos.
3. **Given** el flag aún en estado teaser, **When** se despliega el sitio, **Then** los enlaces a materiales no se renderizan en el HTML servido (no es CSS hiding).

---

### User Story 3 — Lector con tecnología asistiva entiende el estado de la sección (Priority: P2)

Una persona que usa lector de pantalla o navega por teclado llega a la sección Techno Week 8.0. Debe percibir, con la misma claridad que un usuario visual, que el contenido está en estado "próximamente" y cuándo se publicará el material.

**Why this priority**: La constitución exige WCAG 2.1 AA y Lighthouse a11y = 100 (Principio VI). Esta historia evita regresiones de accesibilidad. Es P2 porque depende de que P1 exista, pero no debe quedarse fuera del MVP.

**Independent Test**: Recorrer la sección con un lector de pantalla (VoiceOver/NVDA) y solo con teclado. El badge debe anunciar un texto descriptivo equivalente (ej. "Contenido próximamente, disponible el 18 de mayo de 2026"). Ningún elemento decorativo del badge debe interferir con la navegación.

**Acceptance Scenarios**:

1. **Given** un usuario con lector de pantalla en la sección Techno Week, **When** el foco llega al badge, **Then** se anuncia un texto accesible que comunica estado y fecha de publicación.
2. **Given** un usuario navegando por teclado, **When** recorre la sección, **Then** no hay elementos focusables que apunten a recursos sensibles (no existen).
3. **Given** la página renderizada, **When** se evalúa el contraste del badge contra su fondo, **Then** cumple el ratio WCAG AA mínimo (4.5:1 para texto normal, 3:1 para texto grande según corresponda).

---

### Edge Cases

- **Viewport ≤ 380px**: el badge no debe romper el layout, salirse del contenedor ni provocar scroll horizontal en la card.
- **Modo "publicado" sin URLs definidas**: si el operador activa el flag pero olvida proveer URLs reales de materiales, la sección no debe renderizar enlaces vacíos o rotos; debe degradar a un estado equivalente al teaser para los recursos sin URL.
- **Cambio de fecha del evento**: si el evento se reagenda antes del 18 de mayo, la fecha mostrada debe poder actualizarse en un único lugar coherente con el flag de publicación.
- **Contenido sensible en historia git**: si commits anteriores al merge incluyeron URLs o nombres de archivos sensibles del evento, el responsable debe revisar el historial antes de publicar el repo (responsabilidad operativa, no de la feature).
- **Cache/CDN agresivo de GitHub Pages**: tras flipear el flag, los visitantes con HTML cacheado pueden seguir viendo el estado teaser hasta que se invalide la caché del navegador. La feature no garantiza propagación instantánea.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La sección Techno Week 8.0 del landing DEBE mostrar un indicador visible de "Próximamente" mientras el flag de publicación esté en estado no-publicado.
- **FR-002**: La sección DEBE mostrar la fecha de la charla en formato legible en español (por ejemplo, "18 de mayo de 2026").
- **FR-003**: La sección DEBE incluir una descripción breve de 2 a 4 líneas sobre el tema de la charla, sin revelar contenido sensible (sin slides, sin código demo, sin spoilers operativos).
- **FR-004**: La sección DEBE indicar la audiencia objetivo (sector financiero / banca CR) y el formato (charla de 60 minutos, presencial).
- **FR-005**: Mientras el flag esté en estado no-publicado, el HTML servido NO DEBE contener ningún enlace (`<a href>`) hacia slides, repositorio demo o recursos descargables del evento, ni visible, ni oculto vía CSS/`hidden`/`aria-hidden`, ni comentado.
- **FR-006**: Cualquier llamada a la acción presente en estado teaser DEBE ser informativa y no-interactiva (texto plano), comunicando que el material se publica el día del evento.
- **FR-007**: El estado de publicación DEBE controlarse desde un único punto en el código (un flag, constante o variable) cuyo cambio sea suficiente para alternar entre estado teaser y estado publicado.
- **FR-008**: El indicador "Próximamente" DEBE ofrecer un nombre/etiqueta accesible equivalente al texto visual, comunicando estado y fecha de publicación a tecnologías asistivas.
- **FR-009**: La sección DEBE renderizarse correctamente (sin overflow horizontal ni layout roto) en viewports desde 320px hasta desktop estándar.
- **FR-010**: El repositorio DEBE incluir documentación versionada (en `README.md` o documento equivalente bajo `docs/`/`specs/`) que indique qué archivo y qué interruptor modificar para liberar el contenido tras el evento.
- **FR-011**: La feature NO DEBE introducir countdown dinámico ni dependencias JavaScript de terceros; cualquier comportamiento dinámico debe justificarse explícitamente. (Ver Assumptions sobre el countdown opcional.)
- **FR-012**: La feature DEBE preservar la identidad visual del sitio (paleta, tipografías, animaciones existentes) según `.reference/v1-design/index.html` y la constitución.

### Key Entities

- **Estado de publicación de la charla**: representa si el material asociado a la charla está liberado al público. Atributos lógicos: indicador booleano (publicado / no-publicado), fecha objetivo de publicación. Es el único interruptor relevante para alternar entre los dos modos visuales de la sección.
- **Sección Techno Week 8.0 (vista teaser)**: bloque del landing visible cuando la charla aún no está publicada. Contiene: título de la charla, fecha, audiencia, formato, descripción breve, badge "Próximamente", CTA informativo no-interactivo.
- **Sección Techno Week 8.0 (vista publicada)**: el mismo bloque cuando el flag indica publicado. Contiene los mismos datos descriptivos más enlaces reales a materiales (slides, repositorio demo, recursos). Esta vista ya existe parcialmente en el sitio y queda fuera de cambios visuales obligatorios por esta spec, salvo lo necesario para integrar el flag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Antes del 18 de mayo de 2026, el 100% de las cargas del landing muestran el badge "Próximamente" en la sección Techno Week 8.0 (verificable por inspección manual y por test automatizado en CI que compruebe la presencia del texto del badge en `index.html`).
- **SC-002**: Antes del 18 de mayo de 2026, el HTML servido contiene 0 (cero) URLs hacia slides, repositorio demo o recursos descargables del evento (verificable por un check automatizado que escanee el HTML construido contra una lista de patrones prohibidos).
- **SC-003**: Liberar el contenido tras la charla requiere modificar exactamente 1 archivo de código y 1 línea/flag para alternar el estado, más opcionalmente las URLs reales de materiales (verificable midiendo el diff del PR de liberación).
- **SC-004**: Lighthouse Accessibility de la página principal se mantiene en 100 tras el cambio (cumple constitución VI; verificable en CI con el budget de Lighthouse ya existente en `tests/`).
- **SC-005**: Lighthouse Performance de la página principal se mantiene ≥ 95 y CLS ≤ 0.1 tras el cambio (cumple constitución VII; verificable en CI).
- **SC-006**: La sección renderiza sin overflow horizontal en viewports desde 320px hasta 1920px (verificable por inspección manual / snapshot responsive).
- **SC-007**: La documentación de liberación post-charla es localizable por una persona nueva en menos de 60 segundos buscando "techno week" o "publicar charla" en el repo (verificable por revisión de pares).

## Assumptions

- **Idioma del badge**: el texto se renderiza en español ("Próximamente"), dado que la audiencia primaria del sitio y de la charla es de Costa Rica. Esto resuelve la pregunta abierta del input original.
- **Countdown visual**: queda fuera del alcance de esta spec. La sección muestra la fecha de forma estática. Si en el futuro se desea countdown, se hará en una spec separada y debe justificar cualquier dependencia JS adicional según la constitución (Principio IV).
- **Lugar de la implementación**: se asume que la sección Techno Week 8.0 vive en el `index.html` del landing (sección `#talk`) y eventualmente en `talks/index.html`. La spec aplica a todas las superficies donde hoy se exponen enlaces o referencias a materiales del evento.
- **Mecanismo del flag**: dado que el sitio es 100% estático (constitución III) y no hay build server-side, el "flag" se implementa como una decisión de contenido editado manualmente en el HTML (por ejemplo, comentar/descomentar un bloque o intercambiar dos bloques predefinidos), no como una variable evaluada en runtime. La spec exige que ese punto de edición sea único, evidente y documentado; el plan decidirá la forma técnica concreta.
- **No hay sistema de notificaciones por email** ni página dedicada `/techno-week`; ambas quedan fuera de alcance explícito.
- **Auto-liberación programada** del contenido (basada en fecha del cliente o servidor) queda fuera de alcance: el cambio de estado lo realiza el operador manualmente.
- **Rollback**: si tras desplegar el cambio se detectan problemas visuales o de comprensión, revertir el commit restablece el estado anterior sin pérdida de información.
- **Higiene del historial git**: revisar y, si aplica, sanear el historial del archivo modificado para evitar exponer URLs o nombres de archivos sensibles en commits previos es responsabilidad operativa documentada en la sección de seguridad de esta spec, no un entregable funcional de la feature.
- **Bandera por defecto**: el repositorio se mergea con el flag en estado "no publicado" hasta el día del evento. El cambio a "publicado" es un PR posterior.
