#!/usr/bin/env node
/**
 * scripts/check-external-links.js — spec 009
 *
 * Validates that every served HTML page is free of tabnabbing risk:
 * any <a target="_blank"> pointing to an external host MUST include
 * `noopener` and `noreferrer` in its rel attribute.
 *
 * Validations:
 *   V-1: rel attribute present on every external <a target="_blank">
 *   V-2: rel contains both `noopener` and `noreferrer` tokens
 *
 * Internal links (same origin or relative paths), mailto:, tel:, and
 * fragments are ignored.
 *
 * See specs/009-security-headers-hardening/contracts/external-links-gate.md
 *
 * Exit 0 on success, 1 on any violation.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.resolve(__dirname, '..');
const SITE_ORIGIN = 'https://ardops.dev';
const REQUIRED_REL_TOKENS = ['noopener', 'noreferrer'];

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

/**
 * True iff href resolves to a different host than ardops.dev over http(s).
 * mailto:, tel:, fragments, and same-origin paths return false.
 */
function isExternal(href) {
  if (!href) return false;
  let u;
  try {
    u = new URL(href, SITE_ORIGIN + '/');
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  if (!u.host) return false;
  return u.host !== 'ardops.dev';
}

function validatePage(file) {
  const abs = path.join(REPO_ROOT, file);
  const html = fs.readFileSync(abs, 'utf8');
  const dom = new JSDOM(html);
  const anchors = dom.window.document.querySelectorAll('a[target="_blank"]');
  const violations = [];
  let externalCount = 0;
  for (const a of anchors) {
    const href = a.getAttribute('href');
    if (!isExternal(href)) continue;
    externalCount++;
    const rel = (a.getAttribute('rel') || '').toLowerCase();
    const tokens = rel.split(/\s+/).filter(Boolean);
    if (!a.hasAttribute('rel')) {
      violations.push({
        rule: 'V-1',
        href,
        message: 'missing rel attribute (need rel="noopener noreferrer")',
      });
      continue;
    }
    const missing = REQUIRED_REL_TOKENS.filter((t) => !tokens.includes(t));
    if (missing.length > 0) {
      violations.push({
        rule: 'V-2',
        href,
        message: `rel missing token(s): ${missing.join(', ')} (current rel="${rel}")`,
      });
    }
  }
  return { externalCount, violations };
}

function main() {
  const pages = discoverPages();
  let totalExternal = 0;
  let totalViolations = 0;
  const failingPages = [];
  for (const file of pages) {
    const r = validatePage(file);
    totalExternal += r.externalCount;
    if (r.violations.length > 0) {
      totalViolations += r.violations.length;
      failingPages.push({ file, violations: r.violations });
    }
  }
  if (failingPages.length > 0) {
    process.stderr.write(
      `\u2717 external-links gate: ${totalViolations} violation(s) detected.\n\n`,
    );
    for (const { file, violations } of failingPages) {
      process.stderr.write(`  ${file}:\n`);
      for (const v of violations) {
        process.stderr.write(`    - ${v.rule}: ${v.message}\n`);
        process.stderr.write(`      href: ${v.href}\n`);
      }
      process.stderr.write('\n');
    }
    process.stderr.write(
      `  Fix: add rel="noopener noreferrer" to each <a target="_blank"> pointing to an external host.\n`,
    );
    process.exit(1);
  }
  process.stdout.write(
    `\u2713 external-links gate: ${totalExternal} external link(s) validated across ${pages.length} page(s), all pass.\n`,
  );
}

if (require.main === module) main();

module.exports = { isExternal, validatePage, discoverPages };
