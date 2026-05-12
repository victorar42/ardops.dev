# Backlog 01 — Shared nav & footer (single source of truth)

> **Estado**: backlog · **Prioridad**: P0 (bloquea features nuevas)
> **Esfuerzo estimado**: M (~1 día) · **ROI networking**: alto indirecto

---

## Problema

Hoy cada página renderiza su propio `<nav>` a mano, y los menús están
desincronizados:

| Página | Items en nav (en orden) |
|---|---|
| `/` (home) | Charla · Pipeline · Blog · About · Entrevistas · Contacto |
| `/blog/` | Charla · Pipeline · Blog · About · Entrevistas · Contacto |
| `/interviews/` | Charlas · Pipeline · About · Entrevistas · Blog · Contacto |
| `/talks/` | (variante propia) |

Hay **dos labels distintos** para la misma sección ("Charla" vs "Charlas"),
**orden inconsistente**, y `/blog/` no aparece en el nav de `/interviews/` ni
viceversa con orden estable.

Cualquier feature nueva (`/uses/`, `/speaking/`, `/now/`) va a heredar y
amplificar la inconsistencia si no se resuelve antes.

## Objetivo

Una **única fuente de verdad** para `<header>` y `<footer>`, consumida por
todos los generadores (`scripts/build-blog.js`, `scripts/build-interviews.js`,
`scripts/build-pipeline.js`) y por la home estática `index.html`.

## Alcance funcional (FRs)

- **FR-01** — Existe un módulo `scripts/lib/layout.js` (o `scripts/partials/`)
  que exporta `renderHeader(currentPath)` y `renderFooter()` puros.
- **FR-02** — Define el menú oficial en una sola estructura JS:
  ```js
  const NAV = [
    { href: '/', label: 'Home', match: ['/'] },
    { href: '/#pipeline', label: 'Pipeline', match: ['#pipeline'] },
    { href: '/blog/', label: 'Blog', match: ['/blog/'] },
    { href: '/interviews/', label: 'Entrevistas', match: ['/interviews/'] },
    { href: '/talks/', label: 'Charlas', match: ['/talks/'] },
    { href: '/#contact', label: 'Contacto', match: ['#contact'] },
  ];
  ```
- **FR-03** — `renderHeader(currentPath)` aplica `aria-current="page"` al item
  correspondiente.
- **FR-04** — `index.html` (home estática) usa el mismo HTML emitido. Opciones:
  (a) generar `index.html` desde un build script igual que blog/interviews
  (preferida por consistencia), (b) inyectar el header con un script de
  post-processing en CI que reemplace un marker `<!-- nav:start --> ... <!-- nav:end -->`.
- **FR-05** — `renderFooter()` igual: un solo HTML, mismo año dinámico
  (`<span data-year>YYYY</span>`), mismo tagline.
- **FR-06** — Skip link `<a class="skip-link" href="#main">` se mantiene en
  todas las páginas, antes del header.
- **FR-07** — Decisión sobre "Charla" vs "Charlas": **siempre plural**,
  consistente con `/talks/`.

## Alcance técnico

- **Archivos a tocar**:
  - Nuevo: `scripts/lib/layout.js`
  - Modifica: `scripts/build-blog.js`, `scripts/build-interviews.js`,
    `scripts/build-pipeline.js` (sustituyen su `<nav>` inline por
    `renderHeader(...)`).
  - `index.html`: o se mueve a un build (nuevo `scripts/build-home.js`) o se
    introduce el marker pattern.
- **Sin nuevas runtime deps** (constitución III).
- **CSS no cambia**.

## Gates / tests

- **Gate 1 — Consistencia**: `tests/nav-consistency.sh` que parsea cada
  HTML servido y verifica:
  - Mismo número de items.
  - Mismas URLs en mismo orden.
  - Exactamente un `aria-current="page"` por página (cero en home si Home
    no está en el nav, o uno si sí).
- **Gate 2 — Drift**: si alguien edita un nav a mano en lugar de regenerar,
  el gate falla.
- **Gate 3 — `npm run html-validate`** sigue pasando.

## Out of scope

- Generación dinámica del nav en runtime (rompe no-JS, viola CSP estricta).
- Web Components / Custom Elements para el nav.
- Mobile nav drawer (sigue siendo CSS-only como hoy).
- Cambios visuales o de paleta.

## Edge cases

- Anchors (`/#pipeline`, `/#contact`) **no** marcan `aria-current` cuando se
  está en home, porque el active state semántico aplica a la página, no al
  fragmento.
- Si una página futura no quiere mostrar Home en el nav, debe ser una
  decisión global, no por-página.

## Criterios de aceptación

- AC-01: `diff <(extract-nav blog/index.html) <(extract-nav interviews/index.html)` = vacío.
- AC-02: `aria-current="page"` aparece exactamente una vez en `/blog/`,
  `/interviews/`, `/talks/`.
- AC-03: Cambiar el label de un item en `scripts/lib/layout.js` y
  re-buildar actualiza las 4+ páginas en una sola pasada.
- AC-04: `bash tests/nav-consistency.sh` pasa.

## Constitución relevante

- II (Spec-Driven), III (zero deps), VI (a11y — `aria-current`),
  VII (semantic HTML), IX (build-time validation).

## Notas para `/specify`

Cuando ejecutés `/speckit.specify`, mencioná explícitamente:

> "shared nav y footer single-source-of-truth, sin romper la home estática
> ni el routing actual. El menú oficial es Home · Pipeline · Blog ·
> Entrevistas · Charlas · Contacto. Decidir entre marker pattern o build-home
> en research.md."
