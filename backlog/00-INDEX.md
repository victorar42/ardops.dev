# Backlog — índice y orden de ejecución

> **Última actualización**: 2026-05-11

Este folder contiene specs **propuestas** que aún no entraron al flujo
formal de Spec Kit. Cada archivo describe qué construir, alcance, gates,
out-of-scope y notas para el `/speckit.specify` correspondiente.

## Orden recomendado

| # | Archivo | Prioridad | Esfuerzo | ROI networking | Bloquea |
|---|---|---|---|---|---|
| 01 | [01-shared-nav-and-footer.md](01-shared-nav-and-footer.md) | **P0** | M | Alto (indirecto) | Backlog 03, 05, 06, 08 |
| 02 | [02-security-headers-hardening.md](02-security-headers-hardening.md) | P1 | S | Bajo | — |
| 03 | [03-uses-page.md](03-uses-page.md) | P1 | S | **Muy alto** | depende de 01 |
| 04 | [04-rss-jsonld-seo.md](04-rss-jsonld-seo.md) | P1 | M | **Muy alto** | — |
| 05 | [05-speaking-page.md](05-speaking-page.md) | P2 | S | Alto | depende de 01 |
| 06 | [06-now-page.md](06-now-page.md) | P2 | XS | Medio | depende de 01 |
| 07 | [07-perf-a11y-thresholds.md](07-perf-a11y-thresholds.md) | P3 | XS | Bajo | — |
| 08 | [08-privacy-no-tracking.md](08-privacy-no-tracking.md) | P3 | XS | Bajo | depende de 01 |
| 09 | [09-blog-tag-pages.md](09-blog-tag-pages.md) | P4 | S | Bajo (hoy) | esperar 5+ posts |
| 10 | [10-syntax-highlighting-shiki.md](10-syntax-highlighting-shiki.md) | P4 | S | Medio | esperar 2+ posts con código |
| 11 | [11-og-images-dynamic.md](11-og-images-dynamic.md) | P5 | M | Medio | esperar 5+ posts |

## Cómo usar este backlog

Para cada archivo, cuando esté listo para entrar al flujo:

1. Leer el archivo de backlog completo.
2. Ejecutar `/speckit.specify` usando las **"Notas para `/specify`"** del
   final del archivo como prompt base.
3. Ajustar la spec generada con detalles que solo conocés vos.
4. Continuar con `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`.
5. Una vez mergeado el PR, mover este archivo a `backlog/done/` o
   eliminarlo (lo definitivo vive en `specs/NNN-...`).

## Principios aplicados al armar este backlog

- **Cero scope creep respecto a recomendaciones del análisis previo**:
  cada item es uno de los recomendados en el análisis, ni más ni menos.
- **Descartados explícitamente** (con justificación):
  - `Permissions-Policy` / `X-Content-Type-Options` vía `<meta>` (no funcionan).
  - Modo claro / `prefers-color-scheme` (rompe identidad visual).
  - Newsletter (overhead injustificado a la escala actual).
  - Plausible / GoatCounter self-hosted (scope creep, viola CSP).
  - Spec C completa (ya implementada por specs 006 + 007).
- **Diferidos con criterio claro**:
  - Tag pages → ≥ 5 posts.
  - Syntax highlighting → ≥ 2 posts con código.
  - OG dinámicas → ≥ 5 posts.

## Notas para futuras adiciones

Cuando agreguemos un nuevo backlog item:

1. Crear archivo con número siguiente (12-, 13-, ...).
2. Actualizar este `00-INDEX.md` con la entrada en la tabla.
3. Asignar prioridad realista (P0 = bloquea otras, P1 = alto valor, P2 =
   feature core, P3 = mejora, P4 = futuro, P5 = nice to have).
4. Documentar dependencias explícitas con otros backlog items.
