# Phase 0 — Research: Syntax highlighting build-time (Shiki)

**Feature**: 016-syntax-highlighting | **Date**: 2026-05-14

Unknowns extraídos del Technical Context y resueltos abajo. Cero
`NEEDS CLARIFICATION` remanentes después de esta fase.

---

## R-01 — Highlighter elegido: Shiki vs. alternativas

**Decisión**: `shiki ^3.x` como devDependency build-only.

**Rationale**:
- Tokeniza usando las gramáticas TextMate reales de VS Code → fidelidad
  superior al rendering que ven los lectores en sus IDEs.
- Soporta **modo `cssVariables`**: emite `<span class="line">` con
  spans hijos que usan `var(--shiki-token-keyword)`, etc. Cero
  atributos `style=` inline → compatible con CSP `style-src 'self'`
  sin relajaciones.
- Mantenedor activo (Anthony Fu); usado por VitePress, Astro, Nuxt.
- Build-only: cero impacto en runtime; cero JS al cliente.

**Alternativas evaluadas y rechazadas**:
| Lib | Por qué se descarta |
|---|---|
| `prismjs` | Requiere JS runtime o emite `<span style="...">` inline → rompe CSP estricta; CSS oficial ~6 KB por tema (más pesado). |
| `highlight.js` | Tamaño grande (>100 KB compresso con todos los lenguajes), runtime JS típico; modo build menos pulido. |
| `starry-night` (GitHub) | Bueno pero menos integración con CSS variables; deps Yarn. |
| `pygmentize` (Pygments via Python) | Introduce dependencia Python en build; rompe stack Node-only. |
| Implementación manual | Costo/beneficio negativo; cobertura de 21 lenguajes inviable. |

**Justificación constitucional** (Principio IV):
- Peso: `node_modules/shiki` ~3 MB unpacked, **build-only** (no se sirve).
- Integridad: paquete oficial en npm, mantenedor verificado.
- Licencia: MIT.
- Alternativas evaluadas (arriba) cargan JS al cliente o violan CSP.

---

## R-02 — Modo de emisión: `cssVariables` (no inline styles)

**Decisión**: usar `createCssVariablesTheme()` de Shiki, con el tema
oscuro materializado como mapping de variables CSS.

**Rationale**:
- `style-src 'self'` prohíbe `<span style="color:#xxx">`. Modo
  `cssVariables` produce `<span style="...">`? **No**: la versión
  cssVariables de Shiki produce `<span style="color: var(--shiki-color-x)">`
  por defecto, que **sigue siendo un atributo `style=` inline**.
- Por tanto necesitamos ir un paso más allá: **post-procesar** el HTML
  Shiki para reemplazar el atributo `style="color: var(--X)"` por una
  clase `class="tok-X"` y materializar las clases en `syntax.css`.
- Alternativa: emitir Shiki normal y aplicar un transform que mapee
  cada color hex → clase. Equivalente; lo importante es que el HTML
  resultante **no contenga ningún `style="..."`**.

**Implementación** (detalle del contrato `shiki-integration.md`):
1. Shiki emite HTML tokenizado con clases `class="line"` y spans
   internos con `style="color: var(--shiki-token-X)"`.
2. `scripts/lib/shiki-highlight.js` ejecuta una pasada de transformación
   (regex segura sobre HTML producido por Shiki, no sobre input
   arbitrario) que convierte `style="color: var(--shiki-X)"` →
   `class="tok-X"`.
3. DOMPurify final remueve cualquier `style=` residual (FORBID_ATTR ya
   lo contiene). Cero superficie inline garantizada.

---

## R-03 — Tema único: `github-dark-default`

**Decisión**: tema base `github-dark-default` (preset oficial de
Shiki) materializado como CSS variables con paleta ajustada a
`--bg-secondary` del sitio.

**Rationale**:
- Familiar para devs (mismo highlighting que GitHub.com).
- Contraste verificado WCAG AA contra `--bg-secondary` (#0d1117-ish):
  - keyword `#ff7b72` vs bg → ratio ≥ 5.2:1 ✓
  - string `#a5d6ff` vs bg → ratio ≥ 8.1:1 ✓
  - comment `#8b949e` vs bg → ratio ≥ 4.6:1 ✓
  - function `#d2a8ff` vs bg → ratio ≥ 6.4:1 ✓
- Compatible con la estética terminal/code-first (Principio II) sin
  introducir colores nuevos a la identidad — los tokens viven SOLO
  dentro de `<pre><code>`, no en headings ni en accents.
- Alternativas (`one-dark-pro`, `tokyo-night`) son válidas estética
  pero menos universalmente reconocidas.

**Variables expuestas** (en `assets/css/syntax.css`):
- `.tok-keyword`, `.tok-string`, `.tok-comment`, `.tok-function`,
  `.tok-number`, `.tok-operator`, `.tok-variable`, `.tok-type`,
  `.tok-constant`, `.tok-property`, `.tok-punctuation`,
  `.tok-tag`, `.tok-attribute`, `.tok-regex`, `.tok-deleted`,
  `.tok-inserted`.

**Verificación de contraste**: en `quickstart.md` se documenta cómo
correr una checklist axe sobre el post fixture.

---

## R-04 — Allowlist de lenguajes (21)

**Decisión**: lista fija definida en spec FR-02:
`bash, sh, javascript, typescript, json, yaml, dockerfile, hcl,
python, go, rust, sql, diff, html, css, markdown, ini, toml, makefile,
groovy, nginx`.

**Rationale**: cubre el stack DevSecOps relevante (shell, IaC,
contenedores, lenguajes de servicio, configuración, CI). Cualquier
lenguaje fuera → fallback. Mantenible vía constante en
`scripts/lib/shiki-highlight.js`.

**Implementación**: en build, Shiki precarga **solo** estas 21
gramáticas (no la lista completa) → bundle de gramáticas en memoria
mínimo, build más rápido.

---

## R-05 — Stylesheet: ubicación, generación, budget

**Decisión**:
- Archivo: `assets/css/syntax.css` (commiteado).
- Generado por: `scripts/build-syntax-css.js`.
- Trigger: ejecutar manualmente cuando se cambia tema o allowlist; el
  CI **valida** que el archivo en repo coincida con la regeneración
  (gate de reproducibilidad).
- Budget: ≤ 5 KB gzip (`gzip -c -9 assets/css/syntax.css | wc -c ≤ 5120`).
- Estructura: ~16 clases `.tok-*` con `color:` + algunas decoraciones
  mínimas (font-style italic para comments). Sin selectores complejos.

**Alternativas evaluadas**:
- Regenerar el CSS en cada build → no determinista; descartado.
- Inline `<style>` por post → viola `style-src 'self'` (requeriría
  hash CSP por post). Descartado.

---

## R-06 — Carga condicional del stylesheet

**Decisión**: `build-blog.js` inyecta
`<link rel="stylesheet" href="/assets/css/syntax.css">` en el `<head>`
del post **solo si** el post contiene ≥ 1 bloque tokenizado.

**Rationale**: Principio VII. Posts narrativos no pagan ~5 KB de CSS
innecesarios. Verificable por gate (SC-02).

**Implementación**: el step Shiki retorna `{ html, hasTokenizedBlocks }`.
El template del post usa ese booleano para decidir la inyección.

---

## R-07 — `--check` mode: detección de drift

**Decisión**: extender el `--check` ya existente del builder:
1. Para cada post Markdown, regenerar HTML en memoria.
2. Comparar contra el archivo en disco byte-a-byte.
3. Si difieren → reportar `[drift] blog/<slug>.html` y exit code 2.

**Rationale**: previene merges donde el autor editó Markdown pero
olvidó correr el builder. Mismo patrón que ya usan otros builders del
proyecto.

**Edge case**: timestamps embebidos. El plan exige render reproducible
(SC-08): el builder no debe insertar timestamps de runtime; las fechas
vienen del frontmatter.

---

## R-08 — Integración con DOMPurify

**Decisión**: NO ampliar la whitelist. Verificar que las clases que
emite Shiki + nuestro transform (`line`, `tok-*`, `language-*`) ya
atraviesan el filtro existente (que permite `class` como atributo).

**Rationale**: `FORBID_ATTR` actual incluye `style` → cualquier
regresión que reintroduzca inline styles será removida por DOMPurify
**además** de detectada por el gate `no-inline-styles-blog.sh` (defensa
en profundidad).

**Verificación**: tarea explícita en `/speckit.tasks` que ejecute
sanitizeHtml() sobre el HTML post-Shiki en el fixture multi-lang y
verifique que ningún span de token se pierde.

---

## R-09 — Reproducibilidad byte-a-byte

**Decisión**: Shiki es determinista (mismo input → mismo output) por
diseño. El builder NO debe insertar:
- Timestamps de generación.
- IDs aleatorios.
- Rutas absolutas del filesystem.

**Verificación**: tarea de test `build → md5 → build → md5` (mismos
checksums).

---

## R-10 — Posts fixture y cobertura de lenguajes

**Decisión**: crear `content/blog/_fixtures/syntax-highlighting-demo.md`
con un bloque por cada lenguaje de la allowlist (21 bloques). Sirve
como:
- Test fixture para `tests/build-blog-check.sh`.
- Visual reference para revisar contraste.
- Documentación viva del look-and-feel.

El post fixture **no se publica** en el índice del blog (frontmatter
`draft: true` o ruta `_fixtures/` excluida del builder de producción).

---

## Cierre Phase 0

Todos los unknowns resueltos. Decisiones reflejadas en `plan.md`
(Constitution Check) y operacionalizadas en `data-model.md` y
`contracts/`. Procede Phase 1.
