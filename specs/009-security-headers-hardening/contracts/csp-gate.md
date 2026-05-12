# Contract — Gate `tests/csp-no-unsafe-inline.sh`

**Spec**: [../spec.md](../spec.md) · **FRs**: FR-001, FR-002, FR-013, FR-014

## Propósito

Validar que toda página HTML servida emite una CSP estricta sin
`'unsafe-inline'` ni `'unsafe-eval'`, y con las directivas mínimas
exigidas.

## Implementación

- Wrapper bash: `tests/csp-no-unsafe-inline.sh`
- Logic: `scripts/check-csp.js` (Node + jsdom).

## Páginas validadas

Todo `*.html` en disco bajo:
- raíz (excepto `legacy/`, `node_modules/`, `specs/`, `.reference/`)
- `blog/`
- `interviews/`
- `talks/`

Concretamente:
```
index.html
404.html
talks/index.html
blog/index.html
blog/<slug>.html (N posts)
interviews/index.html
interviews/<slug>.html (N entrevistas)
```

## Validaciones (V-N)

### V-1 — CSP presente

Cada página debe contener exactamente UN
`<meta http-equiv="Content-Security-Policy" content="...">` en su
`<head>`.

**Falla si**: cero o más de uno.

### V-2 — Tokens prohibidos

El atributo `content` de la CSP **NO** debe contener (búsqueda
case-sensitive de tokens completos, separados por whitespace):

- `'unsafe-inline'`
- `'unsafe-eval'`

**Falla si**: cualquiera de los dos aparece en cualquier directiva.

### V-3 — Directivas mínimas requeridas

La CSP **DEBE** contener todas las siguientes directivas (parseo:
split por `;`, trim, primer token = nombre de directiva):

- `default-src` con valor `'self'` (exacto, no agregar más)
- `script-src` con `'self'` como primer token (puede tener `'sha256-XXX'` adicionales)
- `style-src` con `'self'` como primer token (puede tener `'sha256-XXX'` adicionales)
- `frame-ancestors` con valor `'none'` (exacto)
- `base-uri` con valor `'self'` (exacto)
- `object-src` con valor `'none'` (exacto)
- `form-action` con valor `'self'` (exacto)

**Falla si**: cualquier directiva listada está ausente o no cumple.

## Output

### Éxito (exit 0)

```
✓ CSP gate: 7 page(s) validated, all pass.
```

### Fallo (exit 1)

```
✗ CSP gate: 1 violation(s) detected.

  blog/index.html:
    - V-2: 'unsafe-inline' found in directive style-src
    - V-3: missing required directive `frame-ancestors 'none'`

  Fix:
    - Move inline <style> blocks to external .css files
    - Add the missing directive to scripts/build-blog.js CSP constant
```

## Comportamiento en CI

- Bloqueante: cualquier violación falla el job.
- Tiempo de ejecución esperado: < 2s (jsdom parsea ~10 archivos).

## Falsos positivos / negativos conocidos

- **Falso positivo**: ninguno conocido. Los hashes `'sha256-...'`
  son permitidos por V-3.
- **Falso negativo**: si una página es servida desde GH Pages pero
  no está en disco (e.g., redirect via Pages config), no se
  valida. No aplica al setup actual.

## Cómo extender

Agregar una nueva directiva mínima: editar `REQUIRED_DIRECTIVES` en
`scripts/check-csp.js` y actualizar este contrato.
