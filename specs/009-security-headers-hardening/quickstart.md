# Quickstart — Security headers hardening (spec 009)

**Audiencia**: el editor del sitio o cualquier maintainer futuro.
Cómo regenerar localmente, validar gates de seguridad, y resolver fallos.

---

## Setup (una sola vez)

Node 20+ y devDeps existentes. **Cero deps nuevas en esta spec**.

```bash
node --version          # v20.x mínimo
npm install             # confirmar node_modules sincronizado
```

## Workflow normal — publicar un post nuevo

1. Editar/crear `content/blog/2026-XX-mi-post.md`.
2. Regenerar todo:
   ```bash
   npm run build
   ```
   Esto regenera el blog Y emite/actualiza
   `assets/css/blog-tag-rules.css` automáticamente.
3. Actualizar `sitemap.xml` agregando la nueva entrada:
   ```xml
   <url>
     <loc>https://ardops.dev/blog/mi-post.html</loc>
     <lastmod>2026-XX-XX</lastmod>
     <changefreq>yearly</changefreq>
     <priority>0.6</priority>
   </url>
   ```
4. Validar gates:
   ```bash
   npm run check:security      # corre los 3 gates de spec 009
   bash tests/nav-consistency.sh   # gate de spec 008
   npm run html-validate
   ```
5. Commit + PR.

## Workflow normal — agregar link externo

Cualquier `<a href="https://...">` que abra en nueva pestaña debe
incluir `rel="noopener noreferrer"`:

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer" aria-label="Example (abre en nueva pestaña)">
  Example
</a>
```

El gate `tests/external-links.sh` lo valida automáticamente. Si
olvidás el `rel`, falla en CI.

## Workflow normal — actualizar referrer policy o CSP

**No modificar a mano** en cada página. Editar el punto único:

- Meta referrer: `scripts/lib/head.js` (constante `META_REFERRER`).
- CSP del blog: `scripts/build-blog.js` (constante `CSP`).
- CSP de interviews: `scripts/build-interviews.js` (constante `CSP`).
- CSP de páginas estáticas: editar el `<meta>` en cada `*.html`
  directamente (no centralizado en esta spec).

Después regenerar:

```bash
npm run build
bash tests/csp-no-unsafe-inline.sh
```

## Validación local (todos los gates)

```bash
# Build determinista
npm run build

# Sync gates (spec 008)
node scripts/build-layout.js --check
node scripts/build-blog.js --check
node scripts/build-pipeline.js --check
bash tests/nav-consistency.sh

# Security gates (spec 009)
bash tests/csp-no-unsafe-inline.sh
bash tests/external-links.sh
bash tests/sitemap-drift.sh

# HTML válido + a11y
npm run html-validate
( nohup npx --yes serve -l 8080 . > /tmp/serve.log 2>&1 & ); sleep 3
node tests/a11y.js
pkill -f "serve -l 8080"
```

## Resolución de fallos

### `csp-no-unsafe-inline: blog/index.html — CSP contains 'unsafe-inline' in style-src`

Alguien re-introdujo el bloque inline `<style>` en el blog. Buscar:

```bash
grep -rn '<style' blog/ index.html 404.html talks/
```

Si es legítimo (caso poco común): mover el contenido a un `.css` externo
y linkearlo. **NO agregar `'unsafe-inline'` a la CSP.**

### `csp-no-unsafe-inline: page X — missing required directive frame-ancestors`

Una página tiene CSP incompleta. Editar el `<meta http-equiv="Content-Security-Policy">`
para incluir `frame-ancestors 'none'`. Si es página generada, editar la
constante `CSP` en el generador correspondiente.

### `external-links: index.html line 318 — <a target="_blank" href="https://github.com/..."> missing rel="noopener noreferrer"`

Agregar `rel="noopener noreferrer"` al anchor. El mensaje indica el
archivo y href exactos.

### `sitemap-drift: forward — https://ardops.dev/X/ has no corresponding file`

Una `<loc>` apunta a una página que no existe. Causas:
- Post borrado/renombrado pero sitemap no actualizado.
- Typo en `<loc>`.

Editar `sitemap.xml` y eliminar/corregir la entrada.

### `sitemap-drift: backward — blog/foo.html declares canonical https://ardops.dev/blog/foo.html but it is missing in sitemap.xml`

Publicaste algo y olvidaste actualizar el sitemap. Editar `sitemap.xml`
y agregar la entrada. Si la página NO debe estar en sitemap (404,
fixture), agregarla a `EXCLUDED_FROM_SITEMAP` en
`scripts/check-sitemap-drift.js` (acción explícita y auditable).

## Comandos útiles

```bash
# Inspeccionar la CSP servida por una página
grep 'Content-Security-Policy' blog/index.html

# Listar todos los <a target="_blank"> externos
grep -rn 'target="_blank"' . --include='*.html' | grep -v node_modules | grep -v legacy

# Diff entre el sitemap y los HTML servidos (manual)
ls -1 *.html blog/*.html interviews/*.html talks/*.html
grep '<loc>' sitemap.xml
```

## Smoke test manual (post-implementación)

1. Cargar `https://ardops.dev/blog/` en navegador con DevTools abierto:
   - Verificar Network: `blog-tag-rules.css` se descarga (200 OK).
   - Verificar Console: cero violaciones CSP.
   - Verificar Elements: `<head>` contiene
     `<meta name="referrer" content="strict-origin-when-cross-origin">`.
2. Ir a `https://securityheaders.com/` y escanear `https://ardops.dev/`:
   - Grado mínimo esperado: **A** (limitado por GH Pages, sin headers
     HTTP custom).
3. Hacer clic en un link externo desde `/blog/<slug>.html` y verificar
   que el destino reporta `Referer: https://ardops.dev/`.
