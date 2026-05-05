# Render Contract — Sección "Pipeline"

Define el HTML mínimo y los atributos ARIA que el script `scripts/build-pipeline.js` MUST emitir entre los marcadores `<!-- pipeline:start -->` y `<!-- pipeline:end -->` dentro de `index.html`. Cualquier desvío rompe a11y o validación HTML y debe modificarse vía PR a esta spec.

---

## 1. Marcadores

```html
<!-- pipeline:start -->
…contenido generado…
<!-- pipeline:end -->
```

- Los marcadores **MUST** preservarse en cada regeneración (el script los escribe siempre).
- Cualquier contenido fuera de estos marcadores en `index.html` es responsabilidad del autor humano y NO debe ser tocado por el script.

---

## 2. Estructura del fragmento (caso con items)

```html
<!-- pipeline:start -->
<a id="blog" aria-hidden="true" tabindex="-1"></a>
<section id="pipeline" class="section" aria-labelledby="pipeline-heading">
  <p class="section-label">// pipeline</p>
  <h2 id="pipeline-heading" class="section-title">Pipeline</h2>
  <p class="pipeline-intro">Así como un pipeline CI/CD muestra qué hay en cada etapa antes del deploy, esta sección muestra qué hay en preparación antes de la publicación.</p>

  <ul class="pipeline-list">
    <li class="pipeline-item pipeline-item--coming-soon">
      <span class="pipeline-stage" data-stage="coming-soon">
        <svg class="pipeline-stage-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">…</svg>
        <span class="pipeline-stage-label">Pronto</span>
      </span>
      <span class="pipeline-type" data-type="interview">
        <svg class="pipeline-type-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">…</svg>
        <span class="pipeline-type-label">Entrevista</span>
      </span>
      <h3 class="pipeline-item-title">Título del item</h3>
      <p class="pipeline-item-estimated"><span class="pipeline-estimated-label">Estimado:</span> 2026-Q3</p>
      <p class="pipeline-item-description">Descripción breve.</p>
      <p class="pipeline-item-link"><a href="https://…" rel="noopener">Ver teaser →</a></p>
    </li>
    <!-- … más items en orden canónico … -->
  </ul>
</section>
<!-- pipeline:end -->
```

### Reglas de emisión

- `<a id="blog" aria-hidden="true" tabindex="-1"></a>` SIEMPRE va antes del `<section>` (alias legacy, R-005, FR-012).
- `<section id="pipeline">` reemplaza al antiguo `<section id="blog">`.
- `aria-labelledby="pipeline-heading"` referencia el `<h2 id="pipeline-heading">` (un solo H2 en la sección, sin saltos de jerarquía).
- `<ul>` semántico nativo (sin `role="list"` explícito — `html-validate` lo flagea como `no-redundant-role`; los screen readers modernos respetan la semántica de `<ul>` cuando se desestiliza con `list-style: none`).
- Cada `<li class="pipeline-item">` recibe un modificador BEM `pipeline-item--<stage-slug>` (ej. `pipeline-item--coming-soon`).
- Cada `<span class="pipeline-stage">` y `<span class="pipeline-type">` lleva `data-stage="…"` o `data-type="…"` con el slug crudo (útil para CSS y testing).
- Iconos SVG inline (sin sprite externo, constitución VII), siempre `aria-hidden="true"` y `focusable="false"`. La etiqueta de texto adyacente es la accesible.
- Si `estimated` está ausente o vacío en el JSON, el `<p class="pipeline-item-estimated">` **se omite por completo** (no renderizar etiqueta vacía).
- Si `link` está ausente, el `<p class="pipeline-item-link">` **se omite por completo**.
- Cuando `link` está presente y es HTTPS absoluta a otro dominio, agregar `target="_blank" rel="noopener noreferrer"`. Cuando es ruta interna `/…`, no agregar `target`.
- Todo texto user-controlled (`title`, `description`, `estimated`, `link` text) MUST escapar `&`, `<`, `>`, `"`, `'`. El script implementa un `escapeHTML()` mínimo y único.

### Orden canónico (FR-008, R-004, R-007)

Los items se emiten ordenados primero por stage canónico:

1. todos los `coming-soon`
2. todos los `review`
3. todos los `in-progress`
4. todos los `backlog`

Dentro de cada grupo, en el orden de aparición en `pipeline.json`.

---

## 3. Estructura del fragmento (caso vacío `items: []`)

```html
<!-- pipeline:start -->
<a id="blog" aria-hidden="true" tabindex="-1"></a>
<section id="pipeline" class="section" aria-labelledby="pipeline-heading">
  <p class="section-label">// pipeline</p>
  <h2 id="pipeline-heading" class="section-title">Pipeline</h2>
  <p class="pipeline-intro">Así como un pipeline CI/CD muestra qué hay en cada etapa antes del deploy, esta sección muestra qué hay en preparación antes de la publicación.</p>
  <p class="pipeline-empty">El pipeline está vacío por ahora — escribime si querés sugerirme algo.</p>
</section>
<!-- pipeline:end -->
```

- Sin `<ul>`. Solo el párrafo `pipeline-empty`.
- El texto exacto está fijado por R-010 (puede actualizarse vía PR).

---

## 4. CSS contract (clases de gancho)

El script NO emite CSS. Los estilos viven en `assets/css/components.css`. Las clases que el CSS DEBE soportar:

- `.pipeline-list`
- `.pipeline-item`
- `.pipeline-item--coming-soon`, `.pipeline-item--review`, `.pipeline-item--in-progress`, `.pipeline-item--backlog`
- `.pipeline-stage`, `.pipeline-stage-icon`, `.pipeline-stage-label`
- `.pipeline-type`, `.pipeline-type-icon`, `.pipeline-type-label`
- `.pipeline-item-title`, `.pipeline-item-estimated`, `.pipeline-estimated-label`, `.pipeline-item-description`, `.pipeline-item-link`
- `.pipeline-intro`, `.pipeline-empty`

**Tokens permitidos** (constitución II): solo `var(--*)` ya definidos en `tokens.css`. Cero colores hardcodeados.

---

## 5. Accessibility contract (WCAG 2.1 AA)

| Requisito | Implementación |
|---|---|
| Semántica de sección | `<section aria-labelledby="pipeline-heading">` con `<h2>` propio. |
| Lista identificable | `<ul>` semántica nativa (sin `role="list"` explícito por html-validate `no-redundant-role`). |
| Estado distinguible sin color | Texto del badge SIEMPRE presente; icono complementario (FR-005, SC-009). |
| Tipo distinguible sin color | Texto del badge SIEMPRE presente; icono complementario (FR-006). |
| Foco visible | El `<a>` interno hereda los outlines globales de `base.css`. |
| Contraste mínimo 4.5:1 | Verificado por `tests/a11y.js` axe-core. |
| Sin saltos de jerarquía H | El landing tiene 1 H1 (hero) y los H2 por sección; el H2 de Pipeline no rompe ese patrón. |
| Tabulación coherente | El alias `<a id="blog">` lleva `tabindex="-1"` para no aparecer en orden de tab. |

---

## 6. Validación HTML

`npx html-validate index.html` MUST reportar 0 errores tras la regeneración. Reglas relevantes ya activas:
- Atributos válidos en cada elemento.
- `id` único en el documento (`pipeline-heading`, `pipeline`, `blog` — el alias usa el id `blog` como ancla, no como destinatario aria).
- SVGs con `viewBox`, `aria-hidden`, `focusable` correctos.
