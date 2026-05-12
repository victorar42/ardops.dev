/**
 * scripts/lib/feeds.js — spec 011
 *
 * Pure CommonJS module for rendering RSS 2.0 and JSON Feed 1.1 documents
 * from a channel descriptor + an ordered list of feed items. Zero I/O,
 * zero external deps, zero `Date.now()` (deterministic builds).
 *
 * See specs/011-rss-jsonld-seo/contracts/feeds-module.md
 */
'use strict';

const MONTH_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function pad2(n) {
  return n < 10 ? `0${n}` : String(n);
}

function toRfc822(iso) {
  if (typeof iso !== 'string' || iso.length === 0) {
    throw new TypeError('toRfc822: expected non-empty ISO 8601 string');
  }
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) {
    throw new TypeError(`toRfc822: invalid ISO 8601 string '${iso}'`);
  }
  const wday = WEEKDAY_EN[dt.getUTCDay()];
  const day = pad2(dt.getUTCDate());
  const mon = MONTH_EN[dt.getUTCMonth()];
  const year = dt.getUTCFullYear();
  const hh = pad2(dt.getUTCHours());
  const mm = pad2(dt.getUTCMinutes());
  const ss = pad2(dt.getUTCSeconds());
  return `${wday}, ${day} ${mon} ${year} ${hh}:${mm}:${ss} +0000`;
}

function validateChannel(channel) {
  if (!channel || typeof channel !== 'object') {
    throw new TypeError('renderRss/JsonFeed: channel must be an object');
  }
  for (const f of ['title', 'link', 'description', 'language', 'lastBuildDate', 'selfHref']) {
    if (typeof channel[f] !== 'string' || channel[f].length === 0) {
      throw new TypeError(`renderRss/JsonFeed: channel.${f} must be a non-empty string`);
    }
  }
}

function validateItems(items) {
  if (!Array.isArray(items)) {
    throw new TypeError('renderRss/JsonFeed: items must be an array');
  }
  for (const [i, it] of items.entries()) {
    if (!it || typeof it !== 'object') {
      throw new TypeError(`renderRss/JsonFeed: items[${i}] must be an object`);
    }
    for (const f of ['id', 'url', 'title', 'summary', 'datePublished']) {
      if (typeof it[f] !== 'string' || it[f].length === 0) {
        throw new TypeError(`renderRss/JsonFeed: items[${i}].${f} must be a non-empty string`);
      }
    }
    if (it.tags !== undefined && !Array.isArray(it.tags)) {
      throw new TypeError(`renderRss/JsonFeed: items[${i}].tags must be array if present`);
    }
  }
}

function renderRss(channel, items) {
  validateChannel(channel);
  validateItems(items);

  const itemsXml = items.map((it) => {
    const tags = Array.isArray(it.tags) ? it.tags : [];
    const cats = tags
      .map((t) => `      <category>${escapeXml(t)}</category>`)
      .join('\n');
    const catsBlock = cats ? `\n${cats}` : '';
    return `    <item>
      <title>${escapeXml(it.title)}</title>
      <link>${it.url}</link>
      <guid isPermaLink="true">${it.id}</guid>
      <pubDate>${toRfc822(it.datePublished)}</pubDate>
      <description>${escapeXml(it.summary)}</description>${catsBlock}
    </item>`;
  }).join('\n');

  const itemsSection = items.length > 0 ? `\n${itemsXml}\n` : '\n';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${channel.link}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>${escapeXml(channel.language)}</language>
    <lastBuildDate>${toRfc822(channel.lastBuildDate)}</lastBuildDate>
    <atom:link href="${channel.selfHref}" rel="self" type="application/rss+xml"/>
${itemsSection}  </channel>
</rss>
`;
}

function renderJsonFeed(channel, items) {
  validateChannel(channel);
  validateItems(items);

  const obj = {
    version: 'https://jsonfeed.org/version/1.1',
    title: channel.title,
    home_page_url: channel.link,
    feed_url: channel.selfHref,
    description: channel.description,
    language: channel.language,
    authors: [
      {
        name: 'Victor Josue Ardón Rojas',
        url: 'https://ardops.dev/',
      },
    ],
    items: items.map((it) => {
      const out = {
        id: it.id,
        url: it.url,
        title: it.title,
        summary: it.summary,
        date_published: it.datePublished,
        language: 'es-CR',
      };
      if (Array.isArray(it.tags) && it.tags.length > 0) {
        out.tags = [...it.tags];
      }
      return out;
    }),
  };
  return JSON.stringify(obj, null, 2) + '\n';
}

module.exports = {
  renderRss,
  renderJsonFeed,
  toRfc822,
  escapeXml,
};
