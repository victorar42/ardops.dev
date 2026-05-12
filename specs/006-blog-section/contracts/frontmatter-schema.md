# Contract — Frontmatter Schema (normativo)

**Feature**: 006-blog-section
**Status**: Normative

Este contrato define el formato YAML de frontmatter aceptado por `scripts/build-blog.js`. Cualquier desviación causa fallo en build (modo normal y `--check-only-validation`).

---

## Esquema

```yaml
title: <string, no vacío, ≤ 120 chars, sin newlines>
date: <ISO date YYYY-MM-DD>
slug: <string, ^[a-z0-9-]{1,80}$, único entre todos los posts>
summary: <string, 20..280 chars Unicode, sin HTML>
tags:
  - <string, ^[a-z0-9-]{1,32}$>
  # 0..10 tags; lista puede ser []
published: <boolean exacto, no string "true">
```

## Campos requeridos

`title`, `date`, `slug`, `summary`, `tags`, `published`. **Todos** son obligatorios.

## Campos opcionales

Ninguno en v1. (Posibles extensiones futuras: `cover`, `canonical`, `author` — fuera de alcance v1.)

## Validaciones

| Campo | Regla |
|---|---|
| `title` | string, 1..120 chars, sin `\n` ni `\r` |
| `date` | matchea `^\d{4}-\d{2}-\d{2}$` y es fecha válida del calendario; fecha futura → tratada como draft (R-010), warning emitido |
| `slug` | string, matchea `^[a-z0-9-]{1,80}$`, único entre TODOS los posts del directorio (publicados y drafts) |
| `slug` (consistencia con filename) | el sufijo del filename después de `YYYY-MM-` MUST coincidir con `slug`; mismatch → fail |
| `summary` | string, 20..280 chars (Unicode code points, no bytes), sin HTML inline (validado por regex `/<[^>]+>/`) |
| `tags` | array; longitud 0..10; cada elemento matchea `^[a-z0-9-]{1,32}$` |
| `published` | tipo `boolean` exacto (no string `"true"`, no `1`/`0`) |

## Campos desconocidos

Cualquier campo en el frontmatter que no esté en la lista anterior → **build falla** con mensaje `unexpected field 'X'`. No hay pass-through silencioso.

## Cuerpo (Markdown)

- Sintaxis GFM (tablas, fenced code, autolinks).
- HTML inline permitido pero filtrado por DOMPurify según [sanitizer-whitelist.md](./sanitizer-whitelist.md).
- El cuerpo MUST tener al menos 1 carácter no-whitespace (post vacío → fail).

## Ejemplo válido

```yaml
---
title: "Cómo construí mi pipeline de seguridad spec-driven"
date: 2026-05-11
slug: pipeline-seguridad-spec-driven
summary: "El proceso (en primera persona) detrás del pipeline DevSecOps que ejecuta 7 análisis sobre cada PR a este sitio, sin licencias y en menos de 5 minutos."
tags:
  - devsecops
  - github-actions
  - spec-driven
  - seguridad
published: true
---

Este sitio se construye con un pipeline que…
```

## Ejemplos inválidos

### Falta `title`

```yaml
---
date: 2026-05-15
slug: foo
summary: "abcdefghijklmnopqrst"
tags: [x]
published: true
---
```

Error esperado:

```
[error] content/blog/2026-05-foo.md: missing required field 'title'
```

### `published` como string

```yaml
published: "true"
```

Error: `[error] <file>: field 'published' must be boolean (got string)`.

### Tag con mayúsculas

```yaml
tags: ["DevOps"]
```

Error: `[error] <file>: tag 'DevOps' violates pattern ^[a-z0-9-]{1,32}$ — use 'devops'`.

### `summary` muy corto

```yaml
summary: "ok"
```

Error: `[error] <file>: field 'summary' must be 20..280 chars (got 2)`.

### `summary` con HTML

```yaml
summary: "Resumen <strong>importante</strong> sobre el tema."
```

Error: `[error] <file>: field 'summary' must not contain HTML tags`.

### `slug` no coincide con filename

Filename: `2026-05-mi-post.md`, frontmatter: `slug: otro-slug`.

Error: `[error] <file>: slug 'otro-slug' does not match filename suffix 'mi-post'`.

### `slug` duplicado

Dos archivos con `slug: foo`.

Error: `[error] content/blog/<segundo-archivo>.md: duplicate slug 'foo' (also defined in <primer-archivo>.md)`.

### Campo desconocido

```yaml
author: "Victor"
```

Error: `[error] <file>: unexpected field 'author'`.

### Fecha futura

```yaml
date: 2027-01-01
published: true
```

NO es error: `[warn] <file>: future date 2027-01-01, treating as draft`. Build continúa, post excluido.

## Mensajes de error — convención

Formato canónico:

```
[error] <relative-path>: <issue> (field='<path.to.field>')
```

- Un error por línea.
- El script retorna exit code 1 si hay ≥ 1 error.
- En modo `--check-only-validation`, el script procesa solo el `--input` y sale ≠0 al primer error.
