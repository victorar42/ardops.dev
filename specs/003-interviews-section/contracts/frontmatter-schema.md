# Contract — Frontmatter Schema (normativo)

**Feature**: 003-interviews-section  
**Status**: Normative

Este contrato define el formato YAML de frontmatter aceptado por `scripts/build-interviews.js`. Cualquier desviación causa fallo en `--strict`.

---

## Esquema

```yaml
title: <string, no vacío, ≤ 120 chars>
interviewee:
  name: <string, no vacío, ≤ 80 chars>
  role: <string, no vacío, ≤ 80 chars>
  company: <string, no vacío, ≤ 80 chars>
  image: <string, ruta relativa a content/interviews/, opcional>
  linkedin: <string, URL https://, opcional>
date: <ISO date YYYY-MM-DD>
tags:
  - <string, ^[a-z0-9-]{1,32}$>
  # 1..10 tags
summary: <string, 20..280 chars>
published: <boolean>
```

## Campos requeridos

`title`, `interviewee.name`, `interviewee.role`, `interviewee.company`, `date`, `tags` (≥ 1), `summary`, `published`.

## Campos opcionales

`interviewee.image`, `interviewee.linkedin`.

## Validaciones

| Campo | Regla |
|---|---|
| `title` | string, 1..120 chars, sin newlines |
| `interviewee.name` | string, 1..80 chars |
| `interviewee.role` | string, 1..80 chars |
| `interviewee.company` | string, 1..80 chars |
| `interviewee.image` | si presente: string, debe existir en filesystem en build time |
| `interviewee.linkedin` | si presente: matchea `^https://[\w.-]+(/[\w./%-]*)?$` |
| `date` | matchea `^\d{4}-\d{2}-\d{2}$` y es fecha válida del calendario |
| `tags[i]` | matchea `^[a-z0-9-]{1,32}$` |
| `tags.length` | 1..10 |
| `summary` | 20..280 chars (Unicode code points), no HTML |
| `published` | tipo `boolean` exacto (no string "true") |

## Ejemplo válido

```yaml
---
title: "Conversación con José Álvarez sobre escalar Pernix"
interviewee:
  name: "José Álvarez"
  role: "CTO"
  company: "Pernix"
  image: "images/jose-alvarez-pernix.webp"
  linkedin: "https://www.linkedin.com/in/josealvarez"
date: "2026-05-15"
tags:
  - liderazgo
  - cto
  - arquitectura
  - scaling
summary: "Cómo José estructura equipos de plataforma en Pernix y los aprendizajes técnicos al escalar."
published: true
---
```

## Ejemplos inválidos

### Falta `title`

```yaml
---
interviewee:
  name: "X"
  role: "Y"
  company: "Z"
date: "2026-05-15"
tags: [x]
summary: "abcdefghijklmnopqrst"
published: true
---
```

Error esperado:

```
[error] content/interviews/<filename>.md: missing required field 'title'
```

### `published` como string

```yaml
published: "true"
```

Error: `field 'published' must be boolean (got string)`.

### Tag con mayúsculas

```yaml
tags: ["DevOps"]
```

Error: `tag 'DevOps' violates pattern ^[a-z0-9-]{1,32}$ — use 'devops'`.

### `summary` muy corto

```yaml
summary: "ok"
```

Error: `field 'summary' must be 20..280 chars (got 2)`.

### Imagen inexistente

```yaml
interviewee:
  image: "images/no-existe.webp"
```

Error: `interviewee.image points to non-existent file: content/interviews/images/no-existe.webp`.

## Mensajes de error — convención

Formato canónico:

```
[error] <relative-path>: <issue> (field='<path.to.field>')
```

- Un error por línea.
- El script retorna exit code 1 si hay ≥ 1 error en modo `--strict`.
- En modo no-strict, los errores se reportan como warning y la entrevista se omite del output.
