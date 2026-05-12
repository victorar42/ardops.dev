#!/usr/bin/env bash
# tests/sitemap-drift.sh — spec 009
#
# Wrapper around scripts/check-sitemap-drift.js. Validates that every
# <loc> in any sitemap.xml resolves to a real file, and that every
# served page's <link rel="canonical"> appears in some sitemap.
#
# See specs/009-security-headers-hardening/contracts/sitemap-drift-gate.md
set -euo pipefail
node scripts/check-sitemap-drift.js "$@"
