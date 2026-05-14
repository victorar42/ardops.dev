# Contract — `/privacy/` page

**Archivo**: `privacy/index.html`
**Ruta servida**: `https://ardops.dev/privacy/`

## Estructura mínima

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="…">  <!-- idéntica a spec 009 -->
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>Privacidad — ardops.dev</title>
  <meta name="description" content="Política de privacidad de ardops.dev: cero cookies, cero analytics, cero third-party scripts.">
  <link rel="canonical" href="https://ardops.dev/privacy/">
  <!-- OG/Twitter (mismas keys que el resto del sitio) -->
  <!-- icon + manifest -->
  <!-- preloads de fonts (woff2 outfit-400 + jetbrains-mono-400) -->
  <!-- stylesheets: tokens, base, motion, layout, components -->
</head>
<body>
  <a class="skip-link" href="#main">Saltar al contenido</a>

  <!-- header:start -->
  <header class="site-header">…nav idéntico al resto…</header>
  <!-- header:end -->

  <main id="main" class="privacy-page">
    <header class="page-hero">
      <p class="section-label">// privacy</p>
      <h1>Privacidad</h1>
      <p class="lede">Política de privacidad de ardops.dev. Última actualización: <time datetime="2026-05-14">14 de mayo de 2026</time>.</p>
    </header>

    <article class="privacy-content">
      <section id="no-hace"><h2>Qué este sitio NO hace</h2>…</section>
      <section id="logs"><h2>Qué pasa con los logs de acceso</h2>…</section>
      <section id="mailto"><h2>Información que recibo por <code>mailto:</code></h2>…</section>
      <section id="cambios"><h2>Cambios a esta política</h2>…</section>
      <section id="contacto"><h2>Contacto</h2>…</section>
    </article>

    <p class="back-cta"><a class="btn btn-ghost" href="/">← Volver al inicio</a></p>
  </main>

  <!-- footer:start -->
  <footer class="site-footer">…incluye <a href="/privacy/">…</footer>
  <!-- footer:end -->
</body>
</html>
```

## Reglas de contenido (es-CR)

| Sección | Palabras objetivo | Debe contener |
|---|---|---|
| 1. Qué no hace | 45–60 | enumerar: cookies, analytics, fingerprinting, third-party scripts, tracking pixels, newsletters embebidas, comentarios |
| 2. Logs | 40–55 | mención a GitHub Pages como hosting + enlace `https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement` con `rel="noopener noreferrer"` |
| 3. Mailto | 30–45 | "solo lo que vos escribás" + "sin retención más allá de lo necesario" |
| 4. Cambios | 30–45 | commit history como source of truth + enlace al archivo en GitHub (`https://github.com/ardops/ardops.dev/blob/main/privacy/index.html`) |
| 5. Contacto | 20–35 | email `mailto:hola@ardops.dev` (o el que ya use el sitio) |

**Total**: 200–300 palabras (objetivo ≈ 250). Verificable contando texto
plano del `<main>` con `wc -w`.

## Reglas a11y / semántica

- Exactamente un `<h1>`.
- `<h2>` consecutivos sin saltar a `<h3>` antes de `<h2>` (no hay h3 en
  esta página).
- Skip link al `<main id="main">`.
- Cada enlace externo: `target="_blank" rel="noopener noreferrer"` o
  ningún `target` (preferido para `mailto:`).
- `<time datetime>` con formato `YYYY-MM-DD`.
- Foco visible: heredado de `assets/css/base.css`.
- Contraste: heredado de tokens (Lighthouse a11y ≥ 95 esperado).
- Sin formularios, sin widgets dinámicos.

## Reglas de seguridad

- Misma CSP que el resto del sitio (string idéntico).
- Cero `<script>` con `src` externo.
- Cero `<script>` inline salvo, opcionalmente, un bloque
  `<script type="application/ld+json">` con un esquema
  `@type: "WebPage"` simple.
- Cero `document.cookie`.
- Cero patrones de `tests/tracker-domains.txt`.

## Reglas de performance

- HTML ≤ 6 KB sin gzip (≤ 2 KB con gzip).
- No carga `assets/js/main.js` (decisión R-1).
- Reusa todos los `.css` ya en cache si el visitante viene de otra
  página del sitio.
- Cumple thresholds spec 014: CLS ≤ 0.1, LCP ≤ 3000 ms mobile, perf
  Lighthouse ≥ 0.95 mobile.

## Verificación

- `npm run html-validate`
- `bash tests/no-trackers.sh`
- `bash tests/no-cookies.sh`
- `bash tests/external-links.sh`
- `node tests/jsonld-validate.js` (si se incluye JSON-LD)
- `bash tests/byte-budgets.sh`
- `bash tests/img-attrs.sh` (página sin imágenes → trivial)
- `node tests/a11y.js` (con URL agregada)
- `npm run check:csp`
- `npm run check:seo-meta`
- Lighthouse CI (desktop + mobile)
