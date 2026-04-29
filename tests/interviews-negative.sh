#!/usr/bin/env bash
#
# tests/interviews-negative.sh — spec 003
#
# Asserts that `node scripts/build-interviews.js --strict` aborts (exit != 0)
# when invoked against a content set that contains a negative-test fixture
# (e.g. `__fixtures__/invalid-missing-title.md`). This locks in the validator
# behaviour so frontmatter-required fields stay enforced.
#
# Usage:  bash tests/interviews-negative.sh
# Exit:   0 = generator correctly aborted on invalid fixture
#         1 = generator unexpectedly succeeded OR no negative fixtures present
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FIX_DIR="content/interviews/__fixtures__"

if [ ! -d "$FIX_DIR" ]; then
  echo "FAIL: missing $FIX_DIR" >&2
  exit 1
fi

shopt -s nullglob
neg_files=("$FIX_DIR"/invalid-*.md)
if [ ${#neg_files[@]} -eq 0 ]; then
  echo "FAIL: no negative-test fixtures (invalid-*.md) under $FIX_DIR" >&2
  exit 1
fi

# Build the negative content set into a throwaway dir, by symlinking the
# negative fixtures into a stage so the generator scans them under
# content/interviews/. We use an env override: copy negative files temporarily
# into content/interviews/__neg__/ and point the generator at it. Simpler:
# call the script with --content-dir if supported, else stage by copying.
#
# The generator only scans CONTENT_DIR + (optional) FIXTURES_DIR. The simplest
# reliable approach is to copy each negative fixture to CONTENT_DIR with a
# temporary name, run the generator, capture the exit code, and clean up.
TMP_NAMES=()
cleanup() {
  for n in "${TMP_NAMES[@]:-}"; do
    [ -n "$n" ] && rm -f "content/interviews/$n" || true
  done
}
trap cleanup EXIT

i=0
for src in "${neg_files[@]}"; do
  base="$(basename "$src")"
  staged="__neg_${i}_${base}"
  cp "$src" "content/interviews/$staged"
  TMP_NAMES+=("$staged")
  i=$((i+1))
done

set +e
node scripts/build-interviews.js --strict --out interviews/ >/tmp/neg-build.log 2>&1
code=$?
set -e

if [ "$code" -eq 0 ]; then
  echo "FAIL: generator exited 0 with negative fixtures present (expected non-zero)" >&2
  echo "---log---" >&2
  cat /tmp/neg-build.log >&2
  exit 1
fi

echo "OK: generator correctly aborted (exit=$code) with ${#neg_files[@]} negative fixture(s)"
