#!/usr/bin/env node
/**
 * scripts/check-sitemap-drift.js — spec 009
 *
 * Bidirectional drift gate for sitemap.xml ↔ <link rel="canonical">
 * across every served HTML page.
 *
 * Validations:
 *   V-1 (forward):  every <loc> in sitemap(s) resolves to a file on disk.
 *   V-2 (backward): every served page declaring <link rel="canonical">
 *                   has its canonical URL listed in some sitemap, unless
 *                   excluded.
 *   V-3 (warning):  served pages without canonical and not excluded
 *                   emit a warning (no exit).
 *
 * The site has a root sitemap.xml and an auto-generated
 * interviews/sitemap.xml. They are treated as a union for matching.
 *
 * See specs/009-security-headers-hardening/contracts/sitemap-drift-gate.md
 *
 * Exit 0 on success, 1 on V-1 or V-2 violation.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.resolve(__dirname, '..');
const SITE_ORIGIN = 'https://ardops.dev';

const SITEMAP_FILES = ['sitemap.xml', 'interviews/sitemap.xml'];

// Pages that are SERVED but intentionally NOT in any sitemap.
// Document any addition here with a clear reason.
const EXCLUDED_FROM_SITEMAP = new Set([
  '404.html',                       // error page, not indexable
  'interviews/valid-minimal.html',  // fixture (--include-fixtures only)
  'interviews/xss-attempt.html',    // fixture (--include-fixtures only)
]);

const STATIC_PAGES = ['index.html', '404.html', 'talks/index.html'];

function listGenerated(dir) {
  const abs = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(dir, f));
}

function discoverPages() {
  return [
    ...STATIC_PAGES.filter((p) => fs.existsSync(path.join(REPO_ROOT, p))),
    ...listGenerated('blog'),
    ...listGenerated('interviews'),
  ];
}

/** Strip origin and trailing slash (except for root "/"). */
function normalizePath(loc) {
  let p;
  try {
    p = new URL(loc, SITE_ORIGIN + '/').pathname;
  } catch {
    return loc;
  }
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/** Map URL path to expected file on disk. */
function pathToFile(p) {
  if (p === '/' || p === '') return 'index.html';
  const stripped = p.startsWith('/') ? p.slice(1) : p;
  if (stripped.endsWith('/')) return stripped + 'index.html';
  if (stripped.endsWith('.html')) return stripped;
  // spec 011 — feed files (and other direct artifacts) are addressable
  // directly; treat any path with a recognized non-html extension as a file.
  if (/\.(xml|json|txt|webmanifest|ico|svg|png|jpe?g|webp|woff2?)$/i.test(stripped)) {
    return stripped;
  }
  // bare directory without trailing slash (already normalized) → index.html
  return stripped + '/index.html';
}

function parseSitemap(file) {
  const abs = path.join(REPO_ROOT, file);
  if (!fs.existsSync(abs)) return [];
  const xml = fs.readFileSync(abs, 'utf8');
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const locs = dom.window.document.querySelectorAll('loc');
  return Array.from(locs).map((el) => ({
    file,
    loc: el.textContent.trim(),
    path: normalizePath(el.textContent.trim()),
  }));
}

function extractCanonical(file) {
  const abs = path.join(REPO_ROOT, file);
  const html = fs.readFileSync(abs, 'utf8');
  const dom = new JSDOM(html);
  const link = dom.window.document.querySelector('link[rel="canonical"]');
  if (!link) return null;
  const href = link.getAttribute('href');
  return { href, path: normalizePath(href) };
}

function main() {
  const errors = [];
  const warnings = [];

  // Collect sitemap entries from all sitemaps as union.
  const allEntries = [];
  for (const sm of SITEMAP_FILES) {
    allEntries.push(...parseSitemap(sm));
  }
  const sitemapPaths = new Set(allEntries.map((e) => e.path));

  // V-1: each <loc> resolves to a file.
  for (const e of allEntries) {
    const file = pathToFile(e.path);
    const abs = path.join(REPO_ROOT, file);
    if (!fs.existsSync(abs)) {
      errors.push({
        rule: 'V-1',
        sitemap: e.file,
        loc: e.loc,
        message: `<loc> resolves to ${file} but file does not exist`,
      });
    }
  }

  // V-2: every canonical of a served (non-excluded) page is in sitemap.
  // V-3: warn when a served page lacks canonical.
  const pages = discoverPages();
  let canonicalsChecked = 0;
  let pagesWithoutCanonical = 0;
  for (const file of pages) {
    if (EXCLUDED_FROM_SITEMAP.has(file)) continue;
    const c = extractCanonical(file);
    if (!c) {
      pagesWithoutCanonical++;
      warnings.push({
        rule: 'V-3',
        file,
        message: 'served page has no <link rel="canonical">',
      });
      continue;
    }
    canonicalsChecked++;
    if (!sitemapPaths.has(c.path)) {
      errors.push({
        rule: 'V-2',
        file,
        canonical: c.href,
        message: `canonical not found in any sitemap (path "${c.path}")`,
      });
    }
  }

  if (errors.length > 0) {
    process.stderr.write(
      `\u2717 sitemap-drift gate: ${errors.length} violation(s) detected.\n\n`,
    );
    for (const e of errors) {
      if (e.rule === 'V-1') {
        process.stderr.write(
          `  V-1 (forward): ${e.sitemap} \u2192 dead <loc>\n`,
        );
        process.stderr.write(`    loc: ${e.loc}\n`);
        process.stderr.write(`    ${e.message}\n\n`);
      } else if (e.rule === 'V-2') {
        process.stderr.write(
          `  V-2 (backward): ${e.file} canonical missing from sitemap\n`,
        );
        process.stderr.write(`    canonical: ${e.canonical}\n`);
        process.stderr.write(`    ${e.message}\n`);
        process.stderr.write(
          `    Action: add <url><loc>${e.canonical}</loc>...</url> to sitemap.xml\n`,
        );
        process.stderr.write(
          `      (or, if intentional, add '${e.file}' to EXCLUDED_FROM_SITEMAP\n`,
        );
        process.stderr.write(
          `       in scripts/check-sitemap-drift.js)\n\n`,
        );
      }
    }
    process.exit(1);
  }

  if (warnings.length > 0) {
    for (const w of warnings) {
      process.stdout.write(`  warn  ${w.rule}: ${w.file} \u2014 ${w.message}\n`);
    }
  }

  process.stdout.write(
    `\u2713 sitemap-drift gate:\n` +
      `    - ${allEntries.length} sitemap entries across ${SITEMAP_FILES.length} sitemap(s), all resolve to files\n` +
      `    - ${canonicalsChecked} served page(s) with canonicals, all present in sitemap\n` +
      `    - ${pagesWithoutCanonical} served page(s) without canonical (excluding allowlist)\n`,
  );
}

if (require.main === module) main();

module.exports = {
  parseSitemap,
  extractCanonical,
  normalizePath,
  pathToFile,
  discoverPages,
};
