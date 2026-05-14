# Phase 1 — Data Model: Syntax highlighting build-time

**Feature**: 016-syntax-highlighting | **Date**: 2026-05-14

Modelo de datos del build (no hay base de datos; las "entidades" son
estructuras en memoria y artefactos en filesystem).

---

## Entidad: `CodeBlock`

Representa un bloque ```` ``` ```` ` detectado en el HTML que produce
`marked.parse()`.

| Campo | Tipo | Origen | Restricciones |
|---|---|---|---|
| `language` | `string | null` | `class="language-X"` del `<code>` | minúsculas; `null` si el bloque no trae fenced lang. |
| `source` | `string` | innerText del `<code>` | conservado tal cual; no se trimea. |
| `isInAllowlist` | `boolean` | derivado: `LanguageAllowlist.includes(language)` | `false` si `language === null`. |
| `tokenizedHtml` | `string | null` | salida de Shiki + transform | `null` si `isInAllowlist === false` (fallback). |

**Reglas**:
- Bloques inline `<code>` (sin `<pre>` padre) NUNCA son `CodeBlock`; se
  ignoran por el highlighter (FR / edge case).
- Si `language` no está en allowlist → emit warning non-fatal y dejar
  `tokenizedHtml = null` (fallback al render mono actual).

---

## Entidad: `LanguageAllowlist`

Constante exportada por `scripts/lib/shiki-highlight.js`.

```js
const LANGUAGE_ALLOWLIST = Object.freeze([
  'bash', 'sh', 'javascript', 'typescript', 'json', 'yaml',
  'dockerfile', 'hcl', 'python', 'go', 'rust', 'sql', 'diff',
  'html', 'css', 'markdown', 'ini', 'toml', 'makefile',
  'groovy', 'nginx',
]);
```

**Invariantes**:
- 21 elementos exactos (verificable por test).
- Todos los strings deben ser nombres reconocidos por Shiki (validado
  al boot del builder).
- Modificar la allowlist requiere bump menor del `plan.md` y
  regeneración de `syntax.css` (mismo CSS sirve para todos los
  lenguajes; cambia solo si cambia el tema).

---

## Entidad: `SyntaxTheme`

Identificador del tema único.

| Campo | Valor |
|---|---|
| `id` | `"github-dark-default"` |
| `mode` | `"cssVariables"` |
| `classPrefix` | `"tok-"` |
| `paletteCssFile` | `"assets/css/syntax.css"` |

**Invariante**: cambiar `id` requiere PR a la spec (cambio observable
de identidad visual → Principio II) y regeneración del CSS.

---

## Entidad: `SyntaxStylesheet`

Archivo `assets/css/syntax.css`. Auto-generado por
`scripts/build-syntax-css.js`.

| Atributo | Valor / Restricción |
|---|---|
| Path | `assets/css/syntax.css` |
| Encoding | UTF-8, LF, sin BOM |
| Tamaño | ≤ 5 KB gzip (`gzip -c -9` ≤ 5120 B) |
| Selectores permitidos | `pre.shiki`, `pre.shiki code`, `.line`, `.tok-*` |
| Selectores prohibidos | cualquiera que filtre por id, atributo `style`, o pseudoclases interactivas |
| Header | bloque comentario con `id` del tema y `LANGUAGE_ALLOWLIST.length` |

**Reproducibilidad**: el archivo se commitea. CI ejecuta el builder de
CSS y diff contra el archivo en repo; si difiere, gate falla.

---

## Entidad: `PostArtifact`

Archivo `blog/<slug>.html` emitido por `build-blog.js`.

| Campo | Tipo | Notas |
|---|---|---|
| `slug` | `string` | derivado del frontmatter o filename |
| `head.stylesheets` | `string[]` | incluye `/assets/css/syntax.css` **sólo si** `tokenizedBlockCount >= 1` |
| `body.html` | `string` | HTML sanitizado post-Shiki; contiene `<pre class="shiki"><code>...<span class="line"><span class="tok-keyword">...</span>...</span></code></pre>` |
| `tokenizedBlockCount` | `integer ≥ 0` | metadata interna; se loguea pero no se escribe en HTML |

**Invariantes**:
- Cero `style="..."` en `body.html` (verificable por gate).
- Si `tokenizedBlockCount === 0`, **no** existe el `<link>` a `syntax.css`.
- El HTML es **idempotente**: dos builds del mismo Markdown → mismo
  `body.html` byte-a-byte.

---

## Entidad: `BuildLog`

Salida en stdout del builder durante el run.

```text
[blog] processing 2026-05-14-mi-post.md
[blog]   → 3 code block(s) highlighted (bash, typescript, yaml)
[blog]   → 1 code block(s) fallback (unknown: cobol)
[blog]   ✓ blog/mi-post.html (12 345 B)
```

**Campos visibles**:
- `highlightedCount`: bloques tokenizados.
- `fallbackCount`: bloques en fallback.
- `unknownLanguages`: array de lenguajes vistos fuera de allowlist
  (warning, no error).
- `driftFiles`: array de archivos con drift en modo `--check` (error,
  exit 2).

---

## Transiciones de estado

```text
Markdown source
    │  marked.parse()
    ▼
HTML con <pre><code class="language-X">  (CodeBlock candidates)
    │  detect & filter (LanguageAllowlist)
    ▼
HTML con bloques tokenizados (style="color: var(--X)")
    │  transform: style="color: var(--X)" → class="tok-X"
    ▼
HTML pre-tokenizado limpio (cero style="...")
    │  sanitizeHtml() / DOMPurify
    ▼
HTML final (PostArtifact.body.html)
    │  template wrap + condicional <link> a syntax.css
    ▼
blog/<slug>.html en disco
```

Cualquier paso que reintroduzca `style="..."` es bloqueado:
- DOMPurify lo strippea silenciosamente.
- `tests/no-inline-styles-blog.sh` lo detecta y falla el build CI.
