# Phase 0 — Research: Shared nav & footer

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

Decisiones técnicas tomadas para resolver los puntos abiertos del spec
y los `NEEDS CLARIFICATION` implícitos del `Technical Context`.

---

## D-001 — Mecanismo de inyección en `index.html`: marker pattern

**Decisión**: Adoptar **Mecanismo B (marker pattern)** del spec FR-009.
Un script `scripts/build-layout.js` reemplaza el contenido entre
`<!-- nav:start --> ... <!-- nav:end -->` y
`<!-- footer:start --> ... <!-- footer:end -->` en `index.html` y
`404.html`.

**Rationale**:

- **Patrón ya establecido en el repo**: `scripts/build-blog.js` usa
  `<!-- blog:start -->` y `scripts/build-pipeline.js` usa
  `<!-- pipeline:start -->`. Cero curva de aprendizaje, cero deuda
  conceptual nueva.
- **Conserva `index.html` como archivo legible y editable**: el editor
  sigue viendo todo el HTML a la vista; los markers son cero ruido
  visual.
- **Diff-friendly**: cuando algún editor cambia el contenido (e.g.,
  hero, sección about), `git diff` no se inunda con cambios espurios
  del header/footer.
- **Soporta `--check` trivialmente**: ejecutar el script sin escribir y
  comparar con el contenido actual; idéntico a cómo funciona ya
  `build-blog.js --check`.

**Alternativas evaluadas**:

- **Mecanismo A (build-home script desde plantilla)**: requeriría
  mover el contenido de `index.html` a una plantilla `.html.template`
  o similar, y regenerar el archivo entero en cada build. Más invasivo,
  rompe el flujo de edición visual de la home, y no aporta ventajas
  sobre el marker pattern para esta spec.
- **Web Components**: descartado por constitución IV (CSP estricta) y
  porque rompe no-JS rendering (mal para SEO y a11y).
- **Server-side include (SSI)**: GH Pages no lo soporta.

---

## D-002 — Lenguaje del módulo: CommonJS

**Decisión**: `scripts/lib/layout.js` es **CommonJS** (`module.exports`,
`require`).

**Rationale**: el resto de `scripts/` ya es CommonJS (`build-blog.js`,
`build-interviews.js`, `build-pipeline.js`). `package.json` no declara
`"type": "module"`. Mantener consistencia evita migraciones colaterales
y errores de interop ESM↔CJS.

**Alternativa**: ESM. Rechazada por inconsistencia con el resto de
build scripts y por no aportar valor en este contexto (no hay
top-level await, no hay tree-shaking porque no hay bundler).

---

## D-003 — Estrategia de matching de `aria-current="page"`

**Decisión**: Match por **path canónico normalizado**.

- `currentPath` se normaliza:
  - Lowercase.
  - Trailing slash agregado si la URL es de directorio
    (`/blog` → `/blog/`).
  - Fragment y query removidos.
- Para cada item de `NAV`, comparar el `href` normalizado con
  `currentPath`. Si coincide → emitir `aria-current="page"`.
- Items que apuntan a anchors de home (`/#pipeline`, `/#contact`)
  **nunca** matchean cuando `currentPath` es algo distinto de `/`,
  porque después de stripping del fragment quedan como `/`. Para
  evitar que matcheen al estar en home, esos items se excluyen
  explícitamente del matching (`isAnchor: true`).

**Rationale**: simple, determinístico, fácil de testear. Cubre todos
los casos del spec FR-004..FR-007.

**Alternativas evaluadas**:

- **Regex per-item**: overhead innecesario, no hay casos que requieran
  patrones complejos hoy.
- **Path-prefix matching** (`/blog/<slug>` activa "Blog"): viable, pero
  introduce ambigüedad si en el futuro hay rutas anidadas. Decidido
  diferir a una spec posterior si se necesita; hoy las páginas servidas
  son de un solo nivel y el match exacto alcanza.

---

## D-004 — "Charla" vs "Charlas": plural

**Decisión**: **siempre plural** (`Charlas`).

**Rationale**: alineado con el path `/talks/` (plural en inglés también),
y con la sección `<section id="talks">` de la home. Habrá múltiples
charlas listadas; el singular fue una inconsistencia introducida por
copy-paste, no por decisión deliberada.

**Confirmado en spec**: Assumptions, FR-002.

---

## D-005 — Logo siempre apunta a `/`

**Decisión**: el `<a class="nav-logo">` apunta a `/` en TODAS las páginas,
incluyendo la home (donde hoy apunta a `#`).

**Rationale**:

- Convención web universal: clic en el logo va a home.
- En home, `/` recarga la página (esperable). Apuntar a `#` produce un
  scroll-to-top sin estado claro (¿por qué el logo es un anchor?), y
  rompe expectativas si el visitante usa el enlace de logo desde una
  pestaña abierta.
- Consistencia entre páginas: el logo siempre tiene el mismo `href`,
  facilita el gate de consistencia.

**Confirmado en spec**: FR-015, Edge Cases.

---

## D-006 — Anchors siempre absolutos

**Decisión**: items que apuntan a secciones de home se emiten como
`/#pipeline` y `/#contact`, NUNCA como `#pipeline` / `#contact`.

**Rationale**: si un visitante está en `/blog/` y hace clic en
"Pipeline" con `href="#pipeline"`, el navegador busca un `id="pipeline"`
en `/blog/`, que no existe → no pasa nada. Con `href="/#pipeline"`
navega a home y luego scrollea al ancla. Comportamiento esperable y
correcto desde cualquier página.

**Trade-off**: un visitante en home que hace clic en `/#pipeline`
provoca una recarga si su navegador no detecta que ya está en `/`.
**En la práctica**, los navegadores modernos (Chromium, Firefox,
Safari) detectan que solo cambia el fragment y NO recargan la página,
solo hacen scroll. Verificado.

**Confirmado en spec**: FR-016, Edge Cases.

---

## D-007 — `404.html` también consume el módulo compartido

**Decisión**: `404.html` debe emitir el mismo `<header>` y `<footer>`
que el resto del sitio. Se incluye en el alcance del `build-layout.js`
y del gate de consistencia.

**Rationale**:

- 404 es la primera impresión cuando un link rompe. Tener nav permite
  recuperación: el visitante puede ir a otra sección sin retroceder.
- Si 404 muestra un nav distinto (o sin nav), refuerza la sensación de
  "esto está roto" en lugar de "esto es un sitio cuidado".
- Hoy `404.html` ya tiene un `<nav>` propio que vamos a normalizar.

**Edge case**: la página 404 no corresponde a ningún item del menú →
NINGÚN item lleva `aria-current="page"`. El gate debe permitir cero
matches en 404.html (caso especial documentado).

---

## D-008 — Implementación del gate `tests/nav-consistency.sh`

**Decisión**: el gate ejecuta un **script Node** (`scripts/check-nav-consistency.js`)
desde un wrapper bash. El script Node usa `jsdom` (ya devDependency) para
parsear cada HTML servido y comparar `<nav>` y `<footer>` contra el
output canónico de `renderHeader(currentPath)` y `renderFooter()`.

**Rationale**:

- **Cero deps nuevas**: `jsdom` ya está en `package.json` desde spec 006.
- **Robusto a whitespace y reordenamiento de atributos**: parsear DOM
  es mucho más estable que `diff` textual.
- **Bash wrapper para uniformidad**: el resto de gates son `tests/*.sh`;
  mantener convención. Internamente delega a Node.

**Alternativas evaluadas**:

- **Diff textual con `diff -u`**: frágil ante cualquier cambio de
  whitespace o atributos reordenados.
- **`pup` (CLI parser de HTML)**: agrega dep nueva (Go binary), no
  justificable.
- **xmllint con XPath**: HTML5 no es XML válido (ej: `<meta>` sin
  cerrar), parser XML rompe.
- **Regex sobre el HTML**: frágil, mantenibilidad pobre.

---

## D-009 — Skip link emitido por `renderHeader()`

**Decisión**: el skip link
`<a class="skip-link" href="#main">Saltar al contenido</a>` lo emite
`renderHeader()` antes del `<header class="site-header">`. No es un
fragmento separado.

**Rationale**:

- Conceptualmente el skip link es parte del "shell" de navegación
  accesible, pertenece al mismo módulo.
- Una sola función para el editor: pegar `renderHeader('/blog/')` y
  obtener todo lo que va antes del `<main>`.

**Alternativa**: función separada `renderSkipLink()`. Innecesario para
este alcance.

---

## D-010 — Year en footer: hardcoded a 2026

**Decisión**: el `<span data-year>2026</span>` se emite con literal
`2026`. NO se inyecta JS para actualizarlo.

**Rationale**:

- Constitución IV / VIII: cero JS innecesario, CSP estricta.
- El `data-year` attribute existe como marker para futura automatización
  build-time si se quiere (e.g., `Date.now().getFullYear()` en el build).
  No urgente; cuando importe se actualiza con un cambio de 1 línea en
  `renderFooter()`.

**Trade-off aceptado**: si el sitio sigue activo en 2027 sin un
re-build, el footer mostrará "2026". El tipo de cambio (1 commit/release
mensual mínimo) hace que esto sea no-issue.

---

## Resumen de decisiones

| ID | Decisión | Impacto |
|---|---|---|
| D-001 | Marker pattern para home | Patrón ya conocido en el repo |
| D-002 | CommonJS | Consistencia con resto de scripts/ |
| D-003 | Match exacto path canónico | Determinístico, simple |
| D-004 | Plural "Charlas" | Consistencia con `/talks/` |
| D-005 | Logo siempre `/` | Convención web universal |
| D-006 | Anchors absolutos `/#x` | Funcional desde cualquier página |
| D-007 | 404 incluida en alcance | Primera impresión cuidada |
| D-008 | Gate Node + jsdom | Cero deps nuevas, robusto |
| D-009 | Skip link en renderHeader | Una sola función para el shell |
| D-010 | Year hardcoded 2026 | Cero JS extra |

Todas las decisiones fueron **tomadas en este Phase 0**. Cero
`NEEDS CLARIFICATION` quedan abiertos al pasar a Phase 1.
