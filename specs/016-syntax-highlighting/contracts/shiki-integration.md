# Contract: Shiki integration

**Feature**: 016-syntax-highlighting

Contrato del módulo `scripts/lib/shiki-highlight.js` y de cómo
`scripts/build-blog.js` lo invoca.

---

## API pública

```js
// scripts/lib/shiki-highlight.js

const LANGUAGE_ALLOWLIST = Object.freeze([...]); // 21 strings

/**
 * @param {string} html  HTML producido por marked.parse()
 * @param {object} [opts]
 * @param {string[]} [opts.allowlist=LANGUAGE_ALLOWLIST]
 * @returns {Promise<{
 *   html: string,
 *   tokenizedBlockCount: number,
 *   fallbackBlockCount: number,
 *   unknownLanguages: string[]
 * }>}
 */
async function highlight(html, opts) { /* ... */ }

module.exports = { highlight, LANGUAGE_ALLOWLIST };
```

---

## Pre-condiciones

- `html` es UTF-8 válido producido por `marked.parse()`.
- `html` puede contener cero o más `<pre><code class="language-X">…</code></pre>`.
- Los bloques inline (`<code>` sin `<pre>` padre) **no** se procesan.

## Post-condiciones

- El HTML retornado **no contiene** ningún `style="..."` (verificable
  con regex `/\sstyle=/i`).
- Cada `<pre><code class="language-X">` con `X` en allowlist se
  reemplaza por:
  ```html
  <pre class="shiki"><code class="language-X">
    <span class="line"><span class="tok-keyword">…</span>…</span>
    …
  </code></pre>
  ```
- Cada `<pre><code class="language-X">` con `X` fuera de allowlist se
  conserva tal cual (fallback) y `X` se agrega a
  `unknownLanguages` (deduplicado).
- Cada `<pre><code>` sin `language-X` se conserva tal cual.
- `tokenizedBlockCount` = número de bloques transformados con éxito.
- `fallbackBlockCount` = número de bloques no transformados.

## Errores

- Si Shiki falla al cargar las gramáticas de la allowlist al boot →
  throw `Error('Shiki bootstrap failed: <reason>')`. El builder
  termina con exit 1.
- Si una gramática individual falla en runtime para un bloque
  específico → log warning, dejar el bloque como fallback, continuar.
  **No** abortar.

---

## Integración en `build-blog.js`

```js
const { highlight } = require('./lib/shiki-highlight');

// ... después de marked.parse(bodyMd, ...)
const rawHtml = marked.parse(bodyMd, { /* ... */ });

const { html: highlightedHtml, tokenizedBlockCount, unknownLanguages }
  = await highlight(rawHtml);

if (unknownLanguages.length > 0) {
  console.warn(
    `[blog]   ⚠ unknown language(s): ${unknownLanguages.join(', ')} — fallback`
  );
}

const cleanHtml = sanitizeHtml(highlightedHtml);

const hasSyntax = tokenizedBlockCount > 0;
const headExtra = hasSyntax
  ? '<link rel="stylesheet" href="/assets/css/syntax.css">'
  : '';
```

---

## Orden de ejecución (invariante)

1. `gray-matter` → frontmatter + bodyMd.
2. `marked.parse(bodyMd)` → rawHtml.
3. **`highlight(rawHtml)`** → highlightedHtml + metadatos.
4. `sanitizeHtml(highlightedHtml)` (DOMPurify) → cleanHtml.
5. Template wrap (head + body + footer); inyecta `<link>` solo si
   `hasSyntax`.
6. Write file (o compare si `--check`).

Cualquier reordenamiento (por ejemplo highlight DESPUÉS de sanitize)
es violación contractual: DOMPurify removería el HTML intermedio.

---

## Modo `--check`

- Salta el `fs.writeFileSync`.
- Lee `blog/<slug>.html` del disco.
- `if (existing !== generated) { driftFiles.push(slug); }`
- Al final: si `driftFiles.length > 0` → exit 2 con lista.
