# Tasks: Reescritura de Bio Personal (tono cálido)

**Feature**: 004-personal-bio-rewrite
**Branch**: `004-personal-bio-rewrite`
**Spec**: [spec.md](spec.md)
**Plan**: [plan.md](plan.md)
**Generated**: 2026-04-28

> **Format**: `- [ ] T### [P?] [Story?] Description with file path`
> User stories priorizados (P1 > P2 > P3); cada uno es entregable independientemente.
> Tareas con `[P]` son paralelizables (archivos distintos, sin dependencias intermedias).
> Sin tareas de tests (la spec no las pidió; gates existentes y nuevo gate `no-placeholders` cubren la verificación mecánica).

---

## Phase 1 — Setup

- [X] T001 Verificar que la rama activa es `004-personal-bio-rewrite` y que el árbol de trabajo está limpio (sin cambios sin commitear que no sean de specs/004-*): `git branch --show-current` debe imprimir `004-personal-bio-rewrite`; `git status --short | grep -v 'specs/004-personal-bio-rewrite' | grep -v '\.specify/feature.json' | grep -v '\.github/copilot-instructions.md'` debe imprimir vacío
- [X] T002 [P] Confirmar que [specs/004-personal-bio-rewrite/contracts/copy-contract.md](contracts/copy-contract.md) y [specs/004-personal-bio-rewrite/contracts/no-placeholders-gate.md](contracts/no-placeholders-gate.md) existen y son la fuente normativa del copy y del gate respectivamente — leer ambos antes de empezar US1/US2
- [X] T003 [P] Localizar los bloques a editar en [index.html](../../index.html) y registrar las líneas exactas: `grep -nE '<p class="hero-desc">|class="about-text"|name="description"|property="og:description"' index.html` — guardar mentalmente o anotar los números de línea para los pasos siguientes

---

## Phase 2 — Foundational

> *No aplica.* Esta feature no introduce infraestructura nueva ni dependencias previas que bloqueen las user stories.

---

## Phase 3 — User Story 1: Bio principal del hero/about con tono humano (P1)

**Story Goal**: que un visitante en `https://ardops.dev/` lea un hero y un "Sobre mí" en primera persona, ≤ 90 palabras en hero, con menciones explícitas de rol profesional + dato humano (familia/fútbol), respetando el copy aprobado en [contracts/copy-contract.md](contracts/copy-contract.md).

**Independent Test**: cargar `index.html` localmente (`npx serve -l 8080 .`) y confirmar que (a) el hero muestra el copy nuevo, (b) la sección "Sobre mí" tiene 3 párrafos cálidos + el chip stack intacto, (c) `npx html-validate index.html` reporta 0 errores, (d) `node tests/a11y.js` reporta 0 violaciones AA en `http://localhost:8080/`.

### Implementación

- [X] T004 [US1] Reemplazar el contenido del `<p class="hero-desc">…</p>` en [index.html](../../index.html) con la cadena exacta de [contracts/copy-contract.md](contracts/copy-contract.md) §1 (`HeroBio.text`, ~62 palabras, primera persona). Conservar el wrapper `<p class="hero-desc">` sin cambios; reemplazar SOLO el text node interior. No insertar `<br>`, no cambiar el guion largo `—` por `-`, mantener Unicode directo
- [X] T005 [US1] En la sección `#about > .about-grid > .about-text` de [index.html](../../index.html), reemplazar los **dos `<p>` actuales** por **tres `<p>`** con los textos exactos de [contracts/copy-contract.md](contracts/copy-contract.md) §2 (Párrafo 1, Párrafo 2, Párrafo 3 en ese orden). NO tocar el `<p class="about-stack">` que sigue (R-011 / I-7)
- [X] T006 [US1] [P] Reemplazar el `content="…"` del `<meta name="description">` en el `<head>` de [index.html](../../index.html) con la cadena de [contracts/copy-contract.md](contracts/copy-contract.md) §3 (144 chars)
- [X] T007 [US1] [P] Reemplazar el `content="…"` del `<meta property="og:description">` en el `<head>` de [index.html](../../index.html) con la cadena IDÉNTICA de [contracts/copy-contract.md](contracts/copy-contract.md) §4 (cumple invariante I-4 en data-model)
- [X] T008 [US1] [P] Verificar que el `<h1 id="hero-heading" class="hero-name">` de [index.html](../../index.html) sigue siendo exactamente `Victor Josue Ardón Rojas<span class="accent">.</span>` (FR-001, FR-005). Si por accidente quedó alterado en T004, restaurar
- [X] T009 [US1] Si [index.html](../../index.html) contiene un bloque `<script type="application/ld+json">` con campo `description` o `Person.description` (R-010), alinear ese campo con el texto de la `MetaDescription`. Comando de detección: `grep -n 'application/ld+json' index.html` — si retorna 0 hits, marcar esta tarea como N/A en el commit message; si retorna ≥1 hit, leer el bloque y actualizar campos `description`/`name` para alinearlos con la voz nueva sin alterar `@type` ni `@context`

### Validación local de US1

- [X] T010 [US1] Verificar codificación y caracteres invisibles en [index.html](../../index.html): ejecutar `LC_ALL=C grep -PnH '[\x{200B}\x{200C}\x{FEFF}]' index.html` — debe retornar 0 líneas (cumple I-5). Verificar que las tildes (`á é í ó ú ñ`) se renderizan como Unicode directo (no como `&oacute;` etc.) con `grep -nE '&[a-z]+acute;|&ntilde;' index.html` → 0 hits (cumple I-6)
- [X] T011 [US1] [P] Validar HTML: `npx html-validate index.html blog/index.html talks/index.html 404.html` — debe retornar exit 0, 0 errors, 0 warnings (FR-009, SC-006)
- [X] T012 [US1] Validar accesibilidad: en una terminal `npx --yes serve -l 8080 .`; en otra `node tests/a11y.js` — debe imprimir `✓ all N URLs pass WCAG 2.1 AA` con N ≥ 4 incluyendo `http://localhost:8080/` (FR-009, SC-005)
- [X] T013 [US1] Smoke visual mobile: con el server corriendo, abrir DevTools del navegador en modo responsive 360 × 640 px y 320 × 568 px sobre `http://localhost:8080/` — verificar que (a) no hay overflow horizontal en el hero, (b) ninguna palabra se trunca a la mitad, (c) el botón primario "Techno Week 8.0" está visible above-the-fold (FR-008, SC-007). Anotar resultado en el commit body
- [X] T014 [US1] Validar conteo de palabras del HeroBio: extraer el texto interior del `<p class="hero-desc">` y contar palabras. Comando: `node -e "const fs=require('fs');const m=fs.readFileSync('index.html','utf8').match(/<p class=\"hero-desc\">([^<]+)<\/p>/);if(!m){process.exit(2)}const w=m[1].trim().split(/\s+/).filter(Boolean).length;console.log('words:',w);process.exit(w<40||w>90?1:0)"` — debe imprimir un valor entre 40 y 90 (FR-003, SC-002) y exit 0

---

**Checkpoint US1**: tras completar T004–T014, US1 es entregable independientemente. Las tareas siguientes (US2/US3) son acumulativas pero no rompen US1 si se difieren.

---

## Phase 4 — User Story 2: Auditoría de placeholders sin resolver (P2)

**Story Goal**: cero ocurrencias visibles de `[Tu Nombre]`, `TODO`, `FIXME`, `XXX` en archivos servidos del sitio público; gate mecánico que mantiene esa garantía perpetua en CI.

**Independent Test**: ejecutar `bash tests/no-placeholders.sh` localmente debe retornar exit 0 con mensaje `OK: 0 placeholders found across N served files (...)`. El nuevo job en CI (`no-placeholders`) debe pasar al hacer push.

### Implementación

- [X] T015 [US2] [P] Crear el archivo [tests/no-placeholders.sh](../../tests/no-placeholders.sh) con la implementación exacta documentada en [contracts/no-placeholders-gate.md](contracts/no-placeholders-gate.md) §9 ("Implementación literal" del quickstart §B.1). Whitelist de archivos: `index.html`, `404.html`, `blog/index.html`, `talks/index.html`, `sitemap.xml`, `robots.txt`, `public/favicon/site.webmanifest`, `interviews/index.html`, `interviews/*.html` (los inexistentes se omiten). Patrones combinados: `\[Tu Nombre\]|\bTODO\b|\bFIXME\b|\bXXX\b`. Usa `grep -nHE`. Sin dependencias adicionales (solo bash + grep).
- [X] T016 [US2] Marcar el script como ejecutable: `chmod +x tests/no-placeholders.sh`
- [X] T017 [US2] Auditoría preventiva: ejecutar `bash tests/no-placeholders.sh` y verificar exit 0. Si hay hits inesperados, decidir caso por caso (corregir el archivo o documentar excepción en el contrato). Si los hits son legítimos en archivos servidos, ajustar el copy de esos archivos antes de continuar — la spec exige cero hits (SC-001, FR-006)
- [X] T018 [US2] [P] En [.github/workflows/ci.yml](../../.github/workflows/ci.yml), añadir un nuevo job al final del archivo (al mismo nivel que los `interviews-*`):
  ```yaml
  no-placeholders:
    name: No placeholders gate (spec 004)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run no-placeholders gate
        run: bash tests/no-placeholders.sh
  ```
  Verificar que la indentación coincide con la de los demás jobs (2 espacios bajo `jobs:`)
- [X] T019 [US2] Test del modo rojo del gate: añadir temporalmente `<!-- TODO probar gate -->` al final de [404.html](../../404.html); ejecutar `bash tests/no-placeholders.sh` — debe imprimir el hit y exit 1; revertir con `git checkout 404.html` y volver a ejecutar el gate — debe retornar exit 0. NO commitear el TODO temporal

### Validación local de US2

- [X] T020 [US2] [P] Ejecutar el conjunto completo de gates locales para asegurar no-regresión: `bash tests/no-placeholders.sh && bash tests/forbidden-urls.sh && npx html-validate index.html blog/index.html talks/index.html 404.html` — todos exit 0

---

**Checkpoint US2**: con T015–T020 completados, el repositorio tiene una salvaguarda mecánica permanente contra placeholders huérfanos. US2 es entregable independientemente.

---

## Phase 5 — User Story 3: Coherencia tonal en micro-copies (P3)

**Story Goal**: ningún disonance brusco entre el hero/about cálidos y otras micro-copies del sitio (404, footer, CTAs).

**Independent Test**: lectura lineal del sitio (hero → about → talk → blog → footer + 404). Subjetivamente: la voz se siente consistente.

### Implementación

- [X] T021 [US3] Revisar el copy de [404.html](../../404.html). Si el mensaje principal es genérico tipo "Página no encontrada" / "404 — Not Found" / "El recurso no existe", reescribirlo a un mensaje en primera persona cálida coherente con el hero — ej. `> Esa página se nos perdió. Si era importante, escribime y la reviso.` Si la copia actual ya es coherente (en primera persona, tono cálido), dejar intacto y anotarlo en el commit
- [X] T022 [US3] [P] Revisar el `<footer>` de [index.html](../../index.html), [talks/index.html](../../talks/index.html), [blog/index.html](../../blog/index.html), y [interviews/](../../interviews/) (header replicado en `scripts/build-interviews.js` `siteFooter`). Si contiene texto despersonalizado o frases corporativas (ej. "Profesional con X años…", "Todos los derechos reservados © Profesional…"), ajustar a una sola línea coherente con la voz del hero. Cambios mínimos; preservar el copyright legal
- [X] T023 [US3] Revisar los CTAs y micro-labels visibles en [index.html](../../index.html) (`hero-tag`, `section-label`, `blog-coming` copy). Verificar que no hay imperativos agresivos ("¡HAZ CLIC!"); si hay alguno, suavizar manteniendo la identidad terminal/code-first

### Validación local de US3

- [X] T024 [US3] Re-ejecutar gates tras cualquier ajuste en US3: `bash tests/no-placeholders.sh && npx html-validate index.html blog/index.html talks/index.html 404.html` — todos exit 0
- [X] T025 [US3] [P] Si [404.html](../../404.html) o cualquier otro archivo HTML cambió, re-ejecutar `node tests/a11y.js` con server local — verificar 0 violaciones (FR-009)
- [X] T026 [US3] Lectura lineal final: cargar `http://localhost:8080/` y recorrer hero → about → talk → blog → footer; navegar a `/404` (URL inexistente); navegar a `/interviews/`. Confirmar subjetivamente que la voz se siente consistente. Si surge un disonance evidente, corregir o documentar como out-of-scope para spec posterior

---

## Phase 6 — Polish & Cross-Cutting

- [X] T027 [P] Ejecutar runbook B (validación final pre-merge) de [quickstart.md](quickstart.md): todos los gates locales en exit 0, server + a11y verde, smoke visual desktop + mobile sin regresiones
- [X] T028 [P] Verificar que el marker `<!-- SPECKIT START/END -->` en [.github/copilot-instructions.md](../../.github/copilot-instructions.md) apunta a `specs/004-personal-bio-rewrite/plan.md` (ya actualizado en `/speckit.plan`; reverificar antes de PR)
- [X] T029 Marcar como completados todos los AC de [spec.md](spec.md) §7 (`AC-1` a `AC-5`) basado en evidencia recolectada (T011, T013, T017, T020, T026). Documentar en el commit body o en un comentario del PR
- [X] T030 Crear PR con descripción que incluya: (a) Spec ID que cumple (`004-personal-bio-rewrite`), (b) sección de la constitución relevante (II identidad visual preservada, VI accesibilidad, VII performance, IX gates), (c) checklist de gates aplicables (no-placeholders, html-validate, a11y, html-validate de interviews si build corre)

---

## Dependencias

```
T001 ─┬─ T002 [P] ──┐
      └─ T003 [P] ──┤
                    ▼
              T004 (US1) ──► T005 (US1) ──► T006/T007/T008 [P, US1]
                                              │
                                              ▼
                                            T009 (US1) ──► T010 (US1)
                                                              │
                                                              ▼
                                            T011/T012/T013/T014 [P after T010, US1]
                                                              │
                                                              ▼ (US1 entregable)
              T015 (US2) ──► T016 (US2) ──► T017 (US2) ──► T018 [P, US2]
                                                              │
                                                              ▼
                                                            T019 (US2) ──► T020 [P, US2]
                                                                              │
                                                                              ▼ (US2 entregable)
              T021 (US3) ──► T022/T023 [P, US3] ──► T024 (US3) ──► T025 [P, US3] ──► T026 (US3)
                                                                                          │
                                                                                          ▼ (US3 entregable)
              T027 [P] ──┬─ T028 [P] ──┬─ T029 ──► T030 (PR)
                         └────────────┘
```

**Reglas de paralelización**:
- T002 y T003 son [P] en Setup (lectura de archivos distintos).
- T006/T007/T008 son [P] dentro de US1 (líneas distintas del mismo archivo, edits acotados, sin solapamiento).
- T011/T012/T013/T014 son [P] después de T010 (lecturas independientes).
- T018 puede ejecutarse en paralelo con T015–T017 si dos personas trabajan, porque toca un archivo distinto (`ci.yml`).
- T020, T025, T027, T028 son [P] dentro de sus fases (lecturas/comandos independientes).

---

## MVP scope

**MVP = US1 (T001–T014)**: el cambio editorial en `index.html` cumple el objetivo principal de la spec (reescribir la bio). El gate (US2) y la coherencia de micro-copies (US3) son mejoras acumulativas que pueden mergearse en el mismo PR o en uno posterior si aparecen blockers.

Si el tiempo es la única variable: ejecutar T001–T014 y abrir PR. T015–T030 entran en el mismo PR si no hay fricción; en otro PR si la revisión del primero ya está activa.

---

## Resumen

- **Total de tasks**: 30
- **Por user story**: US1 = 11 (T004–T014), US2 = 6 (T015–T020), US3 = 6 (T021–T026), Setup = 3 (T001–T003), Polish = 4 (T027–T030)
- **Tasks paralelizables `[P]`**: 11 (T002, T003, T006, T007, T008, T011, T018, T020, T022, T023, T025, T027, T028)
- **Independent test criteria por story**: documentado bajo cada Phase 3/4/5
- **Sugerencia de MVP**: completar Phase 3 (US1) y abrir PR; las demás fases pueden añadirse incrementalmente
- **Validación de formato**: cada task respeta `- [ ] T### [P?] [Story?] Description with file path` con checkbox, ID secuencial, story label cuando aplica, y rutas de archivo absolutas o relativas explícitas en la descripción
