# Contract: meta tag injection en `<head>` del post

**Feature**: 017-og-images-dynamic

Especificación del cambio en `scripts/build-blog.js` para que cada
post sirva su OG por slug.

---

## Bloque actual (a modificar)

Dentro de `renderPostPage(post, ...)`, el bloque `<head>` contiene
hoy:

```html
<meta property="og:image" content="https://ardops.dev/public/og/og-default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHTML(post.title)}">
<meta name="twitter:image" content="https://ardops.dev/public/og/og-default.png">
```

## Bloque objetivo

```html
<meta property="og:image" content="https://ardops.dev/public/og/blog/${post.slug}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHTML(post.title)}">
<meta name="twitter:image" content="https://ardops.dev/public/og/blog/${post.slug}.png">
```

Con fallback a `og-default.png` si y solo si el manifest no tiene
entry para `post.slug` (caso "post recién creado, OG aún no generado").

## Lógica de selección

```js
const ogManifest = loadOgManifest();
const hasOgSlug = !!ogManifest.entries?.[post.slug];
const ogImageUrl = hasOgSlug
  ? `https://ardops.dev/public/og/blog/${post.slug}.png`
  : 'https://ardops.dev/public/og/og-default.png';

if (!hasOgSlug) {
  console.warn(`[blog-build] ⚠ no OG image for slug=${post.slug} — using og-default.png. Run \`node scripts/build-og.js\` and commit.`);
}
```

Ambas líneas (`og:image` y `twitter:image`) usan `ogImageUrl`.

## Out of scope

- `blog/index.html` (listing): sigue usando `og-default.png` con
  `og:image:alt="ardops.dev — Blog"` exactamente como hoy. NO se toca.
- Otras pages no-blog: sin cambios.

## Test (parte de `tests/og-images.sh`)

Para cada `blog/<slug>.html` generado a partir de un post publicado:

```bash
grep -q "og:image\" content=\"https://ardops.dev/public/og/blog/${slug}.png\"" "blog/${slug}.html"
grep -q "twitter:image\" content=\"https://ardops.dev/public/og/blog/${slug}.png\"" "blog/${slug}.html"
```

Si CUALQUIER post servido referencia `og-default.png` en `og:image`,
el gate falla con exit 1.
