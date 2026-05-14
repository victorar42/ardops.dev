# Tasks — Privacy policy + no-tracking enforcement (spec 015)

**Feature**: `015-privacy-no-tracking` · **Branch**: `015-privacy-no-tracking`
**Plan**: [plan.md](plan.md) · **Spec**: [spec.md](spec.md)

Convention: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- `[P]` = parallelizable (different files, no dependencies on incomplete tasks)
- `[USx]` = mapped to User Story x (US1 page, US2 trackers gate, US3 cookies gate, US4 constitution)

---

## Phase 1 — Setup

- [X] T001 Create directory `privacy/` with placeholder `.gitkeep` (will be replaced by `privacy/index.html` in US1)
- [X] T002 Add npm scripts `check:no-trackers` and `check:no-cookies` to [package.json](package.json), and chain them inside `check:distribution` after `check:fonts`

---

## Phase 2 — Foundational

> Blocking prerequisites: footer must carry the `/privacy/` link before any HTML referencing it is published; pattern list must exist before gates can be wired.

- [X] T003 Update [scripts/lib/layout.js](scripts/lib/layout.js) `renderFooter()` so `<p class="footer-links">` includes `<a href="/privacy/">/privacy/</a>` next to `/now/` (single source for build-blog and build-interviews)
- [X] T004 Create [tests/tracker-domains.txt](tests/tracker-domains.txt) with the 24+ ERE patterns enumerated in plan FR-06 (one per line, `#` comments allowed, properly escaped `\.`, `\(`)
- [X] T005 Append the new `/privacy/` URL entry to [sitemap.xml](sitemap.xml) with `<lastmod>2026-05-14</lastmod>`

---

## Phase 3 — User Story 1 (P1): Página /privacy/ publicada y enlazada

> Goal: visitor can read the policy at `/privacy/` (250 ±50 words, 5 sections, last-modified visible) reachable from every footer.
> Independent test: open `https://ardops.dev/privacy/`, verify 5 sections, `<time datetime>`, footer-link present on home + 5 other pages.

- [X] T006 [US1] Create [privacy/index.html](privacy/index.html) following [specs/015-privacy-no-tracking/contracts/privacy-page.md](specs/015-privacy-no-tracking/contracts/privacy-page.md): full `<head>` (CSP, referrer, canonical, OG, favicon, font preloads, 5 stylesheets), skip-link, shared header markers, `<main class="privacy-page">` with hero + `<article>` containing 5 `<section>` (id `no-hace`, `logs`, `mailto`, `cambios`, `contacto`), `<time datetime="2026-05-14">`, back-CTA, footer markers
- [X] T007 [P] [US1] Write the 5-section spanish copy (200–300 words total) inside [privacy/index.html](privacy/index.html) using the per-section word targets in the contract (links: GitHub privacy statement, repo file, `mailto:hola@ardops.dev`, all externals with `rel="noopener noreferrer"`)
- [X] T008 [US1] Add `<a href="/privacy/">/privacy/</a>` inside `<p class="footer-links">` (between `<!-- footer:start -->` and `<!-- footer:end -->`) in every hard-coded served HTML: [index.html](index.html), [404.html](404.html), [now/index.html](now/index.html), [talks/index.html](talks/index.html), [speaking/index.html](speaking/index.html), [uses/index.html](uses/index.html), [blog/index.html](blog/index.html)
- [X] T009 [US1] Regenerate generator outputs so footers pick up the new link: run `node scripts/build-blog.js` and `node scripts/build-interviews.js --strict --include-fixtures --out interviews/`; verify [blog/pipeline-seguridad-spec-driven.html](blog/pipeline-seguridad-spec-driven.html), [interviews/index.html](interviews/index.html), [interviews/victor-ardon.html](interviews/victor-ardon.html), [interviews/valid-minimal.html](interviews/valid-minimal.html), [interviews/xss-attempt.html](interviews/xss-attempt.html) now contain the link
- [X] T010 [P] [US1] Add `http://localhost/privacy/index.html` to the URL arrays in [tests/lighthouserc.json](tests/lighthouserc.json) and [tests/lighthouserc.mobile.json](tests/lighthouserc.mobile.json)
- [X] T011 [P] [US1] Add the `/privacy/` URL to the audit list in [tests/a11y.js](tests/a11y.js)
- [X] T012 [US1] Validate locally: `npm run html-validate`, `bash tests/external-links.sh`, `bash tests/seo-meta.sh`, `bash tests/sitemap-drift.sh`, `bash tests/byte-budgets.sh`, `bash tests/img-attrs.sh`, `bash tests/no-third-party-fonts.sh`, `node tests/a11y.js` — all must pass

---

## Phase 4 — User Story 2 (P1): Gate `no-trackers.sh` bloquea trackers

> Goal: any tracker pattern in served `.html/.css/.js` fails CI with exit 1, location reported.
> Independent test: inject `<script src="https://www.googletagmanager.com/gtag/js?id=FAKE"></script>` into `404.html`, run the gate, see exit 1 + `404.html:<line>:googletagmanager.com`.

- [X] T013 [US2] Create [tests/no-trackers.sh](tests/no-trackers.sh) implementing the algorithm in [specs/015-privacy-no-tracking/contracts/no-trackers-gate.md](specs/015-privacy-no-tracking/contracts/no-trackers-gate.md): POSIX bash, `set -euo pipefail`, env vars `NT_PATTERN_FILE` and `NT_ROOT`, validate pattern file, build alternation, `find` exclusions per R-3, per-file `grep -nE`, exit 0/1/2 with `✓`/`✗` summary in spec-014 style
- [X] T014 [US2] `chmod +x tests/no-trackers.sh`
- [X] T015 [US2] Run `bash tests/no-trackers.sh` on the clean repo — must exit 0 reporting `N files scanned, M patterns`
- [X] T016 [US2] Run a transient negative test: append `<!-- googletagmanager.com test -->` to a temp copy of `404.html` (or use `NT_ROOT=/tmp/fake`), confirm exit 1 with `path:line:matched`, then revert
- [X] T017 [US2] Add a `no-trackers` job to [.github/workflows/ci.yml](.github/workflows/ci.yml) after `byte-budgets` (no Node deps required; `runs-on: ubuntu-latest`, `actions/checkout@v4`, `bash tests/no-trackers.sh`)

---

## Phase 5 — User Story 3 (P2): Gate `no-cookies.sh` bloquea `document.cookie`

> Goal: literal `document.cookie` in any served `.js` fails CI.
> Independent test: append `document.cookie = "x=y";` to `assets/js/main.js`, run gate, see exit 1, revert.

- [X] T018 [US3] Create [tests/no-cookies.sh](tests/no-cookies.sh) per [specs/015-privacy-no-tracking/contracts/no-cookies-gate.md](specs/015-privacy-no-tracking/contracts/no-cookies-gate.md): `find` `.js` files with the exclusion list, `grep -nF "document.cookie"`, exit 0/1/2
- [X] T019 [US3] `chmod +x tests/no-cookies.sh`
- [X] T020 [US3] Run `bash tests/no-cookies.sh` on clean repo — must exit 0 reporting `N files scanned`
- [X] T021 [US3] Run a transient negative test (inject + revert) to confirm exit 1 with `path:line:document.cookie`
- [X] T022 [US3] Add a `no-cookies` job to [.github/workflows/ci.yml](.github/workflows/ci.yml) after `no-trackers` (mirror structure, no Node deps)

---

## Phase 6 — User Story 4 (P3): Principio constitucional XII

> Goal: constitution carries Principle XII "Privacy by Default" with rule + exception process; version bumped to 1.3.0; sync-impact-report appended.
> Independent test: open [.specify/memory/constitution.md](.specify/memory/constitution.md), confirm Principle XII exists with body ≤ 120 words, version line reads `1.3.0`, sync-impact-report block dated 2026-05-14 references spec 015.

- [X] T023 [US4] Append **Principio XII — Privacy by Default** to [.specify/memory/constitution.md](.specify/memory/constitution.md) using the canonical text in research R-5 (do NOT renumber Principles I–XI)
- [X] T024 [US4] Bump version line: `**Versión:** 1.2.0` → `**Versión:** 1.3.0`, update `**Última revisión constitucional:** 2026-05-14`
- [X] T025 [US4] Add the `Sync Impact Report (2026-05-14, v1.2.0 → v1.3.0)` HTML comment block at the end of [.specify/memory/constitution.md](.specify/memory/constitution.md), preserving the existing v1.1.0 → v1.2.0 block above it

---

## Phase 7 — Polish & Cross-Cutting Concerns

- [X] T026 Update [docs/05-security-spec.md](docs/05-security-spec.md): append section "## Privacy by Default (spec 015)" with one-paragraph summary linking to `/privacy/`, the two gates, and Principle XII
- [X] T027 Close [backlog/08-privacy-no-tracking.md](backlog/08-privacy-no-tracking.md): change the front-matter blockquote to `> **Estado**: ✅ completado en spec [015-privacy-no-tracking](../specs/015-privacy-no-tracking/spec.md) · **Prioridad original**: P3`
- [X] T028 Run the full local suite end-to-end: `npm run html-validate && bash tests/external-links.sh && bash tests/no-placeholders.sh && bash tests/nav-consistency.sh && bash tests/sitemap-drift.sh && bash tests/seo-meta.sh && node tests/jsonld-validate.js && bash tests/now-freshness.sh && bash tests/headshot-size.sh && node tests/feed-validate.js && bash tests/byte-budgets.sh && bash tests/img-attrs.sh && bash tests/no-third-party-fonts.sh && bash tests/no-trackers.sh && bash tests/no-cookies.sh` — every gate exit 0
- [X] T029 Commit on branch `015-privacy-no-tracking`: `git add -A && git commit -m "feat(015): privacy page + no-tracking enforcement"`; push and verify CI (ci.yml + lighthouse.yml) is green
- [X] T030 Stop & Report: emit final summary listing AC-01..AC-06 satisfied, SC-01..SC-09 measured outcomes, and Constitution 11/11 + new XII PASS

---

## Dependencies

```text
T001  ─┐
T002  ─┤  setup (parallel)
       │
T003   │  layout footer (single source) ─┐
T004   │  pattern list                   │
T005   │  sitemap                        │
       │                                 │
US1 (P1, MVP):                           │
  T006 ◀── needs T003 (footer link template)
  T007 ◀── needs T006
  T008 ◀── needs T003 + T006 (page must exist before linking)
  T009 ◀── needs T003 (regenerate builders)
  T010, T011 ◀── parallel after T006
  T012 ◀── needs T006..T011
                                         │
US2 (P1):                                 │
  T013 ◀── needs T004                     │
  T014..T017 ◀── chain after T013         │
                                         │
US3 (P2):                                 │
  T018..T022 ◀── independent from US2     │
                                         │
US4 (P3):                                 │
  T023..T025 ◀── independent              │
                                         │
Polish:
  T026..T028 ◀── after all US complete
  T029 ◀── after T028
  T030 ◀── after T029
```

**Story independence**:
- US1 can ship alone → MVP (page + footer link).
- US2 ships independently of US1/US3/US4.
- US3 ships independently.
- US4 is documentation-only; can ship in any order.

---

## Parallel Execution Examples

- **Within US1**: T007 (copy), T010 (lighthouserc), T011 (a11y) can run in parallel after T006.
- **Across stories**: T013–T017 (US2), T018–T022 (US3), T023–T025 (US4) are fully independent and can be executed in parallel by different agents/sessions.
- **Setup**: T001 and T002 are independent.

---

## Implementation Strategy

**Suggested MVP scope**: US1 only — publishes the policy and footer link. This alone delivers the brand-transparency value.

**Incremental delivery**:

1. Land Setup (T001–T002) + Foundational (T003–T005).
2. Land US1 (T006–T012) → MVP shipped.
3. Land US2 (T013–T017) → regression blocker for trackers.
4. Land US3 (T018–T022) → regression blocker for cookies.
5. Land US4 (T023–T025) → constitutional codification.
6. Polish (T026–T030) → docs, suite, commit, report.

**Total tasks**: 30. **By story**: Setup 2 · Foundational 3 · US1 7 · US2 5 · US3 5 · US4 3 · Polish 5.
