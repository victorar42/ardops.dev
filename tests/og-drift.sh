#!/usr/bin/env bash
# tests/og-drift.sh
#
# Wrapper for `node scripts/build-og.js --check`.
# Exits 0 if manifest in sync, 2 if drift detected.
#
# Spec: 017-og-images-dynamic
# Contrato: specs/017-og-images-dynamic/contracts/og-manifest.md

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

node scripts/build-og.js --check
