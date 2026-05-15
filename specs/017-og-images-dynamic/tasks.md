# Tasks: OG images dinámicas por post

**Input**: Design documents from `/specs/017-og-images-dynamic/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: NO TDD. Gates bash POSIX (mismo patrón del repo). Los gates se escriben junto a la implementación, no antes.

**Organization**: tareas agrupadas por user story (US1, US2, US3 = P1; US4 = P2). MVP = US1 + US2 + US3 (las tres P1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivos distintos, sin dependencias incompletas)
- **[Story]**: US1 / US2 / US3 / US4 — solo para fases de user story

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: instalar dependencias y preparar el árbol del feature.

- [X] T001 Agregar `sharp ^0.33.x` a `devDependencies` de `package.json` y correr `npm install` para registrarlo en `package-lock.json`.
- [X] T002 Crear directorios `scripts/og/` y `public/og/blog/` con un `.gitkeep` en `public/og/blog/.gitkeep` para forzar el versionado del directorio vacío.
- [X] T003 [P] Agregar script npm `build:og` en `package.json` que ejecute `node scripts/build-og.js`, y enlazarlo dentro de `npm run build` ANTES de `build:blog` y DESPUÉS de `build:syntax-css`.

**Checkpoint**: `npm run build:og` existe (aunque falle por ahora). `package-lock.json` registra `sharp`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: piezas compartidas que todas las user stories necesitan. SIN esto ningún US puede arrancar.

**⚠️ CRITICAL**: bloquea Phase 3+.

- [X] T004 Crear la plantilla SVG en `scripts/og/template.svg` con `viewBox="0 0 1200 630"`, gradient `--bg-primary` → `--bg-secondary`, accent rail derecho, placeholders `{{TITLE_LINES}}` `{{TAGS_SVG}}` `{{LOGO_TEXT}}`, y `<style>` con `@font-face` para Outfit 600/700 y JetBrains Mono 700. Seguir `specs/017-og-images-dynamic/contracts/og-template.md` al pie de la letra (coordenadas, tamaños, colores tokens.css).
- [X] T005 [P] Crear `scripts/og/render.js` con funciones puras: `escapeXml(s)`, `wrapTitle(title, maxCharsPerLine=28, maxLines=2)`, `renderTitleLines(title)`, `renderTagsSvg(tags)`, `embedFontsBase64()` que lee `assets/fonts/{outfit-600,outfit-700,jetbrains-mono-700}.woff2` y devuelve la cadena `<style>` con `@font-face` data-URI. Exportar todo por CommonJS.
- [X] T006 [P] Crear `scripts/og/manifest.js` con `OG_TEMPLATE_VERSION = 'v1'`, `computeHash({title, tags, templateVersion})` (sha256, payload `templateVersion\ntitle\nsortedTags.join(',')\n`), `loadManifest()`, `writeManifest(m)` (orden alfabético de `entries`, `JSON.stringify(_,null,2)+'\n'`, claves en orden fijo `version,templateVersion,entries` y `hash,title,tags`). Seguir `contracts/og-manifest.md`.
- [X] T007 Crear `scripts/build-og.js` (esqueleto): CLI parser (`--check`, `--regenerate`), carga de posts publicados reutilizando el mismo lector que `scripts/build-blog.js` (extraer `loadPublishedPosts()` a `scripts/lib/posts.js` si todavía no está; si está inline, refactorizarlo a un módulo compartido). Sin lógica de render aún — solo lista los slugs publicados y los imprime.

**Checkpoint**: la plantilla SVG existe; los helpers de render+manifest están escritos como módulos puros; `build-og.js` corre y lista posts publicados (1 hoy).

---

## Phase 3: User Story 1 — Lector ve OG por post (Priority: P1) 🎯 MVP

**Goal**: cada post publicado tiene su PNG 1200×630 en `public/og/blog/<slug>.png`.

**Independent Test**: `ls public/og/blog/*.png | wc -l` == cantidad de posts publicados; `file public/og/blog/<slug>.png` reporta `1200 x 630`; `wc -c` < 100 000.

### Implementation for User Story 1

- [X] T008 [US1] Implementar en `scripts/build-og.js` la función `buildJob(post)`: arma el SVG con `template.svg` + placeholders sustituidos vía `scripts/og/render.js`, renderiza con `sharp(svgBuffer).png({ compressionLevel: 9, adaptiveFiltering: false, palette: false, effort: 10 })`. NO `.withMetadata()`. Retorna `Buffer`.
- [X] T009 [US1] Implementar `writePngIfNeeded(slug, buffer)` en `scripts/build-og.js`: escribe `public/og/blog/<slug>.png` y verifica tamaño ≤ 100 000 B. Si excede, `process.exit(1)` con mensaje `[og-build] ✗ <slug>: PNG <bytes> B exceeds budget 100 000 B`.
- [X] T010 [US1] Wire-up del modo default en `scripts/build-og.js`: para cada post publicado, llamar `buildJob` → `writePngIfNeeded`. Loguear `[og-build] <slug>: generating (new)`.
- [X] T011 [US1] Generar el PNG del único post real (`pipeline-seguridad-spec-driven`) corriendo `node scripts/build-og.js`. Verificar manualmente con `file` que mide 1200×630 y con `wc -c` que pesa < 100 KB. Commitear `public/og/blog/pipeline-seguridad-spec-driven.png`.

**Checkpoint**: el PNG del post existente vive en `public/og/blog/`. Visual review manual: el título y los tags aparecen legibles, el branding es consistente con `.reference/v1-design/index.html`.

---

## Phase 4: User Story 2 — Autor publica sin pasos manuales (Priority: P1)

**Goal**: el flujo del autor es `escribir MD → npm run build → commit`. Cero pasos manuales para OG.

**Independent Test**: agregar un post fixture publicado con título largo + 3 tags, correr `npm run build`, comprobar que el PNG aparece automáticamente y que el `<head>` de su HTML referencia `/public/og/blog/<slug>.png`.

### Implementation for User Story 2

- [X] T012 [US2] En `scripts/build-og.js`, implementar la lógica de manifest e idempotencia: `loadManifest()` al inicio; por cada post calcular hash; si `manifest.entries[slug]?.hash === currentHash` y el PNG existe en disco → `cached` (skip). Caso contrario → regenerar. Loguear `[og-build] <slug>: cached (hash match)` / `regenerating (title changed)` / `generating (new)`.
- [X] T013 [US2] Implementar orphan cleanup en `scripts/build-og.js`: al final, listar archivos `public/og/blog/*.png` y entradas del manifest; eliminar los que no corresponden a posts publicados. Loguear cada huérfano removido.
- [X] T014 [US2] Implementar persistencia del manifest: tras todas las generaciones, llamar `writeManifest(updated)` con `entries` ordenadas alfabéticamente. Verificar reproducibilidad: dos corridas seguidas no cambian el archivo.
- [X] T015 [US2] Implementar `--regenerate` flag: ignora cache, fuerza regeneración de todos los PNGs, reescribe manifest. Útil cuando bumpea `OG_TEMPLATE_VERSION`.
- [X] T016 [US2] Modificar `scripts/build-blog.js`: cargar manifest con `loadOgManifest()`. En `renderPostPage`, cambiar el bloque `<meta property="og:image">` y `<meta name="twitter:image">` para usar `https://ardops.dev/public/og/blog/${post.slug}.png` cuando hay entry en manifest; fallback a `og-default.png` + `console.warn` cuando no. NO tocar `renderBlogIndex` (out of scope). Seguir `contracts/og-meta-injection.md`.
- [X] T017 [US2] Conectar el `npm run build` end-to-end: orden `build:layout → build:syntax-css → build:og → build:blog → build:interviews`. Verificar corriendo `npm run build` desde un clone limpio (`rm -rf blog/* public/og/blog/*.png public/og/blog/manifest.json && npm run build`) que regenera todo y el HTML del post lleva el OG por slug.

**Checkpoint**: `npm run build` desde cero produce PNGs, manifest, y HTMLs con meta tags por slug. Idempotente.

---

## Phase 5: User Story 3 — Drift detectado en CI (Priority: P1)

**Goal**: CI falla si el autor cambió título/tags y olvidó regenerar.

**Independent Test**: editar el `title` del post real sin regenerar, correr `bash tests/og-drift.sh` → exit 2 con reason `hash-mismatch`. Restaurar.

### Implementation for User Story 3

- [X] T018 [US3] Implementar `--check` en `scripts/build-og.js`: NO escribe nada. Para cada post calcula hash y compara contra manifest; reporta `missing-png`, `hash-mismatch`, `orphan-entry`, `orphan-png`, `new-post-no-entry`, `template-version-mismatch` por slug. Exit 2 si hay cualquier drift; exit 0 si limpio. Formato `[og-drift] <slug>: <reason> (...)`. Seguir `contracts/og-manifest.md`.
- [X] T019 [P] [US3] Crear `tests/og-drift.sh` (`set -euo pipefail`, `chmod +x`): wrapper que ejecuta `node scripts/build-og.js --check` desde `REPO_ROOT`. Summary `✓ OG manifest in sync` / `✗ OG drift detected (see above)`.
- [X] T020 [P] [US3] Crear `tests/og-images.sh` (`set -euo pipefail`): para cada post publicado en `content/blog/*.md` (excluyendo `_fixtures/`, `__fixtures__/`, `published: false`):
  1. Verifica que `public/og/blog/<slug>.png` existe.
  2. `file` reporta `1200 x 630, 8-bit`.
  3. `wc -c` ≤ 100 000.
  4. `blog/<slug>.html` contiene `og:image" content="https://ardops.dev/public/og/blog/<slug>.png"` y `twitter:image" content="https://ardops.dev/public/og/blog/<slug>.png"`.
  5. NINGÚN post HTML referencia `og-default.png` en `og:image` (fallback es bug en CI).
  Exit 0 si todo limpio. Formato `path:line:reason`.
- [X] T021 [US3] Ejecutar manualmente el escenario de drift: cambiar el `title` del post real → `bash tests/og-drift.sh` debe salir 2 → revertir → debe salir 0. Documentar el resultado en el commit.
- [X] T022 [US3] Agregar `tests/og-drift.sh` y `tests/og-images.sh` al runner local de gates (`tests/run-local.sh` u orquestador equivalente; revisar qué archivo agrupa las gates hoy y agregarlos ahí).

**Checkpoint**: ambos gates corren localmente y reportan exit 0 con el estado actual. Drift simulado falla correctamente.

---

## Phase 6: User Story 4 — Performance + budgets (Priority: P2)

**Goal**: el budget de bytes incluye OG y no se rompe.

**Independent Test**: `bash tests/byte-budgets.sh` exit 0 con OG dentro de límites; `find public/og/blog -name '*.png' -size +100k` vacío.

### Implementation for User Story 4

- [X] T023 [US4] Extender `tests/byte-budgets.sh` para reportar el tamaño máximo de `public/og/blog/*.png` con budget explícito `og-each ≤ 100000 B`. No solapar con el límite genérico `img-each ≤ 204 800 B` (mantenerlos ambos; el de OG es más estricto). Loguear `og-each max=<bytes> budget=100000`.
- [X] T024 [US4] Validar performance: correr Lighthouse local sobre el blog post existente (`npx lhci autorun --config tests/lighthouserc.json` o equivalente). Confirmar Performance ≥ 95 (sin regresión vs spec 016). Esto NO es un gate automatizado nuevo — es validación manual del baseline.

**Checkpoint**: budgets verdes. Performance baseline preservado.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T025 [P] Actualizar `docs/06-performance-spec.md` con la sección "OG images dinámicas" describiendo el budget de 100 KB por PNG y el flujo build-time.
- [X] T026 [P] Actualizar `docs/09-deployment-spec.md` con la nota de que `public/og/blog/*.png` y `manifest.json` son artefactos commiteados (no se generan en CI deploy).
- [X] T027 [P] Actualizar `README.md` (sección "Build", si existe) mencionando `npm run build:og` y `node scripts/build-og.js --check`.
- [X] T028 Marcar `backlog/11-og-images-dynamic.md` como `> **Estado**: implementado · spec 017` (mismo patrón que se usó al cerrar backlog 10).
- [X] T029 Correr la suite local completa de gates (`tests/*.sh`) y confirmar que TODAS pasan con exit 0 (incluyendo los gates nuevos `og-images.sh`, `og-drift.sh` y el `byte-budgets.sh` extendido). Documentar el resultado en el PR description.
- [X] T030 Validar reproducibilidad byte-a-byte siguiendo `quickstart.md` → sección "Reproducibilidad": `md5` de PNGs y manifest idénticos entre dos corridas consecutivas (con y sin `--regenerate`).
- [X] T031 Validación visual externa: tomar la URL del post real (en preview deploy o localmente vía `python3 -m http.server`) y pegarla en https://www.opengraph.xyz/ y LinkedIn Post Inspector. Confirmar que la imagen renderiza con título + tags correctos. Documentar screenshot en PR description.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sin dependencias.
- **Phase 2 (Foundational)**: depende de Phase 1 — BLOQUEA Phase 3+.
- **Phase 3 (US1)**: depende de Phase 2.
- **Phase 4 (US2)**: depende de Phase 3 (extiende `build-og.js` con manifest + idempotencia, y modifica `build-blog.js` que necesita el manifest ya generado).
- **Phase 5 (US3)**: depende de Phase 4 (necesita `--check` que requiere manifest ya implementado).
- **Phase 6 (US4)**: depende de Phase 5 (gates en su lugar).
- **Phase 7 (Polish)**: depende de Phase 6.

### Dentro de cada user story

- US1: T008 → T009 → T010 → T011 (secuencial, todas tocan `build-og.js`).
- US2: T012 → T013 → T014 → T015 → T016 → T017 (T016 toca `build-blog.js`, paralelizable contra T012-T015 si team grande, pero recomendado secuencial).
- US3: T018 (build-og.js) → T019 ‖ T020 (archivos distintos, [P]) → T021 → T022.
- US4: T023 → T024.
- Polish: T025 ‖ T026 ‖ T027 [P]; luego T028 → T029 → T030 → T031.

### Parallel Opportunities

- Phase 1: T003 [P] mientras T001/T002 corren.
- Phase 2: T005 [P] y T006 [P] pueden hacerse en paralelo (módulos distintos, sin dependencia mutua).
- Phase 5: T019 y T020 [P] (archivos distintos).
- Phase 7: T025/T026/T027 [P] (docs distintos).

---

## Implementation Strategy

### MVP First (P1 only)

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3).
2. Resultado MVP: post existente tiene OG por slug; flujo build automático; CI detecta drift.
3. Validar manualmente con OpenGraph inspector antes de deploy.

### Incremental Delivery

1. PR 1: Phase 1-3 (Setup + Foundational + US1) — PNGs generados, sin meta tags aún.
2. PR 2: Phase 4 (US2) — meta tags + idempotencia + orphan cleanup.
3. PR 3: Phase 5-6 (US3 + US4) — gates en CI.
4. PR 4: Phase 7 (Polish + docs + backlog close).

**Recomendado**: una sola PR completa (feature pequeña, 1 post real).

---

## Notes

- [P] = archivos distintos, sin dependencias.
- Cero cambios a CSP, runtime JS, o assets servidos al cliente — pure build-time.
- `sharp` SOLO en devDeps. Verificar `package.json` que NO termine en `dependencies`.
- `OG_TEMPLATE_VERSION = 'v1'` hoy. Cualquier cambio futuro al SVG bumpea la versión y fuerza regeneración global.
- Reproducibilidad byte-a-byte es invariante crítico (igual que spec 016 con `assets/css/syntax.css`).
- Commitear PNGs + manifest en el mismo commit que el cambio del post.
