#!/usr/bin/env bash
# tests/external-links.sh — spec 009
#
# Wrapper around scripts/check-external-links.js. Validates that every
# <a target="_blank"> pointing to an external host has rel containing
# both `noopener` and `noreferrer`.
#
# See specs/009-security-headers-hardening/contracts/external-links-gate.md
set -euo pipefail
node scripts/check-external-links.js "$@"
