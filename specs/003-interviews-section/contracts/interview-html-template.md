# Contract — HTML Template: Página Individual de Entrevista (normativo)

**Feature**: 003-interviews-section  
**Output path**: `_site/interviews/<slug>.html`  
**URL**: `https://ardops.dev/interviews/<slug>.html`

DOM canónico que produce `scripts/build-interviews.js` para cada entrevista publicada. Cualquier deviación cambia las gates de a11y / html-validate.

---

## Estructura completa

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{title}} — Entrevistas — ardops.dev</title>
  <meta name="description" content="{{summary}}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="{{title}}">
  <meta property="og:description" content="{{summary}}">
  <meta property="og:url" content="https://ardops.dev/interviews/{{slug}}.html">
  <meta property="og:image" content="https://ardops.dev/{{interviewee.image | og-fallback}}">
  <meta property="article:published_time" content="{{date}}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">

  <!-- Canonical -->
  <link rel="canonical" href="https://ardops.dev/interviews/{{slug}}.html">

  <!-- Stylesheets -->
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/layout.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="stylesheet" href="/assets/css/motion.css">
  <link rel="stylesheet" href="/assets/css/interviews.css">

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{{title}}",
    "datePublished": "{{date}}",
    "author": { "@type": "Person", "name": "Victor Josue Ardón Rojas" },
    "about": { "@type": "Person", "name": "{{interviewee.name}}", "jobTitle": "{{interviewee.role}}", "worksFor": { "@type": "Organization", "name": "{{interviewee.company}}" } }
  }
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Saltar al contenido</a>

  <header class="site-header">
    <!-- Idéntico al de index.html, con item "Entrevistas" marcado aria-current="page" cuando aplica -->
  </header>

  <main id="main" class="interview-page">
    <article class="interview" aria-labelledby="interview-title">
      <header class="interview-header">
        <p class="interview-eyebrow"><a href="/interviews/">← Entrevistas</a></p>
        <h1 id="interview-title" class="interview-title">{{title}}</h1>
        <div class="interview-meta">
          <div class="interview-author">
            <!-- imagen o avatar SVG fallback -->
            <img class="interview-avatar" src="/interviews/{{interviewee.image}}" alt="Foto de {{interviewee.name}}" width="64" height="64" loading="lazy">
            <!-- O bien:
            <svg class="interview-avatar" role="img" aria-label="Avatar de {{interviewee.name}}" viewBox="0 0 64 64">…</svg>
            -->
            <div>
              <p class="interview-author-name">{{interviewee.name}}</p>
              <p class="interview-author-role">{{interviewee.role}} · {{interviewee.company}}</p>
              <!-- linkedin opcional:
              <a class="interview-linkedin" href="{{interviewee.linkedin}}" rel="noopener noreferrer">LinkedIn</a>
              -->
            </div>
          </div>
          <p class="interview-stats">
            <time datetime="{{date}}">{{date_human}}</time>
            <span aria-hidden="true"> · </span>
            <span>{{readingTime}} min de lectura</span>
          </p>
          <ul class="interview-tags" role="list">
            {{#each tags}}
            <li><a class="interview-tag" href="/interviews/?tag={{.}}">#{{.}}</a></li>
            {{/each}}
          </ul>
        </div>
      </header>

      <div class="interview-body">
        {{bodyHtml}}  <!-- Sanitizado por DOMPurify en build time -->
      </div>

      <footer class="interview-footer">
        <p><a href="/interviews/">← Volver a todas las entrevistas</a></p>
      </footer>
    </article>
  </main>

  <footer class="site-footer">
    <!-- Footer del sitio -->
  </footer>
</body>
</html>
```

---

## Reglas semánticas (a11y / SEO)

- **R-01**: un único `<h1>` por página = `interview-title`.
- **R-02**: jerarquía de headings continua. El cuerpo de la entrevista debe usar `<h2>` y `<h3>`, no `<h1>`. (Marked configurado para empezar en `<h2>`.)
- **R-03**: `<main id="main">` con skip link funcional.
- **R-04**: `<article>` tiene `aria-labelledby="interview-title"`.
- **R-05**: `<time datetime="YYYY-MM-DD">` con texto humano (`{{date_human}}` = formato local `15 de mayo de 2026`).
- **R-06**: foto con `alt` no vacío. Avatar SVG fallback con `role="img"` y `aria-label`.
- **R-07**: links externos con `rel="noopener noreferrer"`.
- **R-08**: foco visible heredado de `base.css`.

## Reglas de seguridad

- **S-01**: todos los placeholders `{{...}}` salvo `{{bodyHtml}}` se escapan vía `escapeHtml()` en el build.
- **S-02**: `{{bodyHtml}}` ya pasó por `marked` + DOMPurify; no se escapa.
- **S-03**: la página NO contiene `<script>` inline. Solo `<script type="application/ld+json">` con datos derivados (escapados).
- **S-04**: la CSP coincide exactamente con la del sitio.

## Verificación

- `npx html-validate _site/interviews/<slug>.html` → 0 errores.
- `node tests/a11y.js` con la URL en la lista → 0 violaciones WCAG 2.1 AA.
- `bash tests/interviews-xss.sh` → no hay `<script>`/`javascript:` provenientes del cuerpo.
