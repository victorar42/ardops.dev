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
