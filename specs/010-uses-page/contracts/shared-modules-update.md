# Contract: módulos compartidos — diffs esperados

**Feature**: 010-uses-page
**Phase**: 1 (design)

Diff exacto que la implementación debe producir en cada módulo
compartido. Si difiere, una de las gates falla.

---

## D-1. `scripts/lib/layout.js` — extender `NAV`

**Antes**:

```js
const NAV = Object.freeze([
  Object.freeze({ href: '/',            label: 'Home',        match: Object.freeze(['/']) }),
  Object.freeze({ href: '/#pipeline',   label: 'Pipeline',    match: Object.freeze([]), isAnchor: true }),
  Object.freeze({ href: '/blog/',       label: 'Blog',        match: Object.freeze(['/blog/']) }),
  Object.freeze({ href: '/interviews/', label: 'Entrevistas', match: Object.freeze(['/interviews/']) }),
  Object.freeze({ href: '/talks/',      label: 'Charlas',     match: Object.freeze(['/talks/']) }),
  Object.freeze({ href: '/#contact',    label: 'Contacto',    match: Object.freeze([]), isAnchor: true }),
]);
```

**Después**:

```js
const NAV = Object.freeze([
  Object.freeze({ href: '/',            label: 'Home',        match: Object.freeze(['/']) }),
  Object.freeze({ href: '/#pipeline',   label: 'Pipeline',    match: Object.freeze([]), isAnchor: true }),
  Object.freeze({ href: '/blog/',       label: 'Blog',        match: Object.freeze(['/blog/']) }),
  Object.freeze({ href: '/interviews/', label: 'Entrevistas', match: Object.freeze(['/interviews/']) }),
  Object.freeze({ href: '/talks/',      label: 'Charlas',     match: Object.freeze(['/talks/']) }),
  Object.freeze({ href: '/uses/',       label: 'Uses',        match: Object.freeze(['/uses/']) }),
  Object.freeze({ href: '/#contact',    label: 'Contacto',    match: Object.freeze([]), isAnchor: true }),
]);
```

**Efecto colateral esperado**: el nav de TODAS las páginas servidas
(`index.html`, `404.html`, `talks/index.html`, `blog/*.html`,
`interviews/*.html`, `uses/index.html`) gana la entrada "Uses". La gate
`tests/nav-consistency.sh` requerirá rebuilds: `node scripts/build-blog.js`,
`node scripts/build-interviews.js --strict --out interviews/`,
`node scripts/build-layout.js`.

## D-2. `scripts/build-layout.js` — extender `PAGES`

**Antes**:

```js
const PAGES = [
  { file: 'index.html',       currentPath: '/' },
  { file: '404.html',         currentPath: '/404' },
  { file: 'talks/index.html', currentPath: '/talks/' },
];
```

**Después**:

```js
const PAGES = [
  { file: 'index.html',       currentPath: '/' },
  { file: '404.html',         currentPath: '/404' },
  { file: 'talks/index.html', currentPath: '/talks/' },
  { file: 'uses/index.html',  currentPath: '/uses/' },
];
```

## D-3. `scripts/check-csp.js` — extender `STATIC_PAGES`

**Antes**:

```js
const STATIC_PAGES = ['index.html', '404.html', 'talks/index.html'];
```

**Después**:

```js
const STATIC_PAGES = ['index.html', '404.html', 'talks/index.html', 'uses/index.html'];
```

## D-4. `scripts/check-nav-consistency.js` — extender `STATIC_PAGES`

**Antes**:

```js
const STATIC_PAGES = [
  { file: 'index.html',       currentPath: '/' },
  { file: '404.html',         currentPath: '/404' },
  { file: 'talks/index.html', currentPath: '/talks/' },
];
```

**Después**:

```js
const STATIC_PAGES = [
  { file: 'index.html',       currentPath: '/' },
  { file: '404.html',         currentPath: '/404' },
  { file: 'talks/index.html', currentPath: '/talks/' },
  { file: 'uses/index.html',  currentPath: '/uses/' },
];
```

## D-5. `scripts/check-sitemap-drift.js` — sin cambios

El gate descubre páginas servidas vía la unión de glob/listas y compara con
los sitemaps. Con la nueva entrada en `sitemap.xml` y `uses/index.html` en
disco, el gate pasa sin modificaciones al script.

> **Verificación**: si al ejecutar la gate falla con "served page without
> canonical not in allowlist", revisar que `uses/index.html` declara
> `<link rel="canonical">` (C-1).

## D-6. `sitemap.xml` — añadir entrada

**Diff** (insertar al final, antes de `</urlset>`):

```xml
  <url>
    <loc>https://ardops.dev/uses/</loc>
    <lastmod>2026-05-12</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
```

`changefreq=yearly` y `priority=0.6` reflejan la cadencia editorial real.
`lastmod` se actualiza al editar la página.

## D-7. `tests/a11y.js` — añadir URL

**Antes**:

```js
const URLS = [
  'http://localhost:8080/',
  'http://localhost:8080/blog/',
  'http://localhost:8080/blog/pipeline-seguridad-spec-driven.html',
  'http://localhost:8080/talks/',
  'http://localhost:8080/404',
  'http://localhost:8080/interviews/',
  'http://localhost:8080/interviews/valid-minimal.html'
];
```

**Después** (añadir `/uses/` después de `/talks/`):

```js
const URLS = [
  'http://localhost:8080/',
  'http://localhost:8080/blog/',
  'http://localhost:8080/blog/pipeline-seguridad-spec-driven.html',
  'http://localhost:8080/talks/',
  'http://localhost:8080/uses/',
  'http://localhost:8080/404',
  'http://localhost:8080/interviews/',
  'http://localhost:8080/interviews/valid-minimal.html'
];
```

## D-8. `.github/copilot-instructions.md` — actualizar marker SPECKIT

**Antes**:

```markdown
<!-- SPECKIT START -->
**Plan activo**: [`specs/009-security-headers-hardening/plan.md`](../specs/009-security-headers-hardening/plan.md)
<!-- SPECKIT END -->
```

**Después**:

```markdown
<!-- SPECKIT START -->
**Plan activo**: [`specs/010-uses-page/plan.md`](../specs/010-uses-page/plan.md)
<!-- SPECKIT END -->
```
