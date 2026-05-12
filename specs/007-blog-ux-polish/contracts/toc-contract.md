# Contract: TOC (Table of Contents) HTML

## Cuándo se renderiza

- Solo se renderiza si el post tiene **≥ 3 encabezados `<h2>`** en el cuerpo (post-sanitización).
- Si la condición no se cumple, ni el `<aside>` ni el `<details>` se emiten.

## Estructura HTML emitida

Dentro de la página de post individual, el bloque TOC se inserta dos veces (una para desktop como aside sticky, otra para mobile como `<details>`); ambos comparten contenido. CSS decide la visibilidad por viewport.

```html
<aside class="post-toc post-toc--aside" aria-label="Tabla de contenidos">
  <p class="post-toc-label">En este post</p>
  <ol class="post-toc-list">
    <li class="post-toc-item post-toc-item--h2">
      <a href="#decision-001-filtros">Decisión 001: filtros</a>
    </li>
    <li class="post-toc-item post-toc-item--h3">
      <a href="#por-que-css-only">¿Por qué CSS-only?</a>
    </li>
    <!-- … -->
  </ol>
</aside>

<details class="post-toc post-toc--mobile">
  <summary>En este post</summary>
  <ol class="post-toc-list">
    <li class="post-toc-item post-toc-item--h2"><a href="#…">…</a></li>
  </ol>
</details>
```

## IDs sobre los headings

- Cada `<h2>`/`<h3>` recibe un atributo `id` derivado de su texto:
  - Lowercase ASCII.
  - Reemplazar caracteres no `[a-z0-9]` por `-`.
  - Colapsar guiones consecutivos.
  - Recortar guiones iniciales/finales.
  - Si el id resultante ya existe en el documento, sufijar `-2`, `-3`, etc.
- El `<h1>` (título del post) **no** recibe id especial generado por TOC (mantiene su id si la plantilla ya lo asigna).
- Los `<h4>`/`<h5>`/`<h6>` reciben id (mismas reglas) pero **no** aparecen en el `<nav class="post-toc">`.

## Comportamiento por viewport

- `≥ 1024px`: `aside.post-toc--aside` visible con `position: sticky; top: <header-offset>`. `details.post-toc--mobile` oculto con `display: none`.
- `< 1024px`: `aside.post-toc--aside` oculto. `details.post-toc--mobile` visible; cerrado por defecto.

## Accesibilidad

- `aside aria-label="Tabla de contenidos"`.
- `details > summary` legible y clickeable; estado abierto/cerrado expuesto nativamente.
- Los enlaces son `<a href="#id">`, navegables por teclado.
- Focus visible sobre los `<a>`.

## Determinismo

Para el mismo post, dos corridas consecutivas del build producen los mismos IDs y el mismo orden en la TOC. La estabilidad del orden está garantizada por recorrer el árbol DOM en orden documental.
