# Entrevistas — convención de autoría

Esta carpeta contiene el **contenido fuente** de las entrevistas publicadas en
`https://ardops.dev/interviews/`. El HTML y el `index.json` que se sirven
viven en `interviews/` (gitignored) y se generan en CI con
`scripts/build-interviews.js`.

> Para flujo completo paso a paso, ver
> [`specs/003-interviews-section/quickstart.md`](../../specs/003-interviews-section/quickstart.md).

## Estructura

```
content/interviews/
├── README.md                           ← este archivo
├── 2026-05-jose-alvarez-pernix.md      ← una entrevista
├── 2026-05-luis-corrales-huli.md
├── images/
│   └── jose-alvarez-pernix.webp        ← foto opcional (256×256)
└── __fixtures__/
    ├── valid-minimal.md                ← MDs sintéticos para CI
    ├── invalid-missing-title.md
    └── xss-attempt.md
```

## Convención de nombre de archivo

Formato recomendado: `YYYY-MM-<slug>.md`.

- `<slug>` debe coincidir con `^[a-z0-9-]{1,80}$`.
- La URL servida será `/interviews/<slug>.html` (sin el prefijo de fecha).
- Cambiar el filename **rompe la URL**. Una vez publicada, mantenerlo estable.

## Frontmatter mínimo

```yaml
---
title: "Conversación con José Álvarez sobre escalar Pernix"
interviewee:
  name: "José Álvarez"
  role: "CTO"
  company: "Pernix"
  image: "images/jose-alvarez-pernix.webp"     # opcional
  linkedin: "https://www.linkedin.com/in/..."  # opcional
date: "2026-05-15"
tags: [liderazgo, cto, arquitectura, scaling]
summary: "Resumen de 20–280 caracteres."
published: true
---
```

Esquema completo y reglas de validación en
[`specs/003-interviews-section/contracts/frontmatter-schema.md`](../../specs/003-interviews-section/contracts/frontmatter-schema.md).

## Reglas rápidas

- **Markdown estándar (GFM)**. Listas, énfasis, tablas, code blocks. Sin HTML inline (será removido por el sanitizador).
- **Headings dentro del cuerpo**: usar `##` y `###`. Nunca `#` (el `<h1>` lo provee la plantilla).
- **Imágenes del entrevistado**: WebP recomendado, 256×256 px, en `images/`. Si no hay, se renderiza un avatar SVG con iniciales.
- **Tags**: minúsculas, kebab-case, máximo 10 por entrevista.
- **Despublicar**: `published: false` y commitear. El próximo deploy retira los artefactos.

## Validar localmente

```bash
node scripts/build-interviews.js --strict --out interviews/
npx serve .
# abrir http://localhost:3000/interviews/
```

## ⚠️ NO commitees archivos en `interviews/`

Los HTML, el `index.json` y las imágenes copiadas viven solo en `interviews/`
(gitignored) y se regeneran en cada build. Si ves cambios pendientes en esa
ruta tras un build local, descartalos antes del PR.
