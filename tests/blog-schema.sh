#!/usr/bin/env bash
# Negative-fixture gate for spec 006 (Blog section).
# Asserts that every content/blog/__fixtures__/invalid-*.md is REJECTED
# by `node scripts/build-blog.js --check-only-validation --input <file>`.
# Also verifies xss-attempt.md is processed but the sanitized HTML
# strips all known XSS vectors.
set -uo pipefail
cd "$(dirname "$0")/.."

shopt -s nullglob
# invalid-duplicate-slug.md requires the FULL loader to detect collision;
# we handle it separately below.
fixtures=()
for f in content/blog/__fixtures__/invalid-*.md; do
  [ "$(basename "$f")" = "invalid-duplicate-slug.md" ] && continue
  fixtures+=("$f")
done

if [ ${#fixtures[@]} -eq 0 ]; then
  echo "FAIL: no invalid-*.md fixtures found in content/blog/__fixtures__/"
  exit 1
fi

fail=0
ok=0
for f in "${fixtures[@]}"; do
  out=$(node scripts/build-blog.js --check-only-validation --input "$f" 2>&1)
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

# Duplicate-slug check: build a temp content/blog with both
# valid-minimal.md and invalid-duplicate-slug.md and run the full loader.
tmpdir=$(mktemp -d)
trap "rm -rf '$tmpdir'" EXIT
mkdir -p "$tmpdir/content/blog"
cp content/blog/__fixtures__/valid-minimal.md "$tmpdir/content/blog/2026-05-valid-minimal.md"
cp content/blog/__fixtures__/invalid-duplicate-slug.md "$tmpdir/content/blog/2026-05-duplicate-slug.md"
# Run full loader via --check (no write) against the tmp dir. The script
# resolves paths relative to the repo root, so we set up a minimal mirror
# and invoke it from there.
# Simpler: invoke a tiny node one-liner that calls loadAllPosts on tmpdir.
out=$(node -e "
  const path = require('path');
  process.chdir('$tmpdir');
  // Minimal re-implementation: re-require the build script's exports?
  // Easier — invoke build-blog.js with cwd at the tmp dir won't work
  // because the script uses path.resolve(__dirname, '..'). Instead we
  // symlink the script into tmpdir and execute it with content/blog
  // pointing at our copy.
" 2>&1) || true

# Approach: copy both fixtures into a real test path and use the script's
# native behavior — it scans REPO_ROOT/content/blog. We can't easily
# point it elsewhere without modifying the script. So instead: stage the
# duplicate fixture *temporarily* into content/blog and assert build fails.
stagedup="content/blog/__zz_dup_test.md"
cp content/blog/__fixtures__/invalid-duplicate-slug.md "$stagedup"
# Real file must have a slug that collides with at least one existing
# published post. invalid-duplicate-slug.md uses slug 'valid-minimal'
# which is the same as the fixture in __fixtures__/, but __fixtures__/ is
# excluded by the loader. To make it actually collide we rewrite the slug
# on-the-fly to match the real published post slug.
real_slug=$(grep -E '^slug:' content/blog/*.md | grep -v __fixtures__ | head -1 | awk '{print $2}')
if [ -n "$real_slug" ]; then
  sed -i.bak "s/^slug: .*/slug: $real_slug/" "$stagedup" && rm "$stagedup.bak"
  out=$(node scripts/build-blog.js --check 2>&1)
  rc=$?
  rm -f "$stagedup"
  if [ $rc -eq 0 ]; then
    echo "FAIL: duplicate-slug staging was accepted (expected rejection)"
    fail=$((fail + 1))
  else
    msg=$(echo "$out" | head -1)
    echo "OK: duplicate-slug staging rejected — $msg"
    ok=$((ok + 1))
  fi
else
  rm -f "$stagedup"
  echo "SKIP: no published post available to stage duplicate-slug test"
fi


# XSS check: xss-attempt.md must be processed (valid frontmatter) but
# the sanitized HTML must NOT contain known XSS vectors.
xss_file="content/blog/__fixtures__/xss-attempt.md"
if [ -f "$xss_file" ]; then
  sanitized=$(node scripts/build-blog.js --emit-sanitized --input "$xss_file" 2>&1)
  rc=$?
  if [ $rc -ne 0 ]; then
    echo "FAIL: $xss_file did not parse — should be valid frontmatter"
    echo "  output: $sanitized"
    fail=$((fail + 1))
  else
    bad=0
    for pat in '<script' '<iframe' 'onerror=' 'onload=' 'onclick=' 'href="javascript:' 'href=javascript:' 'href="vbscript:' 'href=vbscript:' 'style=' '<form' '<button' '<svg' 'href="data:text/html'; do
      if echo "$sanitized" | grep -qiF "$pat"; then
        echo "FAIL: $xss_file sanitized output contains forbidden pattern '$pat'"
        bad=1
      fi
    done
    if [ $bad -eq 0 ]; then
      echo "OK: $xss_file sanitized output strips all XSS vectors"
      ok=$((ok + 1))
    else
      fail=$((fail + 1))
    fi
  fi
fi

if [ $fail -eq 0 ]; then
  echo "OK: $ok fixture(s) correctly rejected/sanitized by blog schema."
  exit 0
fi
echo "FAIL: $fail fixture(s) failed assertions."
exit 1
