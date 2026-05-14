# Quickstart: Syntax highlighting build-time (Shiki)

**Feature**: 016-syntax-highlighting

Guía operacional para autor del blog y revisores tras `/speckit.implement`.

---

## Como autor: publicar un post con código

1. Crear `content/blog/2026-MM-DD-mi-post.md` con frontmatter habitual.
2. Escribir bloques con fenced language tag:
   ````markdown
   ```bash
   curl -fsSL https://ardops.dev | tee /tmp/out
   ```

   ```typescript
   const greet = (name: string) => `hola, ${name}`;
   ```
   ````
3. Si el lenguaje no está en la allowlist (`bash, sh, javascript,
   typescript, json, yaml, dockerfile, hcl, python, go, rust, sql,
   diff, html, css, markdown, ini, toml, makefile, groovy, nginx`),
   el bloque se renderiza mono plano y el builder loguea un warning.
4. Correr `npm run build:blog`.
5. Inspeccionar `blog/<slug>.html`: los bloques deben verse coloreados.
6. Validar gates: `npm run gates:local`.

---

## Como autor: regenerar el stylesheet (raro)

Solo si cambia el **tema** o la **allowlist**:

```bash
node scripts/build-syntax-css.js
git diff assets/css/syntax.css   # revisar el delta
```

El archivo está sujeto a budget: `gzip -c -9 assets/css/syntax.css | wc -c`
debe retornar ≤ 5120.

---

## Como revisor: validar la PR

```bash
# 1. Suite local completa
npm run gates:local

# 2. Gates específicos de syntax
bash tests/syntax-css-size.sh
bash tests/no-inline-styles-blog.sh
bash tests/build-blog-check.sh
bash tests/csp-no-unsafe-inline.sh

# 3. Verificación visual
open blog/syntax-highlighting-demo.html
# Confirmar:
#  - colores legibles
#  - keywords y strings diferenciables
#  - bloques fallback (si los hay) en mono plano

# 4. Verificación de carga condicional
grep -l "syntax.css" blog/*.html   # solo posts con código deben aparecer

# 5. Verificación CSP
grep -c "unsafe-inline" blog/*.html  # → 0 todos
grep -cE 'style="' blog/*.html       # → 0 todos
```

---

## Como auditor: AC del backlog

| AC | Verificación |
|---|---|
| AC-01 | Abrir post con bloque bash → ver colores. |
| AC-02 | `grep -L "syntax.css" blog/*.html` — posts sin código no deben aparecer si están sin syntax.css; revisar mapping. |
| AC-03 | `grep -c "unsafe-inline" blog/*.html` → 0. |
| AC-04 | `bash tests/build-blog-check.sh` exit 0 con fixture multi-lang. |
| AC-05 | `gzip -c -9 assets/css/syntax.css | wc -c` ≤ 5120. |
| AC-06 | `git diff package.json` muestra solo `shiki` en `devDependencies`, cero en `dependencies`. |

---

## Troubleshooting

**El builder loguea `[blog] ⚠ unknown language: X`**
- `X` no está en la allowlist. Decisiones posibles:
  - Cambiar el fenced tag a uno soportado (`hcl` en vez de `terraform`).
  - Agregar `X` a la allowlist (ver `contracts/language-allowlist.md`).
  - Aceptar el fallback (mono plano).

**Lighthouse Performance bajó de 95**
- Revisar `tests/byte-budgets.sh` por página. Si `syntax.css` se está
  cargando en posts sin código, hay un bug en la lógica condicional.

**Aparece `style="..."` en un post**
- Ejecutar `bash tests/no-inline-styles-blog.sh` para localizar.
- Verificar que el transform `style → class` corre antes de DOMPurify
  (no después).
- Re-build y comparar; si persiste, abrir issue con el fixture mínimo.

**`syntax.css` cambia byte-a-byte entre runs**
- El generador no es determinista. Revisar `scripts/build-syntax-css.js`
  por timestamps, ordenamiento de keys, o iteración sobre `Map` /
  `Set` no estable.

**Build CI > 8 s para un post**
- Verificar que la allowlist precargada en Shiki sea solo las 21
  gramáticas (no `loadAll`).
- Considerar cachear el highlighter entre posts dentro del mismo run.
