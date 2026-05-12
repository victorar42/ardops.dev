#!/usr/bin/env node
/**
 * scripts/check-nav-consistency.js — spec 008
 *
 * Validates that every served HTML page renders the canonical
 * <header> (with skip link + nav) and <footer> as defined in
 * scripts/lib/layout.js. Catches drift introduced by hand-edits or
 * by builders that diverge from the single source of truth.
 *
 * Validations (V-1..V-8): see
 *   specs/008-shared-nav-and-footer/contracts/nav-consistency-gate.md
 *
 * Exit 0 on success, 1 on any violation.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { NAV, renderHeader, renderFooter } = require('./lib/layout');

const REPO_ROOT = path.resolve(__dirname, '..');

const STATIC_PAGES = [
  { file: 'index.html',       currentPath: '/' },
  { file: '404.html',         currentPath: '/404' },
  { file: 'talks/index.html', currentPath: '/talks/' },
  { file: 'uses/index.html',  currentPath: '/uses/' },
];

function listGenerated(dir, currentPath) {
  const abs = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.html'))
    .map((f) => ({ file: path.join(dir, f), currentPath }));
}

function discoverPages() {
  return [
    ...STATIC_PAGES,
    ...listGenerated('blog', '/blog/'),
    ...listGenerated('interviews', '/interviews/'),
  ];
}

function normalizeWS(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function activeLabelFor(currentPath) {
  for (const item of NAV) {
    if (!item.isAnchor && item.match.includes(currentPath)) return item.label;
  }
  return null;
}

function validatePage({ file, currentPath }) {
  const abs = path.join(REPO_ROOT, file);
  const html = fs.readFileSync(abs, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const violations = [];

  // V-1 skip link present
  const skip = doc.querySelector('a.skip-link');
  if (!skip || skip.getAttribute('href') !== '#main' ||
      normalizeWS(skip.textContent) !== 'Saltar al contenido') {
    violations.push('V-1: skip link missing or malformed (expected <a class="skip-link" href="#main">Saltar al contenido</a>)');
  }

  // V-2 header present
  const header = doc.querySelector('header.site-header');
  if (!header) {
    violations.push('V-2: <header class="site-header"> missing');
    return violations;
  }

  // V-3 nav structure
  const nav = header.querySelector('nav.site-nav');
  if (!nav) {
    violations.push('V-3: <nav class="site-nav"> missing inside header');
    return violations;
  }
  if (nav.getAttribute('aria-label') !== 'Navegación principal') {
    violations.push(`V-3: nav aria-label expected "Navegación principal", got "${nav.getAttribute('aria-label')}"`);
  }

  // V-4 logo correct
  const logo = nav.querySelector('a.nav-logo');
  if (!logo || logo.getAttribute('href') !== '/') {
    violations.push(`V-4: logo expected <a href="/" class="nav-logo">, got href="${logo ? logo.getAttribute('href') : '(missing)'}"`);
  } else {
    const inner = normalizeWS(logo.innerHTML);
    if (inner !== 'ardops<span>.dev</span>') {
      violations.push(`V-4: logo inner expected "ardops<span>.dev</span>", got "${inner}"`);
    }
  }

  // V-5 items match NAV
  const items = nav.querySelectorAll('ul.nav-links > li > a');
  if (items.length !== NAV.length) {
    violations.push(`V-5: expected ${NAV.length} nav items, got ${items.length}`);
  } else {
    NAV.forEach((expected, i) => {
      const a = items[i];
      const gotHref = a.getAttribute('href');
      const gotLabel = normalizeWS(a.textContent);
      if (gotHref !== expected.href) {
        violations.push(`V-5: item #${i + 1} href expected "${expected.href}", got "${gotHref}"`);
      }
      if (gotLabel !== expected.label) {
        violations.push(`V-5: item #${i + 1} label expected "${expected.label}", got "${gotLabel}"`);
      }
    });
  }

  // V-6 active state correct
  const expectedActive = activeLabelFor(currentPath);
  const activeEls = nav.querySelectorAll('ul.nav-links a[aria-current="page"]');
  if (expectedActive === null) {
    if (activeEls.length !== 0) {
      violations.push(`V-6: expected NO aria-current on this page, found ${activeEls.length}`);
    }
  } else {
    if (activeEls.length !== 1) {
      violations.push(`V-6: expected exactly 1 aria-current, found ${activeEls.length}`);
    } else if (normalizeWS(activeEls[0].textContent) !== expectedActive) {
      violations.push(`V-6: expected "${expectedActive}" to have aria-current="page", got "${normalizeWS(activeEls[0].textContent)}"`);
    }
  }

  // V-7 footer present + structure
  const footer = doc.querySelector('footer.site-footer');
  if (!footer) {
    violations.push('V-7: <footer class="site-footer"> missing');
  } else {
    const expectedFooter = renderFooter();
    const expectedDom = new JSDOM(expectedFooter).window.document.querySelector('footer.site-footer');
    if (normalizeWS(footer.innerHTML) !== normalizeWS(expectedDom.innerHTML)) {
      violations.push('V-7: footer inner HTML differs from canonical renderFooter()');
    }
  }

  // V-8 covered transitively (every footer matches the canonical) → no extra check needed
  return violations;
}

function main() {
  const pages = discoverPages();
  let total = 0;
  const failures = [];
  for (const p of pages) {
    const v = validatePage(p);
    total++;
    if (v.length) failures.push({ page: p.file, violations: v });
  }

  if (failures.length === 0) {
    process.stdout.write(
      `OK: nav-consistency — ${total} page(s) validated against scripts/lib/layout.js\n`,
    );
    process.exit(0);
  }

  const totalV = failures.reduce((acc, f) => acc + f.violations.length, 0);
  process.stderr.write(`nav-consistency: ${totalV} violation(s) across ${failures.length} page(s)\n`);
  for (const f of failures) {
    process.stderr.write(`  ${f.page}\n`);
    for (const v of f.violations) {
      process.stderr.write(`    ${v}\n`);
    }
  }
  process.stderr.write(
    `\n→ run \`node scripts/build-layout.js && node scripts/build-blog.js && node scripts/build-interviews.js\` to regenerate\n`,
  );
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { validatePage, discoverPages };
