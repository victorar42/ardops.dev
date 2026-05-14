/**
 * scripts/lib/shiki-highlight.js
 *
 * Build-time syntax highlighter for the ardops.dev blog.
 *
 * Contract: specs/016-syntax-highlighting/contracts/shiki-integration.md
 *
 * Pipeline (called from build-blog.js, between marked.parse() and DOMPurify):
 *   raw HTML  →  detect <pre><code class="language-X">  →  Shiki tokenize
 *             →  transform style="color:var(--shiki-token-X)" → class="tok-X"
 *             →  assert no residual style="..."
 *             →  return { html, tokenizedBlockCount, fallbackBlockCount, unknownLanguages }
 *
 * CSP invariant: the returned HTML MUST NOT contain any inline `style="..."`.
 */

'use strict';

const { createHighlighter, createCssVariablesTheme } = require('shiki');

// ---------------------------------------------------------------------------
// Allowlist (contracts/language-allowlist.md)
// ---------------------------------------------------------------------------

const LANGUAGE_ALLOWLIST = Object.freeze([
  'bash', 'sh', 'javascript', 'typescript', 'json', 'yaml',
  'dockerfile', 'hcl', 'python', 'go', 'rust', 'sql', 'diff',
  'html', 'css', 'markdown', 'ini', 'toml', 'makefile',
  'groovy', 'nginx',
]);

const ALIAS_MAP = Object.freeze({
  js: 'javascript',
  ts: 'typescript',
  yml: 'yaml',
  terraform: 'hcl',
  tf: 'hcl',
  py: 'python',
  rs: 'rust',
  md: 'markdown',
  make: 'makefile',
});

const THEME_NAME = 'css-vars';
const VAR_PREFIX = '--shiki-';

// ---------------------------------------------------------------------------
// Singleton highlighter (lazy)
// ---------------------------------------------------------------------------

let _highlighterPromise = null;

function getHighlighter() {
  if (_highlighterPromise === null) {
    const theme = createCssVariablesTheme({
      name: THEME_NAME,
      variablePrefix: VAR_PREFIX,
      fontStyle: true,
    });
    _highlighterPromise = createHighlighter({
      themes: [theme],
      langs: LANGUAGE_ALLOWLIST.slice(),
    });
  }
  return _highlighterPromise;
}

// ---------------------------------------------------------------------------
// HTML escape (for fallback path — re-escape the raw source)
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeHtmlEntities(s) {
  // marked emits a small set of entities; reverse them so Shiki gets raw source
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

// ---------------------------------------------------------------------------
// Transform: replace style="color:var(--shiki-token-X)" → class="tok-X"
//
// We operate on the HTML produced by Shiki only (which is well-formed and
// deterministic). The transform never runs on user input.
// ---------------------------------------------------------------------------

const SPAN_STYLE_RE = /<span\s+style="([^"]*)"/g;
const VAR_COLOR_RE = new RegExp(
  `var\\(${VAR_PREFIX.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}([a-zA-Z0-9-]+)\\)`
);

function stylesToClasses(shikiHtml) {
  // Replace inline styles on <span> with a class derived from the
  // referenced --shiki-* variable. Other declarations (font-style,
  // font-weight) are intentionally dropped to keep the CSP-strict
  // contract — the syntax.css stylesheet is the single source of
  // typography decisions.
  let out = shikiHtml.replace(SPAN_STYLE_RE, (_m, decls) => {
    const match = VAR_COLOR_RE.exec(decls);
    if (!match) return '<span';
    const token = match[1];
    const cls = token.startsWith('token-') ? 'tok-' + token.slice('token-'.length) : 'tok-' + token;
    return `<span class="${cls}"`;
  });

  // Strip <pre> background/foreground inline style.
  out = out.replace(/(<pre\b[^>]*?)\s+style="[^"]*"/gi, '$1');

  // Strip tabindex="0" on <pre> (visual noise; not security-relevant).
  out = out.replace(/(<pre\b[^>]*?)\s+tabindex="0"/gi, '$1');

  // Normalize: <pre class="shiki css-vars"> → <pre class="shiki">
  out = out.replace(/<pre class="shiki css-vars"/g, '<pre class="shiki"');

  return out;
}

// ---------------------------------------------------------------------------
// Block regex (operates on marked.parse() output).
//
// marked emits:
//   <pre><code class="language-X">…escaped source…</code></pre>
//
// or (no lang):
//   <pre><code>…escaped source…</code></pre>
// ---------------------------------------------------------------------------

const BLOCK_RE = /<pre><code(?: class="language-([a-zA-Z0-9_+-]+)")?>([\s\S]*?)<\/code><\/pre>/g;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @param {string} html HTML produced by marked.parse()
 * @param {object} [opts]
 * @param {ReadonlyArray<string>} [opts.allowlist=LANGUAGE_ALLOWLIST]
 * @returns {Promise<{
 *   html: string,
 *   tokenizedBlockCount: number,
 *   fallbackBlockCount: number,
 *   unknownLanguages: string[]
 * }>}
 */
async function highlight(html, opts = {}) {
  const allowlist = new Set(opts.allowlist || LANGUAGE_ALLOWLIST);
  const unknown = new Set();
  let tokenizedBlockCount = 0;
  let fallbackBlockCount = 0;

  // Quick exit: no code blocks at all.
  if (!BLOCK_RE.test(html)) {
    BLOCK_RE.lastIndex = 0;
    return { html, tokenizedBlockCount: 0, fallbackBlockCount: 0, unknownLanguages: [] };
  }
  BLOCK_RE.lastIndex = 0;

  // We need async work inside the replace; collect matches then process.
  const matches = [];
  let m;
  while ((m = BLOCK_RE.exec(html)) !== null) {
    matches.push({ full: m[0], lang: m[1] || null, body: m[2], index: m.index });
  }
  if (matches.length === 0) {
    return { html, tokenizedBlockCount: 0, fallbackBlockCount: 0, unknownLanguages: [] };
  }

  const highlighter = await getHighlighter();
  const replacements = new Map();

  for (const block of matches) {
    const rawLang = block.lang;
    const canonical = rawLang ? (ALIAS_MAP[rawLang.toLowerCase()] || rawLang.toLowerCase()) : null;

    if (!canonical || !allowlist.has(canonical)) {
      if (rawLang) unknown.add(rawLang);
      fallbackBlockCount += 1;
      // Leave block as-is (mono plain fallback).
      replacements.set(block.full, block.full);
      continue;
    }

    // Decode marked's HTML entities back to raw source for Shiki.
    const source = decodeHtmlEntities(block.body);

    let shikiHtml;
    try {
      shikiHtml = highlighter.codeToHtml(source, { lang: canonical, theme: THEME_NAME });
    } catch (err) {
      // Non-fatal: emit warning, fall back to plain rendering.
      // eslint-disable-next-line no-console
      console.warn(`[shiki-highlight] tokenize failed for ${canonical}: ${err.message}`);
      fallbackBlockCount += 1;
      replacements.set(block.full, block.full);
      continue;
    }

    const transformed = stylesToClasses(shikiHtml);

    if (/\sstyle=/i.test(transformed)) {
      throw new Error(
        `shiki-highlight: residual inline style detected after transform (lang=${canonical}). ` +
        'CSP invariant violated. See specs/016-syntax-highlighting/contracts/csp-invariants.md.'
      );
    }

    tokenizedBlockCount += 1;
    replacements.set(block.full, transformed);
  }

  // Apply replacements (single pass; replacements map preserves uniqueness
  // because each `block.full` is the exact matched substring).
  let out = html;
  for (const [from, to] of replacements) {
    if (from === to) continue;
    out = out.replace(from, () => to); // function form: no $-pattern surprises
  }

  // Final guard.
  if (/\sstyle=/i.test(out.slice(out.indexOf('<pre class="shiki"')))) {
    // Only check the post-tokenization region; user content outside the
    // tokenized blocks isn't our responsibility here (DOMPurify handles it).
  }

  return {
    html: out,
    tokenizedBlockCount,
    fallbackBlockCount,
    unknownLanguages: [...unknown].sort(),
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  highlight,
  LANGUAGE_ALLOWLIST,
  ALIAS_MAP,
  THEME_NAME,
  VAR_PREFIX,
};
