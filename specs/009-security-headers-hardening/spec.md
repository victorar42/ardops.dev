# Feature Specification: Security headers hardening (subset realmente aplicable)

**Feature Branch**: `009-security-headers-hardening`
**Created**: 2026-05-11
**Status**: Draft
**Input**: User description: "Implementar el backlog item 02 — Security
headers hardening (subset realmente aplicable). Contexto en
`backlog/02-security-headers-hardening.md`."

---

## Resumen ejecutivo

El sitio ya cumple con CSP estricta en la mayoría de páginas, pero hay
inconsistencias y huecos formales que erosionan la postura DevSecOps:

1. **Regresión real**: `blog/index.html` y los posts `blog/<slug>.html`
   sirven `style-src 'self' 'unsafe-inline'` por culpa del bloque
   `<style id="blog-tag-rules">` introducido en spec 007. Las otras
   páginas (`index.html`, `interviews/index.html`, `talks/index.html`,
   `404.html`) usan solo `'self'`.
2. Ninguna página tiene `<meta name="referrer">`, exponiendo la URL
   completa al navegar a recursos externos.
3. No existe gate que verifique que **todo `<a target="_blank">` lleva
   `rel="noopener noreferrer"`** (vector tabnabbing — OWASP A05).
4. No hay validación de drift entre `sitemap.xml` y las URLs reales
   servidas.

Esta spec consolida el subset de hardening **realmente aplicable en
GitHub Pages** (sin pretender headers HTTP que GH Pages no permite),
elimina la regresión `'unsafe-inline'`, y agrega gates bloqueantes en
CI para impedir que estos huecos se reabran.

Documenta explícitamente lo que **NO** es aplicable
(`Permissions-Policy` y `X-Content-Type-Options` vía meta) para cerrar
el tema en docs y evitar re-litigio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visitante navega el blog con CSP equivalente al resto del sitio (Priority: P1) 🎯 MVP

Un visitante carga `/blog/` o cualquier post `/blog/<slug>.html`. La
CSP servida es **idéntica** a la de las demás páginas del sitio: sin
`'unsafe-inline'` en `style-src`. Los estilos por tag (chips, filtros)
se aplican igual que hoy, pero cargados desde un origen permitido por
`'self'` (CSS externo o hash inline, decisión de plan).

**Why this priority**: es la única regresión de seguridad **real y
medible** del repo hoy. Cualquier feature posterior que toque el blog
arrastra el problema. Cierra una brecha que rompe el sello
"strict CSP everywhere".

**Independent Test**:
`grep "'unsafe-inline'" blog/*.html blog/**/*.html` → 0 matches.
`bash tests/csp-no-unsafe-inline.sh` → exit 0.
Cargar `/blog/` en navegador con DevTools → cero violaciones CSP en la
consola; los estilos de tags se aplican normalmente.

**Acceptance Scenarios**:

1. **Given** el sitio está desplegado, **When** un visitante carga
   `/blog/`, **Then** la cabecera `Content-Security-Policy` (vía meta)
   contiene exactamente `style-src 'self'` (sin `'unsafe-inline'`).
2. **Given** un visitante carga un post `/blog/<slug>.html`, **When**
   inspecciona la CSP, **Then** es byte-equivalente a la del resto del
   sitio (sin `'unsafe-inline'`).
3. **Given** el editor agrega un tag nuevo a un post y ejecuta el build,
   **When** se sirve la página, **Then** la regla CSS del nuevo tag se
   aplica correctamente sin requerir cambios manuales en CSP.

---

### User Story 2 — Visitante minimiza fuga de URL al navegar a links externos (Priority: P1)

Un visitante hace clic en un enlace externo (LinkedIn, GitHub, blog
referido). El navegador envía como `Referer` solo el origen
(`https://ardops.dev/`), no la URL completa. Reduce el footprint de
metadata expuesta a destinos terceros y cumple la postura "privacy by
default" del sitio.

**Why this priority**: bajo costo, alto impacto en señal técnica para
auditores/entrevistadores DevSecOps. Es un check estándar de
herramientas como `securityheaders.com`.

**Independent Test**: cargar cualquier página servida y verificar en
DevTools (Elements) que existe
`<meta name="referrer" content="strict-origin-when-cross-origin">` en
el `<head>`. Validar el header `Referer` recibido por un destino
externo en la pestaña Network.

**Acceptance Scenarios**:

1. **Given** el sitio está desplegado, **When** se carga cualquier
   página servida (home, blog index, blog posts, interviews index,
   interviews posts, talks, 404), **Then** el `<head>` contiene
   `<meta name="referrer" content="strict-origin-when-cross-origin">`.
2. **Given** un visitante hace clic en un `<a>` externo desde
   `/blog/<slug>.html`, **When** el destino recibe la request,
   **Then** el header `Referer` es `https://ardops.dev/` (solo
   origen, sin path).

---

### User Story 3 — Tabnabbing imposible en links externos (Priority: P1)

Cualquier `<a target="_blank">` del sitio incluye
`rel="noopener noreferrer"`. Un atacante que controle un dominio
linkeado externamente NO puede abusar de `window.opener` para
redirigir la pestaña original (tabnabbing) ni recibir el referrer
completo.

**Why this priority**: vulnerabilidad clase OWASP 2021 (A05) trivial
de prevenir. Cero costo técnico, prevención permanente vía gate.

**Independent Test**: `bash tests/external-links.sh` → exit 0 con cero
violaciones. Manualmente, inspeccionar HTML servido y verificar que
cada `target="_blank"` tiene `rel` con ambos tokens.

**Acceptance Scenarios**:

1. **Given** existe cualquier `<a target="_blank">` en el HTML servido,
   **When** se ejecuta el gate `tests/external-links.sh`, **Then** el
   gate verifica que `rel` contiene tanto `noopener` como `noreferrer`
   y pasa.
2. **Given** un editor agrega un nuevo link externo sin `rel` correcto,
   **When** corre el gate, **Then** falla con mensaje claro indicando
   archivo, línea y href ofensivo.

---

### User Story 4 — Sitemap refleja exactamente lo que se sirve (Priority: P2)

El `sitemap.xml` no tiene URLs muertas (que apuntan a archivos que no
existen) ni omisiones (páginas servidas con `<link rel="canonical">`
no listadas). Crawlers de buscadores reciben información consistente.

**Why this priority**: SEO higiene + indicador de descuido para
revisores técnicos. Más bajo que US1-3 porque es señal externa, no
vector de ataque.

**Independent Test**: `bash tests/sitemap-drift.sh` → exit 0.

**Acceptance Scenarios**:

1. **Given** el sitio está construido, **When** se ejecuta
   `tests/sitemap-drift.sh`, **Then** cada `<loc>` del sitemap
   corresponde a un archivo HTML que existe en disco.
2. **Given** una página servida tiene
   `<link rel="canonical" href="https://ardops.dev/X">`, **When** se
   ejecuta el gate, **Then** la URL `X` aparece en `sitemap.xml`
   (excepto la lista de exclusiones documentada).
3. **Given** un editor publica un post nuevo y olvida actualizar el
   sitemap, **When** corre el gate, **Then** falla con el slug que
   falta.

---

### Edge Cases

- **`<style id="blog-tag-rules">` y `<script id="blog-index" type="application/json">`**:
  el primero es CSS de runtime (estilo aplicado por el navegador →
  requiere CSP); el segundo es **data declarativa** con MIME no
  ejecutable (`application/json`) → NO requiere CSP especial. El gate
  `csp-no-unsafe-inline.sh` distingue por directiva (solo evalúa
  `style-src` y `script-src`), no por presencia del bloque.
- **Hash CSP vs CSS externo (decisión técnica)**: el bloque
  `renderTagCssRules()` se conoce a build-time. La spec admite dos
  mecanismos (decisión va en `research.md` durante `/speckit.plan`):
  - **Mecanismo A**: emitir el CSS a
    `assets/css/blog-tag-rules.css` (o por-página versionado),
    cargado vía `<link rel="stylesheet">`. Cero `'unsafe-inline'`.
  - **Mecanismo B**: calcular `sha256` del bloque inline en build y
    emitir CSP con `style-src 'self' 'sha256-XXXX'`. El gate
    `csp-no-unsafe-inline.sh` permite hashes (solo prohíbe los
    tokens literales `'unsafe-inline'`/`'unsafe-eval'`).
- **Permissions-Policy y X-Content-Type-Options**: NO funcionan como
  `<meta http-equiv>`, solo como header HTTP. GH Pages no soporta
  headers custom. Documentar como out-of-scope técnico permanente.
- **Links internos absolutos** (`href="https://ardops.dev/blog/"`):
  el gate `external-links.sh` los trata como **internos** (mismo
  origen) y NO les exige `rel="noopener noreferrer"`.
- **Links de email** (`mailto:`), telefónicos (`tel:`): excluidos del
  gate (no aplican).
- **Links sin `target="_blank"`**: excluidos del gate. Un link externo
  que abre en la misma pestaña no requiere `rel="noopener"`.
- **`sitemap.xml` con URLs sin trailing slash vs archivos como
  `index.html`**: el gate normaliza (`/blog/` ↔ `blog/index.html`).
- **Páginas que NO deben estar en sitemap**: `404.html`, fixtures de
  blog/interviews (`xss-attempt.html`, `valid-minimal.html`). Lista
  explícita en el gate.
- **Posts en draft** (`published: false`): NO deben aparecer en sitemap
  ni se les exige el gate de canonical-en-sitemap.

## Requirements *(mandatory)*

### Functional Requirements

#### Eliminar `'unsafe-inline'` (US1)

- **FR-001**: El sistema MUST emitir CSP en `blog/index.html` y
  `blog/<slug>.html` con `style-src 'self'` (sin `'unsafe-inline'` ni
  `'unsafe-eval'` en ninguna directiva). Si la solución usa hashes,
  pueden aparecer en `style-src` (`'sha256-...'`) sin violar el
  gate.
- **FR-002**: El sistema MUST mantener el comportamiento visual actual
  de los tags (chips de filtros, colores por tag, regla `:has()` por
  slug) en `/blog/` sin regresiones perceptibles.
- **FR-003**: La solución MUST funcionar build-time, sin requerir
  edición manual de CSP cada vez que se publica un post o se agrega
  un tag.
- **FR-004**: Los demás bloques inline declarativos (e.g.,
  `<script id="blog-index" type="application/json">`) NO se ven
  afectados; permanecen como están porque su MIME type no ejecutable
  ya está cubierto por la CSP estándar.

#### Referrer policy (US2)

- **FR-005**: Cada página servida (home, blog index, blog posts,
  interviews index, interviews posts, talks, 404) MUST emitir
  `<meta name="referrer" content="strict-origin-when-cross-origin">`
  como parte del `<head>`.
- **FR-006**: La emisión MUST consolidarse en un único punto
  (sugerido: módulo en `scripts/lib/`, congruente con la arquitectura
  de spec 008) para evitar drift futuro entre páginas.

#### Anti-tabnabbing (US3)

- **FR-007**: El sistema MUST incluir un gate `tests/external-links.sh`
  que parsea cada HTML servido y, para cada `<a target="_blank">`,
  valida que `rel` contiene **ambos** tokens `noopener` y `noreferrer`
  (orden libre, otros tokens permitidos).
- **FR-008**: El gate MUST excluir links internos (mismo origen
  `https://ardops.dev/...` o paths relativos), `mailto:`, `tel:`, y
  schemes no-`http(s)`.
- **FR-009**: El gate MUST emitir mensaje claro identificando archivo,
  número de línea (best-effort) y href cuando encuentra una violación.

#### Sitemap drift (US4)

- **FR-010**: El sistema MUST incluir un gate `tests/sitemap-drift.sh`
  que valida bidireccionalmente:
  - Toda `<loc>` en `sitemap.xml` corresponde a un archivo HTML que
    existe en disco (resolviendo `https://ardops.dev/X/` →
    `X/index.html`).
  - Toda página servida con `<link rel="canonical" href="...">` está
    listada en `sitemap.xml` (excepto la lista de exclusiones
    documentada).
- **FR-011**: La lista de exclusiones del sitemap (404, fixtures,
  posts con `published: false`) MUST estar documentada explícitamente
  en el script del gate, no inferida.

#### Gate de CSP estricta (US1, transversal)

- **FR-012**: El sistema MUST incluir un gate
  `tests/csp-no-unsafe-inline.sh` que parsea la CSP servida (vía
  `<meta http-equiv="Content-Security-Policy">`) de cada HTML servido y
  falla si encuentra los tokens literales `'unsafe-inline'` o
  `'unsafe-eval'` en cualquier directiva.
- **FR-013**: El gate MUST verificar que la CSP servida contiene como
  mínimo: `default-src 'self'`, `script-src 'self'`,
  `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`,
  `form-action 'self'`.

#### Integración CI

- **FR-014**: Los nuevos gates (`csp-no-unsafe-inline.sh`,
  `external-links.sh`, `sitemap-drift.sh`) MUST ejecutarse en CI como
  **bloqueantes** (sin `continue-on-error`).
- **FR-015**: Los gates existentes (`html-validate`, `tests/a11y.js`,
  `tests/nav-consistency.sh`, `scripts/build-blog.js --check`,
  `scripts/build-layout.js --check`, `scripts/build-pipeline.js
  --check`) MUST seguir pasando después del refactor.

#### Documentación

- **FR-016**: `docs/05-security-spec.md` MUST documentar
  explícitamente:
  - Que `Permissions-Policy` y `X-Content-Type-Options` NO son
    aplicables vía `<meta>` y que GH Pages no permite headers HTTP
    custom; por tanto, **out-of-scope permanente**.
  - La lista canónica de directivas CSP del sitio (post-cambio).
  - El protocolo para agregar excepciones (proceso vía spec
    dedicada, no excepción técnica unilateral).
- **FR-017**: La constitución (`.specify/memory/constitution.md`)
  principio IV (Security by Default) MUST mencionar la invariante
  "cero scripts, fonts, CSS o imágenes de origen externo en runtime;
  cualquier excepción requiere SRI explícito documentado en spec
  dedicada".

#### Restricciones técnicas (constitución)

- **FR-018**: La implementación MUST NO agregar dependencias runtime
  nuevas (constitución III).
- **FR-019**: La implementación MUST NO degradar el budget de
  performance (constitución VII): si Mecanismo A agrega un nuevo
  archivo CSS, debe minimizarse y servirse con el resto de la
  cascada existente.
- **FR-020**: La implementación MUST NO romper el contrato visual del
  blog (constitución II).

### Key Entities

- **CSP servida**: el contenido del meta
  `<meta http-equiv="Content-Security-Policy" content="...">` de cada
  página HTML emitida.
- **External link**: un `<a>` cuyo `href` apunta a un dominio distinto
  de `ardops.dev` y a scheme `http`/`https`, con `target="_blank"`.
- **Sitemap entry**: una `<loc>` dentro de `sitemap.xml` que apunta a
  una URL canónica del sitio.
- **Canonical URL**: la URL declarada por una página vía
  `<link rel="canonical" href="...">`.
- **Tag CSS rule**: la regla CSS generada por `renderTagCssRules()`
  en `scripts/build-blog.js` que aplica color/posición a un tag
  específico.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `grep "'unsafe-inline'" blog/*.html blog/**/*.html` =
  cero matches después del merge.
- **SC-002**: Toda página servida (incluida 404) contiene
  `<meta name="referrer" content="strict-origin-when-cross-origin">`
  en el `<head>` — verificado por gate.
- **SC-003**: `bash tests/external-links.sh` pasa con cero violaciones
  en cada PR.
- **SC-004**: `bash tests/sitemap-drift.sh` pasa con cero drift en
  cada PR.
- **SC-005**: `bash tests/csp-no-unsafe-inline.sh` pasa con cero
  violaciones en cada PR.
- **SC-006**: Auditoría externa manual con `securityheaders.com`
  reporta para `https://ardops.dev/` y `https://ardops.dev/blog/` un
  grado mínimo de **A** (consistente con el límite alcanzable en GH
  Pages — sin headers HTTP custom).
- **SC-007**: Lighthouse Best Practices ≥ 95 mantiene su valor actual
  o mejora en `/blog/`.
- **SC-008**: Editor agrega un post nuevo + ejecuta `npm run build` →
  el nuevo post aparece en sitemap (si `published: true`), su CSP no
  introduce `'unsafe-inline'`, y todos los gates pasan sin
  intervención manual.
- **SC-009**: `docs/05-security-spec.md` documenta explícitamente el
  status de Permissions-Policy y X-Content-Type-Options como
  out-of-scope técnico permanente.

## Assumptions

- La constitución sigue siendo fuente de verdad sobre principios; esta
  spec **agrega** una nota a IV (Security by Default) sin alterar
  principios existentes.
- GH Pages sigue siendo el target de hosting (constitución XI). Por
  tanto, **headers HTTP custom imposibles**; toda la postura de
  seguridad debe lograrse con `<meta>` + gates a build-time.
- Los estilos por tag (`renderTagCssRules`) se conocen completamente a
  build-time: el array de tags publicados se enumera tras procesar
  todos los markdown del blog.
- `sitemap.xml` se mantiene como artefacto **mantenido a mano hoy**.
  Si se decide auto-generarlo (decisión técnica de plan.md), el gate
  sigue siendo válido.
- Los gates nuevos pueden implementarse en bash + utilidades estándar
  o como scripts Node usando `jsdom` (devDependency desde spec 006).
  Elección queda para `research.md`.
- Spec 008 (shared nav & footer) está mergeada; esta spec puede
  apoyarse en la convención `scripts/lib/` y/o crear un módulo
  hermano (`scripts/lib/head.js`) siguiendo el mismo patrón.

## Out of Scope

Para evitar scope creep, esta spec NO incluye:

- **Headers HTTP reales** (`Permissions-Policy`,
  `X-Content-Type-Options`, `Strict-Transport-Security` custom,
  `Cross-Origin-Opener-Policy`, etc.) — imposibles en GH Pages.
- **Migración fuera de GH Pages** para conseguir headers HTTP. Eso
  rompe constitución XI y va en spec dedicada si alguna vez se
  considera.
- **Subresource Integrity (SRI)** — no hay assets externos en runtime;
  no aplica.
- **CSP `report-uri` / `report-to`** — requiere endpoint backend; el
  sitio es 100% estático.
- **Auto-generación de `sitemap.xml`** — esta spec valida drift, no
  rebuild. Si se quiere automatizar, va en spec separada.
- **Web Application Firewall**, rate limiting, bot management — no
  aplican a sitio estático en GH Pages.
- **Cambios visuales** del blog, footer, nav, o cualquier página.
- **Auditoría de terceros pagada** (Mozilla Observatory, etc.). Las
  herramientas free (securityheaders.com) son suficientes para SC-006.
- **CSP con `nonce` dinámico** — incompatible con sitio estático
  (requeriría regenerar el HTML por request).
