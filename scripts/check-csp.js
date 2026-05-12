#!/usr/bin/env node
/**
 * scripts/check-csp.js — spec 009
 *
 * Validates the Content-Security-Policy meta of every served HTML page.
 *
 * Validations:
 *   V-1: each page contains exactly ONE <meta http-equiv="Content-Security-Policy">.
 *   V-2: NO directive contains the literal tokens 'unsafe-inline' or 'unsafe-eval'.
 *   V-3: required directives present:
 *          - default-src 'self'         (exact)
 *          - script-src 'self' …        ('self' must be first; sha256 hashes allowed)
 *          - style-src 'self' …         ('self' must be first; sha256 hashes allowed)
 *          - frame-ancestors 'none'     (exact)
 *          - base-uri 'self'            (exact)
 *          - object-src 'none'          (exact)
 *          - form-action 'self'         (exact)
 *
 * See specs/009-security-headers-hardening/contracts/csp-gate.md
 *
 * Exit 0 on success, 1 on any violation.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const REPO_ROOT = path.resolve(__dirname, '..');

const STATIC_PAGES = ['index.html', '404.html', 'talks/index.html', 'uses/index.html', 'speaking/index.html'];

const FORBIDDEN_TOKENS = ["'unsafe-inline'", "'unsafe-eval'"];

const REQUIRED_EXACT = {
  'default-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'form-action': ["'self'"],
};

const REQUIRED_FIRST = {
  // first token must be 'self'; additional tokens may only be sha256 hashes
  'script-src': "'self'",
  'style-src': "'self'",
};
const HASH_RE = /^'sha256-[A-Za-z0-9+/=]+'$/;

function listGenerated(dir) {
  const abs = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(dir, f));
}

function discoverPages() {
  return [
    ...STATIC_PAGES.filter((p) => fs.existsSync(path.join(REPO_ROOT, p))),
    ...listGenerated('blog'),
    ...listGenerated('interviews'),
  ];
}

function parseCsp(content) {
  const directives = new Map();
  for (const part of content.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const tokens = trimmed.split(/\s+/);
    const name = tokens.shift().toLowerCase();
    directives.set(name, tokens);
  }
  return directives;
}

function validatePage(file) {
  const abs = path.join(REPO_ROOT, file);
  const html = fs.readFileSync(abs, 'utf8');
  const dom = new JSDOM(html);
  const metas = dom.window.document.querySelectorAll(
    'meta[http-equiv="Content-Security-Policy"]',
  );
  const violations = [];

  // V-1
  if (metas.length === 0) {
    violations.push({
      rule: 'V-1',
      message: 'no <meta http-equiv="Content-Security-Policy"> found',
    });
    return violations;
  }
  if (metas.length > 1) {
    violations.push({
      rule: 'V-1',
      message: `${metas.length} CSP metas found (must be exactly 1)`,
    });
  }

  const content = metas[0].getAttribute('content') || '';
  const directives = parseCsp(content);

  // V-2: forbidden tokens anywhere
  for (const [name, tokens] of directives) {
    for (const t of tokens) {
      if (FORBIDDEN_TOKENS.includes(t)) {
        violations.push({
          rule: 'V-2',
          message: `forbidden token ${t} in directive ${name}`,
        });
      }
    }
  }

  // V-3: required exact directives
  for (const [name, expected] of Object.entries(REQUIRED_EXACT)) {
    if (!directives.has(name)) {
      violations.push({
        rule: 'V-3',
        message: `missing required directive \`${name} ${expected.join(' ')}\``,
      });
      continue;
    }
    const actual = directives.get(name);
    if (
      actual.length !== expected.length ||
      !actual.every((t, i) => t === expected[i])
    ) {
      violations.push({
        rule: 'V-3',
        message: `directive \`${name}\` must be exactly \`${expected.join(' ')}\` (got: \`${actual.join(' ')}\`)`,
      });
    }
  }

  // V-3: required-first directives
  for (const [name, firstExpected] of Object.entries(REQUIRED_FIRST)) {
    if (!directives.has(name)) {
      violations.push({
        rule: 'V-3',
        message: `missing required directive \`${name} ${firstExpected}\``,
      });
      continue;
    }
    const actual = directives.get(name);
    if (actual[0] !== firstExpected) {
      violations.push({
        rule: 'V-3',
        message: `directive \`${name}\` must start with ${firstExpected} (got: \`${actual.join(' ')}\`)`,
      });
      continue;
    }
    // additional tokens (besides 'self') must be sha256 hashes
    for (const t of actual.slice(1)) {
      if (!HASH_RE.test(t)) {
        violations.push({
          rule: 'V-3',
          message: `directive \`${name}\` extra token \`${t}\` is not a 'sha256-...' hash`,
        });
      }
    }
  }

  return violations;
}

function main() {
  const pages = discoverPages();
  const failing = [];
  let totalViolations = 0;
  for (const file of pages) {
    const v = validatePage(file);
    if (v.length > 0) {
      failing.push({ file, violations: v });
      totalViolations += v.length;
    }
  }
  if (failing.length > 0) {
    process.stderr.write(
      `\u2717 csp-no-unsafe-inline gate: ${totalViolations} violation(s) across ${failing.length} page(s).\n\n`,
    );
    for (const { file, violations } of failing) {
      process.stderr.write(`  ${file}:\n`);
      for (const v of violations) {
        process.stderr.write(`    - ${v.rule}: ${v.message}\n`);
      }
      process.stderr.write('\n');
    }
    process.stderr.write(
      `  See specs/009-security-headers-hardening/contracts/csp-contract.md\n` +
        `  for the canonical CSP. Inline <style> blocks must be moved to\n` +
        `  external .css files; do NOT add 'unsafe-inline' to fix.\n`,
    );
    process.exit(1);
  }
  process.stdout.write(
    `\u2713 csp-no-unsafe-inline gate: ${pages.length} page(s) validated, all pass.\n`,
  );
}

if (require.main === module) main();

module.exports = { parseCsp, validatePage, discoverPages };
