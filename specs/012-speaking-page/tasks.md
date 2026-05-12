---
description: "Tasks: Speaking Page (spec 012)"
---

# Tasks: Speaking Page (kit de prensa para invitaciones)

**Input**: Design documents from `/specs/012-speaking-page/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: NO se generan tareas de test unitario nuevas. La spec 012
no las solicita y el contrato es validado por gates bash existentes
+ una nueva gate ligera (`tests/headshot-size.sh`). Las verificaciones
manuales (axe, copy, mailto, sin-JS) están en quickstart.md.

**Organization**: tareas agrupadas por user story para entrega
incremental. US1 y US2 son P1; US3 es P2. El MVP útil = Phase 1 +
Phase 2 + Phase 3 (US1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivo distinto, sin dependencias en
  tareas previas no completadas).
- **[Story]**: US1 / US2 / US3. Setup, Foundational y Polish no
  llevan label.

---

## Phase 1: Setup (infraestructura compartida)

**Purpose**: scaffolding mínimo de archivos y assets necesarios
antes de tocar cualquier user story.

- [X] T001 Crear directorio `speaking/` en la raíz del repo (vacío,
  preparado para `index.html`).
- [X] T002 [P] Crear directorio `assets/img/speaking/` y depositar el
  binario `assets/img/speaking/headshot.jpg` cumpliendo
  [contracts/headshot-asset.md](./contracts/headshot-asset.md):
  ≥ 1200×1200 px, JPG progresivo, ≤ 256 000 bytes,
  EXIF GPS limpiado.
- [X] T003 [P] Crear el archivo `assets/js/copy-bio.js` con el
  pseudocódigo de [contracts/copy-bio-contract.md](./contracts/copy-bio-contract.md)
  (~60 LOC vanilla, listener delegado, fallback explícito,
  IIFE strict mode, cero globals, cero `eval`).

**Checkpoint**: existen los placeholders de archivos y el binario
ya está en disco. Aún no hay HTML servido.

---

## Phase 2: Foundational (prerequisitos bloqueantes)

**Purpose**: integraciones con builders y gates compartidos. Sin
esto, la nueva página no recibe nav/footer ni aparece en validadores.
**Bloquea TODAS las user stories**.

- [X] T004 Editar `scripts/lib/layout.js`: añadir
  `Object.freeze({ href: '/speaking/', label: 'Speaking', match: Object.freeze(['/speaking/']) })`
  a `NAV_LINKS` en una posición coherente (entre `/talks/` y `/uses/`
  o tras `/uses/`; decisión editorial — recomendado tras `/talks/`
  por proximidad temática). Cero cambios al footer (renderFooter ya
  es uniforme).
- [X] T005 Editar `scripts/build-layout.js`: añadir
  `{ file: 'speaking/index.html', currentPath: '/speaking/' }` al
  array `PAGES`.
- [X] T006 [P] Editar `scripts/check-jsonld.js`: añadir
  `'speaking/index.html'` al array `STATIC_PAGES` para que la gate
  `tests/jsonld-validate.sh` cubra la nueva página.
- [X] T007 [P] Editar `tests/no-placeholders.sh`: agregar
  `speaking/index.html` a la lista de candidatos del array `served`.
- [X] T008 Crear `tests/headshot-size.sh` (bash, `set -euo pipefail`)
  que verifique:
  1. existencia de `assets/img/speaking/headshot.jpg`,
  2. `file` reporta `JPEG image data`,
  3. `wc -c` ≤ 256 000,
  4. si `sips` está disponible: `pixelWidth ≥ 1200` y `pixelHeight ≥ 1200`
     (skip silencioso si no está).
  Output success: `✓ headshot-size gate: assets/img/speaking/headshot.jpg (<bytes> bytes, <w>x<h>)`.
  Hacer ejecutable: `chmod +x tests/headshot-size.sh`.
- [X] T009 Editar `package.json`: añadir script
  `"check:headshot": "bash tests/headshot-size.sh"` y agregarlo al
  agregador `check:distribution` ya existente (encadenar con `&&`).

**Checkpoint**: builders saben que `/speaking/` existe; las gates
ya esperan el archivo. Aún no hay HTML, así que correr `npm run build`
ahora **debería fallar** con "speaking/index.html: file does not
exist" — eso confirma que la integración quedó cableada.

---

## Phase 3: User Story 1 — Organizadora prepara invitación (Priority: P1) 🎯 MVP

**Goal**: una organizadora visita `/speaking/`, copia una bio,
descarga el headshot y abre el cliente de correo con el body
prellenado de 8 campos.

**Independent Test**: cargar `/speaking/` en browser; copiar bio
media → pegar y verificar texto plano; click "Descargar headshot HD"
→ archivo `ardon-headshot.jpg` ≥ 1200×1200 px; click CTA → cliente
de correo abre con `Para: contacto@ardops.dev`, `Asunto: Invitación a speaking: [evento]`
y los 8 campos del body.

### Implementación de User Story 1

- [X] T010 [US1] Crear `speaking/index.html` siguiendo el esqueleto
  canónico de [contracts/speaking-html-contract.md](./contracts/speaking-html-contract.md):
  doctype, `<html lang="es">`, `<head>` con title/description/canonical,
  markers `<!-- head-meta:start --> <!-- head-meta:end -->`, CSP meta
  (idéntica al resto), OG (5 metas) + Twitter card (4 metas) +
  theme-color, links a `/assets/css/{tokens,layout,components}.css`,
  bloque JSON-LD `Person` con `@id="https://ardops.dev/#person"` y
  `mainEntityOfPage="https://ardops.dev/speaking/"`,
  `<script defer src="/assets/js/copy-bio.js">`. `<body>` con markers
  `<!-- nav:start --> <!-- nav:end -->` y
  `<!-- footer:start --> <!-- footer:end -->`. `<main id="main" class="speaking-main">`
  con header (h1 + tagline + CTA + fallback). Cumple invariantes
  H-1..H-4, H-13, H-14, H-15, H-17.
- [X] T011 [US1] En `speaking/index.html`, dentro del `<header class="speaking-hero">`,
  insertar el CTA principal `<a class="cta speaking-cta" href="mailto:…">`
  con el `href` exacto de [contracts/mailto-template.md](./contracts/mailto-template.md)
  (subject "Invitación a speaking: [evento]" + body con las 8 etiquetas
  Evento/Fecha/Audiencia/Duración/Tema propuesto/Modalidad
  (presencial/remoto)/Compensación/Contexto adicional, encoding
  RFC 6068). Inmediatamente debajo, el `<p class="speaking-cta-fallback">`
  con `contacto@ardops.dev` como link visible (cumple FR-010, H-11, H-12).
- [X] T012 [US1] Añadir `<section id="bios" aria-labelledby="bios-heading">`
  con `<h2 id="bios-heading">Bios</h2>` y exactamente 3
  `<details class="speaking-bio" data-bio-id="…">` (short, medium,
  long). Cada uno: `<summary>` descriptivo + nodo de texto plano
  con id (`bio-short-text`, `bio-medium-text`, `bio-long-text`) +
  `<button type="button" data-copy-target="…" data-copy-status="…">` +
  `<span id="…-status" data-copy-status-target aria-live="polite">`.
  Texto editorial real respetando word target ±15 % (30 / 80 / 200)
  y paragraphCount (1 / 2 / 3-4). Cumple FR-002, FR-003, FR-004,
  H-5, H-6, H-7.
- [X] T013 [US1] Añadir `<section id="headshot" aria-labelledby="headshot-heading">`
  con `<h2 id="headshot-heading">Foto / Headshot</h2>` y un
  `<figure class="speaking-headshot">` que contenga
  `<img src="/assets/img/speaking/headshot.jpg" alt="…" width="320" height="320" loading="lazy" decoding="async">`
  y `<figcaption>` con `<a href="/assets/img/speaking/headshot.jpg" download="ardon-headshot.jpg">Descargar headshot HD (≈ … KB · …×… JPG)</a>`.
  Etiqueta indica peso real y dimensiones reales del binario.
  Cumple FR-005, FR-006, H-8.
- [X] T014 [P] [US1] Añadir bloque CSS scoped al final de
  `assets/css/components.css` con prefijo `.speaking-*` (≤ 80 LOC).
  Mínimamente: layout vertical de secciones, espaciado de hero,
  estilo de `<details>` con `<summary>` clickeable y focus visible,
  estilo del botón "Copiar" coherente con el resto, estado del
  `<span data-copy-status-target>` (color via `var(--accent)` o
  `var(--green)` según convenga), figura con max-width responsivo,
  topics en grid simple. Cero variables nuevas; usar `var(--…)` de
  `tokens.css`. Cero `style=""` inline. Cumple constitución II y
  contrato CSP.
- [X] T015 [US1] Ejecutar `npm run build` para que
  `scripts/build-layout.js` inyecte nav/footer/head-meta en
  `speaking/index.html`. Luego correr verificaciones:
  - `bash tests/csp-no-unsafe-inline.sh`
  - `bash tests/headshot-size.sh`
  - `bash tests/jsonld-validate.sh`
  - `bash tests/no-placeholders.sh`
  - `npm run html-validate`
  Todas deben quedar verdes. Si algo falla, ajustar y repetir hasta
  verde antes de avanzar.

**Checkpoint**: `/speaking/` carga en local con header + CTA + 3 bios
copiables + headshot descargable + nav y footer compartidos. La user
story 1 ya entrega valor: una organizadora puede preparar la
invitación de punta a punta.

---

## Phase 4: User Story 2 — Visitante con JS bloqueado o lector de pantalla (Priority: P1)

**Goal**: la página es 100 % funcional sin JavaScript y accesible
para lectores de pantalla y usuarios solo-teclado.

**Independent Test**: deshabilitar JavaScript en DevTools, recargar
`/speaking/`. Las 3 bios siguen visibles/expandibles via `<details>`
nativo, el headshot se descarga (atributo `download`), el mailto
funciona. Tabular toda la página con teclado: foco visible y orden
lógico (ver contrato HTML §"Orden de tabulación esperado"). axe-core
y pa11y reportan 0 violaciones.

### Implementación de User Story 2

- [X] T016 [US2] Revisar `assets/js/copy-bio.js` y confirmar que el
  fallback de [contracts/copy-bio-contract.md](./contracts/copy-bio-contract.md)
  está implementado (cuando `navigator.clipboard?.writeText` no es
  función, llamar `setStatus(statusEl, 'Copia no disponible — usá la selección manual')`,
  no lanzar excepciones). Confirmar también que el listener filtra
  por `closest('[data-copy-target]')` y no cae en errores cuando
  `targetEl` no existe. Si falta algo, completarlo.
- [X] T017 [US2] Revisar `speaking/index.html` y verificar
  manualmente:
  1. Cero atributos `on*` en cualquier elemento.
  2. Cada `<details>` se expande sin JS al click en `<summary>`.
  3. Cada bio expone su contenido textual íntegro dentro del
     `<details>` (no oculto detrás del JS).
  4. Cada `<button data-copy-target>` está dentro del flujo natural
     de tab y tiene texto visible (no solo icono).
  5. `<a target="_blank">` (si los hay) llevan
     `rel="noopener noreferrer"` (constitución VIII y FR-015).
- [X] T018 [US2] Validar con la suite a11y:
  - `node tests/a11y.js` (agregar la URL `/speaking/` al runner si
    no la trae automáticamente; revisar `tests/a11y.js` y, si tiene
    un array de URLs, añadir `'speaking/'`).
  - `bash tests/external-links.sh` para confirmar
    rel="noopener noreferrer" en cualquier link externo.
  - `bash tests/csp-no-unsafe-inline.sh` (re-correr; debería seguir
    verde porque T015 ya pasó, pero confirmar tras los cambios de
    T016/T017).
  Cero violaciones esperadas; si las hay, corregir y re-correr.
- [X] T019 [US2] Smoke manual sin JS: abrir DevTools → Settings →
  Debugger → "Disable JavaScript" → recargar `/speaking/`. Confirmar
  que las 3 bios son legibles (visibles tras click en `<summary>`)
  y seleccionables, que el headshot descarga, y que el CTA mailto
  abre cliente de correo. Documentar en el PR description que SC-006
  se cumplió.

**Checkpoint**: `/speaking/` cumple WCAG 2.1 AA y degrada
graciosamente sin JS. SC-005, SC-006 y SC-007 verificados.

---

## Phase 5: User Story 3 — Periodista verifica credibilidad (Priority: P2)

**Goal**: las secciones "Temas", "Idiomas y formatos" y "Eventos
pasados destacados" dan a una visitante todo lo necesario para
validar credibilidad y ofrecen un puente claro a `/talks/`.

**Independent Test**: scrollear `/speaking/` y confirmar:
4-8 temas con título/descripción/audiencia/duración; los 3 bloques
de idiomas/formatos/modalidad presentes; 3-5 charlas destacadas con
título/evento/año y un link "Ver historial completo" a `/talks/`.

### Implementación de User Story 3

- [X] T020 [P] [US3] Añadir a `speaking/index.html` la
  `<section id="topics" aria-labelledby="topics-heading">` con
  `<h2 id="topics-heading">Temas que doy</h2>` y entre 4 y 8
  `<article class="speaking-topic">`. Cada `<article>`:
  `<h3>` título, `<p>` descripción 1-2 líneas, y `<dl>` con
  `<dt>Audiencia</dt><dd>…</dd><dt>Duración</dt><dd>…</dd>`.
  Texto editorial real (no Lorem). Cumple FR-007, H-9.
- [X] T021 [P] [US3] Añadir a `speaking/index.html` la
  `<section id="formats" aria-labelledby="formats-heading">` con
  `<h2 id="formats-heading">Idiomas y formatos</h2>` y un `<dl>` con
  3 entradas: Idiomas (Español nativo, inglés profesional), Formatos
  (Keynote, workshop, panel, podcast, AMA), Modalidad (Presencial
  Costa Rica, remoto LATAM). Cumple FR-008.
- [X] T022 [US3] Añadir a `speaking/index.html` la
  `<section id="highlights" aria-labelledby="highlights-heading">`
  con `<h2 id="highlights-heading">Eventos pasados destacados</h2>`,
  un `<ol>` con entre 3 y 5 `<li>` (cada uno: título — evento — año,
  opcionalmente link a `/talks/#…` si la charla tiene anchor estable
  ya declarado en `talks/index.html`), y un `<p>` final con
  `<a href="/talks/">Ver historial completo en /talks/ →</a>`.
  Cumple FR-011, H-10.
- [X] T023 [US3] Re-ejecutar gates afectadas tras añadir el
  contenido nuevo:
  - `npm run build` (re-inyecta layout si fuese necesario).
  - `npm run html-validate`.
  - `bash tests/no-placeholders.sh`.
  - `bash tests/external-links.sh` (si T022 usó anchors a `/talks/`).
  Todas deben quedar verde.

**Checkpoint**: la página está completa visualmente. SC-001 (60 s
para preparar invitación) verificable de punta a punta.

---

## Phase 6: Polish & cross-cutting (sitemap, SEO, nav consistency, CI)

**Purpose**: cerrar las gates de distribución, asegurar que la
página esté indexada y enlazada, y dejar evidencia de que todo CI
queda verde.

- [X] T024 [P] Editar `sitemap.xml`: añadir entrada
  `<url><loc>https://ardops.dev/speaking/</loc><lastmod>2026-05-12</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
  en posición coherente (alfabética por path). Correr
  `bash tests/sitemap-drift.sh` y verificar verde.
- [X] T025 [P] Verificar metadatos SEO de la página: correr
  `bash tests/seo-meta.sh`. Si falta canonical/description/og:*/
  twitter:*/theme-color, corregir hasta verde.
- [X] T026 [P] Confirmar que la nav global rendereada incluye el
  link `/speaking/` con marca `aria-current="page"` cuando se está
  en esa ruta. Correr `bash tests/nav-consistency.sh` y verificar
  verde en las 5 páginas (incluida `speaking/index.html`).
- [X] T027 Ejecutar la suite completa local en orden:
  ```
  npm run build \
   && npm run html-validate \
   && bash tests/csp-no-unsafe-inline.sh \
   && bash tests/external-links.sh \
   && bash tests/no-placeholders.sh \
   && bash tests/nav-consistency.sh \
   && bash tests/sitemap-drift.sh \
   && bash tests/seo-meta.sh \
   && bash tests/jsonld-validate.sh \
   && bash tests/headshot-size.sh \
   && node tests/a11y.js
  ```
  Confirmar que las 11 gates están verde antes del merge.
- [X] T028 Smoke manual post-deploy en `https://ardops.dev/speaking/`
  siguiendo [quickstart.md §5](./quickstart.md): `curl -sI` da 200,
  JSON-LD `@id` presente, sitemap incluye `/speaking/`, nav del home
  enlaza a `/speaking/`. Adicionalmente:
  - Validador Schema.org sobre `https://ardops.dev/speaking/`.
  - Lighthouse SEO ≥ 95 (móvil).
  - Lighthouse Performance ≥ 95 y Accessibility = 100 (móvil).
  Documentar resultados en el PR description (SC-002, SC-003).
- [X] T029 Smoke manual del mailto: abrir `https://ardops.dev/speaking/`
  en Gmail web (con `mailto:` handler configurado) y en Apple Mail.
  Confirmar que el cliente abre con destinatario correcto, asunto
  prellenado y los 8 campos del body en orden (SC-008).
- [X] T030 Marcar el backlog como completado: editar
  [backlog/05-speaking-page.md](../../backlog/05-speaking-page.md),
  cambiar la línea de estado a
  `> **Estado**: ✅ completado en spec [012-speaking-page](../specs/012-speaking-page/)`
  (mismo patrón usado en `backlog/04-rss-jsonld-seo.md`).

---

## Dependencias entre fases / user stories

- **Phase 1 (Setup)** → habilita Phase 2.
- **Phase 2 (Foundational)** → bloquea TODAS las user stories.
- **Phase 3 (US1, P1, MVP)** → independiente de US2/US3 una vez
  Phase 2 completa. Es el MVP entregable.
- **Phase 4 (US2, P1)** → depende de Phase 3 (necesita el HTML y el
  JS ya creados para revisar/validar). No puede correr en paralelo
  con Phase 3.
- **Phase 5 (US3, P2)** → puede correr en paralelo con Phase 4 una
  vez Phase 3 está completa (los archivos editados son distintos:
  Phase 4 toca `assets/js/copy-bio.js` y revisa, Phase 5 añade
  secciones HTML nuevas). Recomendado serializar igual para evitar
  ruido en revisión.
- **Phase 6 (Polish)** → depende de Phase 3+4+5. Las tareas
  marcadas [P] dentro de Phase 6 (T024, T025, T026) son
  paralelizables entre sí.

## Oportunidades de paralelización

- T002 + T003 + T006 + T007 (archivos distintos, sin dependencias).
- T020 + T021 (secciones HTML distintas dentro del mismo archivo —
  paralelizables conceptualmente; serializar si se trabaja en una
  sola PR para evitar conflictos de merge).
- T024 + T025 + T026 (gates independientes sobre artefactos ya
  creados).

## Estrategia de implementación (MVP first)

1. **Sprint 0**: Phase 1 + Phase 2 (scaffolding + integraciones).
2. **MVP**: Phase 3 (US1). Si solo se entrega esto, ya hay valor:
   organizadora puede preparar invitación.
3. **Hardening**: Phase 4 (US2) — a11y + sin-JS.
4. **Bonus**: Phase 5 (US3) — credibilidad.
5. **Cierre**: Phase 6 (Polish) — sitemap/SEO/nav/CI/backlog.

## Validación de formato

Las 30 tareas siguen el formato estricto:
`- [ ] [TaskID] [P?] [Story?] Description with file path`. Setup,
Foundational y Polish no llevan label de story. Las 14 tareas de
US1/US2/US3 llevan label correspondiente.
