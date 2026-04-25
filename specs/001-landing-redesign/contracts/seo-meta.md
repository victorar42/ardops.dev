# SEO Meta Contract

**Applies to**: `index.html` (estricto). Páginas hermanas (`blog/`, `talks/`, `404.html`) heredan estructura con `title`/`description`/`canonical` propios.

## Required `<head>` elements

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="...">  <!-- ver csp-policy.md -->

<title>ardops.dev — DevOps Engineer · Security as Code</title>
<meta name="description" content="<≤160 chars>">
<link rel="canonical" href="https://ardops.dev/">
<meta name="theme-color" content="#0a0e17">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="ardops.dev — DevOps Engineer · Security as Code">
<meta property="og:description" content="<≤160 chars>">
<meta property="og:url" content="https://ardops.dev/">
<meta property="og:image" content="https://ardops.dev/public/og/og-default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="es_CR">
<meta property="og:site_name" content="ardops.dev">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="ardops.dev — DevOps Engineer · Security as Code">
<meta name="twitter:description" content="<≤160 chars>">
<meta name="twitter:image" content="https://ardops.dev/public/og/og-default.png">

<!-- Favicons -->
<link rel="icon" href="/public/favicon/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/public/favicon/favicon-32.png">
<link rel="apple-touch-icon" href="/public/favicon/apple-touch-icon.png">
<link rel="manifest" href="/public/favicon/site.webmanifest">

<!-- Fonts (preload críticas) -->
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/outfit-400.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/jetbrains-mono-400.woff2" crossorigin>

<!-- CSS -->
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/motion.css">
<link rel="stylesheet" href="/assets/css/layout.css">
<link rel="stylesheet" href="/assets/css/components.css">
<link rel="stylesheet" href="/assets/css/home.css">

<!-- JS -->
<script defer src="/assets/js/main.js"></script>
```

## Site-wide files

- `/robots.txt`:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://ardops.dev/sitemap.xml
  ```
- `/sitemap.xml`: lista `https://ardops.dev/`, `/blog/`, `/talks/` con `lastmod` actualizado por workflow.

## Assertions

- S1. `<title>` ≤ 60 caracteres.
- S2. `meta description` y `og:description` ≤ 160 caracteres.
- S3. `canonical` apunta al URL absoluto de la página actual (no relativo, no con query).
- S4. `og:image` es URL absoluta y existe (HTTP 200).
- S5. `og:locale` = `es_CR`.
- S6. `twitter:card` = `summary_large_image`.
- S7. `robots.txt` y `sitemap.xml` devuelven 200.

## Verification

- Manual: [opengraph.xyz](https://www.opengraph.xyz/), [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/), [Cards Validator de X](https://cards-dev.x.com/validator).
- Automated: Lighthouse SEO = 100 ⇒ S1, S2, S3 cubiertos.
- Automated (opcional): script en CI que parsea `<head>` de cada página y valida S1-S6.
