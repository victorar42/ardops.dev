# Phase 1 — Data Model: Blog UX & Visual Polish

## Entities

### Post (extendido desde spec 006)

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | (sin cambio) |
| `slug` | string | yes | (sin cambio) |
| `date` | string (YYYY-MM-DD) | yes | (sin cambio) |
| `summary` | string (20..280) | yes | (sin cambio) |
| `tags` | string[] | yes | (sin cambio) |
| `published` | boolean | yes | (sin cambio) |
| **`cover`** | **string (path)** | **no** | **NUEVO**. Path relativo desde repo root a una imagen (`.webp`/`.png`/`.jpg`/`.jpeg`). Si está presente, build valida que el archivo exista. |

Derivado en build (no en frontmatter):

| Derived field | Type | Notes |
|---|---|---|
| `readingTime` | int (min) | (de spec 006) |
| `dateFormatted` | string | (de spec 006) |
| `toc` | `TocEntry[]` | NUEVO. Lista de headings extraídos del cuerpo. |
| `shareLinks` | `{ mailto, linkedin, x }` | NUEVO. URLs absolutas construidas en build. |
| `tagSlugs` | string[] | NUEVO. Slugified tags para CSS class y URL fragment. |

### TocEntry

| Field | Type | Notes |
|---|---|---|
| `id` | string | slug-ascii único en el documento (sufijo numérico ante colisión). |
| `level` | 2 \| 3 | nivel de heading. |
| `text` | string | texto plano del heading. |

Reglas:

- Se generan TOC entries solo si `h2.length >= 3` en el post.
- `h4`, `h5`, `h6` no se incluyen en la TOC pero sí reciben `id` para deep-link.
- El primer `h1` (título del post) no se incluye en la TOC.

### Tag (vista build-time)

| Field | Type | Notes |
|---|---|---|
| `slug` | string | lowercase, kebab-case, `[a-z0-9-]+`. |
| `label` | string | string original del autor. |
| `count` | int | número de posts publicados con ese tag. |

Reglas:

- Si dos labels diferentes producen el mismo slug, el build falla.
- Los tags se ordenan alfabéticamente por `slug`.

### BlogIndex (JSON inline para el JS de búsqueda)

```json
[
  {
    "slug": "pipeline-seguridad-spec-driven",
    "title": "Pipeline de seguridad spec-driven en 7 etapas",
    "summary": "Construí un pipeline DevSecOps gratuito y reproducible…",
    "tags": ["devops", "seguridad", "spec-driven"]
  }
]
```

- Embebido en `/blog/index.html` como `<script id="blog-index" type="application/json">…</script>`.
- Solo se incluyen posts publicados y no futuros.
- Orden: igual al `<ol class="post-list">` (desc por fecha).

### FilterState (cliente)

| Field | Type | Notes |
|---|---|---|
| `tag` | string \| null | slug del tag activo, `null` = todos. |
| `query` | string | texto de búsqueda (normalizado lowercase). |

Reglas:

- Se compone funcionalmente. `query` es independiente de `tag`.
- `tag = null && query = ""` → todas las tarjetas visibles.
- Persistencia: ninguna entre cargas; el estado vive en el DOM (radio checked) + input value.

## State transitions

- **Filtros**: cambio de radio → CSS reaccciona vía `:has()` → cards no-coincidentes reciben `display: none`. El JS, si está cargado, además recalcula el conteo de resultados visibles y lo emite en `<output aria-live>`.
- **Búsqueda**: input cambia → JS aplica debounce 60 ms → recorre `[data-card]`, aplica `hidden = !matchesQueryAndTag(post)`.
- **Limpiar**: botón "Limpiar filtros" → JS marca radio "Todos" + vacía input + dispara filtros.

## Validation rules (delta sobre spec 006)

| Rule | Severity | Action |
|---|---|---|
| `cover` presente pero archivo no existe | ERROR | build falla con mensaje claro. |
| `cover` presente con extensión no permitida | ERROR | build falla. |
| Heading H2 sin texto (whitespace only) | ERROR | build falla. |
| Imagen embebida sin `alt` | ERROR | build falla (refuerza FR-010). |
| Dos tags distintos colisionan en mismo slug | ERROR | build falla. |
| `cover` ausente | OK | tarjeta sin imagen. |
