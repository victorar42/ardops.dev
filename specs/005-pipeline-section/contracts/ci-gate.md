# CI Gate Contract — `pipeline-build-check`

Define qué verifica la nueva gate del workflow de CI introducida por spec 005, qué señales falla, y qué fixtures negativas debe ejercer.

---

## 1. Job: `pipeline-build-check`

Vive en `.github/workflows/ci.yml`. Corre en cada push y cada PR.

### Steps mínimos

```yaml
pipeline-build-check:
  name: Pipeline build & schema gate (spec 005)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
    - name: Build pipeline (check mode — fails if index.html is out of sync)
      run: node scripts/build-pipeline.js --check
    - name: Negative-fixture gate
      run: bash tests/pipeline-schema.sh
```

### Señales de fallo

| Condición | Exit | Mensaje esperado en stderr |
|---|---|---|
| `content/pipeline.json` no es JSON parseable | 1 | `pipeline-build: invalid JSON: <reason>` |
| Cualquier item tiene campo desconocido | 1 | `pipeline-build: <id>: unexpected field '<x>'` |
| `id` duplicado | 1 | `pipeline-build: duplicate id '<id>'` |
| `type` no en catálogo | 1 | `pipeline-build: <id>: invalid type '<x>'` |
| `stage` no en catálogo | 1 | `pipeline-build: <id>: invalid stage '<x>'` |
| `title` vacío o > 120 chars | 1 | `pipeline-build: <id>: title length out of range` |
| `description` < 10 o > 280 chars | 1 | `pipeline-build: <id>: description length out of range` |
| `link` con esquema no permitido | 1 | `pipeline-build: <id>: invalid link '<x>'` |
| `--check` y el HTML actual de `index.html` difiere del que produciría `pipeline.json` actual | 1 | `pipeline-build: index.html is out of sync — run 'node scripts/build-pipeline.js' and commit.` |

### Modo no-`--check` (CLI normal del autor)

`node scripts/build-pipeline.js` (sin flags) reescribe in-place el bloque entre `<!-- pipeline:start -->` y `<!-- pipeline:end -->` en `index.html`. Imprime una línea de resumen:

```
pipeline-build: ✓ rendered N item(s) in <stage-counts> — index.html updated
```

Si `items: []`, el resumen indica `0 item(s) — empty state rendered`.

### Modo `--check`

- No escribe a disco.
- Re-genera el bloque en memoria.
- Lo compara byte a byte con la sección actualmente entre los marcadores en `index.html`.
- Exit 0 si idéntico, exit 1 si difiere (con un diff acotado en stderr para debugging).

---

## 2. Fixtures negativas (`tests/pipeline-schema.sh`)

El script bash itera sobre los archivos `content/pipeline.fixtures/invalid-*.json`. Para cada uno:

1. Ejecuta `node scripts/build-pipeline.js --input <fixture> --check-only-validation`.
2. Exige exit ≠ 0 (fallo esperado).
3. Imprime una línea OK/FAIL por fixture.

Al final, si todos los fixtures fallaron como debían: exit 0 y resumen `OK: N fixture(s) correctly rejected`. Si alguno pasó (validación silenciosa de un input inválido): exit 1.

### Fixtures requeridas (mínimo)

| Archivo | Defecto | Mensaje esperado |
|---|---|---|
| `invalid-duplicate-id.json` | dos items con mismo `id` | `duplicate id` |
| `invalid-unknown-stage.json` | un item con `stage: "in_progres"` (typo) | `invalid stage` |
| `invalid-missing-title.json` | item sin `title` | `missing required field` |
| `invalid-bad-link.json` | item con `link: "javascript:alert(1)"` | `invalid link` |

Cada fixture es un archivo JSON de mínimo 1–2 items para validar que el rechazo ocurre en el campo correcto, no por otro defecto colateral.

---

## 3. Side-effects esperados en CI

- `pipeline-build-check` corre **en paralelo** con las gates existentes (`a11y`, `html-validate`, `link-check`, `forbidden-urls`, `no-placeholders`, `interviews-*`). No depende de ninguna ni nadie depende de ella.
- Tiempo de ejecución estimado: < 5 segundos.
- No requiere instalar nada (cero `npm install` necesario, el script usa solo stdlib de Node 20).

---

## 4. Política de regeneración

- El autor humano corre `node scripts/build-pipeline.js` localmente al editar `content/pipeline.json` y commitea **ambos** archivos en el mismo commit.
- Si el autor olvida regenerar `index.html`, el `--check` falla en CI con el mensaje "out of sync".
- Si el autor regenera pero no commitea `pipeline.json`, el `--check` también falla porque la salida no coincide con un `pipeline.json` desactualizado.
- Esta política es manual e intencional (R-011): preferimos ruido en PR que magia automática.
