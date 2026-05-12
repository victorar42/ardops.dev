# Contract — Gate `tests/external-links.sh`

**Spec**: [../spec.md](../spec.md) · **FRs**: FR-007, FR-008, FR-016

## Propósito

Asegurar que todo `<a target="_blank">` que apunta a un dominio
externo incluye `rel="noopener noreferrer"`, evitando tabnabbing y
filtración de referrer en navegación cross-origin.

## Implementación

- Wrapper bash: `tests/external-links.sh`
- Logic: `scripts/check-external-links.js` (Node + jsdom).

## Páginas validadas

Todo `*.html` servido (mismo set que CSP gate). Excluidos:
`legacy/`, `node_modules/`, `specs/`, `.reference/`.

## Clasificación de un `<a>` como "externo"

Para cada `<a>` con atributo `target="_blank"`:

1. Tomar `href`.
2. Resolver con base `https://ardops.dev/` (para soportar paths
   relativos).
3. **Externo** sii:
   - `protocol === 'http:'` o `protocol === 'https:'`
   - AND `host !== 'ardops.dev'`
   - AND `host !== ''`

`mailto:`, `tel:`, fragments (`#foo`), paths relativos, paths
absolutos del mismo origen → NO externo, ignorados por el gate.

## Validaciones (V-N)

### V-1 — `rel` presente

Para cada `<a target="_blank">` clasificado como externo:

- Debe tener atributo `rel`.

**Falla si**: atributo ausente.

### V-2 — `rel` contiene `noopener` y `noreferrer`

Tokenizar `rel` (split por whitespace, lowercase). Debe contener:

- `noopener`
- `noreferrer`

Ambos son obligatorios. Otros tokens (`external`, `nofollow`,
`bookmark`) son permitidos.

**Falla si**: cualquiera de los dos tokens falta.

## Output

### Éxito (exit 0)

```
✓ External-links gate: 14 external link(s) validated, all pass.
```

### Fallo (exit 1)

```
✗ External-links gate: 2 violation(s) detected.

  index.html (line 318):
    <a target="_blank" href="https://github.com/...">
    - V-1: missing rel attribute
    - Fix: add rel="noopener noreferrer"

  blog/foo.html (line 42):
    <a target="_blank" href="https://example.com" rel="noopener">
    - V-2: rel missing 'noreferrer' token
    - Fix: rel="noopener noreferrer"
```

## Comportamiento en CI

- Bloqueante.
- Tiempo de ejecución esperado: < 2s.

## Casos cubiertos

| Caso | Esperado |
|---|---|
| `<a href="https://github.com/x" target="_blank" rel="noopener noreferrer">` | PASS |
| `<a href="https://github.com/x" target="_blank" rel="noopener">` | FAIL V-2 |
| `<a href="https://github.com/x" target="_blank">` | FAIL V-1 |
| `<a href="https://github.com/x" target="_blank" rel="external noopener noreferrer">` | PASS |
| `<a href="https://github.com/x">` (sin `target`) | IGNORADO |
| `<a href="/blog/" target="_blank" rel="noopener noreferrer">` | IGNORADO (mismo origen) |
| `<a href="https://ardops.dev/foo" target="_blank">` | IGNORADO (mismo origen) |
| `<a href="mailto:hi@x.com" target="_blank">` | IGNORADO (no http/https) |
| `<a href="#section" target="_blank">` | IGNORADO (fragment) |

## Cómo extender

Agregar nuevos tokens obligatorios o nuevas reglas: editar
`REQUIRED_REL_TOKENS` en `scripts/check-external-links.js` y
actualizar este contrato.
