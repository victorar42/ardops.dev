# Tasks: Syntax highlighting build-time (Shiki)

**Feature**: 016-syntax-highlighting | **Branch**: `016-syntax-highlighting`
**Input docs**: spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md

User Stories (de [spec.md](spec.md)):
- **US1 (P1)** — Lector ve código coloreado.
- **US2 (P1)** — Autor publica código sin fricción.
- **US3 (P2)** — Posts sin código no pagan el costo.
- **US4 (P1)** — Seguridad: CSP intacta.

Las tareas marcadas `[P]` pueden correrse en paralelo (archivos
independientes, sin dependencias pendientes).

---

## Phase 1 — Setup

- [X] T001 Agregar `shiki ^3.x` a `devDependencies` en [package.json](package.json) y correr `npm install` para actualizar `package-lock.json`. Verificar con `node -e "console.log(require('shiki/package.json').version)"`.
- [X] T002 Crear directorio [content/blog/_fixtures/](content/blog/_fixtures/) (placeholder para el fixture multi-lang del post US2).

## Phase 2 — Foundational (bloquea US1..US4)

- [X] T003 [P] Crear módulo [scripts/lib/shiki-highlight.js](scripts/lib/shiki-highlight.js) con la API `highlight(html, opts)` exportada y la constante `LANGUAGE_ALLOWLIST` (21 strings) + `ALIAS_MAP` según [contracts/shiki-integration.md](specs/016-syntax-highlighting/contracts/shiki-integration.md) y [contracts/language-allowlist.md](specs/016-syntax-highlighting/contracts/language-allowlist.md). Implementación con `jsdom` para parsear, Shiki para tokenizar, regex final para garantizar cero `style=`.
- [X] T004 [P] Crear generador [scripts/build-syntax-css.js](scripts/build-syntax-css.js) que: precarga tema `github-dark-default`, emite `assets/css/syntax.css` con header obligatorio + 16 clases `.tok-*` + reglas `pre.shiki`/`pre.shiki code`/`pre.shiki .line` según [contracts/syntax-css-budget.md](specs/016-syntax-highlighting/contracts/syntax-css-budget.md). Soporta `--check` (exit ≠ 0 si el archivo en disco difiere de la regeneración).
- [X] T005 Ejecutar `node scripts/build-syntax-css.js` para crear [assets/css/syntax.css](assets/css/syntax.css) y commitearlo. Validar manualmente que `gzip -c -9 assets/css/syntax.css | wc -c` ≤ 5120.

## Phase 3 — User Story 1 (P1): Lector ve código coloreado

**Goal**: posts con bloques `bash`/`typescript`/`yaml` muestran tokens coloreados.
**Independent test**: abrir un post fixture con bloque ```` ```bash ```` ` en navegador → ver colores; DevTools/Network → 0 JS de highlighting descargado.

- [X] T006 [US1] Modificar [scripts/build-blog.js](scripts/build-blog.js) para importar `require('./lib/shiki-highlight')` e insertar el paso `await highlight(rawHtml)` **entre** `marked.parse()` y `sanitizeHtml()`. Conservar el orden exacto del contrato (R-08).
- [X] T007 [US1] En [scripts/build-blog.js](scripts/build-blog.js), inyectar condicionalmente `<link rel="stylesheet" href="/assets/css/syntax.css">` en el `<head>` del post **solo si** `tokenizedBlockCount > 0` (R-06).
- [X] T008 [US1] En [scripts/build-blog.js](scripts/build-blog.js), loguear `[blog] → N code block(s) highlighted (...)` y warnings non-fatal para lenguajes fuera de allowlist (`[blog] ⚠ unknown language: X — fallback`).
- [X] T009 [US1] Verificar que las reglas de `pre.shiki`/`pre.shiki code` en [assets/css/syntax.css](assets/css/syntax.css) coexisten con las reglas `pre`/`pre code` existentes en [assets/css/base.css](assets/css/base.css) (mayor especificidad sobrescribe fondo/padding) — sin editar `base.css`.

## Phase 4 — User Story 2 (P1): Autor publica código sin fricción

**Goal**: autor agrega bloques de código sin configuración por post; build los procesa.
**Independent test**: agregar post fixture con ≥ 3 lenguajes → `npm run build:blog` → ver HTML emitido con `<span class="tok-...">`.

- [X] T010 [US2] Crear [content/blog/_fixtures/syntax-highlighting-demo.md](content/blog/_fixtures/syntax-highlighting-demo.md) con frontmatter (`draft: true` para excluirlo del índice) y **21 bloques de código** (uno por cada lenguaje de la allowlist) + 1 bloque con lenguaje fuera de allowlist (e.g. `cobol`) + 1 bloque sin lenguaje + 1 inline `` `code` ``.
- [X] T011 [US2] Asegurar en [scripts/build-blog.js](scripts/build-blog.js) que los fixtures bajo `content/blog/_fixtures/` son procesados por el builder (para gates) pero **excluidos** del índice del blog (`blog/index.html`) y del sitemap. Filtrar por path o por `draft: true` del frontmatter.
- [X] T012 [US2] Crear gate [tests/build-blog-check.sh](tests/build-blog-check.sh): bash POSIX `set -euo pipefail`; ejecuta `node scripts/build-blog.js --check`; espera exit 0 sin drift. Reporta `path:line:reason` para cualquier archivo con drift y `✓`/`✗` summary. Hacer ejecutable.
- [X] T013 [US2] Verificar manualmente: `node scripts/build-blog.js` con fixture → `grep -c "tok-keyword" blog/_fixtures/syntax-highlighting-demo.html` ≥ 21 (al menos un keyword por lenguaje); `grep "unknown language: cobol" build.log` presente.

## Phase 5 — User Story 3 (P2): Posts sin código no pagan el costo

**Goal**: posts narrativos no cargan `syntax.css` y mantienen Lighthouse ≥ 95.
**Independent test**: post sin bloques → `grep "syntax.css" blog/<slug>.html` → 0 matches.

- [X] T014 [P] [US3] Crear gate [tests/syntax-css-size.sh](tests/syntax-css-size.sh): bash POSIX; calcula `gzip -c -9 assets/css/syntax.css | wc -c`; falla si > 5120; reporta tamaño actual y delta vs budget. Hacer ejecutable.
- [X] T015 [P] [US3] Crear gate [tests/syntax-css-conditional.sh](tests/syntax-css-conditional.sh): bash POSIX; para cada `blog/*.html` (excluyendo `index.html`), si el HTML no contiene `<pre class="shiki"`, entonces NO debe contener `syntax.css`; si contiene `<pre class="shiki"`, entonces DEBE contener `<link rel="stylesheet" href="/assets/css/syntax.css">`. Hacer ejecutable.
- [X] T016 [US3] Confirmar que `tests/byte-budgets.sh` cubre o ignora correctamente `assets/css/syntax.css`. Si está cubierto, asegurar que su delta no rompe el budget global; si lo ignora, agregar explícitamente el límite ≤ 5 KB gzip en el script (referenciar [tests/byte-budgets.sh](tests/byte-budgets.sh)). Documentar en el comentario superior del archivo modificado, si aplica.

## Phase 6 — User Story 4 (P1): Seguridad — CSP intacta

**Goal**: cero `style="..."` inline; CSP `style-src 'self'` sin relajaciones; DOMPurify intacto.
**Independent test**: `grep -rE 'style="' blog/` → 0; `bash tests/csp-no-unsafe-inline.sh` exit 0.

- [X] T017 [US4] En [scripts/lib/shiki-highlight.js](scripts/lib/shiki-highlight.js), implementar el transform que reemplaza cualquier `style="color: var(--shiki-X)"` (y formas equivalentes producidas por Shiki cssVariables) por `class="tok-X"`. Antes de retornar, ejecutar assertion `if (/\sstyle=/i.test(out)) throw new Error('shiki-highlight: residual inline style')`.
- [X] T018 [P] [US4] Crear gate [tests/no-inline-styles-blog.sh](tests/no-inline-styles-blog.sh): bash POSIX; recorre `blog/**/*.html`; falla si encuentra `\sstyle="` en cualquier archivo; reporta `path:line:match`. Hacer ejecutable.
- [X] T019 [P] [US4] Verificar que `FORBID_ATTR` en [scripts/build-blog.js](scripts/build-blog.js) sigue incluyendo `'style'` (no editar; solo confirmar via grep). Agregar comentario inline si no existe: `// CSP I3: 'style' must remain in FORBID_ATTR (see specs/016/contracts/csp-invariants.md)`.
- [X] T020 [US4] Confirmar que `tests/csp-no-unsafe-inline.sh` cubre los archivos de `blog/` emitidos en esta feature (incluyendo fixture). Si no, ampliar su glob. Referenciar [tests/csp-no-unsafe-inline.sh](tests/csp-no-unsafe-inline.sh).
- [X] T021 [US4] Smoke test manual: en [content/blog/_fixtures/syntax-highlighting-demo.md](content/blog/_fixtures/syntax-highlighting-demo.md) agregar un bloque con un payload XSS clásico (`<script>alert(1)</script>` dentro de un bloque ```` ```html ```` `); regenerar; verificar que sale escapado, sin ejecutarse, dentro de la tokenización.

## Phase 7 — Polish & cross-cutting

- [X] T022 [P] Agregar npm script `"build:syntax-css": "node scripts/build-syntax-css.js"` y `"check:syntax-css": "node scripts/build-syntax-css.js --check"` en [package.json](package.json). Documentar en [README.md](README.md) si el bloque "Build commands" existe; si no, no crear sección nueva.
- [X] T023 [P] Actualizar [docs/06-performance-spec.md](docs/06-performance-spec.md) con una sub-sección "Syntax highlighting" referenciando ≤ 5 KB gzip + carga condicional, vinculando a [specs/016-syntax-highlighting/spec.md](specs/016-syntax-highlighting/spec.md).
- [X] T024 [P] Actualizar [docs/05-security-spec.md](docs/05-security-spec.md) con párrafo "Build-time syntax highlighting" referenciando la defensa-en-profundidad de tres capas ([contracts/csp-invariants.md](specs/016-syntax-highlighting/contracts/csp-invariants.md)).
- [X] T025 Hacer ejecutables todos los gates nuevos: `chmod +x tests/syntax-css-size.sh tests/syntax-css-conditional.sh tests/no-inline-styles-blog.sh tests/build-blog-check.sh`.
- [X] T026 Correr suite local completa (`npm run gates:local` o el alias equivalente del repo) + los nuevos gates: `bash tests/syntax-css-size.sh && bash tests/syntax-css-conditional.sh && bash tests/no-inline-styles-blog.sh && bash tests/build-blog-check.sh && bash tests/csp-no-unsafe-inline.sh && bash tests/byte-budgets.sh`. Todos deben terminar exit 0.
- [X] T027 Verificar AC-01..AC-06 del backlog 10 usando la checklist de [quickstart.md](specs/016-syntax-highlighting/quickstart.md) sección "Como auditor".
- [X] T028 Verificar reproducibilidad (SC-08): correr `node scripts/build-blog.js` dos veces consecutivas, comparar `md5 blog/_fixtures/syntax-highlighting-demo.html` entre runs; deben ser idénticos. Mismo para `md5 assets/css/syntax.css` tras `node scripts/build-syntax-css.js` repetido.
- [X] T029 Marcar el backlog: editar [backlog/10-syntax-highlighting-shiki.md](backlog/10-syntax-highlighting-shiki.md) cambiando `Estado: backlog` → `Estado: implementado · spec 016`.

---

## Dependencies

```text
Setup (T001-T002)
    │
    ▼
Foundational (T003 [P], T004 [P])
    │
    ▼
T005 (genera CSS, requiere T004)
    │
    ├─► US1 (T006 → T007 → T008 → T009)
    ├─► US2 (T010 → T011 → T012 → T013)   (requiere US1 base)
    ├─► US3 (T014 [P], T015 [P], T016)    (paralelizable entre sí; requiere US1+US2)
    ├─► US4 (T017 → T018 [P], T019 [P], T020, T021)
    │
    ▼
Polish (T022 [P], T023 [P], T024 [P], T025 → T026 → T027 → T028 → T029)
```

**Orden de stories**: US1 primero (MVP demostrable). US2 y US4 se
benefician de tener US1 lista para usar el fixture. US3 es
verificación posterior. US4 cierra las invariantes de seguridad.

## Parallel execution examples

- Foundational en paralelo: T003 (lib) + T004 (generator CSS).
- US3 en paralelo: T014 + T015 (gates independientes).
- US4 en paralelo: T018 + T019 (un gate + un comentario en otro archivo).
- Polish en paralelo: T022 + T023 + T024 (tres archivos distintos).

## MVP scope

MVP entregable = **US1 sola** (Phases 1, 2, 3). El lector ya ve los
colores. US2 (fixture multi-lang), US3 (gate de carga condicional) y
US4 (gates de CSP) son refuerzo de calidad y seguridad para el merge.

## Implementation strategy

1. Setup + Foundational primero (necesario para todo).
2. US1 → demostrable visualmente.
3. US2 → consolida el flujo de autor.
4. US4 → bloquea el merge si CSP se rompe.
5. US3 → asegura no-regresión de performance.
6. Polish → docs y reproducibilidad.

## Format validation

- [x] Todas las tareas inician con `- [ ]` + ID Txxx.
- [x] `[P]` solo en tareas paralelizables (archivos distintos, sin deps pendientes).
- [x] `[US1]`/`[US2]`/`[US3]`/`[US4]` presentes en fases 3-6; ausentes en Setup/Foundational/Polish.
- [x] Cada tarea cita ≥ 1 ruta de archivo concreta.
- [x] 29 tareas, dependency graph definido, MVP claramente acotado.
