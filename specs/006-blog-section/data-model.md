# Phase 1 — Data Model: Sección Blog

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Research**: [research.md](research.md)

Modelo conceptual de las entidades manipuladas por `scripts/build-blog.js`. El schema YAML normativo del frontmatter está en [contracts/frontmatter-schema.md](contracts/frontmatter-schema.md); el contrato de HTML emitido en [contracts/render-contract.md](contracts/render-contract.md); el whitelist del sanitizador en [contracts/sanitizer-whitelist.md](contracts/sanitizer-whitelist.md).

---

## Entidad 1 — `BlogPost` (fuente: archivo `.md`)

Un archivo `content/blog/YYYY-MM-<slug>.md` con frontmatter YAML + cuerpo Markdown.

### Frontmatter (campos persistidos)

| Campo | Tipo | Obligatorio | Validación | Notas |
|---|---|---|---|---|
| `title` | string | sí | 1..120 chars, sin newlines | Visible al lector. |
| `date` | string ISO | sí | `^\d{4}-\d{2}-\d{2}$` y fecha válida | Usado para ordenamiento y display. Comportamiento ante fecha futura: ver R-010. |
| `slug` | string | sí | `^[a-z0-9-]{1,80}$`. Único entre todos los posts. MUST coincidir con sufijo del filename después de `YYYY-MM-`. | Define la URL `/blog/<slug>.html`. Inmutable: cambiarlo rompe enlaces externos. |
| `summary` | string | sí | 20..280 chars (Unicode code points), sin HTML | Mostrado en card landing y en `/blog/`. |
| `tags` | array of string | sí (puede ser `[]`) | Cada tag matchea `^[a-z0-9-]{1,32}$`; total 0..10 | Metadato visual no enlazable (R-016). |
| `published` | boolean | sí | tipo `boolean` exacto (no string `"true"`) | `false` excluye el post de landing, `/blog/` y omite emisión de página individual. |

**Reglas adicionales**:
- Cualquier campo desconocido en el frontmatter hace fallar el build (modo estricto, sin pass-through silencioso).
- No se permiten campos `null` para los obligatorios.
- El frontmatter NO permite override de `readingTime` (es derivado, R-004).

### Cuerpo (Markdown)

- Sintaxis GFM (tablas, fenced code, autolinks).
- Permite HTML inline limitado al whitelist del sanitizador (`contracts/sanitizer-whitelist.md`).
- El primer post embebe inline las 4 stat cards técnicas usando el patrón normativo:
  ```html
  <div class="post-stats">
    <div class="stat-card"><p class="stat-value">7</p><p class="stat-label">Etapas</p></div>
    <div class="stat-card"><p class="stat-value">$0</p><p class="stat-label">Costo de licencias</p></div>
    <div class="stat-card"><p class="stat-value">100%</p><p class="stat-label">Cobertura</p></div>
    <div class="stat-card"><p class="stat-value">&lt;5 min</p><p class="stat-label">Build time</p></div>
  </div>
  ```

### Campos derivados (no en frontmatter)

| Campo | Origen | Uso |
|---|---|---|
| `readingTime` | calculado por R-004 (200 wpm sobre texto plano del body) | Mostrado en card landing, listado `/blog/`, página individual. |
| `bodyHtml` | `marked(body)` → `DOMPurify.sanitize(html, whitelist)` → post-proceso de `<a>` (R-015) | Inyectado en la página individual. |
| `url` | `/blog/<slug>.html` | Usado en cards, listado y `<link rel="canonical">`. |

---

## Entidad 2 — `BlogPostCollection`

La colección en memoria producida por leer todos los `.md` válidos de `content/blog/`.

| Atributo | Descripción |
|---|---|
| `posts` | Array de `BlogPost`, todos los posts (publicados y drafts), parseados y validados. |
| `published` | Subset de `posts` donde `published === true` y `date` no es futura, ordenado **descendente por `date`**, con desempate alfabético por `slug` ascendente. |
| `recent` | Primeros 3 elementos de `published` (los 3 más recientes). |

**Invariantes**:
- `slug` único en todo `posts` (publicados o no). Build falla con duplicados.
- El filename del archivo MUST tener prefijo `YYYY-MM-` cuyo `YYYY-MM` coincida con `date` del frontmatter (warning, no fail, en v1; documenta consistencia).
- Para cada post en `published`, debe existir el archivo HTML emitido `blog/<slug>.html`.

---

## Entidad 3 — `LandingBlogBlock`

Bloque marker-delimited dentro de `index.html`:

```html
<!-- blog:start -->
<section id="blog" …> …cards de los 3 más recientes + link "Ver todos"… </section>
<!-- blog:end -->
```

- Reemplaza completamente la sección actual `#security-pipeline` (líneas 188-216 de `index.html`, según spec).
- Es regenerado idempotentemente por el build script.
- En modo `--check`, el bloque actual entre markers MUST coincidir byte-a-byte con el regenerado.

---

## Entidad 4 — `BlogIndexPage`

`blog/index.html` regenerado completamente por el build (no marker-delimited, archivo entero):

- Listado completo de `published` (todos, no solo 3).
- Si `published.length === 0`, render del estado vacío (R-011).
- Cabecera consistente con resto del sitio (mismo `<header>`, nav, `<footer>`).
- En modo `--check`, el archivo actual MUST coincidir byte-a-byte con el regenerado.

---

## Entidad 5 — `BlogPostPage`

`blog/<slug>.html`, una por cada post en `published`:

- HTML estático completo con `<head>`, CSP meta, `<link rel="canonical">`, OpenGraph básico.
- `<article>` con `<header>` (título, `<time>`, reading time, tags) + `bodyHtml` sanitizado + `<footer>` con link de regreso a `/blog/`.
- En modo `--check`, cada archivo actual MUST coincidir byte-a-byte con el regenerado.
- En modo build normal, archivos huérfanos (`.html` sin `.md` correspondiente publicado) son **eliminados** por el script.

---

## Entidad 6 — `AboutSection` (modificación)

Sección `#about` del landing, modificada en este iterado:

| Sub-entidad | Antes | Después |
|---|---|---|
| Stat cards | 4 técnicas: 7 etapas / 0 costo / 100% cobertura / <5 min | 4 personales: 17 (años desarrollo) / 10 (años DevOps) / +12 (clientes) / 1% (mejor cada día) |
| Foto | (no existe) | `<img src="assets/img/josue-256.webp" alt="Retrato de Victor Josue Ardón Rojas" width="256" height="256" loading="lazy" decoding="async" class="about-portrait">` |

- Las clases `.stat-card`, `.stat-value`, `.stat-label` se reusan sin cambios (R-008).
- La nueva clase `.about-portrait` (border-radius 50%, dimensiones responsivas) se añade en `components.css`.

---

## State transitions (`BlogPost.published`)

Cambios manuales por el autor en frontmatter:

```
                 ┌─────────────────┐
   crea .md      │ published:false │  (draft / borrador)
   ────────────▶ │                 │
                 └────────┬────────┘
                          │ (autor cambia a true cuando está listo)
                          ▼
                 ┌─────────────────┐
                 │ published:true  │  (visible en landing y /blog/)
                 └────────┬────────┘
                          │ (raro: autor lo despublica)
                          ▼
                 ┌─────────────────┐
                 │ published:false │
                 └─────────────────┘
```

- Cambios de `published`: el rebuild remueve/agrega cards en landing, entradas en `/blog/`, y emite/elimina `blog/<slug>.html`.
- Cambios de `date`: pueden reordenar `recent` y `published`; rebuild es idempotente.
- Cambios de `slug`: ROMPE la URL; el script emite `blog/<nuevo-slug>.html` y elimina `blog/<viejo-slug>.html`. Documentar en quickstart como acción manual de "renombrar".
- Borrar el `.md`: el rebuild elimina `blog/<slug>.html` huérfano automáticamente (R-012).

---

## Identifiers (I-XX) — invariantes verificables

| ID | Invariante | Origen |
|---|---|---|
| **I-1** | `content/blog/*.md` es la única fuente de posts; cero contenido de post hardcodeado en `index.html` o `blog/index.html` | FR-021, SC-002 |
| **I-2** | `slug` es único entre todos los posts (publicados o no); duplicado → build falla | FR-015, R-005 |
| **I-3** | Posts con `published: false` o `date` futura no aparecen en landing, no aparecen en `/blog/`, no tienen página individual emitida | FR-017, R-010 |
| **I-4** | El landing muestra exactamente los 3 más recientes (o todos si <3) | FR-002 |
| **I-5** | `/blog/index.html` muestra todos los `published`, ordenados desc por `date` | FR-006 |
| **I-6** | El cuerpo HTML emitido en cada post está sanitizado por DOMPurify con el whitelist normativo; vectores XSS conocidos (`<script>`, `<iframe>`, `on*=`, `javascript:`) están ausentes | FR-013, FR-016 |
| **I-7** | Cada post tiene CSP meta estricta `default-src 'self'; script-src 'self'; …` (mismo patrón interviews) | FR-029, constitución VIII |
| **I-8** | Reading time se calcula automáticamente por R-004 y se muestra en card landing, listado `/blog/` y página individual | FR-012 |
| **I-9** | El nav superior en todas las páginas tiene entrada "Blog" → `/blog/` (no `#blog`, no `#security-pipeline`) | FR-018, SC-010 |
| **I-10** | `#about` muestra las 4 stat cards personales (17 / 10 / +12 / 1%) y la foto circular 256×256 webp con `alt` no vacío y `loading="lazy"` | FR-019, FR-020, SC-011 |
| **I-11** | El bloque renderizado en `index.html` vive entre `<!-- blog:start -->` y `<!-- blog:end -->` y es reemplazable de forma idempotente | R-002 / R-006 |
| **I-12** | La gate `blog-build-check` falla si landing, `blog/index.html` o cualquier `blog/<slug>.html` está fuera de sync con `content/blog/` | FR-023, SC-009 |

---

**Resultado**: modelo de datos completo, sin ambigüedad. Los contratos en `contracts/` traducen estos invariantes a especificaciones verificables.
