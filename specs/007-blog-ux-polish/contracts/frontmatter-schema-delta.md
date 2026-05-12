# Contract: Frontmatter Schema Delta (spec 007)

Esta spec extiende el contrato de [`specs/006-blog-section/contracts/frontmatter-schema.md`](../../006-blog-section/contracts/frontmatter-schema.md) con un único campo opcional.

## Campos sin cambio

`title`, `slug`, `date`, `summary`, `tags`, `published` — ver contrato base 006. **NO** se modifican ni se renombran.

## Nuevo campo

### `cover` (opcional)

- **Tipo**: string.
- **Default**: ausente.
- **Formato**: path relativo desde la raíz del repo, p.ej. `assets/img/blog/pipeline-seguridad-spec-driven.webp`.
- **Extensiones permitidas**: `.webp`, `.png`, `.jpg`, `.jpeg`.
- **No se permite**: URLs absolutas (http/https), data URIs, paths con `..`, paths con caracteres no `[A-Za-z0-9._/-]`.
- **Validación en build**:
  - Si el campo está presente y tiene un valor no-string: ERROR.
  - Si la extensión no está permitida: ERROR.
  - Si el path normalizado no comienza con `assets/img/blog/`: ERROR.
  - Si el archivo no existe en disco: ERROR.
  - Si todas las verificaciones pasan: el path se serializa tal cual en el HTML emitido como `src` de `<img>` (con prefijo `/` para que sea absoluto desde la raíz del sitio).

## Ejemplo

```yaml
---
title: "Pipeline de seguridad spec-driven en 7 etapas"
slug: "pipeline-seguridad-spec-driven"
date: 2026-05-11
summary: "Construí un pipeline DevSecOps gratuito y reproducible…"
tags: ["devops", "seguridad", "spec-driven"]
published: true
cover: "assets/img/blog/pipeline-seguridad-spec-driven.webp"
---
```

## Backward compatibility

Los posts existentes (sin `cover`) MUST seguir construyendo y renderizando sin errores. La ausencia del campo es un caso normal, no un warning.
