# Contract — `tests/no-cookies.sh`

## Propósito

Detectar el literal `document.cookie` en cualquier archivo `.js` servido
del sitio. Fallar el build si hay coincidencias.

## Entradas

| Input | Origen | Validación |
|---|---|---|
| Árbol del repo | filesystem | `find` debe ejecutar sin error |

## Configuración (env vars)

| Variable | Default | Propósito |
|---|---|---|
| `NC_ROOT` | `.` | raíz del barrido |

## Algoritmo

1. Construir lista de archivos:

   ```bash
   find "$NC_ROOT" -type f -name "*.js" \
     -not -path "./.git/*" \
     -not -path "./node_modules/*" \
     -not -path "./.specify/*" \
     -not -path "./specs/*" \
     -not -path "./docs/*" \
     -not -path "./backlog/*" \
     -not -path "./.reference/*" \
     -not -path "./tests/*" \
     -not -path "./legacy/*" \
     -not -path "./scripts/*" \
     -not -path "./.github/*"
   ```

2. Si la lista está vacía, exit 2 (no hay JS servido — estado anómalo).
3. Por cada archivo, ejecutar `grep -nF "document.cookie" <file>`. Si
   produce líneas, agregarlas a violations.
4. Si `violations.length > 0`:
   - Imprimir `path:line:document.cookie` por cada match.
   - Imprimir resumen `✗ no-cookies gate: K violation(s) across L file(s)`.
   - Exit 1.
5. Si `violations.length == 0`:
   - Imprimir `✓ no-cookies gate (N files scanned)`.
   - Exit 0.

## Salida

- **stdout**: matches + resumen.
- **stderr**: solo en exit 2.
- **exit code**: 0 / 1 / 2.

## Performance

- ≤ 1 segundo en el repo actual (≤ 5 archivos `.js` servidos).

## Edge cases

- **`document.cookie` dentro de un comentario**: cuenta como violation.
  Si se necesita comentar al respecto, hacerlo sin el literal exacto
  (e.g. "document . cookie" o "doc-cookie").
- **`document.cookie` dentro de un string en HTML**: este gate no
  inspecciona `.html`; sin embargo, `tests/no-trackers.sh` no lo cubre
  tampoco. Si se necesita en el futuro, ampliar el scope con otra spec.
- **Builders en `scripts/`**: excluidos. Si un builder emite
  `document.cookie` al HTML servido, el gate lo detectará en el archivo
  final servido (aunque no esté en `.js`, sería en `.html`; ese caso
  requiere una iteración futura).

## Verificación local

```bash
# Pasa: cero coincidencias
bash tests/no-cookies.sh

# Falla intencionalmente:
echo 'document.cookie = "x=y";' >> assets/js/main.js
bash tests/no-cookies.sh   # exit 1, debe imprimir assets/js/main.js:<line>:document.cookie
git checkout -- assets/js/main.js
```
