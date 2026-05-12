# Contract — `scripts/lib/layout.js`

**Spec**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md)

API pública del módulo único de layout compartido.

---

## Tipo de módulo

CommonJS. Importar con `require`.

```js
const { NAV, renderHeader, renderFooter } = require('./scripts/lib/layout');
```

## Exports

### `NAV` (constante)

Array readonly de `NavItem` (ver [data-model.md](../data-model.md)).
Es el contrato del menú oficial. Cambiarlo cambia todas las páginas.

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

**Reglas de modificación**: ver [data-model.md](../data-model.md) §Validación.

### `renderHeader(currentPath: string): string`

Devuelve el HTML del shell superior (skip link + `<header>` con `<nav>`),
con `aria-current="page"` aplicado al item correspondiente a
`currentPath`.

**Parámetro**:
- `currentPath` (string, requerido) — path canónico. Ver
  [data-model.md](../data-model.md) §LayoutContext §Normalización.

**Retorno**: string HTML. Forma exacta en
[nav-html-contract.md](nav-html-contract.md).

**Determinismo**:
- Misma `currentPath` → mismo string (idempotente).
- Sin side effects (no I/O, no estado mutable).
- No depende de `process.env`, `Date`, ni nada externo.

**Errores**:
- Si `currentPath` no es string → `throw new TypeError`.
- Si `currentPath` es string vacío → tratado como `/`.

### `renderFooter(): string`

Devuelve el HTML del `<footer class="site-footer">`. No toma parámetros
(idéntico para todas las páginas).

**Retorno**: string HTML. Forma exacta en
[footer-html-contract.md](footer-html-contract.md).

**Determinismo**: misma salida siempre, mientras no se modifique el
módulo.

### `normalizePath(p: string): string` (helper, opcional pero exportado)

Convierte un path arbitrario en su forma canónica para matching:

```
/Blog/?tag=x#abc   →  /blog/
/blog              →  /blog/
/                  →  /
'' o null/undefined → /
```

Útil para que los generadores construyan el `currentPath` que pasan a
`renderHeader()` sin duplicar lógica.

## Reglas de uso desde generadores

```js
// scripts/build-blog.js
const { renderHeader, renderFooter } = require('./lib/layout');

function renderBlogIndex(posts) {
  return `<!doctype html>
<html lang="es">
<head> ... </head>
<body>
${renderHeader('/blog/')}
<main id="main"> ... </main>
${renderFooter()}
</body>
</html>`;
}
```

## Tests del módulo (unit)

Aunque la spec no exige unit tests separados (el gate de consistencia
los cubre transitivamente), el módulo debe ser **directamente
ejecutable en REPL** para inspección rápida:

```bash
node -e 'console.log(require("./scripts/lib/layout").renderHeader("/blog/"))'
```

Si el output difiere del contrato, el gate `tests/nav-consistency.sh`
fallará automáticamente.

## Versionado del contrato

Cualquier cambio que rompa esta API (renombrar export, cambiar firma
de función, cambiar forma del NavItem) requiere:

1. PR con justificación.
2. Actualización de este contrato.
3. Actualización de los 3+ consumidores (`build-blog.js`,
   `build-interviews.js`, `build-layout.js`, `build-pipeline.js` si
   llega a usarlo).
4. Pasar todos los gates.

Cambios **no breaking** (agregar export, agregar campo opcional al
NavItem): solo update de contrato + tests.
