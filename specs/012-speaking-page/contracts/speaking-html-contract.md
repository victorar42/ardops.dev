# Contract: speaking/index.html — estructura HTML

> Contrato estructural de la página `/speaking/`. Define landmarks,
> ids de sección, atributos `data-*` y orden de tabulación. La gate
> `tests/no-placeholders.sh` + `npm run html-validate` + revisión
> manual de `/implement` validan estos invariantes.

## Esqueleto canónico

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Speaking · Victor Josue Ardón Rojas (ardops.dev)</title>
  <meta name="description" content="…(120-160 chars)…">
  <link rel="canonical" href="https://ardops.dev/speaking/">

  <!-- spec 009: head-meta block (referrer policy etc.) -->
  <!-- head-meta:start -->
  <!-- head-meta:end -->

  <!-- CSP idéntica al resto del sitio -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests">

  <!-- Open Graph + Twitter card (gate seo-meta) -->
  <meta property="og:type" content="profile">
  <meta property="og:title" content="…">
  <meta property="og:description" content="…">
  <meta property="og:url" content="https://ardops.dev/speaking/">
  <meta property="og:image" content="https://ardops.dev/public/og/speaking.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="…">
  <meta name="twitter:description" content="…">
  <meta name="twitter:image" content="https://ardops.dev/public/og/speaking.png">
  <meta name="theme-color" content="#0a0a0a">

  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/layout.css">
  <link rel="stylesheet" href="/assets/css/components.css">

  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Person","@id":"https://ardops.dev/#person","mainEntityOfPage":"https://ardops.dev/speaking/"}
  </script>

  <script defer src="/assets/js/copy-bio.js"></script>
</head>
<body>
  <!-- nav:start -->
  <!-- nav:end -->

  <main id="main" class="speaking-main">
    <header class="speaking-hero">
      <h1>Invitame a tu evento</h1>
      <p>…tagline 1-2 líneas…</p>
      <a class="cta speaking-cta" href="mailto:contacto@ardops.dev?subject=…&body=…">
        Enviar invitación por correo
      </a>
      <p class="speaking-cta-fallback">
        O escribime directamente a
        <a href="mailto:contacto@ardops.dev">contacto@ardops.dev</a>.
      </p>
    </header>

    <section id="bios" class="speaking-bios" aria-labelledby="bios-heading">
      <h2 id="bios-heading">Bios</h2>

      <details class="speaking-bio" data-bio-id="bio-short">
        <summary>Bio corta (~30 palabras)</summary>
        <p id="bio-short-text">…texto plano…</p>
        <button type="button"
                data-copy-target="bio-short-text"
                data-copy-status="bio-short-status">
          Copiar bio corta
        </button>
        <span id="bio-short-status" data-copy-status-target aria-live="polite"></span>
      </details>

      <details class="speaking-bio" data-bio-id="bio-medium">
        <summary>Bio media (~80 palabras)</summary>
        <div id="bio-medium-text">
          <p>…párrafo 1…</p>
          <p>…párrafo 2…</p>
        </div>
        <button type="button"
                data-copy-target="bio-medium-text"
                data-copy-status="bio-medium-status">
          Copiar bio media
        </button>
        <span id="bio-medium-status" data-copy-status-target aria-live="polite"></span>
      </details>

      <details class="speaking-bio" data-bio-id="bio-long">
        <summary>Bio larga (~200 palabras)</summary>
        <div id="bio-long-text">
          <p>…</p><p>…</p><p>…</p>
        </div>
        <button type="button"
                data-copy-target="bio-long-text"
                data-copy-status="bio-long-status">
          Copiar bio larga
        </button>
        <span id="bio-long-status" data-copy-status-target aria-live="polite"></span>
      </details>
    </section>

    <section id="headshot" class="speaking-headshot-section" aria-labelledby="headshot-heading">
      <h2 id="headshot-heading">Foto / Headshot</h2>
      <figure class="speaking-headshot">
        <img src="/assets/img/speaking/headshot.jpg"
             alt="Retrato de Victor Josue Ardón Rojas, fondo neutro, mirada al frente"
             width="320" height="320"
             loading="lazy" decoding="async">
        <figcaption>
          <a href="/assets/img/speaking/headshot.jpg"
             download="ardon-headshot.jpg">
            Descargar headshot HD (≈ 220 KB · 1500×1500 JPG)
          </a>
        </figcaption>
      </figure>
    </section>

    <section id="topics" class="speaking-topics" aria-labelledby="topics-heading">
      <h2 id="topics-heading">Temas que doy</h2>
      <article class="speaking-topic">
        <h3>…título…</h3>
        <p>…descripción 1-2 líneas…</p>
        <dl>
          <dt>Audiencia</dt><dd>…</dd>
          <dt>Duración</dt><dd>…</dd>
        </dl>
      </article>
      <!-- 3 a 7 más -->
    </section>

    <section id="formats" class="speaking-formats" aria-labelledby="formats-heading">
      <h2 id="formats-heading">Idiomas y formatos</h2>
      <dl>
        <dt>Idiomas</dt><dd>Español (nativo), inglés (profesional)</dd>
        <dt>Formatos</dt><dd>Keynote, workshop, panel, podcast, AMA</dd>
        <dt>Modalidad</dt><dd>Presencial (Costa Rica), remoto (LATAM)</dd>
      </dl>
    </section>

    <section id="highlights" class="speaking-highlights" aria-labelledby="highlights-heading">
      <h2 id="highlights-heading">Eventos pasados destacados</h2>
      <ol>
        <li>…título — evento — año…</li>
        <!-- 2 a 4 más -->
      </ol>
      <p><a href="/talks/">Ver historial completo en /talks/ →</a></p>
    </section>
  </main>

  <!-- footer:start -->
  <!-- footer:end -->
</body>
</html>
```

## Invariantes verificables

| # | Invariante | Validador |
|---|-----------|-----------|
| H-1 | Existe `<main id="main">` con `class="speaking-main"`. | html-validate + revisión visual |
| H-2 | Existe exactamente **un** `<h1>`. | html-validate (a11y) |
| H-3 | Cada `<section>` tiene `aria-labelledby` que apunta a su `<h2>`. | pa11y |
| H-4 | Markers `<!-- nav:start --> … <!-- nav:end -->` y `<!-- footer:start --> … <!-- footer:end -->` y `<!-- head-meta:start --> … <!-- head-meta:end -->` presentes. | `scripts/build-layout.js` aborta si faltan |
| H-5 | Exactamente **3** elementos `<details class="speaking-bio">` con `data-bio-id` ∈ `{bio-short, bio-medium, bio-long}`. | revisión `/implement` |
| H-6 | Cada bio tiene `<button data-copy-target="…">` cuyo valor es un id existente en el DOM. | revisión `/implement` |
| H-7 | Cada bio tiene un `<span data-copy-status-target aria-live="polite">` cuyo id matchea `data-copy-status` del botón. | revisión `/implement` |
| H-8 | Existe **1** `<figure class="speaking-headshot">` con `<img loading="lazy" decoding="async" width height alt>` y `<a download="ardon-headshot.jpg">`. | html-validate |
| H-9 | Existen entre **4 y 8** `<article class="speaking-topic">`. | revisión `/implement` |
| H-10 | Existen entre **3 y 5** `<li>` en `#highlights ol`. | revisión `/implement` |
| H-11 | Hay **1** CTA principal `<a class="cta speaking-cta" href="mailto:contacto@ardops.dev?subject=…&body=…">`. | revisión `/implement` |
| H-12 | El CTA va seguido de `<p>` que muestra `contacto@ardops.dev` como texto visible. | revisión `/implement` |
| H-13 | Existe **1** `<script type="application/ld+json">` en `<head>` con `"@id":"https://ardops.dev/#person"`. | `tests/jsonld-validate.sh` |
| H-14 | El head incluye `<meta http-equiv="Content-Security-Policy" content="…">` idéntico al resto de páginas. | `tests/csp-no-unsafe-inline.sh` |
| H-15 | El head incluye canonical absoluto, description, OG (5 metas), twitter (4 metas), theme-color. | `tests/seo-meta.sh` |
| H-16 | Cualquier `<a target="_blank">` tiene `rel="noopener noreferrer"`. | `tests/external-links.sh` |
| H-17 | El único `<script>` referenciado es `/assets/js/copy-bio.js` con `defer`. | revisión + CSP |

## Orden de tabulación esperado (sin contar nav/footer compartidos)

1. CTA principal (mailto).
2. Link al correo visible.
3. `<summary>` bio corta → botón "Copiar bio corta".
4. `<summary>` bio media → botón "Copiar bio media".
5. `<summary>` bio larga → botón "Copiar bio larga".
6. Link "Descargar headshot HD".
7. Cualquier link interno en topics/formats (ninguno por defecto).
8. Cada `<li>` con link en highlights (si lo tiene).
9. "Ver historial completo en /talks/".
