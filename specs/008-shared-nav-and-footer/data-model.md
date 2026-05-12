# Phase 1 — Data Model: Shared nav & footer

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Research**: [research.md](research.md)

## Entidades

### `NavItem`

Una entrada del menú principal.

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `href` | string | Sí | URL absoluta. Para páginas reales termina en `/` (`/blog/`, `/interviews/`, `/talks/`). Para anchors a home: `/#pipeline`, `/#contact`. Para home: `/`. |
| `label` | string | Sí | Texto visible al usuario. Lenguaje es-CR. |
| `match` | string[] | Sí | Array de paths canónicos que activan `aria-current="page"` para este item. Para items de página típicamente `[href]`. Para items de anchor: `[]` (nunca matchean). |
| `isAnchor` | boolean | Opcional (default `false`) | `true` si el item apunta a un fragment de home. Estos items no llevan `aria-current` desde otras páginas. |

**Validación**:

- `href` no puede ser vacío.
- `label` no puede ser vacío ni contener `<`, `>`.
- `match` debe ser array (puede ser vacío para anchors).

**Estado inicial (FR-002)**:

```js
const NAV = [
  { href: '/',             label: 'Home',        match: ['/'] },
  { href: '/#pipeline',    label: 'Pipeline',    match: [], isAnchor: true },
  { href: '/blog/',        label: 'Blog',        match: ['/blog/'] },
  { href: '/interviews/',  label: 'Entrevistas', match: ['/interviews/'] },
  { href: '/talks/',       label: 'Charlas',     match: ['/talks/'] },
  { href: '/#contact',     label: 'Contacto',    match: [], isAnchor: true },
];
```

### `LayoutContext`

Contexto pasado a `renderHeader()` para decidir el active state.

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `currentPath` | string | Sí | Path canónico de la página actual. P.ej. `/blog/`, `/interviews/`, `/talks/`, `/`. Para `404.html` se pasa explícitamente `'/404'` (no matchea ningún item). Para subpáginas de blog/interviews se pasa el path del listing (`/blog/`, `/interviews/`) para que el item correspondiente se active. |

**Normalización aplicada por `renderHeader`**:

1. Lowercase.
2. Strip query y fragment (`/blog/?tag=foo#x` → `/blog/`).
3. Asegurar trailing slash si el path corresponde a directorio.
4. Excepción: `/` queda como `/` literal.

### `RenderedHeader`

Output de `renderHeader(currentPath)`. String HTML.

**Forma exacta**: ver [contracts/nav-html-contract.md](contracts/nav-html-contract.md).

### `RenderedFooter`

Output de `renderFooter()`. String HTML inmutable (no toma parámetros).

**Forma exacta**: ver [contracts/footer-html-contract.md](contracts/footer-html-contract.md).

## Relaciones

```
LayoutContext ─┐
               ├─► renderHeader() ──► RenderedHeader (HTML string)
NAV[] ─────────┘

(no input) ───────► renderFooter() ──► RenderedFooter (HTML string)
```

## Reglas de transformación `currentPath` → `aria-current`

```
Para cada item en NAV:
  if item.isAnchor === true:
    no se aplica aria-current
  else if item.match incluye currentPath normalizado:
    se aplica aria-current="page"
  else:
    no se aplica aria-current
```

**Invariantes**:

- A lo sumo UN item con `aria-current="page"` por render
  (ningún `match` se solapa entre items).
- Posiblemente CERO items con `aria-current` cuando `currentPath` no
  está en ningún `match` (caso 404 o páginas no-listadas).

## Estado / persistencia

N/A. El `NAV` es **estático en código**, parte del módulo
`scripts/lib/layout.js`. No hay storage, no hay base de datos, no hay
config externa. Cualquier cambio al menú es una edición de código +
PR + regeneración.

## Migración desde el estado actual

| Página | Estado actual | Estado tras migración |
|---|---|---|
| `index.html` | `<nav>` y `<footer>` inline, hardcoded | `<nav>` y `<footer>` rodeados por markers, contenido inyectado por `build-layout.js` |
| `404.html` | `<nav>` propio (a verificar) y `<footer>` posiblemente faltante | Markers + inyección desde `build-layout.js` |
| `blog/index.html` | Generado por `build-blog.js` con `<nav>` literal en string template | Generado por `build-blog.js` que llama a `renderHeader('/blog/')` |
| `blog/<slug>.html` | Generado por `build-blog.js` con `<nav>` literal | Generado con `renderHeader('/blog/')` (el item activo es Blog, no el slug) |
| `interviews/index.html` | Generado por `build-interviews.js` con `<nav>` literal | Generado con `renderHeader('/interviews/')` |
| `interviews/<slug>.html` | Generado por `build-interviews.js` con `<nav>` literal | Generado con `renderHeader('/interviews/')` |
| `talks/index.html` | Generado (verificar) o estático | Si generado: `renderHeader('/talks/')`. Si estático: marker pattern. |

**Nota sobre `talks/index.html`**: hoy probablemente es estático
(no hay `build-talks.js`). Se incluye en el alcance del marker pattern
junto con `index.html` y `404.html`. Si en futuro se crea
`build-talks.js`, migrar al import directo.
