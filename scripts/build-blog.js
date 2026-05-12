#!/usr/bin/env node
/**
 * scripts/build-blog.js — spec 006
 *
 * Reads markdown posts from `content/blog/*.md`, validates strict
 * frontmatter, sanitizes the body via marked + DOMPurify (build-time
 * only), and emits:
 *
 *   index.html                     — landing block between
 *                                    <!-- blog:start --> markers
 *                                    (top-3 most recent published posts)
 *   blog/index.html                — full blog index (all published)
 *   blog/<slug>.html               — one page per published post
 *
 * Posts in `content/blog/__fixtures__/` are excluded (used only by
 * `tests/blog-schema.sh` for negative-fixture gate).
 *
 * CLI flags:
 *   (no flag)                      — write all artifacts
 *   --check                        — dry-run, exit 1 on drift
 *   --check-only-validation        — parse + validate + sanitize only;
 *                                    requires --input <path>
 *   --input <path>                 — single .md file (with
 *                                    --check-only-validation or
 *                                    --emit-sanitized)
 *   --emit-sanitized               — print sanitized HTML body to stdout
 *
 * See specs/006-blog-section/ for spec, plan, contracts, and quickstart.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(REPO_ROOT, 'content', 'blog');
const FIXTURES_DIR = path.join(CONTENT_DIR, '__fixtures__');
const BLOG_OUT_DIR = path.join(REPO_ROOT, 'blog');
const LANDING_PATH = path.join(REPO_ROOT, 'index.html');

const SLUG_RE = /^[a-z0-9-]{1,80}$/;
const TAG_RE = /^[a-z0-9-]{1,32}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FILENAME_RE = /^(\d{4})-(\d{2})-(.+)\.md$/;
const HTML_INLINE_RE = /<[^>]+>/;

const TITLE_MAX = 120;
const SUMMARY_MIN = 20;
const SUMMARY_MAX = 280;
const TAGS_MAX = 10;
const WPM = 200;

const ALLOWED_FIELDS = new Set([
  'title',
  'date',
  'slug',
  'summary',
  'tags',
  'published',
  'cover',
]);

const COVER_EXT_RE = /\.(webp|png|jpe?g)$/i;
const COVER_PREFIX = 'assets/img/blog/';
const COVER_PATH_RE = /^[A-Za-z0-9._/-]+$/;

const TOC_MIN_H2 = 3;
const CANONICAL_ORIGIN = 'https://ardops.dev';

const MARKER_START = '<!-- blog:start -->';
const MARKER_END = '<!-- blog:end -->';

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests";

const BLOG_INTRO_TEXT =
  'Notas técnicas en primera persona sobre lo que estoy construyendo.';
const BLOG_INDEX_INTRO_TEXT =
  'Notas en primera persona sobre DevSecOps, automation y arquitectura. Filtrá por tag o buscá por palabra clave.';
const EMPTY_LANDING_TEXT = 'Aún no hay posts publicados — pronto.';
const EMPTY_INDEX_TEXT = 'Aún no hay posts publicados. Volvé pronto.';

const MONTH_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Oct',
  'Nov',
  'Dic',
];

// DOMPurify whitelist (see contracts/sanitizer-whitelist.md)
const ALLOWED_TAGS = [
  'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'ul', 'ol', 'li',
  'strong', 'em', 'code', 'pre', 'blockquote',
  'a', 'br', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span',
  'img', 'figure', 'figcaption',
];
const ALLOWED_ATTR = [
  'href', 'title', 'id', 'class', 'lang', 'rel', 'target',
  'src', 'alt', 'width', 'height', 'loading', 'decoding',
  'colspan', 'rowspan', 'scope',
];
const FORBID_TAGS = [
  'script', 'iframe', 'object', 'embed', 'form',
  'input', 'button', 'textarea', 'select', 'option',
  'style', 'link', 'meta', 'base', 'title',
  'svg', 'math',
  'video', 'audio', 'source', 'track', 'canvas', 'noscript',
];
const FORBID_ATTR = [
  'style', 'srcset', 'sizes',
  'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
  'onmouseout', 'onkeydown', 'onkeyup', 'onkeypress', 'onchange',
  'onsubmit',
  'autofocus', 'formaction', 'formmethod', 'formenctype', 'formtarget',
  'srcdoc', 'sandbox', 'allow', 'allowfullscreen',
];
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto):|\/|#)/i;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

class BuildError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BuildError';
  }
}

function die(msg) {
  process.stderr.write(`blog-build: ${msg}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateES(iso) {
  // iso = "YYYY-MM-DD"
  const m = DATE_RE.exec(iso);
  if (!m) return iso;
  const [_, y, mo, d] = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const month = MONTH_ES[parseInt(mo, 10) - 1];
  return `${parseInt(d, 10)} ${month} ${y}`;
}

function isValidCalendarDate(iso) {
  if (!DATE_RE.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function isFutureDate(iso) {
  const today = new Date();
  const todayIso = `${today.getUTCFullYear()}-${String(
    today.getUTCMonth() + 1,
  ).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
  return iso > todayIso;
}

function unicodeLength(s) {
  return Array.from(String(s)).length;
}

// ---------------------------------------------------------------------------
// Helpers — spec 007 (slugify, share, canonical, cover validation)
// ---------------------------------------------------------------------------

function slugifyHeading(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugifyTag(label) {
  return String(label)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function urlEncodeForShare(text) {
  return encodeURIComponent(String(text));
}

function canonicalUrl(slug) {
  return `${CANONICAL_ORIGIN}/blog/${slug}.html`;
}

function validateCoverField(file, fm) {
  if (!('cover' in fm)) return null;
  const errs = [];
  if (typeof fm.cover !== 'string' || fm.cover.length === 0) {
    errs.push(`field 'cover' must be non-empty string`);
    return errs;
  }
  const cover = fm.cover;
  if (!COVER_PATH_RE.test(cover) || cover.includes('..')) {
    errs.push(`field 'cover' contains invalid characters or '..' segments`);
    return errs;
  }
  if (!cover.startsWith(COVER_PREFIX)) {
    errs.push(
      `field 'cover' must start with '${COVER_PREFIX}' (got '${cover}')`,
    );
    return errs;
  }
  if (!COVER_EXT_RE.test(cover)) {
    errs.push(
      `field 'cover' must end in .webp/.png/.jpg/.jpeg (got '${cover}')`,
    );
    return errs;
  }
  const abs = path.join(REPO_ROOT, cover);
  if (!fs.existsSync(abs)) {
    errs.push(`field 'cover' points to missing file '${cover}'`);
    return errs;
  }
  return null; // ok
}

// ---------------------------------------------------------------------------
// Frontmatter validation
// ---------------------------------------------------------------------------

function validatePost(file, parsed) {
  const fm = parsed.data || {};
  const errs = [];
  const relFile = path.relative(REPO_ROOT, file);

  // Unknown fields
  for (const k of Object.keys(fm)) {
    if (!ALLOWED_FIELDS.has(k)) {
      errs.push(`unexpected field '${k}'`);
    }
  }

  // title
  if (!('title' in fm)) {
    errs.push(`missing required field 'title'`);
  } else if (typeof fm.title !== 'string' || fm.title.length === 0) {
    errs.push(`field 'title' must be non-empty string`);
  } else if (fm.title.length > TITLE_MAX) {
    errs.push(
      `field 'title' must be ≤ ${TITLE_MAX} chars (got ${fm.title.length})`,
    );
  } else if (/[\r\n]/.test(fm.title)) {
    errs.push(`field 'title' must not contain newlines`);
  }

  // date
  if (!('date' in fm)) {
    errs.push(`missing required field 'date'`);
  } else {
    let iso;
    if (fm.date instanceof Date) {
      // gray-matter parses ISO dates as Date objects
      const y = fm.date.getUTCFullYear();
      const m = String(fm.date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(fm.date.getUTCDate()).padStart(2, '0');
      iso = `${y}-${m}-${d}`;
      fm.date = iso;
    } else if (typeof fm.date === 'string') {
      iso = fm.date;
    } else {
      errs.push(`field 'date' must be string YYYY-MM-DD`);
      iso = null;
    }
    if (iso !== null) {
      if (!DATE_RE.test(iso)) {
        errs.push(`field 'date' must match YYYY-MM-DD (got '${iso}')`);
      } else if (!isValidCalendarDate(iso)) {
        errs.push(`field 'date' is not a valid calendar date ('${iso}')`);
      }
    }
  }

  // slug
  if (!('slug' in fm)) {
    errs.push(`missing required field 'slug'`);
  } else if (typeof fm.slug !== 'string') {
    errs.push(`field 'slug' must be string`);
  } else if (!SLUG_RE.test(fm.slug)) {
    errs.push(
      `field 'slug' must match ${SLUG_RE} (got '${fm.slug}')`,
    );
  }

  // summary
  if (!('summary' in fm)) {
    errs.push(`missing required field 'summary'`);
  } else if (typeof fm.summary !== 'string') {
    errs.push(`field 'summary' must be string`);
  } else {
    const len = unicodeLength(fm.summary);
    if (len < SUMMARY_MIN || len > SUMMARY_MAX) {
      errs.push(
        `field 'summary' must be ${SUMMARY_MIN}..${SUMMARY_MAX} chars (got ${len})`,
      );
    }
    if (HTML_INLINE_RE.test(fm.summary)) {
      errs.push(`field 'summary' must not contain HTML`);
    }
  }

  // tags
  if (!('tags' in fm)) {
    errs.push(`missing required field 'tags'`);
  } else if (!Array.isArray(fm.tags)) {
    errs.push(`field 'tags' must be array`);
  } else {
    if (fm.tags.length > TAGS_MAX) {
      errs.push(`field 'tags' must have ≤ ${TAGS_MAX} entries`);
    }
    for (const t of fm.tags) {
      if (typeof t !== 'string' || !TAG_RE.test(t)) {
        errs.push(`tag '${t}' violates pattern ${TAG_RE}`);
      }
    }
  }

  // published
  if (!('published' in fm)) {
    errs.push(`missing required field 'published'`);
  } else if (typeof fm.published !== 'boolean') {
    errs.push(
      `field 'published' must be boolean (got ${typeof fm.published})`,
    );
  }

  // cover (optional)
  const coverErrs = validateCoverField(file, fm);
  if (coverErrs && coverErrs.length > 0) {
    errs.push(...coverErrs);
  }

  // body
  if (
    typeof parsed.content !== 'string' ||
    parsed.content.trim().length === 0
  ) {
    errs.push(`body must contain at least one non-whitespace character`);
  }

  // filename slug consistency
  const base = path.basename(file);
  const m = FILENAME_RE.exec(base);
  if (m && typeof fm.slug === 'string') {
    if (m[3] !== fm.slug) {
      errs.push(
        `filename suffix '${m[3]}' must match slug '${fm.slug}'`,
      );
    }
  }

  if (errs.length > 0) {
    throw new BuildError(`${relFile}: ${errs.join('; ')}`);
  }
  return fm;
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (e) =>
        e.isFile() &&
        e.name.endsWith('.md') &&
        FILENAME_RE.test(e.name),
    )
    .map((e) => path.join(dir, e.name))
    .sort();
}

function loadAllPosts() {
  const files = listMarkdownFiles(CONTENT_DIR);
  const posts = [];
  const seenSlugs = new Map();

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    let parsed;
    try {
      parsed = matter(raw);
    } catch (e) {
      throw new BuildError(
        `${path.relative(REPO_ROOT, file)}: invalid YAML frontmatter: ${e.message}`,
      );
    }
    const fm = validatePost(file, parsed);
    if (seenSlugs.has(fm.slug)) {
      throw new BuildError(
        `duplicate slug '${fm.slug}' in ${path.relative(
          REPO_ROOT,
          file,
        )} (already used by ${seenSlugs.get(fm.slug)})`,
      );
    }
    seenSlugs.set(fm.slug, path.relative(REPO_ROOT, file));

    const readingTime = computeReadingTime(parsed.content);
    posts.push({
      file,
      title: fm.title,
      date: fm.date,
      dateFormatted: formatDateES(fm.date),
      slug: fm.slug,
      summary: fm.summary,
      tags: fm.tags,
      tagSlugs: fm.tags.map(slugifyTag),
      published: fm.published === true,
      isFuture: isFutureDate(fm.date),
      cover: typeof fm.cover === 'string' ? fm.cover : null,
      readingTime,
      bodyMd: parsed.content,
    });
  }

  // Sort desc by date, asc by slug
  posts.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.slug < b.slug ? -1 : 1;
  });

  const published = posts.filter((p) => p.published && !p.isFuture);
  const recent = published.slice(0, 3);

  return { posts, published, recent };
}

function loadSinglePost(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const fm = validatePost(file, parsed);
  const readingTime = computeReadingTime(parsed.content);
  return {
    file,
    title: fm.title,
    date: fm.date,
    dateFormatted: formatDateES(fm.date),
    slug: fm.slug,
    summary: fm.summary,
    tags: fm.tags,
    tagSlugs: fm.tags.map(slugifyTag),
    published: fm.published === true,
    isFuture: isFutureDate(fm.date),
    cover: typeof fm.cover === 'string' ? fm.cover : null,
    readingTime,
    bodyMd: parsed.content,
  };
}

// ---------------------------------------------------------------------------
// Reading time
// ---------------------------------------------------------------------------

function computeReadingTime(bodyMd) {
  let txt = String(bodyMd || '');
  // strip fenced code blocks
  txt = txt.replace(/```[\s\S]*?```/g, ' ');
  txt = txt.replace(/~~~[\s\S]*?~~~/g, ' ');
  // strip inline code
  txt = txt.replace(/`[^`]*`/g, ' ');
  // strip HTML tags
  txt = txt.replace(/<[^>]+>/g, ' ');
  // strip markdown link syntax: [text](url)
  txt = txt.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // strip images: ![alt](src)
  txt = txt.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  // strip markdown emphasis/syntax chars
  txt = txt.replace(/[#*_~>`-]/g, ' ');
  const words = txt.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, Math.ceil(words.length / WPM));
}

// ---------------------------------------------------------------------------
// Sanitizer
// ---------------------------------------------------------------------------

const _domWindow = new JSDOM('').window;
const _DOMPurify = createDOMPurify(_domWindow);

function sanitizeHtml(rawHtml) {
  const clean = _DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    SANITIZE_DOM: true,
    USE_PROFILES: { html: true },
    FORBID_TAGS,
    FORBID_ATTR,
    ALLOWED_URI_REGEXP,
  });
  // Post-process <a>: external links get target=_blank + rel
  const frag = JSDOM.fragment(clean);
  for (const a of frag.querySelectorAll('a')) {
    const href = a.getAttribute('href') || '';
    if (/^https?:\/\//i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    } else if (a.getAttribute('target') === '_blank') {
      a.setAttribute('rel', 'noopener noreferrer');
    }
  }
  // Serialize back
  const tmp = _domWindow.document.createElement('div');
  while (frag.firstChild) tmp.appendChild(frag.firstChild);
  return tmp.innerHTML;
}

function renderBodyHtml(bodyMd) {
  const rawHtml = marked.parse(bodyMd, {
    gfm: true,
    breaks: false,
    headerIds: false,
    mangle: false,
  });
  return sanitizeHtml(rawHtml);
}

// ---------------------------------------------------------------------------
// TOC (spec 007 — T007/T008) — build-time, deterministic ids
// ---------------------------------------------------------------------------

/**
 * Parses sanitized HTML, assigns unique IDs to h2..h6, validates images
 * have alt text, and returns the augmented HTML + TOC entries.
 */
function buildToc(bodyHtml, postSlug) {
  const dom = new JSDOM(`<!doctype html><body>${bodyHtml}</body>`);
  const doc = dom.window.document;

  // Validate: every <img> in body must have alt
  for (const img of doc.querySelectorAll('img')) {
    if (!img.hasAttribute('alt')) {
      throw new BuildError(
        `post '${postSlug}': <img> in body missing 'alt' attribute (src='${img.getAttribute('src') || ''}')`,
      );
    }
  }

  const used = new Set();
  const headings = doc.querySelectorAll('h2, h3, h4, h5, h6');
  const items = [];
  for (const h of headings) {
    const text = (h.textContent || '').trim();
    if (text.length === 0) {
      throw new BuildError(
        `post '${postSlug}': empty <${h.tagName.toLowerCase()}> heading not allowed`,
      );
    }
    let base = slugifyHeading(text) || 'section';
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    if (!h.id) h.setAttribute('id', id);
    const level = parseInt(h.tagName.slice(1), 10);
    if (level === 2 || level === 3) {
      items.push({ id, level, text });
    }
  }

  return {
    items,
    bodyHtmlWithIds: doc.body.innerHTML,
  };
}

function renderToc(items) {
  const h2Count = items.filter((i) => i.level === 2).length;
  if (h2Count < TOC_MIN_H2) {
    return { aside: '', mobile: '' };
  }
  const listItems = items
    .map(
      (i) =>
        `        <li class="post-toc-item post-toc-item--h${i.level}"><a href="#${escapeHTML(i.id)}">${escapeHTML(i.text)}</a></li>`,
    )
    .join('\n');

  const aside = `      <aside class="post-toc post-toc--aside" aria-label="Tabla de contenidos">
        <p class="post-toc-label">En este post</p>
        <ol class="post-toc-list">
${listItems}
        </ol>
      </aside>`;

  const mobile = `        <details class="post-toc post-toc--mobile">
          <summary>En este post</summary>
          <ol class="post-toc-list">
${listItems}
          </ol>
        </details>`;

  return { aside, mobile };
}

// ---------------------------------------------------------------------------
// Share links (spec 007 — T009)
// ---------------------------------------------------------------------------

function renderShareLinks(post) {
  const url = canonicalUrl(post.slug);
  const titleEnc = urlEncodeForShare(post.title);
  const urlEnc = urlEncodeForShare(url);
  const mailto = `mailto:?subject=${titleEnc}&body=${urlEnc}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${urlEnc}`;
  const xUrl = `https://x.com/intent/post?text=${titleEnc}&url=${urlEnc}`;
  return `        <aside class="post-share" aria-label="Compartir este post">
          <p class="post-share-label">¿Te sirvió? Compartilo:</p>
          <ul class="post-share-links">
            <li><a class="post-share-link" href="${escapeHTML(mailto)}" rel="noopener">Mail</a></li>
            <li><a class="post-share-link" href="${escapeHTML(linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a class="post-share-link" href="${escapeHTML(xUrl)}" target="_blank" rel="noopener noreferrer">X</a></li>
          </ul>
        </aside>`;
}

// ---------------------------------------------------------------------------
// Render helpers — landing block
// ---------------------------------------------------------------------------

function renderCardLanding(post) {
  return `      <li>
        <article class="post-card" aria-labelledby="post-${escapeHTML(post.slug)}-title">
          <header class="post-card-header">
            <h3 id="post-${escapeHTML(post.slug)}-title" class="post-card-title">
              <a href="/blog/${escapeHTML(post.slug)}.html">${escapeHTML(post.title)}</a>
            </h3>
            <p class="post-meta">
              <time datetime="${escapeHTML(post.date)}" class="post-date">${escapeHTML(post.dateFormatted)}</time>
              <span class="post-meta-sep" aria-hidden="true">·</span>
              <span class="post-reading-time">${post.readingTime} min de lectura</span>
            </p>
          </header>
          <p class="post-summary">${escapeHTML(post.summary)}</p>
          ${renderTags(post.tags)}
        </article>
      </li>`;
}

function renderTags(tags) {
  if (!tags || tags.length === 0) return '';
  const items = tags
    .map(
      (t) =>
        `<li><span class="post-tag">${escapeHTML(t)}</span></li>`,
    )
    .join('');
  return `<ul class="post-tags">${items}</ul>`;
}

function renderLandingBlock(recent) {
  if (recent.length === 0) {
    return `${MARKER_START}
    <section id="blog" class="section" aria-labelledby="blog-heading">
      <p class="section-label">// blog</p>
      <h2 id="blog-heading" class="section-title">Blog</h2>
      <p class="blog-intro">${escapeHTML(BLOG_INTRO_TEXT)}</p>
      <p class="post-empty">${escapeHTML(EMPTY_LANDING_TEXT)}</p>
    </section>
    ${MARKER_END}`;
  }
  const cards = recent.map(renderCardLanding).join('\n');
  return `${MARKER_START}
    <section id="blog" class="section" aria-labelledby="blog-heading">
      <p class="section-label">// blog</p>
      <h2 id="blog-heading" class="section-title">Blog</h2>
      <p class="blog-intro">${escapeHTML(BLOG_INTRO_TEXT)}</p>
      <ul class="post-list post-list--landing">
${cards}
      </ul>
      <p class="blog-see-all">
        <a href="/blog/" class="blog-see-all-link">Ver todos los posts →</a>
      </p>
    </section>
    ${MARKER_END}`;
}

// ---------------------------------------------------------------------------
// Render helpers — blog index page
// ---------------------------------------------------------------------------

function renderCardIndex(post, idx) {
  const cover = post.cover
    ? `\n          <img class="post-card-cover" src="/${escapeHTML(post.cover)}" alt="" width="640" height="360" loading="lazy" decoding="async">`
    : '';
  const tagsAttr = (post.tagSlugs || []).join(' ');
  return `      <li class="post-card" data-card data-slug="${escapeHTML(post.slug)}" data-tags="${escapeHTML(tagsAttr)}" data-index="${idx}" aria-labelledby="post-${escapeHTML(post.slug)}-title">
        <article>${cover}
          <p class="post-meta">
            <time datetime="${escapeHTML(post.date)}" class="post-date">${escapeHTML(post.dateFormatted)}</time>
            <span class="post-meta-sep" aria-hidden="true">·</span>
            <span class="post-reading-time">${post.readingTime} min</span>
          </p>
          <h2 id="post-${escapeHTML(post.slug)}-title" class="post-card-title">
            <a href="/blog/${escapeHTML(post.slug)}.html">${escapeHTML(post.title)}</a>
          </h2>
          <p class="post-summary">${escapeHTML(post.summary)}</p>
          ${renderTags(post.tags)}
          <p class="post-card-cta"><a href="/blog/${escapeHTML(post.slug)}.html">Leer →</a></p>
        </article>
      </li>`;
}

/**
 * Build a sorted, deduplicated list of {slug,label,count} tags.
 */
function collectTags(published) {
  const map = new Map();
  for (const p of published) {
    for (let i = 0; i < p.tags.length; i++) {
      const label = p.tags[i];
      const slug = p.tagSlugs[i];
      if (!map.has(slug)) {
        map.set(slug, { slug, label, count: 0 });
      } else if (map.get(slug).label !== label) {
        throw new BuildError(
          `tag slug collision: '${slug}' produced by both '${map.get(slug).label}' and '${label}'`,
        );
      }
      map.get(slug).count++;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0,
  );
}

/**
 * Emit one CSS rule per tag, using `:has()` to hide non-matching cards
 * and another to mark the active chip. The block is determined by the
 * current set of tags so it's emitted inline inside /blog/index.html.
 */
function renderTagCssRules(tags) {
  const lines = [];
  for (const t of tags) {
    const s = t.slug;
    lines.push(
      `.blog-index:has(#blog-tag-${s}:checked) .post-card:not([data-tags~="${s}"]) { display: none; }`,
    );
    lines.push(
      `.blog-index:has(#blog-tag-${s}:checked) .chip--filter[for="blog-tag-${s}"] { background: var(--chip-active-bg); color: var(--chip-active-text); border-color: var(--chip-active-bg); }`,
    );
    lines.push(
      `.blog-index:has(#blog-tag-${s}:checked) .chip--filter[for="blog-tag-${s}"] .chip-count { color: var(--chip-active-text); }`,
    );
    lines.push(
      `.blog-index:has(#blog-tag-${s}:focus-visible) .chip--filter[for="blog-tag-${s}"] { outline: 2px solid var(--accent); outline-offset: 2px; }`,
    );
  }
  // "Todos" active + focus state
  lines.push(
    `.blog-index:has(#blog-tag-all:checked) .chip--filter[for="blog-tag-all"] { background: var(--chip-active-bg); color: var(--chip-active-text); border-color: var(--chip-active-bg); }`,
  );
  lines.push(
    `.blog-index:has(#blog-tag-all:checked) .chip--filter[for="blog-tag-all"] .chip-count { color: var(--chip-active-text); }`,
  );
  lines.push(
    `.blog-index:has(#blog-tag-all:focus-visible) .chip--filter[for="blog-tag-all"] { outline: 2px solid var(--accent); outline-offset: 2px; }`,
  );
  return lines.join('\n');
}

function renderBlogIndex(published) {
  const tags = collectTags(published);

  // A. radios (one per tag + Todos) — visually hidden but keyboard-accessible
  const radios = [
    `      <input type="radio" name="blog-tag" id="blog-tag-all" value="" class="visually-hidden" checked>`,
    ...tags.map(
      (t) =>
        `      <input type="radio" name="blog-tag" id="blog-tag-${t.slug}" value="${t.slug}" class="visually-hidden">`,
    ),
  ].join('\n');

  // B. chips
  const chips = [
    `        <li><label for="blog-tag-all" class="chip chip--filter">Todos <span class="chip-count">(${published.length})</span></label></li>`,
    ...tags.map(
      (t) =>
        `        <li><label for="blog-tag-${t.slug}" class="chip chip--filter">${escapeHTML(t.label)} <span class="chip-count">(${t.count})</span></label></li>`,
    ),
  ].join('\n');

  // C. cards
  const cards =
    published.length === 0
      ? `      <p class="post-empty">${escapeHTML(EMPTY_INDEX_TEXT)}</p>`
      : published.map((p, i) => renderCardIndex(p, i)).join('\n');

  // D. JSON index for JS search
  const indexJson = JSON.stringify(
    published.map((p) => ({
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      tags: p.tagSlugs,
    })),
  );

  // E. per-tag CSS rules
  const tagRules = renderTagCssRules(tags);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <title>Blog — ardops.dev</title>
  <meta name="description" content="Notas técnicas en primera persona de Victor Josue Ardón Rojas sobre DevSecOps, automation y arquitectura.">
  <meta name="theme-color" content="#0a0e17">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="https://ardops.dev/blog/">

  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_CR">
  <meta property="og:site_name" content="ardops.dev">
  <meta property="og:title" content="Blog — ardops.dev">
  <meta property="og:description" content="Notas técnicas en primera persona de Victor Josue Ardón Rojas sobre DevSecOps, automation y arquitectura.">
  <meta property="og:url" content="https://ardops.dev/blog/">
  <meta property="og:image" content="https://ardops.dev/public/og/og-default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="ardops.dev — Blog">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Blog — ardops.dev">
  <meta name="twitter:description" content="Notas técnicas en primera persona sobre DevSecOps y automation.">
  <meta name="twitter:image" content="https://ardops.dev/public/og/og-default.png">

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
  <style id="blog-tag-rules">
${tagRules}
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Saltar al contenido</a>

  <header class="site-header">
    <nav class="site-nav" aria-label="Navegación principal">
      <a href="/" class="nav-logo">ardops<span>.dev</span></a>
      <ul class="nav-links">
        <li><a href="/#talk">Charla</a></li>
        <li><a href="/#pipeline">Pipeline</a></li>
        <li><a href="/blog/" aria-current="page">Blog</a></li>
        <li><a href="/#about">About</a></li>
        <li><a href="/interviews/">Entrevistas</a></li>
        <li><a href="/#contact">Contacto</a></li>
      </ul>
    </nav>
  </header>

  <main id="main">
    <section class="blog-index section" aria-labelledby="blog-index-heading">
      <p class="section-label">// blog</p>
      <h1 id="blog-index-heading" class="section-title">Blog</h1>
      <p class="section-lead">${escapeHTML(BLOG_INDEX_INTRO_TEXT)}</p>

      <fieldset class="blog-filters-radios">
        <legend class="visually-hidden">Filtrar por tag</legend>
${radios}
      </fieldset>

      <div class="blog-filters">
        <ul class="blog-chips">
${chips}
        </ul>
        <div class="blog-search" hidden>
          <label for="blog-search-input" class="visually-hidden">Buscar posts</label>
          <input type="search" id="blog-search-input" placeholder="Buscar por título, resumen o tag…" autocomplete="off">
        </div>
      </div>

      <output class="blog-results-count" aria-live="polite" aria-atomic="true"></output>

      <ol class="post-list post-list--index" id="blog-post-list">
${cards}
      </ol>

      <p class="blog-empty" hidden>No encontré nada con eso. Probá otra palabra o limpiá los filtros.</p>
      <p><button type="button" class="blog-clear-filters" hidden>Limpiar filtros</button></p>

      <script id="blog-index" type="application/json">${indexJson}</script>
    </section>
  </main>

  <footer class="site-footer">
    <p><span class="footer-mono">ardops.dev</span> · Security as Code · Costa Rica · &copy; <span data-year>2026</span></p>
    <p class="footer-tagline">Built with intention. Deployed with CI/CD.</p>
  </footer>

  <script type="module" src="/assets/js/blog-filter.js" defer></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Render helpers — individual post page
// ---------------------------------------------------------------------------

function renderPostPage(post, bodyHtml) {
  const { items: tocItems, bodyHtmlWithIds } = buildToc(bodyHtml, post.slug);
  const { aside, mobile } = renderToc(tocItems);
  const tagsHeader = renderTags(post.tags);
  const tagsFooter = renderTags(post.tags);
  const shareBlock = renderShareLinks(post);
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <title>${escapeHTML(post.title)} — Blog — ardops.dev</title>
  <meta name="description" content="${escapeHTML(post.summary)}">
  <meta name="theme-color" content="#0a0e17">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="${escapeHTML(canonicalUrl(post.slug))}">

  <meta property="og:type" content="article">
  <meta property="og:locale" content="es_CR">
  <meta property="og:site_name" content="ardops.dev">
  <meta property="og:title" content="${escapeHTML(post.title)}">
  <meta property="og:description" content="${escapeHTML(post.summary)}">
  <meta property="og:url" content="${escapeHTML(canonicalUrl(post.slug))}">
  <meta property="og:image" content="https://ardops.dev/public/og/og-default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHTML(post.title)}">
  <meta property="article:published_time" content="${escapeHTML(post.date)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(post.title)}">
  <meta name="twitter:description" content="${escapeHTML(post.summary)}">
  <meta name="twitter:image" content="https://ardops.dev/public/og/og-default.png">

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
</head>
<body>
  <a class="skip-link" href="#main">Saltar al contenido</a>

  <header class="site-header">
    <nav class="site-nav" aria-label="Navegación principal">
      <a href="/" class="nav-logo">ardops<span>.dev</span></a>
      <ul class="nav-links">
        <li><a href="/#talk">Charla</a></li>
        <li><a href="/#pipeline">Pipeline</a></li>
        <li><a href="/blog/" aria-current="page">Blog</a></li>
        <li><a href="/#about">About</a></li>
        <li><a href="/interviews/">Entrevistas</a></li>
        <li><a href="/#contact">Contacto</a></li>
      </ul>
    </nav>
  </header>

  <main id="main">
    <div class="post-layout">
${aside}
      <article class="post-article" aria-labelledby="post-title">
        <header class="post-article-header">
          <p class="section-label">// blog</p>
          <h1 id="post-title" class="post-article-title">${escapeHTML(post.title)}</h1>
          <p class="post-meta">
            <time datetime="${escapeHTML(post.date)}" class="post-date">${escapeHTML(post.dateFormatted)}</time>
            <span class="post-meta-sep" aria-hidden="true">·</span>
            <span class="post-reading-time">${post.readingTime} min de lectura</span>
          </p>
          ${tagsHeader}
        </header>

${mobile}

        <div class="post-article-body">
${bodyHtmlWithIds}
        </div>

        <footer class="post-article-footer">
          ${tagsFooter}
          <p><a href="/blog/" class="btn btn-ghost post-back-link">← Volver al blog</a></p>
${shareBlock}
        </footer>
      </article>
    </div>
  </main>

  <footer class="site-footer">
    <p><span class="footer-mono">ardops.dev</span> · Security as Code · Costa Rica · &copy; <span data-year>2026</span></p>
    <p class="footer-tagline">Built with intention. Deployed with CI/CD.</p>
  </footer>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Landing in-place update
// ---------------------------------------------------------------------------

function replaceLandingBlock(html, newBlock) {
  const startIdx = html.indexOf(MARKER_START);
  const endIdx = html.indexOf(MARKER_END);
  if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) {
    throw new BuildError(
      `index.html missing markers '${MARKER_START}' / '${MARKER_END}'`,
    );
  }
  const before = html.slice(0, startIdx);
  const after = html.slice(endIdx + MARKER_END.length);
  return before + newBlock + after;
}

// ---------------------------------------------------------------------------
// Build artifacts (in-memory)
// ---------------------------------------------------------------------------

function buildArtifacts(collection) {
  const { published, recent } = collection;
  const landingBlock = renderLandingBlock(recent);
  const blogIndexHtml = renderBlogIndex(published);
  const postPages = new Map();
  for (const p of published) {
    const bodyHtml = renderBodyHtml(p.bodyMd);
    postPages.set(p.slug, renderPostPage(p, bodyHtml));
  }
  return { landingBlock, blogIndexHtml, postPages };
}

// ---------------------------------------------------------------------------
// Write mode
// ---------------------------------------------------------------------------

function writeAll(collection) {
  const { published } = collection;
  const arts = buildArtifacts(collection);

  // 1. landing
  const landingRaw = fs.readFileSync(LANDING_PATH, 'utf8');
  const updatedLanding = replaceLandingBlock(landingRaw, arts.landingBlock);
  if (updatedLanding !== landingRaw) {
    fs.writeFileSync(LANDING_PATH, updatedLanding, 'utf8');
  }

  // 2. blog/index.html
  if (!fs.existsSync(BLOG_OUT_DIR))
    fs.mkdirSync(BLOG_OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(BLOG_OUT_DIR, 'index.html'),
    arts.blogIndexHtml,
    'utf8',
  );

  // 3. one HTML per published post
  const wantedSlugs = new Set(published.map((p) => p.slug));
  for (const [slug, html] of arts.postPages.entries()) {
    fs.writeFileSync(
      path.join(BLOG_OUT_DIR, `${slug}.html`),
      html,
      'utf8',
    );
  }

  // 4. remove orphans
  let orphans = 0;
  for (const entry of fs.readdirSync(BLOG_OUT_DIR)) {
    if (entry === 'index.html') continue;
    if (!entry.endsWith('.html')) continue;
    const slug = entry.slice(0, -'.html'.length);
    if (!wantedSlugs.has(slug)) {
      fs.unlinkSync(path.join(BLOG_OUT_DIR, entry));
      orphans++;
    }
  }

  process.stdout.write(
    `blog-build: ✓ rendered ${published.length} published post(s) — index.html (${arts.landingBlock !== '' ? Math.min(published.length, 3) : 0} cards), blog/index.html (${published.length} entries), blog/<slug>.html × ${published.length}\n`,
  );
  if (orphans > 0) {
    process.stdout.write(
      `blog-build: removed ${orphans} orphan file(s)\n`,
    );
  }
}

// ---------------------------------------------------------------------------
// Check mode
// ---------------------------------------------------------------------------

function checkAll(collection) {
  const { published } = collection;
  const arts = buildArtifacts(collection);

  // 1. landing block
  const landingRaw = fs.readFileSync(LANDING_PATH, 'utf8');
  let expectedLanding;
  try {
    expectedLanding = replaceLandingBlock(landingRaw, arts.landingBlock);
  } catch (e) {
    process.stderr.write(`blog-build: ${e.message}\n`);
    process.exit(1);
  }
  if (expectedLanding !== landingRaw) {
    process.stderr.write(
      `blog-build: index.html is out of sync — run 'node scripts/build-blog.js' and commit.\n`,
    );
    reportDiff(landingRaw, expectedLanding);
    process.exit(1);
  }

  // 2. blog/index.html
  const indexPath = path.join(BLOG_OUT_DIR, 'index.html');
  const actualIndex = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, 'utf8')
    : '';
  if (actualIndex !== arts.blogIndexHtml) {
    process.stderr.write(
      `blog-build: blog/index.html is out of sync — run 'node scripts/build-blog.js' and commit.\n`,
    );
    reportDiff(actualIndex, arts.blogIndexHtml);
    process.exit(1);
  }

  // 3. each post page
  const wantedSlugs = new Set();
  for (const [slug, html] of arts.postPages.entries()) {
    wantedSlugs.add(slug);
    const p = path.join(BLOG_OUT_DIR, `${slug}.html`);
    const actual = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    if (actual !== html) {
      process.stderr.write(
        `blog-build: blog/${slug}.html is out of sync — run 'node scripts/build-blog.js' and commit.\n`,
      );
      reportDiff(actual, html);
      process.exit(1);
    }
  }

  // 4. orphans?
  if (fs.existsSync(BLOG_OUT_DIR)) {
    for (const entry of fs.readdirSync(BLOG_OUT_DIR)) {
      if (entry === 'index.html') continue;
      if (!entry.endsWith('.html')) continue;
      const slug = entry.slice(0, -'.html'.length);
      if (!wantedSlugs.has(slug)) {
        process.stderr.write(
          `blog-build: orphan blog/${entry} found — run 'node scripts/build-blog.js' and commit.\n`,
        );
        process.exit(1);
      }
    }
  }

  process.stdout.write(
    `blog-build: ✓ in sync (${published.length} published post(s))\n`,
  );
}

function reportDiff(actual, expected) {
  const a = actual.split('\n');
  const e = expected.split('\n');
  const max = Math.min(a.length, e.length);
  for (let i = 0; i < max; i++) {
    if (a[i] !== e[i]) {
      process.stderr.write(`  line ${i + 1}:\n`);
      process.stderr.write(`    current:  ${a[i]}\n`);
      process.stderr.write(`    expected: ${e[i]}\n`);
      return;
    }
  }
  if (a.length !== e.length) {
    process.stderr.write(
      `  length mismatch: current=${a.length} lines, expected=${e.length} lines\n`,
    );
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = {
    check: false,
    checkOnlyValidation: false,
    emitSanitized: false,
    input: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') out.check = true;
    else if (a === '--check-only-validation') out.checkOnlyValidation = true;
    else if (a === '--emit-sanitized') out.emitSanitized = true;
    else if (a === '--input') {
      out.input = argv[++i];
    } else {
      die(`unknown flag: ${a}`);
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  try {
    if (args.checkOnlyValidation || args.emitSanitized) {
      if (!args.input) {
        die(`--check-only-validation and --emit-sanitized require --input <path>`);
      }
      const file = path.resolve(args.input);
      if (!fs.existsSync(file)) die(`input not found: ${args.input}`);
      const post = loadSinglePost(file);
      const bodyHtml = renderBodyHtml(post.bodyMd);
      if (args.emitSanitized) {
        process.stdout.write(bodyHtml);
        if (!bodyHtml.endsWith('\n')) process.stdout.write('\n');
      }
      if (args.checkOnlyValidation) {
        process.stdout.write(
          `blog-build: ✓ validation passed (${path.relative(REPO_ROOT, file)})\n`,
        );
      }
      return;
    }

    const collection = loadAllPosts();
    if (args.check) checkAll(collection);
    else writeAll(collection);
  } catch (e) {
    if (e instanceof BuildError) die(e.message);
    process.stderr.write(`blog-build: ${e.stack || e.message}\n`);
    process.exit(1);
  }
}

main();
