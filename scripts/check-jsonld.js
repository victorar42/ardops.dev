#!/usr/bin/env node
/**
 * scripts/check-jsonld.js — spec 011
 *
 * For every served HTML page, extract every <script type="application/ld+json">,
 * parse it as strict JSON, and verify any internal @id references resolve to
 * a known @id (same page or global allowlist).
 *
 * See specs/011-rss-jsonld-seo/contracts/jsonld-validate-gate.md
 *
 * Exit 0 on success, 1 on any violation.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.resolve(__dirname, '..');

const STATIC_PAGES = ['index.html', '404.html', 'talks/index.html', 'uses/index.html', 'speaking/index.html', 'now/index.html'];
const GLOBAL_IDS = new Set(['https://ardops.dev/#person']);

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

function collectIds(node, ids) {
  if (Array.isArray(node)) {
    for (const n of node) collectIds(n, ids);
    return;
  }
  if (node && typeof node === 'object') {
    if (typeof node['@id'] === 'string') ids.add(node['@id']);
    for (const v of Object.values(node)) collectIds(v, ids);
  }
}

function collectIdRefs(node, refs) {
  if (Array.isArray(node)) {
    for (const n of node) collectIdRefs(n, refs);
    return;
  }
  if (node && typeof node === 'object') {
    const keys = Object.keys(node);
    if (keys.length === 1 && keys[0] === '@id' && typeof node['@id'] === 'string') {
      refs.add(node['@id']);
    }
    for (const v of Object.values(node)) collectIdRefs(v, refs);
  }
}

function validateBlock(file, idx, json, pageIds, violations) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    violations.push(`jsonld-validate: ${file}: V-2: block #${idx + 1} root must be an object`);
    return;
  }
  if (json['@context'] !== 'https://schema.org') {
    violations.push(`jsonld-validate: ${file}: V-2: block #${idx + 1} missing or wrong @context (expected 'https://schema.org')`);
  }
  if (typeof json['@type'] !== 'string') {
    violations.push(`jsonld-validate: ${file}: V-2: block #${idx + 1} missing @type`);
  }

  if (json['@type'] === 'Article') {
    for (const f of ['@id', 'headline', 'datePublished', 'author', 'mainEntityOfPage']) {
      if (json[f] === undefined) {
        violations.push(`jsonld-validate: ${file}: V-5: Article missing '${f}'`);
      }
    }
  }
  if (json['@type'] === 'BreadcrumbList') {
    if (!Array.isArray(json.itemListElement) || json.itemListElement.length === 0) {
      violations.push(`jsonld-validate: ${file}: V-6: BreadcrumbList itemListElement must be non-empty array`);
    } else {
      for (const [i, el] of json.itemListElement.entries()) {
        if (el.position !== i + 1) {
          violations.push(`jsonld-validate: ${file}: V-6: BreadcrumbList[${i}] position must be ${i + 1}, got ${el.position}`);
        }
      }
    }
  }
  if (json['@type'] === 'ItemList') {
    if (!Array.isArray(json.itemListElement)) {
      violations.push(`jsonld-validate: ${file}: V-7: ItemList itemListElement must be an array`);
    }
  }
}

function validatePage(file) {
  const abs = path.join(REPO_ROOT, file);
  const html = fs.readFileSync(abs, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));

  const violations = [];
  const pageIds = new Set();
  const blocks = [];

  for (const [idx, s] of scripts.entries()) {
    const text = s.textContent.trim();
    if (text.length === 0) {
      violations.push(`jsonld-validate: ${file}: V-1: block #${idx + 1} is empty`);
      continue;
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      violations.push(`jsonld-validate: ${file}: V-1: block #${idx + 1} invalid JSON: ${e.message}`);
      continue;
    }
    blocks.push(json);
    collectIds(json, pageIds);
  }

  for (const [idx, json] of blocks.entries()) {
    validateBlock(file, idx, json, pageIds, violations);
  }

  // V-3: every @id reference resolves
  const refs = new Set();
  for (const json of blocks) collectIdRefs(json, refs);
  for (const ref of refs) {
    if (!pageIds.has(ref) && !GLOBAL_IDS.has(ref)) {
      violations.push(`jsonld-validate: ${file}: V-3: @id reference '${ref}' not found in page or global allowlist`);
    }
  }

  // V-4: index.html must declare PERSON_ID
  if (file === 'index.html' && !pageIds.has('https://ardops.dev/#person')) {
    violations.push(`jsonld-validate: ${file}: V-4: index.html must declare Person with @id 'https://ardops.dev/#person'`);
  }

  return { violations, blocks: blocks.length };
}

function main() {
  const pages = discoverPages();
  const all = [];
  let totalBlocks = 0;
  for (const file of pages) {
    const { violations, blocks } = validatePage(file);
    totalBlocks += blocks;
    for (const v of violations) all.push(v);
  }
  if (all.length > 0) {
    for (const m of all) process.stderr.write(`${m}\n`);
    process.exit(1);
  }
  process.stdout.write(
    `✓ jsonld-validate gate: ${pages.length} page(s) checked, ${totalBlocks} JSON-LD block(s) validated, all pass.\n`,
  );
}

main();
