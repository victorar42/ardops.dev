# Phase 0 — Research: Security headers hardening

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

Decisiones técnicas tomadas para resolver los puntos abiertos del spec
y los `NEEDS CLARIFICATION` implícitos del Technical Context.

---

## D-001 — Mecanismo CSP fix: A (CSS externo) sobre B (hash CSP)

**Decisión**: Adoptar **Mecanismo A** — extraer
`renderTagCssRules()` a `assets/css/blog-tag-rules.css` durante el
build y linkear con `<link rel="stylesheet">`. La CSP del blog vuelve
a ser exactamente igual a la del resto del sitio
(`style-src 'self'`).

**Rationale**:

- **Simpler**: cero manipulación de string CSP, cero coordinación
  entre el contenido del bloque y el contenido de la directiva.
- **Cache-friendly**: un único archivo CSS compartido por
  `blog/index.html` y todos los `blog/<slug>.html` (los posts no
  consumen las reglas hoy, pero si se decidiera más tarde no requiere
  cambio). Se cachea una vez.
- **Cero "drift mecánico"**: en Mecanismo B cada cambio de tag
  requiere recalcular SHA-256 y reescribir el meta CSP. Si alguien
  edita el bloque a mano (debugging) y olvida actualizar el hash, la
  página rompe silenciosamente. En Mecanismo A no hay nada que sincronizar.
- **CSP idéntica entre páginas**: refuerza el principio "una sola
  CSP en el sitio". Facilita el contrato del gate de CSP.

**Trade-off**: +1 request HTTP. **Mitigación**: GH Pages soporta
HTTP/2; el archivo es ~2-3 KB sin gzip; se cachea agresivamente. Net
impact en Lighthouse: indistinguible.

**Mecanismo B (hash CSP) — rechazado** porque:
- Cada modificación de tag (publicar post con tag nuevo) cambia el
  hash → cambio de CSP → harder to audit. El gate tendría que
  recalcular el hash para validar.
- El bloque inline aumenta el peso del HTML (peor para TTFB de la
  página principal).
- Mantenibilidad inferior.

---

## D-002 — Implementación de gates: Node + jsdom

**Decisión**: los tres gates (`csp-no-unsafe-inline.sh`,
`external-links.sh`, `sitemap-drift.sh`) son wrappers bash
(`#!/usr/bin/env bash`) que invocan scripts Node usando `jsdom`.

**Rationale**:

- **Consistencia con spec 008**: `tests/nav-consistency.sh` ya usa el
  mismo patrón. Mantener convención facilita lectura y mantenimiento.
- **`jsdom` ya devDep**: cero deps nuevas (constitución III, IV).
- **Robustez**: parsear DOM es mucho más estable que regex sobre
  HTML, especialmente para detectar `<a target="_blank">` con
  atributos en cualquier orden, o canonicals en cualquier posición
  del `<head>`.
- **Manejo robusto de XML para sitemap**: `jsdom` puede parsear
  XML strict. Alternativa con `xmllint` requiere brew/apt; jsdom
  ya está instalado en CI vía `npm ci`.

**Alternativas evaluadas**:

- **Bash + grep + awk**: frágil ante reformatting; no distingue
  comments de código; falsos positivos.
- **Bash + `pup`**: dep nueva (Go binary), no justificable.
- **Bash + `xmllint`**: disponible en runners Linux pero no en macOS
  por default; mantenibilidad inconsistente local vs CI.

---

## D-003 — Punto único de emisión del meta referrer: `scripts/lib/head.js`

**Decisión**: crear `scripts/lib/head.js`, módulo hermano de
`scripts/lib/layout.js` (spec 008), que exporta funciones para emitir
fragmentos comunes del `<head>`. Inicialmente expone:

```js
const { renderHeadMeta, renderHeadFavicons, renderHeadFonts } = require('./lib/head');
```

`renderHeadMeta({ csp, title, description, canonical, themeColor })`
emite el bloque que incluye `<meta charset>`, `<meta viewport>`,
`<meta http-equiv="Content-Security-Policy">`,
`<meta name="referrer" content="strict-origin-when-cross-origin">`,
`<meta name="theme-color">`, `<meta name="color-scheme">`,
`<meta name="author">`.

**Rationale**:

- **Single source of truth para el referrer meta** → cero drift entre
  páginas (FR-006).
- **Reduce duplicación inmediata**: `<meta charset>`, `<meta viewport>`,
  `<meta theme-color>`, `<meta color-scheme>`, `<meta author>` ya
  están duplicados en 6+ archivos hoy. Spec 009 no obliga a
  consolidar todo, pero mover el referrer meta abre la puerta.
- **Convención**: el repo ya tiene la noción de "cosas que se emiten
  desde un módulo" (spec 008 layout.js). Un módulo hermano para `head`
  es trivialmente extensible.

**Alcance reducido en esta spec**: para no expandir scope, esta spec
solo USA `renderHeadMeta` para emitir el referrer en el flujo de
build-blog.js, build-interviews.js y build-layout.js (vía marker
para páginas estáticas). El resto del head sigue como hoy. Una spec
futura puede consolidar el head completo.

**Alternativa rechazada**: agregar el meta referrer "manualmente" en
cada `<head>`. Hace el problema permanente y no escalable.

---

## D-004 — Sitemap: mantenido a mano (no auto-generado en esta spec)

**Decisión**: `sitemap.xml` sigue siendo mantenido a mano. La spec
solo agrega validación (drift gate). Como parte de la implementación
se agrega la entrada faltante detectada (`interviews/victor-ardon.html`).

**Rationale**:

- Auto-generación es un proyecto separado (cambio de invariante:
  ¿qué páginas se incluyen?, ¿con qué priority/changefreq?). Spec
  dedicada en backlog si se necesita.
- El gate ya cierra el problema en la práctica: cualquier omisión
  futura es bloqueada en CI. El editor recibe mensaje claro.

**Lista actual del sitemap (post-fix)**:
- `https://ardops.dev/`
- `https://ardops.dev/talks/`
- `https://ardops.dev/blog/`
- `https://ardops.dev/blog/pipeline-seguridad-spec-driven.html`
- `https://ardops.dev/interviews/`
- `https://ardops.dev/interviews/victor-ardon.html` ← AGREGADO en esta spec

---

## D-005 — Lista de exclusiones del sitemap: hardcoded en gate

**Decisión**: el gate `tests/sitemap-drift.sh` mantiene una lista
explícita de archivos servidos que **no** deben aparecer en sitemap:

```js
const EXCLUDED_FROM_SITEMAP = [
  '404.html',                       // página de error, no canonical
  'interviews/valid-minimal.html',  // fixture (XSS / schema)
  'interviews/xss-attempt.html',    // fixture (XSS / schema)
];
```

**Rationale**:

- **Explícito > implícito**: leer una lista hardcoded es trivial;
  inferir desde frontmatter de cada post requiere parsear markdown,
  reproducir lógica de build-blog.
- **Cambios al list son auditables**: cualquier modificación pasa por
  PR + review.
- **Falsos negativos imposibles**: si alguien publica un post nuevo y
  olvida sumarlo al sitemap, el gate falla. Si alguien quiere
  excluirlo conscientemente, debe editar la lista (acción
  deliberada, auditable).

**Alternativa rechazada**: heurística "todo HTML en disco menos los
que terminan en `-test.html`" — frágil, no semántica.

---

## D-006 — CSP también limpiada en `blog/<slug>.html`

**Decisión**: la constante `CSP` en `scripts/build-blog.js` (línea 83)
se actualiza para quitar `'unsafe-inline'` de `style-src`. Esto
afecta tanto al listing (`blog/index.html`) como a los posts
(`blog/<slug>.html`).

**Rationale**:

- Los posts NO tienen el bloque `<style id="blog-tag-rules">` (verificado
  con grep). El `'unsafe-inline'` en su CSP era simplemente
  consecuencia de compartir la constante.
- Quitarlo cierra completamente el agujero. CSP del blog (listing y
  posts) queda byte-equivalente a la del resto del sitio.

**Verificación**: `grep '<style' blog/pipeline-seguridad-spec-driven.html`
→ cero matches (solo hay `<link rel="stylesheet">`).

---

## D-007 — Path estable para `assets/css/blog-tag-rules.css`

**Decisión**: emitir el archivo a un path **fijo**:
`assets/css/blog-tag-rules.css`. Sin hash en el nombre. Cache-busting
se delega al deployment (commit hash en path no es necesario para GH
Pages, donde se sirve con `Cache-Control: max-age=600` por default).

**Rationale**:

- **Simplicidad de referencia**: el `<link>` apunta a un path
  literal, sin lógica de cache-busting.
- **Cambia poco**: el contenido depende de la lista de tags
  publicados. Aumenta lentamente.
- **GH Pages cache de 10 minutos** es aceptable para esta granularidad.
  Deploys recientes propagan en ~10 min.

**Alternativa rechazada**: hash en filename
(`blog-tag-rules-<sha>.css`). Beneficios mínimos, complejidad real
(actualizar referencia en HTML, limpiar versiones viejas).

---

## D-008 — Posición del `<link>` en la cascada CSS

**Decisión**: el `<link rel="stylesheet" href="/assets/css/blog-tag-rules.css">`
se emite **al final** de la cascada CSS del blog, después de
`components.css`:

```html
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/motion.css">
<link rel="stylesheet" href="/assets/css/layout.css">
<link rel="stylesheet" href="/assets/css/components.css">
<link rel="stylesheet" href="/assets/css/blog-tag-rules.css">
```

**Rationale**:

- Las reglas con `:has()` deben ganar sobre las reglas base de
  `.chip--filter` definidas en `components.css`. La cascada ordena por
  appearance order cuando la especificidad es similar.
- La regla actual inline ya estaba colocada después de toda la
  cascada (al final del `<head>`). Mantener el orden.

---

## D-009 — Aplicación del referrer meta en páginas estáticas

**Decisión**: `index.html`, `404.html`, `talks/index.html` reciben el
meta referrer mediante el mismo mecanismo de marker pattern que ya
usan para nav/footer (spec 008). Se introduce un nuevo marker:

```html
<!-- head-meta:start -->
<!-- head-meta:end -->
```

procesado por `scripts/build-layout.js` (extiende su responsabilidad).
Inicialmente solo emite el meta referrer; el resto del `<head>` queda
como está.

**Rationale**:

- Patrón ya conocido en el repo (consistencia, cero curva de
  aprendizaje).
- Permite agregar más metas comunes en el futuro sin recrear el
  patrón.

**Alternativa rechazada**: insertar el meta a mano en cada uno de
los 3 archivos. Trabaja una sola vez pero abre el problema cada vez
que se publique un nuevo archivo estático.

---

## D-010 — Nivel de validación del gate CSP

**Decisión**: el gate `tests/csp-no-unsafe-inline.sh` hace dos cosas:

1. **Prohibir** los tokens literales `'unsafe-inline'` y
   `'unsafe-eval'` en cualquier directiva.
2. **Exigir** que la CSP contiene como mínimo las directivas:
   `default-src 'self'`, `script-src 'self'`,
   `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`,
   `form-action 'self'`.

**Rationale**: un gate puramente prohibitivo permite que alguien
publique una página sin CSP en absoluto y el gate "pasa". El gate
activo cierra ese flanco.

**Trade-off**: si en el futuro se quiere relajar una directiva (e.g.,
bajar `frame-ancestors 'none'` a `'self'`), hay que actualizar el
contrato del gate. Aceptable: ese cambio amerita PR explícito.

---

## D-011 — Aplicación del referrer meta vía build-blog.js / build-interviews.js

**Decisión**: los generadores `build-blog.js` y `build-interviews.js`
NO usan el marker (no son archivos editables a mano por el usuario);
emiten el meta referrer **directamente en el template** como string
literal, junto a los demás meta tags ya hardcoded ahí.

**Rationale**:

- Marker pattern es para archivos editados a mano. Los generadores
  ya tienen control total del HTML que emiten.
- Aunque se cree `scripts/lib/head.js`, en esta spec el módulo
  expone solo `META_REFERRER` (string constante) que ambos
  generadores y `build-layout.js` consumen para emitir la misma
  cadena byte-equivalente.

**Implementación mínima**:

```js
// scripts/lib/head.js
const META_REFERRER = '<meta name="referrer" content="strict-origin-when-cross-origin">';
module.exports = { META_REFERRER };
```

Y los tres archivos lo consumen.

---

## Resumen de decisiones

| ID | Decisión | Impacto |
|---|---|---|
| D-001 | Mecanismo A (CSS externo) | CSP unificada, mantenibilidad +, request +1 cacheable |
| D-002 | Gates Node + jsdom | Cero deps nuevas, consistencia con spec 008 |
| D-003 | scripts/lib/head.js | Single source of truth para meta referrer |
| D-004 | Sitemap manual + entrada faltante | Auto-gen queda en backlog |
| D-005 | Exclusiones hardcoded | Auditabilidad |
| D-006 | CSP también limpiada en posts | Cierra agujero completo |
| D-007 | Path CSS estable | Simplicidad |
| D-008 | CSS al final de cascada | Especificidad correcta |
| D-009 | Marker `<!-- head-meta:start/end -->` | Patrón consistente con spec 008 |
| D-010 | Gate CSP activo (prohibitivo + obligatorio) | Cubre ambos flancos |
| D-011 | Generadores emiten constante directa | No marker innecesario |

Cero `NEEDS CLARIFICATION` quedan abiertos al pasar a Phase 1.
