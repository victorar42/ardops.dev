# Feature Specification: Performance & a11y thresholds (refinamiento del baseline)

**Feature Branch**: `014-perf-a11y-thresholds`
**Created**: 2026-05-13
**Status**: Draft
**Input**: User description: "Implementar el Backlog 07 — Performance & a11y thresholds. Refinar thresholds de Lighthouse a 95/100/95/95 y bloquear PRs que bajen. Agregar byte budgets (HTML 50KB, CSS 30KB, JS 50KB gzip), gates para img attrs y third-party fonts. Sin agregar features. Sin modo claro."

## User Scenarios & Testing *(mandatory)*

Esta spec **no agrega features visibles para visitantes**. Los actores
son contribuidores del repo (yo mismo + Copilot + potenciales colaboradores)
y CI. Cada user story describe una situación donde el sitio se podría
degradar y la nueva gate la previene.

### User Story 1 — Lighthouse no degrada en silencio (Priority: P1)

Como mantenedor, cuando agrego una página o cambio assets, quiero que CI
falle si Lighthouse cae por debajo de Performance 95, Accessibility 100,
Best Practices 95 o SEO 95 — o si LCP > 2.5s, TBT > 200ms (proxy de INP)
o CLS > 0.1. Hoy los thresholds son más laxos y una regresión podría
mergearse sin alarma.

**Why this priority**: Es el principio constitucional VII ("performance
es feature") y VI ("a11y = 100") expresado como gate. Sin este apriete,
los demás principios pierden enforcement. Es el slice de mayor ROI por
hora invertida.

**Independent Test**: Crear un PR experimental que introduce un script
pesado (~150 KB) o un `<button>` sin `aria-label` → CI debe fallar el
job de Lighthouse antes de permitir merge. Revertir el cambio → CI
verde.

**Acceptance Scenarios**:

1. **Given** `tests/lighthouserc.json` y `lighthouserc.mobile.json` con
   thresholds nuevos, **When** se corre Lighthouse CI sobre cualquiera
   de las URLs evaluadas, **Then** falla si performance < 95,
   accessibility < 100, best-practices < 95 o seo < 95.
2. **Given** la misma config, **When** una URL reporta LCP > 2500 ms,
   TBT > 200 ms o CLS > 0.1, **Then** Lighthouse CI marca asserción
   fallida y el job termina con exit code distinto de cero.
3. **Given** un fallo aislado por flakiness de red, **When** CI corre
   3 runs y compara la mediana, **Then** una varianza aceptable no
   marca el PR como rojo.
4. **Given** una nueva página estática añadida al sitio (por ej.
   `/uses/`), **When** se commitea sin agregarla a la lista de URLs de
   Lighthouse, **Then** la revisión humana de PR exige sumarla (no se
   introduce gate automática para este caso por ahora).

---

### User Story 2 — Byte budgets bloquean crecimiento silencioso (Priority: P1)

Como mantenedor, cuando agrego CSS, JS, HTML o imágenes pesadas, quiero
que un gate local y de CI me avise antes del merge si el peso total
servido excede los budgets. Hoy puedo subir 200 KB de JS sin que nada
chille hasta que Lighthouse caiga.

**Why this priority**: Complementa US1 con detección directa por bytes
(más rápida y determinística que Lighthouse). Detecta regresiones que
Lighthouse podría tolerar si la red de CI es rápida.

**Independent Test**: Correr `bash tests/byte-budgets.sh` sobre el
repo actual → exit 0. Agregar un CSS dummy de 35 KB gzip a
`assets/css/` y volver a correr → exit no-cero con mensaje claro
indicando qué budget se excedió y por cuántos bytes.

**Acceptance Scenarios**:

1. **Given** el repo en su estado actual, **When** se ejecuta el gate
   de byte budgets, **Then** reporta el peso gzip de cada bucket y exit 0.
2. **Given** un `*.html` de más de 50 KB gzip servido, **When** el gate
   corre, **Then** falla indicando archivo y exceso.
3. **Given** la suma de `assets/css/*.css` mayor a 30 KB gzip, **When**
   el gate corre, **Then** falla indicando suma y exceso.
4. **Given** la suma de `assets/js/*.js` mayor a 50 KB gzip, **When**
   el gate corre, **Then** falla indicando suma y exceso.
5. **Given** un archivo en `assets/img/` mayor a 200 KB sin gzip,
   **When** el gate corre, **Then** falla indicando archivo y tamaño.

---

### User Story 3 — Imágenes con atributos correctos (Priority: P2)

Como mantenedor, cuando inserto `<img>` en cualquier HTML servido,
quiero que CI bloquee el merge si falta `alt`, `width`, `height`,
`loading="lazy"` (excepto la primera imagen / LCP candidate) o
`decoding="async"`. Esto previene CLS y degradación de a11y.

**Why this priority**: Cubierto parcialmente por axe-core (alt) y
Lighthouse (CLS), pero un gate explícito da mensaje de error claro y
acelera el ciclo dev. P2 porque US1+US2 ya capturan el efecto agregado;
este gate aporta diagnóstico, no protección nueva.

**Independent Test**: Agregar `<img src="foo.png">` (sin atributos) en
cualquier HTML del repo y correr `bash tests/img-attrs.sh` → falla
listando los atributos faltantes y el archivo. Corregir → pasa.

**Acceptance Scenarios**:

1. **Given** todas las imágenes actuales del sitio con sus atributos
   correctos, **When** el gate corre, **Then** exit 0.
2. **Given** un `<img>` sin `alt`, **When** el gate corre, **Then** falla
   con mensaje "missing alt" y la ruta del HTML.
3. **Given** un `<img>` sin `width` o sin `height`, **When** el gate
   corre, **Then** falla pidiendo dimensiones explícitas.
4. **Given** una imagen distinta de la primera del documento que no
   tiene `loading="lazy"`, **When** el gate corre, **Then** falla.
5. **Given** una imagen decorativa con `alt=""`, **When** el gate corre,
   **Then** pasa (alt vacío es legítimo).

---

### User Story 4 — Sin fonts ni externals de terceros (Priority: P3)

Como mantenedor, quiero que CI bloquee cualquier PR que reintroduzca
`fonts.googleapis.com`, `fonts.gstatic.com` o cualquier `@font-face`
servido desde origen distinto al propio, y que verifique que
`assets/fonts/` solo contiene `.woff2` y que cada `@font-face` declara
`font-display: swap`. Hoy la constitución (V) lo exige pero no hay gate
dedicado de fonts.

**Why this priority**: La constitución (V, VIII) ya cubre externals con
CSP estricta + `scripts/check-csp.js`. Este gate es defensa en
profundidad con mensajes de error específicos de fonts. P3 porque es
redundante con gates ya existentes en el 99% de los casos.

**Independent Test**: Agregar `<link rel="preconnect" href="https://fonts.googleapis.com">`
en cualquier HTML y correr `bash tests/no-third-party-fonts.sh` →
falla. Quitarlo → pasa.

**Acceptance Scenarios**:

1. **Given** el repo actual, **When** el gate de no-third-party-fonts
   corre, **Then** exit 0.
2. **Given** un HTML con cualquier referencia a `fonts.googleapis.com`
   o `fonts.gstatic.com`, **When** el gate corre, **Then** falla.
3. **Given** un archivo `.css` con `@font-face` apuntando a un URL
   absoluto con dominio distinto al propio origen, **When** el gate
   corre, **Then** falla.
4. **Given** un archivo en `assets/fonts/` con extensión distinta a
   `.woff2` y distinto a `LICENSE.md`, **When** el gate corre,
   **Then** falla.
5. **Given** un `@font-face` sin `font-display: swap`, **When** el
   gate corre, **Then** falla.

---

### Edge Cases

- **Flakiness de Lighthouse en CI**: la run de Lighthouse puede variar
  ±2 puntos por contención de CPU/red. Mitigación: `numberOfRuns: 3`
  y comparar la mediana contra los thresholds.
- **Imagen LCP**: la primera `<img>` del documento (hero) NO debe tener
  `loading="lazy"` porque retrasa LCP. El gate de img-attrs detecta la
  primera `<img>` por documento y exige que NO tenga `loading="lazy"`
  (o que lleve `fetchpriority="high"` si lo tiene). El resto sí debe
  ser lazy.
- **Imágenes decorativas**: `alt=""` es válido (no falla el gate).
- **Imágenes en CSS background**: no son `<img>`, no aplican al gate
  de img-attrs.
- **HTML grandes legítimos**: si un blog post extenso supera 50 KB
  gzip, debe dividirse o documentarse excepción en la spec del post
  (no se permite override silencioso).
- **Gzip approximation**: el gate usa `gzip -c -9 | wc -c` como proxy
  determinístico; los números reales servidos por GitHub Pages pueden
  diferir ±10% (uso de Brotli). Se acepta porque el budget es objetivo,
  no contractual con el visitante.
- **Build artifacts**: blogs e interviews se generan desde fixtures; el
  gate de byte-budgets corre **después** del build para medir el
  output servido real, no el código fuente.
- **Lighthouse en URLs nuevas**: la lista de URLs en `lighthouserc.json`
  debe mantenerse en sync con sitemap; auditoría manual por ahora.

## Requirements *(mandatory)*

### Functional Requirements

**Lighthouse thresholds**

- **FR-01** — Las configs `tests/lighthouserc.json` y
  `tests/lighthouserc.mobile.json` MUST hacer fallar el build si alguna
  URL auditada reporta: performance < 95, accessibility < 100,
  best-practices < 95 o seo < 95.
- **FR-02** — Las URLs evaluadas por ambas configs MUST incluir, como
  mínimo: home (`/`), blog index (`/blog/`), el post más reciente,
  interviews index (`/interviews/`), talks index (`/talks/`), speaking
  (`/speaking/`) y now (`/now/`). El conjunto se mantiene manualmente
  en sync con sitemap.xml.

**Core Web Vitals**

- **FR-03** — Las configs Lighthouse MUST asertar:
  LCP ≤ 2500 ms, TBT ≤ 200 ms (proxy de INP), CLS ≤ 0.1. Asserts a
  nivel "error" (no warning).

**Byte budgets**

- **FR-04** — Existe un gate ejecutable `tests/byte-budgets.sh` que
  falla con exit code distinto de cero si cualquiera de estas
  condiciones se cumple sobre los artefactos servidos (post-build):
  - Cualquier `*.html` individual mayor a 50 KB gzip.
  - Suma de tamaños gzip de `assets/css/**/*.css` mayor a 30 KB gzip.
  - Suma de tamaños gzip de `assets/js/**/*.js` mayor a 50 KB gzip.
  - Cualquier archivo en `assets/img/**` mayor a 200 KB (sin gzip).
- **FR-05** — El gate reporta cada bucket con su tamaño actual y el
  margen al budget (positivo o negativo) en formato legible humano,
  para diagnóstico inmediato. (El delta vs baseline por PR queda fuera
  de scope de esta spec; lo cubre, si se quiere, un comentario manual.)

**Image attributes**

- **FR-06** — Existe un gate ejecutable `tests/img-attrs.sh` que falla
  si cualquier elemento `<img>` en HTML servido (no en fixtures de
  pruebas) carece de:
  - `alt` (atributo presente; valor vacío permitido para decorativas).
  - `width` y `height` (atributos explícitos, no en CSS).
  - `loading="lazy"`, excepto la **primera** `<img>` de cada documento
    (candidata a LCP) que NO debe tener `loading="lazy"` salvo que
    además lleve `fetchpriority="high"`.
  - `decoding="async"`.

**Fonts**

- **FR-07** — Existe un gate ejecutable `tests/no-third-party-fonts.sh`
  que falla si cualquier HTML o CSS servido contiene referencias a
  `fonts.googleapis.com`, `fonts.gstatic.com`, o cualquier dominio
  externo dentro de un `src:` de `@font-face`, o cualquier `<link>` a
  fonts externos.
- **FR-08** — El mismo gate (o uno hermano) MUST verificar que el
  directorio `assets/fonts/` solo contiene archivos `.woff2`,
  `LICENSE.md` o subdirectorios; cualquier otra extensión (woff, ttf,
  otf, eot) hace fallar el gate.
- **FR-09** — El gate MUST verificar que cada `@font-face` en
  `assets/css/**/*.css` declara `font-display: swap`.

**Documentation**

- **FR-10** — `docs/06-performance-spec.md` MUST documentar los nuevos
  thresholds Lighthouse, los Core Web Vitals targets y los byte
  budgets, vinculando a esta spec. `docs/07-accessibility-spec.md`
  MUST documentar explícitamente el requisito WCAG 2.1 AA (contraste
  4.5:1 texto normal, 3:1 texto grande, 3:1 UI components) y cómo lo
  enforce axe-core + Lighthouse.

### Key Entities

- **Threshold config**: las dos configs Lighthouse (desktop, mobile)
  con los nuevos números y las URLs en sync con sitemap.
- **Byte budget**: tupla (bucket, max_bytes, unidad gzip|raw). Los
  buckets son: html-each, css-sum, js-sum, img-each.
- **Img attribute spec**: regla por documento — primera `<img>` es
  eager (no lazy), resto es lazy; todas requieren alt+width+height+
  decoding.
- **Font policy**: solo `.woff2`, solo same-origin, `font-display: swap`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con la suite ejecutada localmente en el commit que cierra
  esta spec, los 4 gates nuevos (`byte-budgets`, `img-attrs`,
  `no-third-party-fonts`, lighthouse desktop+mobile) terminan con exit
  0 sobre el sitio actual sin requerir cambios destructivos al
  contenido publicado.
- **SC-002**: Un PR experimental que intenta agregar 35 KB gzip de CSS
  falla CI en menos de 90 segundos (gate de byte-budgets corre antes
  de Lighthouse para feedback rápido).
- **SC-003**: Un PR experimental que agrega un `<img>` sin
  `width`/`height` falla CI con mensaje que indica archivo y atributo
  faltante.
- **SC-004**: Las dos configs Lighthouse (desktop+mobile) sobre las
  URLs listadas en FR-02 terminan con todos los asserts verdes en el
  último commit antes del merge, con cero categorías por debajo de
  los thresholds elevados.
- **SC-005**: 100% de los `<img>` en HTML servido tienen los 5
  atributos requeridos (alt, width, height, loading, decoding) según
  FR-06.
- **SC-006**: Cero referencias a `fonts.googleapis.com` o
  `fonts.gstatic.com` en cualquier archivo servido (HTML + CSS).
- **SC-007**: 100% de los archivos en `assets/fonts/` son `.woff2` o
  `LICENSE.md`.
- **SC-008**: Las nuevas gates ejecutan en CI sin agregar más de 30
  segundos al wall time total del pipeline.
- **SC-009**: `docs/06-performance-spec.md` y
  `docs/07-accessibility-spec.md` referencian esta spec y reflejan los
  thresholds nuevos.

## Out of Scope

- RUM (Real User Monitoring): no hay backend que ingeste métricas reales.
- Synthetic monitoring continuo / cron jobs: fuera del modelo
  GitHub Pages.
- Visual regression testing (Percy, Chromatic): overhead injustificado
  para un sitio dark-only sin theme switching.
- Modo claro / `prefers-color-scheme`: decisión de marca consciente —
  el sitio es dark-only DevSecOps.
- Delta automático vs baseline en cada PR como comentario de bot: FR-05
  pide reporting humano-legible local; el bot queda para backlog futuro.
- Reescritura de assets ya existentes para "ganarle margen" al budget:
  esta spec solo establece la regla; el contenido actual ya pasa.
- Gate de Lighthouse para URLs nuevas con auto-discovery desde
  sitemap.xml: por ahora es mantenimiento manual de la lista en
  `lighthouserc.json`.

## Assumptions

- El comando `gzip` está disponible en CI (Ubuntu runner) y localmente
  (macOS por defecto). El gate usa `gzip -c -9 | wc -c` como cálculo
  determinístico, no el gzip que sirve GitHub Pages (que puede usar
  Brotli y dar valores ~10% diferentes).
- Las URLs auditadas por Lighthouse se sirven vía
  `http-server` o `python3 -m http.server` en CI, idéntico al setup
  actual de `tests/lighthouserc.json`.
- Los budgets actuales (HTML 50K / CSS 30K / JS 50K gzip, IMG 200K raw)
  se basan en el peso actual del sitio post-build con holgura
  razonable; ningún archivo presente excede.
- La primera `<img>` de cada documento se asume LCP candidate; si en
  el futuro un documento tiene una imagen LCP que no sea la primera
  del DOM, se documenta excepción en la spec correspondiente.
- TBT ≤ 200 ms se acepta como proxy de INP porque Lighthouse en
  desktop sin sesión real no puede medir INP nativo. CWV reales
  (cuando lleguen RUM) son ortogonales a este gate.
- El gate de Lighthouse ejecuta 3 runs y compara la mediana
  (`numberOfRuns: 3`) para absorber flakiness; varianza > 1 run
  fallida indica regresión real.
- Los gates nuevos son shell POSIX (bash) sin dependencias npm nuevas,
  consistentes con `tests/no-placeholders.sh`, `tests/external-links.sh`
  y `tests/now-freshness.sh`.
- La constitución no se modifica; esta spec **endurece** enforcement
  de los principios VI, VII, VIII y IX existentes.

## Constitution Alignment

- **Principio VI (a11y)**: Accessibility = 100 ya estaba en la
  constitución; FR-01 lo hace gate explícita.
- **Principio VII (performance)**: thresholds 95/95/95 + LCP/TBT/CLS
  budgets formalizan el principio.
- **Principio VIII (seguridad)**: FR-07 (no third-party fonts)
  refuerza "cero externals en runtime".
- **Principio IX (todas las gates pasan)**: los 4 gates nuevos se
  integran a CI.
- **Principio V (assets self-hosted)**: FR-07/FR-08 dan defense-in-depth.
- **Principio III (sitio estático)**: todos los gates son build-time,
  sin runtime.
- **Principio IV (cero deps JS sin justificación)**: gates en bash
  puro, cero deps nuevas.
