#!/usr/bin/env bash
# tests/nav-consistency.sh — spec 008
#
# Wrapper around scripts/check-nav-consistency.js. Validates that
# every served HTML page renders the canonical <header> and <footer>
# from scripts/lib/layout.js.
#
# See specs/008-shared-nav-and-footer/contracts/nav-consistency-gate.md
set -euo pipefail
node scripts/check-nav-consistency.js "$@"
