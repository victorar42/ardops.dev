# Quickstart — Sección de Entrevistas

**Feature**: 003-interviews-section  
**Audiencia**: autores de contenido y mantenedores del sitio.

Dos runbooks: uno para **publicar una entrevista** y otro para **desarrollar/validar localmente**.

---

## A. Runbook editorial — Publicar una nueva entrevista

### A.1 Preparar el archivo

1. Elegí slug: kebab-case, `[a-z0-9-]+`. Ej.: `jose-alvarez-pernix`.
2. Creá el archivo `content/interviews/<YYYY-MM>-<slug>.md`. Ejemplo: `content/interviews/2026-05-jose-alvarez-pernix.md`.
3. Pegá la siguiente plantilla y completá:

```markdown
---
title: "Conversación con José Álvarez sobre escalar Pernix"
interviewee:
  name: "José Álvarez"
  role: "CTO"
  company: "Pernix"
  image: "images/jose-alvarez-pernix.webp"   # opcional, ver A.2
  linkedin: "https://www.linkedin.com/in/josealvarez"   # opcional
date: "2026-05-15"
tags:
  - liderazgo
  - cto
  - arquitectura
  - scaling
summary: "Cómo José estructura equipos de plataforma en Pernix y los aprendizajes técnicos al escalar."
published: true
---

## Contexto

Texto en Markdown estándar. Sin HTML inline (será removido).

## Pregunta 1 — ¿Cómo arrancaste?

Respuesta…

## Pregunta 2 — Decisiones técnicas

- bullet 1
- bullet 2
```

### A.2 (Opcional) Agregar foto del entrevistado

1. Subí una imagen 256×256 px (WebP recomendado, JPG aceptado) a `content/interviews/images/<slug>.webp`.
2. Referenciá la ruta exacta en `interviewee.image` del frontmatter.
3. Si no querés foto, omití el campo: el sitio renderiza un avatar SVG con las iniciales.

### A.3 Validar localmente

```bash
node scripts/build-interviews.js --strict --out interviews/
```

Si hay errores de frontmatter, el script los lista y termina con exit 1. Corregí y reejecutá.

### A.4 Previsualizar

```bash
npx serve .
```

Abrí `http://localhost:3000/interviews/` y `http://localhost:3000/interviews/<slug>.html`. Verificá:
- Título, foto, metadata.
- Tags clickeables.
- Búsqueda en vivo en el listado.
- `aria-current="page"` en "Entrevistas" del nav.

### A.5 Despublicar / borrador

- Para borrador: `published: false`. El archivo no se emite.
- Para retirar una entrevista publicada: cambiar a `published: false` y commitear. El próximo deploy de Pages elimina los artefactos. La URL anterior responde 404 hasta que se cree una redirección manual (fuera de alcance).

### A.6 PR y deploy

1. Branch desde `main`: `git checkout -b content/interviews-<slug>`.
2. `git add content/interviews/<filename>.md content/interviews/images/<slug>.webp` (si aplica).
3. **NO commitees** archivos en `interviews/<slug>.html`, `interviews/index.html`, ni `interviews/index.json` — están en `.gitignore`.
4. `git commit -m "interviews: add <name> (<slug>)"`.
5. `git push` y abrí PR. Los gates de CI validan frontmatter, accesibilidad, y tamaño del index.
6. Una vez mergeado a `main`, el workflow `pages-deploy.yml` regenera y despliega.

---

## B. Runbook desarrollador — Modificar el generador

### B.1 Setup local

```bash
nvm use 20            # Node 20 LTS
npm install           # incluye gray-matter, marked, dompurify, jsdom (devDependencies)
```

### B.2 Estructura de archivos relevantes

```
scripts/build-interviews.js          # generador principal
content/interviews/*.md              # contenido editorial
content/interviews/images/*.webp     # imágenes opcionales
content/interviews/__fixtures__/     # MDs de prueba (no se publican)
assets/css/interviews.css            # estilos dedicados
assets/js/interviews.js              # buscador/filtros runtime (vanilla)
specs/003-interviews-section/        # spec, plan, contratos
tests/interviews-size.sh             # gate: index.json ≤ 100KB
tests/interviews-xss.sh              # gate: no <script> en HTML emitido
```

### B.3 Comandos útiles

| Acción | Comando |
|---|---|
| Build con todas las entrevistas | `node scripts/build-interviews.js --strict --out interviews/` |
| Build incluyendo fixtures (CI) | `node scripts/build-interviews.js --strict --include-fixtures --out _site/interviews/` |
| Validar sin emitir | `node scripts/build-interviews.js --dry-run --strict` |
| Limpiar artefactos locales | `rm -rf interviews/*.html interviews/index.* interviews/images` |
| HTML validate (post-build) | `npx html-validate interviews/**/*.html` |
| A11y test | `node tests/a11y.js` |
| Gate tamaño JSON | `bash tests/interviews-size.sh` |
| Gate XSS | `bash tests/interviews-xss.sh` |

### B.4 Suite de fixtures de CI

| Fixture | Esperado |
|---|---|
| `__fixtures__/valid-minimal.md` | Build OK, emite HTML + entry. |
| `__fixtures__/invalid-missing-title.md` | Build falla con mensaje claro citando `title`. |
| `__fixtures__/xss-attempt.md` | Build OK pero HTML emitido NO contiene `<script>`, ni `javascript:`, ni `onerror`. Verificado por `interviews-xss.sh`. |

Las fixtures se incluyen en el build solo cuando se pasa `--include-fixtures`. El job CI las activa para correr los gates de XSS y validación; el deploy de producción **no** incluye `--include-fixtures`.

### B.5 Pipeline en CI

`ci.yml` agrega los siguientes jobs después de los existentes:

1. **`build-interviews`**: instala deps, corre `build --strict --include-fixtures` contra `_site/interviews/`.
2. **`interviews-xss`**: depende de `build-interviews`. Ejecuta `tests/interviews-xss.sh`.
3. **`interviews-size`**: depende de `build-interviews`. Ejecuta `tests/interviews-size.sh`.
4. **`a11y`** (existente): se extiende `tests/a11y.js` para incluir `/interviews/` y `/interviews/<algún-slug>.html`.
5. **`html-validate`** (existente): se extiende para auditar `_site/interviews/**/*.html`.

`pages-deploy.yml` agrega un step `Generate interviews` antes del rsync (sin `--include-fixtures`).

### B.6 Troubleshooting

| Síntoma | Causa probable | Acción |
|---|---|---|
| Build falla "Slug invalid" | filename contiene mayúsculas o caracteres no permitidos | renombrá el archivo a kebab-case |
| Foto no aparece | `interviewee.image` apunta a ruta inexistente | revisá que el archivo esté en `content/interviews/images/` con el nombre exacto |
| `<script>` aparece en HTML emitido | ¡no debería! | abrir issue de seguridad de inmediato; revisar versiones de marked + DOMPurify |
| `index.json` > 100 KB | demasiados tags o summaries muy largos | acortar `summary`, evaluar paginación (spec aparte) |
| CSP bloquea `interviews.js` | path incorrecto en `<script src>` | verificar que el HTML emitido referencia `/assets/js/interviews.js` |

---

## C. Definition of Done por entrevista

- [ ] Archivo `.md` con frontmatter completo y válido.
- [ ] (Si aplica) imagen 256×256 en `images/`.
- [ ] `node scripts/build-interviews.js --strict` pasa sin errores.
- [ ] `node tests/a11y.js` pasa sobre la nueva URL individual.
- [ ] Vista previa local OK (búsqueda, tags, foco, lectura).
- [ ] PR mergeado a `main`.
- [ ] Verificación post-deploy: la URL `https://ardops.dev/interviews/<slug>.html` responde 200 y aparece en el listado.
