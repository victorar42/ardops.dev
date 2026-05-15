# Contract: OG manifest + drift detection

**Feature**: 017-og-images-dynamic

Formato exacto y reglas de invalidación de `public/og/blog/manifest.json`.

---

## Formato

```json
{
  "version": 1,
  "templateVersion": "v1",
  "entries": {
    "<slug>": {
      "hash": "<64 hex chars>",
      "title": "<title>",
      "tags": ["<tag>", "..."]
    }
  }
}
```

### Reglas de serialización (reproducibilidad)

- `JSON.stringify(obj, null, 2)` + trailing `'\n'`.
- Claves top-level en orden: `version`, `templateVersion`, `entries`.
- `entries` con claves ordenadas alfabéticamente por slug (ascendente,
  comparación por code points).
- Cada entry con claves en orden fijo: `hash`, `title`, `tags`.
- `tags` preservan el orden del frontmatter (NO se ordenan al persistir).

---

## Algoritmo del hash

```js
const crypto = require('crypto');

function computeHash({ title, tags, templateVersion }) {
  const sortedTags = [...tags].sort().join(',');
  const payload = `${templateVersion}\n${title}\n${sortedTags}\n`;
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}
```

- Tags **se ordenan solo para el cálculo del hash** (de modo que
  reordenar el array en el frontmatter no causa drift falso).
- El payload usa `\n` literal (no `\r\n`).

---

## Drift reasons (output de --check)

| Reason | Condición |
|---|---|
| `missing-png` | manifest tiene la entry; el archivo PNG en disco no existe. |
| `hash-mismatch` | manifest.entry.hash !== computeHash(post actual). |
| `orphan-entry` | manifest tiene entry para un slug que ya no es un post publicado. |
| `orphan-png` | existe archivo `public/og/blog/<slug>.png` sin entry en manifest. |
| `new-post-no-entry` | post publicado existe; el manifest no tiene entry. |
| `template-version-mismatch` | `manifest.templateVersion !== OG_TEMPLATE_VERSION`. |

Formato de salida (una línea por slug ofensor, prefijo `[og-drift]`):

```text
[og-drift] pipeline-seguridad-spec-driven: hash-mismatch (expected 9f86…, found a1b2…)
[og-drift] template-version-mismatch: manifest=v1 builder=v2 (regenerate-all)
```

Exit code `2` si cualquier drift reason aparece; `0` si limpio.

---

## Gate integration

`tests/og-drift.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
node scripts/build-og.js --check
```

Se invoca desde `npm test` (vía `tests/run-local.sh` o equivalente).
