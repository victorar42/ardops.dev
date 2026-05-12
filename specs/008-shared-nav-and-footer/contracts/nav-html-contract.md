# Contract — HTML emitido por `renderHeader(currentPath)`

**Spec**: [../spec.md](../spec.md) · **Layout module**: [layout-module.md](layout-module.md)

Forma exacta del string HTML retornado por `renderHeader(currentPath)`.

---

## Plantilla canónica

Para `currentPath === '/blog/'`:

```html
  <a class="skip-link" href="#main">Saltar al contenido</a>

  <header class="site-header">
    <nav class="site-nav" aria-label="Navegación principal">
      <a href="/" class="nav-logo">ardops<span>.dev</span></a>
      <ul class="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/#pipeline">Pipeline</a></li>
        <li><a href="/blog/" aria-current="page">Blog</a></li>
        <li><a href="/interviews/">Entrevistas</a></li>
        <li><a href="/talks/">Charlas</a></li>
        <li><a href="/#contact">Contacto</a></li>
      </ul>
    </nav>
  </header>
```

## Variantes según `currentPath`

| `currentPath` | Item con `aria-current="page"` |
|---|---|
| `/` | `Home` |
| `/blog/` | `Blog` |
| `/interviews/` | `Entrevistas` |
| `/talks/` | `Charlas` |
| `/404` | (ninguno) |
| Cualquier otro | (ninguno) |

## Reglas estructurales (invariantes)

- **R-01**: el primer hijo del shell es siempre el skip link, exactamente
  `<a class="skip-link" href="#main">Saltar al contenido</a>`.
- **R-02**: el `<header>` tiene siempre `class="site-header"`, sin
  atributos adicionales.
- **R-03**: el `<nav>` lleva `class="site-nav"` y
  `aria-label="Navegación principal"` (en ese orden).
- **R-04**: el logo es `<a href="/" class="nav-logo">ardops<span>.dev</span></a>`.
  `href` siempre `/`. La estructura interna `ardops<span>.dev</span>` es
  obligatoria para el styling existente.
- **R-05**: la lista de items es `<ul class="nav-links">` con un `<li>`
  por item, en el orden definido por el array `NAV`.
- **R-06**: cada item es `<li><a href="{href}"{aria}>{label}</a></li>`
  donde `{aria}` es ` aria-current="page"` o vacío.
- **R-07**: indentación: 2 espacios, consistente con el resto del HTML
  servido. Líneas con `\n` (LF), no CRLF.
- **R-08**: el bloque empieza con dos espacios y un `\n` final que el
  consumidor concatena tal cual.

## Caracteres y escape

- Los `label` se escapan vía función `escapeHTML()` (la misma que ya
  usa `build-blog.js`). Caracteres `<`, `>`, `&`, `"`, `'` se convierten
  a entidades.
- Los `href` se asumen URL-safe (validados al definir `NAV`); no se
  re-encodean.

## Cambios prohibidos sin update del contrato

- Cambiar nombres de clase (`site-header`, `site-nav`, `nav-links`,
  `nav-logo`).
- Cambiar el `aria-label` del `<nav>`.
- Cambiar la estructura interna del logo (`ardops<span>.dev</span>`).
- Cambiar el orden de atributos en una etiqueta (afecta el gate de
  diff parsing aunque sea cosmético).
- Cambiar el texto del skip link.
- Mover el skip link a otro lado del header.

## Cambios permitidos sin update del contrato

- Agregar/quitar/reordenar items del array `NAV` (cambia el contenido,
  no la forma).
- Cambiar el `currentPath` desde el consumidor (afecta solo cuál item
  tiene `aria-current`).

## Tamaño esperado

Para `NAV` con 6 items, el HTML emitido pesa ~600 bytes (sin gzip).
**Cero impacto** sobre el budget de performance (constitución VII).

## Compatibilidad con CSS existente

El HTML emitido es **byte-equivalente** (modulo `aria-current`,
normalización de logo `href`, anchors absolutos) al que hoy aparece en
`blog/index.html` y `interviews/index.html`. El CSS existente
(`assets/css/components.css`, `layout.css`) **no requiere cambios**.

## Referencia visual

La paleta y tipografía del nav están definidas por `.nav-links a`,
`.nav-logo`, `.site-header` en
[../../../assets/css/components.css](../../../assets/css/components.css)
(o `layout.css` según corresponda). Esta spec no las modifica
(constitución II).
