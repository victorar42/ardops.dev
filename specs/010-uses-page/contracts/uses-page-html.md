# Contract: `uses/index.html`

**Feature**: 010-uses-page
**Phase**: 1 (design)

Define la **forma exacta** del HTML que la implementación debe producir.
Las gates existentes (html-validate, csp, nav-consistency, sitemap-drift,
a11y, no-placeholders, external-links) son el contrato ejecutable.

---

## C-1. `<head>` obligatorio

El `<head>` debe coincidir, modulo `<title>`/`<meta description>` propios,
con el patrón de `talks/index.html`:

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests">
  <!-- head-meta:start -->
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <!-- head-meta:end -->
  <title>Uses — ardops.dev</title>
  <meta name="description" content="Stack DevSecOps 2026: hardware, herramientas, CLIs, cloud y servicios que uso día a día como ingeniero en Costa Rica.">
  <meta name="theme-color" content="#0a0e17">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="https://ardops.dev/uses/">

  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_CR">
  <meta property="og:site_name" content="ardops.dev">
  <meta property="og:title" content="Uses — ardops.dev">
  <meta property="og:description" content="Stack DevSecOps 2026: hardware, herramientas, CLIs y cloud que uso día a día.">
  <meta property="og:url" content="https://ardops.dev/uses/">
  <meta property="og:image" content="https://ardops.dev/public/og/og-default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="ardops.dev — Uses">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Uses — ardops.dev">
  <meta name="twitter:description" content="Stack DevSecOps 2026 que uso día a día.">
  <meta name="twitter:image" content="https://ardops.dev/public/og/og-default.png">

  <link rel="icon" href="/public/favicon/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="/public/favicon/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" sizes="180x180" href="/public/favicon/apple-touch-icon.png">
  <link rel="manifest" href="/public/favicon/site.webmanifest">

  <link rel="preload" href="/assets/fonts/outfit-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/jetbrains-mono-400.woff2" as="font" type="font/woff2" crossorigin>

  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/motion.css">
  <link rel="stylesheet" href="/assets/css/layout.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="stylesheet" href="/assets/css/home.css">

  <script type="application/ld+json">
  [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": "https://ardops.dev/uses/#webpage",
      "url": "https://ardops.dev/uses/",
      "name": "Uses — ardops.dev",
      "description": "Stack DevSecOps 2026 de Victor Josue Ardón Rojas.",
      "inLanguage": "es-CR",
      "isPartOf": { "@id": "https://ardops.dev/#website" },
      "author": { "@id": "https://ardops.dev/#person" }
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://ardops.dev/#person",
      "name": "Victor Josue Ardón Rojas",
      "url": "https://ardops.dev/",
      "jobTitle": "DevSecOps Engineer"
    }
  ]
  </script>

  <script defer src="/assets/js/main.js"></script>
</head>
```

**Reglas**:

- CSP **idéntica byte-a-byte** a la de `talks/index.html`. Si difiere, rompe
  `tests/csp-no-unsafe-inline.sh`.
- Marcadores `<!-- head-meta:start -->` / `<!-- head-meta:end -->` presentes
  para que `scripts/build-layout.js` procese la página.
- JSON-LD con dos nodos (WebPage + Person). Si el `Person` actual de
  `index.html` difiere de la forma mostrada, **se copia tal cual** del
  `index.html` para evitar drift.

## C-2. `<body>` — esqueleto

```html
<body>

  <!-- nav:start -->
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <header class="site-header">
    <nav class="site-nav" aria-label="Navegación principal">
      <a href="/" class="nav-logo">ardops<span>.dev</span></a>
      <ul class="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/#pipeline">Pipeline</a></li>
        <li><a href="/blog/">Blog</a></li>
        <li><a href="/interviews/">Entrevistas</a></li>
        <li><a href="/talks/">Charlas</a></li>
        <li><a href="/uses/" aria-current="page">Uses</a></li>
        <li><a href="/#contact">Contacto</a></li>
      </ul>
    </nav>
  </header>
  <!-- nav:end -->

  <main id="main">

    <section class="section" aria-labelledby="uses-heading">
      <p class="section-label">// uses</p>
      <h1 id="uses-heading" class="section-title">Stack & herramientas</h1>
      <p class="section-lead">Lo que uso día a día como DevSecOps en 2026, y por qué.</p>
    </section>

    <section class="section" id="hardware" aria-labelledby="hardware-heading">
      <h2 id="hardware-heading" class="section-title">Hardware</h2>
      <dl class="uses-list">
        <dt>…</dt>
        <dd>…</dd>
      </dl>
    </section>

    <!-- Repetir el patrón <section><h2><dl> para cada sección obligatoria -->
    <!-- (os-shell, editor, terminal-cli, lenguajes, devops, security, cloud, productividad) -->
    <!-- Opcionales (al final): hobbies, abandoned -->

    <section class="section" aria-labelledby="uses-updated-heading">
      <h2 id="uses-updated-heading" class="section-title visually-hidden">Última actualización</h2>
      <p class="uses-updated">
        Última actualización:
        <time datetime="2026-05-12">mayo 2026</time>
      </p>
      <p class="back-cta"><a class="btn btn-ghost" href="/">← Volver al inicio</a></p>
    </section>

  </main>

  <!-- footer:start -->
  <footer class="site-footer">
    <p><span class="footer-mono">ardops.dev</span> · Security as Code · Costa Rica · &copy; <span data-year>2026</span></p>
    <p class="footer-tagline">Built with intention. Deployed with CI/CD.</p>
  </footer>
  <!-- footer:end -->

</body>
</html>
```

**Reglas**:

- Exactamente UN `<h1>` (`uses-heading`).
- `<h2>` por sección, sin saltos de jerarquía.
- Cada `<dl>` tiene ≥ 1 par `<dt>`/`<dd>`.
- `<dd>` nunca vacío.
- Marcadores `nav:*` y `footer:*` presentes y con el contenido idéntico a lo
  que `scripts/lib/layout.js` produce para `currentPath = '/uses/'`.
- El `<a href="/uses/">` del nav lleva `aria-current="page"` en este HTML
  (lo emite `renderHeader('/uses/')`).
- Cero `<img>` en el `<body>`.
- Cero `<style>` y cero `<script>` adicionales.
- Cero atributos `style="..."` inline.

## C-3. Links externos (si los hay)

Cada `<a href="https://...">` dentro de un `<dd>` debe llevar
`rel="noopener noreferrer"`. Cero `rel="sponsored"`. La gate
`tests/external-links.sh` lo enforza.

Ejemplo permitido:

```html
<dd>Configurado vía <a href="https://example.com/docs" rel="noopener noreferrer">docs oficiales</a>.</dd>
```

## C-4. Banner de actualización

- `<time datetime="YYYY-MM-DD">` con fecha real (no placeholder).
- Texto humano en español ("mayo 2026").
- `tests/no-placeholders.sh` debe pasar (no debe contener `[Mes Año]`,
  `TODO`, `FIXME`, `XXX`).

## C-5. Validación de contrato

| Gate | Espera |
|---|---|
| `npm run html-validate uses/index.html` | 0 errores. |
| `node scripts/build-layout.js --check` | `uses/index.html` reportada como sincronizada. |
| `bash tests/nav-consistency.sh` | `/uses/` validada. |
| `bash tests/csp-no-unsafe-inline.sh` | `/uses/` incluida y pasa. |
| `bash tests/external-links.sh` | `/uses/` cubierta; cero violaciones. |
| `bash tests/sitemap-drift.sh` | canonical `/uses/` ∈ sitemap. |
| `bash tests/no-placeholders.sh` | sin placeholders. |
| `node tests/a11y.js` | `/uses/` incluida; cero violations WCAG 2.1 AA. |
