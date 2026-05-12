#!/usr/bin/env node
/**
 * scripts/check-seo-meta.js — spec 011
 *
 * For every served HTML page, validate that the required SEO meta tags
 * are present and non-empty.
 *
 * See specs/011-rss-jsonld-seo/contracts/seo-meta-gate.md
 *
 * Exit 0 on success, 1 on any violation.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.resolve(__dirname, '..');

const STATIC_PAGES = ['index.html', '404.html', 'talks/index.html', 'uses/index.html'];

// Per D-008: 404.html is not indexable; canonical is intentionally optional.
const PER_PAGE_RULES = {
  '404.html': { skipCanonical: true },
};

const REQUIRED = [
  { kind: 'canonical', selector: 'link[rel="canonical"]', attr: 'href' },
  { kind: 'description', selector: 'meta[name="description"]', attr: 'content' },
  { kind: 'og:title', selector: 'meta[property="og:title"]', attr: 'content' },
  { kind: 'og:description', selector: 'meta[property="og:description"]', attr: 'content' },
  { kind: 'og:url', selector: 'meta[property="og:url"]', attr: 'content' },
  { kind: 'og:image', selector: 'meta[property="og:image"]', attr: 'content' },
  { kind: 'og:type', selector: 'meta[property="og:type"]', attr: 'content' },
  { kind: 'twitter:card', selector: 'meta[name="twitter:card"]', attr: 'content' },
  { kind: 'theme-color', selector: 'meta[name="theme-color"]', attr: 'content' },
];

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

function validatePage(file) {
  const abs = path.join(REPO_ROOT, file);
  const html = fs.readFileSync(abs, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const rules = PER_PAGE_RULES[file] || {};
  const violations = [];

  for (const r of REQUIRED) {
    if (r.kind === 'canonical' && rules.skipCanonical) continue;
    const el = doc.querySelector(r.selector);
    if (!el) {
      violations.push(`seo-meta: ${file}: falta ${r.selector}`);
      continue;
    }
    const value = (el.getAttribute(r.attr) || '').trim();
    if (value.length === 0) {
      violations.push(`seo-meta: ${file}: ${r.selector} tiene ${r.attr} vacío`);
      continue;
    }
    if (r.kind === 'og:image' && !/^https?:\/\//.test(value)) {
      violations.push(`seo-meta: ${file}: og:image debe ser URL absoluta (got '${value}')`);
    }
  }

  // V-3: og:url and canonical must agree when both present
  if (!rules.skipCanonical) {
    const canonical = doc.querySelector('link[rel="canonical"]');
    const ogUrl = doc.querySelector('meta[property="og:url"]');
    if (canonical && ogUrl) {
      const c = (canonical.getAttribute('href') || '').trim();
      const u = (ogUrl.getAttribute('content') || '').trim();
      if (c && u && c !== u) {
        violations.push(`seo-meta: ${file}: canonical (${c}) y og:url (${u}) no coinciden`);
      }
    }
  }

  return violations;
}

function main() {
  const pages = discoverPages();
  const all = [];
  for (const file of pages) {
    for (const v of validatePage(file)) all.push(v);
  }
  if (all.length > 0) {
    for (const m of all) process.stderr.write(`${m}\n`);
    process.exit(1);
  }
  process.stdout.write(
    `✓ seo-meta gate: ${pages.length} page(s) validated, all meta tags present.\n`,
  );
}

main();
