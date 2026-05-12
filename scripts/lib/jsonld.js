/**
 * scripts/lib/jsonld.js — spec 011
 *
 * Pure CommonJS module for building schema.org JSON-LD nodes
 * (Person, Article, Blog, ItemList, BreadcrumbList) and serializing
 * them as <script type="application/ld+json"> blocks suitable for
 * inline inclusion in <head>.
 *
 * See specs/011-rss-jsonld-seo/contracts/jsonld-module.md
 *      specs/011-rss-jsonld-seo/contracts/jsonld-schemas.md
 */
'use strict';

const CANONICAL_ORIGIN = 'https://ardops.dev';
const PERSON_ID = 'https://ardops.dev/#person';
const DEFAULT_OG_IMAGE = `${CANONICAL_ORIGIN}/public/og/og-default.png`;

function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Victor Josue Ardón Rojas',
    alternateName: 'ardops',
    url: 'https://ardops.dev/',
    image: DEFAULT_OG_IMAGE,
    jobTitle: 'DevOps Engineer',
    sameAs: [
      'https://github.com/victorar42',
      'https://www.linkedin.com/in/victorar42/',
    ],
  };
}

function articleSchema(post) {
  if (!post || typeof post !== 'object') {
    throw new TypeError('articleSchema: post must be an object');
  }
  for (const f of ['slug', 'title', 'date']) {
    if (typeof post[f] !== 'string' || post[f].length === 0) {
      throw new TypeError(`articleSchema: post.${f} must be a non-empty string`);
    }
  }
  const url = `${CANONICAL_ORIGIN}/blog/${post.slug}.html`;
  const datePublished = `${post.date}T00:00:00Z`;
  const image = post.cover && typeof post.cover === 'string'
    ? `${CANONICAL_ORIGIN}/${post.cover}`
    : DEFAULT_OG_IMAGE;
  const out = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: post.title,
    datePublished,
    dateModified: datePublished,
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    image,
    mainEntityOfPage: url,
  };
  if (Array.isArray(post.tags) && post.tags.length > 0) {
    out.keywords = post.tags.join(', ');
  }
  return out;
}

function blogSchema(channelMeta, posts) {
  if (!channelMeta || typeof channelMeta !== 'object') {
    throw new TypeError('blogSchema: channelMeta must be an object');
  }
  if (!Array.isArray(posts)) {
    throw new TypeError('blogSchema: posts must be an array');
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${channelMeta.url}#blog`,
    name: channelMeta.name,
    url: channelMeta.url,
    description: channelMeta.description,
    inLanguage: channelMeta.inLanguage,
    publisher: { '@id': PERSON_ID },
    blogPost: posts.map((p) => ({
      '@id': `${CANONICAL_ORIGIN}/blog/${p.slug}.html#article`,
    })),
  };
}

function itemListSchema(items) {
  if (!Array.isArray(items)) {
    throw new TypeError('itemListSchema: items must be an array');
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: it.url,
      name: it.name,
    })),
  };
}

function breadcrumbsSchema(crumbs) {
  if (!Array.isArray(crumbs) || crumbs.length === 0) {
    throw new TypeError('breadcrumbsSchema: crumbs must be a non-empty array');
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  };
}

function serialize(schemaObj) {
  if (!schemaObj || typeof schemaObj !== 'object') {
    throw new TypeError('serialize: schemaObj must be an object');
  }
  const json = JSON.stringify(schemaObj, null, 2).replace(/<\//g, '<\\/');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

module.exports = {
  CANONICAL_ORIGIN,
  PERSON_ID,
  DEFAULT_OG_IMAGE,
  personSchema,
  articleSchema,
  blogSchema,
  itemListSchema,
  breadcrumbsSchema,
  serialize,
};
