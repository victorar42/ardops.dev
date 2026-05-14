'use strict';

/**
 * scripts/lib/layout.js — spec 008
 *
 * Single source of truth for the site's <header> (with skip link + nav)
 * and <footer>. Consumed by:
 *   - scripts/build-blog.js
 *   - scripts/build-interviews.js
 *   - scripts/build-layout.js (static pages: index.html, 404.html, talks/)
 *
 * Pure CommonJS. No I/O, no env, no Date. Same input → same output.
 *
 * See specs/008-shared-nav-and-footer/contracts/{layout-module,nav-html-contract,footer-html-contract}.md
 */

const NAV = Object.freeze([
  Object.freeze({ href: '/',            label: 'Home',        match: Object.freeze(['/']) }),
  Object.freeze({ href: '/#pipeline',   label: 'Pipeline',    match: Object.freeze([]), isAnchor: true }),
  Object.freeze({ href: '/blog/',       label: 'Blog',        match: Object.freeze(['/blog/']) }),
  Object.freeze({ href: '/interviews/', label: 'Entrevistas', match: Object.freeze(['/interviews/']) }),
  Object.freeze({ href: '/talks/',      label: 'Charlas',     match: Object.freeze(['/talks/']) }),
  Object.freeze({ href: '/speaking/',   label: 'Speaking',    match: Object.freeze(['/speaking/']) }),
  Object.freeze({ href: '/uses/',       label: 'Uses',        match: Object.freeze(['/uses/']) }),
  Object.freeze({ href: '/#contact',    label: 'Contacto',    match: Object.freeze([]), isAnchor: true }),
]);

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Normalize a path for active-state matching.
 *   - lowercase
 *   - strip query and fragment
 *   - ensure trailing slash for directory-like paths
 *   - empty / null / undefined → '/'
 */
function normalizePath(p) {
  if (p === null || p === undefined || p === '') return '/';
  if (typeof p !== 'string') {
    throw new TypeError('normalizePath: path must be string');
  }
  let out = p.toLowerCase();
  const hashIdx = out.indexOf('#');
  if (hashIdx !== -1) out = out.slice(0, hashIdx);
  const qIdx = out.indexOf('?');
  if (qIdx !== -1) out = out.slice(0, qIdx);
  if (out === '') return '/';
  // Directory-like: ends with no extension (no dot in last segment) → add trailing slash
  const lastSeg = out.split('/').pop();
  if (out !== '/' && !out.endsWith('/') && !lastSeg.includes('.')) {
    out = out + '/';
  }
  return out;
}

/**
 * Render the page shell: skip link + <header> with <nav>.
 * `currentPath` decides which item gets aria-current="page".
 */
function renderHeader(currentPath) {
  if (typeof currentPath !== 'string') {
    throw new TypeError('renderHeader: currentPath must be string');
  }
  const norm = normalizePath(currentPath);
  const items = NAV.map((item) => {
    const isActive = !item.isAnchor && item.match.includes(norm);
    const aria = isActive ? ' aria-current="page"' : '';
    return `        <li><a href="${item.href}"${aria}>${escapeHTML(item.label)}</a></li>`;
  }).join('\n');

  return `  <a class="skip-link" href="#main">Saltar al contenido</a>

  <header class="site-header">
    <nav class="site-nav" aria-label="Navegación principal">
      <a href="/" class="nav-logo">ardops<span>.dev</span></a>
      <ul class="nav-links">
${items}
      </ul>
    </nav>
  </header>`;
}

/**
 * Render the site footer. Same string for every page.
 * Year is hardcoded per spec 008 D-010 / FR-012 (no runtime JS, no Date dep).
 */
function renderFooter() {
  return `  <footer class="site-footer">
    <p><span class="footer-mono">ardops.dev</span> · Security as Code · Costa Rica · &copy; <span data-year>2026</span></p>
    <p class="footer-tagline">Built with intention. Deployed with CI/CD.</p>
    <p class="footer-links"><a href="/now/">/now/</a> · <a href="/privacy/">/privacy/</a></p>
  </footer>`;
}

module.exports = { NAV, renderHeader, renderFooter, normalizePath };
