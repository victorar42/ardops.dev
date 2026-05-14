# Feature Specification: Privacy policy + no-tracking enforcement

**Feature Branch**: `015-privacy-no-tracking`
**Created**: 2026-05-14
**Status**: Draft
**Input**: Backlog 08 — Privacy policy + no-tracking enforcement (`backlog/08-privacy-no-tracking.md`)

---

## Resumen ejecutivo

El sitio ardops.dev no usa analytics, cookies, ni third-party tracking. Esta
decisión es coherente con la marca DevSecOps pero está implícita: no hay una
página `/privacy/` que la haga visible para visitantes y reclutadores, ni hay
gates de CI que prevengan regresiones (por ejemplo, alguien que pegue un
snippet de Google Analytics por error).

Esta feature hace lo implícito explícito y lo blinda:

1. Publica una página corta `/privacy/` (≈250 palabras en español) que declara
   la política de no-tracking.
2. Agrega dos gates de CI (`tests/no-trackers.sh`, `tests/no-cookies.sh`) que
   fallan si aparece cualquier dominio de tracker conocido o `document.cookie`
   en los archivos servidos.
3. Promueve la política a principio constitucional (**Principio X — Privacy
   by Default**).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Página /privacy/ publicada y enlazada en el footer (Priority: P1)

Un visitante (recruiter, peer, cliente potencial) llega a cualquier página del
sitio y quiere entender qué información recopila ardops.dev sobre él. Hace
scroll al footer, ve un enlace a `/privacy/`, lo abre, y en menos de un
minuto comprende que el sitio no usa cookies, no usa analytics, no carga
third-party scripts y que los únicos logs son los de GitHub Pages.

**Why this priority**: Es la pieza visible al usuario final y la que produce
valor inmediato de transparencia. Sin esto la feature no entrega valor de
marca. Es el MVP independiente: aunque los gates no existieran, publicar la
página ya cumple el objetivo público.

**Independent Test**: Navegar a `/privacy/` desde cualquier página del sitio
usando el enlace del footer; verificar que el contenido cubre las 5 secciones
listadas en FR-02 y que la página renderiza sin layout shift ni errores en
consola.

**Acceptance Scenarios**:

1. **Given** un visitante en la home, **When** hace scroll al footer y hace
   clic en "Privacidad", **Then** llega a `/privacy/` con el contenido en
   español y las 5 secciones definidas.
2. **Given** un visitante en `/privacy/`, **When** lee la página completa,
   **Then** entiende sin ambigüedad que el sitio no usa cookies, analytics,
   fingerprinting, third-party scripts, tracking pixels, newsletters
   embebidas, ni comentarios.
3. **Given** un visitante en `/privacy/`, **When** busca cuándo fue la última
   actualización, **Then** ve un `<time datetime="…">` con la fecha del
   último cambio relevante.
4. **Given** un visitante con tecnología asistiva, **When** navega `/privacy/`,
   **Then** la página cumple los mismos gates de a11y (WCAG 2.1 AA) que el
   resto del sitio.

---

### User Story 2 — Gate `no-trackers.sh` bloquea snippets de tracking (Priority: P1)

Un colaborador (o yo mismo en modo distraído) abre un PR que agrega un
snippet de Google Analytics, Plausible, Hotjar o cualquier otro tracker
conocido. El gate de CI detecta el dominio, falla el build, y el PR no se
puede mergear hasta retirar el código o documentar la excepción con una spec
dedicada.

**Why this priority**: Es la protección contra regresiones que blinda la
promesa hecha en `/privacy/`. Sin este gate, la política se erosiona con el
tiempo. Es testeable de forma independiente sin necesidad de la página.

**Independent Test**: Inyectar temporalmente `<script async
src="https://www.googletagmanager.com/gtag/js?id=GA_FAKE"></script>` en un
HTML servido y verificar que `bash tests/no-trackers.sh` retorna exit code
≠ 0 con un mensaje claro sobre el dominio detectado y el archivo afectado.

**Acceptance Scenarios**:

1. **Given** el repo limpio, **When** se ejecuta `bash tests/no-trackers.sh`,
   **Then** retorna exit code 0 y reporta 0 violaciones.
2. **Given** un HTML contiene `googletagmanager.com`, **When** corre el gate,
   **Then** retorna exit code ≠ 0 indicando el dominio, el archivo y la línea.
3. **Given** un CSS contiene `url("https://fonts.googleapis.com/…")` (no es
   tracker pero suena similar), **When** corre el gate, **Then** no produce
   falso positivo porque `googleapis.com` no está en la lista de trackers.
4. **Given** la lista de dominios vive en `tests/tracker-domains.txt`,
   **When** se agrega un nuevo dominio al archivo, **Then** el gate lo aplica
   sin modificar el script bash.

---

### User Story 3 — Gate `no-cookies.sh` bloquea `document.cookie` (Priority: P2)

Un colaborador abre un PR que agrega lógica que setea o lee cookies vía
`document.cookie`. El gate detecta el uso y falla el build. Excluye
`node_modules/` y archivos de testing.

**Why this priority**: Complementa el gate de trackers. Es independiente y
puede pasar a producción sin la página. Marcado P2 porque el riesgo es más
acotado (no hay JS de terceros en el sitio hoy) pero el costo de prevención
es ínfimo.

**Independent Test**: Inyectar `document.cookie = "foo=bar"` en un JS
servido y verificar que `bash tests/no-cookies.sh` falla; retirar el cambio y
verificar que vuelve a pasar.

**Acceptance Scenarios**:

1. **Given** el repo limpio, **When** corre `bash tests/no-cookies.sh`,
   **Then** retorna exit code 0.
2. **Given** un archivo en `assets/js/` contiene `document.cookie`, **When**
   corre el gate, **Then** falla con exit code ≠ 0 reportando archivo y
   línea.
3. **Given** un archivo en `node_modules/` o `tests/` contiene
   `document.cookie`, **When** corre el gate, **Then** se ignora (no
   produce falso positivo).

---

### User Story 4 — Principio constitucional "Privacy by Default" (Priority: P3)

El mantenedor del proyecto consulta la constitución para entender si
agregar Plausible self-hosted requiere una spec dedicada. Encuentra el
**Principio X — Privacy by Default** que define la regla, la excepción y
el proceso de cambio.

**Why this priority**: Promueve la política a regla de gobernanza, pero es
documentación: no entrega valor funcional al usuario. Marcado P3 porque sin
él la feature sigue siendo viable; con él, futura toma de decisión queda
encuadrada.

**Independent Test**: Abrir `.specify/memory/constitution.md` y verificar
que el Principio X existe, declara la regla (cero trackers/cookies/third-party
scripts) y describe el proceso de excepción.

**Acceptance Scenarios**:

1. **Given** la constitución en `main`, **When** la leo, **Then** existe un
   Principio X "Privacy by Default" con regla, justificación y proceso de
   excepción.
2. **Given** el changelog de la constitución, **When** lo reviso, **Then**
   hay una entrada que documenta el bump de versión asociado al nuevo
   principio.

---

### Edge Cases

- **Falso positivo en `tests/no-trackers.sh`**: un atributo `data-…` o un
  comentario inocente podría matchear un dominio por accidente. La detección
  debe basarse en la lista exacta de dominios en `tests/tracker-domains.txt`
  y reportar archivo + línea para que sea fácil discriminar.
- **Excepción legítima futura**: si en algún momento se decide adoptar
  analytics (ej.: Plausible self-hosted), el gate debe deshabilitarse vía
  spec dedicada que actualice `/privacy/` y la constitución. No hay flag
  de bypass.
- **Cambio sin actualizar last-modified**: si se edita `/privacy/` pero no se
  actualiza el `<time datetime="">`, no debería romper CI hoy (no es
  requisito automatizado en esta spec), pero queda como nota para futura
  spec.
- **Scope del gate**: corre sobre archivos servidos en producción. Excluye
  `node_modules/`, `.specify/`, `specs/`, `docs/`, `backlog/`, `.reference/`,
  `tests/`, `legacy/` y cualquier archivo de configuración.
- **Mailto en /privacy/**: el bloque "contacto" usa `mailto:` sin tracking
  pixel. No es third-party script.
- **`gtag(`**: la lista debe incluir patrones de llamada (`gtag(`, `ga.js`,
  `analytics.js`) además de dominios, porque un snippet inline podría
  esconder el dominio.
- **Página enlazada desde footer global**: cuando exista shared layout
  (Backlog 01), el enlace debe vivir en la plantilla compartida; mientras
  tanto, se agrega manualmente a cada footer que ya esté replicado.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Página /privacy/

- **FR-01**: Existe la ruta `/privacy/` servida desde el archivo
  `privacy/index.html`.
- **FR-02**: El contenido está escrito en español (es-CR) y tiene ≈250
  palabras (rango aceptable 200-300), distribuido en 5 secciones:
  1. **Qué este sitio NO hace** — declara no cookies, no analytics, no
     fingerprinting, no third-party scripts, no tracking pixels, no
     newsletters embebidas, no comentarios.
  2. **Qué pasa con mis logs** — hospedaje en GitHub Pages; los logs de
     acceso son manejados por GitHub bajo su propia política, con enlace
     a la política de GitHub.
  3. **Qué información recibo si me escribís a `mailto:`** — solo lo que
     el usuario decida enviar; sin retención más allá de lo necesario.
  4. **Cambios a esta política** — el commit history del repo es la
     fuente de verdad, con enlace al archivo en GitHub.
  5. **Contacto** — email para dudas sobre la política.
- **FR-03**: La página declara la fecha del último cambio relevante con
  `<time datetime="YYYY-MM-DD">` visible en la página.
- **FR-04**: El footer global del sitio incluye un enlace a `/privacy/`. No
  va en la navegación principal.
- **FR-05**: La página cumple las mismas restricciones de seguridad y
  performance que el resto del sitio: misma CSP, mismas fuentes, sin
  inline JS, sin third-party assets, HTML semántico, headings sin saltos
  de jerarquía (un único `<h1>`), enlaces accesibles, focus visible.

#### Gates de CI

- **FR-06**: `tests/no-trackers.sh` ejecuta búsqueda recursiva en HTML, CSS
  y JS servidos del repo y falla con exit code ≠ 0 si encuentra cualquier
  patrón listado en `tests/tracker-domains.txt`. La lista cubre al menos:
  - `googletagmanager.com`, `google-analytics.com`, `gtag(`, `ga.js`,
    `analytics.js`
  - `hotjar.com`, `mouseflow.com`, `fullstory.com`
  - `segment.com`, `segment.io`, `mixpanel.com`, `amplitude.com`
  - `plausible.io`, `fathom.com`, `simpleanalytics.com`
  - `cloudflareinsights.com`, `matomo.org`, `piwik.pro`
  - `facebook.net/en_US/fbevents.js`, `connect.facebook.net`
  - `twitter.com/i/adsct`, `static.ads-twitter.com`
  - `linkedin.com/li.lms-analytics`, `snap.licdn.com`
  - `doubleclick.net`, `pinimg.com/ct`, `tiktok.com/i18n/pixel`
- **FR-07**: `tests/no-cookies.sh` ejecuta búsqueda recursiva en JS servido
  y falla si encuentra el literal `document.cookie`. Excluye
  `node_modules/`, `tests/`, `.specify/`, `specs/`, `docs/`, `backlog/`,
  `.reference/` y `legacy/`.
- **FR-08**: La constitución `.specify/memory/constitution.md` incorpora un
  nuevo **Principio X — Privacy by Default**: cero trackers, cero cookies,
  cero third-party scripts. Toda excepción requiere actualización
  simultánea de `/privacy/` y spec dedicada que lo justifique. El bump de
  versión de la constitución y la entrada en el sync-impact-report siguen
  el protocolo existente.

### Key Entities

- **Página de política (`/privacy/`)**: documento HTML público de marca,
  enlazado desde el footer, con last-modified visible.
- **Lista de dominios de trackers (`tests/tracker-domains.txt`)**:
  archivo de texto plano, un patrón por línea, mantenible sin tocar el
  shell script.
- **Gate `no-trackers.sh`**: script POSIX que consume la lista y reporta
  exit code, dominio, archivo y línea.
- **Gate `no-cookies.sh`**: script POSIX que reporta uso de
  `document.cookie` en JS servido.
- **Principio X constitucional**: regla de gobernanza con proceso de
  excepción explícito.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-01**: 100 % de las páginas servidas del sitio incluyen un enlace
  visible a `/privacy/` en el footer.
- **SC-02**: Un visitante puede leer y comprender `/privacy/` en ≤ 90
  segundos (texto ≤ 300 palabras, una página, sin scroll lateral en
  mobile).
- **SC-03**: `bash tests/no-trackers.sh` ejecuta y termina en ≤ 5 segundos
  en CI, con exit code 0 sobre el repo en estado limpio.
- **SC-04**: `bash tests/no-cookies.sh` ejecuta y termina en ≤ 5 segundos
  en CI, con exit code 0 sobre el repo en estado limpio.
- **SC-05**: Un PR de prueba que agrega un snippet de GA (`<script async
  src="https://www.googletagmanager.com/…">`) falla CI en el gate
  `no-trackers.sh` antes de cualquier otro check de contenido.
- **SC-06**: Un PR de prueba que agrega `document.cookie = "…"` en
  `assets/js/` falla CI en el gate `no-cookies.sh`.
- **SC-07**: La página `/privacy/` cumple los thresholds de Lighthouse del
  spec 014 (Performance ≥ 0.95 mobile, CLS ≤ 0.1, LCP ≤ 3000 ms mobile /
  ≤ 2500 ms desktop) sin regresión respecto a las demás páginas.
- **SC-08**: La constitución publicada en `main` contiene el Principio X
  "Privacy by Default" con regla, justificación y proceso de excepción
  documentados en un solo párrafo de ≤ 120 palabras.
- **SC-09**: Cero coincidencias de la lista `tracker-domains.txt` en
  archivos servidos al merge de esta spec; cero ocurrencias de
  `document.cookie` en JS servido.

---

## Assumptions

- El sitio se sigue hospedando en GitHub Pages con dominio personalizado
  ardops.dev (no cambia el modelo de logs ni la política aplicable).
- El idioma primario es es-CR; no se traduce a inglés en esta spec.
- El shared layout (Backlog 01) puede no estar disponible al implementar
  esta spec; el enlace al footer se agrega manualmente a cada footer
  duplicado existente y se migra automáticamente cuando el shared layout
  aterrice.
- Los archivos servidos en producción están en la raíz del repo y en
  `assets/`, `blog/`, `interviews/`, `talks/`, `speaking/`, `now/`,
  `uses/`, `privacy/`, `404.html`, `index.html`. Todo lo demás es
  workspace de desarrollo y queda excluido de los gates.
- `tests/tracker-domains.txt` se versiona en el repo; añadir/quitar
  dominios se hace vía PR.
- El correo de contacto ya existe (mailto público en la home/footer);
  esta spec no introduce uno nuevo.
- El nuevo principio constitucional bumpa la versión MINOR de la
  constitución (sigue Principios I-IX existentes, agrega X).

---

## Out of Scope

- Banner de cookies (no hay cookies → no hay banner).
- Parsing del header DNT (Do Not Track).
- Opt-in / opt-out de analytics (no hay analytics).
- Política en inglés u otros idiomas.
- Auditoría automática del header `Permissions-Policy` (ya cubierto por
  spec 009).
- Política sobre logs del servidor de GitHub (es responsabilidad de GitHub
  y se enlaza, no se replica).

---

## Constitución relevante

- **IV — Security by Default** (existente).
- **X — Privacy by Default** (nuevo, introducido por esta spec).
