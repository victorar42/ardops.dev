#!/usr/bin/env bash
# tests/csp-no-unsafe-inline.sh — spec 009
#
# Wrapper around scripts/check-csp.js. Fails if any served HTML page
# contains 'unsafe-inline' or 'unsafe-eval' in its CSP, or is missing
# required directives.
#
# See specs/009-security-headers-hardening/contracts/csp-gate.md
set -euo pipefail
node scripts/check-csp.js "$@"
