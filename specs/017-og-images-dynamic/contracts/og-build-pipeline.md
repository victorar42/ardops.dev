# Contract: OG build pipeline

**Feature**: 017-og-images-dynamic

Contrato del builder `scripts/build-og.js` y su interacción con
`build-blog.js`.

---

## CLI

```text
node scripts/build-og.js              # generate / cache / orphan-cleanup
node scripts/build-og.js --check      # exit 0 if no drift, ≠0 otherwise
node scripts/build-og.js --regenerate # ignore cache, regenerate all
```

## API interna (importable)

```js
// scripts/build-og.js

/**
 * @returns {Promise<{
 *   generated: string[],     // slugs regenerated
 *   cached: string[],        // slugs unchanged
 *   orphansRemoved: string[],// filenames removed
 *   maxBytes: number,        // largest PNG size produced
 *   manifest: OgManifest,    // updated manifest object
 * }>}
 */
async function buildAll({ check = false, regenerate = false }) { /* ... */ }

module.exports = { buildAll, OG_TEMPLATE_VERSION, computeHash, loadManifest, writeManifest };
```

---

## Pre-condiciones

- Posts existen como Markdown válido en `content/blog/*.md` (parse +
  validación delegada al lector reutilizable de `build-blog.js`; el
  builder OG carga los mismos posts mediante un módulo compartido o
  re-exportado).
- `scripts/og/template.svg` existe y es SVG válido.
- `assets/fonts/outfit-700.woff2`, `outfit-600.woff2`,
  `jetbrains-mono-700.woff2` existen.

## Post-condiciones (modo write)

- Para cada post publicado, existe `public/og/blog/<slug>.png` 1200×630.
- `public/og/blog/manifest.json` está sincronizado.
- Cero PNGs huérfanos.
- Cero `manifest.entries` huérfanas.

## Post-condiciones (modo --check)

- Cero escrituras a disco.
- Exit code:
  - `0` si manifest + PNGs en disco coinciden con lo que el builder
    generaría.
  - `2` si hay drift; stdout/stderr listan cada slug con su `reason`.

---

## Errores

- Si `template.svg` falta → exit 1.
- Si una fuente requerida falta → exit 1.
- Si `sharp` no puede renderizar (SVG inválido, fuente no embebible)
  → exit 1 con el slug ofensor.
- Si un PNG generado excede el budget de 100 000 B → exit 1 con el
  slug y tamaño actual.

---

## Integración con `build-blog.js`

`build-blog.js` carga el manifest al iniciar:

```js
const OG_MANIFEST_PATH = path.join(REPO_ROOT, 'public', 'og', 'blog', 'manifest.json');

function loadOgManifest() {
  if (!fs.existsSync(OG_MANIFEST_PATH)) return { entries: {} };
  return JSON.parse(fs.readFileSync(OG_MANIFEST_PATH, 'utf8'));
}
```

Y en `renderPostPage(post, ...)`:

```js
const ogManifest = loadOgManifest();
const hasOgSlug = !!ogManifest.entries?.[post.slug];
const ogImageUrl = hasOgSlug
  ? `https://ardops.dev/public/og/blog/${post.slug}.png`
  : 'https://ardops.dev/public/og/og-default.png';
if (!hasOgSlug) {
  console.warn(`[blog-build] ⚠ no OG image for slug=${post.slug} — falling back to og-default.png. Run \`node scripts/build-og.js\`.`);
}
```

El warning **no aborta el build de blog**, pero el gate
`tests/og-images.sh` falla si algún post servido referencia
`og-default.png` (es decir: cualquier post sin OG por slug es bloqueo
en CI).

---

## Build order (npm run build)

```text
build:layout
  → build:syntax-css (spec 016)
    → build:og        (NEW — escribe manifest)
      → build:blog    (lee manifest)
        → build:interviews
```

Si alguno de los pasos previos falla, los siguientes no corren.

---

## Reproducibilidad

- `sharp` config: `.png({ compressionLevel: 9, adaptiveFiltering: false, palette: false, effort: 10 })`
- Sin `.withMetadata()` (no insertar EXIF/XMP/timestamp).
- `JSON.stringify(manifest, null, 2) + '\n'` con orden alfabético de
  `entries`.
- Test: dos corridas consecutivas producen `md5` idéntico de cada
  PNG y del manifest.
