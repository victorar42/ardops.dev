# Backlog 07 — Performance & a11y thresholds (refinamiento del baseline)

> **Estado**: ✅ completado en spec [014-perf-a11y-thresholds](../specs/014-perf-a11y-thresholds/) · **Prioridad original**: P3
> **Esfuerzo estimado**: XS (~2 horas) · **ROI networking**: bajo (mantener estándar)

---

## Por qué

Ya tenés gates de Lighthouse, html-validate y axe-core funcionando. Esta
spec **no agrega features**, sino que **endurece thresholds y agrega budgets
de bytes** para evitar que el sitio se degrade silenciosamente con cada
nuevo post o página.

Es prevención, no curación.

## Objetivo

Formalizar los thresholds objetivos de performance y a11y en CI, agregar
budgets de tamaño total servido, y bloquear PRs que los excedan.

## Alcance funcional (FRs)

### Lighthouse thresholds

- **FR-01** — `tests/lighthouserc.json` y `lighthouserc.mobile.json` deben
  fallar el build si alguna URL baja de:
  - Performance ≥ 95
  - Accessibility = 100
  - Best Practices ≥ 95
  - SEO ≥ 95
- **FR-02** — Las URLs evaluadas incluyen: home, blog index, último post,
  interviews index, talks index, y cualquier nueva página agregada
  (uses, speaking, now).

### Core Web Vitals (Lighthouse synthetic)

- **FR-03** — Asserts en lighthouserc:
  - LCP ≤ 2500 ms
  - INP ≤ 200 ms (Lighthouse usa TBT como proxy; aceptar TBT ≤ 200 ms)
  - CLS ≤ 0.1

### Byte budgets

- **FR-04** — Gate `tests/byte-budgets.sh` que falla si:
  - Cualquier `*.html` servido > 50 KB gzip.
  - Total de `assets/css/*.css` > 30 KB gzip.
  - Total de `assets/js/*.js` > 50 KB gzip (incluyendo todos los módulos).
  - Cualquier imagen en `assets/img/` > 200 KB.
- **FR-05** — Reportar el delta vs baseline en cada PR (opcional, requiere
  acción de GH; puede ser un comentario manual al inicio).

### Imágenes responsive

- **FR-06** — Gate `tests/img-attrs.sh`: cualquier `<img>` en HTML servido
  debe tener:
  - `alt` (obligatorio, puede ser vacío para decorativas).
  - `width` y `height` explícitos (evita CLS).
  - `loading="lazy"` excepto para LCP (primer hero).
  - `decoding="async"`.

### Fonts

- **FR-07** — Verificar que no hay `<link href="https://fonts.googleapis.com">`
  ni `<link href="https://fonts.gstatic.com">` (gate `tests/no-third-party-fonts.sh`).
- **FR-08** — Confirmar que `assets/fonts/` solo contiene formatos modernos
  (woff2). Eliminar woff/ttf si quedaran.
- **FR-09** — `font-display: swap` declarado en cada `@font-face`.

### Color contrast

- **FR-10** — Documentar en `docs/07-accessibility-spec.md` que se exige
  WCAG AA (4.5:1 texto normal, 3:1 texto grande, 3:1 UI components).
  axe-core ya valida esto.

## Alcance técnico

- Modifica: `tests/lighthouserc.json`, `tests/lighthouserc.mobile.json`.
- Nuevos: `tests/byte-budgets.sh`, `tests/img-attrs.sh`,
  `tests/no-third-party-fonts.sh`.
- Actualiza `docs/06-performance-spec.md`, `docs/07-accessibility-spec.md`.
- Sin nuevas deps.

## Gates / tests

- Lighthouse CI con thresholds elevados.
- `bash tests/byte-budgets.sh`.
- `bash tests/img-attrs.sh`.
- `bash tests/no-third-party-fonts.sh`.

## Out of scope

- RUM (Real User Monitoring) — no hay backend.
- Synthetic monitoring continuo (cron) — fuera de scope GH Pages.
- Visual regression testing (Percy, Chromatic) — overhead injustificado.
- Modo claro / `prefers-color-scheme` — decisión consciente: el sitio es
  dark-only por marca DevSecOps.

## Edge cases

- Si Lighthouse falla por flakiness (red lenta en CI), reintentar 1 vez
  antes de fallar el build.
- Imágenes decorativas con `alt=""` son válidas pero deben tener
  `role="presentation"` o estar en CSS background.

## Criterios de aceptación

- AC-01: PR que sube CSS > 30 KB gzip falla en CI.
- AC-02: PR que agrega `<img>` sin width/height falla en CI.
- AC-03: Lighthouse pasa en home, blog, interviews, talks con thresholds
  nuevos.
- AC-04: `docs/06-performance-spec.md` y `07-accessibility-spec.md`
  reflejan los thresholds.

## Constitución relevante

- V (performance budget), VI (accessibility), IX (build-time validation).

## Notas para `/specify`

> "Refinar thresholds de Lighthouse a 95/100/95/95 y bloquear PRs que
> bajen. Agregar byte budgets (HTML 50KB, CSS 30KB, JS 50KB gzip) y gates
> para img attrs y third-party fonts. Sin agregar features. Sin modo claro
> (decisión de marca)."
