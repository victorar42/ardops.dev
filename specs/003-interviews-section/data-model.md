# Phase 1 — Data Model: Sección de Entrevistas

**Feature**: 003-interviews-section  
**Date**: 2026-04-28

Esta feature procesa archivos como datos. Aunque no hay base de datos, modelamos formalmente las entidades del frontmatter, los campos derivados, y la estructura del JSON emitido — para que la validación, los tests y los contratos de CI sean inequívocos.

---

## Entidad: `Interview`

Una entrevista individual. Existe físicamente como archivo `content/interviews/<filename>.md` con frontmatter YAML + cuerpo Markdown.

| Atributo | Origen | Tipo | Requerido | Descripción |
|---|---|---|---|---|
| `slug` | derivado del filename | `string` matching `^[a-z0-9-]{1,80}$` | sí | URL slug. Ver R-005. |
| `title` | frontmatter | `string` no vacío, ≤ 120 chars | sí | Título del artículo. |
| `interviewee` | frontmatter | objeto (ver `Interviewee`) | sí | Datos del entrevistado. |
| `date` | frontmatter | ISO date `YYYY-MM-DD` | sí | Fecha de publicación o de la entrevista. |
| `tags` | frontmatter | `string[]`, longitud 1–10, cada tag matching `^[a-z0-9-]{1,32}$` | sí | Etiquetas temáticas. |
| `summary` | frontmatter | `string` 20–280 chars | sí | Resumen para `<meta description>` y para el listado. |
| `published` | frontmatter | `boolean` | sí | Si `false`, la entrevista NO se emite. |
| `readingTime` | derivado en build | `integer ≥ 1` | sí (siempre derivado) | Minutos. Calculado según R-007. |
| `bodyHtml` | derivado en build | `string` (HTML sanitizado) | sí (siempre derivado) | Cuerpo MD → HTML pasado por marked + DOMPurify. |
| `wordCount` | derivado en build | `integer` | no | Conteo de palabras del cuerpo (informativo, no se sirve). |

### Reglas de validación

El script `build-interviews.js --strict` falla con error claro (filename + campo + razón) cuando:

- Algún campo requerido está ausente o es `null`.
- `slug` no matchea el regex (se deriva del filename; si el filename viola la convención, el archivo se rechaza).
- `title` es vacío o > 120 chars.
- `date` no es parseable como `YYYY-MM-DD`.
- `tags` está vacío, tiene > 10 elementos, o algún tag viola el regex.
- `summary` < 20 chars o > 280 chars.
- `published` no es `true`/`false`.
- `interviewee.name` / `interviewee.role` / `interviewee.company` ausentes o vacíos.
- `interviewee.image`, si está presente, apunta a una ruta inexistente.
- `interviewee.linkedin`, si está presente, no es URL `https://`.

### Reglas de filtrado para el sitio publicado

- Si `published === false` → la entrevista se ignora completamente (no HTML, no entry en `index.json`, no copia de imagen).
- Archivos en `__fixtures__/` se ignoran salvo que el script reciba `--include-fixtures` (solo en jobs específicos de CI).

---

## Entidad: `Interviewee`

Embebida en `Interview.interviewee`. No tiene identidad independiente.

| Atributo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | `string` no vacío, ≤ 80 chars | sí | Nombre completo. |
| `role` | `string` no vacío, ≤ 80 chars | sí | Cargo/rol. |
| `company` | `string` no vacío, ≤ 80 chars | sí | Empresa. |
| `image` | `string` (ruta relativa) | no | Ruta a archivo bajo `content/interviews/images/`. Validada que exista en filesystem en build time. |
| `linkedin` | `string` URL `https://` | no | Perfil opcional. Renderizado como link en el HTML individual. |

---

## Entidad: `Tag`

No es una entidad almacenada; es un valor normalizado.

- Formato: `^[a-z0-9-]{1,32}$`.
- Normalización: lowercase. Sin acentos (NFD strip). El script convierte automáticamente y, si el resultado difiere del input original, emite warning (sugiriendo al autor usar la forma normalizada en el frontmatter).
- Conjunto efectivo de tags = unión de todos los `tags[]` de entrevistas con `published: true`.
- Lista mostrada en el filtro de la UI: ordenada por frecuencia descendente, hasta 20 tags más usados (resto accesibles vía búsqueda de texto).

---

## Entidad: `InterviewIndex` (artefacto JSON)

Generado en `_site/interviews/index.json`.

```json
{
  "$schema": "https://ardops.dev/schemas/interviews-index.json",
  "version": 1,
  "generated": "2026-04-28T00:00:00Z",
  "interviews": [
    {
      "slug": "string",
      "title": "string",
      "interviewee": {
        "name": "string",
        "role": "string",
        "company": "string",
        "image": "string | null"
      },
      "date": "YYYY-MM-DD",
      "tags": ["string"],
      "summary": "string",
      "readingTime": "integer"
    }
  ]
}
```

Esquema completo y reglas de validación en [contracts/index-json-schema.md](contracts/index-json-schema.md).

### Invariantes del índice

- **I-1**: cada `slug` es único en el array.
- **I-2**: el array está ordenado por `date` descendente.
- **I-3**: el archivo serializado pesa ≤ 100 KB. El gate `tests/interviews-size.sh` lo verifica.
- **I-4**: ningún campo contiene HTML; todos son strings plain o estructuras estándar. La búsqueda client-side no necesita HTML del cuerpo.
- **I-5**: el JSON es válido UTF-8, generado con `JSON.stringify(obj, null, 0)` (sin pretty-print en producción para minimizar tamaño).

---

## Entidad: `BuildResult` (interno)

Estructura conceptual que produce `build-interviews.js`. No se serializa, pero se documenta para tests.

```text
BuildResult {
  inputFiles:    string[]                  // todos los .md leídos
  publishedSlugs: string[]                 // slugs emitidos
  skippedSlugs:   string[]                 // archivos con published:false
  errors:         { file, field, msg }[]   // errores de validación
  warnings:       { file, msg }[]          // tags no normalizados, etc.
  artifacts: {
    htmlFiles:    string[]                 // rutas relativas en _site/interviews/
    indexJson:    string                   // ruta de index.json
    indexHtml:    string                   // ruta de index.html (listado)
    images:       string[]                 // imágenes copiadas a _site/interviews/images/
  }
}
```

Si `errors.length > 0` y se ejecutó con `--strict`, el script termina con exit code 1 y reporta cada error en stderr.

---

## Transiciones de estado

Una entrevista pasa por:

```
[draft.md (filesystem)]
        │
        ▼ (build-interviews.js)
[validated]──(published:false)──▶ [skipped, no artifact]
        │
        ▼ (published:true)
[emitted: html + index entry + image copy]
        │
        ▼ (rsync → _site/interviews/)
[deployed via Pages]
```

Cambiar `published: true` → `false` en un commit posterior remueve los artefactos en el siguiente build (el Pages redeploy reemplaza completamente el sitio anterior). No hay redirección 301 automática; la URL anterior retorna 404. Documentado en spec edge cases.

---

## Glosario rápido

- **Slug**: identificador kebab-case derivado del filename (sin extensión y sin prefijo `YYYY-MM-`). Es la URL.
- **Frontmatter**: bloque YAML al inicio del MD entre `---` líneas.
- **Index entry**: objeto en el array `interviews` del `index.json`.
- **Surface**: cualquier archivo HTML servido (`index.html`, `interviews/index.html`, `interviews/<slug>.html`, etc.) en el sitio publicado.
