'use strict';
/**
 * scripts/lib/head.js — spec 009
 *
 * Single source of truth for common <head> meta tags shared across
 * generators (build-blog.js, build-interviews.js) and static-page
 * orchestrator (build-layout.js).
 *
 * Initially exposes the minimum required for spec 009 (FR-005, FR-006):
 *   - META_REFERRER: referrer policy meta tag, applied to every served page.
 *
 * Future specs may extend this module with:
 *   - META_CHARSET, META_VIEWPORT, META_THEME_COLOR, META_COLOR_SCHEME
 *   - renderHeadMeta({ title, csp, canonical, ... })
 *   - renderFavicons(), renderFontPreloads()
 *
 * --------------------------------------------------------------------
 * Canonical site CSP (spec 009 contract — informational reference):
 *
 *   default-src 'self';
 *   script-src 'self';
 *   style-src 'self';
 *   font-src 'self';
 *   img-src 'self' data:;
 *   connect-src 'self';
 *   object-src 'none';
 *   base-uri 'self';
 *   form-action 'self';
 *   frame-ancestors 'none';
 *   upgrade-insecure-requests
 *
 * The literal CSP string lives in the `CSP` constant of each generator
 * (build-blog.js, build-interviews.js) and inline in the <head> of static
 * pages (index.html, 404.html, talks/index.html). They MUST stay
 * byte-equivalent. The `tests/csp-no-unsafe-inline.sh` gate enforces:
 *   - no 'unsafe-inline' or 'unsafe-eval' tokens
 *   - presence of required directives
 *
 * See specs/009-security-headers-hardening/contracts/csp-contract.md.
 * --------------------------------------------------------------------
 */

const META_REFERRER =
  '<meta name="referrer" content="strict-origin-when-cross-origin">';

module.exports = { META_REFERRER };
