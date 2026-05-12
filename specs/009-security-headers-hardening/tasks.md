---
description: "Task list for spec 009 — Security headers hardening (subset realmente aplicable)"
---

# Tasks: Security headers hardening (subset realmente aplicable)

**Input**: Design documents from `/specs/009-security-headers-hardening/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: Tests son los **gates** mismos (esta spec ES tests). NO se generan tests unitarios separados — los gates se desarrollan con fixtures de validación (FAIL antes / PASS después).

**Organization**: Tareas agrupadas por user story (US1..US4) según prioridad declarada en spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias).
- **[Story]**: Mapea la tarea a una user story (US1, US2, US3, US4).
- Rutas de archivo absolutas relativas al repo.

## Path Conventions

Single project (sitio estático). Convenciones:
- Build/gates: `scripts/`, `scripts/lib/`, `scripts/check-*.js`.
- Wrappers de gates: `tests/*.sh`.
- Output: `assets/`, `blog/`, `interviews/`, `talks/`, raíz.
- Docs: `docs/`.
- CI: `.github/workflows/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar estructura base mínima (cero deps nuevas).

- [X] T001 [P] Verificar que `jsdom` está disponible como devDependency en [package.json](package.json) (debe estar desde spec 006). Si falta, fallar la spec — no agregar deps nuevas sin actualizar plan.
- [X] T002 [P] Crear directorios necesarios: `scripts/lib/` ya existe (spec 008); confirmar que `assets/css/` existe (ya existe). Cero acción si ya están.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Módulo compartido `scripts/lib/head.js` y constante CSP canónica que TODAS las user stories consumen.

**⚠️ CRITICAL**: Ninguna user story puede empezar hasta que esta fase esté completa.

- [X] T003 Crear módulo [scripts/lib/head.js](scripts/lib/head.js) que exporta la constante `META_REFERRER = '<meta name="referrer" content="strict-origin-when-cross-origin">'` siguiendo el contrato en [specs/009-security-headers-hardening/contracts/head-module.md](specs/009-security-headers-hardening/contracts/head-module.md). CommonJS, cero deps, una sola función pura.
- [X] T004 Definir constante CSP canónica del sitio (sin `'unsafe-inline'`) según [specs/009-security-headers-hardening/contracts/csp-contract.md](specs/009-security-headers-hardening/contracts/csp-contract.md). Documentarla como referencia en el header del módulo `scripts/lib/head.js` (comentario JSDoc), aunque la emisión final quede en cada generador / página estática.

**Checkpoint**: Foundation lista — US1, US2, US3, US4 pueden empezar.

---

## Phase 3: User Story 1 — CSP del blog sin `'unsafe-inline'` (Priority: P1) 🎯 MVP

**Goal**: Eliminar `'unsafe-inline'` de la CSP servida en `blog/index.html` y `blog/<slug>.html` extrayendo `renderTagCssRules()` a un CSS externo. CSP del blog queda byte-equivalente al resto del sitio.

**Independent Test**: `grep "'unsafe-inline'" blog/*.html` = 0 matches; cargar `/blog/` en navegador → cero violaciones CSP en consola; los chips de tags se aplican normalmente.

### Implementation for User Story 1

- [X] T005 [US1] Modificar [scripts/build-blog.js](scripts/build-blog.js) — refactor: extraer la función `renderTagCssRules(tags)` para que su output se escriba a `assets/css/blog-tag-rules.css` durante el build (antes de generar `blog/index.html`). Mantener el cuerpo de la función pura (input → CSS string) sin cambios.
- [X] T006 [US1] Modificar [scripts/build-blog.js](scripts/build-blog.js) — agregar paso de escritura: `fs.writeFileSync('assets/css/blog-tag-rules.css', tagRules + '\n')` con header de comentario `/* Generado por scripts/build-blog.js — NO editar a mano. */`.
- [X] T007 [US1] Modificar [scripts/build-blog.js](scripts/build-blog.js) — en el template de `renderBlogIndex()`, eliminar el bloque `<style id="blog-tag-rules">${tagRules}</style>` y reemplazarlo por `<link rel="stylesheet" href="/assets/css/blog-tag-rules.css">` colocado al final de la cascada CSS (después de `components.css`) según D-008 en [specs/009-security-headers-hardening/research.md](specs/009-security-headers-hardening/research.md).
- [X] T008 [US1] Modificar [scripts/build-blog.js](scripts/build-blog.js) — actualizar la constante `CSP` (línea ~83): cambiar `style-src 'self' 'unsafe-inline'` a `style-src 'self'`. Esto afecta tanto `blog/index.html` como `blog/<slug>.html` (D-006).
- [X] T009 [US1] Modificar el modo `--check` de [scripts/build-blog.js](scripts/build-blog.js) — además de comparar el HTML generado vs disco, comparar el CSS emitido (`assets/css/blog-tag-rules.css`) vs disco. Falla con exit 1 si hay drift.
- [X] T010 [US1] Ejecutar `node scripts/build-blog.js` localmente y commitear el resultado: `assets/css/blog-tag-rules.css` (nuevo), `blog/index.html` (CSP actualizada + link), `blog/pipeline-seguridad-spec-driven.html` (CSP actualizada).
- [X] T011 [US1] Smoke test manual: abrir `blog/index.html` en navegador local con server estático, verificar (a) cero violaciones CSP en consola, (b) chips de tags filtran posts correctamente, (c) estado activo de chip funciona.

**Checkpoint**: US1 completo. CSP del blog sin `'unsafe-inline'`. Comportamiento visual idéntico.

---

## Phase 4: User Story 2 — Referrer policy uniforme (Priority: P1)

**Goal**: Cada página servida emite `<meta name="referrer" content="strict-origin-when-cross-origin">` en el `<head>` desde un único punto de emisión (`scripts/lib/head.js`).

**Independent Test**: Para cada `*.html` servido, `grep '<meta name="referrer"' <file>` retorna exactamente 1 match con el valor correcto. Smoke en navegador: hacer click en link externo y verificar que el `Referer` enviado es solo el origen.

### Implementation for User Story 2

- [X] T012 [P] [US2] Modificar [scripts/build-blog.js](scripts/build-blog.js) — importar `META_REFERRER` desde [scripts/lib/head.js](scripts/lib/head.js) y emitirlo en el `<head>` de los templates `renderBlogIndex()` y `renderBlogPost()`. Posición: justo después del `<meta http-equiv="Content-Security-Policy">`.
- [X] T013 [P] [US2] Modificar [scripts/build-interviews.js](scripts/build-interviews.js) — importar `META_REFERRER` y emitirlo dentro de la función `commonHead()` (justo después del `<meta http-equiv="Content-Security-Policy">`).
- [X] T014 [US2] Extender [scripts/build-layout.js](scripts/build-layout.js) — agregar soporte para markers `<!-- head-meta:start -->` / `<!-- head-meta:end -->` en páginas estáticas. Reemplaza el contenido entre markers (incluidos) con `META_REFERRER` importado de `scripts/lib/head.js`. Si los markers no existen en una página esperada, emite error con instrucción clara.
- [X] T015 [P] [US2] Editar [index.html](index.html) — insertar markers `<!-- head-meta:start -->\n<meta name="referrer" content="strict-origin-when-cross-origin">\n<!-- head-meta:end -->` en el `<head>` justo después del `<meta http-equiv="Content-Security-Policy">`.
- [X] T016 [P] [US2] Editar [404.html](404.html) — insertar los mismos markers + meta referrer en la misma posición relativa.
- [X] T017 [P] [US2] Editar [talks/index.html](talks/index.html) — insertar los mismos markers + meta referrer en la misma posición relativa.
- [X] T018 [US2] Ejecutar `npm run build` (regenera blog + interviews + layout) y commitear: todos los HTML servidos deben contener el meta referrer.
- [X] T019 [US2] Smoke verification: `grep -L 'name="referrer"' index.html 404.html talks/index.html blog/index.html blog/*.html interviews/*.html` debe retornar lista vacía (todos los archivos tienen el meta).

**Checkpoint**: US2 completo. Referrer policy uniforme en todo el sitio.

---

## Phase 5: User Story 3 — Anti-tabnabbing gate (Priority: P1)

**Goal**: Gate `tests/external-links.sh` valida que todo `<a target="_blank">` externo lleva `rel="noopener noreferrer"`. Bloqueante en CI.

**Independent Test**: `bash tests/external-links.sh` exit 0 con cero violaciones. Crear fixture temporal con `target="_blank"` sin `rel` → gate falla con mensaje claro identificando archivo y href.

### Implementation for User Story 3

- [X] T020 [P] [US3] Crear script Node [scripts/check-external-links.js](scripts/check-external-links.js) que implementa el gate según [specs/009-security-headers-hardening/contracts/external-links-gate.md](specs/009-security-headers-hardening/contracts/external-links-gate.md). Usa `jsdom` para parsear cada HTML servido. Para cada `<a target="_blank">`: clasifica externo/interno (D-004), valida que `rel` contiene tokens `noopener` y `noreferrer`. Output formateado con archivo/href/violación. Exit 0/1.
- [X] T021 [P] [US3] Crear wrapper [tests/external-links.sh](tests/external-links.sh) (`#!/usr/bin/env bash`, `set -euo pipefail`) que ejecuta `node scripts/check-external-links.js` y propaga exit code. Marcar como ejecutable (`chmod +x`).
- [X] T022 [US3] Validar manualmente: `bash tests/external-links.sh` debe pasar (los 14 matches actuales en `index.html` y `blog/pipeline-seguridad-spec-driven.html` ya tienen `rel="noopener noreferrer"`). Si falla, corregir el HTML.
- [X] T023 [US3] Test negativo (sin commitear): crear temporalmente un `<a target="_blank" href="https://example.com">test</a>` en una página, correr el gate, verificar que falla con mensaje claro indicando archivo y href. Revertir el fixture.

**Checkpoint**: US3 completo. Gate de tabnabbing operativo.

---

## Phase 6: User Story 4 — Sitemap drift gate (Priority: P2)

**Goal**: Gate `tests/sitemap-drift.sh` valida bidireccionalmente sitemap ↔ canonicals. Detecta y corrige el drift actual (`interviews/victor-ardon.html` falta).

**Independent Test**: `bash tests/sitemap-drift.sh` exit 0 después de agregar la entrada faltante.

### Implementation for User Story 4

- [X] T024 [P] [US4] Crear script Node [scripts/check-sitemap-drift.js](scripts/check-sitemap-drift.js) que implementa el gate según [specs/009-security-headers-hardening/contracts/sitemap-drift-gate.md](specs/009-security-headers-hardening/contracts/sitemap-drift-gate.md). Usa `jsdom` (modo XML) para parsear `sitemap.xml`. Recorre HTML servido, extrae `<link rel="canonical">`. Aplica normalización (D-005), exclusiones (D-006). Validaciones V-1 (forward), V-2 (backward), V-3 (warning sin canonical). Exit 0/1.
- [X] T025 [P] [US4] Crear wrapper [tests/sitemap-drift.sh](tests/sitemap-drift.sh) (`#!/usr/bin/env bash`, `set -euo pipefail`) que ejecuta `node scripts/check-sitemap-drift.js`. `chmod +x`.
- [X] T026 [US4] Validar drift actual: ejecutar `bash tests/sitemap-drift.sh`. Esperado: falla con V-2 reportando que `interviews/victor-ardon.html` falta del sitemap.
- [X] T027 [US4] Editar [sitemap.xml](sitemap.xml) — agregar entrada faltante:
  ```xml
  <url>
    <loc>https://ardops.dev/interviews/victor-ardon.html</loc>
    <lastmod>2026-05-11</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
  ```
- [X] T028 [US4] Re-ejecutar `bash tests/sitemap-drift.sh` → exit 0.

**Checkpoint**: US4 completo. Sitemap drift gate operativo, drift actual cerrado.

---

## Phase 7: Gate de CSP estricta (transversal — refuerza US1)

**Goal**: Gate `tests/csp-no-unsafe-inline.sh` activo + prohibitivo, según contrato. Cierra la categoría completa para que US1 no pueda regresionar.

**Independent Test**: `bash tests/csp-no-unsafe-inline.sh` exit 0 después de US1. Test negativo: re-introducir `'unsafe-inline'` en un archivo → gate falla con mensaje claro.

### Implementation

- [X] T029 [P] [US1] Crear script Node [scripts/check-csp.js](scripts/check-csp.js) que implementa el gate según [specs/009-security-headers-hardening/contracts/csp-gate.md](specs/009-security-headers-hardening/contracts/csp-gate.md). Usa `jsdom` para parsear cada HTML servido. Validaciones V-1 (CSP presente), V-2 (tokens prohibidos), V-3 (directivas mínimas requeridas). Exit 0/1 con output formateado.
- [X] T030 [P] [US1] Crear wrapper [tests/csp-no-unsafe-inline.sh](tests/csp-no-unsafe-inline.sh) (`#!/usr/bin/env bash`, `set -euo pipefail`). `chmod +x`.
- [X] T031 [US1] Validar `bash tests/csp-no-unsafe-inline.sh` exit 0 después de completar US1.
- [X] T032 [US1] Test negativo: temporalmente reintroducir `'unsafe-inline'` en `style-src` de una página, correr el gate, verificar que falla con mensaje claro. Revertir.

**Checkpoint**: Gate CSP operativo. US1 protegido contra regresión.

---

## Phase 8: CI integration

**Goal**: Los 3 gates nuevos se ejecutan como bloqueantes en CI (no `continue-on-error`). Los gates existentes siguen pasando.

- [X] T033 Modificar [.github/workflows/ci.yml](.github/workflows/ci.yml) — agregar 3 jobs (o steps en job existente) para `bash tests/csp-no-unsafe-inline.sh`, `bash tests/external-links.sh`, `bash tests/sitemap-drift.sh`. Sin `continue-on-error`. Misma matrix/Node version que el resto de gates de spec 008.
- [X] T034 Verificar que los gates existentes siguen pasando: en CI, `node scripts/build-blog.js --check`, `node scripts/build-layout.js --check`, `bash tests/nav-consistency.sh`, `npm run html-validate`, `node tests/a11y.js` deben seguir verdes.

**Checkpoint**: CI cubre todas las invariantes de seguridad. PRs nuevos no pueden regresionar.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Goal**: Documentación versionada, scripts npm, constitución actualizada.

- [X] T035 [P] Actualizar [docs/05-security-spec.md](docs/05-security-spec.md) — agregar (a) la CSP canónica del sitio (link a contrato), (b) sección "Out of scope técnico permanente" documentando que `Permissions-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security` custom NO son aplicables vía `<meta>` y GH Pages no permite headers HTTP custom (FR-016, SC-009), (c) protocolo para excepciones (vía spec dedicada con SRI explícito), (d) tabla de gates de seguridad activos.
- [X] T036 [P] Actualizar [.specify/memory/constitution.md](.specify/memory/constitution.md) principio IV — agregar nota: "Cero scripts, fonts, CSS o imágenes de origen externo en runtime; cualquier excepción requiere SRI explícito documentado en spec dedicada" (FR-017). Bump versión menor (e.g., v1.1.0 → v1.2.0). Actualizar Sync Impact Report.
- [X] T037 [P] Agregar scripts de conveniencia en [package.json](package.json):
  - `"check:csp": "bash tests/csp-no-unsafe-inline.sh"`
  - `"check:links": "bash tests/external-links.sh"`
  - `"check:sitemap": "bash tests/sitemap-drift.sh"`
  - `"check:security": "npm run check:csp && npm run check:links && npm run check:sitemap"`
- [X] T038 Ejecutar el quickstart end-to-end: seguir [specs/009-security-headers-hardening/quickstart.md](specs/009-security-headers-hardening/quickstart.md) sección "Validación local (todos los gates)". Todos los gates deben pasar.
- [X] T039 Smoke test externo (post-deploy preview o local server): cargar `/blog/` y `/blog/pipeline-seguridad-spec-driven.html`, verificar en DevTools (a) cero violaciones CSP en consola, (b) `<meta name="referrer">` presente, (c) `assets/css/blog-tag-rules.css` se descarga 200 OK.
- [X] T040 Auditoría externa con `securityheaders.com` post-deploy: confirmar grado mínimo **A** para `https://ardops.dev/` y `https://ardops.dev/blog/` (SC-006). Si falla, diagnosticar (probable: missing header HTTP que no podemos controlar; documentar en docs/05).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sin dependencias.
- **Phase 2 (Foundational)**: depende de Phase 1. **BLOQUEA** todas las user stories.
- **Phase 3 (US1)**: depende de Phase 2.
- **Phase 4 (US2)**: depende de Phase 2. Independiente de US1 a nivel de archivos (pueden ejecutarse en paralelo).
- **Phase 5 (US3)**: depende de Phase 2. Independiente de US1, US2.
- **Phase 6 (US4)**: depende de Phase 2. Independiente de US1, US2, US3.
- **Phase 7 (Gate CSP)**: depende de US1 completado (T010) para validar exit 0 en T031.
- **Phase 8 (CI)**: depende de Phase 5, 6, 7 completos (los 3 wrappers `.sh` deben existir).
- **Phase 9 (Polish)**: depende de todas las anteriores.

### User Story Dependencies

- **US1**: independiente.
- **US2**: independiente; consume `META_REFERRER` de Phase 2.
- **US3**: independiente.
- **US4**: independiente; requiere editar `sitemap.xml` (no bloqueado por nada más).

### Within Each User Story

- En US1: T005 → T006 → T007 → T008 secuenciales (todos tocan `scripts/build-blog.js`). T009 después. T010 después de T005-T009. T011 después de T010.
- En US2: T012, T013 paralelos (archivos distintos). T014 secuencial (depende de T003). T015, T016, T017 paralelos (archivos estáticos distintos). T018 después de T012-T017. T019 después de T018.
- En US3: T020, T021 paralelos. T022, T023 después.
- En US4: T024, T025 paralelos. T026 → T027 → T028 secuenciales.
- En Phase 7: T029, T030 paralelos. T031 → T032.
- En Phase 9: T035, T036, T037 paralelos.

### Parallel Opportunities

```
Setup:        T001 || T002
Foundational: T003 → T004 (T004 depende de T003 conceptualmente — JSDoc en mismo archivo)
US1 → US2 → US3 → US4 pueden ejecutarse por developers distintos en paralelo tras Phase 2.
Dentro de cada story, las tareas marcadas [P] corren en paralelo.
```

---

## Parallel Example: User Story 2 (después de Phase 2)

```bash
# Las ediciones de archivos estáticos (T015-T017) son archivos distintos:
Task: "Editar index.html — insertar markers + meta referrer"        # T015
Task: "Editar 404.html — insertar markers + meta referrer"          # T016
Task: "Editar talks/index.html — insertar markers + meta referrer"  # T017

# Y las modificaciones a generadores (T012, T013) son archivos distintos:
Task: "Modificar scripts/build-blog.js — emitir META_REFERRER"        # T012
Task: "Modificar scripts/build-interviews.js — emitir META_REFERRER"  # T013
```

## Parallel Example: Gates (Phase 5, 6, 7)

```bash
# Tres gates totalmente independientes:
Task: "Crear scripts/check-external-links.js"      # T020
Task: "Crear scripts/check-sitemap-drift.js"       # T024
Task: "Crear scripts/check-csp.js"                 # T029
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 + Phase 2 (Setup + Foundational).
2. Phase 3 (US1 completo).
3. **STOP & VALIDATE**: blog sin `'unsafe-inline'`, comportamiento visual intacto.
4. Phase 7 (gate CSP) para proteger contra regresión.
5. Deploy. MVP shipped.

### Incremental Delivery

1. MVP (US1 + gate CSP) → deploy.
2. Agregar US2 (referrer meta) → deploy.
3. Agregar US3 (anti-tabnabbing gate) → deploy.
4. Agregar US4 (sitemap drift) → deploy.
5. Phase 8 (CI integration) cuando todos los gates existen.
6. Phase 9 (docs + polish) al final.

### Single-PR Strategy (recomendado para esta spec)

Como todas las user stories son P1/P2 y comparten la misma temática
("hardening de seguridad"), tiene sentido un único PR con todas las
fases. Esfuerzo total: ~medio día (estimado en backlog item 02).
Auto-review más fácil que 4 PRs intercalados.

---

## Notes

- Cero deps nuevas (constitución III, IV).
- Cero cambios visuales (constitución II).
- Cero degradación de performance (constitución VII): el CSS externo
  añadido es ~2-3 KB cacheable, el bloque inline removido es de
  tamaño equivalente. Net delta ~0 bytes.
- Tests = los gates mismos. Validación negativa (test fixture
  temporal) recomendada para cada gate antes de mergear.
- Siempre commitear el output regenerado (HTML + CSS) junto al cambio
  de código que lo produjo.
- Los gates existentes (spec 008 nav-consistency, build-blog
  --check, html-validate, a11y) siguen pasando — verificación
  explícita en T034.
