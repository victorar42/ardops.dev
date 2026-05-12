# Quickstart — Mantener el blog

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Data Model**: [data-model.md](data-model.md)

Guía rápida para el autor (Victor) sobre cómo agregar, editar o quitar posts del blog.

---

## TL;DR

1. Crear/editar `content/blog/YYYY-MM-<slug>.md`.
2. Correr `node scripts/build-blog.js`.
3. Verificar el diff de `index.html`, `blog/index.html` y `blog/<slug>.html`.
4. `git add -A && git commit -m "blog: add post <slug>" && git push`.

---

## Crear un post nuevo

1. Crear archivo `content/blog/2026-06-mi-nuevo-post.md` (prefijo `YYYY-MM-` obligatorio; el sufijo después debe coincidir con el `slug` del frontmatter).
2. Escribir frontmatter:
   ```yaml
   ---
   title: "Cómo automatizo X con Y"
   date: 2026-06-15
   slug: mi-nuevo-post
   summary: "Resumen breve, 20–280 chars, sin HTML."
   tags:
     - devops
     - automation
   published: true
   ---
   ```
3. Escribir el cuerpo en Markdown estándar (GFM). Para embeber stat cards inline, usar el patrón normativo:
   ```html
   <div class="post-stats">
     <div class="stat-card">
       <p class="stat-value">42</p>
       <p class="stat-label">Métrica</p>
     </div>
   </div>
   ```
   Cualquier otro HTML inline será sanitizado por DOMPurify según el whitelist en `contracts/sanitizer-whitelist.md` (sin `<script>`, sin `on*=`, sin `style=`, sin `javascript:`).
4. Validar y construir localmente:
   ```bash
   node scripts/build-blog.js
   bash tests/blog-schema.sh         # opcional: valida que las fixtures negativas siguen fallando
   npx html-validate index.html blog/index.html blog/mi-nuevo-post.html
   npm run a11y                       # opcional: corre axe-core (Puppeteer)
   ```
5. Commit:
   ```bash
   git add content/blog/2026-06-mi-nuevo-post.md \
           index.html \
           blog/index.html \
           blog/mi-nuevo-post.html
   git commit -m "blog: add mi-nuevo-post"
   git push
   ```

---

## Editar un post existente

1. Editar el `.md` correspondiente en `content/blog/`.
2. `node scripts/build-blog.js`.
3. Verificar el diff: el HTML del post se regenera; la card en landing y la entrada en `/blog/` también, si los campos visibles cambiaron (título, summary, tags, fecha).
4. Commit ambos archivos (.md + HTML afectados).

---

## Despublicar un post

Opción A — definitivo: borrar el `.md`:
```bash
rm content/blog/2026-05-experimento.md
node scripts/build-blog.js
```
El script elimina automáticamente `blog/experimento.html`.

Opción B — temporal: cambiar `published: true` → `published: false` en el frontmatter. Rebuild. El post desaparece de landing y `/blog/`, y `blog/<slug>.html` se elimina.

En ambos casos, commit todos los archivos afectados.

---

## Renombrar el slug de un post (cambia la URL — destructivo)

1. Editar `slug:` en el frontmatter.
2. Renombrar el archivo `.md` para que el sufijo coincida.
3. `node scripts/build-blog.js`.
4. El script emite `blog/<nuevo-slug>.html` y elimina `blog/<viejo-slug>.html`.
5. **Considerar**: enlaces externos al slug viejo se rompen. Solo renombrar si el post no se ha compartido públicamente todavía.

---

## Anatomía del frontmatter

| Campo | Obligatorio | Ejemplo | Notas |
|---|---|---|---|
| `title` | sí | `"Mi título"` | 1..120 chars, sin newlines. |
| `date` | sí | `2026-05-15` | ISO `YYYY-MM-DD`. Fecha futura → tratada como draft (R-010). |
| `slug` | sí | `mi-titulo` | `^[a-z0-9-]{1,80}$`. Único. Define la URL. |
| `summary` | sí | `"Resumen…"` | 20..280 chars Unicode. Sin HTML. |
| `tags` | sí | `[devops, ci]` | Lista (puede ser `[]`); cada tag `^[a-z0-9-]{1,32}$`; máx 10. |
| `published` | sí | `true` | Boolean exacto (no string). |

Schema completo y mensajes de error: [contracts/frontmatter-schema.md](contracts/frontmatter-schema.md).

---

## Modos del script

| Comando | Qué hace |
|---|---|
| `node scripts/build-blog.js` | Build completo: regenera landing (entre markers), `blog/index.html`, todos los `blog/<slug>.html`. Borra HTML huérfano. |
| `node scripts/build-blog.js --check` | Dry-run + comparación byte-a-byte contra los HTML actuales. Exit≠0 si hay drift. Usado por CI. |
| `node scripts/build-blog.js --check-only-validation --input <path>` | Solo valida frontmatter + sanitización dry-run del fichero indicado. Usado por `tests/blog-schema.sh` con fixtures. |

---

## Stat cards inline en el cuerpo de un post

Las stat cards reusan **exactamente** las clases `.stat-card`, `.stat-value`, `.stat-label` del design system (las mismas de `#about`). Patrón normativo:

```html
<div class="post-stats">
  <div class="stat-card">
    <p class="stat-value">7</p>
    <p class="stat-label">Etapas</p>
  </div>
  <div class="stat-card">
    <p class="stat-value">$0</p>
    <p class="stat-label">Costo de licencias</p>
  </div>
  <!-- … -->
</div>
```

- Solo `<div>`, `<p>`, `<span>`, `<h3>` con `class` están permitidos para este patrón.
- `style="…"` está PROHIBIDO (DOMPurify lo elimina; el aspecto viene de `components.css`).
- Atributos `on*=` (onclick, onerror, …) → eliminados.
- `<script>`, `<iframe>`, `<form>`, `<input>`, `<button>` → eliminados.

Whitelist completo en [contracts/sanitizer-whitelist.md](contracts/sanitizer-whitelist.md).

---

## ¿Por qué cambian tantos archivos a la vez?

- `content/blog/*.md` es la fuente de verdad.
- `index.html`, `blog/index.html` y `blog/<slug>.html` son HTML pre-renderizado para que el sitio sea 100% estático y servir cero JS adicional (constitución III/VII).
- El script `scripts/build-blog.js` es idempotente: el mismo `content/blog/` produce siempre el mismo HTML.
- La gate `blog-build-check` en CI verifica que todos estén en sync. Si te olvidaste de correr el build local, CI te lo dice con el mensaje exacto del archivo desincronizado.

---

## Cadencia recomendada

- **Al publicar**: el `.md` y los HTML regenerados van en el mismo commit.
- **Mensual**: revisar `content/blog/` por drafts olvidados (`published: false` o fecha futura > 6 meses). Promover o eliminar.
- **Honestidad antes que volumen**: 1 post bien escrito > 5 mediocres.

---

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| CI falla con `blog-build: index.html is out of sync` | Editaste un `.md` y no corriste el build local | `node scripts/build-blog.js` y commit los HTML regenerados. |
| CI falla con `blog-build: <file>: missing required field 'title'` | Frontmatter inválido | Revisá la sintaxis YAML y el schema en `contracts/frontmatter-schema.md`. |
| CI falla con `blog-build: duplicate slug 'foo'` | Dos `.md` con el mismo `slug` en frontmatter | Renombrá uno; recordá que `slug` es la URL. |
| El post no aparece tras rebuild | `published: false` o `date` futura | Verificá frontmatter; ver R-010 para fechas futuras. |
| `npx html-validate blog/<slug>.html` falla | Bug del script o del whitelist | Reportá; no debería pasar si el `.md` valida. |
| Las stat cards se renderizan sin estilos | Faltan las clases `.stat-card` etc. en `components.css` | Verificá que `components.css` está incluido y que el HTML emitido no fue saneado en exceso (revisá whitelist). |
| El nav muestra "Blog" → `#blog` y no `/blog/` | Edición manual del nav post-merge | Corregí el `<a href="/blog/">` en todas las páginas; ver R-014. |
