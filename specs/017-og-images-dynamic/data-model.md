# Phase 1 — Data Model: OG images dinámicas

**Feature**: 017-og-images-dynamic | **Date**: 2026-05-14

Modelo de datos del build (no hay base de datos; "entidades" son
estructuras en memoria + artefactos en filesystem).

---

## Entidad: `OgImageJob`

Representa la intención de renderizar un PNG para un slug específico.

| Campo | Tipo | Origen | Restricciones |
|---|---|---|---|
| `slug` | `string` | frontmatter del post | match `/^[a-z0-9-]{1,80}$/` (mismo regex que blog). |
| `title` | `string` | frontmatter del post | 1..120 caracteres; truncado visual a 2 líneas. |
| `tags` | `string[]` | frontmatter del post | 0..10 elementos; en SVG se muestran máximo 4. |
| `templateVersion` | `string` | constante en builder | hoy `"v1"`. |
| `hash` | `string` | derivado: `sha256(templateVersion + '\n' + title + '\n' + sortedTags.join(','))` | hex lowercase, 64 chars. |
| `outputPath` | `string` | derivado: `public/og/blog/<slug>.png` | siempre relativo al repo root. |

**Invariantes**:
- Solo se construye `OgImageJob` para posts con `published === true`
  y fuera de `_fixtures/` y `__fixtures__/`.
- `hash` es la fuente de verdad para drift; siempre recalculable.

---

## Entidad: `OgManifest`

Archivo `public/og/blog/manifest.json` (commiteado).

```json
{
  "version": 1,
  "templateVersion": "v1",
  "entries": {
    "pipeline-seguridad-spec-driven": {
      "hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      "title": "Cómo construí mi pipeline de seguridad spec-driven",
      "tags": ["devsecops", "github-actions", "spec-driven", "seguridad"]
    }
  }
}
```

**Reglas de serialización (reproducibilidad)**:
- `JSON.stringify(obj, null, 2) + '\n'`.
- `entries` ordenado alfabéticamente por slug.
- Dentro de cada entry, claves en orden fijo: `hash`, `title`, `tags`.
- `tags` se preservan tal como vienen del frontmatter (no se ordenan
  para almacenamiento, aunque sí para el cálculo del hash).

**Operaciones**:
- `loadManifest()` → estructura o `{ version:1, templateVersion:"v1", entries:{} }` si no existe.
- `writeManifest(m)` → escribe el JSON con el formato anterior.
- `diffManifest(current, expected)` → array de `{ slug, reason }`
  donde `reason ∈ { missing-png, hash-mismatch, orphan-entry, new-post-no-entry }`.

---

## Entidad: `OgTemplate`

Archivo `scripts/og/template.svg`.

| Atributo | Valor / Restricción |
|---|---|
| Versión | declarada en `scripts/build-og.js` como `OG_TEMPLATE_VERSION = 'v1'` |
| Tamaño | 1200 × 630 viewBox |
| Placeholders | `{{TITLE_LINES}}`, `{{TAGS_SVG}}`, `{{LOGO_TEXT}}` |
| Fonts | embebidas base64 en `<style>` (Outfit 600/700, JetBrains Mono 700) |
| Colores | exactamente los de `assets/css/tokens.css` (`--bg-primary` `#0a0e17`, `--bg-secondary` `#111827`, `--bg-card` `#1a2235`, `--accent` `#22d3ee`, `--text-primary` `#e2e8f0`) |

**Cambios al template SVG requieren bump de `OG_TEMPLATE_VERSION`** —
ese bump cambia el hash de todas las entries y fuerza la regeneración
de todos los PNGs en la misma PR.

---

## Entidad: `OgArtifact`

Archivo `public/og/blog/<slug>.png`.

| Atributo | Valor / Restricción |
|---|---|
| Dimensiones | 1200 × 630 exactas (verificable con `file`). |
| Color depth | 8-bit RGB, sin alpha (PNG type 2). |
| Tamaño | ≤ 100 000 B raw (gate). |
| Metadata | sin XMP, sin tIME chunk, sin gAMA chunk (reproducible). |

---

## Entidad: `OgBuildLog`

Salida stdout del builder.

```text
[og-build] loaded manifest: 1 entry, templateVersion=v1
[og-build]   pipeline-seguridad-spec-driven: cached (hash match)
[og-build]   mi-nuevo-post: generating (new)
[og-build]   nuevo-titulo: regenerating (title changed)
[og-build] removed orphan: public/og/blog/post-viejo.png
[og-build] ✓ 3 generated, 1 cached, 1 orphan removed, manifest updated
[og-build]   bytes: max=87 234 B (mi-nuevo-post), budget=100 000 B
```

En modo `--check`:

```text
[og-build] ✗ drift detected:
  pipeline-seguridad-spec-driven: hash-mismatch (expected 9f86…, found a1b2…)
  nuevo-post: new-post-no-entry
exit 2
```

---

## Transiciones de estado

```text
Markdown source (frontmatter)
    │  parse + validate (existing blog pipeline)
    ▼
OgImageJob { slug, title, tags, templateVersion, hash }
    │
    ▼
   ┌──────────────────────────┐
   │ manifest.entries[slug]?  │
   └──────────────────────────┘
        │ yes                          │ no
        ▼                              ▼
  hash matches?                  generate (new)
    │ yes      │ no
    ▼          ▼
   cached    regenerate
                │
                ▼
  build SVG from template + substitute placeholders
                │
                ▼
  sharp(svg).png({ compressionLevel: 9, adaptiveFiltering: false })
                │
                ▼
  write public/og/blog/<slug>.png
                │
                ▼
  update manifest.entries[slug] = { hash, title, tags }

After all posts:
  remove PNG files whose slug is not in published set
  remove manifest entries whose slug is not in published set
  write manifest.json
```

En modo `--check`, se omiten todas las escrituras y se reportan los
deltas como exit code ≠ 0.
