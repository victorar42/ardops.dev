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
const { META_REFERRER } = require('./lib/head');

const REPO_ROOT = path.resolve(__dirname, '..');

const NAV_START = '<!-- nav:start -->';
const NAV_END = '<!-- nav:end -->';
const FOOTER_START = '<!-- footer:start -->';
const FOOTER_END = '<!-- footer:end -->';
const HEAD_META_START = '<!-- head-meta:start -->';
const HEAD_META_END = '<!-- head-meta:end -->';

const PAGES = [
  { file: 'index.html',       currentPath: '/' },
  { file: '404.html',         currentPath: '/404' },
  { file: 'talks/index.html', currentPath: '/talks/' },
  { file: 'speaking/index.html', currentPath: '/speaking/' },
  { file: 'uses/index.html',  currentPath: '/uses/' },
  { file: 'now/index.html',   currentPath: '/now/' },
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

/**
 * spec 009: replace the contents between <!-- head-meta:start --> and
 * <!-- head-meta:end --> with the canonical head meta block (currently
 * just the referrer policy). Indented to fit inside <head>.
 */
function replaceHeadMeta(html, file) {
  const startIdx = html.indexOf(HEAD_META_START);
  const endIdx = html.indexOf(HEAD_META_END);
  if (startIdx < 0 || endIdx < 0) {
    die(`${file}: missing markers '${HEAD_META_START}' / '${HEAD_META_END}'`);
  }
  if (endIdx < startIdx) {
    die(`${file}: '${HEAD_META_END}' appears before '${HEAD_META_START}'`);
  }
  const before = html.slice(0, startIdx + HEAD_META_START.length);
  const after = html.slice(endIdx);
  return `${before}\n  ${META_REFERRER}\n  ${after}`;
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
  updated = replaceHeadMeta(updated, file);

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
