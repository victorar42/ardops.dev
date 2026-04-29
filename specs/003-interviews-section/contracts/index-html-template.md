# Contract — HTML Template: Listado de Entrevistas (normativo)

**Feature**: 003-interviews-section  
**Output path**: `_site/interviews/index.html`  
**URL**: `https://ardops.dev/interviews/`

DOM canónico del índice. Acompañado de `_site/interviews/index.json` (datos) y `assets/js/interviews.js` (lógica de búsqueda/filtro).

---

## Estructura completa

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Entrevistas — ardops.dev</title>
  <meta name="description" content="Conversaciones con profesionales del sector tecnológico: ingeniería, liderazgo, plataforma y aprendizajes de carrera.">

  <meta property="og:type" content="website">
  <meta property="og:title" content="Entrevistas — ardops.dev">
  <meta property="og:description" content="Conversaciones con profesionales del sector tecnológico.">
  <meta property="og:url" content="https://ardops.dev/interviews/">
  <link rel="canonical" href="https://ardops.dev/interviews/">

  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/layout.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="stylesheet" href="/assets/css/motion.css">
  <link rel="stylesheet" href="/assets/css/interviews.css">
</head>
<body>
  <a class="skip-link" href="#main">Saltar al contenido</a>

  <header class="site-header">
    <!-- Mismo header del sitio; item "Entrevistas" con aria-current="page" -->
  </header>

  <main id="main" class="interviews-page">
    <header class="interviews-hero">
      <h1>Entrevistas</h1>
      <p class="interviews-lede">Conversaciones con profesionales del sector tecnológico: ingeniería, liderazgo, plataforma y aprendizajes de carrera.</p>
    </header>

    <section class="interviews-controls" aria-label="Filtros de búsqueda">
      <label class="interviews-search">
        <span class="visually-hidden">Buscar entrevistas</span>
        <input
          type="search"
          id="interviews-search-input"
          name="q"
          placeholder="Buscar por nombre, empresa, tema…"
          autocomplete="off"
          spellcheck="false">
      </label>

      <div class="interviews-tag-filter" role="group" aria-label="Filtrar por tema">
        <!-- Tag chips renderizados por JS desde index.json. Cada chip es <button type="button" aria-pressed="false"> -->
      </div>

      <button type="button" class="interviews-clear" id="interviews-clear-btn" hidden>
        Limpiar filtros
      </button>
    </section>

    <p class="interviews-count" id="interviews-count" aria-live="polite" aria-atomic="true">
      <!-- "12 entrevistas" — actualizado por JS -->
    </p>

    <ul class="interviews-list" id="interviews-list" role="list">
      <!-- Renderizado por JS desde index.json. Estructura por item: -->
      <!--
      <li class="interview-card">
        <a href="/interviews/<slug>.html" class="interview-card-link">
          <img class="interview-card-avatar" src="/interviews/<image>" alt="Foto de <name>" width="56" height="56" loading="lazy">
          <div class="interview-card-content">
            <h2 class="interview-card-title"><span>{title}</span></h2>
            <p class="interview-card-author">{name} · {role} · {company}</p>
            <p class="interview-card-summary">{summary}</p>
            <p class="interview-card-meta">
              <time datetime="{date}">{date_human}</time>
              <span aria-hidden="true"> · </span>
              <span>{readingTime} min</span>
            </p>
            <ul class="interview-card-tags" role="list">
              <li><span class="interview-tag">#{tag}</span></li>
            </ul>
          </div>
        </a>
      </li>
      -->
    </ul>

    <p class="interviews-empty" id="interviews-empty" hidden>
      No encontramos entrevistas que coincidan. Probá con otra búsqueda o quitá filtros.
    </p>

    <noscript>
      <p class="interviews-noscript">
        La búsqueda y el filtrado requieren JavaScript habilitado. Las entrevistas individuales son accesibles directamente desde su URL.
      </p>
    </noscript>
  </main>

  <footer class="site-footer">
    <!-- Footer del sitio -->
  </footer>

  <script src="/assets/js/interviews.js" defer></script>
</body>
</html>
```

---

## Comportamiento esperado del JS

1. Al cargar: `fetch('/interviews/index.json')`.
2. Construir set de tags y renderizar chips ordenados por frecuencia descendente, top 20.
3. Renderizar todos los ítems en `<ul id="interviews-list">` ordenados por `date` desc.
4. Si la URL trae `?tag=<x>`, activa ese chip.
5. Input `oninput` con debounce 80ms → re-aplica filtro.
6. Click en chip → toggle `aria-pressed` y re-aplica filtro.
7. Botón "Limpiar" visible si hay query o tags activos.
8. Actualiza `#interviews-count` con `aria-live="polite"`.
9. Si 0 resultados: mostrar `#interviews-empty`, ocultar `<ul>`.
10. Soporte teclado: enter en input, espacio en chips.

## Reglas semánticas

- **R-01**: un único `<h1>` = "Entrevistas".
- **R-02**: cada card tiene `<h2>` con título.
- **R-03**: `<main>` con skip link.
- **R-04**: `<section aria-label="Filtros de búsqueda">`.
- **R-05**: contador con `aria-live="polite"` y `aria-atomic="true"`.
- **R-06**: chips son `<button>` con `aria-pressed`.
- **R-07**: cards envueltas en `<a>` que cubre toda el área clickeable; tag list dentro de la card NO debe ser interactiva (los tags individuales en cards son spans, no links — para evitar nested links inválidos).
- **R-08**: `noscript` informa al usuario.

## Performance

- HTML inicial: < 8 KB (solo shell + skeleton).
- `index.json`: ≤ 100 KB.
- Render inicial < 100ms en hardware moderno con 20 entrevistas.
- LCP < 2.5s.
