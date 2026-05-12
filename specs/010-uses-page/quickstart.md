# Quickstart: validar `/uses/` en local

**Feature**: 010-uses-page
**Phase**: 1 (design)

---

## Prerequisitos

- Repo clonado y `npm install` ejecutado.
- Node 20 LTS.
- Branch `010-uses-page` checked out.

## Build + gates (one-liner)

```bash
npm run build \
  && node scripts/build-blog.js --check \
  && node scripts/build-layout.js --check \
  && npm run html-validate \
  && bash tests/no-placeholders.sh \
  && bash tests/csp-no-unsafe-inline.sh \
  && bash tests/external-links.sh \
  && bash tests/sitemap-drift.sh \
  && bash tests/nav-consistency.sh
```

Esperado: todas las gates verdes.

## A11y (requiere servidor local)

En una terminal:

```bash
npx http-server -p 8080 -c-1 .
```

En otra:

```bash
node tests/a11y.js
```

Esperado: `0 violations` para todas las URLs, incluida `http://localhost:8080/uses/`.

## Lighthouse (smoke manual)

```bash
npx lighthouse http://localhost:8080/uses/ --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --quiet
```

Esperado: Performance ≥ 95, Accessibility = 100, Best Practices ≥ 95, SEO ≥ 95.

## Smoke browser

1. Abrir `http://localhost:8080/uses/`.
2. Verificar que el nav muestra "Uses" con `aria-current="page"` activo.
3. Tab a través de la página: skip-link → nav → secciones → footer. Sin
   trampas de foco, sin elementos no alcanzables.
4. Reader Mode (Safari/Firefox): la página se lee como una lista de
   pares término–definición coherente.
5. Inspector → `<head>`: confirmar CSP, `<meta name="referrer">`, JSON-LD,
   canonical, OG, Twitter card presentes.

## Edición editorial recurrente

Para actualizar el stack en el futuro:

1. Editar `uses/index.html`: añadir/quitar/modificar `<dt>`/`<dd>`.
2. Actualizar `<time datetime="YYYY-MM-DD">` y el texto humano del banner.
3. Actualizar `<lastmod>` de `/uses/` en `sitemap.xml`.
4. Correr el one-liner de gates.
5. Commit con título tipo `uses: editor cambió de A a B` y abrir PR.
