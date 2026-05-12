# Contract: `.uses-list` CSS (opcional)

**Feature**: 010-uses-page
**Phase**: 1 (design)

---

## Cuándo se introduce

Sólo si los selectores existentes (`dl`, `dt`, `dd` heredados) no logran:

- Distinguir visualmente el `<dt>` (nombre) del `<dd>` (justificación).
- Espaciado vertical confortable entre items (≈ 0.75-1rem).
- Coherencia con la estética terminal/code-first del sitio.

Si los defaults son suficientes, **no se añade nada** — Principio II
(identidad visual preservada) prefiere cero CSS nuevo.

## Dónde vive

- Archivo: `assets/css/components.css` (al final, con un comentario banner
  `/* uses page — spec 010 */`).
- **No** se crea `assets/css/uses.css`.

## Forma del selector

Sólo variables CSS; cero colores hardcodeados; cero font-family nuevas.
Ejemplo de referencia (la implementación puede ajustar valores dentro de
los tokens existentes):

```css
/* uses page — spec 010 */
.uses-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3, 0.75rem);
  margin: var(--space-4, 1rem) 0;
}

.uses-list dt {
  font-family: var(--font-mono);
  color: var(--accent);
  font-weight: 600;
  margin-top: var(--space-3, 0.75rem);
}

.uses-list dd {
  margin: 0 0 0 var(--space-3, 0.75rem);
  color: var(--text-secondary, var(--text));
  line-height: 1.55;
}

.uses-updated {
  font-family: var(--font-mono);
  color: var(--text-muted, var(--text-secondary, inherit));
  font-size: 0.9rem;
}
```

## Reglas

- Cero `!important`.
- Cero media queries nuevas si no son indispensables (mobile-first heredado
  de `base.css` ya cubre).
- Cero animaciones nuevas (las existentes en `motion.css` no aplican aquí).
- Variables CSS deben **existir previamente en `tokens.css`**. Si no
  existen (`--space-3`, `--text-muted`), se usan fallbacks en el mismo
  `var()` o se reutiliza un token presente.

## Validación

- `npm run html-validate` (no aplica al CSS, pero el HTML debe seguir
  pasando con la clase añadida).
- `node tests/a11y.js` debe seguir reportando 0 violations (contraste).
- `bash tests/csp-no-unsafe-inline.sh` no se ve afectado (la regla está en
  archivo externo).
