#!/usr/bin/env node
/**
 * tests/lib/parse-img.js — spec 014 (Performance & a11y thresholds)
 *
 * Parses one HTML file and emits a JSON description of every <img>
 * element (in source order) to stdout for consumption by
 * tests/img-attrs.sh.
 *
 * Usage: node tests/lib/parse-img.js path/to/file.html
 *
 * Output schema:
 *   {
 *     "file": "blog/index.html",
 *     "images": [
 *       {
 *         "index": 0,
 *         "src": "/assets/img/josue-256.webp",
 *         "alt": "...",          // null if attribute absent, "" if empty
 *         "width": "256",        // string or null
 *         "height": "256",       // string or null
 *         "loading": null,       // string or null
 *         "decoding": "async",
 *         "fetchpriority": null
 *       },
 *       ...
 *     ]
 *   }
 *
 * Exit codes:
 *   0  parse succeeded (even when 0 images)
 *   2  I/O error or jsdom failure
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const file = process.argv[2];
if (!file) {
  process.stderr.write('parse-img: missing file argument\n');
  process.exit(2);
}

let html;
try {
  html = fs.readFileSync(file, 'utf8');
} catch (err) {
  process.stderr.write(`parse-img: cannot read ${file}: ${err.message}\n`);
  process.exit(2);
}

let dom;
try {
  dom = new JSDOM(html);
} catch (err) {
  process.stderr.write(`parse-img: jsdom failed on ${file}: ${err.message}\n`);
  process.exit(2);
}

const attr = (el, name) => (el.hasAttribute(name) ? el.getAttribute(name) : null);

const imgs = Array.from(dom.window.document.querySelectorAll('img')).map(
  (el, index) => ({
    index,
    src: attr(el, 'src'),
    alt: attr(el, 'alt'),
    width: attr(el, 'width'),
    height: attr(el, 'height'),
    loading: attr(el, 'loading'),
    decoding: attr(el, 'decoding'),
    fetchpriority: attr(el, 'fetchpriority'),
  })
);

process.stdout.write(
  JSON.stringify({ file: path.relative(process.cwd(), file), images: imgs }) + '\n'
);
process.exit(0);
