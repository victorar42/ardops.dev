# Feature Specification: Landing Page Redesign (v1)

**Feature Branch**: `001-landing-redesign`  
**Created**: 2026-04-24  
**Status**: Draft  
**Input**: User description: "Rediseñar la landing page de ardops.dev partiendo de la referencia visual en `.reference/v1-design/index.html`, conservando 100% paleta/tipografía/animaciones, reorganizando contenido en 7 secciones (Hero, Charla, Pipeline, About+stats, Blog placeholder, Contacto, Footer), preparada para multi-página, WCAG 2.1 AA, SEO + OG completos, CSP-compliant (CSS/JS externos, fonts self-hosted, sin tracking, sin libs JS externas)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visitante técnico evalúa al profesional en la home (Priority: P1)

Un profesional DevOps/SRE/Dev llega a `ardops.dev` (desde LinkedIn, una charla, o búsqueda) y necesita confirmar en menos de 30 segundos quién es Victor, qué ofrece, y dónde está la charla destacada (Techno Week 8.0) con sus recursos.

**Why this priority**: Es la razón de ser de la landing. Sin esto el sitio no cumple su propósito de presentación profesional ni amplifica la charla en banca.

**Independent Test**: Cargar `/` en desktop y mobile; verificar que el Hero muestra nombre, rol, descripción y CTAs visibles sin scroll en ≥ 1366×768; que el bloque de la charla aparece en la primera pantalla de scroll con título, evento, fecha y al menos los enlaces a Repositorio y Pipeline.

**Acceptance Scenarios**:

1. **Given** un visitante en desktop, **When** abre `https://ardops.dev/`, **Then** ve en el viewport inicial el nombre "Victor Josue Ardón Rojas", el rol "DevOps Engineer", una descripción breve y dos CTAs ("Techno Week 8.0", "Ver Repositorio").
2. **Given** un visitante en mobile (≤ 480px), **When** carga la landing, **Then** la jerarquía y CTAs siguen siendo legibles y tappables (mínimo 44×44 px), y el menú principal sigue siendo accesible (vía botón o navegación alternativa).
3. **Given** un visitante interesado en la charla, **When** hace clic en el CTA "Techno Week 8.0" o en el enlace de nav "Charla", **Then** el scroll lleva con suavidad a la sección "Techno Week 8.0" mostrando badge, título, evento (BCR — 18 mayo 2026), descripción y los enlaces a recursos (Repositorio, Pipeline, Slides, Guía).

---

### User Story 2 — Asistente a la charla quiere los recursos (Priority: P1)

Una persona que vio la charla en Techno Week 8.0 entra a `ardops.dev` para encontrar slides, repositorio y guía de implementación.

**Why this priority**: Es el principal call-to-value durante el periodo de la charla. La landing existe en parte para servir este caso.

**Independent Test**: Navegar directamente a `/#talk` y verificar que los 4 enlaces de recursos están visibles, descritos y, cuando aplique, marcados claramente como "próximamente" si el contenido aún no existe.

**Acceptance Scenarios**:

1. **Given** la URL `https://ardops.dev/#talk`, **When** se carga, **Then** el navegador hace foco/scroll a la sección de la charla y los recursos son visibles inmediatamente.
2. **Given** un recurso aún no publicado (ej. Slides), **When** el visitante intenta interactuar, **Then** el estado del recurso es comunicado de forma accesible (ej. "Próximamente") y el enlace no rompe la navegación.
3. **Given** un visitante con teclado, **When** tabula por la sección, **Then** cada recurso recibe foco visible y se activa con `Enter`.

---

### User Story 3 — Reclutador / cliente potencial valida credibilidad (Priority: P2)

Un reclutador o cliente lee la sección "Sobre mí" y los stats para validar experiencia, enfoque y stack antes de iniciar contacto.

**Why this priority**: Convierte tráfico en oportunidades, pero depende de que P1 ya esté funcionando.

**Independent Test**: Ver la sección "Sobre mí" y verificar que comunica especialización (DevSecOps en banca), stack y estadísticas (7 etapas, 0 costo, 100% cobertura, <5 min), y que el bloque de Contacto ofrece al menos 3 vías (GitHub, LinkedIn, email).

**Acceptance Scenarios**:

1. **Given** la sección About, **When** se renderiza, **Then** se ven los 4 stat cards con valores y etiquetas, y el texto descriptivo del enfoque profesional.
2. **Given** la sección Contacto, **When** se hace clic en el enlace de email, **Then** se abre el cliente de correo con `mailto:josuevjar@gmail.com`.
3. **Given** un usuario con lector de pantalla, **When** navega los enlaces de contacto, **Then** cada enlace anuncia su destino (GitHub, LinkedIn, email) sin depender solo del icono.

---

### User Story 4 — Visitante explora el pipeline DevSecOps (Priority: P2)

Un técnico curioso quiere entender de un vistazo las 7 etapas del pipeline (Spectral, Semgrep, Gitleaks, npm audit, OWASP ZAP, Custom Action, CodeQL).

**Why this priority**: Refuerza la propuesta técnica de la charla; importante pero secundario al CTA inmediato.

**Independent Test**: Navegar a `#pipeline` y confirmar que las 7 tarjetas aparecen en orden con número de etapa, nombre, herramienta y descripción.

**Acceptance Scenarios**:

1. **Given** la sección Pipeline, **When** se renderiza en desktop, **Then** las 7 tarjetas se muestran en una cuadrícula responsive y conservan el efecto hover de la referencia.
2. **Given** la misma sección en mobile, **When** se renderiza en ≤ 768px, **Then** las tarjetas se apilan en una columna sin overflow horizontal.

---

### User Story 5 — Operador del sitio prepara expansión a multi-página (Priority: P3)

El owner del sitio (Victor) quiere agregar más adelante secciones como `/blog/` y `/talks/` sin tener que rehacer la landing.

**Why this priority**: Es una garantía estructural; no entrega valor visible al usuario final hoy, pero evita deuda técnica.

**Independent Test**: Revisar la organización del proyecto y confirmar que estilos, scripts y assets están organizados de forma que una nueva página pueda reusarlos sin duplicar el sistema visual.

**Acceptance Scenarios**:

1. **Given** la estructura del sitio post-implementación, **When** se agrega una página nueva (ej. `/blog/index.html`), **Then** la página puede consumir los mismos estilos base y tokens sin copiar/pegar bloques.
2. **Given** la sección Blog placeholder en la landing, **When** exista contenido real, **Then** el bloque pueda enlazar a `/blog/` sin requerir refactor de la home.

---

### Edge Cases

- **JS deshabilitado**: la landing debe ser plenamente legible y navegable; las animaciones de entrada (`fade-up`, `pulse-glow`, terminal cursor) son CSS y siguen funcionando o degradan a estado final visible sin bloqueos.
- **Conexión lenta o fonts no cargadas**: la tipografía debe degradar a system stack sin saltos visibles severos (FOUT controlado, sin invisibilidad prolongada del texto).
- **Tema/contraste forzado del SO**: respetar `prefers-reduced-motion` (desactivar animaciones de entrada y blink del cursor) y `prefers-contrast: more` (no degradar legibilidad).
- **Recursos del Talk inexistentes** (Slides, Guía): mostrar estado "Próximamente" accesible en lugar de enlace muerto.
- **Hash directo a anchor inexistente** (ej. `/#unknown`): el sitio no debe romperse, simplemente cargar la home sin scroll.
- **Resoluciones extremas** (≤ 320px y ≥ 2560px): el layout no debe presentar overflow horizontal ni espacios vacíos exagerados.
- **Bots / preview de redes sociales**: link preview en LinkedIn, X, WhatsApp, Slack debe mostrar título, descripción e imagen OG.
- **Ataque de inyección via fragmento de URL**: no debe haber ningún sink que evalúe contenido del fragmento.

## Requirements *(mandatory)*

### Functional Requirements

#### Estructura y contenido
- **FR-001**: La landing DEBE estar compuesta por exactamente estas secciones en este orden: Nav, Hero, Charla destacada (Techno Week 8.0), Pipeline de 7 etapas, Sobre mí + stats, Blog (placeholder), Contacto, Footer.
- **FR-002**: El Hero DEBE incluir: tag/eyebrow, nombre completo "Victor Josue Ardón Rojas", rol "DevOps Engineer", descripción profesional, y al menos dos CTAs (uno hacia la Charla, uno hacia el repositorio).
- **FR-003**: La sección Charla DEBE incluir badge con fecha (18 mayo 2026), título de la charla, evento ("Techno Week 8.0 — Banco de Costa Rica"), descripción y al menos cuatro enlaces de recursos (Repositorio, Pipeline, Slides, Guía de implementación). El enlace "Repositorio" apunta a `https://github.com/victorar42/techno-week`. Los recursos sin contenido publicado DEBEN mostrar estado "Próximamente" accesible.
- **FR-004**: La sección Pipeline DEBE listar las 7 etapas con: número, nombre, herramienta y descripción corta, en el orden de la referencia (Spec Lint → SAST → Secret Detection → Dependency Scan → DAST → Compliance → Semantic Analysis).
- **FR-005**: La sección "Sobre mí" DEBE incluir descripción profesional y exactamente cuatro stat cards: "7 / Etapas del Pipeline", "0 / Costo de licencias", "100% / Cobertura de la spec", "<5m / Tiempo del pipeline".
- **FR-006**: La sección Blog DEBE existir como placeholder accesible con un mensaje claro de "contenido en desarrollo" y NO DEBE prometer fechas concretas que no se puedan cumplir.
- **FR-007**: La sección Contacto DEBE proveer al menos: enlace a GitHub (`https://github.com/victorar42`), LinkedIn (`https://www.linkedin.com/in/victorar42/`), y email (`mailto:josuevjar@gmail.com`).
- **FR-008**: El Footer DEBE incluir el dominio del sitio, marca "Security as Code", país (Costa Rica), y declaración del año actual.

#### Identidad visual y constitución
- **FR-009**: Toda la paleta de colores DEBE provenir de variables CSS equivalentes a las de la referencia (`--bg-primary #0a0e17`, `--bg-secondary #111827`, `--bg-card #1a2235`, `--text-primary #e2e8f0`, `--accent #22d3ee`, `--green #4ade80`, etc.). NO se permiten colores hardcodeados fuera del archivo de tokens.
- **FR-010**: La tipografía DEBE ser JetBrains Mono (mono) y Outfit (body) self-hosted; NO se permiten llamadas a Google Fonts ni a ningún CDN externo en runtime.
- **FR-011**: Las animaciones de la referencia (`fade-up`, `pulse-glow`, blink del terminal cursor, hover de pipeline cards y resource links, grain overlay, hero glow) DEBEN reproducirse fielmente.
- **FR-012**: El sitio DEBE respetar `prefers-reduced-motion: reduce` desactivando o atenuando todas las animaciones decorativas.

#### Arquitectura
- **FR-013**: HTML, CSS y JS DEBEN estar separados en archivos físicos distintos. NO se permite CSS inline en `style="..."`, NO se permite JS inline en `onclick="..."` ni `<script>...</script>` con código embebido. La única excepción admitida es CSS crítico minimalista en `<head>` si se justifica explícitamente para evitar FOUC, declarado en el plan.
- **FR-014**: La estructura del proyecto DEBE permitir agregar nuevas páginas (ej. `/blog/`, `/talks/`) reusando el mismo sistema de tokens, estilos base y componentes sin duplicación. Los estilos compartidos viven en archivos reutilizables.
- **FR-015**: El sitio DEBE ser estático puro (HTML+CSS+JS), sin frameworks JS externos ni librerías de terceros incluidas en el bundle.

#### Accesibilidad (WCAG 2.1 AA)
- **FR-016**: La estructura DEBE usar landmarks semánticos correctos: `<header>`, `<nav>`, `<main>`, `<section>` con encabezados, y `<footer>`.
- **FR-017**: La jerarquía de encabezados DEBE tener exactamente un `<h1>` (nombre / título de la home) y respetar la jerarquía sin saltos.
- **FR-018**: Todo elemento interactivo (enlaces, botones) DEBE tener foco visible con contraste suficiente, navegación por teclado completa (`Tab`, `Shift+Tab`, `Enter`), y un "skip to main content" disponible.
- **FR-019**: Todos los SVG decorativos DEBEN estar marcados como `aria-hidden="true"`; los SVG con significado (iconos en enlaces sin texto) DEBEN tener etiqueta accesible (texto visible o `aria-label`).
- **FR-020**: Los contrastes de color DEBEN cumplir WCAG 2.1 AA: ≥ 4.5:1 para texto normal y ≥ 3:1 para texto grande. Cualquier combinación que no cumpla DEBE ajustarse antes de release.
- **FR-021**: El contenido DEBE seguir siendo accesible y navegable con JS deshabilitado.

#### SEO y Open Graph
- **FR-022**: El `<head>` DEBE incluir: `<title>` único y descriptivo (≤ 60 caracteres), `meta description` (≤ 160 caracteres), `meta viewport`, `meta charset`, `link rel="canonical"`, `meta theme-color`, idioma `lang="es"`.
- **FR-023**: El `<head>` DEBE incluir Open Graph completo: `og:title`, `og:description`, `og:type=website`, `og:url`, `og:image` (≥ 1200×630), `og:locale=es_CR`, `og:site_name`.
- **FR-024**: El `<head>` DEBE incluir Twitter Card: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.
- **FR-025**: El sitio DEBE incluir `sitemap.xml` y `robots.txt` válidos servidos desde la raíz.
- **FR-026**: La home DEBE incluir datos estructurados JSON-LD `Person` (Victor) y referencia al `Event` de la charla, sin duplicar contenido en formas conflictivas.

#### Seguridad / CSP
- **FR-027**: El sitio DEBE servirse con una Content Security Policy estricta sin `'unsafe-eval'` y minimizando `'unsafe-inline'` (idealmente eliminándolo gracias a la separación de CSS/JS). La política definitiva se documenta en `docs/05-security-spec.md` y se aplica vía meta o headers en el plan.
- **FR-028**: El sitio NO DEBE cargar tracking de terceros (Google Analytics, Meta Pixel, Hotjar, etc.). Cualquier analítica futura DEBE pasar por una nueva spec.
- **FR-029**: Todos los enlaces externos `target="_blank"` DEBEN incluir `rel="noopener noreferrer"`.
- **FR-030**: El sitio NO DEBE incluir secrets, tokens, ni datos personales sensibles en el código.

#### Performance
- **FR-031**: El peso total inicial de la home (HTML+CSS+JS+fonts críticas) DEBE permitir cumplir LCP < 2.5s y CLS < 0.1 en una conexión 4G simulada típica de Lighthouse mobile.
- **FR-032**: Las imágenes (cuando se agreguen) DEBEN tener atributos `width`, `height` y `alt`, y usar `loading="lazy"` salvo que sean above-the-fold.
- **FR-033**: Las fonts self-hosted DEBEN servirse con `font-display: swap` y precargarse las variantes críticas para evitar FOUT severo.

### Key Entities *(include if feature involves data)*

- **Profile (Victor)**: nombre, rol, descripción larga y corta, ubicación (Costa Rica), enlaces sociales (GitHub, LinkedIn, email), foto opcional.
- **Talk**: título, evento, organización (BCR), fecha, descripción, lista de recursos (cada recurso = nombre + URL + estado: publicado/próximamente).
- **PipelineStage**: número de etapa, nombre, herramienta, descripción corta. Se modelan 7 instancias en el orden definido por FR-004.
- **Stat**: valor (string corto, ej. "<5m"), etiqueta (string corto). Se modelan 4 instancias para "Sobre mí".
- **ContactChannel**: tipo (github/linkedin/email/otro), label visible, URL/`mailto:`, icono asociado.
- **DesignTokens**: paleta, tipografías, espaciados, radios, sombras, breakpoints — fuente única de verdad para reutilización en futuras páginas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante puede identificar nombre, rol y la charla destacada en menos de 10 segundos al cargar la home.
- **SC-002**: La landing alcanza Lighthouse Performance ≥ 95 en mobile y desktop.
- **SC-003**: La landing alcanza Lighthouse Accessibility = 100; auditoría manual axe/Pa11y sin violaciones serias o críticas.
- **SC-004**: La landing alcanza Lighthouse Best Practices ≥ 95 y SEO ≥ 95.
- **SC-005**: Core Web Vitals en condiciones de prueba: LCP < 2.5s, CLS < 0.1, INP < 200ms.
- **SC-006**: 0 (cero) requests a dominios de terceros en la carga inicial verificada con DevTools/HAR.
- **SC-007**: 0 (cero) ocurrencias de `style="..."` o `onclick="..."`/`<script>` con código en línea en el HTML servido.
- **SC-008**: 100% de los colores y tipografías visibles en la home corresponden a tokens del sistema (sin colores hardcodeados detectables vía revisión de CSS).
- **SC-009**: 100% de las animaciones definidas en la referencia están presentes y son visualmente equivalentes (verificación lado a lado contra `.reference/v1-design/index.html`).
- **SC-010**: Compartir el enlace de la home en LinkedIn, X y WhatsApp produce un preview con título, descripción e imagen correctos.
- **SC-011**: Un usuario que solo navega con teclado puede recorrer todas las secciones, activar todos los enlaces y recursos del Talk, y volver al inicio sin trampas de foco.
- **SC-012**: Con `prefers-reduced-motion: reduce` activo, el sitio no presenta animaciones decorativas en movimiento.
- **SC-013**: Agregar una nueva página `/blog/index.html` reusando los tokens y estilos no requiere modificar la landing existente (validable por inspección de la estructura propuesta).

## Assumptions

- El dominio `ardops.dev` ya está configurado y servido por GitHub Pages con el `CNAME` ya presente en el repo.
- El idioma principal del sitio es español (`lang="es"`).
- Aún no existen URLs públicas para Slides ni Guía de implementación; sus enlaces se mostrarán como "Próximamente" hasta que el contenido exista.
- El email de contacto público es `josuevjar@gmail.com`.
- La imagen Open Graph se generará/proveerá durante la fase de plan/implement; mientras tanto se asume un placeholder de marca con dimensiones 1200×630.
- "Multi-página sin refactor mayor" significa que tokens, estilos base y componentes serán archivos reutilizables; no implica adoptar un generador estático en esta iteración (puede explorarse en una spec futura).
- La CSP se aplicará idealmente vía cabeceras del proveedor de hosting; si GitHub Pages no permite headers personalizados, se documentará el fallback con `<meta http-equiv="Content-Security-Policy">` en el plan.
- WCAG 2.1 AA es el mínimo; la constitución exige Lighthouse a11y = 100, lo cual se considera más estricto y prevalece.
- Handles sociales confirmados: GitHub `https://github.com/victorar42`, LinkedIn `https://www.linkedin.com/in/victorar42/`. Repositorio de la charla: `https://github.com/victorar42/techno-week`. Fecha de la charla: 18 de mayo de 2026.
