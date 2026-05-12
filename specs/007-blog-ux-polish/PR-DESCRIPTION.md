# spec 007 — Blog UX Polish

**Spec**: [`specs/007-blog-ux-polish/spec.md`](../specs/007-blog-ux-polish/spec.md) · **Plan**: [`plan.md`](../specs/007-blog-ux-polish/plan.md) · **Tasks**: [`tasks.md`](../specs/007-blog-ux-polish/tasks.md) (46/46 ✓)

## Qué cambia

Mejora visual y de UX del blog. Tres user stories:

- **US1 (P1)** — Post page con tipografía refinada, TOC sticky en desktop + `<details>` en mobile, share links estáticos (mail/LinkedIn/X) y layout dual-column.
- **US2 (P2)** — `/blog/` ahora soporta filtros por tag (CSS-only `:has()` + radios ocultos) y búsqueda live (JS módulo de **3.3 KB**, progresivo). Deep-link via `?tag=<slug>` honrado por JS.
- **US3 (P2)** — Continuidad visual entre landing, `/blog/` y posts: misma paleta, mismas chips, mismo footer.

## Constitución

- **II — Spec-Driven Development**: spec → plan → research → data-model → contracts → tasks → implement. Sin atajos.
- **III — Zero Runtime Dependencies**: `git diff --stat package.json package-lock.json` = `0`. Solo CSS+HTML+1 módulo ES2022 vanilla.
- **IV — Security by Default**: CSP `script-src 'self'` intacta vía `<meta http-equiv="Content-Security-Policy">`. Sin inline `<script>`/`<style>` ejecutable (los `<style id="blog-tag-rules">` y `<script id="blog-index" type="application/json">` son data declarativa, no ejecución).
- **V — Performance Budget**: CSS gzipped total = 11.3 KB (delta < 8 KB respecto a baseline post-spec 006). JS nuevo: 3.3 KB.
- **VI — Accessibility WCAG 2.1 AA**: 7/7 URLs ✓ axe-core. Focus visible en chips (vía `:has(:focus-visible)`), radios `class="visually-hidden"` pero keyboard-focusables, `aria-live="polite"` en results count.
- **VII — Semantic HTML**: `<fieldset>` + `<legend class="visually-hidden">` para grupo de filtros, `<aside>` para TOC y share, `<output>` para results count, `<details>` para TOC mobile.
- **VIII — Design Tokens Only**: cero hex hardcodeados fuera de `tokens.css` (audit: 0 matches, solo comentarios). Nuevos tokens: `--code-bg`, `--code-border`, `--blockquote-border`, `--toc-bg`, `--toc-text`, `--chip-active-bg`, `--chip-active-text`.
- **IX — Build-Time Validation**: extiende `validatePost()` con `validateCoverField()` (path prefix, extensión, existencia en disco). Dos nuevos fixtures negativos.

## Gates ejecutados

| Gate | Resultado |
|---|---|
| `node scripts/build-blog.js --check` | ✓ in sync (1 post) |
| `node scripts/build-pipeline.js --check` | ✓ in sync (6 items) |
| `bash tests/blog-schema.sh` | ✓ 9 fixtures (7 invalid + 1 duplicate + 1 XSS) |
| `bash tests/no-placeholders.sh` | ✓ 0 placeholders en 12 archivos |
| `bash tests/forbidden-urls.sh` | ✓ cero URLs prohibidas |
| `npm run html-validate` | ✓ 5 archivos sin errores |
| `node tests/a11y.js` (axe WCAG 2.1 AA) | ✓ 7/7 URLs |
| `git diff package.json package-lock.json` | ✓ cero deps |

LHCI no ejecutado en este PR (queda manual antes de merge — Lighthouse local).

## Success Criteria cubiertos

SC-001..SC-015 — ver [`spec.md` §Success Criteria](../specs/007-blog-ux-polish/spec.md). Resumen:

- Post legible en mobile y desktop, TOC funcional ≥3 H2 ✓
- Share links abren mail/LinkedIn/X con URL+título encodeados ✓
- Filtros y búsqueda 100% client-side, sin red ✓
- Filtros funcionan sin JS (CSS-only `:has()`) — búsqueda solo con JS ✓
- Cover field opcional, validado en build-time ✓
- Cero hex hardcodeados, cero deps runtime nuevas ✓

## Archivos clave

- `scripts/build-blog.js` — extensión mayor: `buildToc`, `renderToc`, `renderShareLinks`, `collectTags`, `renderTagCssRules`, `renderBlogIndex` reescrito, `renderPostPage` reescrito con `post-layout`.
- `assets/js/blog-filter.js` — nuevo módulo ES2022, 3.3 KB, debounce 60 ms.
- `assets/css/components.css` — +416 líneas (post-layout, TOC, share, filters, chips, search).
- `assets/css/tokens.css` — +7 tokens blog UX.
- `content/blog/README.md` — documenta el campo opcional `cover`.
- `content/blog/__fixtures__/invalid-cover-{missing,bad-ext}.md` — fixtures negativos.

## Branch

`007-blog-ux-polish`
