# Quickstart — Shared nav & footer (spec 008)

**Audiencia**: el editor del sitio (vos) o cualquier maintainer futuro.
Cómo regenerar localmente, validar gates, y resolver fallos.

---

## Setup (una sola vez)

Asegurate de tener Node 20+ y las devDependencies instaladas:

```bash
node --version          # v20.x mínimo
npm install             # confirma node_modules sincronizado
```

No se agregan dependencias nuevas en esta spec.

## Workflow normal — agregar/renombrar item del menú

1. Editar `scripts/lib/layout.js`. Modificar el array `NAV` (agregar
   item, renombrar `label`, reordenar).
2. Regenerar **todo**:
   ```bash
   node scripts/build-layout.js          # actualiza index.html, 404.html, talks/
   node scripts/build-blog.js            # regenera blog
   node scripts/build-interviews.js      # regenera interviews
   ```
3. Validar:
   ```bash
   bash tests/nav-consistency.sh
   npm run html-validate
   ```
4. Commit con mensaje claro: `nav: rename "Charlas" to "Talks"`.

## Workflow normal — agregar página nueva al menú

Si vas a publicar `/uses/index.html` (futura spec):

1. Crear el archivo `uses/index.html` con los markers
   `<!-- nav:start --> ... <!-- nav:end -->` y
   `<!-- footer:start --> ... <!-- footer:end -->`.
2. Agregar al array `NAV` en `scripts/lib/layout.js`:
   ```js
   { href: '/uses/', label: 'Uses', match: ['/uses/'] },
   ```
3. Agregar `'uses/index.html'` al array de archivos procesados por
   `scripts/build-layout.js`.
4. Regenerar y validar (pasos 2-3 del flujo anterior).

## Validación local (todos los gates)

```bash
# Layout sync (idempotencia de markers)
node scripts/build-layout.js --check

# Blog y interviews siguen en sync
node scripts/build-blog.js --check
node scripts/build-interviews.js --check
node scripts/build-pipeline.js --check

# Consistencia de nav y footer entre todas las páginas servidas
bash tests/nav-consistency.sh

# HTML válido
npm run html-validate

# Accesibilidad
( nohup npx --yes serve -l 8080 . > /tmp/serve.log 2>&1 & ); sleep 3
node tests/a11y.js
pkill -f "serve -l 8080"
```

## Resolución de fallos

### `nav-consistency: páginas tienen <nav> distintos`

El gate detectó drift. Causas comunes:

1. **Editaste un `<nav>` a mano en lugar de regenerar**: ejecutá
   `node scripts/build-layout.js` (para home/404) o el build que
   corresponda.
2. **Cambió `scripts/lib/layout.js` pero no regeneraste**: ejecutá los
   tres `build-*.js`.
3. **Una página no tiene markers**: agregalos. Patrón:
   ```html
   <!-- nav:start -->
   <!-- nav:end -->
   ```
   colocado donde va el `<header>`.

### `build-layout: index.html missing markers '<!-- nav:start -->'`

`index.html` no tiene los markers. Agregalos manualmente entre
`<a class="skip-link">` y el primer `<main>` (o donde el header debe ir).

### `axe-core: aria-current violation`

Probablemente hay más de un `aria-current="page"` en una página
(double match). Revisá que ningún `match` de `NAV` se solape con otro
item. Solo páginas reales tienen `match` no-vacío; los anchors
(`isAnchor: true`) deben tener `match: []`.

### `html-validate: error en blog/index.html`

Los generadores `build-*.js` emiten HTML que pasa html-validate por
diseño. Si se rompe después de esta spec, revisá que `renderHeader()`
no haya emitido un fragmento mal formado (verificá comillas, atributos
sin cerrar). El módulo es puro y testeable, abrí Node REPL:

```bash
node -e 'console.log(require("./scripts/lib/layout").renderHeader("/blog/"))'
```

## Comandos útiles para desarrollo

```bash
# Ver el HTML que el módulo emite para una ruta dada
node -e 'console.log(require("./scripts/lib/layout").renderHeader("/blog/"))'
node -e 'console.log(require("./scripts/lib/layout").renderFooter())'

# Diff entre dos pages para ver qué difiere en el nav
diff <(grep -A20 'site-header' blog/index.html) \
     <(grep -A20 'site-header' interviews/index.html)
```

## Smoke test manual (post-implementación)

1. Abrir `/blog/` — verificar que "Blog" tiene visual de active state.
2. Click en "Entrevistas" — confirmar navegación a `/interviews/` y que
   "Entrevistas" tiene active state.
3. Click en "Pipeline" desde `/blog/` — confirmar navegación a `/#pipeline`
   (home + scroll a sección).
4. Abrir VoiceOver / NVDA en `/talks/` — confirmar que el lector
   anuncia "Charlas, página actual" o equivalente.
5. Abrir `/404` (escribir una URL inexistente) — confirmar que el nav
   y footer aparecen y NINGÚN item está marcado como activo.
