# Render Contract — Sección Blog

**Feature**: 006-blog-section
**Status**: Normative

Define el HTML mínimo y los atributos ARIA que `scripts/build-blog.js` MUST emitir en las **tres** superficies: bloque marker-delimited del landing, página `blog/index.html`, y cada página individual `blog/<slug>.html`. Cualquier desvío rompe a11y o validación HTML y debe modificarse vía PR a esta spec.

---

## 1. Bloque del landing (entre markers)

### Marcadores

```html
<!-- blog:start -->
…contenido generado…
<!-- blog:end -->
```

- Los marcadores **MUST** preservarse en cada regeneración.
- Cualquier contenido fuera de los marcadores en `index.html` es responsabilidad del autor humano y NO debe ser tocado por el script.

### Estructura — caso con ≥1 post publicado

```html
<!-- blog:start -->
<section id="blog" class="section" aria-labelledby="blog-heading">
  <p class="section-label">// blog</p>
  <h2 id="blog-heading" class="section-title">Blog</h2>
  <p class="blog-intro">Notas técnicas en primera persona sobre lo que estoy construyendo.</p>

  <ul class="post-list post-list--landing">
    <li>
      <article class="post-card" aria-labelledby="post-<slug>-title">
        <header class="post-card-header">
          <h3 id="post-<slug>-title" class="post-card-title">
            <a href="/blog/<slug>.html">Título del post</a>
          </h3>
          <p class="post-meta">
            <time datetime="2026-05-11" class="post-date">11 May 2026</time>
            <span class="post-meta-sep" aria-hidden="true">·</span>
            <span class="post-reading-time">5 min de lectura</span>
          </p>
        </header>
        <p class="post-summary">Resumen breve del post (20..280 chars).</p>
        <ul class="post-tags">
          <li><span class="post-tag">devsecops</span></li>
          <li><span class="post-tag">github-actions</span></li>
        </ul>
      </article>
    </li>
    <!-- … hasta 3 posts más recientes … -->
  </ul>

  <p class="blog-see-all">
    <a href="/blog/" class="blog-see-all-link">Ver todos los posts →</a>
  </p>
</section>
<!-- blog:end -->
```

### Estructura — caso vacío (cero posts publicados)

```html
<!-- blog:start -->
<section id="blog" class="section" aria-labelledby="blog-heading">
  <p class="section-label">// blog</p>
  <h2 id="blog-heading" class="section-title">Blog</h2>
  <p class="blog-intro">Notas técnicas en primera persona sobre lo que estoy construyendo.</p>
  <p class="post-empty">Aún no hay posts publicados — pronto.</p>
</section>
<!-- blog:end -->
```

- Sin `<ul>`, sin link "Ver todos" (no apunta a contenido).

### Reglas de emisión

- `<section id="blog">` reemplaza completamente `<section id="security-pipeline">` actual.
- `aria-labelledby="blog-heading"` referencia el `<h2 id="blog-heading">` (un solo H2 por sección, sin saltos de jerarquía).
- Cada `<article>` está envuelto en un `<li>` dentro de un `<ul>` semántico.
- `<time datetime="YYYY-MM-DD">` con texto formateado en español ("11 May 2026").
- `<ul class="post-tags">` con cada tag dentro de `<li><span class="post-tag">…</span></li>`. La lista no lleva `aria-label` (html-validate `aria-label-misuse`); los tags son metadato visual, no navegación, y la lista `<ul>` ya es semántica nativa. Los tags **NO** son enlaces (R-016).
- Todo texto user-controlled (`title`, `summary`, tags) escapado con `escapeHTML()` (`&` `<` `>` `"` `'`).
- El link "Ver todos" lleva texto `Ver todos los posts →` y `href="/blog/"` exacto.

### Orden

- Los 3 cards del landing son los **3 más recientes** entre los publicados, ordenados desc por `date`, desempate alfabético por `slug` ascendente.
- Si <3 publicados, se muestran todos los disponibles sin layout roto.

---

## 2. `blog/index.html` (página completa)

### Estructura mínima

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="<CSP estricta — ver csp-policy.md>">
  <title>Blog — ardops.dev</title>
  <meta name="description" content="Notas técnicas en primera persona de Victor Josue Ardón Rojas sobre DevSecOps, automation y arquitectura.">
  <link rel="canonical" href="https://ardops.dev/blog/">
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/layout.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="stylesheet" href="/assets/css/motion.css">
  <!-- favicon, og:tags, etc. consistente con resto del sitio -->
</head>
<body>
  <header><!-- nav idéntico al del landing, con "Blog" → /blog/ --></header>
  <main>
    <section class="section" aria-labelledby="blog-index-heading">
      <p class="section-label">// blog</p>
      <h1 id="blog-index-heading" class="section-title">Blog</h1>
      <p class="blog-intro">Todos los posts, ordenados por fecha.</p>

      <ul class="post-list post-list--index">
        <li><!-- <article class="post-card"> idéntico al del landing pero con <h2> en vez de <h3> --></li>
        <!-- … todos los posts publicados, desc por date … -->
      </ul>
    </section>
  </main>
  <footer><!-- footer idéntico al del landing --></footer>
</body>
</html>
```

### Reglas

- `<h1>` único en la página, dentro del `<section>`. Cards usan `<h2 class="post-card-title">`.
- Si cero posts publicados: `<p class="post-empty">Aún no hay posts publicados. Volvé pronto.</p>` en lugar del `<ul>`.
- Header, nav y footer copian la estructura del landing (mismo HTML literal). El nav tiene "Blog" → `/blog/` (no `#blog`).
- CSP meta exactamente como define [csp-policy.md](./csp-policy.md).

---

## 3. `blog/<slug>.html` (página individual)

### Estructura mínima

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="<CSP estricta — ver csp-policy.md>">
  <title><post.title> — Blog — ardops.dev</title>
  <meta name="description" content="<post.summary>">
  <link rel="canonical" href="https://ardops.dev/blog/<slug>.html">
  <meta property="og:type" content="article">
  <meta property="og:title" content="<post.title>">
  <meta property="og:description" content="<post.summary>">
  <meta property="og:url" content="https://ardops.dev/blog/<slug>.html">
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/layout.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="stylesheet" href="/assets/css/motion.css">
</head>
<body>
  <header><!-- nav idéntico --></header>
  <main>
    <article class="post-article" aria-labelledby="post-title">
      <header class="post-article-header">
        <p class="section-label">// blog</p>
        <h1 id="post-title" class="post-article-title"><post.title></h1>
        <p class="post-meta">
          <time datetime="<post.date>" class="post-date"><post.dateFormatted></time>
          <span class="post-meta-sep" aria-hidden="true">·</span>
          <span class="post-reading-time"><post.readingTime> min de lectura</span>
        </p>
        <ul class="post-tags">
          <li><span class="post-tag"><tag></span></li>
          <!-- … -->
        </ul>
      </header>

      <div class="post-article-body">
        <!-- post.bodyHtml — HTML sanitizado por DOMPurify -->
      </div>

      <footer class="post-article-footer">
        <p><a href="/blog/" class="post-back-link">← Volver al blog</a></p>
      </footer>
    </article>
  </main>
  <footer><!-- footer idéntico --></footer>
</body>
</html>
```

### Reglas

- `<article>` con `aria-labelledby="post-title"` referenciando el único `<h1>` de la página.
- `<time datetime>` obligatorio.
- `bodyHtml` es el resultado de `DOMPurify.sanitize(marked(post.body), config)` + post-proceso de `<a>` (R-015). Inyectado tal cual en `<div class="post-article-body">`.
- Headings dentro del cuerpo (`<h2>`, `<h3>`, …) heredan estilos de `base.css`/`components.css`. NO se altera la jerarquía: `<h1>` solo en el header del article; el cuerpo arranca en `<h2>`.

---

## 4. CSS contract (clases de gancho)

El script NO emite CSS. Los estilos viven en `assets/css/components.css`. Las clases que el CSS DEBE soportar:

**Listings (landing + index):**
- `.post-list`, `.post-list--landing`, `.post-list--index`
- `.post-card`
- `.post-card-header`, `.post-card-title`
- `.post-meta`, `.post-meta-sep`
- `.post-date`, `.post-reading-time`
- `.post-summary`
- `.post-tags`, `.post-tag`
- `.post-empty`
- `.blog-intro`, `.blog-see-all`, `.blog-see-all-link`

**Página individual:**
- `.post-article`, `.post-article-header`, `.post-article-title`, `.post-article-body`, `.post-article-footer`
- `.post-back-link`

**Stat cards inline (reusan clases existentes de #about):**
- `.post-stats` (nuevo wrapper)
- `.stat-card`, `.stat-value`, `.stat-label` (existentes — sin cambios)

**About section (modificación):**
- `.about-portrait` (nuevo: `border-radius: 50%`, dimensiones responsivas, max 256×256 desktop)

**Tokens permitidos** (constitución II): solo `var(--*)` ya definidos en `tokens.css`. Cero colores hardcodeados. Cero fonts nuevas.

---

## 5. Accessibility contract (WCAG 2.1 AA)

| Requisito | Implementación |
|---|---|
| Semántica de sección landing | `<section id="blog" aria-labelledby="blog-heading">` con `<h2>` propio |
| Semántica de página /blog/ | `<section aria-labelledby="blog-index-heading">` con único `<h1>` |
| Semántica de post individual | `<article aria-labelledby="post-title">` con único `<h1>`; cuerpo arranca en `<h2>` |
| Lista identificable | `<ul>` semántica nativa para post-list y post-tags |
| Fechas accesibles | `<time datetime="YYYY-MM-DD">` con texto formateado humano |
| Tags identificables | `<ul>` con `<li><span class="post-tag">…</span></li>`; lista sin `aria-label` (html-validate `aria-label-misuse`); tags no enlazables (R-016) |
| Contraste mínimo 4.5:1 | Verificado por `tests/a11y.js` (axe-core) |
| Foco visible | Heredado de outlines globales en `base.css` |
| Sin saltos de jerarquía | landing: 1 H1 (hero) + H2s por sección; /blog/: 1 H1 + H2s en cards; post: 1 H1 + H2/H3 en cuerpo |
| Foto en #about | `<img alt="…" loading="lazy" decoding="async" width="256" height="256">` con alt no vacío descriptivo |
| Stat cards | Texto siempre presente; `<p class="stat-value">` y `<p class="stat-label">` semánticos |

---

## 6. Validación HTML

`npx html-validate index.html blog/index.html blog/<slug>.html` MUST reportar 0 errores tras la regeneración. Reglas relevantes:
- `id` único en cada documento.
- Atributos válidos en cada elemento.
- `<a>` externos con `rel="noopener noreferrer"` cuando `target="_blank"`.
- `<img>` con `alt` obligatorio.
- `<time>` con `datetime` válido.
- Sin atributos `style`, sin `on*=`.

---

## 7. Sección #about — modificación (FR-019, FR-020)

### HTML emitido (manual, no regenerado por el script)

```html
<section id="about" class="section" aria-labelledby="about-heading">
  <p class="section-label">// about</p>
  <h2 id="about-heading" class="section-title">Sobre mí</h2>

  <div class="about-content">
    <img src="assets/img/josue-256.webp"
         alt="Retrato de Victor Josue Ardón Rojas"
         width="256" height="256"
         loading="lazy" decoding="async"
         class="about-portrait">

    <div class="about-text">
      <!-- bio existente, tal cual spec 004 -->
    </div>

    <ul class="about-stats">
      <li>
        <div class="stat-card">
          <p class="stat-value">17</p>
          <p class="stat-label">Años en desarrollo de software</p>
        </div>
      </li>
      <li>
        <div class="stat-card">
          <p class="stat-value">10</p>
          <p class="stat-label">Años en DevOps</p>
        </div>
      </li>
      <li>
        <div class="stat-card">
          <p class="stat-value">+12</p>
          <p class="stat-label">Clientes (bancos LATAM + corporaciones)</p>
        </div>
      </li>
      <li>
        <div class="stat-card">
          <p class="stat-value">1%</p>
          <p class="stat-label">Mejor cada día</p>
        </div>
      </li>
    </ul>
  </div>
</section>
```

### Reglas

- La sección `#about` NO está entre markers (no la regenera el build script). Es edición manual única para este iterado.
- `<img>` con `width`/`height` explícitos previene CLS.
- `loading="lazy"` aceptable porque la sección está fuera del fold inicial en mobile.
- Las stat cards están dentro de un `<ul class="about-stats">` para semántica de lista.
- Layout responsive: en mobile (<768 px), foto se centra arriba; en desktop, foto a la izquierda y texto a la derecha (decisión del CSS, no del contrato HTML).
