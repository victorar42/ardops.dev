# Contract — `now/index.html` HTML structure

**Feature**: spec 013 · **Audience**: implementor + html-validate +
no-placeholders + nav-consistency gates.

Este contrato define la estructura MÍNIMA y OBLIGATORIA del documento
HTML servido en `/now/`. Cualquier desviación es bug.

## Outline

```
<!DOCTYPE html>
<html lang="es">
  <head>
    <!-- head-meta:start -->
      <!-- inyectado por scripts/build-layout.js (spec 008):
           charset, viewport, title, description, canonical,
           referrer policy, OG, Twitter, CSP meta -->
    <!-- head-meta:end -->

    <link rel="stylesheet" href="/assets/css/tokens.css">
    <link rel="stylesheet" href="/assets/css/base.css">
    <link rel="stylesheet" href="/assets/css/layout.css">
    <link rel="stylesheet" href="/assets/css/components.css">

    <script type="application/ld+json">{ … WebPage … }</script>
  </head>

  <body>
    <!-- nav:start -->
      <!-- inyectado por scripts/build-layout.js; sin aria-current
           porque /now/ NO está en el nav principal (R-4, FR-05) -->
    <!-- nav:end -->

    <main id="main" tabindex="-1">

      <section class="hero hero--compact">
        <p class="now-banner muted">
          Última actualización:
          <time datetime="YYYY-MM-DD">D de MMMM de YYYY</time>
        </p>
        <h1>Now — qué estoy haciendo este mes</h1>
        <p class="lead">…intro corta (~1 oración)…</p>
      </section>

      <section class="section" data-now-section="trabajo">
        <h2>Trabajo</h2>
        <ul class="list-clean">
          <li>…</li>
          <!-- 1..5 items -->
        </ul>
      </section>

      <section class="section" data-now-section="aprendiendo">
        <h2>Aprendiendo</h2>
        <ul class="list-clean"> … </ul>
      </section>

      <section class="section" data-now-section="leyendo">
        <h2>Leyendo</h2>
        <ul class="list-clean"> … </ul>
      </section>

      <!-- opcionales -->
      <section class="section" data-now-section="hablando">
        <h2>Hablando</h2>
        <ul class="list-clean"> … </ul>
      </section>

      <section class="section" data-now-section="vida">
        <h2>Vida</h2>
        <ul class="list-clean"> … </ul>
      </section>

      <section class="section now-credit">
        <p>
          Inspirado por el movimiento
          <a href="https://nownownow.com/about"
             target="_blank"
             rel="noopener noreferrer">nownownow.com</a>
          de Derek Sivers.
        </p>
      </section>

    </main>

    <!-- footer:start -->
      <!-- inyectado por scripts/build-layout.js;
           debe incluir <a href="/now/">Now</a> -->
    <!-- footer:end -->
  </body>
</html>
```

## Reglas duras

1. **Lang**: `<html lang="es">`.
2. **Markers**: deben existir `<!-- head-meta:start --> … :end -->`,
   `<!-- nav:start --> … :end -->`, `<!-- footer:start --> … :end -->`
   verificables por `scripts/build-layout.js`.
3. **`<h1>` único** con texto "Now — qué estoy haciendo este mes"
   (o variante autorizada en la spec).
4. **Banner `<time>`**: primer `<time datetime="YYYY-MM-DD">` del
   documento. La fecha humana visible debe coincidir con el
   atributo `datetime`.
5. **Secciones**:
   - Mínimo 3, máximo 5.
   - Cada `<section>` tiene un `<h2>` y exactamente una `<ul>` o `<ol>`.
   - El atributo `data-now-section` toma valores
     `trabajo | aprendiendo | leyendo | hablando | vida`.
   - Orden canónico fijo (R-1).
6. **Items**: 1-5 `<li>` por sección. Sin párrafos largos.
7. **Credit**: `<a href="https://nownownow.com/about" target="_blank"
   rel="noopener noreferrer">` obligatorio.
8. **JSON-LD**: un único `<script type="application/ld+json">` con
   `WebPage` (ver `contracts/jsonld-webpage.md`).
9. **Sin JS propio**: cero `<script>` que no sea `application/ld+json`.
10. **Sin inline styles**: cero `style="…"`. Cero `<style>` en
    `<body>`. CSP estricta (constitución VIII).
11. **`<a target="_blank">` externos**: siempre con
    `rel="noopener noreferrer"` (gate `external-links`).
12. **No-placeholders**: cero ocurrencias de
    `[Tu Nombre]`, `Lorem`, `TODO`, `FIXME`, `XXX` (gate
    `no-placeholders`).
13. **Headings**: jerarquía estricta H1 → H2 → H3. Cero saltos
    (no H4 sin H3).
14. **Imágenes**: ninguna obligatoria. Si se agrega alguna
    (cover de libro, foto), `alt` obligatorio + `loading="lazy"` +
    `width`/`height`.

## Tests que aplican

- `npm run html-validate` (html-validate config del repo)
- `bash tests/csp-no-unsafe-inline.sh`
- `bash tests/external-links.sh`
- `bash tests/no-placeholders.sh`
- `bash tests/nav-consistency.sh` (footer link presente)
- `bash tests/sitemap-drift.sh`
- `bash tests/seo-meta.sh`
- `bash tests/jsonld-validate.sh`
- `bash tests/now-freshness.sh`
- `node tests/a11y.js` + `pa11y` (URL `/now/`)
- Lighthouse mobile (target ≥ 95 perf, 100 a11y)
