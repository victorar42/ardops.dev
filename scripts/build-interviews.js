#!/usr/bin/env node
/**
 * scripts/build-interviews.js — spec 003
 *
 * Reads markdown files from `content/interviews/*.md`, validates frontmatter,
 * sanitizes the body via marked + DOMPurify (build-time only), and emits:
 *
 *   <out>/<slug>.html        — individual interview page
 *   <out>/index.html         — listing shell (cards rendered by /assets/js/interviews.js)
 *   <out>/index.json         — minimal index for the search/filter UI
 *   <out>/images/<file>      — copied from content/interviews/images/
 *
 * CLI flags:
 *   --strict             fail with exit 1 if any frontmatter error is found
 *   --include-fixtures   include MDs under content/interviews/__fixtures__/ (CI only).
 *                        Files prefixed with `invalid-` are skipped (negative
 *                        tests; covered by dedicated assertions).
 *   --out <dir>          output directory (default: interviews/)
 *   --dry-run            validate only, do not write artifacts
 *
 * Constraints:
 *   - Runtime bundle of the site loads ZERO of these dependencies.
 *   - All HTML emitted has a strict CSP via meta http-equiv (matches site CSP).
 *   - DOMPurify whitelist removes <script>, javascript: URIs, on* handlers.
 *
 * See specs/003-interviews-section/ for spec, plan, contracts, and quickstart.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { renderHeader, renderFooter } = require('./lib/layout');
const {
  serialize: serializeJsonLd,
  itemListSchema,
  breadcrumbsSchema,
} = require('./lib/jsonld');
const { META_REFERRER } = require('./lib/head');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(REPO_ROOT, 'content', 'interviews');
const IMAGES_DIR = path.join(CONTENT_DIR, 'images');
const FIXTURES_DIR = path.join(CONTENT_DIR, '__fixtures__');

const SLUG_RE = /^[a-z0-9-]{1,80}$/;
const TAG_RE = /^[a-z0-9-]{1,32}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FILENAME_DATE_PREFIX_RE = /^(\d{4}-\d{2})-(.+)$/;
const HTTPS_URL_RE = /^https:\/\/[\w.-]+(\/[\w./%#?&=+-]*)?$/i;

const SUMMARY_MIN = 20;
const SUMMARY_MAX = 280;
const TITLE_MAX = 120;
const NAME_MAX = 80;
const TAGS_MIN = 1;
const TAGS_MAX = 10;

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; " +
  "img-src 'self' data:; connect-src 'self'; object-src 'none'; " +
  "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests";

// DOMPurify configuration aligned with contracts/csp-policy.md
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em',
    'code', 'pre', 'blockquote', 'a', 'br', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'title', 'id', 'class', 'lang'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#)/i,
  FORBID_TAGS: [
    'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'img',
  ],
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur',
    'onchange', 'onsubmit', 'style',
  ],
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = {
    strict: false,
    includeFixtures: false,
    dryRun: false,
    out: 'interviews/',
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--strict') opts.strict = true;
    else if (a === '--include-fixtures') opts.includeFixtures = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--out') opts.out = argv[++i];
    else if (a.startsWith('--out=')) opts.out = a.slice(6);
    else if (a === '--help' || a === '-h') {
      console.log(
        'usage: build-interviews.js [--strict] [--include-fixtures] [--out <dir>] [--dry-run]'
      );
      process.exit(0);
    } else {
      console.error(`unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonForScript(obj) {
  // Safe inlining inside <script type="application/ld+json">
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function readingTimeFromMarkdown(md) {
  const stripped = String(md || '').replace(/```[\s\S]*?```/g, ' ');
  const words = stripped.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function deriveSlug(filename) {
  // filename: bare name with .md extension
  const base = path.basename(filename, '.md');
  const m = FILENAME_DATE_PREFIX_RE.exec(base);
  return m ? m[2] : base;
}

function formatDateHuman(iso) {
  // YYYY-MM-DD → "15 de mayo de 2026" (es-CR)
  const [y, mo, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dt);
}

function initialsOf(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '··';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---------------------------------------------------------------------------
// Markdown pipeline
// ---------------------------------------------------------------------------

function configureMarked() {
  // Custom renderer: drop raw HTML inline; ensure code blocks are escaped.
  const renderer = new marked.Renderer();
  // Drop any inline HTML the author may have written.
  renderer.html = function () {
    return '';
  };
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false,
    pedantic: false,
    renderer,
  });
}

function buildPurifier() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  // dompurify on Node requires a DOM window
  const purify = createDOMPurify(dom.window);
  return (html) => purify.sanitize(html, PURIFY_CONFIG);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateFrontmatter(rel, data, ctx) {
  const errors = [];
  function err(field, msg) {
    errors.push({ file: rel, field, msg });
  }

  if (typeof data !== 'object' || data === null) {
    err('', 'frontmatter must be a YAML mapping');
    return errors;
  }

  // title
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    err('title', 'missing or empty');
  } else if (data.title.length > TITLE_MAX) {
    err('title', `must be ≤ ${TITLE_MAX} chars (got ${data.title.length})`);
  } else if (/\r|\n/.test(data.title)) {
    err('title', 'must not contain newlines');
  }

  // interviewee
  if (typeof data.interviewee !== 'object' || data.interviewee === null) {
    err('interviewee', 'missing or not an object');
  } else {
    for (const key of ['name', 'role', 'company']) {
      const v = data.interviewee[key];
      if (typeof v !== 'string' || v.trim().length === 0) {
        err(`interviewee.${key}`, 'missing or empty');
      } else if (v.length > NAME_MAX) {
        err(`interviewee.${key}`, `must be ≤ ${NAME_MAX} chars`);
      }
    }
    if (data.interviewee.image != null) {
      const img = data.interviewee.image;
      if (typeof img !== 'string' || img.trim().length === 0) {
        err('interviewee.image', 'must be a non-empty string when present');
      } else {
        const abs = path.join(CONTENT_DIR, img);
        if (!fs.existsSync(abs)) {
          err('interviewee.image', `points to non-existent file: content/interviews/${img}`);
        }
      }
    }
    if (data.interviewee.linkedin != null) {
      const url = data.interviewee.linkedin;
      if (typeof url !== 'string' || !HTTPS_URL_RE.test(url)) {
        err('interviewee.linkedin', 'must be an https:// URL');
      }
    }
  }

  // date
  let dateString = null;
  if (data.date == null) {
    err('date', 'missing');
  } else if (data.date instanceof Date && !isNaN(data.date)) {
    // gray-matter parses YYYY-MM-DD as a Date; reformat to ISO date
    const y = data.date.getUTCFullYear();
    const mo = String(data.date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(data.date.getUTCDate()).padStart(2, '0');
    dateString = `${y}-${mo}-${d}`;
  } else if (typeof data.date === 'string' && DATE_RE.test(data.date)) {
    const [y, mo, d] = data.date.split('-').map(Number);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === mo - 1 &&
      dt.getUTCDate() === d
    ) {
      dateString = data.date;
    } else {
      err('date', `not a valid calendar date: ${data.date}`);
    }
  } else {
    err('date', `must be ISO date YYYY-MM-DD (got ${typeof data.date})`);
  }

  // tags
  if (!Array.isArray(data.tags)) {
    err('tags', 'must be a list');
  } else if (data.tags.length < TAGS_MIN || data.tags.length > TAGS_MAX) {
    err('tags', `must contain ${TAGS_MIN}..${TAGS_MAX} entries (got ${data.tags.length})`);
  } else {
    data.tags.forEach((t, i) => {
      if (typeof t !== 'string' || !TAG_RE.test(t)) {
        err(`tags[${i}]`, `'${t}' violates pattern ^[a-z0-9-]{1,32}$`);
      }
    });
  }

  // summary
  if (typeof data.summary !== 'string' || data.summary.trim().length === 0) {
    err('summary', 'missing or empty');
  } else {
    const len = Array.from(data.summary).length;
    if (len < SUMMARY_MIN || len > SUMMARY_MAX) {
      err('summary', `must be ${SUMMARY_MIN}..${SUMMARY_MAX} chars (got ${len})`);
    }
  }

  // published
  if (typeof data.published !== 'boolean') {
    err('published', `must be boolean (got ${typeof data.published})`);
  }

  // slug (derived)
  if (!SLUG_RE.test(ctx.slug)) {
    err('', `slug '${ctx.slug}' violates pattern ^[a-z0-9-]{1,80}$ (filename: ${rel})`);
  }

  return errors.map((e) => ({ ...e, dateString }));
}

// ---------------------------------------------------------------------------
// Site shell (header / footer)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Site shell (header / footer) — delegated to scripts/lib/layout.js (spec 008)
// ---------------------------------------------------------------------------

function siteHeader() {
  return renderHeader('/interviews/');
}

function siteFooter() {
  return renderFooter();
}

function commonHead({ title, description, canonical, ogType, ogImage, extraJsonLd, extraJsonLdBlocks }) {
  const ogImg = ogImage || 'https://ardops.dev/public/og/og-default.png';
  const blocks = Array.isArray(extraJsonLdBlocks) ? extraJsonLdBlocks : [];
  const blocksHtml = blocks
    .map((b) => `\n\n  ${serializeJsonLd(b).replace(/\n/g, '\n  ')}`)
    .join('');
  return `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  ${META_REFERRER}
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="Victor Josue Ardón Rojas">
  <meta name="theme-color" content="#0a0e17">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="${escapeHtml(canonical)}">

  <meta property="og:type" content="${escapeHtml(ogType)}">
  <meta property="og:locale" content="es_CR">
  <meta property="og:site_name" content="ardops.dev">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(ogImg)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImg)}">

  <link rel="icon" href="/public/favicon/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="/public/favicon/favicon.ico" sizes="any">
  <link rel="manifest" href="/public/favicon/site.webmanifest">

  <link rel="preload" href="/assets/fonts/outfit-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/jetbrains-mono-400.woff2" as="font" type="font/woff2" crossorigin>

  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/motion.css">
  <link rel="stylesheet" href="/assets/css/layout.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="stylesheet" href="/assets/css/interviews.css">

  <script defer src="/assets/js/main.js"></script>${extraJsonLd ? `\n\n  <script type="application/ld+json">\n${extraJsonLd}\n  </script>` : ''}${blocksHtml}`;
}

// ---------------------------------------------------------------------------
// Templates: individual interview page
// ---------------------------------------------------------------------------

function renderAvatar(interviewee, { size = 64 } = {}) {
  const altName = escapeHtml(interviewee.name);
  if (interviewee.image) {
    return `<img class="interview-avatar" src="/interviews/${escapeHtml(interviewee.image)}" alt="Foto de ${altName}" width="${size}" height="${size}" loading="lazy" decoding="async">`;
  }
  const initials = escapeHtml(initialsOf(interviewee.name));
  return `<svg class="interview-avatar interview-avatar--fallback" role="img" aria-label="Avatar de ${altName}" viewBox="0 0 64 64" width="${size}" height="${size}"><circle cx="32" cy="32" r="32" fill="rgba(34,211,238,0.15)"/><text x="32" y="38" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="22" font-weight="600" fill="#22d3ee">${initials}</text></svg>`;
}

function renderInterviewHtml(it) {
  const url = `https://ardops.dev/interviews/${it.slug}.html`;
  const ogImage = it.interviewee.image
    ? `https://ardops.dev/interviews/${it.interviewee.image}`
    : 'https://ardops.dev/public/og/og-default.png';

  const jsonLd = escapeJsonForScript({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: it.title,
    datePublished: it.date,
    dateModified: it.date,
    author: { '@id': 'https://ardops.dev/#person' },
    about: {
      '@type': 'Person',
      name: it.interviewee.name,
      jobTitle: it.interviewee.role,
      worksFor: { '@type': 'Organization', name: it.interviewee.company },
    },
    keywords: it.tags.join(', '),
    mainEntityOfPage: url,
  });

  const tags = it.tags
    .map(
      (t) =>
        `          <li><a class="interview-tag" href="/interviews/?tag=${encodeURIComponent(t)}">#${escapeHtml(t)}</a></li>`
    )
    .join('\n');

  const linkedin = it.interviewee.linkedin
    ? `\n              <a class="interview-linkedin" href="${escapeHtml(it.interviewee.linkedin)}" rel="noopener noreferrer">LinkedIn</a>`
    : '';

  return `<!doctype html>
<html lang="es">
<head>
${commonHead({
  title: `${it.title} — Entrevistas — ardops.dev`,
  description: it.summary,
  canonical: url,
  ogType: 'article',
  ogImage,
  extraJsonLd: jsonLd,
  extraJsonLdBlocks: [
    breadcrumbsSchema([
      { name: 'Home', item: 'https://ardops.dev/' },
      { name: 'Entrevistas', item: 'https://ardops.dev/interviews/' },
      { name: it.title, item: url },
    ]),
  ],
})}
</head>
<body>

${siteHeader()}

  <main id="main" class="interview-page">
    <article class="interview" aria-labelledby="interview-title">
      <header class="interview-header">
        <p class="interview-eyebrow"><a href="/interviews/">← Entrevistas</a></p>
        <h1 id="interview-title" class="interview-title">${escapeHtml(it.title)}</h1>
        <div class="interview-meta">
          <div class="interview-author">
            ${renderAvatar(it.interviewee, { size: 64 })}
            <div class="interview-author-info">
              <p class="interview-author-name">${escapeHtml(it.interviewee.name)}</p>
              <p class="interview-author-role">${escapeHtml(it.interviewee.role)} · ${escapeHtml(it.interviewee.company)}</p>${linkedin}
            </div>
          </div>
          <p class="interview-stats">
            <time datetime="${escapeHtml(it.date)}">${escapeHtml(formatDateHuman(it.date))}</time>
            <span aria-hidden="true"> · </span>
            <span>${it.readingTime} min de lectura</span>
          </p>
          <ul class="interview-tags">
${tags}
          </ul>
        </div>
      </header>

      <div class="interview-body">
${it.bodyHtml}
      </div>

      <footer class="interview-footer">
        <p><a class="btn btn-ghost" href="/interviews/">← Volver a todas las entrevistas</a></p>
      </footer>
    </article>
  </main>

${siteFooter()}

</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Templates: index (listing) page
// ---------------------------------------------------------------------------

function renderCardHtml(it) {
  const tags = (it.tags || [])
    .map((t) => `<li>#${escapeHtml(t)}</li>`)
    .join('');
  const avatar = renderAvatar(it.interviewee, { size: 56 }).replace(
    'class="interview-avatar"',
    'class="interview-card-avatar"'
  ).replace(
    'class="interview-avatar interview-avatar--fallback"',
    'class="interview-card-avatar"'
  );
  const minutes = (it.readingTime | 0);
  return (
    `<li class="interview-card">` +
      `<a class="interview-card-link" href="/interviews/${escapeHtml(it.slug)}.html">` +
        avatar +
        `<div class="interview-card-content">` +
          `<h2 class="interview-card-title">${escapeHtml(it.title)}</h2>` +
          `<p class="interview-card-author">${escapeHtml(it.interviewee.name)} · ${escapeHtml(it.interviewee.role)} · ${escapeHtml(it.interviewee.company)}</p>` +
          `<p class="interview-card-summary">${escapeHtml(it.summary)}</p>` +
          `<p class="interview-card-meta">` +
            `<time datetime="${escapeHtml(it.date)}">${escapeHtml(formatDateHuman(it.date))}</time>` +
            `<span aria-hidden="true"> · </span>` +
            `<span>${minutes} min</span>` +
          `</p>` +
          `<ul class="interview-card-tags">${tags}</ul>` +
        `</div>` +
      `</a>` +
    `</li>`
  );
}

function renderTagChipsHtml(interviews) {
  const TOP_TAGS = 20;
  const counts = new Map();
  for (const it of interviews) {
    for (const t of it.tags || []) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  const sorted = Array.from(counts.entries())
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .slice(0, TOP_TAGS);
  return sorted
    .map(
      ([tag, count]) =>
        `<button type="button" aria-pressed="false" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)} <span class="visually-hidden">(${count} entrevista${count === 1 ? '' : 's'})</span></button>`
    )
    .join('');
}

function renderIndexHtml(interviews) {
  const itemListItems = (interviews || []).map((it) => ({
    url: `https://ardops.dev/interviews/${it.slug}.html`,
    name: it.title,
  }));
  const cardsHtml = (interviews || []).map(renderCardHtml).join('');
  const chipsHtml = renderTagChipsHtml(interviews || []);
  const total = (interviews || []).length;
  const countText = total === 0 ? '' : (total === 1 ? '1 entrevista' : `${total} entrevistas`);
  return `<!doctype html>
<html lang="es">
<head>
${commonHead({
  title: 'Entrevistas — ardops.dev',
  description:
    'Conversaciones con profesionales del sector tecnológico: ingeniería, liderazgo, plataforma y aprendizajes de carrera.',
  canonical: 'https://ardops.dev/interviews/',
  ogType: 'website',
  extraJsonLdBlocks: [
    itemListSchema(itemListItems),
    breadcrumbsSchema([
      { name: 'Home', item: 'https://ardops.dev/' },
      { name: 'Entrevistas', item: 'https://ardops.dev/interviews/' },
    ]),
  ],
})}

  <script defer src="/assets/js/interviews.js"></script>
</head>
<body>

${siteHeader()}

  <main id="main" class="interviews-page">
    <header class="interviews-hero">
      <p class="section-label">// interviews</p>
      <h1>Entrevistas</h1>
      <p class="interviews-lede">Conversaciones con profesionales del sector tecnológico: ingeniería, liderazgo, plataforma y aprendizajes de carrera.</p>
    </header>

    <section class="interviews-controls" aria-label="Filtros de búsqueda">
      <label class="interviews-search">
        <span class="visually-hidden">Buscar entrevistas</span>
        <input
          type="search"
          id="interviews-search-input"
          name="q"
          placeholder="Buscar por nombre, empresa, tema…"
          autocomplete="off"
          spellcheck="false"
          enterkeyhint="search">
      </label>

      <div class="interviews-tag-filter" role="group" aria-label="Filtrar por tema" id="interviews-tag-filter">${chipsHtml}</div>

      <button type="button" class="interviews-clear btn btn-ghost" id="interviews-clear-btn" hidden>
        Limpiar filtros
      </button>
    </section>

    <p class="interviews-count" id="interviews-count" aria-live="polite" aria-atomic="true">${escapeHtml(countText)}</p>

    <ul class="interviews-list" id="interviews-list">${cardsHtml}</ul>

    <p class="interviews-empty" id="interviews-empty" hidden>
      No encontramos entrevistas que coincidan. Probá con otra búsqueda o quitá filtros.
    </p>

    <noscript>
      <p class="interviews-noscript">
        La búsqueda y el filtrado requieren JavaScript habilitado. Las entrevistas individuales son accesibles directamente desde su URL.
      </p>
    </noscript>

    <p class="back-cta"><a class="btn btn-ghost" href="/">← Volver al inicio</a></p>
  </main>

${siteFooter()}

</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// index.json
// ---------------------------------------------------------------------------

function renderIndexJson(interviews) {
  return JSON.stringify({
    version: 1,
    generated: new Date().toISOString(),
    interviews: interviews.map((it) => ({
      slug: it.slug,
      title: it.title,
      interviewee: {
        name: it.interviewee.name,
        role: it.interviewee.role,
        company: it.interviewee.company,
        image: it.interviewee.image || null,
      },
      date: it.date,
      tags: it.tags,
      summary: it.summary,
      readingTime: it.readingTime,
    })),
  });
}

function renderSectionSitemap(interviews) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url>\n    <loc>https://ardops.dev/interviews/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    ...interviews.map(
      (it) =>
        `  <url>\n    <loc>https://ardops.dev/interviews/${it.slug}.html</loc>\n    <lastmod>${it.date}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.6</priority>\n  </url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => f.toLowerCase() !== 'readme.md')
    .map((f) => path.join(dir, f));
}

function main() {
  const opts = parseArgs(process.argv);
  configureMarked();
  const purify = buildPurifier();

  const sources = [];
  for (const f of listMarkdownFiles(CONTENT_DIR)) sources.push(f);
  if (opts.includeFixtures) {
    // Skip negative-test fixtures (filenames prefixed with `invalid-`); those
    // are exercised by dedicated tests that assert --strict aborts on them.
    for (const f of listMarkdownFiles(FIXTURES_DIR)) {
      if (path.basename(f).toLowerCase().startsWith('invalid-')) continue;
      sources.push(f);
    }
  }

  if (sources.length === 0) {
    console.error('build-interviews: no .md files found in content/interviews/');
  }

  const errors = [];
  const warnings = [];
  const seenSlugs = new Map();
  const interviews = [];
  const skipped = [];

  for (const file of sources) {
    const rel = path.relative(REPO_ROOT, file);
    let raw;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch (e) {
      errors.push({ file: rel, field: '', msg: `cannot read file: ${e.message}` });
      continue;
    }

    let parsed;
    try {
      parsed = matter(raw);
    } catch (e) {
      errors.push({ file: rel, field: '', msg: `frontmatter parse error: ${e.message}` });
      continue;
    }
    const { data, content } = parsed;
    const slug = deriveSlug(file);

    if (seenSlugs.has(slug)) {
      errors.push({
        file: rel,
        field: 'slug',
        msg: `duplicate slug '${slug}' (also in ${seenSlugs.get(slug)})`,
      });
      continue;
    }
    seenSlugs.set(slug, rel);

    const fmErrors = validateFrontmatter(rel, data, { slug });
    if (fmErrors.length > 0) {
      for (const e of fmErrors) errors.push(e);
      continue;
    }

    const dateString =
      data.date instanceof Date
        ? `${data.date.getUTCFullYear()}-${String(data.date.getUTCMonth() + 1).padStart(2, '0')}-${String(data.date.getUTCDate()).padStart(2, '0')}`
        : data.date;

    if (!data.published) {
      skipped.push(slug);
      continue;
    }

    // Markdown → HTML → sanitize
    const rawHtml = marked.parse(content);
    const cleanHtml = purify(rawHtml);
    if (
      /<script\b/i.test(cleanHtml) ||
      /=\s*["']?\s*javascript:/i.test(cleanHtml) ||
      /\son[a-z]+\s*=/i.test(cleanHtml)
    ) {
      errors.push({
        file: rel,
        field: '',
        msg: 'sanitizer regression: hostile token survived (please report)',
      });
      continue;
    }

    // Tag normalization warning
    if (Array.isArray(data.tags)) {
      data.tags.forEach((t) => {
        const norm = String(t)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        if (norm !== t) {
          warnings.push({
            file: rel,
            msg: `tag '${t}' is not normalized; recommended '${norm}'`,
          });
        }
      });
    }

    interviews.push({
      slug,
      title: data.title.trim(),
      interviewee: {
        name: data.interviewee.name.trim(),
        role: data.interviewee.role.trim(),
        company: data.interviewee.company.trim(),
        image: data.interviewee.image || null,
        linkedin: data.interviewee.linkedin || null,
      },
      date: dateString,
      tags: data.tags.slice(),
      summary: data.summary.trim(),
      published: true,
      readingTime: readingTimeFromMarkdown(content),
      bodyHtml: cleanHtml,
      sourceFile: rel,
    });
  }

  // Sort by date desc (then slug asc for stability)
  interviews.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)
  );

  // Report
  for (const w of warnings) console.warn(`[warn] ${w.file}: ${w.msg}`);
  for (const e of errors) {
    const field = e.field ? ` (field='${e.field}')` : '';
    console.error(`[error] ${e.file}: ${e.msg}${field}`);
  }
  if (errors.length > 0 && opts.strict) {
    console.error(`build-interviews: ${errors.length} error(s); aborting (--strict).`);
    process.exit(1);
  }

  if (opts.dryRun) {
    console.log(
      `build-interviews: dry run OK — ${interviews.length} interview(s), ${skipped.length} skipped, ${errors.length} error(s)`
    );
    return;
  }

  // Emit artifacts
  const outDir = path.resolve(REPO_ROOT, opts.out);
  fs.mkdirSync(outDir, { recursive: true });

  const imagesOut = path.join(outDir, 'images');
  let imagesCopied = 0;
  for (const it of interviews) {
    if (it.interviewee.image) {
      fs.mkdirSync(imagesOut, { recursive: true });
      const src = path.join(CONTENT_DIR, it.interviewee.image);
      const dest = path.join(outDir, it.interviewee.image);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      imagesCopied++;
    }
  }

  // Per-interview pages
  for (const it of interviews) {
    const html = renderInterviewHtml(it);
    fs.writeFileSync(path.join(outDir, `${it.slug}.html`), html, 'utf8');
  }

  // Index
  fs.writeFileSync(path.join(outDir, 'index.html'), renderIndexHtml(interviews), 'utf8');
  const indexJson = renderIndexJson(interviews);
  fs.writeFileSync(path.join(outDir, 'index.json'), indexJson, 'utf8');

  // Per-section sitemap fragment (one URL per published interview).
  // The site's root sitemap.xml lists /interviews/ explicitly; this file is a
  // supplementary fragment that can be referenced from a sitemap index in the
  // future. For now it lives next to the section so robots can find it via
  // robots.txt or a manual crawl.
  const sitemap = renderSectionSitemap(interviews);
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap, 'utf8');

  const sizeKb = (Buffer.byteLength(indexJson, 'utf8') / 1024).toFixed(2);
  console.log(
    `build-interviews: ✓ ${interviews.length} interview(s) emitted, ${skipped.length} skipped, index.json ${sizeKb}KB, ${imagesCopied} image(s) copied`
  );
}

main();
