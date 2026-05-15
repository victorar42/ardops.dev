/**
 * scripts/og/manifest.js
 *
 * Manifest helpers: hashing, load, write.
 *
 * Spec: 017-og-images-dynamic
 * Contrato: specs/017-og-images-dynamic/contracts/og-manifest.md
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OG_TEMPLATE_VERSION = 'v1';
const MANIFEST_VERSION = 1;

function computeHash({ title, tags, templateVersion = OG_TEMPLATE_VERSION }) {
  const sortedTags = Array.isArray(tags) ? [...tags].sort().join(',') : '';
  const payload = `${templateVersion}\n${title}\n${sortedTags}\n`;
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

function emptyManifest() {
  return {
    version: MANIFEST_VERSION,
    templateVersion: OG_TEMPLATE_VERSION,
    entries: {},
  };
}

function loadManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return emptyManifest();
  const raw = fs.readFileSync(manifestPath, 'utf8');
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return emptyManifest();
    return {
      version: obj.version || MANIFEST_VERSION,
      templateVersion: obj.templateVersion || OG_TEMPLATE_VERSION,
      entries: obj.entries && typeof obj.entries === 'object' ? obj.entries : {},
    };
  } catch (_e) {
    return emptyManifest();
  }
}

/**
 * Serialize manifest deterministically:
 *  - top-level key order: version, templateVersion, entries
 *  - entries ordered alphabetically by slug
 *  - each entry has keys in fixed order: hash, title, tags
 *  - JSON.stringify(_, null, 2) + '\n'
 */
function serializeManifest(m) {
  const sortedSlugs = Object.keys(m.entries || {}).sort();
  const entries = {};
  for (const slug of sortedSlugs) {
    const e = m.entries[slug];
    entries[slug] = {
      hash: e.hash,
      title: e.title,
      tags: Array.isArray(e.tags) ? e.tags : [],
    };
  }
  const ordered = {
    version: m.version || MANIFEST_VERSION,
    templateVersion: m.templateVersion || OG_TEMPLATE_VERSION,
    entries,
  };
  return JSON.stringify(ordered, null, 2) + '\n';
}

function writeManifest(manifestPath, m) {
  const dir = path.dirname(manifestPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(manifestPath, serializeManifest(m), 'utf8');
}

module.exports = {
  OG_TEMPLATE_VERSION,
  MANIFEST_VERSION,
  computeHash,
  emptyManifest,
  loadManifest,
  writeManifest,
  serializeManifest,
};
