# Feature Specification: Syntax highlighting build-time (Shiki)

**Feature Branch**: `016-syntax-highlighting`
**Created**: 2026-05-14
**Status**: Draft
**Input**: Backlog 10 — Syntax highlighting build-time (Shiki) (`backlog/10-syntax-highlighting-shiki.md`)

---

## Resumen ejecutivo

Los posts del blog renderizan los bloques de código en mono plano sobre
`--bg-secondary`. Para un blog DevSecOps, los snippets son contenido
principal y merecen colores que faciliten la lectura. Esta feature
introduce **syntax highlighting en build-time** usando **Shiki**: el
HTML resultante ya viene tokenizado con colores; el navegador no carga
JS de highlighting; la CSP estricta del sitio (`style-src 'self'`,
`script-src 'self'`) no se relaja.

Salida visible:

- Bloques ```` ```bash ```` `, ```` ```typescript ```` `, etc. se ven
  con colores oscuros consistentes con la paleta del sitio.
- Bloques sin lenguaje o con un lenguaje fuera de la allowlist
  conservan el render actual (mono plano).
- Posts sin código no cargan ningún CSS extra.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Lector ve código coloreado (Priority: P1)

Un lector llega a un post del blog que contiene un bloque
```` ```bash ```` con un snippet de shell. Lo ve en colores: keywords,
strings, comments y variables tienen colores distinguibles, alineados
con la estética dark del sitio. El bloque se renderiza al instante
(no hay flicker, no se carga JS adicional).

**Why this priority**: es el valor de UX entregado. Sin esta historia
el resto es plomería invisible. Es el MVP independiente y demostrable.

**Independent Test**: publicar un post con bloque ```` ```bash ```` `,
abrirlo en navegador, ver tokens coloreados; abrir DevTools → Network y
confirmar que no se descargó ningún JS de highlighting; confirmar en
Sources que el HTML del bloque ya viene tokenizado en spans con
clases CSS.

**Acceptance Scenarios**:

1. **Given** un post con bloque ```` ```bash echo "hola" ```` `,
   **When** se renderiza, **Then** las palabras `echo` y `"hola"`
   aparecen en colores distintos provenientes del tema dark.
2. **Given** un post con bloques en bash, typescript y yaml, **When**
   se renderiza, **Then** los tres bloques tienen highlighting
   correcto para su lenguaje.
3. **Given** el lector con JavaScript deshabilitado, **When** abre el
   post, **Then** los colores se ven igual (porque están en el HTML +
   CSS, no en JS).

---

### User Story 2 — Autor publica código sin fricción (Priority: P1)

Como autor del blog, escribo un post en Markdown con bloques
```` ```typescript ```` o ```` ```yaml ```` ` y al ejecutar
`node scripts/build-blog.js` el HTML generado lleva los tokens ya
coloreados, sin tocar configuración por post.

**Why this priority**: la feature debe ser invisible para el flujo de
autoría. Si el autor tiene que recordar pasos extra, falla.

**Independent Test**: agregar un post fixture con ≥ 3 lenguajes,
correr `npm run build:blog`, ver que el HTML emitido contiene
`<span class="line">` o equivalente con tokens.

**Acceptance Scenarios**:

1. **Given** un Markdown con tres bloques (bash, json, dockerfile),
   **When** corre `build-blog`, **Then** el HTML resultante contiene
   los tres bloques tokenizados y el log indica `3 code block(s) highlighted`.
2. **Given** un bloque con lenguaje fuera de la allowlist (por ejemplo
   ```` ```cobol ```` `), **When** corre `build-blog`, **Then** el bloque
   se renderiza como mono plano y el log incluye una advertencia
   `unknown language: cobol — fallback to plain`. Build no falla.
3. **Given** un bloque inline `` `código` `` en un párrafo, **When**
   corre `build-blog`, **Then** el inline-code NO se tokeniza
   (solo bloques `<pre><code>`).

---

### User Story 3 — Posts sin código no pagan el costo (Priority: P2)

Un post existente sobre un tema sin snippets (por ejemplo un changelog
narrativo) no debe cargar CSS adicional ni regresar performance.

**Why this priority**: cumple Principio VII (Performance es feature) y
el budget de bytes (spec 014). Es independiente: aunque US1+US2 lleguen,
si esto regresa el budget se debe ajustar.

**Independent Test**: comparar el HTML emitido de un post sin código
contra `main`: el `<head>` no debe incluir `<link rel="stylesheet"
href="/assets/css/syntax.css">`; el budget `css-sum` por página debe
mantenerse dentro del umbral spec 014.

**Acceptance Scenarios**:

1. **Given** un post sin bloques ```` ``` ```` ` en el Markdown,
   **When** corre `build-blog`, **Then** el `<head>` del HTML emitido
   NO contiene el enlace a `syntax.css`.
2. **Given** la suite local, **When** corre `bash tests/byte-budgets.sh`,
   **Then** `css-sum` permanece ≤ 30 720 B gzip por página (umbral spec
   014 invariante).

---

### User Story 4 — Seguridad: CSP intacta (Priority: P1)

Un auditor de seguridad inspecciona el HTML emitido y confirma que
**no hay `style=""` inline** introducido por el highlighting; el header
CSP no necesita relajarse; DOMPurify no remueve los spans coloreados.

**Why this priority**: cualquier deriva en CSP debilita Principio VIII
y bloquea el merge. Esta historia es non-negotiable.

**Independent Test**: correr `bash tests/csp-no-unsafe-inline.sh` y
`grep -c 'style="' blog/<post>.html` → 0.

**Acceptance Scenarios**:

1. **Given** un post con ≥ 1 bloque tokenizado, **When** se inspecciona
   el HTML, **Then** no hay atributos `style="…"` inline.
2. **Given** la CSP del post, **When** se valida, **Then** el `<meta
   http-equiv="Content-Security-Policy">` mantiene exactamente
   `style-src 'self'` (sin `'unsafe-inline'`, sin hashes nuevos).
3. **Given** DOMPurify aplicado al HTML después de Shiki, **When**
   inspecciono el resultado, **Then** los `<span class="line">` y los
   spans de tokens sobreviven (no son removidos).

---

### Edge Cases

- **Bloque sin lenguaje** (` ``` ` sin tag): render fallback mono plano,
  sin advertencia, sin error.
- **Bloque con lenguaje fuera de allowlist** (`cobol`, `brainfuck`):
  fallback + warning en stdout del builder; no es error fatal.
- **Bloque vacío** (` ```bash ` + ` ``` ` sin contenido): render mínimo,
  sin error.
- **Markdown inline `code`**: nunca se procesa con highlighting.
- **Post legacy sin código**: no carga `syntax.css`.
- **Post con varios lenguajes**: cada bloque usa su gramática
  independiente; el `syntax.css` cubre todos.
- **Caracteres especiales en el código** (`<`, `>`, `&`, `"`): el
  resultado debe quedar HTML-seguro tras la combinación Shiki +
  DOMPurify.
- **Build time**: agregar Shiki no debe explotar el tiempo de build
  más allá de un factor razonable (≤ +2 s por post promedio en CI).
- **Reproducibilidad**: dos ejecuciones consecutivas del builder con el
  mismo input producen el mismo HTML byte-a-byte (sin timestamps ni
  IDs aleatorios introducidos por Shiki).
- **Watch de drift en `--check`**: si un Markdown cambia y el HTML no se
  regeneró, el modo `--check` del builder debe reportarlo.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-01** — El builder de blog (`scripts/build-blog.js`) detecta cada
  bloque `<pre><code class="language-{lang}">` en el HTML renderizado
  desde el Markdown y aplica syntax highlighting si `{lang}` está en la
  allowlist.
- **FR-02** — **Allowlist** de lenguajes soportados: `bash`, `sh`,
  `javascript`, `typescript`, `json`, `yaml`, `dockerfile`, `hcl`
  (terraform), `python`, `go`, `rust`, `sql`, `diff`, `html`, `css`,
  `markdown`, `ini`, `toml`, `makefile`, `groovy` (jenkins),
  `nginx`.
- **FR-03** — Tema único, oscuro, alineado con la paleta del sitio
  (`--bg-primary`, `--bg-secondary`, `--accent`). La elección se
  documenta en `research.md` durante `/speckit.plan`.
- **FR-04** — Si un bloque trae lenguaje fuera de la allowlist (o no
  trae lenguaje), el render es **fallback** al estilo actual (mono
  plano sobre `--bg-secondary` con rail accent). El builder loguea
  una advertencia non-fatal para lenguajes desconocidos.
- **FR-05** — El HTML emitido NO introduce atributos `style="…"`
  inline. El highlighting se expresa con clases CSS resueltas en un
  stylesheet aparte. El sitio mantiene `style-src 'self'` sin
  excepciones.
- **FR-06** — El stylesheet de highlighting vive en
  `assets/css/syntax.css` (o nombre análogo con el tema en el filename),
  se versiona en git, pesa **≤ 5 KB gzip**, y se genera/refresca por
  el mismo builder cuando el tema o la allowlist cambia.
- **FR-07** — El builder soporta modo `--check` (drift detection):
  si el Markdown fuente se editó pero el HTML emitido no incluye los
  tokens correctos (o falta el enlace al stylesheet cuando hay
  código), el comando termina con exit code ≠ 0 y reporta los
  archivos afectados. Esto previene merges con HTML stale.

### Key Entities

- **CodeBlock**: bloque ```` ``` ```` ` en Markdown, con o sin
  fenced language tag. Atributos: `language` (string|null), `source`
  (texto crudo), `isInlineCode` (bool, siempre `false` para
  highlighting). Se tokeniza si y solo si `language` está en la
  allowlist.
- **LanguageAllowlist**: conjunto cerrado de gramáticas soportadas
  (FR-02). Mantenible vía constante en el builder.
- **SyntaxTheme**: identificador del tema único (ej. `github-dark`,
  `one-dark-pro`, `tokyo-night`); decide los colores; genera el
  stylesheet.
- **SyntaxStylesheet**: archivo estático `assets/css/syntax.css`,
  servido bajo `style-src 'self'`, peso ≤ 5 KB gzip.
- **PostArtifact**: HTML emitido en `blog/<slug>.html`. Incluye
  `<link rel="stylesheet" href="/assets/css/syntax.css">` solo si
  el post contiene ≥ 1 bloque tokenizado.
- **BuildLog**: salida del builder; lista cantidad de bloques
  tokenizados, advertencias por lenguajes desconocidos, errores
  drift en `--check`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-01**: 100 % de los bloques ```` ```{lang} ```` con `lang` en la
  allowlist se ven coloreados en al menos 3 colores distinguibles por
  el ojo humano (keyword/string/comment).
- **SC-02**: Posts sin bloques de código no incluyen el enlace a
  `syntax.css` en el `<head>` (verificable con `grep -c "syntax.css"
  blog/<post>.html` → `0`).
- **SC-03**: `assets/css/syntax.css` pesa **≤ 5 KB gzip**
  (`gzip -c -9 assets/css/syntax.css | wc -c` ≤ 5120).
- **SC-04**: El header CSP de cada post se mantiene `style-src 'self'`
  sin `'unsafe-inline'`; el gate `bash tests/csp-no-unsafe-inline.sh`
  pasa con exit 0.
- **SC-05**: Cero `style="…"` inline en cualquier HTML servido
  (`grep -rE 'style="' blog/ → 0` después del build).
- **SC-06**: Tiempo de build de un post típico (≤ 2 000 palabras, ≤ 10
  bloques de código) ≤ 5 s en macOS local y ≤ 8 s en GitHub Actions.
- **SC-07**: `git diff package.json` introduce **solo** `shiki` (u
  otra librería justificada en research) en `devDependencies`. Cero
  dependencias en runtime.
- **SC-08**: Build reproducible: dos corridas consecutivas con el mismo
  Markdown producen HTML idéntico byte-a-byte
  (`md5 blog/<post>.html` estable entre runs).
- **SC-09**: La suite local completa (incluyendo spec 014 y 015)
  permanece verde: 14/14 gates + nuevo gate de tamaño de
  `syntax.css`.
- **SC-10**: Modo `--check` del builder detecta drift: si edito un
  Markdown sin regenerar HTML, `node scripts/build-blog.js --check`
  retorna exit ≠ 0 y reporta el archivo afectado.

---

## Assumptions

- Se mantiene el flujo actual: Markdown en `content/blog/` (o
  ubicación equivalente) → `scripts/build-blog.js` → HTML en `blog/`.
  El plan confirmará rutas exactas durante research.
- Existirán ≥ 2 posts con bloques de código antes de hacer merge en
  `main`. El propio post fixture cuenta como uno; el segundo es
  responsabilidad del autor (no parte de esta spec).
- Shiki es elegible como **devDependency** (build-only) bajo Principio
  IV: justificación se documenta en research.md (`peso ~3 MB
  unpacked, build-time únicamente, alternativa Prism requiere JS
  runtime`).
- El tema oscuro elegido proporciona contraste WCAG AA suficiente
  contra `--bg-secondary` para los tokens más comunes.
- La paleta dark elegida no introduce un color nuevo que rompa la
  identidad visual (Principio II). Si fuera necesario alguna
  customización menor del tema, se hace vía mapping a tokens
  existentes y se documenta.
- El builder ya emite HTML que pasa por DOMPurify; la whitelist de
  DOMPurify se ampliará a las clases que Shiki produce (`shiki`,
  `line`, `language-X`, prefijos de token estables).
- GitHub Pages sirve el `.css` con compresión automática (`Content-
  Encoding: gzip`), por lo que el budget se mide sobre el archivo
  gzip-comprimido.

---

## Out of Scope

- Themes claros o switch dark/light.
- Highlighting de diffs con coloreado +/-/contexto en rojo/verde (se
  evaluará en una iteración futura si se necesita).
- Runtime JS highlighters (Prism, highlight.js) — viola la filosofía.
- Botón copy-to-clipboard (requiere JS runtime).
- Line numbers.
- Soporte para lenguajes custom (Bicep, Pulumi YAML) si no están en
  Shiki — fallback es suficiente.
- Highlighting de bloques fuera del blog (interviews, talks, speaking,
  now): no aplican hoy. Si se necesita en el futuro, se extiende el
  builder correspondiente con la misma utilidad compartida.
- Internacionalización del log de build (mantiene español/inglés
  pragmático).

---

## Edge cases adicionales / decisiones pendientes para `/speckit.plan`

- Forma del enlace al stylesheet: ¿una sola entrada en el `<head>` o
  preload? (Decidir en plan; alta probabilidad: `<link rel="stylesheet">`
  estándar).
- ¿El stylesheet se commitea o se regenera cada build? Recomendación:
  **commitearlo** para mantener reproducibilidad y poder cubrirlo con
  byte-budgets sin construirlo en CI.
- ¿Versionado del CSS con hash en filename para cacheo? Se difiere a
  spec posterior si se necesita.

---

## Constitución relevante

- **III — Sitio 100% estático** (Shiki opera build-time, sin runtime).
- **IV — Cero dependencias JS de terceros sin justificación**
  (Shiki es devDep; justificación en research).
- **V — Fonts y assets self-hosted** (el `.css` generado es
  self-hosted, no se baja de CDN).
- **VII — Performance es feature** (budget ≤ 5 KB gzip + carga
  condicional).
- **VIII — Seguridad por defecto** (CSP intacta, sin `'unsafe-inline'`,
  sin hashes nuevos).
- **IX — Cada PR pasa todas las gates**.
