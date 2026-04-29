# Contract — `index.json` Schema (normativo)

**Feature**: 003-interviews-section  
**Status**: Normative  
**Output path**: `_site/interviews/index.json` (servido como `https://ardops.dev/interviews/index.json`).

---

## JSON Schema (informal)

```json
{
  "type": "object",
  "required": ["version", "generated", "interviews"],
  "properties": {
    "version":   { "type": "integer", "const": 1 },
    "generated": { "type": "string", "format": "date-time" },
    "interviews": {
      "type": "array",
      "items": { "$ref": "#/$defs/IndexEntry" }
    }
  },
  "$defs": {
    "IndexEntry": {
      "type": "object",
      "required": ["slug", "title", "interviewee", "date", "tags", "summary", "readingTime"],
      "properties": {
        "slug":         { "type": "string", "pattern": "^[a-z0-9-]{1,80}$" },
        "title":        { "type": "string", "minLength": 1, "maxLength": 120 },
        "interviewee":  { "$ref": "#/$defs/Interviewee" },
        "date":         { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
        "tags":         { "type": "array", "items": { "type": "string", "pattern": "^[a-z0-9-]{1,32}$" }, "minItems": 1, "maxItems": 10 },
        "summary":      { "type": "string", "minLength": 20, "maxLength": 280 },
        "readingTime":  { "type": "integer", "minimum": 1 }
      },
      "additionalProperties": false
    },
    "Interviewee": {
      "type": "object",
      "required": ["name", "role", "company"],
      "properties": {
        "name":    { "type": "string" },
        "role":    { "type": "string" },
        "company": { "type": "string" },
        "image":   { "type": ["string", "null"] }
      },
      "additionalProperties": false
    }
  }
}
```

## Ejemplo

```json
{
  "version": 1,
  "generated": "2026-04-28T17:30:00.000Z",
  "interviews": [
    {
      "slug": "jose-alvarez-pernix",
      "title": "Conversación con José Álvarez sobre escalar Pernix",
      "interviewee": {
        "name": "José Álvarez",
        "role": "CTO",
        "company": "Pernix",
        "image": "images/jose-alvarez-pernix.webp"
      },
      "date": "2026-05-15",
      "tags": ["liderazgo", "cto", "arquitectura", "scaling"],
      "summary": "Cómo José estructura equipos de plataforma en Pernix y los aprendizajes técnicos al escalar.",
      "readingTime": 5
    }
  ]
}
```

## Invariantes

| ID | Invariante |
|---|---|
| I-1 | Slugs únicos en el array. |
| I-2 | Array ordenado por `date` descendente. |
| I-3 | Tamaño del archivo serializado ≤ **100 KB**. |
| I-4 | Ningún campo contiene HTML (texto plano). |
| I-5 | Codificación UTF-8, sin BOM. |
| I-6 | `additionalProperties: false` — el script no debe agregar campos no listados. |
| I-7 | `version: 1` permite evolución; cambios de shape requieren bump y migración del consumidor (`assets/js/interviews.js`). |

## Campos prohibidos (explícitos)

- ❌ `bodyHtml` o cualquier representación del cuerpo de la entrevista.
- ❌ `wordCount` (interno, no se sirve).
- ❌ Email del entrevistado.
- ❌ Cualquier dato que no se use en el listado/búsqueda.

Razón: el `index.json` se descarga *en cada visita* del listado. Mantenerlo mínimo respeta el budget de performance y privacidad.

## Verificación en CI

`tests/interviews-size.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SIZE=$(wc -c < _site/interviews/index.json)
LIMIT=$((100 * 1024))
if [ "$SIZE" -gt "$LIMIT" ]; then
  echo "FAIL: index.json size $SIZE bytes exceeds $LIMIT bytes"
  exit 1
fi
echo "OK: index.json size $SIZE bytes (limit $LIMIT)"
```

## Consumidor

`assets/js/interviews.js` carga el archivo con:

```js
const res = await fetch('/interviews/index.json', { credentials: 'omit' });
const { version, interviews } = await res.json();
if (version !== 1) { /* error visible al usuario, no fatal */ }
```

`credentials: 'omit'` y `same-origin` por CSP `connect-src 'self'`.
