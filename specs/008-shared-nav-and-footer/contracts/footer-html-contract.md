# Contract — HTML emitido por `renderFooter()`

**Spec**: [../spec.md](../spec.md) · **Layout module**: [layout-module.md](layout-module.md)

Forma exacta del string HTML retornado por `renderFooter()`.

---

## Plantilla canónica (única)

```html
  <footer class="site-footer">
    <p><span class="footer-mono">ardops.dev</span> · Security as Code · Costa Rica · &copy; <span data-year>2026</span></p>
    <p class="footer-tagline">Built with intention. Deployed with CI/CD.</p>
  </footer>
```

`renderFooter()` no toma parámetros y devuelve **siempre el mismo
string**.

## Reglas estructurales (invariantes)

- **R-01**: una sola raíz `<footer class="site-footer">`.
- **R-02**: dentro hay exactamente dos `<p>`:
  - El primero contiene la línea identificatoria con
    `<span class="footer-mono">ardops.dev</span>`, los separadores
    ` · `, el copyright `&copy; ` y el year en
    `<span data-year>YYYY</span>`.
  - El segundo es `<p class="footer-tagline">Built with intention.
    Deployed with CI/CD.</p>`.
- **R-03**: el separador es ` · ` (espacio, U+00B7 MIDDLE DOT, espacio).
  No usar `&middot;` en el output (consistente con el HTML actual).
- **R-04**: indentación 2 espacios, LF.

## Year

- **R-05**: el año dentro de `<span data-year>` es **literal `2026`**
  (FR-012, D-010 de research.md). No se inyecta dinámicamente.
- **R-06**: el atributo `data-year` se mantiene como marker para
  futura automatización build-time. No se cambia su forma.

## Cambios prohibidos sin update del contrato

- Cambiar nombres de clase (`site-footer`, `footer-mono`, `footer-tagline`).
- Cambiar el separador ` · `.
- Cambiar el tagline.
- Agregar links sociales o columnas (eso es scope de otra spec).
- Quitar el atributo `data-year`.

## Cambios permitidos sin update del contrato

- Actualizar el year literal cuando llegue 2027 (commit puntual).

## Tamaño esperado

~250 bytes (sin gzip). Cero impacto perf.

## Compatibilidad con CSS existente

`assets/css/components.css` (o `layout.css`) ya estiliza
`.site-footer`, `.footer-mono`, `.footer-tagline`. **Sin cambios**
(constitución II).

## Equivalencia con el footer actual

El HTML aquí definido es **byte-equivalente** al footer hoy presente en
`index.html`, `blog/index.html`, `interviews/index.html`,
`talks/index.html`. La spec **no introduce cambios visuales**: solo
consolida la fuente de verdad.
