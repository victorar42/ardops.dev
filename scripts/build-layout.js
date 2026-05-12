#!/usr/bin/env node
/**
 * scripts/build-layout.js — spec 008
 *
 * Marker-pattern processor for static pages that don't go through a
 * dedicated builder. Replaces the contents between
 *   <!-- nav:start --> ... <!-- nav:end -->
 *   <!-- footer:start --> ... <!-- footer:end -->
 * with the canonical HTML emitted by scripts/lib/layout.js.
 *
 * Pages processed (path → currentPath passed to renderHeader):
 *   index.html         → /
 *   404.html           → /404      (no item matches; no aria-current)
 *   talks/index.html   → /talks/
 *
 * CLI flags:
 *   (none)     write all artifacts in place
 *   --check    dry-run; exit 1 if any page is out of sync
 *
 * See specs/008-shared-nav-and-footer/.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { renderHeader, renderFooter } = require('./lib/layout');

const REPO_ROOT = path.resolve(__dirname, '..');

const NAV_START = '<!-- nav:start -->';
const NAV_END = '<!-- nav:end -->';
const FOOTER_START = '<!-- footer:start -->';
const FOOTER_END = '<!-- footer:end -->';

const PAGES = [
  { file: 'index.html',       currentPath: '/' },
  { file: '404.html',         currentPath: '/404' },
  { file: 'talks/index.html', currentPath: '/talks/' },
];

function die(msg) {
  process.stderr.write(`build-layout: ${msg}\n`);
  process.exit(1);
}

function replaceBlock(html, startMarker, endMarker, newInner, file) {
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx < 0 || endIdx < 0) {
    die(`${file}: missing markers '${startMarker}' / '${endMarker}'`);
  }
  if (endIdx < startIdx) {
    die(`${file}: '${endMarker}' appears before '${startMarker}'`);
  }
  const before = html.slice(0, startIdx + startMarker.length);
  const after = html.slice(endIdx);
  // Inner format: newline + content + newline + 2-space indent before endMarker
  return `${before}\n${newInner}\n  ${after}`;
}

function processPage({ file, currentPath }, { check }) {
  const abs = path.join(REPO_ROOT, file);
  if (!fs.existsSync(abs)) {
    die(`${file}: file does not exist`);
  }
  const original = fs.readFileSync(abs, 'utf8');

  let updated = replaceBlock(
    original,
    NAV_START,
    NAV_END,
    renderHeader(currentPath),
    file,
  );
  updated = replaceBlock(
    updated,
    FOOTER_START,
    FOOTER_END,
    renderFooter(),
    file,
  );

  if (updated === original) {
    return { file, changed: false };
  }
  if (check) {
    return { file, changed: true, drift: true };
  }
  fs.writeFileSync(abs, updated, 'utf8');
  return { file, changed: true };
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');

  let drift = false;
  for (const page of PAGES) {
    const r = processPage(page, { check });
    if (r.drift) {
      drift = true;
      process.stderr.write(`build-layout: drift in ${r.file}\n`);
    } else if (r.changed) {
      process.stdout.write(`build-layout: wrote ${r.file}\n`);
    } else {
      process.stdout.write(`build-layout: ok    ${r.file}\n`);
    }
  }

  if (check && drift) {
    process.stderr.write(
      `build-layout: --check failed. Run 'node scripts/build-layout.js' to regenerate.\n`,
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { processPage, PAGES };
