# Lighthouse Budgets Contract

**Applies to**: `index.html`, `blog/index.html`, `talks/index.html`, `404.html`.

## Required minimums (per Lighthouse run)

| Category / Metric | Threshold | Severity |
|---|---|---|
| Performance | ≥ 95 | error |
| Accessibility | = 100 | error |
| Best Practices | ≥ 95 | error |
| SEO | ≥ 95 | error |
| Largest Contentful Paint | < 2500 ms | error |
| Cumulative Layout Shift | < 0.1 | error |
| Total Blocking Time | < 200 ms | error |
| Total Byte Weight | < 500 KB | warn |
| Third-party Cohort | 0 entries | error |

## Run matrix

- Form factor: `mobile` AND `desktop` (dos invocaciones).
- Throttling: Lighthouse default mobile (Slow 4G, 4× CPU).
- URLs: home, blog placeholder, talks placeholder, 404.

## Implementation

`tests/lighthouserc.json` (configurado por workflow `lighthouse.yml`):

```json
{
  "ci": {
    "collect": {
      "staticDistDir": ".",
      "url": [
        "http://localhost/index.html",
        "http://localhost/blog/index.html",
        "http://localhost/talks/index.html",
        "http://localhost/404.html"
      ],
      "numberOfRuns": 3,
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 1.0 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }],
        "total-byte-weight": ["warn", { "maxNumericValue": 512000 }]
      }
    }
  }
}
```

(El run mobile se invoca con `--collect.settings.preset=perf` en una matrix separada.)

## Failure handling

LHCI failure ⇒ workflow fails ⇒ deploy bloqueado. Reporte HTML adjunto al run para diagnóstico.
