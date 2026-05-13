# Feature Specification: `/now/` page — qué estoy haciendo este mes

**Feature Branch**: `013-now-page`
**Created**: 2026-05-13
**Status**: Draft
**Input**: User description: "Implementar el Backlog 06 — Now Page. Página /now/ estilo nownownow.com con banner de última actualización (datetime), secciones cortas (Trabajo, Aprendiendo, Leyendo, Hablando, Vida), bullets máx 5 por sección. Credit a nownownow al pie. Link en footer (no nav principal) + link sutil en home. Opcionalmente gate de freshness 90 días."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitante curioso descubre actividad reciente (Priority: P1) — MVP

Una persona que llegó a `ardops.dev` (por una charla, un post o un recomendado en LinkedIn) quiere saber **qué está haciendo Victor ahora mismo, sin tener que leer todo el blog**. Busca en el footer "ardops.dev/now", entra, y en menos de 30 segundos ve: fecha de última actualización, en qué trabaja, qué está aprendiendo y qué leyó hace poco. Se va con sensación de "está activo, vale la pena seguirlo".

**Why this priority**: Es el corazón del feature. Sin esta página, el backlog entero no existe. Sustenta actividad entre publicaciones de blog y abre conversación de networking sin costo cognitivo de redacción larga.

**Independent Test**: Cargar `https://ardops.dev/now/` en navegador, comprobar que la fecha visible es real (no placeholder) y que al menos tres secciones contienen bullets concretos (proyecto, libro, tema de aprendizaje). Verifica que el visitante obtiene contexto profesional sin scroll excesivo.

**Acceptance Scenarios**:

1. **Given** un visitante llega a `/now/`, **When** carga la página, **Then** ve un banner con "Última actualización: <fecha legible>" donde la fecha está marcada con `<time datetime="YYYY-MM-DD">` parseable por máquina.
2. **Given** la página renderiza, **When** el visitante recorre el contenido, **Then** encuentra al menos 3 secciones temáticas (Trabajo, Aprendiendo, Leyendo como mínimo) cada una con entre 1 y 5 bullets reales (sin placeholders tipo "Lorem", "[TODO]", "[Tu Nombre]").
3. **Given** la página termina, **When** el visitante busca atribución, **Then** encuentra un credit al movimiento `nownownow.com` con enlace externo seguro (`rel="noopener noreferrer"`, `target="_blank"`).

---

### User Story 2 - Recurrente verifica que el sitio sigue vivo (Priority: P1)

Alguien que ya conoce el sitio (recruiter, organizador de evento, lector del blog) entra cada cierto tiempo. Necesita una señal rápida de "sigue activo / la información no está stale". Va al footer, click en "Now", y la fecha del banner le confirma que la página se actualizó en los últimos 1-2 meses. No necesita leer todo otra vez — la fecha es suficiente.

**Why this priority**: Sin esta señal de frescura, el feature pierde su razón de ser. La fecha visible y el gate de freshness (US3) son lo que diferencia un `/now/` de una página "sobre mí" estática.

**Independent Test**: Verificar que el banner muestra fecha en formato humano legible (ej. "12 de mayo de 2026") y que el `datetime` atributo está en formato ISO 8601 (`YYYY-MM-DD`). El test automatizado puede parsear el atributo y validar formato.

**Acceptance Scenarios**:

1. **Given** un visitante recurrente accede a `/now/`, **When** mira el banner superior, **Then** la fecha está visible "above the fold" en mobile (≤ 640px) sin necesidad de scroll.
2. **Given** la página tiene fecha de hace 60 días, **When** se accede, **Then** se muestra normalmente sin warning (60 < 90 días).

---

### User Story 3 - Mantenedor evita olvidar actualizar (Priority: P2)

Victor (autor del sitio) hace un commit en `main` para una feature distinta. CI corre. Si la página `/now/` no ha sido actualizada en más de 90 días, el pipeline falla con mensaje claro: "now-freshness gate: /now/ no se actualiza desde YYYY-MM-DD (X días). Actualizá `now/index.html` con bullets y nueva fecha." Esto fuerza la disciplina sin requerir un calendario externo.

**Why this priority**: Convierte una buena intención ("voy a actualizar cada 4-6 semanas") en una garantía mecánica. Sin esto, la página se vuelve obsoleta y pierde valor. P2 porque el sitio funciona aunque el gate no exista, pero el feature pierde mucho de su valor.

**Independent Test**: Ejecutar `bash tests/now-freshness.sh` localmente. Con fecha actual en el banner debe pasar (exit 0). Con fecha simulada de hace 91 días debe fallar (exit ≠ 0) con mensaje legible. Verificar también que el gate se invoca en CI.

**Acceptance Scenarios**:

1. **Given** `/now/index.html` tiene `<time datetime="YYYY-MM-DD">` con fecha de hace menos de 90 días, **When** se ejecuta `tests/now-freshness.sh`, **Then** el gate pasa con exit 0 y un mensaje "✓ now-freshness gate: /now/ actualizada hace X días".
2. **Given** el datetime indica una fecha de hace 91 días o más, **When** corre el gate, **Then** falla con exit ≠ 0 y mensaje explicativo señalando la fecha exacta y la cantidad de días.
3. **Given** el archivo no contiene un `<time datetime="">` parseable, **When** corre el gate, **Then** falla con mensaje "now-freshness: no se encontró `<time datetime>` parseable en now/index.html".
4. **Given** el gate falla, **When** Victor abre `now/index.html` y actualiza fecha + bullets, **Then** vuelve a pasar sin tocar más nada.

---

### Edge Cases

- **Sección "Vida" vacía u omitida**: Si Victor no quiere compartir nada personal este mes, la sección debe poder omitirse (no aparece). No debe existir un placeholder vacío.
- **Bullet único en una sección**: Aceptable. La regla es máximo 5, no mínimo 1. Si una sección tiene 1 bullet, sigue siendo válida.
- **Fecha futura por error humano**: Si Victor escribe `2027-12-31` por accidente, el gate debe rechazarla como inválida (no puede ser futura).
- **Cambio de zona horaria / fecha en CI**: El cálculo de "días desde" usa UTC para evitar inconsistencias.
- **Link desde home sutil**: El enlace en home debe ser visible pero no robar atención del CTA principal. Footer es el canal primario.
- **Browser sin JS**: La página debe renderizar perfectamente sin JavaScript. Es HTML estático.
- **Sección con > 5 bullets**: Si Victor agrega un 6º bullet por entusiasmo, el contenido sigue renderizando pero el `no-placeholders.sh` y el resto de gates no lo detectan. Se confía en la disciplina del autor y la revisión visual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-01**: El sitio MUST exponer la ruta `/now/` servida por el archivo `now/index.html`.
- **FR-02**: La página MUST contener un banner cerca del inicio con el texto "Última actualización" seguido de la fecha, donde la fecha esté envuelta en `<time datetime="YYYY-MM-DD">` (formato ISO 8601 compatible con HTML5).
- **FR-03**: La página MUST organizar el contenido en secciones temáticas con encabezado `<h2>`. Las secciones canónicas son: Trabajo, Aprendiendo, Leyendo, Hablando, Vida. La página MUST incluir al menos 3 de esas 5 (Trabajo + Aprendiendo + Leyendo como núcleo mínimo recomendado).
- **FR-04**: Cada sección MUST contener entre 1 y 5 items, en formato lista (`<ul>` o `<ol>`). No se permiten bloques de prosa larga ni párrafos múltiples por sección.
- **FR-05**: La página MUST ser accesible mediante un enlace en el footer global del sitio. Adicionalmente, MUST existir un enlace sutil hacia `/now/` desde la home (`index.html`) que no compita con el CTA principal. La página NO aparece en la navegación principal.
- **FR-06**: La página MUST incluir, cerca del cierre del contenido principal, una atribución al movimiento `nownownow.com` con un enlace externo que use `rel="noopener noreferrer"` y `target="_blank"`.
- **FR-07**: La página MUST emitir un bloque JSON-LD de tipo `WebPage` (o un `@graph` que lo contenga) con la propiedad `dateModified` igual a la fecha del banner. El JSON-LD MUST validar contra los gates existentes (`tests/jsonld-validate.sh`).
- **FR-08**: La página MUST aparecer en `sitemap.xml` con `lastmod` igual a la fecha del banner y prioridad razonable (sugerido 0.6 con `changefreq` `monthly`).
- **FR-09**: El proyecto MUST incluir un nuevo gate `tests/now-freshness.sh` que: (a) lea el primer `<time datetime>` de `now/index.html`; (b) calcule la diferencia en días contra `date -u`; (c) falle si esa diferencia es > 90 días o si la fecha es futura; (d) imprima un mensaje legible con la fecha y la cantidad de días.
- **FR-10**: La página MUST pasar todos los gates existentes (`html-validate`, `csp-no-unsafe-inline`, `seo-meta`, `jsonld-validate`, `no-placeholders`, `external-links`, `nav-consistency`, `sitemap-drift`) sin excepciones nuevas.
- **FR-11**: La página MUST cumplir WCAG 2.1 AA (verificable vía `npm run a11y` con `/now/` agregado a las URLs auditadas).
- **FR-12**: La página MUST reutilizar el header y footer compartidos provistos por `scripts/lib/layout.js` (markers `<!-- nav:start -->` / `<!-- footer:start -->`). El link al `/now/` en el footer MUST quedar consolidado en `scripts/lib/layout.js` para que aparezca en todas las páginas automáticamente.
- **FR-13**: La página MUST tener `<title>`, `<meta name="description">`, canonical, OG y Twitter tags propios (cumpliendo el contrato del gate `seo-meta`).
- **FR-14**: La página NO debe incluir JavaScript propio. El feature es 100% HTML/CSS. No se agregan dependencias nuevas (constitución III).

### Key Entities

- **Page `/now/`**: Documento HTML estático con metadatos (title, description, canonical, OG, Twitter), JSON-LD `WebPage`, header compartido, footer compartido, banner de fecha y 3-5 secciones de contenido. Atributos clave: `dateModified` (ISO 8601), número de secciones, número de bullets totales.
- **Section**: Bloque temático con un `<h2>` (Trabajo / Aprendiendo / Leyendo / Hablando / Vida) y una lista de 1-5 items. Sin sub-secciones.
- **Item (bullet)**: Una línea corta (≤ 200 caracteres recomendado) opcionalmente con un enlace externo. Si lleva link externo, debe usar `rel="noopener noreferrer"`.
- **Freshness gate**: Test bash que opera sobre la fecha extraída del banner. No tiene estado propio; es función pura de `now/index.html` y la fecha actual UTC.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-01**: El visitante encuentra la fecha de última actualización en menos de 5 segundos al cargar `/now/` (visible above the fold tanto en mobile 360px como desktop 1280px).
- **SC-02**: El 100% de las secciones publicadas en `/now/` tienen contenido real (no placeholders, no Lorem, no TODO) — verificable por `tests/no-placeholders.sh`.
- **SC-03**: La página `/now/` está incluida en el sitemap y en al menos un enlace navegable (footer), comprobado por `tests/sitemap-drift.sh` y `tests/nav-consistency.sh` (footer link) sin falsos positivos.
- **SC-04**: La página obtiene 0 violaciones WCAG 2.1 AA medidas por `tests/a11y.js` y `pa11y`.
- **SC-05**: El gate `tests/now-freshness.sh` pasa el día de la primera publicación y falla determinísticamente cuando se simula una fecha de hace > 90 días (verificable en local con `TZ=UTC` y un fixture de fecha vencida).
- **SC-06**: La página suma menos de 25 KB transferidos en total (HTML + CSS reutilizado, sin imágenes propias necesarias) sobre la línea base actual del sitio.
- **SC-07**: Lighthouse mobile mantiene Performance ≥ 95, Accessibility ≥ 100, Best-Practices ≥ 95, SEO ≥ 100 para `/now/` en `tests/lighthouserc.mobile.json`.
- **SC-08**: La frescura de la página, medida como días desde `dateModified` hasta `date -u` hoy, se mantiene ≤ 90 días en CI durante el ciclo de vida del feature (proxy: el gate `now-freshness` nunca falla en `main`).
- **SC-09**: Tiempo de actualización mensual del autor ≤ 15 minutos (proxy: el diff típico de un update es ≤ 30 líneas en `now/index.html` y un cambio de fecha + bullets, sin tocar templates ni scripts).

## Assumptions

- Se asume que existen las primitivas de layout compartido (`scripts/lib/layout.js`, `scripts/build-layout.js`) introducidas en spec 008 y que el footer se modifica una sola vez para incluir el link a `/now/`.
- Se asume que la convención visual y de tipografía sigue exactamente el sistema de design tokens vigente (`assets/css/tokens.css`) y la referencia `.reference/v1-design/index.html`. No se introducen colores nuevos ni fuentes nuevas.
- Se asume que la fecha del banner es siempre en UTC y que el autor actualiza la fecha cuando edita el contenido (manual). El gate de freshness sirve como red de seguridad.
- Se asume que el enlace "sutil" desde la home se acomoda en una zona ya existente (footer del hero, pie del primer bloque, o cerca del bio) sin redesign mayor.
- Se asume que la página NO necesita RSS propio en esta iteración (FR-08 del backlog queda explícitamente fuera de scope — ver "Out of Scope" abajo).
- Se asume que el sitio sigue siendo estático en GitHub Pages y que no se introducen workers/edge functions.
- Se asume que el contenido inicial de `/now/` (primera versión) lo aporta Victor en el momento de implementación; el código no embebe contenido placeholder fuera de fixtures bash de testing.

## Out of Scope

- **RSS / Feed `/now/feed.xml`**: el backlog lo marca como "optional / diferido". Queda explícitamente fuera de esta spec.
- **Histórico de versiones** de updates anteriores (no hay archivo /now/2026-04/, etc.). Lo que importa es el "ahora".
- **CMS o panel de admin** para editar bullets sin commits.
- **Comentarios, reacciones, newsletter** sobre `/now/`.
- **Localización / traducción**. La página vive solo en español (consistente con el resto del sitio).
- **Páginas similares** (`/uses/` ya existe, `/speaking/` también — esta spec no las modifica).
- **Cambios al header global**: la página NO entra al nav principal en ninguna variante.

## Constitución relevante

- **Principio I — Intencionalidad antes que código**: cada bullet existe porque aporta señal real; sin secciones rellenas.
- **Principio III — Zero deps por defecto**: no se agregan paquetes; el gate de freshness es bash + `date`.
- **Principio VI — Accesibilidad first**: WCAG 2.1 AA verificada por gates existentes.
- **Principio VII — HTML semántico**: `<time datetime>`, `<h1>` único, jerarquía consistente, listas reales.
- **Principio IX — CSP estricta** (si aplica en la versión vigente): sin inline scripts/styles no autorizados.
- **Principio X — Spec-Driven Development**: este documento es la fuente de verdad antes de tocar HTML.
