# 06 — Performance Spec

## Budgets
- Lighthouse Performance ≥ 95
- LCP < 2.5s, CLS < 0.1, INP < 200ms
- Imágenes en WebP/AVIF con fallback
- Fonts con font-display: swap
- CSS crítico inline, resto diferido
- Sin JS en páginas que no lo necesiten

## Estrategia
- 

---

## Implementación v1 — Budgets Lighthouse CI

| Métrica | Threshold |
|---|---|
| Performance | ≥ 0.95 |
| Accessibility | = 1.00 |
| Best Practices | ≥ 0.95 |
| SEO | ≥ 0.95 |
| LCP | < 2500 ms |
| CLS | < 0.10 |
| TBT (proxy de INP) | < 200 ms |
| Total byte weight | < 500 KB |

Gates ejecutados en `.github/workflows/lighthouse.yml` (matriz desktop+mobile).
Configuración en [tests/lighthouserc.json](../tests/lighthouserc.json).

**Optimizaciones aplicadas**:

- Fonts self-hosted woff2, subset latin, `font-display: swap`,
  preload de los 2 críticos (`outfit-400`, `jetbrains-mono-400`).
- CSS dividido en 6 hojas; sin frameworks; sin runtime JS de terceros.
- `main.js` ≤ 2 KB con `defer`.
- Imágenes: OG 1200×630 PNG (~90 KB), favicons SVG + PNG.

---

## Thresholds & byte budgets (spec 014)

Spec [014-perf-a11y-thresholds](../specs/014-perf-a11y-thresholds/)
formaliza los thresholds vigentes y agrega byte budgets enforced en CI.

### Lighthouse thresholds (desktop y mobile)

| Categoría | Mínimo |
|---|---|
| Performance | ≥ 0.95 |
| Accessibility | = 1.00 |
| Best Practices | ≥ 0.95 |
| SEO | ≥ 0.95 |

### Core Web Vitals

| Métrica | Desktop | Mobile |
|---|---:|---:|
| LCP | ≤ 2500 ms | ≤ 3000 ms |
| CLS | ≤ 0.10 | ≤ 0.10 |
| TBT (proxy INP) | ≤ 200 ms | ≤ 300 ms |

### Byte budgets

| Bucket | Límite | Unidad |
|---|---:|---|
| `html-each` | 51200 B (50 KiB) | gzip-9 |
| `css-sum` | 30720 B (30 KiB) | gzip-9 |
| `js-sum` | 51200 B (50 KiB) | gzip-9 |
| `img-each` | 204800 B (200 KiB) | raw |

Gate: [tests/byte-budgets.sh](../tests/byte-budgets.sh). Wired en
`npm run check:byte-budgets` y como job CI `byte-budgets`.

URLs auditadas por Lighthouse (mantener en sync con sitemap):
home, blog index, último post, interviews, talks, speaking, now, 404.

Imágenes: gate adicional [tests/img-attrs.sh](../tests/img-attrs.sh)
requiere `alt`, `width`, `height`, `loading` (lazy o eager) y
`decoding="async"` en cada `<img>` servido (FR-06).

## Syntax highlighting (spec 016)

Los bloques de código en posts del blog se tokenizan en **build-time**
con Shiki (devDep, sin JS runtime). Cada post carga
[`/assets/css/syntax.css`](../assets/css/syntax.css) **solo si**
contiene ≥ 1 bloque tokenizado (carga condicional).

Budget gate:

| Métrica | Budget | Gate |
|---|---:|---|
| `syntax.css` gzip-9 | 5120 B (5 KiB) | [tests/syntax-css-size.sh](../tests/syntax-css-size.sh) |

Detalles en [specs/016-syntax-highlighting/](../specs/016-syntax-highlighting/).
