#!/usr/bin/env node
/**
 * Custom accessibility runner for ardops.dev.
 *
 * Why a custom runner?
 * Pa11y injects axe-core via `<script>` injection, which is blocked by our
 * production-equivalent CSP (`script-src 'self'`). Pa11y's axe runner then
 * runs in a degraded mode and reports false-positive contrast violations.
 *
 * This runner uses Puppeteer's `setBypassCSP(true)` (test-only) plus axe-core
 * 4.x to perform a full WCAG 2.1 AA scan with no CSP interference.
 *
 * Constitution: principle V (no third-party runtime) is preserved — this is
 * a *test* tool that never ships to the public site.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const AXE_SOURCE = fs.readFileSync(require.resolve('axe-core'), 'utf8');

const URLS = [
  'http://localhost:8080/',
  'http://localhost:8080/blog/',
  'http://localhost:8080/talks/',
  'http://localhost:8080/404'
];

// Rules we treat as "must pass" for CI gate.
const AXE_OPTIONS = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  resultTypes: ['violations']
};

async function scanUrl(browser, url) {
  const page = await browser.newPage();
  await page.setBypassCSP(true);
  await page.evaluateOnNewDocument(AXE_SOURCE);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  // Allow CSS animations/font-display swap to settle.
  await new Promise((r) => setTimeout(r, 1500));
  const result = await page.evaluate(async (opts) => {
    const r = await window.axe.run(opts);
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        html: n.html,
        failureSummary: n.failureSummary
      }))
    }));
  }, AXE_OPTIONS);
  await page.close();
  return result;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let totalViolations = 0;
  for (const url of URLS) {
    process.stdout.write(`\n→ ${url}\n`);
    let violations;
    try {
      violations = await scanUrl(browser, url);
    } catch (err) {
      console.error(`  ✘ failed to scan: ${err.message}`);
      totalViolations += 1;
      continue;
    }
    if (violations.length === 0) {
      console.log('  ✓ no WCAG 2.1 AA violations');
      continue;
    }
    totalViolations += violations.length;
    for (const v of violations) {
      console.log(`  ✘ [${v.impact}] ${v.id}: ${v.help}`);
      console.log(`    ${v.helpUrl}`);
      for (const n of v.nodes.slice(0, 5)) {
        console.log(`    - ${n.target.join(' ')}`);
      }
    }
  }

  await browser.close();

  if (totalViolations > 0) {
    console.error(`\n✘ ${totalViolations} violation group(s) across ${URLS.length} URLs`);
    process.exit(1);
  }
  console.log(`\n✓ all ${URLS.length} URLs pass WCAG 2.1 AA`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
