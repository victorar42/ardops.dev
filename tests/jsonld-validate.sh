#!/usr/bin/env bash
# tests/jsonld-validate.sh — spec 011
# Wraps scripts/check-jsonld.js. See contracts/jsonld-validate-gate.md.
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/check-jsonld.js
