# Contract — `tests/nav-consistency.sh`

**Spec**: [../spec.md](../spec.md) (FR-017) · **Plan**: [../plan.md](../plan.md)

Comportamiento del gate de validación de consistencia.

---

## Propósito

Detectar y bloquear **drift** entre el HTML del `<nav>` / `<footer>`
servido por las distintas páginas y la fuente de verdad
(`scripts/lib/layout.js`).

## Forma de invocación

```bash
bash tests/nav-consistency.sh
```

Sin argumentos. Lee desde el cwd del repo.

## Páginas evaluadas

Lista hardcoded en el script (mantenida explícitamente):

- `index.html`
- `404.html`
- `blog/index.html`
- `blog/<slug>.html` (todos los publicados, descubiertos vía glob)
- `interviews/index.html`
- `interviews/<slug>.html` (todos los publicados, descubiertos vía glob)
- `talks/index.html`

## Validaciones aplicadas

Para cada página, el gate verifica:

1. **V-1 — Skip link presente**: existe `<a class="skip-link" href="#main">`
   como primer elemento del `<body>`.
2. **V-2 — Header presente**: existe `<header class="site-header">`.
3. **V-3 — Nav estructura**: existe `<nav class="site-nav"
   aria-label="Navegación principal">` dentro del header.
4. **V-4 — Logo correcto**: existe `<a href="/" class="nav-logo">ardops<span>.dev</span></a>`.
   Específicamente `href="/"` (no `#`, no path relativo).
5. **V-5 — Items coinciden con `NAV`**: el `<ul class="nav-links">`
   tiene exactamente los items definidos en
   `scripts/lib/layout.js#NAV`, en el mismo orden, con los mismos
   labels y los mismos `href`.
6. **V-6 — Active state correcto**:
   - Para `index.html` (currentPath `/`): el item "Home" tiene
     `aria-current="page"` y los demás no.
   - Para `blog/*.html`: el item "Blog" tiene `aria-current="page"`.
   - Para `interviews/*.html`: el item "Entrevistas" tiene
     `aria-current="page"`.
   - Para `talks/index.html`: el item "Charlas" tiene `aria-current="page"`.
   - Para `404.html`: ningún item tiene `aria-current="page"`.
7. **V-7 — Footer estructura**: existe `<footer class="site-footer">`
   con la forma exacta del [footer contract](footer-html-contract.md).
8. **V-8 — Footer byte-equivalente**: el footer normalizado (whitespace
   colapsado) es idéntico entre todas las páginas evaluadas.

## Implementación

El script es un **wrapper bash** que invoca un script Node:

```bash
#!/usr/bin/env bash
set -euo pipefail
node scripts/check-nav-consistency.js "$@"
```

El script Node usa `jsdom` (devDep ya instalada) para parsear el DOM
de cada página. Al detectar una violación, imprime un mensaje claro:

```
nav-consistency: blog/2026-05-pipeline-seguridad.html
  V-6 FAIL: expected "Blog" to have aria-current="page", got "Entrevistas"
```

Y termina con exit code != 0.

## Salida exitosa

```
OK: nav-consistency — 7 page(s) validated against scripts/lib/layout.js
```

Exit code 0.

## Salida fallida

```
nav-consistency: 2 violation(s)
  blog/2026-05-pipeline-seguridad.html
    V-5 FAIL: item 3 expected label="Charlas", got "Charla"
  index.html
    V-4 FAIL: logo href expected "/", got "#"

→ run `node scripts/build-layout.js` (for index.html, 404.html, talks/) and `node scripts/build-blog.js` to regenerate
```

Exit code 1.

## Integración en CI

Se agrega al workflow existente (al lado de `npm run html-validate`):

```yaml
- name: nav consistency
  run: bash tests/nav-consistency.sh
```

## No hace

- **No corre el build automáticamente** (eso es responsabilidad del
  desarrollador o de un job separado).
- **No formatea ni reescribe el HTML**.
- **No verifica CSS** (esta spec no toca styling).
- **No verifica subpáginas dinámicas** que no estén en disco al momento
  de correr (e.g., posts en draft).

## Rendimiento esperado

Para 8-15 páginas, debe completarse en < 2 segundos en CI.
`jsdom` es lento de cargar (~500ms) pero el resto es operación de
strings.

## Requisitos del entorno

- Node 20+.
- `jsdom` en `node_modules/` (ya viene de spec 006).
- bash 4+ (estándar en macOS/Linux).
