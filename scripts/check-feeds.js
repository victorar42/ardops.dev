#!/usr/bin/env node
/**
 * scripts/check-feeds.js — spec 011
 *
 * Validates blog/feed.xml (RSS 2.0) and blog/feed.json (JSON Feed 1.1).
 *
 * See specs/011-rss-jsonld-seo/contracts/feed-validate-gate.md
 *
 * Exit 0 on success, 1 on any violation.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.resolve(__dirname, '..');
const FEED_XML = path.join(REPO_ROOT, 'blog', 'feed.xml');
const FEED_JSON = path.join(REPO_ROOT, 'blog', 'feed.json');
const FEED_XML_URL = 'https://ardops.dev/blog/feed.xml';

const violations = [];
function v(file, id, msg) {
  violations.push(`feed-validate: ${file}: ${id}: ${msg}`);
}

function validateRss() {
  const file = 'blog/feed.xml';
  if (!fs.existsSync(FEED_XML)) {
    v(file, 'V-1', 'file not found');
    return { items: 0 };
  }
  const xml = fs.readFileSync(FEED_XML, 'utf8');

  let dom;
  try {
    dom = new JSDOM(xml, { contentType: 'text/xml' });
  } catch (e) {
    v(file, 'V-2', `not well-formed XML: ${e.message}`);
    return { items: 0 };
  }
  const doc = dom.window.document;

  // jsdom exposes <parsererror> on malformed XML.
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    v(file, 'V-2', `XML parse error: ${parserError.textContent.slice(0, 120)}`);
    return { items: 0 };
  }

  const rss = doc.documentElement;
  if (!rss || rss.nodeName.toLowerCase() !== 'rss' || rss.getAttribute('version') !== '2.0') {
    v(file, 'V-3', 'root element must be <rss version="2.0">');
    return { items: 0 };
  }

  const channels = rss.getElementsByTagName('channel');
  if (channels.length !== 1) {
    v(file, 'V-4', `expected exactly 1 <channel>, got ${channels.length}`);
    return { items: 0 };
  }
  const channel = channels[0];

  for (const f of ['title', 'link', 'description', 'language', 'lastBuildDate']) {
    const el = channel.getElementsByTagName(f);
    // Guard: some children belong to <item>, only top-level ones count.
    const direct = Array.from(el).filter((e) => e.parentNode === channel);
    if (direct.length === 0) {
      v(file, 'V-5', `<channel> missing <${f}>`);
    }
  }

  // V-6: atom:link rel="self"
  const atomLinks = channel.getElementsByTagName('atom:link');
  let selfFound = false;
  for (const link of atomLinks) {
    if (link.parentNode !== channel) continue;
    if (
      link.getAttribute('rel') === 'self' &&
      link.getAttribute('href') === FEED_XML_URL &&
      link.getAttribute('type') === 'application/rss+xml'
    ) {
      selfFound = true;
      break;
    }
  }
  if (!selfFound) {
    v(file, 'V-6', `missing <atom:link rel="self" href="${FEED_XML_URL}" type="application/rss+xml"/>`);
  }

  // V-7..V-9: items
  const items = Array.from(channel.getElementsByTagName('item'));
  for (const [i, item] of items.entries()) {
    for (const f of ['title', 'link', 'guid', 'pubDate']) {
      const found = Array.from(item.getElementsByTagName(f)).filter((e) => e.parentNode === item);
      if (found.length === 0) {
        v(file, 'V-7', `<item>[${i}] missing <${f}>`);
      }
    }
    const guidEls = Array.from(item.getElementsByTagName('guid')).filter((e) => e.parentNode === item);
    if (guidEls.length > 0) {
      const guid = guidEls[0].textContent.trim();
      if (!/^https?:\/\//.test(guid)) {
        v(file, 'V-8', `<item>[${i}] <guid> not absolute URL: '${guid}'`);
      }
    }
    // V-9: forbid suspicious tokens in <description>
    const descEls = Array.from(item.getElementsByTagName('description')).filter((e) => e.parentNode === item);
    if (descEls.length > 0) {
      const text = descEls[0].textContent || '';
      if (/<script\b|<iframe\b|<object\b|<embed\b|javascript:/i.test(text)) {
        v(file, 'V-9', `<item>[${i}] <description> contains suspicious markup`);
      }
    }
  }

  return { items: items.length };
}

function validateJsonFeed() {
  const file = 'blog/feed.json';
  if (!fs.existsSync(FEED_JSON)) {
    v(file, 'V-10', 'file not found');
    return { items: 0 };
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(FEED_JSON, 'utf8'));
  } catch (e) {
    v(file, 'V-10', `not valid JSON: ${e.message}`);
    return { items: 0 };
  }

  if (parsed.version !== 'https://jsonfeed.org/version/1.1') {
    v(file, 'V-11', `version must be 'https://jsonfeed.org/version/1.1', got '${parsed.version}'`);
  }

  for (const f of ['title', 'home_page_url', 'feed_url', 'language']) {
    if (typeof parsed[f] !== 'string' || parsed[f].length === 0) {
      v(file, 'V-12', `${f} must be a non-empty string`);
    }
  }

  if (!Array.isArray(parsed.items)) {
    v(file, 'V-13', 'items must be an array');
    return { items: 0 };
  }

  for (const [i, it] of parsed.items.entries()) {
    for (const f of ['id', 'url', 'title', 'date_published']) {
      if (typeof it[f] !== 'string' || it[f].length === 0) {
        v(file, 'V-14', `items[${i}].${f} must be a non-empty string`);
      }
    }
  }

  return { items: parsed.items.length };
}

function main() {
  const rss = validateRss();
  const jf = validateJsonFeed();

  if (violations.length > 0) {
    for (const m of violations) process.stderr.write(`${m}\n`);
    process.exit(1);
  }

  process.stdout.write(
    `✓ feed-validate gate:\n    - blog/feed.xml: 1 channel, ${rss.items} item(s) validated\n    - blog/feed.json: 1.1 manifest, ${jf.items} item(s) validated\n`,
  );
}

main();
