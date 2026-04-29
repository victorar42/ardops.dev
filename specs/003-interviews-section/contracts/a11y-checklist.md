# Contract — Accessibility Checklist (normativo)

**Feature**: 003-interviews-section  
**Estándar**: WCAG 2.1 AA  
**Verificación**: `node tests/a11y.js` (axe-core via puppeteer) sobre `/interviews/` y al menos una URL `/interviews/<slug>.html`.

---

## Listado (índice)

### Estructura

- [ ] **A-01** Único `<h1>` = "Entrevistas".
- [ ] **A-02** Skip link `<a class="skip-link" href="#main">Saltar al contenido</a>` como primer elemento del `<body>`, visible en focus.
- [ ] **A-03** `<main id="main">` envuelve el contenido principal.
- [ ] **A-04** `<header class="site-header">` con `<nav>` que incluye "Entrevistas" marcado `aria-current="page"`.
- [ ] **A-05** Cards usan `<h2>` para los títulos. Jerarquía continua h1→h2.

### Controles de búsqueda y filtros

- [ ] **A-06** Input de búsqueda con `<label>` (puede ser `visually-hidden`) y `placeholder` adicional.
- [ ] **A-07** Grupo de chips con `role="group"` y `aria-label="Filtrar por tema"`.
- [ ] **A-08** Cada chip es `<button type="button">` con `aria-pressed="true|false"`.
- [ ] **A-09** Contador de resultados con `aria-live="polite"` y `aria-atomic="true"`.
- [ ] **A-10** Botón "Limpiar filtros" visible cuando hay filtros activos; oculto en vacío.

### Teclado

- [ ] **A-11** Tab order lógico: skip-link → nav → search input → chips → clear → cards.
- [ ] **A-12** Espacio/Enter activan chips.
- [ ] **A-13** Enter en input no recarga (sin form submit).
- [ ] **A-14** Foco visible en todos los elementos interactivos (heredado de `base.css`).

### Mensajes

- [ ] **A-15** `<noscript>` informa que JS es necesario para búsqueda; las URLs individuales son accesibles directo.
- [ ] **A-16** Estado vacío (`0 resultados`) tiene mensaje claro y `aria-live` notifica el cambio.

### Color y contraste

- [ ] **A-17** Texto sobre fondo: ratio ≥ 4.5:1 (cuerpo) y ≥ 3:1 (heading ≥ 18pt). Tokens existentes ya cumplen.
- [ ] **A-18** Chips activos vs inactivos distinguibles por más que solo color (border + fondo + `aria-pressed`).
- [ ] **A-19** Foco visible con outline ≥ 2px y contraste ≥ 3:1 contra el background.

### Movimiento

- [ ] **A-20** Sin animaciones forzadas. Cualquier transición respeta `prefers-reduced-motion: reduce`.

---

## Página individual de entrevista

### Estructura

- [ ] **B-01** Único `<h1>` = título de la entrevista.
- [ ] **B-02** `<article aria-labelledby="interview-title">`.
- [ ] **B-03** Body de la entrevista usa `<h2>`/`<h3>` (no `<h1>`).
- [ ] **B-04** Skip link y `<main id="main">` presentes.
- [ ] **B-05** Link "← Entrevistas" visible al inicio y al final del artículo.

### Imágenes

- [ ] **B-06** Foto del entrevistado: `<img alt="Foto de {name}">`. Alt no vacío.
- [ ] **B-07** Avatar fallback SVG: `role="img"` + `aria-label="Avatar de {name}"`.
- [ ] **B-08** Imágenes con `width` y `height` explícitos para evitar CLS.
- [ ] **B-09** `loading="lazy"` en imágenes below-the-fold.

### Metadata visible

- [ ] **B-10** `<time datetime="YYYY-MM-DD">` con texto humano.
- [ ] **B-11** Tags como links a `/interviews/?tag=<tag>` (con discriminador visual `#`).
- [ ] **B-12** Reading time visible.

### Cuerpo

- [ ] **B-13** Listas usan `<ul>`/`<ol>` semánticos.
- [ ] **B-14** Code blocks usan `<pre><code>` con clase para highlighting (post-spec).
- [ ] **B-15** Links externos `rel="noopener noreferrer"`.
- [ ] **B-16** Headings dentro del cuerpo no saltan jerarquía (h2 → h3, no h2 → h4).

### Teclado y foco

- [ ] **B-17** Foco visible en todos los links.
- [ ] **B-18** Tab order: skip → nav → eyebrow link → linkedin (si existe) → tags → links del cuerpo → footer link.

---

## Tests automatizados

### Extensión de `tests/a11y.js`

Agregar a la lista de URLs:

```js
const urls = [
  'http://localhost:3000/',
  'http://localhost:3000/talks/',
  'http://localhost:3000/blog/',
  'http://localhost:3000/404.html',
  'http://localhost:3000/interviews/',                 // ← nuevo
  'http://localhost:3000/interviews/<smoke-slug>.html', // ← nuevo (fixture o entrevista real)
];
```

Ejecuta axe-core con tags `wcag2a`, `wcag2aa`, `wcag21aa`. Falla en cualquier violation.

### `html-validate`

Configurar para incluir `_site/interviews/**/*.html`. Reglas existentes (`aria-label-misuse`, `heading-level`, etc.) aplican.

---

## Manual QA antes de release

| Acción | Resultado esperado |
|---|---|
| Tab desde la URL del listado | Skip link aparece, foco visible |
| Activar skip link | Foco salta al contenido principal |
| Tipear en buscador | Resultados filtran sin recarga; aria-live anuncia "X entrevistas" |
| Click chip de tag | `aria-pressed="true"`; resultados filtran |
| Click chip activo otra vez | `aria-pressed="false"`; filtro se quita |
| Sin resultados | Mensaje claro; aria-live anuncia "0 entrevistas" |
| Navegar a entrevista individual | Foco en `<h1>` o salto natural; back funciona |
| Sin JS habilitado | Listado muestra mensaje noscript; las URLs individuales siguen funcionando |
| Lector de pantalla (VoiceOver) | Anuncia título, autor, fecha, duración, tags |
| `prefers-reduced-motion` | Sin animaciones perceptibles |
| Zoom 200% | Layout no rompe; sin scroll horizontal |
