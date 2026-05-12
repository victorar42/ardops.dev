# Contract — CSP canónica del sitio (post-spec 009)

**Spec**: [../spec.md](../spec.md) · **FRs**: FR-001, FR-002, FR-013, FR-014

## CSP literal exigida

Todas las páginas HTML servidas (excepto `404.html` que puede tener
una versión equivalente) deben emitir:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests">
```

## Directivas — invariantes

| Directiva | Valor exigido | Permitido extender |
|---|---|---|
| `default-src` | `'self'` | No |
| `script-src` | `'self'` | Sí, solo con `'sha256-XXX'` (no `'unsafe-inline'`) |
| `style-src` | `'self'` | Sí, solo con `'sha256-XXX'` (no `'unsafe-inline'`) |
| `font-src` | `'self'` | No |
| `img-src` | `'self' data:` | No |
| `connect-src` | `'self'` | No |
| `object-src` | `'none'` | No |
| `base-uri` | `'self'` | No |
| `form-action` | `'self'` | No |
| `frame-ancestors` | `'none'` | No |
| `upgrade-insecure-requests` | (presente, sin valor) | N/A |

## Tokens prohibidos en cualquier directiva

- `'unsafe-inline'`
- `'unsafe-eval'`
- `*` (wildcard)
- Hosts externos no listados arriba

## Excepciones

- **Hashes `'sha256-...'`**: permitidos en `script-src` o `style-src`
  si una spec futura lo justifica explícitamente. La spec debe
  documentar el contenido exacto que el hash cubre y un proceso de
  rotación.

## Variantes por página

**Ninguna**. Todas las páginas servidas emiten exactamente la misma
CSP. Esto simplifica audit y reduce drift.

## Mecanismo de emisión

| Página | Fuente del literal |
|---|---|
| `index.html` | Hardcoded en `<head>` |
| `404.html` | Hardcoded en `<head>` |
| `talks/index.html` | Hardcoded en `<head>` |
| `blog/index.html` | Constante `CSP` en `scripts/build-blog.js` |
| `blog/<slug>.html` | Constante `CSP` en `scripts/build-blog.js` |
| `interviews/index.html` | Constante `CSP` en `scripts/build-interviews.js` |
| `interviews/<slug>.html` | Constante `CSP` en `scripts/build-interviews.js` |

**Las constantes `CSP` en ambos generadores y los literales hardcoded
en las 3 páginas estáticas DEBEN ser byte-equivalentes.** El gate
de CSP las valida a todas con la misma regla; el editor humano debe
mantenerlas sincronizadas (o una spec futura las consolida vía
`scripts/lib/head.js`).

## Validación

[csp-gate.md](csp-gate.md).
