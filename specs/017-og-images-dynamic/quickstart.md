# Quickstart: OG images dinámicas

**Feature**: 017-og-images-dynamic

Guía operativa para autores y CI.

---

## Para el autor: publicar un post

1. Crear `content/blog/<slug>.md` con frontmatter completo:
   ```yaml
   ---
   slug: mi-post
   title: Cómo lograr X sin perder Y
   tags: [devsecops, github-actions]
   published: true
   ...
   ---
   ```
2. Correr el build:
   ```bash
   npm run build
   ```
   Esto invoca, entre otros, `node scripts/build-og.js` (antes de
   `build:blog`) que:
   - Genera `public/og/blog/mi-post.png` (1200×630, < 100 KB).
   - Actualiza `public/og/blog/manifest.json`.
3. Commitear **todos** los archivos generados:
   - `public/og/blog/mi-post.png`
   - `public/og/blog/manifest.json`
   - `blog/mi-post.html` (con `og:image` apuntando al PNG por slug).

## Regenerar todos los PNGs (cambio de plantilla)

Cuando se modifica `scripts/og/template.svg` o la versión sube
(p.ej. `OG_TEMPLATE_VERSION = 'v2'`):

```bash
node scripts/build-og.js --regenerate
```

Esto fuerza la regeneración de todos los PNGs y actualiza el manifest.
Commitear todos los archivos diff.

## Validar drift localmente

```bash
node scripts/build-og.js --check
```

Exit 0 = limpio. Exit 2 = drift; stdout lista cada slug ofensor y la
razón (`hash-mismatch`, `orphan-entry`, `new-post-no-entry`, etc.).
Para resolver: correr `node scripts/build-og.js` sin flags, commitear
los cambios.

## Gates locales

```bash
bash tests/og-images.sh   # cobertura + dimensiones + tamaño + meta tags
bash tests/og-drift.sh    # wrapper de --check
bash tests/byte-budgets.sh # incluye budget de OG PNGs
```

---

## Troubleshooting

### Título demasiado largo

- El truncado automático limita el título a ~56 caracteres en 2
  líneas; cualquier exceso se corta con `…`.
- Para títulos con palabras muy largas (>28 chars), considerá un
  título alternativo o un atajo.

### Sin tags

- El layout omite la fila de chips por completo y deja el logo en su
  posición habitual. Cero impacto visual destructivo.

### El PNG excede 100 KB

- El builder falla con `exit 1` y muestra el slug y tamaño.
- Mitigación inmediata: reducir número de tags visibles o simplificar
  el gradient. Mitigación PR-level: subir el budget en
  `tests/byte-budgets.sh` con justificación explícita.

### Build dice "no OG image for slug=..."

- Significa que el post tiene entrada Markdown pero el OG todavía no
  fue generado. Correr `node scripts/build-og.js` y commitear el
  PNG + manifest.
- En CI, `tests/og-images.sh` falla en este escenario (gate hard).

### Sharp no instala en CI

- `sharp` requiere binarios pre-built. En GitHub Actions runners
  estándar (`ubuntu-latest`, `macos-14`) viene out of the box.
- Si falla: `npm rebuild sharp` o forzar `npm i --include=optional`.

---

## Reproducibilidad: verificar byte-a-byte

```bash
node scripts/build-og.js
md5 public/og/blog/*.png > /tmp/og.md5.1
node scripts/build-og.js --regenerate
md5 public/og/blog/*.png > /tmp/og.md5.2
diff /tmp/og.md5.1 /tmp/og.md5.2 && echo "✓ reproducible"
```

Debe imprimir `✓ reproducible`. Si no, abrir issue con la versión de
`sharp` y libvips.
