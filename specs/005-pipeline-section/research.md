# Phase 0 — Research: Sección "Pipeline"

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

Cada decisión incluye **Decision / Rationale / Alternatives considered**. Cero `NEEDS CLARIFICATION` restantes; todas las áreas grises del spec quedan resueltas aquí.

---

## R-001 — Build-time render vs. client-time fetch

- **Decision**: build-time. Un script Node lee `content/pipeline.json`, valida, y reescribe el bloque `<!-- pipeline:start -->`…`<!-- pipeline:end -->` dentro de `index.html`. El sitio servido es HTML completamente resuelto sin JS adicional.
- **Rationale**: cero impacto en LCP/CLS/INP (constitución VII), cero `fetch` adicional, semántica accesible por defecto (no depende de JS para renderizar contenido), y patrón ya consolidado por spec 003 (`scripts/build-interviews.js`). El diff git en cada cambio es auditable y trazable.
- **Alternatives considered**:
  - *Client-time fetch + render JS*: añade peso runtime, FOUC en mobile lento, riesgo CSP nulo pero requiere `connect-src 'self'` (ya activo), peor a11y por dependencia de JS, y necesita lógica de error/empty-state en cliente. Rechazado.
  - *Custom Element / `<template>` con datos inline en HTML*: duplicaría la fuente de verdad (JSON + HTML), violando FR-003/FR-017. Rechazado.

## R-002 — Mecanismo de inyección: marcadores HTML vs. archivo fragmento separado

- **Decision**: marcadores `<!-- pipeline:start -->` y `<!-- pipeline:end -->` directamente en `index.html`. El script reemplaza todo lo que hay entre esos comentarios (incluidos) por el HTML generado, manteniéndolos como sentinelas.
- **Rationale**: una sola fuente HTML servida (`index.html`), sin includes server-side. El diff de cualquier cambio del pipeline es visible en el blame del propio `index.html`. El script es idempotente: correrlo dos veces produce el mismo resultado.
- **Alternatives considered**:
  - *Fragment file `_generated/pipeline.html` + SSI*: GitHub Pages no soporta SSI (constitución XI: hosting fijo).
  - *JS runtime que inyecta el fragmento*: ya rechazado en R-001.

## R-003 — Validación del JSON: schema in-script vs. dependencia (ajv)

- **Decision**: validación manual en el propio script (regex + chequeos imperativos), sin dependencia externa. Se publica además un `contracts/pipeline-schema.json` (JSON Schema Draft 7) como documentación normativa, pero el script NO lo carga.
- **Rationale**: cero deps nuevas (constitución IV). El schema es trivial (≤8 campos por item, 4 estados, 5 tipos), reglas escribibles en ~40 líneas. El JSON Schema vive en `contracts/` para humanos y editores con autocomplete (VS Code soporta `$schema`).
- **Alternatives considered**:
  - *ajv*: ~250 KB en `node_modules` solo para validar 12 items. Overkill. Rechazado.
  - *zod*: misma objeción + sintaxis JS-only que aleja al editor JSON. Rechazado.

## R-004 — Modelo de orden secundario dentro de cada `stage`

- **Decision**: dentro de cada grupo de stage, ordenar por orden de aparición en `pipeline.json` (estabilidad del autor). El ordenamiento primario por stage canónico (`coming-soon → review → in-progress → backlog`) lo aplica el script.
- **Rationale**: el autor controla manualmente qué es más interesante dentro de cada estado. Predecible, sin sorpresas. `estimated` es texto libre ("2026-Q3", "Pronto"), no apto para sort lexical estable.
- **Alternatives considered**:
  - *Sort por `estimated` ascendente*: requeriría parser de fechas tolerante a "Q3", "Mayo 2026", "Pronto" — frágil, propenso a bugs sutiles. Rechazado.
  - *Campo `priority` numérico explícito*: añade complejidad al modelo sin valor inmediato. Rechazado para v1; se puede añadir en spec futura si crece el volumen.

## R-005 — Estrategia de ancla legacy `#blog`

- **Decision**: la nueva sección lleva `id="pipeline"`; **inmediatamente antes** se inserta un anclaje invisible `<a id="blog" aria-hidden="true" tabindex="-1"></a>` para que `/#blog` siga navegando al lugar correcto.
- **Rationale**: HTML5 permite `id` en `<a>` vacío sin violar validación. El alias preserva enlaces externos (LinkedIn, redes, posibles bookmarks) sin romper el nav superior, que pasará a apuntar a `#pipeline`. El `<a>` queda fuera del orden de tabulación (`tabindex="-1"`) y oculto a screen readers (`aria-hidden`), evitando ruido.
- **Alternatives considered**:
  - *Conservar `id="blog"` y cambiar solo el label/contenido*: confunde semánticamente — el id es semántica, no se trata de un blog. Rechazado.
  - *JS que reescribe `location.hash` de `#blog` a `#pipeline`*: introduce JS innecesario y degrada UX (back button rompe). Rechazado.
  - *Redirección server-side*: GitHub Pages no la soporta para fragmentos.

## R-006 — Visualización: lista vertical vs. flecha horizontal vs. Kanban

- **Decision**: **lista vertical agrupada por stage**, con cabecera de grupo (`<h3>` invisible o decorativa) y items como cards. Cada item: badge de stage (con icono + texto), badge de tipo (con icono + texto), título, estimated (si presente), descripción, link opcional. En desktop ≥768 px se aplica un layout en grid de 2 columnas para densidad; en mobile colapsa a 1 columna.
- **Rationale**: respeta la jerarquía de información (stage > items), accesible por defecto, fácil de ordenar, degrada limpiamente a 320 px sin scroll horizontal (FR-013). Una "flecha pipeline" puramente decorativa puede agregarse como adorno CSS (línea vertical conectora a la izquierda de los grupos) sin afectar semántica.
- **Alternatives considered**:
  - *Pipeline horizontal con scroll*: rompe en mobile, conflicto con FR-013. Rechazado.
  - *Kanban con 4 columnas*: requiere 1280 px+ para legibilidad, mismo problema mobile. Rechazado para v1.

## R-007 — Indicadores visuales no-cromáticos para estados (constitución VI)

- **Decision**: cada stage usa un trio **(color + icono SVG inline + texto en español)**. Texto siempre presente y legible. Iconos pensados para distinguirse en escala de grises:
  - `coming-soon` → ✦ (color `--accent` cyan, icono "estrella/destello", texto "Pronto") + borde sutil con `outline: 2px solid currentColor`.
  - `review` → ◐ (color `--green`, icono "círculo medio", texto "En revisión").
  - `in-progress` → ◆ (color amarillo del token existente o `--accent` con opacidad, icono "rombo", texto "En progreso").
  - `backlog` → ○ (color `--text-muted`, icono "círculo vacío", texto "Backlog").
- **Rationale**: cumple FR-005 y SC-009 (Achromatopsia). El texto es siempre legible; el icono es complementario; el color es decorativo. Reusa tokens existentes (constitución II), sin colores nuevos.
- **Alternatives considered**:
  - *Solo color + texto*: cumple AA pero peor para usuarios con monocromía severa. Rechazado por exceso de cautela.
  - *Iconos lucide-icons como dependencia*: añade dep (constitución IV). Rechazado; SVG inline mínimo basta.

## R-008 — Indicadores visuales para tipos

- **Decision**: badge tipo con icono SVG inline + etiqueta de texto en español:
  - `interview` → 💬 estilo (icono "burbuja diálogo"), texto "Entrevista".
  - `lab` → ⌬ (icono "terminal" — tres líneas con `>`), texto "Laboratorio".
  - `talk` → 🎤 estilizado (icono "micrófono"), texto "Charla".
  - `post` → ▤ (icono "documento"), texto "Artículo".
  - `other` → ◇ (icono "rombo vacío"), texto "Otro".
- **Rationale**: identidad terminal preservada (no emojis, SVGs monocromos en `currentColor`). Texto siempre presente.
- **Alternatives considered**: usar emojis nativos — descartado por inconsistencia de renderizado entre OS y por degradar la estética terminal.

## R-009 — Validación de URLs en `link`

- **Decision**: aceptar solo `https://` válidas, regex `^https:\/\/[\w.-]+(\/[\w./%#?&=+-]*)?$` (mismo del build-interviews). Esquemas `http://`, `javascript:`, `data:`, `mailto:`, etc. son rechazados → build falla.
- **Rationale**: defensa en profundidad contra inyección via JSON aunque el JSON sea controlado por el autor. Coherente con CSP `default-src 'self'`. La whitelist es estricta y simple.
- **Alternatives considered**:
  - *Aceptar también enlaces relativos `/foo/bar`*: útil para teasers internos, lo añadiremos como alternativa permitida — `^\/[\w./#?&=+-]*$`. **Decisión final**: aceptar dos formatos: HTTPS absoluta o ruta relativa que empiece con `/`. Validación sigue estricta para todo lo demás.

## R-010 — Empty state cuando `items: []`

- **Decision**: el script genera un fragmento con un `<p class="pipeline-empty">` con texto cálido alineado a la voz spec 004: "El pipeline está vacío por ahora — escribime si querés sugerirme algo." Sin layout especial, sin error en consola, sin esqueleto de carga.
- **Rationale**: FR-015. La voz cálida importa (spec 004 establecida).
- **Alternatives considered**: ocultar la sección entera — descartado, contradice FR-001 (la sección existe).

## R-011 — CI gate: `pipeline-build-check`

- **Decision**: nuevo job en `.github/workflows/ci.yml`:
  1. `node scripts/build-pipeline.js --check` — corre el build en modo dry-run y comparación: si la salida HTML difiere del bloque actualmente en `index.html`, exit 1.
  2. `bash tests/pipeline-schema.sh` — itera sobre `content/pipeline.fixtures/invalid-*.json`, ejecuta el script con cada uno como input y exige exit≠0.
- **Rationale**: garantiza que `index.html` y `content/pipeline.json` no se desincronicen en PRs. La gate es rápida (<3 s) y determinista. El test negativo previene regresiones del validador.
- **Alternatives considered**:
  - *Re-generar `index.html` automáticamente en CI y commitear*: complica permisos, requiere PAT, no aporta sobre la gate de comparación. Rechazado.

## R-012 — Performance budget para la sección

- **Decision**: presupuesto: ≤8 KB de HTML adicional (gzipped), ≤2 KB de CSS adicional (gzipped), 0 KB de JS adicional. Lighthouse Performance del landing debe mantenerse ≥95.
- **Rationale**: constitución VII. Con ≤12 items, cada item ~300 bytes de HTML pre-gzip, el total cabe holgado.
- **Alternatives considered**: ninguna; el presupuesto es un techo conservador, no un objetivo a exprimir.

## R-013 — Seeds iniciales (SC-008)

- **Decision**: al primer merge, `content/pipeline.json` debe contener al menos 4 items reales: 1 interview, 1 lab, 1 talk, 1 post. Mezcla de estados que cubra al menos `coming-soon`, `in-progress`, `backlog`. La spec 003 ya tiene una entrevista en preparación (Victor Ardón / Pernix / etc.) que puede aparecer aquí en stage `coming-soon` o `review` con link al teaser.
- **Rationale**: cumple SC-008 sin inventar contenido. Demuestra los 5 tipos al menos en su mayoría. (El tipo `other` es opcional — no requerido en el seed.)
- **Alternatives considered**: cargar 4 items todos del mismo tipo — descartado, no cumple SC-008.

## R-014 — Documentación de mantenimiento (cadencia de revisión)

- **Decision**: documentar en `quickstart.md` la recomendación de revisar `content/pipeline.json` mensualmente y, opcionalmente, agregar un recordatorio manual (issue recurrente o nota en calendario personal). NO se implementa scheduler en GitHub Actions.
- **Rationale**: el riesgo de pipeline obsoleto es real (brief sección 9), pero un cron CI que avise cuando un item lleva >90 días en el mismo stage es scope creep. Postpuesto a posible spec futura si el patrón se repite.
- **Alternatives considered**: workflow scheduled con check de "última modificación" — fuera de alcance v1.

---

**Resultado**: las 14 decisiones están tomadas. Cero `NEEDS CLARIFICATION` pendientes. El plan puede pasar a Phase 1 sin bloqueos.
