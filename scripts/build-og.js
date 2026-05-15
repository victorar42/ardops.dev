#!/usr/bin/env node
/**
 * scripts/build-og.js
 *
 * Build OG (Open Graph) images for each published blog post.
 *
 * Modes:
 *   node scripts/build-og.js              # generate/cache/cleanup + write manifest
 *   node scripts/build-og.js --check      # exit 0 if no drift, 2 otherwise
 *   node scripts/build-og.js --regenerate # ignore cache, regenerate all
 *
 * Spec: 017-og-images-dynamic
 * Contratos: specs/017-og-images-dynamic/contracts/og-build-pipeline.md
 *            specs/017-og-images-dynamic/contracts/og-template.md
 *            specs/017-og-images-dynamic/contracts/og-manifest.md
 */

'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const sharp = require('sharp');

const {
  OG_TEMPLATE_VERSION,
  computeHash,
  loadManifest,
  writeManifest,
} = require('./og/manifest');

const {
  renderTitleLines,
  renderTagsSvg,
  embedFontsBase64,
  escapeXml,
} = require('./og/render');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(REPO_ROOT, 'content', 'blog');
const TEMPLATE_PATH = path.join(__dirname, 'og', 'template.svg');
const OUTPUT_DIR = path.join(REPO_ROOT, 'public', 'og', 'blog');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

// Maximum bytes per generated PNG (raw, not gzipped).
const MAX_PNG_BYTES = 100000;

// Filename regex matching build-blog.js convention: YYYY-MM-<slug>.md
const FILENAME_RE = /^\d{4}-\d{2}-[a-z0-9-]+\.md$/;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

class OgBuildError extends Error {}

function fail(msg, code = 1) {
  process.stderr.write(`[og-build] ✗ ${msg}\n`);
  process.exit(code);
}

// ---------------------------------------------------------------------------
// Post loading (minimal, dedicated — does not duplicate validation; full
// validation runs in build-blog.js downstream).
// ---------------------------------------------------------------------------

function listPostFiles() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && FILENAME_RE.test(e.name))
    .map((e) => path.join(CONTENT_DIR, e.name))
    .sort();
}

function loadPublishedPosts() {
  const files = listPostFiles();
  const posts = [];
  const seen = new Set();
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    let fm;
    try {
      fm = matter(raw).data;
    } catch (e) {
      throw new OgBuildError(
        `${path.relative(REPO_ROOT, file)}: invalid YAML frontmatter: ${e.message}`,
      );
    }
    if (fm.published !== true) continue;
    if (typeof fm.slug !== 'string' || !fm.slug) {
      throw new OgBuildError(
        `${path.relative(REPO_ROOT, file)}: missing or invalid 'slug' for published post`,
      );
    }
    if (typeof fm.title !== 'string' || !fm.title) {
      throw new OgBuildError(
        `${path.relative(REPO_ROOT, file)}: missing or invalid 'title' for published post`,
      );
    }
    if (seen.has(fm.slug)) {
      throw new OgBuildError(`duplicate slug '${fm.slug}'`);
    }
    seen.add(fm.slug);
    const tags = Array.isArray(fm.tags) ? fm.tags.map((t) => String(t)) : [];
    posts.push({ file, slug: fm.slug, title: fm.title, tags });
  }
  posts.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return posts;
}

// ---------------------------------------------------------------------------
// SVG rendering
// ---------------------------------------------------------------------------

let _templateCache = null;
function loadTemplate() {
  if (_templateCache !== null) return _templateCache;
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new OgBuildError(`missing template: ${TEMPLATE_PATH}`);
  }
  _templateCache = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  return _templateCache;
}

function buildSvg(post) {
  const tmpl = loadTemplate();
  const titleSvg = renderTitleLines(post.title);
  const tagsSvg = renderTagsSvg(post.tags);
  const fontFaces = embedFontsBase64();
  return tmpl
    .replace('{{FONT_FACES}}', fontFaces)
    .replace('{{TITLE_LINES}}', titleSvg)
    .replace('{{TAGS_SVG}}', tagsSvg)
    .replace('{{LOGO_TEXT}}', escapeXml('ardops.dev'));
}

async function renderPng(svg) {
  // No `.withMetadata()` → no EXIF/XMP/timestamp. Reproducible.
  return sharp(Buffer.from(svg, 'utf8'))
    .png({
      compressionLevel: 9,
      adaptiveFiltering: false,
      palette: false,
      effort: 10,
    })
    .toBuffer();
}

// ---------------------------------------------------------------------------
// Build pipeline
// ---------------------------------------------------------------------------

async function buildAll({ check = false, regenerate = false } = {}) {
  const posts = loadPublishedPosts();
  const manifest = loadManifest(MANIFEST_PATH);

  // Drift reasons collected when `--check` is on.
  const drift = [];

  // Template version mismatch globally?
  if (manifest.templateVersion !== OG_TEMPLATE_VERSION) {
    if (check) {
      drift.push({
        slug: '(global)',
        reason: `template-version-mismatch: manifest=${manifest.templateVersion} builder=${OG_TEMPLATE_VERSION} (regenerate-all)`,
      });
    } else {
      // In write mode, bump version and force regeneration of all.
      manifest.templateVersion = OG_TEMPLATE_VERSION;
      regenerate = true;
    }
  }

  const publishedSlugs = new Set(posts.map((p) => p.slug));
  const generated = [];
  const cached = [];
  const regenerated = [];
  let maxBytes = 0;

  // Ensure output dir exists (write mode only).
  if (!check && !fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const post of posts) {
    const expectedHash = computeHash({
      title: post.title,
      tags: post.tags,
      templateVersion: OG_TEMPLATE_VERSION,
    });
    const pngPath = path.join(OUTPUT_DIR, `${post.slug}.png`);
    const pngExists = fs.existsSync(pngPath);
    const entry = manifest.entries[post.slug];

    const hashMatch = entry && entry.hash === expectedHash;
    const needsRender = regenerate || !entry || !hashMatch || !pngExists;

    if (check) {
      if (!entry) {
        drift.push({ slug: post.slug, reason: 'new-post-no-entry' });
      } else if (!hashMatch) {
        drift.push({
          slug: post.slug,
          reason: `hash-mismatch (expected ${expectedHash.slice(0, 12)}…, found ${entry.hash.slice(0, 12)}…)`,
        });
      } else if (!pngExists) {
        drift.push({ slug: post.slug, reason: 'missing-png' });
      }
      continue;
    }

    if (!needsRender) {
      process.stdout.write(`[og-build]   ${post.slug}: cached (hash match)\n`);
      cached.push(post.slug);
      const stat = fs.statSync(pngPath);
      if (stat.size > maxBytes) maxBytes = stat.size;
      continue;
    }

    const label = entry ? 'regenerating' : 'generating';
    process.stdout.write(`[og-build]   ${post.slug}: ${label}\n`);
    const svg = buildSvg(post);
    let buf;
    try {
      buf = await renderPng(svg);
    } catch (e) {
      throw new OgBuildError(`${post.slug}: sharp render failed: ${e.message}`);
    }
    if (buf.length > MAX_PNG_BYTES) {
      throw new OgBuildError(
        `${post.slug}: PNG ${buf.length} B exceeds budget ${MAX_PNG_BYTES} B`,
      );
    }
    fs.writeFileSync(pngPath, buf);
    if (buf.length > maxBytes) maxBytes = buf.length;

    manifest.entries[post.slug] = {
      hash: expectedHash,
      title: post.title,
      tags: post.tags,
    };
    if (entry) regenerated.push(post.slug);
    else generated.push(post.slug);
  }

  // Orphans (manifest entries + PNG files whose slug is no longer a published post)
  const orphansRemoved = [];
  const orphanEntries = [];
  for (const slug of Object.keys(manifest.entries)) {
    if (!publishedSlugs.has(slug)) {
      orphanEntries.push(slug);
    }
  }
  const existingPngs = fs.existsSync(OUTPUT_DIR)
    ? fs
        .readdirSync(OUTPUT_DIR)
        .filter((f) => f.endsWith('.png'))
        .map((f) => f.replace(/\.png$/, ''))
    : [];
  const orphanPngs = existingPngs.filter((s) => !publishedSlugs.has(s));

  if (check) {
    for (const slug of orphanEntries) {
      drift.push({ slug, reason: 'orphan-entry' });
    }
    for (const slug of orphanPngs) {
      drift.push({ slug, reason: 'orphan-png' });
    }
  } else {
    for (const slug of orphanEntries) {
      delete manifest.entries[slug];
      process.stdout.write(`[og-build]   ${slug}: removed orphan entry\n`);
    }
    for (const slug of orphanPngs) {
      const p = path.join(OUTPUT_DIR, `${slug}.png`);
      fs.unlinkSync(p);
      orphansRemoved.push(`${slug}.png`);
      process.stdout.write(`[og-build]   removed orphan PNG: ${slug}.png\n`);
    }
  }

  if (check) {
    if (drift.length > 0) {
      for (const d of drift) {
        process.stderr.write(`[og-drift] ${d.slug}: ${d.reason}\n`);
      }
      process.stderr.write(
        `[og-build] ✗ drift detected: ${drift.length} issue(s)\n`,
      );
      process.exit(2);
    }
    process.stdout.write(
      `[og-build] ✓ OG manifest in sync (${posts.length} post(s))\n`,
    );
    return { drift: [] };
  }

  // Persist manifest.
  writeManifest(MANIFEST_PATH, manifest);

  process.stdout.write(
    `[og-build] ✓ ${generated.length} generated, ${regenerated.length} regenerated, ${cached.length} cached, ${orphansRemoved.length} orphan(s) removed, manifest updated\n`,
  );
  process.stdout.write(
    `[og-build]   bytes: max=${maxBytes} B, budget=${MAX_PNG_BYTES} B\n`,
  );

  return {
    generated,
    regenerated,
    cached,
    orphansRemoved,
    maxBytes,
    manifest,
  };
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { check: false, regenerate: false };
  for (const a of argv.slice(2)) {
    if (a === '--check') args.check = true;
    else if (a === '--regenerate' || a === '--regenerate-og') args.regenerate = true;
    else if (a === '--help' || a === '-h') {
      process.stdout.write(
        'Usage: build-og.js [--check] [--regenerate]\n',
      );
      process.exit(0);
    } else {
      fail(`unknown argument: ${a}`);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  try {
    await buildAll(args);
  } catch (e) {
    if (e instanceof OgBuildError) fail(e.message);
    throw e;
  }
}

if (require.main === module) {
  main().catch((e) => {
    process.stderr.write(`[og-build] ✗ unexpected error: ${e.stack || e.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  buildAll,
  loadPublishedPosts,
  buildSvg,
  OG_TEMPLATE_VERSION,
  MAX_PNG_BYTES,
  MANIFEST_PATH,
  OUTPUT_DIR,
};
