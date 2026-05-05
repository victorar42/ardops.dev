#!/usr/bin/env bash
# Negative-fixture gate for spec 005 (Pipeline section).
# Runs build-pipeline.js --check-only-validation on each invalid-*.json fixture
# and asserts every fixture is REJECTED (non-zero exit). Fails CI if any is
# accidentally accepted.
set -uo pipefail
cd "$(dirname "$0")/.."

shopt -s nullglob
fixtures=(content/pipeline.fixtures/invalid-*.json)

if [ ${#fixtures[@]} -eq 0 ]; then
  echo "FAIL: no invalid-*.json fixtures found in content/pipeline.fixtures/"
  exit 1
fi

fail=0
ok=0
for f in "${fixtures[@]}"; do
  out=$(node scripts/build-pipeline.js --input "$f" --check-only-validation 2>&1)
  rc=$?
  if [ $rc -eq 0 ]; then
    echo "FAIL: $f was accepted (expected rejection)"
    echo "  output: $out"
    fail=$((fail + 1))
  else
    msg=$(echo "$out" | head -1)
    echo "OK: $f rejected — $msg"
    ok=$((ok + 1))
  fi
done

if [ $fail -eq 0 ]; then
  echo "OK: $ok fixture(s) correctly rejected by pipeline schema."
  exit 0
fi
echo "FAIL: $fail fixture(s) were accepted instead of rejected."
exit 1
