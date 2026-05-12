# Blog — guía de autoría

Esta carpeta contiene los posts en Markdown del blog de **ardops.dev**.
El sitio es estático: cada `.md` válido se compila a HTML por
`scripts/build-blog.js` y aparece en:

- la portada (top‑3 más recientes en `<section id="blog">`),
- el índice completo `/blog/`,
- una página propia `/blog/<slug>.html`.

## Frontmatter requerido

```yaml
---
title: "Título del post"               # string, requerido
slug: "kebab-case-slug"                # string, requerido, único
date: 2026-05-11                       # YYYY-MM-DD calendario válido
summary: "Resumen 20..280 caracteres." # string
tags: ["tag-a", "tag-b"]               # array de strings (puede ir vacío)
published: true                        # boolean (false → no se publica)
---
```

Reglas:

- `slug` debe ser único en toda la carpeta. Duplicado ⇒ falla el build.
- `date` se parsea como fecha de calendario (`2026-13-01` ⇒ falla).
- `summary` se valida 20..280 caracteres.
- `published: false` excluye el post del build pero no falla.

## Estructura de un post

El cuerpo Markdown se renderiza con `marked` y se **sanitiza con DOMPurify**
antes de inyectarse en HTML (whitelist en `scripts/build-blog.js`).

Se permite HTML inline para tarjetas como `<div class="post-stats">…
<div class="stat-card">…</div>…</div>`. Los `<script>`, `<iframe>`,
`<style>`, `<form>`, `<svg>`, `<button>` y los `href` con esquemas
`javascript:`, `vbscript:` o `data:` se eliminan automáticamente.

## Workflow

1. Crear `content/blog/YYYY-MM-slug.md` con el frontmatter.
2. Ejecutar `node scripts/build-blog.js` para regenerar HTML.
3. Verificar `node scripts/build-blog.js --check` (debe estar en sync).
4. Validar HTML: `npm run html-validate` y `bash tests/no-placeholders.sh`.
5. Commit.

El job `blog-build-check` de CI ejecuta `--check` + `tests/blog-schema.sh`
(fixtures negativas + XSS) en cada PR. Si el `.md` está fuera de sync con
el HTML emitido, el build falla.

## Fixtures de prueba

`content/blog/__fixtures__/` contiene casos negativos (frontmatter
inválido, slug duplicado, XSS). Se excluyen del build de producción y se
usan exclusivamente desde `tests/blog-schema.sh`.

No agregar `.md` reales con prefijo `__`: ese namespace está reservado
para los stagings temporales del test de schema.
