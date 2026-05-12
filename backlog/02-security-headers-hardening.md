# Backlog 02 — Security headers hardening (subset realmente aplicable)

> **Estado**: backlog · **Prioridad**: P1
> **Esfuerzo estimado**: S (~medio día) · **ROI networking**: bajo (señal técnica)

---

## Problema

El sitio ya tiene CSP estricta en la mayoría de páginas, pero hay
**inconsistencias y oportunidades** que no estaban formalizadas:

1. **Regresión real detectada** — [blog/index.html](../blog/index.html) usa
   `style-src 'self' 'unsafe-inline'`, mientras que `index.html`,
   `interviews/index.html` y `talks/index.html` usan solo `'self'`. El
   `'unsafe-inline'` se metió por el `<style id="blog-tag-rules">` inline
   del spec 007. Hay que removerlo o reemplazarlo por hash.
2. No hay `<meta name="referrer" content="strict-origin-when-cross-origin">`
   en ninguna página.
3. No hay gate que valide que **todo `<a target="_blank">` lleva
   `rel="noopener noreferrer"`**.
4. No hay validación de drift entre `sitemap.xml` y las URLs reales servidas.

## Objetivo

Endurecer los controles de seguridad **sin romper el render actual**, y
cerrar la brecha de `'unsafe-inline'` en blog/index.html.

## Alcance funcional (FRs)

- **FR-01 — Eliminar `'unsafe-inline'` de blog/index.html**:
  - Opción A (preferida): mover el contenido de `<style id="blog-tag-rules">`
    a `assets/css/blog-tag-rules.css` generado en build-time, linkeado con
    `<link rel="stylesheet">`. Pierde `:has()` específico por slug si no
    se conoce a build-time → sí se conoce, ya se calcula en
    `renderTagCssRules()`. Viable.
  - Opción B: calcular SHA-256 del bloque inline en build, emitir CSP con
    `style-src 'self' 'sha256-XXXX'`. Más quirúrgico pero el hash cambia
    cada vez que se agrega un tag.
  - Decisión va en research.md.
- **FR-02 — Agregar `<meta name="referrer" content="strict-origin-when-cross-origin">`**
  en el `<head>` de todas las páginas (sí funciona vía meta).
- **FR-03 — Gate `tests/external-links.sh`**: parsea todo HTML servido y
  falla si encuentra `<a target="_blank">` sin `rel` que contenga
  `noopener` y `noreferrer`.
- **FR-04 — Gate `tests/sitemap-drift.sh`**: compara las `<loc>` del
  `sitemap.xml` con las URLs canónicas extraídas de cada HTML. Falla si:
  - Hay URLs en sitemap que no existen como archivo.
  - Hay HTML con `<link rel="canonical">` que no está en sitemap.
- **FR-05 — Documentar como invariante en la constitución**: "cero scripts,
  fonts, CSS o imágenes de origen externo en runtime". Si alguna vez se
  agrega, se requiere SRI explícito.
- **FR-06 — Permissions-Policy via meta**: ⚠️ **NO aplicar** —
  `Permissions-Policy` y `X-Content-Type-Options` **no funcionan como
  `<meta>`**, solo como header HTTP. GH Pages no los permite. Documentar la
  limitación en `docs/05-security-spec.md` y cerrar el tema.

## Alcance técnico

- Cambios en build scripts para emitir el `<meta name="referrer">`.
- Refactor de `renderBlogIndex()` en `scripts/build-blog.js` para emitir
  CSS externo en lugar de inline (si se elige Opción A).
- Nuevos archivos en `tests/`.

## Gates / tests

- `tests/external-links.sh` (nuevo).
- `tests/sitemap-drift.sh` (nuevo).
- `tests/csp-no-unsafe-inline.sh` (nuevo): parsea CSP de cada HTML servido
  y falla si encuentra `'unsafe-inline'` o `'unsafe-eval'`.
- `npm run html-validate` sigue pasando.
- `node tests/a11y.js` sigue pasando.

## Out of scope

- Headers HTTP reales (impossible en GH Pages).
- Mover el sitio fuera de GH Pages para conseguir headers HTTP.
- Subresource Integrity (SRI) — no hay assets externos.
- Content Security Policy report-uri (requiere endpoint).

## Edge cases

- El `<style id="blog-tag-rules">` y `<script id="blog-index" type="application/json">`
  **no son ejecutables** (data declarativa). El gate debe distinguirlos del
  CSS/JS ejecutable inline.

## Criterios de aceptación

- AC-01: `grep "'unsafe-inline'" blog/*.html` = 0 matches.
- AC-02: Todas las páginas servidas tienen `<meta name="referrer" ...>`.
- AC-03: `bash tests/external-links.sh` pasa con 0 violaciones.
- AC-04: `bash tests/sitemap-drift.sh` pasa con 0 drift.
- AC-05: `bash tests/csp-no-unsafe-inline.sh` pasa.

## Constitución relevante

- IV (Security by Default), IX (build-time validation).

## Notas para `/specify`

> "Hardening de CSP y headers compatibles con GH Pages, sin romper render
> actual. Eliminar `'unsafe-inline'` introducido en spec 007, agregar
> referrer policy meta, y crear gates para `rel=noopener` y sitemap drift.
> Documentar explícitamente que `Permissions-Policy` y `X-Content-Type-Options`
> no son aplicables en GH Pages."
