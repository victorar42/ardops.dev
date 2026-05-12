# Contract — CSP Policy (post pages + /blog/ index)

**Feature**: 006-blog-section
**Status**: Normative

GitHub Pages no permite headers HTTP custom (constitución XI), por lo que la política CSP se expresa vía `<meta http-equiv="Content-Security-Policy">` en cada HTML emitido. Este contrato fija el valor exacto que `scripts/build-blog.js` MUST inyectar en `blog/index.html` y en cada `blog/<slug>.html`.

El landing (`index.html`) ya tiene su propia CSP gestionada manualmente; este contrato no la altera.

---

## 1. Valor exacto de la meta CSP

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests">
```

### Directivas y rationale

| Directiva | Valor | Razón |
|---|---|---|
| `default-src` | `'self'` | Fallback restrictivo. Todo recurso desde el propio origen. |
| `script-src` | `'self'` | Sin `'unsafe-inline'`, sin `'unsafe-eval'`, sin CDNs. El blog no carga JS adicional. |
| `style-src` | `'self' 'unsafe-inline'` | `'unsafe-inline'` es necesario para el bloque CSS crítico declarado en `<head>` del landing y por consistencia con el resto del sitio. Las páginas de blog no usan inline `<style>`, pero la directiva se mantiene para no romper consumidores que copian la estructura. |
| `img-src` | `'self' data:` | `data:` permitido para SVGs decorativos pequeños inline (no usados en posts hoy, pero futuro-compatible). |
| `font-src` | `'self'` | Fonts self-hosted (constitución V). |
| `connect-src` | `'self'` | El blog no hace `fetch`. Strict. |
| `object-src` | `'none'` | Bloquea `<object>`, `<embed>`. |
| `base-uri` | `'self'` | Bloquea inyección de `<base>`. |
| `form-action` | `'self'` | Bloquea POST exfiltration. |
| `frame-ancestors` | `'none'` | Anti-clickjacking. Equivalente a `X-Frame-Options: DENY`. |
| `upgrade-insecure-requests` | (presente) | Fuerza `https://` en cualquier request mixta. |

## 2. Comparación con la CSP de interviews (spec 003)

Idéntica. Reusar el mismo valor garantiza consistencia entre páginas hijas del sitio. Si en una iteración futura se relaja (ej. para añadir analytics), la decisión MUST documentarse en una nueva spec con bump de versión.

## 3. Dónde se inyecta

- `blog/index.html` → en el `<head>`, después de `<meta charset>` y `<meta viewport>`, antes de cualquier `<link>`.
- Cada `blog/<slug>.html` → mismo lugar.
- `index.html` (landing) → sin cambios; mantiene su CSP actual.

## 4. Verificación

- Inspección manual: `grep -l 'Content-Security-Policy' blog/*.html` debe listar todos los HTML emitidos.
- Tests futuros (no parte de v1): `tests/csp-validate.sh` que parsee la meta y verifique que coincide byte-a-byte. Postpuesto.
