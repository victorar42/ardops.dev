/**
 * scripts/og/render.js
 *
 * Helpers puros para construir el SVG de OG images.
 *
 * Spec: 017-og-images-dynamic
 * Contratos: specs/017-og-images-dynamic/contracts/og-template.md
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FONTS_DIR = path.join(REPO_ROOT, 'assets', 'fonts');

// ---------------------------------------------------------------------------
// XML escape (FR escape: see contracts/og-template.md)
// ---------------------------------------------------------------------------

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------------------------------------------------------------------------
// Title wrap (2 lines max, greedy word pack at ~28 chars/line)
// ---------------------------------------------------------------------------

const MAX_CHARS_PER_LINE = 28;
const MAX_LINES = 2;

function wrapTitle(title, maxCharsPerLine = MAX_CHARS_PER_LINE, maxLines = MAX_LINES) {
  const words = String(title).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current === '' ? word : current + ' ' + word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      if (current !== '') lines.push(current);
      // A single word may exceed maxCharsPerLine; let it overflow rather than break mid-word.
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current !== '' && lines.length < maxLines) lines.push(current);

  // Check if any words remain unpacked → need truncation marker
  const consumed = lines.join(' ').split(/\s+/).filter(Boolean).length;
  const truncated = consumed < words.length;
  if (truncated && lines.length > 0) {
    const last = lines[lines.length - 1];
    // Truncate the last line to fit '…' within maxCharsPerLine
    if (last.length + 1 > maxCharsPerLine) {
      lines[lines.length - 1] = last.slice(0, Math.max(0, maxCharsPerLine - 1)).trimEnd() + '…';
    } else {
      lines[lines.length - 1] = last + '…';
    }
  }

  return { lines, truncated };
}

function renderTitleLines(title) {
  const { lines } = wrapTitle(title);
  if (lines.length === 0) return '';

  // Layout coords per contracts/og-template.md
  // line 1: y=230, line 2: y=306 (if present); if single line, center vertically a bit lower (y=268).
  const yLine1 = lines.length === 1 ? 268 : 230;
  const yLine2 = 306;

  const parts = [];
  parts.push(
    `<text x="64" y="${yLine1}" class="title">${escapeXml(lines[0])}</text>`,
  );
  if (lines[1]) {
    parts.push(
      `<text x="64" y="${yLine2}" class="title">${escapeXml(lines[1])}</text>`,
    );
  }
  return parts.join('\n  ');
}

// ---------------------------------------------------------------------------
// Tag chips
// ---------------------------------------------------------------------------

const MAX_VISIBLE_TAGS = 4;
const MAX_TAG_CHARS = 16;
const CHIP_Y = 540;
const CHIP_TEXT_Y = 572;
const CHIP_HEIGHT = 44;
const CHIP_PADDING_X = 18;
const CHIP_GAP = 14;
const CHIP_FONT_SIZE = 22;
// Approx width per character at 22px for Outfit 600. Empirical.
const CHIP_CHAR_WIDTH = 12;

function truncateTag(tag) {
  const s = String(tag);
  if (s.length <= MAX_TAG_CHARS) return s;
  return s.slice(0, MAX_TAG_CHARS - 1) + '…';
}

function renderTagsSvg(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return '';
  const visible = tags.slice(0, MAX_VISIBLE_TAGS).map(truncateTag);
  const overflow = tags.length - MAX_VISIBLE_TAGS;
  const labels = visible.map((t) => '#' + t);
  if (overflow > 0) labels.push('+' + overflow);

  const parts = [];
  let cursor = 64; // padding left
  for (const label of labels) {
    const textW = label.length * CHIP_CHAR_WIDTH;
    const chipW = textW + CHIP_PADDING_X * 2;
    parts.push(
      `<g class="chip">
    <rect x="${cursor}" y="${CHIP_Y}" width="${chipW}" height="${CHIP_HEIGHT}" rx="10" ry="10" class="chip-bg"/>
    <text x="${cursor + CHIP_PADDING_X}" y="${CHIP_TEXT_Y}" class="chip-text">${escapeXml(label)}</text>
  </g>`,
    );
    cursor += chipW + CHIP_GAP;
  }
  return parts.join('\n  ');
}

// ---------------------------------------------------------------------------
// Font embedding (base64 data URIs) — fonts are self-hosted in assets/fonts/.
// ---------------------------------------------------------------------------

const FONT_FILES = {
  'Outfit-600': 'outfit-600.woff2',
  'Outfit-700': 'outfit-700.woff2',
  'JetBrainsMono-700': 'jetbrains-mono-700.woff2',
};

let _fontStyleCache = null;

function embedFontsBase64() {
  if (_fontStyleCache !== null) return _fontStyleCache;
  const faces = [];
  for (const [name, file] of Object.entries(FONT_FILES)) {
    const full = path.join(FONTS_DIR, file);
    if (!fs.existsSync(full)) {
      throw new Error(`[og-render] missing font: ${full}`);
    }
    const b64 = fs.readFileSync(full).toString('base64');
    const family = name.startsWith('Outfit') ? 'Outfit' : 'JetBrains Mono';
    const weight = name.endsWith('-700') ? 700 : 600;
    faces.push(
      `@font-face { font-family: '${family}'; font-style: normal; font-weight: ${weight}; font-display: block; src: url(data:font/woff2;base64,${b64}) format('woff2'); }`,
    );
  }
  _fontStyleCache = faces.join('\n  ');
  return _fontStyleCache;
}

module.exports = {
  escapeXml,
  wrapTitle,
  renderTitleLines,
  renderTagsSvg,
  embedFontsBase64,
  truncateTag,
};
