# Contract: Filtros + búsqueda en `/blog/`

## HTML emitido (orden documental dentro de `<main>`)

```html
<section class="blog-index" aria-labelledby="blog-heading">
  <p class="section-label">// filed under</p>
  <h1 id="blog-heading" class="section-title">Blog</h1>
  <p class="section-lead">Apuntes operativos sobre DevSecOps, pipelines y spec-driven development.</p>

  <!-- A. radios ocultos (uno por tag + "Todos") -->
  <div class="blog-filters-radios" aria-hidden="true">
    <input type="radio" name="blog-tag" id="blog-tag-all" value="" checked>
    <input type="radio" name="blog-tag" id="blog-tag-devops" value="devops">
    <input type="radio" name="blog-tag" id="blog-tag-seguridad" value="seguridad">
    <!-- … un input por tag único -->
  </div>

  <!-- B. UI visible -->
  <div class="blog-filters">
    <ul class="blog-chips" role="list">
      <li><label for="blog-tag-all" class="chip chip--filter">Todos <span class="chip-count">(N)</span></label></li>
      <li><label for="blog-tag-devops" class="chip chip--filter">devops <span class="chip-count">(N)</span></label></li>
      <!-- … -->
    </ul>

    <div class="blog-search" hidden>
      <label for="blog-search-input" class="visually-hidden">Buscar posts</label>
      <input type="search" id="blog-search-input" placeholder="Buscar por título, resumen o tag…" autocomplete="off">
    </div>
  </div>

  <output class="blog-results-count" aria-live="polite" aria-atomic="true"></output>

  <!-- C. grilla -->
  <ol class="post-list" id="blog-post-list">
    <li class="post-card" data-card data-slug="<slug>" data-tags="<tagslug1> <tagslug2>" data-index="0">
      <!-- ↑ data-tags es una lista separada por espacios para que el atributo selector `~=` funcione -->
      <article>
        <!-- opcional: cover -->
        <img class="post-card-cover" src="/assets/img/blog/<slug>.webp" alt="" width="…" height="…" loading="lazy" decoding="async">
        <p class="post-meta"><time datetime="2026-05-11">11 may 2026</time> · <span>5 min</span></p>
        <h2 class="post-card-title"><a href="/blog/<slug>.html"><Title></a></h2>
        <p class="post-card-summary">…</p>
        <ul class="post-tags">…</ul>
        <p class="post-card-cta"><a href="/blog/<slug>.html">Leer →</a></p>
      </article>
    </li>
  </ol>

  <!-- D. estado vacío -->
  <p class="blog-empty" hidden>No encontré nada con eso. Probá otra palabra o limpiá los filtros.</p>
  <button type="button" class="blog-clear-filters" hidden>Limpiar filtros</button>

  <!-- E. índice JSON para JS -->
  <script id="blog-index" type="application/json">
    [{"slug":"…","title":"…","summary":"…","tags":["…"]}]
  </script>
</section>

<!-- F. JS de búsqueda (defer, self-hosted) -->
<script type="module" src="/assets/js/blog-filter.js" defer></script>
```

## CSS — filtro por tag sin JS

```css
/* Radios ocultos, no perceptibles */
.blog-filters-radios { display: none; }

/* Cuando un radio !=all está checked, ocultar tarjetas que no contienen el slug */
.blog-index:has(#blog-tag-devops:checked) .post-card:not([data-tags~="devops"]) {
  display: none;
}
.blog-index:has(#blog-tag-seguridad:checked) .post-card:not([data-tags~="seguridad"]) {
  display: none;
}
/* … una regla por cada tag, emitida en build-time. */

/* Chip activo: el label cuyo radio asociado está checked recibe estilo activo */
.blog-filters-radios input:checked + .blog-filters .chip--filter[for="blog-tag-…"] { /* no funciona por orden DOM */ }
/* Alternativa robusta — emitida en build-time, una regla por tag: */
.blog-index:has(#blog-tag-devops:checked) .chip--filter[for="blog-tag-devops"] {
  background: var(--accent);
  color: var(--bg-primary);
}
```

Las reglas `:has()` se emiten en build-time porque su número crece con la cantidad de tags. El build inyecta este bloque como `<style>` inline al final del bloque de filtros, o lo agrega a `components.css` (decisión de implementación: preferir `components.css` con clases genéricas + un `<style>` mínimo solo para el set específico de tags vigentes).

### Decisión refinada

Emitir un `<style id="blog-tag-rules">` dentro de la página `/blog/index.html` con las N reglas por tag presentes. `components.css` queda libre de reglas por-tag específicas.

## API del módulo JS

`assets/js/blog-filter.js`:

```js
// pseudocódigo
const index = JSON.parse(document.getElementById('blog-index').textContent);
const cards = [...document.querySelectorAll('[data-card]')];
const search = document.getElementById('blog-search-input');
const searchWrap = document.querySelector('.blog-search');
const radios = [...document.querySelectorAll('input[name="blog-tag"]')];
const counter = document.querySelector('.blog-results-count');
const empty = document.querySelector('.blog-empty');
const clearBtn = document.querySelector('.blog-clear-filters');

searchWrap.hidden = false;
clearBtn.hidden = false;

let q = '';
let tag = '';

const apply = debounce(() => {
  let visible = 0;
  for (const card of cards) {
    const slug = card.dataset.slug;
    const post = index.find(p => p.slug === slug);
    const matchesTag = !tag || post.tags.includes(tag);
    const matchesQuery = !q || matches(post, q);
    const ok = matchesTag && matchesQuery;
    card.hidden = !ok;
    if (ok) visible++;
  }
  counter.textContent = `${visible} resultado${visible === 1 ? '' : 's'}`;
  empty.hidden = visible !== 0;
}, 60);

search.addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); apply(); });
radios.forEach(r => r.addEventListener('change', e => { tag = e.target.value; apply(); }));
clearBtn.addEventListener('click', () => {
  search.value = ''; q = '';
  document.getElementById('blog-tag-all').checked = true; tag = '';
  apply();
});

apply();
```

`matches(post, q)` aplica substring case-insensitive sobre `title + summary + tags.join(' ')`. La query se escapa (no se interpreta como regex). Debounce 60 ms.

### Constraints sobre el bundle

- **Tamaño**: < 4 KB minificado.
- **CSP**: cargado desde `/assets/js/blog-filter.js`, cumple `script-src 'self'`.
- **No emit polyfills**: target ES2022, sin transpilación.
- **No external deps**: vanilla.

## Comportamiento sin JS

- Los radios + `:has()` mantienen el filtro por tag funcional.
- `.blog-search` permanece con `hidden`, no se muestra (no hay forma de tipear).
- `.blog-results-count` queda vacío (sin actualización).
- `.blog-empty` queda con `hidden`; si el usuario marca un radio que no tiene posts, las cards se ocultan pero el mensaje no aparece — caso aceptable, no se publican posts sin asignar tags válidos.
- `.blog-clear-filters` permanece con `hidden`.

## Accesibilidad

- Los radios reciben foco con teclado vía flechas (comportamiento nativo).
- Los `<label>` son clickeables y heredan el target del input.
- `aria-live="polite"` sobre `<output>` anuncia el conteo solo cuando JS está activo.
- La caja de búsqueda tiene `label` con `visually-hidden`.
- Focus visible sobre chips y links coincide con el resto del sitio.

## Determinismo

Para los mismos posts publicados, dos corridas consecutivas del build producen:
- El mismo número y orden de radios.
- El mismo `<script id="blog-index">` JSON (campos y orden estables).
- El mismo `<style id="blog-tag-rules">` (orden alfabético por slug de tag).
