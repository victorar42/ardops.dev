# Backlog 10 — Syntax highlighting build-time (Shiki)

> **Estado**: backlog · **Prioridad**: P4 (esperar a publicar posts con código)
> **Esfuerzo estimado**: S (~3-4 horas) · **ROI networking**: medio (UX de lectura)

---

## Por qué

Hoy los `<pre><code>` en posts se renderizan en monoespaciado plano sobre
el fondo `--bg-secondary` con un rail accent. Es legible pero **sin
syntax highlighting**. Para un blog DevSecOps, los snippets de código son
contenido principal — vale la pena pulir su lectura.

**Shiki** (de Anthony Fu, usado por VitePress, Astro) hace highlighting
**en build-time**, emite HTML con clases pre-resueltas y colores inline,
y **no requiere JS en runtime**. Compatible con CSP estricta.

## Objetivo

Integrar Shiki en `scripts/build-blog.js` para que cada `<pre><code class="language-X">`
se transforme en HTML con tokens coloreados, sin runtime JS.

## Alcance funcional (FRs)

- **FR-01** — Detectar `<pre><code class="language-{lang}">` en el body
  Markdown renderizado y aplicar Shiki.
- **FR-02** — Lenguajes soportados (allowlist):
  bash, sh, javascript, typescript, json, yaml, dockerfile, hcl (terraform),
  python, go, rust, sql, diff, html, css, markdown, ini, toml, makefile,
  groovy (jenkins), nginx.
- **FR-03** — Tema único: tema oscuro alineado con la paleta del sitio.
  Opciones: `github-dark`, `one-dark-pro`, `tokyo-night`. Decidir en
  research.md basado en contraste con `--bg-secondary`.
- **FR-04** — Si `language-{lang}` no está en allowlist o no se especifica:
  fallback al render actual (mono plano sobre `--bg-secondary`).
- **FR-05** — El HTML generado no debe romper la CSP `style-src 'self'`:
  - Opción A: Shiki emite `<span style="color:#XXX">` inline → requeriría
    `'unsafe-inline'` en `style-src`. **No aceptable.**
  - Opción B: Usar Shiki con modo `cssVariables` que emite clases CSS
    + un stylesheet generado, linkeado como `<link rel="stylesheet">`.
    **Preferida.**
- **FR-06** — El stylesheet generado se sirve en
  `assets/css/syntax-{theme}.css`, generado en build, < 5 KB gzip.
- **FR-07** — `--check` mode debe detectar drift entre Markdown fuente y
  HTML compilado.

## Alcance técnico

- **Nueva devDep**: `shiki` (~3MB unpacked, build-time only, NO runtime).
  Justificable: alternativa (Prism) requiere runtime JS y CSS más grande.
- Modifica `scripts/build-blog.js`:
  - Después de `marked.parse()`, antes de DOMPurify, pasar HTML por
    procesador Shiki (opera sobre AST con jsdom).
  - Genera `assets/css/syntax.css` si no existe o cambió el tema.
- `assets/css/syntax.css` se incluye en `<head>` de cada post solo si el
  post tiene al menos un bloque de código (gate de tamaño).
- DOMPurify whitelist debe permitir las clases que Shiki emite
  (`shiki`, `line`, `language-X`).

## Gates / tests

- `tests/blog-schema.sh`: agregar fixture con bloques de código en
  varios lenguajes; verificar que Shiki no rompe el render.
- `tests/byte-budgets.sh` (de Backlog 07): `assets/css/syntax.css`
  debe ser < 5 KB gzip.
- DOMPurify XSS: confirmar que el HTML post-Shiki sigue siendo sanitizado.

## Out of scope

- Themes claros / múltiples temas — uno solo, dark.
- Diff highlighting con `+`/`-` rojo/verde — opcional, decidir en spec.
- Syntax highlighting en runtime (Prism, highlight.js) — viola filosofía.
- Copy-to-clipboard button — requiere JS, defer.
- Line numbers — opcional, decidir en spec.
- Lenguajes custom (Bicep, Pulumi YAML, etc.) si no están en Shiki —
  fallback acceptable.

## Edge cases

- Bloque sin lenguaje (` ``` ` sin tag): fallback mono plano.
- Bloque con lenguaje fuera de allowlist: fallback + warning en build (no
  fatal).
- Bloque vacío: render mínimo, sin error.
- Markdown inline `code`: NO procesar con Shiki (solo bloques con
  `<pre><code>`).
- Posts viejos sin bloques de código: no incluir `syntax.css`
  (perf budget).

## Criterios de aceptación

- AC-01: Post con bloque ```` ```bash ```` muestra colores correctos.
- AC-02: Post sin bloques de código no carga `syntax.css`.
- AC-03: CSP se mantiene `style-src 'self'` (cero `unsafe-inline`).
- AC-04: `bash tests/blog-schema.sh` pasa con fixture multi-lang.
- AC-05: `assets/css/syntax.css` < 5 KB gzip.
- AC-06: `git diff package.json` muestra solo `shiki` agregada como
  **devDependency** (no dependency).

## Constitución relevante

- III (devDeps justificadas), IV (security — sin runtime JS), V (perf
  budget), IX (validation).

## Notas para `/specify`

> "Integrar Shiki en build-time para syntax highlighting de bloques de
> código en posts. Modo cssVariables (no inline styles, respeta CSP).
> Allowlist de lenguajes. Stylesheet generado < 5 KB gzip, solo incluido
> si el post tiene código. Fallback al render actual si lenguaje fuera de
> allowlist. Esperar a publicar 2+ posts con código antes de implementar."
