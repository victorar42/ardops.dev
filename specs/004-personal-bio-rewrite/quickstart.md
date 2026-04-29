# Quickstart — Reescritura de Bio Personal

**Feature**: 004-personal-bio-rewrite
**Date**: 2026-04-28
**Audience**: cualquiera que ejecute `/speckit.implement` para esta feature, o un futuro contributor que quiera refrescar el copy.

Este quickstart cubre dos runbooks independientes:

- **Runbook A — Editorial**: aplicar el copy aprobado en [contracts/copy-contract.md](contracts/copy-contract.md) sobre `index.html`.
- **Runbook B — Gate de CI**: añadir y wirear `tests/no-placeholders.sh` en `.github/workflows/ci.yml`.

Ambos se ejecutan en el mismo PR.

---

## Prerrequisitos

```bash
cd /path/to/ardops.dev
git checkout 004-personal-bio-rewrite
test -f specs/004-personal-bio-rewrite/contracts/copy-contract.md  # debe existir
test -d node_modules || npm install --no-audit --no-fund
```

---

## Runbook A — Editorial (US1)

### Paso 1 — abrir `index.html` y localizar bloques

```bash
grep -nE '<p class="hero-desc">|class="about-text"|name="description"|property="og:description"' index.html
```

Las líneas resultantes (aproximadas según estado actual):

```
~152:        <p class="hero-desc">…</p>
~245:        <div class="about-text">
~248:          <p>…</p>     # Párrafo 1 actual del about
~249:          <p>…</p>     # Párrafo 2 actual del about
~250:          <p class="about-stack">…</p>
…head: <meta name="description" content="…">
…head: <meta property="og:description" content="…">
```

### Paso 2 — reemplazar `HeroBio.text`

Sustituir el contenido entre `<p class="hero-desc">` y `</p>` por la cadena exacta de [contracts/copy-contract.md §1](contracts/copy-contract.md). Mantener `<p class="hero-desc">` como wrapper.

### Paso 3 — reemplazar `AboutBlock.paragraphs`

Sustituir los **dos `<p>` actuales** dentro de `.about-text` por **tres `<p>`** con los textos exactos de [contracts/copy-contract.md §2](contracts/copy-contract.md). El `<p class="about-stack">` se conserva sin tocarlo (R-011).

### Paso 4 — actualizar metas

Reemplazar el `content="…"` de `<meta name="description">` y `<meta property="og:description">` con la cadena de [contracts/copy-contract.md §3 y §4](contracts/copy-contract.md). Ambas DEBEN ser idénticas.

### Paso 5 — auditar otros archivos servidos

```bash
grep -nE '\[Tu Nombre\]' 404.html talks/index.html blog/index.html sitemap.xml robots.txt public/favicon/site.webmanifest 2>/dev/null
# Esperado: sin output

grep -nE '\bTODO\b|\bFIXME\b|\bXXX\b' 404.html talks/index.html blog/index.html 2>/dev/null
# Esperado: sin output (si hay output, decidir caso por caso si ajustar copy o si es legítimo en una sintaxis específica)
```

### Paso 6 — verificar caracteres invisibles

```bash
LC_ALL=C grep -PnH '[\x{200B}\x{200C}\x{FEFF}]' index.html
# Esperado: sin output
```

### Paso 7 — validar HTML

```bash
npx html-validate index.html blog/index.html talks/index.html 404.html
# Esperado: 0 errores
```

### Paso 8 — validar accesibilidad

```bash
# Terminal 1
npx --yes serve -l 8080 .

# Terminal 2
node tests/a11y.js
# Esperado: ✓ all N URLs pass WCAG 2.1 AA
```

### Paso 9 — smoke visual

Abrir `http://localhost:8080/` en navegador. Verificar:

- [ ] El `h1` muestra "Victor Josue Ardón Rojas." con la tilde y el punto en `.accent`.
- [ ] El párrafo del hero está en primera persona, ~60 palabras, sin enumeración técnica.
- [ ] El bloque "Sobre mí" tiene 3 párrafos (los 2 nuevos + el chip stack).
- [ ] El último párrafo del about menciona explícitamente la familia y/o fútbol y cierra con la invitación al contacto.
- [ ] En DevTools mobile (responsive 360 × 640 px), el hero se lee sin scroll horizontal y el botón "Techno Week 8.0" sigue visible above-the-fold.

### Paso 10 — commit

```bash
git add index.html
git commit -m "feat(content): reescritura de bio personal con tono cálido (spec 004)"
```

---

## Runbook B — Gate de CI (US2)

### Paso 1 — crear `tests/no-placeholders.sh`

Implementación literal (≤ 30 líneas, alineada con [contracts/no-placeholders-gate.md](contracts/no-placeholders-gate.md)):

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Whitelist de archivos servidos (los inexistentes se omiten silenciosamente).
files=(
  index.html
  404.html
  blog/index.html
  talks/index.html
  sitemap.xml
  robots.txt
  public/favicon/site.webmanifest
)

shopt -s nullglob
files+=(interviews/index.html interviews/*.html)

# Filtrar solo los que existen.
existing=()
for f in "${files[@]}"; do [ -f "$f" ] && existing+=("$f"); done

if [ ${#existing[@]} -eq 0 ]; then
  echo "FAIL: no served files found to audit" >&2
  exit 2
fi

PATTERNS='\[Tu Nombre\]|\bTODO\b|\bFIXME\b|\bXXX\b'

if grep -nHE "$PATTERNS" "${existing[@]}"; then
  echo "FAIL: placeholder hit in served file" >&2
  exit 1
fi

echo "OK: 0 placeholders found across ${#existing[@]} served files (patterns: [Tu Nombre], TODO, FIXME, XXX)"
```

```bash
chmod +x tests/no-placeholders.sh
```

### Paso 2 — verificar localmente

```bash
bash tests/no-placeholders.sh
# Esperado: OK: 0 placeholders found across N served files (...)
```

Test del modo rojo (opcional pero recomendado antes de wireup):

```bash
echo '<!-- TODO: probar gate -->' >> 404.html
bash tests/no-placeholders.sh
# Esperado: exit 1, hit reportado en 404.html
git checkout 404.html
```

### Paso 3 — añadir job en CI

Editar `.github/workflows/ci.yml` y añadir el siguiente job (al nivel de los demás `interviews-*`):

```yaml
no-placeholders:
  name: No placeholders gate (spec 004)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run no-placeholders gate
      run: bash tests/no-placeholders.sh
```

### Paso 4 — commit

```bash
git add tests/no-placeholders.sh .github/workflows/ci.yml
git commit -m "feat(ci): no-placeholders gate (spec 004)"
```

---

## Verificación final pre-merge

```bash
# Gates locales
npx html-validate index.html blog/index.html talks/index.html 404.html
bash tests/no-placeholders.sh
bash tests/forbidden-urls.sh
bash tests/interviews-xss.sh   2>/dev/null || true   # (no aplica si no hay build de interviews)
bash tests/interviews-size.sh  2>/dev/null || true

# Servir y auditar a11y
npx --yes serve -l 8080 . &
SERVE_PID=$!
sleep 3
node tests/a11y.js
kill $SERVE_PID
```

Esperado: todas las gates en exit 0, axe-core sin violaciones.

Listo para PR.

---

## Rollback

Si tras el merge se detecta una regresión tonal, revertir el commit del runbook A:

```bash
git revert <hash-del-commit-de-bio>
```

El gate `no-placeholders` puede mantenerse en su sitio aunque el copy se revierta — protege independientemente de la elección textual.
