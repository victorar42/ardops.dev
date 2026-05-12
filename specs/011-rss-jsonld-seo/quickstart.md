# Quickstart: validar feeds, JSON-LD y SEO meta en local

**Feature**: 011-rss-jsonld-seo
**Phase**: 1 (design)

---

## Prerequisitos

- Node 20 LTS + `npm install` ejecutado.
- Branch `011-rss-jsonld-seo` checked out.

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
  && bash tests/nav-consistency.sh \
  && bash tests/feed-validate.sh \
  && bash tests/jsonld-validate.sh \
  && bash tests/seo-meta.sh
```

Esperado: todas verdes.

## Smoke manual — feeds

### RSS

```bash
xmllint --noout blog/feed.xml ; echo "exit=$?"
```

Pegar `blog/feed.xml` (subido temporalmente o servido localmente) en:
- https://validator.w3.org/feed/
- Feedly (Add Feed → URL).

Esperado: cero errores.

### JSON Feed

```bash
python3 -m json.tool < blog/feed.json | head -20
```

Pegar en: https://validator.jsonfeed.org/.

Esperado: válido.

## Smoke manual — JSON-LD

1. Abrir cada página servida en navegador.
2. View Source → buscar `application/ld+json`.
3. Copiar el JSON y pegarlo en https://validator.schema.org/.

Páginas a verificar mínimo:
- `/` (Person)
- `/blog/` (Blog + BreadcrumbList)
- `/blog/<slug>.html` (Article + BreadcrumbList)
- `/talks/` (ItemList + BreadcrumbList)
- `/interviews/` (ItemList + BreadcrumbList)

Esperado: cero errores de validación, warnings menores aceptables.

## Smoke manual — SEO meta

```bash
for f in index.html blog/index.html blog/*.html talks/index.html uses/index.html interviews/index.html ; do
  echo "--- $f ---"
  grep -E 'rel="canonical"|name="description"|property="og:|name="twitter:card"|name="theme-color"' "$f" | wc -l
done
```

Cada página debe imprimir ≥ 9 (todos los meta tags requeridos).

## Smoke manual — auto-discovery

1. Servir el sitio: `npx http-server -p 8080 -c-1 .`.
2. Instalar extensión RSS en Firefox (e.g. "Awesome RSS").
3. Abrir `http://localhost:8080/blog/`.
4. La extensión debe sugerir suscribirse a `/blog/feed.xml`.

## Lighthouse SEO

```bash
npx lighthouse http://localhost:8080/blog/ --only-categories=seo --form-factor=mobile --quiet
npx lighthouse http://localhost:8080/blog/<slug>.html --only-categories=seo --form-factor=mobile --quiet
```

Esperado: SEO ≥ 95.

## Edición editorial recurrente

Para añadir un post:

1. Crear `content/blog/<YYYY>-<MM>-<slug>.md` con frontmatter válido.
2. Correr `npm run build` (regenera `blog/<slug>.html`, `blog/feed.xml`,
   `blog/feed.json`, `blog/index.html`).
3. Correr el one-liner de gates.
4. Commit + PR.
