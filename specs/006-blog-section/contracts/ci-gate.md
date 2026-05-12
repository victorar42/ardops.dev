# CI Gate Contract — `blog-build-check`

**Feature**: 006-blog-section
**Status**: Normative

Define qué verifica la nueva gate del workflow de CI introducida por spec 006, qué señales falla y qué fixtures negativas debe ejercer.

---

## 1. Job: `blog-build-check`

Vive en `.github/workflows/ci.yml`. Corre en cada push y cada PR, en paralelo con las gates existentes (`a11y`, `html-validate`, `link-check`, `forbidden-urls`, `no-placeholders`, `interviews-*`, `pipeline-build-check`).

### Steps mínimos

```yaml
blog-build-check:
  name: Blog build & schema gate (spec 006)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
    - name: Install build deps (devDependencies — marked, dompurify, jsdom, gray-matter)
      run: npm ci
    - name: Build blog (check mode — fails if landing, blog/index.html or any blog/<slug>.html is out of sync)
      run: node scripts/build-blog.js --check
    - name: Negative-fixture gate
      run: bash tests/blog-schema.sh
```

### Señales de fallo (`--check`)

| Condición | Exit | Mensaje esperado en stderr |
|---|---|---|
| Frontmatter de cualquier `.md` inválido | 1 | `[error] <file>: <issue>` (ver `frontmatter-schema.md`) |
| `slug` duplicado entre dos `.md` | 1 | `[error] <file2>: duplicate slug 'X' (also in <file1>)` |
| Filename no respeta `YYYY-MM-<slug>.md` o slug no coincide | 1 | `[error] <file>: filename suffix does not match slug 'X'` |
| Bloque `<!-- blog:start -->`…`<!-- blog:end -->` en `index.html` difiere del regenerado | 1 | `blog-build: index.html is out of sync — run 'node scripts/build-blog.js' and commit.` |
| `blog/index.html` actual difiere del regenerado | 1 | `blog-build: blog/index.html is out of sync — run 'node scripts/build-blog.js' and commit.` |
| Algún `blog/<slug>.html` actual difiere del regenerado | 1 | `blog-build: blog/<slug>.html is out of sync — run 'node scripts/build-blog.js' and commit.` |
| Algún `blog/<slug>.html` existe sin `.md` correspondiente publicado (huérfano) | 1 | `blog-build: blog/<slug>.html is orphan (no source .md) — run build to remove.` |
| Falta `<!-- blog:start -->` o `<!-- blog:end -->` en `index.html` | 1 | `blog-build: missing markers in index.html` |

### Modo CLI normal (sin flags)

`node scripts/build-blog.js` reescribe in-place el bloque entre markers en `index.html`, regenera `blog/index.html` completo, emite cada `blog/<slug>.html` para posts publicados, y elimina HTML huérfano. Imprime un resumen:

```
blog-build: ✓ rendered N published post(s) — index.html (3 cards), blog/index.html (N entries), blog/<slug>.html × N
blog-build: removed K orphan file(s)
```

### Modo `--check`

- No escribe a disco.
- Re-genera todas las salidas en memoria.
- Compara byte-a-byte cada superficie:
  1. Bloque entre markers de `index.html`.
  2. `blog/index.html` completo.
  3. Cada `blog/<slug>.html` para posts publicados.
  4. Verifica que NO existen `blog/<slug>.html` sin `.md` publicado correspondiente.
- Exit 0 si todo coincide, exit 1 al primer mismatch (con diff acotado).

### Modo `--check-only-validation`

- Acepta `--input <path>` para apuntar a un único `.md`.
- Ejecuta solo: parse YAML + validación de schema + sanitización dry-run.
- No emite HTML, no compara contra archivos existentes.
- Exit ≠ 0 al primer error de validación.
- Usado por `tests/blog-schema.sh` para iterar fixtures negativos.

---

## 2. Fixtures negativas (`tests/blog-schema.sh`)

El script bash itera sobre `content/blog/__fixtures__/invalid-*.md`. Para cada uno:

1. Ejecuta `node scripts/build-blog.js --check-only-validation --input <fixture>`.
2. Exige exit ≠ 0 (fallo esperado).
3. Imprime una línea `OK <fixture>` o `FAIL <fixture> (validó cuando debía rechazar)`.

Al final, si todos los fixtures fallaron como debían: exit 0 y resumen `OK: N fixture(s) correctly rejected`. Si alguno pasó: exit 1.

Adicionalmente, el script verifica el caso XSS:

4. Ejecuta `node scripts/build-blog.js --check-only-validation --input content/blog/__fixtures__/xss-attempt.md` capturando el HTML sanitizado en stdout (con un flag adicional `--emit-sanitized` o vía `--out /tmp/`).
5. Verifica con `grep` que el resultado NO contiene: `<script`, `<iframe`, `onerror=`, `onload=`, `javascript:`, `style=`, `<form`, `<button`, `vbscript:`.
6. Falla si alguno aparece.

### Fixtures requeridas (mínimo)

| Archivo | Defecto | Mensaje esperado |
|---|---|---|
| `valid-minimal.md` | post válido mínimo (slug=test-foo) | (no se ejecuta como negativo, sirve como par para duplicate-slug) |
| `invalid-missing-title.md` | sin `title` | `missing required field 'title'` |
| `invalid-bad-date.md` | `date: 2026-13-01` | `invalid date format` o `not a valid calendar date` |
| `invalid-duplicate-slug.md` | mismo `slug: test-foo` que valid-minimal | `duplicate slug 'test-foo'` |
| `invalid-summary-too-short.md` | summary `"hi"` (2 chars) | `field 'summary' must be 20..280 chars (got 2)` |
| `invalid-summary-too-long.md` | summary > 280 chars | `field 'summary' must be 20..280 chars (got NNN)` |
| `invalid-published-not-bool.md` | `published: "true"` | `field 'published' must be boolean (got string)` |
| `xss-attempt.md` | body con `<script>alert(1)</script>`, `<a href="javascript:…">`, `<img src=x onerror=…>`, `<iframe>`, `<form>`, `<button onclick>`, `<div style=>` | NO falla validación; verifica que el HTML emitido tras sanitización NO contiene los vectores |

Cada fixture es un `.md` autocontenido con frontmatter y body mínimo.

---

## 3. Side-effects esperados en CI

- `blog-build-check` corre **en paralelo** con todas las gates existentes. No depende de ninguna ni nadie depende de ella.
- Tiempo de ejecución estimado: < 15 segundos (incluye `npm ci` para instalar marked/dompurify/jsdom/gray-matter; el build mismo es ~2 s).
- Optimización: si el repo ya cachea `node_modules` por ETag de `package-lock.json`, `npm ci` es <5 s. Coordinar con cache strategy del workflow existente (la gate `interviews-*` ya hace `npm ci`).

---

## 4. Política de regeneración

- El autor humano corre `node scripts/build-blog.js` localmente al editar `content/blog/` y commitea **todos** los archivos cambiados (`.md` + HTML afectados) en el mismo commit.
- Si el autor olvida regenerar, el `--check` falla en CI con el mensaje exacto del archivo desincronizado.
- Si el autor regenera pero no commitea el `.md`, el `--check` también falla (la salida no coincidiría con un `.md` desactualizado).
- Esta política es manual e intencional (R-012, paralela a R-011 de spec 005): preferimos ruido en PR que magia automática con PATs.

---

## 5. Convivencia con otras gates

| Gate | Relación con `blog-build-check` |
|---|---|
| `a11y` (axe-core) | DEBE ejecutarse contra `blog/index.html` y al menos un `blog/<slug>.html`. Modificar `tests/a11y.js` para añadir esas URLs. |
| `html-validate` | DEBE incluir `blog/index.html` y un `blog/<slug>.html` representativo (extender el comando en `package.json`). |
| `pipeline-build-check` | independiente; coexisten sin acoplarse. |
| `interviews-*` | independiente. |
| `link-check` | DEBE descubrir los nuevos archivos `blog/*.html` automáticamente al recorrer el sitio. |
| `forbidden-urls.sh` | DEBE seguir verde (cero CDNs en posts emitidos). |
| `no-placeholders.sh` | DEBE seguir verde (los posts reales no usan placeholders). |
