# Tasks — Spec 014 Performance & a11y thresholds

**Feature**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Branch**: `014-perf-a11y-thresholds`

Convención: cada task es un checkbox con TaskID, marcador `[P]` si es
paralelizable (distinto archivo y sin dependencias activas), etiqueta de
user story `[USn]` cuando aplica, y ruta de archivo concreta.

---

## Phase 1 — Setup

- [X] T001 Verificar que el branch activo es `014-perf-a11y-thresholds` y que el árbol está limpio (`git status` sin pendientes en archivos fuera del feature dir).
- [X] T002 [P] Leer `specs/014-perf-a11y-thresholds/plan.md`, `research.md`, `data-model.md` y los 4 contratos antes de empezar; confirmar mentalmente Constitution Check 11/11.
- [X] T003 [P] Confirmar baseline actual de bytes corriendo manualmente: `for f in *.html blog/index.html now/index.html talks/index.html speaking/index.html interviews/index.html; do [ -f "$f" ] && printf "%6d  %s\n" "$(gzip -c -9 "$f" | wc -c | tr -d ' ')" "$f"; done` y verificar que ninguno supera 51200 B. Documentar resultado en notas locales si difiere de research.md R-2.

---

## Phase 2 — Foundational (bloquea todo lo demás)

- [X] T004 Crear directorio `tests/lib/` (mkdir -p) — albergará helpers Node compartidos por gates.
- [X] T005 Crear `tests/lib/parse-img.js` (CommonJS, usa `jsdom` ya en devDeps). Contrato: lee 1 archivo HTML como argumento, emite JSON `{ file, images: [{ index, src, alt, width, height, loading, decoding, fetchpriority, raw }] }` a stdout. `alt = null` si atributo ausente, `""` si presente vacío. Exit 0 siempre que parsee, exit 2 si error de I/O. ~40 LOC. Spec: `specs/014-perf-a11y-thresholds/contracts/img-attrs.md`.

---

## Phase 3 — User Story 1 (P1) — Lighthouse no degrada en silencio

**Goal**: thresholds Lighthouse 95/100/95/95 + CWV (LCP/TBT/CLS) aplicados en desktop+mobile, URLs completas según FR-02.

**Independent test**: `npx --yes @lhci/cli@latest autorun --config=tests/lighthouserc.json` y `--config=tests/lighthouserc.mobile.json` pasan verde con las 8 URLs.

- [X] T006 [US1] Resolver slug del último blog post: `node -e "const fs=require('fs');const h=fs.readFileSync('blog/index.html','utf8');const m=h.match(/href=\"\/blog\/([a-z0-9-]+)\.html/);console.log(m?m[1]:'')"`. Guardar el slug. Si vacío (no hay posts reales aún), saltar el cambio de URL para post-más-reciente y dejar comentario en ambos configs.
- [X] T007 [US1] Modificar `tests/lighthouserc.json` (desktop): agregar a `ci.collect.url` las entradas `"http://localhost/interviews/index.html"` y `"http://localhost/blog/<slug>.html"` (la última solo si T006 retornó slug). Mantener orden lógico (home → blog index → último post → interviews → talks → speaking → now → 404).
- [X] T008 [US1] Modificar `tests/lighthouserc.mobile.json`: idéntica lista de URLs que desktop (T007), y subir `categories:performance` de `0.9` a `0.95`. CWV mobile (LCP 3000 / TBT 300) permanecen.
- [X] T009 [US1] Verificar localmente que Lighthouse aún pasa: `npx --yes @lhci/cli@latest autorun --config=tests/lighthouserc.json` y el mobile equivalente. Si alguna URL falla, diagnosticar audit y NO bajar threshold; ajustar la página antes (out of scope si requiere cambios de contenido, abrir issue).

---

## Phase 4 — User Story 2 (P1) — Byte budgets

**Goal**: gate `tests/byte-budgets.sh` operativo, wired a npm + CI, sitio actual pasa.

**Independent test**: `bash tests/byte-budgets.sh` exit 0 sobre el repo actual; agregar dummy CSS 35 KB gzip y obtener exit 1.

- [X] T010 [US2] Crear `tests/byte-budgets.sh` (~80 LOC, bash POSIX, `set -euo pipefail`, `chmod +x`). Implementar 4 buckets según `contracts/byte-budgets.md`. Soportar env overrides `BB_HTML_MAX`, `BB_CSS_SUM_MAX`, `BB_JS_SUM_MAX`, `BB_IMG_MAX`. Output legible humano + margen positivo/negativo.
- [X] T011 [US2] Lista de HTML servidos para `html-each`: `*.html` en raíz + `blog/*.html` + `interviews/*.html` (excluir fixtures `valid-minimal.html` y `xss-attempt.html`) + `talks/*.html` + `speaking/*.html` + `now/*.html`. Implementar como find con prunes explícitos.
- [X] T012 [US2] Validar localmente sobre el repo actual: `bash tests/byte-budgets.sh` → exit 0 con margen positivo en los 4 buckets (verificar contra cifras de research.md R-2).
- [X] T013 [US2] Validar fallo: `BB_CSS_SUM_MAX=5000 bash tests/byte-budgets.sh` → exit 1 con mensaje "css-sum: 9909 B exceeds budget 5000 B by 4909 B". Restaurar.
- [X] T014 [US2] Agregar a `package.json` el script `"check:byte-budgets": "bash tests/byte-budgets.sh"` y encadenarlo dentro de `check:distribution` antes de `check:headshot` (orden: budgets antes de calidad de assets específica).

---

## Phase 5 — User Story 3 (P2) — Image attributes

**Goal**: gate `tests/img-attrs.sh` operativo, sitio actual pasa, ideal para detectar CLS y missing alt.

**Independent test**: gate exit 0 sobre repo; remover `width` de cualquier `<img>` → exit 1 con mensaje preciso.

- [X] T015 [US3] Crear `tests/img-attrs.sh` (~60 LOC, bash, `set -euo pipefail`, `chmod +x`). Listar HTML servidos (misma lógica que T011 pero también incluyendo posts y interviews emitidos post-build). Llamar `node tests/lib/parse-img.js <file>` por archivo. Usar `jq` si está; fallback awk.
- [X] T016 [US3] Implementar reglas según `contracts/img-attrs.md`: alt presente, width+height presentes, decoding=async, loading=lazy excepto primera imagen del documento (a menos que tenga fetchpriority=high).
- [X] T017 [US3] Inventariar las `<img>` actuales y verificar que cumplen. Probable necesidad: agregar `decoding="async"` a las imágenes existentes en `index.html` (headshot home) y `speaking/index.html` (headshot speaking). NO cambiar dimensiones ni paths. Si falta `loading="lazy"` en alguna imagen secundaria, agregar. Mantener identidad visual (constitución II).
- [X] T018 [US3] Validar `bash tests/img-attrs.sh` exit 0. Validar fallo: editar manualmente quitando `width` de la primera `<img>` de `index.html` → exit 1; restaurar.
- [X] T019 [US3] Agregar a `package.json` `"check:img-attrs": "bash tests/img-attrs.sh"` y encadenarlo en `check:distribution` después de `check:byte-budgets`.

---

## Phase 6 — User Story 4 (P3) — Fonts policy

**Goal**: gate `tests/no-third-party-fonts.sh` valida 4 chequeos, sitio actual pasa.

**Independent test**: gate exit 0; agregar `<link>` a fonts.googleapis.com → exit 1.

- [X] T020 [US4] Crear `tests/no-third-party-fonts.sh` (~80 LOC, bash POSIX, `set -euo pipefail`, `chmod +x`). Implementar los 4 chequeos de `contracts/no-third-party-fonts.md`: (1) grep HTML por googleapis|gstatic; (2) awk sobre `@font-face` para src externos; (3) find inventory de `assets/fonts/`; (4) awk verifica `font-display: swap` por bloque.
- [X] T021 [US4] Validar localmente exit 0 sobre repo actual: 0 hits en HTML, 5 `@font-face` blocks same-origin, 6 woff2 + LICENSE.md, 5/5 con font-display:swap.
- [X] T022 [US4] Validar fallos: (a) agregar `<link rel="preconnect" href="https://fonts.googleapis.com">` en `index.html` → exit 1; restaurar. (b) Comentar temporalmente `font-display: swap` de un `@font-face` → exit 1; restaurar.
- [X] T023 [US4] Agregar a `package.json` `"check:fonts": "bash tests/no-third-party-fonts.sh"` y encadenarlo en `check:distribution` después de `check:img-attrs`.

---

## Phase 7 — Polish & Cross-cutting

- [X] T024 [P] Modificar `.github/workflows/ci.yml`: agregar 3 jobs nuevos (`byte-budgets`, `img-attrs`, `fonts-policy`) siguiendo el patrón de `headshot-size` y `now-freshness`. `byte-budgets` y `fonts-policy` NO requieren `npm ci` (bash puro); `img-attrs` SÍ (jsdom). Ubicar después del job `headshot-size`.
- [X] T025 [P] Actualizar `docs/06-performance-spec.md`: nueva sección "## Thresholds & byte budgets (spec 014)" documentando las 4 categorías Lighthouse (95/100/95/95), CWV (LCP 2500/CLS 0.1/TBT 200 desktop; 3000/0.1/300 mobile), y los 4 budgets (HTML 50 KiB / CSS 30 KiB / JS 50 KiB gzip, IMG 200 KiB raw). Link a la spec.
- [X] T026 [P] Actualizar `docs/07-accessibility-spec.md`: nueva sección "## WCAG 2.1 AA enforcement (spec 014)" documentando ratios 4.5:1 texto normal, 3:1 texto grande, 3:1 UI components, y cómo axe-core + Lighthouse Accessibility=100 lo enforce. Link a la spec.
- [X] T027 Correr suite completa local en orden: `npm run check:distribution && npx --yes @lhci/cli@latest autorun --config=tests/lighthouserc.json && npx --yes @lhci/cli@latest autorun --config=tests/lighthouserc.mobile.json`. Todos verde. Documentar tiempo total: SC-008 exige < 30 s adicionales solo para los 3 gates nuevos (Lighthouse aparte).
- [X] T028 Verificar el último blog post slug en T006 sigue siendo válido; si publicaste un post entre T006 y T028, actualizar las 2 configs Lighthouse antes del merge.
- [X] T029 Cerrar [backlog/07-perf-a11y-thresholds.md](../../backlog/07-perf-a11y-thresholds.md): cambiar `> **Estado**: backlog · **Prioridad**: P3` → `> **Estado**: ✅ completado en spec [014-perf-a11y-thresholds](../specs/014-perf-a11y-thresholds/) · **Prioridad original**: P3`.
- [X] T030 Marcar todas las tasks `[X]` en este archivo. `sed -i '' 's/^- \[ \] T0/- [X] T0/g' specs/014-perf-a11y-thresholds/tasks.md && grep -c '^- \[X\] T' specs/014-perf-a11y-thresholds/tasks.md` → 30.

---

## Dependency graph

```
T001, T002, T003 (Setup, paralelo)
   ↓
T004, T005 (Foundational — bloquea US3)
   ↓
US1 (T006 → T007, T008 paralelos → T009)
US2 (T010 → T011 → T012, T013 → T014)        [paralelo a US1]
US3 (T015 → T016 → T017 → T018 → T019)        [requiere T005]
US4 (T020 → T021, T022 → T023)                [paralelo a US1/US2/US3]
   ↓
Polish: T024, T025, T026 paralelos → T027 → T028 → T029 → T030
```

**MVP scope**: US1 + US2 (Phase 3 + Phase 4) cubren los principios
constitucionales VI/VII más directamente. US3 y US4 son defensa en
profundidad.

## Parallel opportunities

- T002 / T003 lectura independiente.
- T007 / T008 son dos archivos distintos → `[P]` posible si se hace
  manualmente; cuidado con el slug compartido (T006 los precede).
- T024 / T025 / T026 tocan archivos distintos → paralelo seguro.
- Las 4 user stories son completamente independientes entre sí
  (gates separados, archivos separados); pueden ejecutarse en
  paralelo si T004+T005 ya están.

## Independent test criteria

| Story | Test independiente |
|---|---|
| US1 | `npx @lhci/cli autorun --config=tests/lighthouserc.json` (+ mobile) → exit 0, 8 URLs verdes |
| US2 | `bash tests/byte-budgets.sh` → exit 0 sobre repo; `BB_CSS_SUM_MAX=5000 bash tests/byte-budgets.sh` → exit 1 |
| US3 | `bash tests/img-attrs.sh` → exit 0 sobre repo; remover `width=` de cualquier `<img>` → exit 1 |
| US4 | `bash tests/no-third-party-fonts.sh` → exit 0 sobre repo; agregar `<link href="https://fonts.googleapis.com">` → exit 1 |

## Implementation strategy

1. **MVP primero (US1 + US2)** — endurece lighthouse thresholds + byte
   budgets. Es lo que más previene degradación silenciosa.
2. **US3 (img-attrs)** — defensa en profundidad para CLS; requiere
   tocar manualmente `<img>` actuales si les falta `decoding="async"`.
3. **US4 (fonts)** — última layer; gate trivial sobre código ya
   correcto.
4. **Polish & docs** — CI jobs + docs en paralelo; final suite verde.
