# Feature Specification: Shared nav & footer (single source of truth)

**Feature Branch**: `008-shared-nav-and-footer`
**Created**: 2026-05-11
**Status**: Draft
**Input**: User description: "Implementar el backlog item 01 — Shared nav & footer (single source of truth). Contexto completo en `backlog/01-shared-nav-and-footer.md`."

---

## Resumen ejecutivo

Hoy cada página del sitio renderiza su propio `<nav>` a mano y los menús
están **desincronizados** entre sí: dos labels distintos para la misma
sección ("Charla" vs "Charlas"), orden inconsistente, y enlaces faltantes
de unas páginas en otras. El `<footer>` ya es idéntico en las cuatro
páginas servidas (home, blog, interviews, talks), pero está duplicado en
texto plano sin fuente de verdad.

Esta spec introduce una **única fuente de verdad** para `<header>` y
`<footer>` consumida por todos los generadores (`scripts/build-blog.js`,
`scripts/build-interviews.js`, `scripts/build-pipeline.js`) y por la home
estática `index.html`, con un gate de CI que bloquea drift futuro.

Es un prerequisito para las features de las specs siguientes (`/uses/`,
`/speaking/`, `/now/`, `/privacy/`), porque cualquiera heredaría las
inconsistencias actuales.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visitante navega entre secciones sin reaprender el menú (Priority: P1)

Un visitante llega al sitio (a cualquier página) y quiere recorrer las
distintas secciones (blog, entrevistas, charlas, contacto). En cada
página el menú aparece en el **mismo orden, con los mismos labels y los
mismos destinos**, así no tiene que volver a leerlo cada vez.

**Why this priority**: Es la razón de existir de la spec. Un menú
inconsistente confunde y da impresión de sitio descuidado, lo opuesto a
la marca DevSecOps que el sitio quiere proyectar. Sin esto, cualquier
feature posterior arrastra el mismo problema.

**Independent Test**: Puede validarse abriendo dos páginas distintas
(p. ej. `/blog/` y `/interviews/`) en pestañas separadas y comparando
visualmente el nav. Automáticamente se valida con un gate de CI que
extrae el HTML del nav de cada página servida y verifica equivalencia.

**Acceptance Scenarios**:

1. **Given** el sitio está desplegado, **When** un visitante carga `/`,
   `/blog/`, `/interviews/` o `/talks/`, **Then** el `<nav>` muestra
   exactamente los mismos items en el mismo orden y con los mismos labels.
2. **Given** el visitante está en `/blog/`, **When** ve el nav,
   **Then** el item "Blog" tiene `aria-current="page"` y los demás no
   tienen ese atributo.
3. **Given** el visitante navega de `/blog/` a `/interviews/`, **When**
   compara los menús, **Then** la única diferencia visible es cuál item
   tiene el indicador de página actual.

---

### User Story 2 — Editor agrega o renombra un item del menú una sola vez (Priority: P1)

El propietario del sitio decide agregar `/uses/` al menú (o renombrar
"Charlas" a "Talks"). Hace **un solo cambio** en una fuente de verdad,
ejecuta el build, y todas las páginas se actualizan en una pasada.

**Why this priority**: Define el contrato operacional. Sin esto, cada
spec siguiente requeriría editar 4+ archivos a mano y abriría espacio a
inconsistencias permanentes.

**Independent Test**: Modificar el array de navegación en
`scripts/lib/layout.js`, ejecutar el build, y confirmar que el HTML
servido de las cuatro páginas refleja el cambio sin tocar otros archivos.

**Acceptance Scenarios**:

1. **Given** el sitio está en estado limpio, **When** el editor agrega
   un item al array de navegación y ejecuta el build, **Then** las cuatro
   páginas servidas muestran el nuevo item en el lugar correcto.
2. **Given** un editor renombra el label de un item existente,
   **When** ejecuta el build, **Then** todas las páginas reflejan el
   nuevo label sin requerir más cambios.
3. **Given** un editor edita el `<nav>` directamente en un HTML servido
   en lugar de en la fuente de verdad, **When** se ejecuta el gate de
   consistencia, **Then** el gate falla con un mensaje claro indicando
   drift.

---

### User Story 3 — Tecnología asistiva identifica la página actual (Priority: P2)

Un usuario con lector de pantalla (VoiceOver, NVDA) navega por el menú.
El lector anuncia cuál es la página actual sin ambigüedad gracias al
atributo `aria-current="page"`.

**Why this priority**: Compromiso con WCAG 2.1 AA (constitución VI). El
sitio ya cumple este criterio en algunas páginas pero no de manera
sistemática.

**Independent Test**: Pasar axe-core (`node tests/a11y.js`) sobre cada
página servida; pasa sin violaciones de `aria-current`. Manualmente,
abrir VoiceOver en `/blog/` y verificar que el ítem "Blog" se anuncia
como "current page".

**Acceptance Scenarios**:

1. **Given** el visitante usa lector de pantalla en `/interviews/`,
   **When** navega por el menú con tab, **Then** al llegar al ítem
   "Entrevistas" el lector anuncia "Entrevistas, página actual" (o
   equivalente en su idioma).
2. **Given** axe-core se ejecuta sobre las cuatro páginas servidas,
   **When** evalúa el nav, **Then** no encuentra violaciones de
   `aria-current`, ni labels duplicados, ni `<a>` sin texto accesible.

---

### Edge Cases

- **Anchors a la home (`/#pipeline`, `/#contact`) cuando ya estás en home**:
  no marcan `aria-current="page"` porque el indicador semántico se
  refiere a la página actual completa, no a fragmentos. La home en sí
  puede estar marcada (si el item "Home" existe en el nav) o no marcada
  (si "Home" se accede solo vía logo).
- **Logo del sitio** (`<a class="nav-logo">`): hoy en home apunta a `#`
  y en otras páginas apunta a `/`. Debe normalizarse a `/` en todas las
  páginas (incluyendo home) para consistencia.
- **Skip link** (`<a class="skip-link">Saltar al contenido</a>`) debe
  emitirse igual en todas las páginas, antes del `<header>`.
- **Una página futura no quiere mostrar Home en el nav**: la decisión es
  global (el array de navegación es el contrato), no per-página. Si hace
  falta una excepción, debe abrirse spec dedicada para discutirlo.
- **El año del footer (`<span data-year>YYYY</span>`)** ya está
  estandarizado en 2026 hardcoded en el HTML servido. Mantener ese
  comportamiento (no inyectar JS para actualizarlo).
- **Drift entre home estática y resto**: la home (`index.html`) es el
  archivo más sensible porque no se regenera en cada build hoy. La spec
  define un mecanismo (build script o marker pattern) que la incluye
  en el ciclo de regeneración.
- **Trailing slash en URLs**: el menú oficial usa `/blog/`, `/interviews/`,
  `/talks/` con trailing slash. Las URLs sin trailing slash deben seguir
  funcionando como hoy (GH Pages las redirige).
- **Anchors sin destino en home** (p. ej. `/#about` cuando se navega
  desde `/blog/`): los anchors deben ser absolutos (`/#about`) para que
  funcionen desde cualquier página. Hoy en home están como `#about`
  (relativos), lo cual rompe si el visitante está en `/blog/`.

## Requirements *(mandatory)*

### Functional Requirements

#### Fuente de verdad

- **FR-001**: El sistema MUST exponer un módulo único (sugerido:
  `scripts/lib/layout.js`) que define la estructura del nav y emite el
  HTML del `<header>` y `<footer>` para todas las páginas servidas.
- **FR-002**: El menú oficial MUST contener exactamente estos items, en
  este orden y con estos labels:
  1. Home → `/`
  2. Pipeline → `/#pipeline`
  3. Blog → `/blog/`
  4. Entrevistas → `/interviews/`
  5. Charlas → `/talks/`
  6. Contacto → `/#contact`
- **FR-003**: El módulo MUST exponer dos funciones puras:
  `renderHeader(currentPath)` que devuelve el HTML del `<header>` con
  `aria-current="page"` aplicado al item correspondiente, y
  `renderFooter()` que devuelve el HTML del `<footer>` (siempre el mismo).

#### Aplicación del active state

- **FR-004**: `renderHeader(currentPath)` MUST aplicar `aria-current="page"`
  al item cuyo `href` coincide con `currentPath` (match por path completo,
  ignorando fragment y query).
- **FR-005**: Cuando `currentPath` es `/` (home), el item "Home"
  MUST llevar `aria-current="page"` y ningún otro.
- **FR-006**: Cuando `currentPath` corresponde a un anchor que apunta a
  home (`/#pipeline`, `/#contact`), el item NO debe llevar
  `aria-current="page"` desde otras páginas. Solo páginas reales reciben
  el atributo.
- **FR-007**: El sistema MUST emitir exactamente UN `aria-current="page"`
  por página servida, salvo que la página no esté en el menú (entonces
  cero).

#### Cobertura de páginas

- **FR-008**: Los generadores existentes (`scripts/build-blog.js`,
  `scripts/build-interviews.js`, `scripts/build-pipeline.js`) MUST
  consumir el módulo compartido en lugar de definir sus propios
  fragmentos de nav y footer.
- **FR-009**: La home estática (`index.html`) MUST consumir la misma
  fuente de verdad. La spec admite dos mecanismos (a decidir en
  `plan.md`/`research.md`):
  - **Mecanismo A — build de home**: nuevo `scripts/build-home.js` que
    regenera `index.html` desde una plantilla.
  - **Mecanismo B — marker pattern**: `index.html` contiene marcadores
    `<!-- nav:start --> ... <!-- nav:end -->` y `<!-- footer:start --> ...
    <!-- footer:end -->` que un script de build (o un step de CI)
    reemplaza con el HTML emitido por el módulo.
- **FR-010**: Sea cual sea el mecanismo elegido, el sistema MUST soportar
  el modo `--check` que falla cuando la home está fuera de sync con la
  fuente de verdad (mismo patrón que `build-blog.js --check`).

#### Footer

- **FR-011**: `renderFooter()` MUST emitir el HTML idéntico al actual:
  ```html
  <footer class="site-footer">
    <p><span class="footer-mono">ardops.dev</span> · Security as Code · Costa Rica · &copy; <span data-year>2026</span></p>
    <p class="footer-tagline">Built with intention. Deployed with CI/CD.</p>
  </footer>
  ```
- **FR-012**: El año dentro de `<span data-year>YYYY</span>` MUST
  emitirse como literal (no inyectado por JS en runtime), congruente con
  CSP estricta.

#### Skip link y accesibilidad estructural

- **FR-013**: Cada página servida MUST emitir el skip link
  `<a class="skip-link" href="#main">Saltar al contenido</a>` como
  primer hijo del `<body>`, antes del `<header>`.
- **FR-014**: El `<nav>` emitido MUST llevar `aria-label="Navegación
  principal"` y `<header class="site-header">` como contenedor.
- **FR-015**: El logo `<a class="nav-logo">` MUST apuntar a `/` (home)
  en todas las páginas, incluyendo la home misma.

#### Anchors absolutos

- **FR-016**: Los items que apuntan a anchors de home (`Pipeline`,
  `Contacto`) MUST emitirse con path absoluto (`/#pipeline`, `/#contact`),
  no relativo (`#pipeline`, `#contact`), para que funcionen desde
  cualquier página.

#### Validación

- **FR-017**: El sistema MUST incluir un gate `tests/nav-consistency.sh`
  que parsea cada HTML servido y verifica:
  - Que el `<nav>` tiene exactamente el mismo número de items que el
    contrato.
  - Que las URLs y labels coinciden con el contrato y están en el mismo
    orden.
  - Que existe exactamente un (o cero, según corresponda)
    `aria-current="page"` por página.
  - Que el `<footer>` es idéntico (string-equal después de normalizar
    whitespace) entre todas las páginas servidas.
- **FR-018**: El sistema MUST seguir pasando `npm run html-validate` y
  `node tests/a11y.js` después de los cambios.
- **FR-019**: La nueva ruta esperada (`tests/nav-consistency.sh`) MUST
  ejecutarse en CI como gate bloqueante.

#### Restricciones técnicas (constitución)

- **FR-020**: La implementación MUST NO agregar dependencias runtime
  nuevas (constitución III). Si requiere alguna devDependency, debe
  justificarse en `research.md`.
- **FR-021**: La implementación MUST NO introducir JavaScript en runtime
  para el nav (constitución IV — CSP estricta). El nav debe funcionar
  sin JS habilitado.
- **FR-022**: La implementación MUST NO modificar la paleta, tipografía
  ni espaciado del nav o footer existentes (constitución VIII). Solo
  consolida la fuente de verdad.

### Key Entities

- **NAV item**: una entrada del menú con tres atributos:
  - `href` — URL absoluta (path completo, puede incluir fragment).
  - `label` — texto visible para usuario.
  - `match` — array de paths que activan el `aria-current="page"` para
    este item (típicamente uno solo, p. ej. `['/blog/']`).
- **Currentpath**: el path canónico de la página que se está
  renderizando, usado por `renderHeader(currentPath)` para decidir
  cuál item recibe el active state.
- **Layout module**: el módulo único que exporta `renderHeader` y
  `renderFooter` y mantiene el array `NAV` como única fuente de verdad.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El gate `tests/nav-consistency.sh` se ejecuta en CI y
  pasa con cero violaciones después del merge.
- **SC-002**: `diff` entre el bloque `<nav>` (extraído normalizado)
  de cualquier par de páginas servidas devuelve solo la línea del
  `aria-current="page"` (única diferencia esperada).
- **SC-003**: Cambiar el label de un item del menú en `scripts/lib/layout.js`
  y ejecutar `npm run build` (o equivalente) actualiza las 4+ páginas
  servidas en una sola pasada, sin tocar archivos individuales.
- **SC-004**: `node tests/a11y.js` reporta cero violaciones de
  `aria-current`, `link-name` o `landmark-unique` en las cuatro páginas
  base.
- **SC-005**: `npm run html-validate` pasa sin errores nuevos en las
  páginas afectadas.
- **SC-006**: Cero hardcoded `<nav>` o `<footer>` en los HTML servidos
  fuera del flujo de regeneración: si alguien edita uno a mano y
  ejecuta `--check`, el build falla.
- **SC-007**: Tiempo total para agregar una página nueva al menú (caso
  futuro `/uses/`): editar una sola línea del array `NAV` + regenerar,
  sin tocar más archivos.
- **SC-008**: Cero dependencias runtime nuevas; cero líneas de JS nuevo
  servidas al cliente.

## Assumptions

- La constitución (`.specify/memory/constitution.md`) sigue siendo la
  fuente de verdad sobre principios (zero deps runtime, CSP estricta,
  WCAG 2.1 AA, design tokens, etc.).
- La paleta visual y la tipografía del nav y footer NO cambian: solo se
  consolida la fuente de verdad. El CSS existente
  (`assets/css/components.css`, `layout.css`) sirve como está.
- `index.html` se mantiene en la raíz del repo (no se mueve a una
  subcarpeta `home/`).
- GitHub Pages sigue siendo el target de deploy y no acepta headers HTTP
  custom; toda la consistencia ocurre a build-time o como gate de CI.
- Las páginas `/interviews/<slug>.html` (post de entrevista) y
  `/blog/<slug>.html` (post de blog) consumen el mismo módulo
  compartido vía sus generadores actuales.
- Los tests existentes (`tests/blog-schema.sh`,
  `node scripts/build-blog.js --check`,
  `node scripts/build-pipeline.js --check`) siguen pasando después del
  refactor.
- La decisión final entre **Mecanismo A (build-home)** vs **Mecanismo B
  (marker pattern)** se toma en `research.md` durante `/speckit.plan`,
  no en esta spec. Ambos cumplen los FRs.
- "Charla" vs "Charlas": se elige **siempre plural** (`Charlas`) por
  consistencia con el path `/talks/` y porque hay/habrá más de una.

## Out of Scope

Para evitar scope creep, esta spec NO incluye:

- **Mobile nav drawer / hamburger**: el comportamiento responsive
  actual (CSS-only) se mantiene.
- **Web Components / Custom Elements** para el nav.
- **Inyección dinámica del nav en runtime** (rompe no-JS, viola CSP).
- **Cambios visuales o de paleta** del nav o footer.
- **Páginas nuevas** (`/uses/`, `/speaking/`, `/now/`, `/privacy/`):
  van en specs separadas del backlog.
- **Internacionalización del nav** (otros idiomas además de es-CR).
- **Search en el nav**.
- **Breadcrumbs** (van en spec de SEO/JSON-LD si aplica).
- **Footer con más secciones** (links sociales en columnas, etc.). El
  footer actual se mantiene tal cual.
