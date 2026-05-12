#!/usr/bin/env bash
# tests/seo-meta.sh — spec 011
# Wraps scripts/check-seo-meta.js. See contracts/seo-meta-gate.md.
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/check-seo-meta.js
