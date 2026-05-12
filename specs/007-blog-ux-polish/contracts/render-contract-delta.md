# Contract: Render delta (spec 007 sobre 006)

Este documento extiende [`specs/006-blog-section/contracts/render-contract.md`](../../006-blog-section/contracts/render-contract.md).

## Página de post individual `/blog/<slug>.html`

### Estructura `<main>`

```html
<main>
  <div class="post-layout">
    <!-- Aside TOC: desktop ≥1024px sticky. Mobile: hidden -->
    <!-- Solo presente si toc.length > 0 (ver toc-contract.md) -->
    <aside class="post-toc post-toc--aside" aria-label="Tabla de contenidos">…</aside>

    <article class="post-article">
      <header class="post-article-header">
        <p class="section-label">// blog</p>
        <h1 class="post-article-title">{title}</h1>
        <p class="post-article-meta">
          <time datetime="{ISO}">{dateFormatted}</time>
          <span class="post-article-meta-sep">·</span>
          <span class="post-reading-time">{N} min de lectura</span>
        </p>
        <ul class="post-tags" role="list">
          <li><a class="post-tag" href="/blog/?tag={tagslug}">{tag}</a></li>
        </ul>
      </header>

      <!-- TOC mobile: viewport <1024px expanded -->
      <details class="post-toc post-toc--mobile">…</details>

      <div class="post-article-body">
        {sanitized html del cuerpo}
      </div>

      <footer class="post-article-footer">
        <ul class="post-tags" role="list">…</ul>
        <p><a class="btn btn-ghost" href="/blog/">← Volver a todos los posts</a></p>
        <aside class="post-share" aria-label="Compartir este post">…</aside>
      </footer>
    </article>
  </div>
</main>
```

### Reglas

- `.post-article` con `max-width` entre 640px y 760px en desktop.
- `.post-article-header` separado del cuerpo con margin-bottom y línea sutil (`border-bottom` color `--border`).
- `.post-tags` aparece dos veces (header + footer), idéntico contenido.
- `.post-article-body` aplica los estilos tipográficos a sus hijos `h2`, `h3`, `p`, `ul`, `ol`, `blockquote`, `code`, `pre`, `table`, `img`.

### Tipografía del cuerpo (resumen — detalle en `components.css`)

| Elemento | Reglas |
|---|---|
| `p` | `line-height: 1.7`, `font-size: 1.05rem`, max-width local del article. |
| `h2` | `font-family: var(--font-mono)`, `font-size: 1.5rem`, `margin-top: 2.5rem`, color `--accent`. |
| `h3` | `font-family: var(--font-mono)`, `font-size: 1.2rem`, color `--text-primary`. |
| `ul`/`ol` | padding-left 1.5rem, line-height 1.7. |
| `code` inline | `background: var(--code-bg)`, padding 0.15em 0.4em, `border-radius: var(--radius-sm)`, `font-family: var(--font-mono)`. |
| `pre > code` | bloque con `background: var(--code-bg)`, `padding: 1rem`, `overflow-x: auto`, `border-left: 2px solid var(--accent)`. |
| `blockquote` | `border-left: 3px solid var(--accent)`, `padding-left: 1rem`, `color: var(--text-secondary)`. |
| `table` | `border-collapse: collapse`, `display: block; overflow-x: auto` en mobile; `<th>` con `background: var(--bg-secondary)`. |
| `img` | `border-radius: var(--radius-md)`, `max-width: 100%`, `height: auto`. |

## Página índice `/blog/index.html`

### Estructura `<main>`

```html
<main>
  <section class="blog-index" aria-labelledby="blog-heading">
    {bloque de filtros + grilla + JSON + script — ver filter-search-contract.md}
  </section>
</main>
```

### Tarjeta `.post-card` (refinada)

```html
<li class="post-card" data-card data-slug="{slug}" data-tags="{tagslugs space-separated}" data-index="{n}">
  <article>
    <!-- opcional: solo si frontmatter.cover existe -->
    <img class="post-card-cover" src="/{cover}" alt="" width="640" height="360" loading="lazy" decoding="async">

    <p class="post-meta">
      <time datetime="{ISO}">{dateFormatted}</time>
      <span class="post-meta-sep">·</span>
      <span>{N} min</span>
    </p>

    <h2 class="post-card-title">
      <a href="/blog/{slug}.html">{title}</a>
    </h2>

    <p class="post-card-summary">{summary}</p>

    <ul class="post-tags" role="list">
      <li><a class="post-tag" href="/blog/?tag={tagslug}">{tag}</a></li>
    </ul>

    <p class="post-card-cta"><a href="/blog/{slug}.html">Leer →</a></p>
  </article>
</li>
```

### Reglas visuales

- Grilla: `display: grid; grid-template-columns: 1fr` mobile, `1fr 1fr` ≥768px, `1fr 1fr 1fr` ≥1200px.
- Card: `border: 1px solid var(--border)`, `padding: 1.5rem`, `border-radius: var(--radius-md)`, `background: var(--bg-card)`.
- Hover: `border-color: var(--accent)`, transform `translateY(-2px)` (omitido si `prefers-reduced-motion: reduce`).
- Cover image: ratio 16:9 (`aspect-ratio: 16/9; object-fit: cover`), full-width de la card.
- Si no hay cover, no se reserva espacio.

## Determinismo (refuerzo)

Ambas plantillas son deterministas: mismos inputs producen byte-idéntico HTML entre builds (orden estable de tags, atributos en orden fijo, sin timestamps en el HTML).

## Tokens nuevos requeridos en `tokens.css`

```css
:root {
  --code-bg: rgba(34, 211, 238, 0.08);              /* derivado de --accent */
  --code-border: rgba(34, 211, 238, 0.25);
  --blockquote-border: var(--accent);
  --toc-bg: var(--bg-secondary);
  --toc-text: var(--text-secondary);
  --chip-active-bg: var(--accent);
  --chip-active-text: var(--bg-primary);
}
```

Estos tokens se agregan **únicamente si no existen ya**. No se introducen colores literales fuera de `tokens.css`.
