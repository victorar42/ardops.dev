#!/usr/bin/env node
/**
 * scripts/build-pipeline.js — spec 005 (pipeline section)
 *
 * Reads `content/pipeline.json`, validates each item against the schema
 * defined in specs/005-pipeline-section/contracts/pipeline-schema.json
 * (see also data-model.md for the human-readable description), and emits a
 * fully-resolved HTML block between the markers `<!-- pipeline:start -->`
 * and `<!-- pipeline:end -->` in `index.html`.
 *
 * Goals:
 *   - Zero runtime JS for visitors (constitution VII).
 *   - Zero new dependencies — only Node stdlib (`node:fs`, `node:path`).
 *   - Idempotent: re-running with the same JSON yields byte-identical HTML.
 *   - Strict by default: any invalid input aborts with exit≠0 and an
 *     actionable message (see contracts/ci-gate.md).
 *
 * CLI flags:
 *   --check                          dry-run: regenerate the section in
 *                                    memory and compare with the current
 *                                    block in index.html. Exit 1 if they
 *                                    differ (out-of-sync detector).
 *   --check-only-validation          run schema validation only; do not
 *                                    touch index.html. Used by
 *                                    tests/pipeline-schema.sh.
 *   --input <path>                   read pipeline JSON from <path> instead
 *                                    of content/pipeline.json. Used to
 *                                    exercise negative fixtures.
 *
 * Default mode (no flags): validate + write. Reads content/pipeline.json,
 * rewrites the marker block in index.html in place, prints a summary line.
 *
 * See specs/005-pipeline-section/ for spec, plan, contracts, quickstart.
 */
'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_INPUT = path.join(REPO_ROOT, 'content', 'pipeline.json');
const INDEX_HTML = path.join(REPO_ROOT, 'index.html');

const MARKER_START = '<!-- pipeline:start -->';
const MARKER_END = '<!-- pipeline:end -->';

const ID_RE = /^[a-z0-9-]{3,80}$/;
const HTTPS_URL_RE = /^https:\/\/[\w.-]+(\/[\w./%#?&=+-]*)?$/;
const REL_PATH_RE = /^\/[\w./#?&=+-]*$/;

const TYPES = ['interview', 'lab', 'talk', 'post', 'other'];
const STAGES_ORDER = ['coming-soon', 'review', 'in-progress', 'backlog'];

const STAGE_LABEL = {
  'coming-soon': 'Pronto',
  'review': 'En revisión',
  'in-progress': 'En progreso',
  'backlog': 'Backlog',
};
const TYPE_LABEL = {
  'interview': 'Entrevista',
  'lab': 'Laboratorio',
  'talk': 'Charla',
  'post': 'Artículo',
  'other': 'Otro',
};

const TITLE_MIN = 1;
const TITLE_MAX = 120;
const DESC_MIN = 10;
const DESC_MAX = 280;
const ESTIMATED_MAX = 40;

const ALLOWED_ITEM_FIELDS = new Set([
  'id', 'type', 'title', 'stage', 'estimated', 'description', 'link',
]);
const ALLOWED_FILE_FIELDS = new Set(['$schema', 'items']);

const EMPTY_TEXT =
  'El pipeline está vacío por ahora — escribime si querés sugerirme algo.';

const INTRO_TEXT =
  'Así como un pipeline CI/CD muestra qué hay en cada etapa antes del deploy, esta sección muestra qué hay en preparación antes de la publicación.';

// ---------------------------------------------------------------------------
// SVG icon registry (16×16 viewBox, currentColor, aria-hidden)
// ---------------------------------------------------------------------------

const STAGE_ICON = {
  'coming-soon':
    // four-point sparkle / star (✦)
    '<path d="M8 1.5l1.6 4.9 4.9 1.6-4.9 1.6L8 14.5l-1.6-4.9L1.5 8l4.9-1.6z"/>',
  'review':
    // half-filled circle (◐)
    '<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.5a6.5 6.5 0 0 1 0 13z"/>',
  'in-progress':
    // diamond (◆)
    '<path d="M8 1.5l6.5 6.5L8 14.5 1.5 8z"/>',
  'backlog':
    // empty circle (○)
    '<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/>',
};

const TYPE_ICON = {
  'interview':
    // speech bubble
    '<path d="M2 3h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6l-3 2.5V12H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  'lab':
    // terminal prompt: > _
    '<rect x="1" y="3" width="14" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 6l2 2-2 2M8 10h4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  'talk':
    // microphone
    '<rect x="6" y="1.5" width="4" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 8a4.5 4.5 0 0 0 9 0M8 12.5v2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  'post':
    // document with lines
    '<path d="M3 1.5h7l3 3v10a.5.5 0 0 1-.5.5h-9.5A.5.5 0 0 1 2.5 14V2a.5.5 0 0 1 .5-.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 7h6M5 9.5h6M5 12h4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  'other':
    // empty diamond
    '<path d="M8 1.5l6.5 6.5L8 14.5 1.5 8z" fill="none" stroke="currentColor" stroke-width="1.5"/>',
};

function stageIcon(slug) {
  return `<svg class="pipeline-stage-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">${STAGE_ICON[slug]}</svg>`;
}

function typeIcon(slug) {
  return `<svg class="pipeline-type-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">${TYPE_ICON[slug]}</svg>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isExternalHttps(href) {
  return HTTPS_URL_RE.test(href);
}

function isRelative(href) {
  return REL_PATH_RE.test(href);
}

function fail(msg) {
  process.stderr.write(`pipeline-build: ${msg}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    check: false,
    validateOnly: false,
    input: DEFAULT_INPUT,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') args.check = true;
    else if (a === '--check-only-validation') args.validateOnly = true;
    else if (a === '--input') {
      const p = argv[++i];
      if (!p) fail("--input requires a path");
      args.input = path.resolve(REPO_ROOT, p);
    } else {
      fail(`unknown flag '${a}'`);
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateFile(data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    fail("invalid JSON: top-level value must be an object");
  }
  for (const k of Object.keys(data)) {
    if (!ALLOWED_FILE_FIELDS.has(k)) {
      fail(`unexpected top-level field '${k}' (allowed: $schema, items)`);
    }
  }
  if (!Array.isArray(data.items)) {
    fail("invalid JSON: 'items' must be an array");
  }
}

function validateItem(item, idx) {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    fail(`items[${idx}]: must be an object`);
  }
  // unknown field check
  for (const k of Object.keys(item)) {
    if (!ALLOWED_ITEM_FIELDS.has(k)) {
      const id = typeof item.id === 'string' ? item.id : `items[${idx}]`;
      fail(`${id}: unexpected field '${k}'`);
    }
  }
  // required fields
  for (const req of ['id', 'type', 'title', 'stage', 'description']) {
    if (!(req in item)) {
      fail(`items[${idx}]: missing required field '${req}'`);
    }
  }
  const id = item.id;
  if (typeof id !== 'string' || !ID_RE.test(id)) {
    fail(`items[${idx}]: invalid id (must match ${ID_RE})`);
  }
  if (typeof item.type !== 'string' || !TYPES.includes(item.type)) {
    fail(`${id}: invalid type '${item.type}' (allowed: ${TYPES.join(', ')})`);
  }
  if (typeof item.stage !== 'string' || !STAGES_ORDER.includes(item.stage)) {
    fail(`${id}: invalid stage '${item.stage}' (allowed: ${STAGES_ORDER.join(', ')})`);
  }
  if (typeof item.title !== 'string') {
    fail(`${id}: title must be a string`);
  }
  const tlen = item.title.trim().length;
  if (tlen < TITLE_MIN || item.title.length > TITLE_MAX) {
    fail(`${id}: title length out of range (1..${TITLE_MAX})`);
  }
  if (typeof item.description !== 'string') {
    fail(`${id}: description must be a string`);
  }
  if (item.description.length < DESC_MIN || item.description.length > DESC_MAX) {
    fail(`${id}: description length out of range (${DESC_MIN}..${DESC_MAX})`);
  }
  if ('estimated' in item) {
    if (typeof item.estimated !== 'string') {
      fail(`${id}: estimated must be a string`);
    }
    if (item.estimated.length === 0 || item.estimated.length > ESTIMATED_MAX) {
      fail(`${id}: estimated length out of range (1..${ESTIMATED_MAX})`);
    }
  }
  if ('link' in item) {
    if (typeof item.link !== 'string') {
      fail(`${id}: link must be a string`);
    }
    if (!isExternalHttps(item.link) && !isRelative(item.link)) {
      fail(`${id}: invalid link '${item.link}' (must be HTTPS absolute or '/...' relative)`);
    }
  }
}

function validateAll(data) {
  validateFile(data);
  const seen = new Set();
  data.items.forEach((it, idx) => {
    validateItem(it, idx);
    if (seen.has(it.id)) {
      fail(`duplicate id '${it.id}'`);
    }
    seen.add(it.id);
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderItem(item) {
  const stageLabel = STAGE_LABEL[item.stage];
  const typeLabel = TYPE_LABEL[item.type];

  const titleHTML = escapeHTML(item.title);
  const descHTML = escapeHTML(item.description);

  let estimatedHTML = '';
  if (item.estimated && item.estimated.trim().length > 0) {
    estimatedHTML = `\n        <p class="pipeline-item-estimated"><span class="pipeline-estimated-label">Estimado:</span> ${escapeHTML(item.estimated)}</p>`;
  }

  let linkHTML = '';
  if (item.link) {
    const href = escapeHTML(item.link);
    const isExternal = isExternalHttps(item.link);
    const attrs = isExternal
      ? ` target="_blank" rel="noopener noreferrer"`
      : '';
    linkHTML = `\n        <p class="pipeline-item-link"><a href="${href}"${attrs}>Ver más →</a></p>`;
  }

  return `      <li class="pipeline-item pipeline-item--${item.stage}">
        <span class="pipeline-stage" data-stage="${item.stage}">${stageIcon(item.stage)}<span class="pipeline-stage-label">${stageLabel}</span></span>
        <span class="pipeline-type" data-type="${item.type}">${typeIcon(item.type)}<span class="pipeline-type-label">${typeLabel}</span></span>
        <h3 class="pipeline-item-title">${titleHTML}</h3>${estimatedHTML}
        <p class="pipeline-item-description">${descHTML}</p>${linkHTML}
      </li>`;
}

function sortItems(items) {
  // Stable sort by stage canonical order; preserve input order within each stage (R-004).
  const indexed = items.map((it, i) => ({ it, i }));
  indexed.sort((a, b) => {
    const sa = STAGES_ORDER.indexOf(a.it.stage);
    const sb = STAGES_ORDER.indexOf(b.it.stage);
    if (sa !== sb) return sa - sb;
    return a.i - b.i;
  });
  return indexed.map((x) => x.it);
}

function renderEmpty() {
  return `${MARKER_START}
    <a id="blog" aria-hidden="true" tabindex="-1"></a>
    <section id="pipeline" class="section" aria-labelledby="pipeline-heading">
      <p class="section-label">// pipeline</p>
      <h2 id="pipeline-heading" class="section-title">Pipeline</h2>
      <p class="pipeline-intro">${escapeHTML(INTRO_TEXT)}</p>
      <p class="pipeline-empty">${escapeHTML(EMPTY_TEXT)}</p>
    </section>
    ${MARKER_END}`;
}

function renderSection(items) {
  if (!items || items.length === 0) {
    return renderEmpty();
  }
  const sorted = sortItems(items);
  const itemsHTML = sorted.map(renderItem).join('\n');
  return `${MARKER_START}
    <a id="blog" aria-hidden="true" tabindex="-1"></a>
    <section id="pipeline" class="section" aria-labelledby="pipeline-heading">
      <p class="section-label">// pipeline</p>
      <h2 id="pipeline-heading" class="section-title">Pipeline</h2>
      <p class="pipeline-intro">${escapeHTML(INTRO_TEXT)}</p>
      <ul class="pipeline-list">
${itemsHTML}
      </ul>
    </section>
    ${MARKER_END}`;
}

function stageCounts(items) {
  const counts = {};
  for (const s of STAGES_ORDER) counts[s] = 0;
  for (const it of items) counts[it.stage]++;
  return STAGES_ORDER.map((s) => `${s}=${counts[s]}`).join(', ');
}

// ---------------------------------------------------------------------------
// index.html marker handling
// ---------------------------------------------------------------------------

function readIndexBlock() {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const start = html.indexOf(MARKER_START);
  const end = html.indexOf(MARKER_END);
  if (start === -1 || end === -1 || end < start) {
    fail(`index.html missing markers '${MARKER_START}' / '${MARKER_END}' — add them around the section to be replaced.`);
  }
  // Include both markers in the block.
  const blockEnd = end + MARKER_END.length;
  return {
    html,
    start,
    blockEnd,
    block: html.slice(start, blockEnd),
  };
}

function writeIndexBlock(newBlock) {
  const { html, start, blockEnd } = readIndexBlock();
  const updated = html.slice(0, start) + newBlock + html.slice(blockEnd);
  fs.writeFileSync(INDEX_HTML, updated, 'utf8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));

  let raw;
  try {
    raw = fs.readFileSync(args.input, 'utf8');
  } catch (e) {
    fail(`cannot read input '${args.input}': ${e.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    fail(`invalid JSON: ${e.message}`);
  }

  validateAll(data);

  if (args.validateOnly) {
    process.stdout.write(`pipeline-build: ✓ validation passed (${data.items.length} item(s))\n`);
    return;
  }

  const newBlock = renderSection(data.items);

  if (args.check) {
    const cur = readIndexBlock();
    if (cur.block === newBlock) {
      process.stdout.write(`pipeline-build: ✓ index.html in sync (${data.items.length} item(s))\n`);
      return;
    }
    process.stderr.write(`pipeline-build: index.html is out of sync — run 'node scripts/build-pipeline.js' and commit.\n`);
    // Show a small diff context (first divergence line) for debugging.
    const a = cur.block.split('\n');
    const b = newBlock.split('\n');
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      if (a[i] !== b[i]) {
        process.stderr.write(`  line ${i + 1}:\n    current:  ${a[i] === undefined ? '<missing>' : a[i]}\n    expected: ${b[i] === undefined ? '<missing>' : b[i]}\n`);
        break;
      }
    }
    process.exit(1);
  }

  writeIndexBlock(newBlock);
  process.stdout.write(`pipeline-build: ✓ rendered ${data.items.length} item(s) (${stageCounts(data.items)}) — index.html updated\n`);
}

main();
