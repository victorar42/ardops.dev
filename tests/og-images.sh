#!/usr/bin/env bash
# tests/og-images.sh
#
# For every published post in content/blog/*.md:
#   1. public/og/blog/<slug>.png exists
#   2. PNG is 1200 x 630
#   3. PNG size <= 100 000 bytes (raw)
#   4. blog/<slug>.html references the OG by slug in og:image AND twitter:image
#   5. No published post HTML falls back to og-default.png
#
# Spec: 017-og-images-dynamic
# Contrato: specs/017-og-images-dynamic/contracts/og-template.md
#           specs/017-og-images-dynamic/contracts/og-meta-injection.md

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

OG_DIR="public/og/blog"
BLOG_DIR="blog"
CONTENT_DIR="content/blog"
MAX_BYTES=100000

errors=0
checked=0

emit() {
  echo "$1" >&2
  errors=$((errors + 1))
}

# Extract published posts (slug + filename) from content/blog/*.md
# We use a small Node oneliner to read frontmatter robustly.
POSTS_TSV="$(node -e '
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const dir = "content/blog";
const FILENAME_RE = /^\d{4}-\d{2}-[a-z0-9-]+\.md$/;
for (const f of fs.readdirSync(dir).sort()) {
  if (!FILENAME_RE.test(f)) continue;
  const full = path.join(dir, f);
  const raw = fs.readFileSync(full, "utf8");
  const fm = matter(raw).data;
  if (fm.published === true && typeof fm.slug === "string") {
    process.stdout.write(fm.slug + "\t" + full + "\n");
  }
}
')"

if [ -z "$POSTS_TSV" ]; then
  echo "[og-images] ✓ no published posts to check"
  exit 0
fi

while IFS=$'\t' read -r slug src; do
  [ -z "$slug" ] && continue
  checked=$((checked + 1))

  png="$OG_DIR/$slug.png"
  html="$BLOG_DIR/$slug.html"

  # 1. PNG exists
  if [ ! -f "$png" ]; then
    emit "$src:1:missing OG PNG ($png)"
    continue
  fi

  # 2. Dimensions
  dim="$(file "$png" | grep -oE '[0-9]+ x [0-9]+' | head -n1 || true)"
  if [ "$dim" != "1200 x 630" ]; then
    emit "$png:1:wrong dimensions (got '$dim', expected '1200 x 630')"
  fi

  # 3. Size
  bytes="$(wc -c <"$png" | tr -d ' ')"
  if [ "$bytes" -gt "$MAX_BYTES" ]; then
    emit "$png:1:size $bytes B exceeds $MAX_BYTES B"
  fi

  # 4. HTML references OG by slug (only if blog/<slug>.html exists, which
  # requires running `node scripts/build-blog.js` first; skip silently if not).
  if [ -f "$html" ]; then
    expected="https://ardops.dev/public/og/blog/$slug.png"
    if ! grep -qF "og:image\" content=\"$expected\"" "$html"; then
      emit "$html:1:og:image does not reference $expected"
    fi
    if ! grep -qF "twitter:image\" content=\"$expected\"" "$html"; then
      emit "$html:1:twitter:image does not reference $expected"
    fi
    # 5. No fallback to og-default.png in og:image/twitter:image
    if grep -qE "(og:image|twitter:image)\" content=\"https://ardops\.dev/public/og/og-default\.png\"" "$html"; then
      emit "$html:1:post falls back to og-default.png (run \`node scripts/build-og.js\` and commit)"
    fi
  fi
done <<EOF
$POSTS_TSV
EOF

if [ "$errors" -gt 0 ]; then
  echo "[og-images] ✗ $errors issue(s) across $checked post(s)" >&2
  exit 1
fi

echo "[og-images] ✓ $checked OG image(s) valid (1200x630, ≤${MAX_BYTES} B, meta tags by slug)"
