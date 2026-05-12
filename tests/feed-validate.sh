#!/usr/bin/env bash
# tests/feed-validate.sh — spec 011
# Wraps scripts/check-feeds.js. See contracts/feed-validate-gate.md.
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/check-feeds.js
