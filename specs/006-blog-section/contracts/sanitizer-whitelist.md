# Contract — Sanitizer Whitelist (normativo)

**Feature**: 006-blog-section
**Status**: Normative
**Tool**: DOMPurify ^3 (vía jsdom ^24)

Este contrato define **exactamente** qué tags, atributos y esquemas URI son permitidos en el HTML emitido por `scripts/build-blog.js` tras pasar por DOMPurify. Es deliberadamente más permisivo que el whitelist de spec 003 (interviews) para soportar las stat cards inline (FR-013, FR-031), pero mantiene fail-safe sobre vectores XSS conocidos.

---

## 1. Tags permitidos (`ALLOWED_TAGS`)

```js
const ALLOWED_TAGS = [
  // Interviews subset (heading, párrafo, listas, énfasis, code, links)
  'h2','h3','h4','h5','h6',
  'p','ul','ol','li',
  'strong','em','code','pre','blockquote',
  'a','br','hr',
  'table','thead','tbody','tr','th','td',
  // Blog additions (para stat cards inline + media futura)
  'div','span',
  'img','figure','figcaption'
];
```

**Nota**: `h1` NO está permitido — el `<h1>` de cada página de post es el del template (título del post). Permitir `h1` en cuerpo rompería la jerarquía.

## 2. Atributos permitidos (`ALLOWED_ATTR`)

```js
const ALLOWED_ATTR = [
  'href','title','id','class','lang','rel','target',
  // <img>
  'src','alt','width','height','loading','decoding',
  // <th>/<td>
  'colspan','rowspan','scope',
  // data-* (controlado, ver §4)
  // (DOMPurify trata data-* específicamente con `ALLOW_DATA_ATTR: true`)
];
```

Configuración DOMPurify adicional:

```js
{
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: true,           // permite data-* (ver §4)
  ALLOW_UNKNOWN_PROTOCOLS: false,  // bloquea esquemas no listados
  KEEP_CONTENT: true,              // si un tag no permitido se elimina, su contenido textual se preserva
  RETURN_DOM: false,               // string output
  SANITIZE_DOM: true,              // limpieza estricta del DOM
  USE_PROFILES: { html: true },
  FORBID_TAGS,                     // ver §3
  FORBID_ATTR,                     // ver §3
  ALLOWED_URI_REGEXP,              // ver §5
}
```

## 3. Tags y atributos PROHIBIDOS explícitos (`FORBID_TAGS`, `FORBID_ATTR`)

Aunque `FORBID_*` es redundante con `ALLOWED_*` (lo no permitido se elimina), declararlos explícitamente sirve como **defensa en profundidad** y documentación legible.

```js
const FORBID_TAGS = [
  'script','iframe','object','embed','form','input','button','textarea','select','option',
  'style','link','meta','base','title',
  'svg','math',  // bloqueados en cuerpo de post; SVGs decorativos viven en CSS / templates
  'video','audio','source','track','canvas','noscript'
];

const FORBID_ATTR = [
  'style',  // sin inline styles (constitución, CSP)
  'srcset','sizes',  // imágenes responsive: postpuesto a futuro
  // on*= se filtra automáticamente por DOMPurify; lista explícita por claridad:
  'onerror','onload','onclick','onmouseover','onfocus','onmouseout',
  'onkeydown','onkeyup','onkeypress','onchange','onsubmit',
  'autofocus','formaction','formmethod','formenctype','formtarget',
  'srcdoc','sandbox','allow','allowfullscreen'
];
```

## 4. Política de `data-*`

- `ALLOW_DATA_ATTR: true` permite cualquier `data-*` para no romper el flujo del autor.
- Solo `data-stat`, `data-stage` tienen significado para CSS/testing en este iterado; los demás se permiten pero se ignoran semánticamente.
- Cualquier valor de `data-*` se sanea como texto (DOMPurify escapa caracteres peligrosos).

## 5. Esquemas URI permitidos (`ALLOWED_URI_REGEXP`)

```js
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto):|\/|#)/i;
```

- `https://` y `http://` → permitidos.
- `mailto:` → permitido.
- Rutas relativas iniciando con `/` → permitidas.
- Anchors iniciando con `#` → permitidos.
- **Bloqueados explícitamente** (vectores XSS conocidos): `javascript:`, `data:`, `vbscript:`, `file:`, `about:`, `chrome:`, esquemas custom.

## 6. Post-proceso de `<a>` (R-015)

Tras DOMPurify, el script aplica un post-proceso sobre el DOM resultante:

```js
for (const a of dom.querySelectorAll('a')) {
  const href = a.getAttribute('href') || '';
  if (/^https?:\/\//i.test(href)) {
    // Externo: forzar target=_blank + rel anti-tabnabbing
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  } else if (a.getAttribute('target') === '_blank') {
    // Interno con target=_blank explícito: igual asegurar rel
    a.setAttribute('rel', 'noopener noreferrer');
  }
  // Internos sin target: sin cambios
}
```

## 7. Patrón normativo de stat cards inline

El siguiente HTML inline es **válido y debe sobrevivir intacto** a la sanitización:

```html
<div class="post-stats">
  <div class="stat-card">
    <p class="stat-value">7</p>
    <p class="stat-label">Etapas</p>
  </div>
  <div class="stat-card">
    <p class="stat-value">$0</p>
    <p class="stat-label">Costo de licencias</p>
  </div>
  <div class="stat-card">
    <p class="stat-value">100%</p>
    <p class="stat-label">Cobertura</p>
  </div>
  <div class="stat-card">
    <p class="stat-value">&lt;5 min</p>
    <p class="stat-label">Build time</p>
  </div>
</div>
```

Variaciones válidas: `<h3 class="stat-value">`, `<span class="stat-value">`. Cualquier `class` adicional se preserva si está en `ALLOWED_ATTR`.

## 8. Vectores XSS — comportamiento esperado

| Input en `.md` | Salida tras sanitización |
|---|---|
| `<script>alert(1)</script>` | `` (eliminado completo) |
| `<img src=x onerror="alert(1)">` | `<img src="x">` (atributo `onerror` eliminado) |
| `<a href="javascript:alert(1)">click</a>` | `<a>click</a>` (href con esquema no permitido eliminado; tag preservado por `KEEP_CONTENT`) |
| `<a href="data:text/html,<script>alert(1)</script>">x</a>` | `<a>x</a>` (esquema `data:` bloqueado) |
| `<iframe src="https://evil.com">` | `` (tag `iframe` prohibido) |
| `<div style="background:url(javascript:alert(1))">x</div>` | `<div>x</div>` (atributo `style` eliminado) |
| `<form action="https://evil.com"><input></form>` | `` (tags prohibidos) |
| `<svg onload="alert(1)">` | `` (tag `svg` prohibido en cuerpo de post) |
| `<button onclick="alert(1)">x</button>` | `` (tag `button` prohibido) |
| `<a href="vbscript:msgbox(1)">x</a>` | `<a>x</a>` (esquema bloqueado) |

Estos casos están cubiertos por el fixture negativo `content/blog/__fixtures__/xss-attempt.md` y validados por `tests/blog-schema.sh` + verificación post-sanitización del HTML emitido.

## 9. Diferencias respecto al whitelist de spec 003 (interviews)

| Aspecto | interviews (003) | blog (006) |
|---|---|---|
| `<div>`, `<span>` | NO | **SÍ** (necesarios para stat cards) |
| `<img>` | NO | **SÍ** (uso futuro) |
| `<table>` y familia | NO | **SÍ** (markdown GFM tables) |
| `data-*` | NO | **SÍ** (`ALLOW_DATA_ATTR: true`) |
| HTML inline en `marked` | escapado por renderer.html() override | **preservado**, se delega íntegramente al sanitizador |
| Esquemas URI | `http`, `https`, `mailto` | `http`, `https`, `mailto`, `/`, `#` |
| `style="…"` | bloqueado | bloqueado (sin cambio) |
| `<script>`, `<iframe>` | bloqueados | bloqueados (sin cambio) |

## 10. Política de revisión del whitelist

- Cambios al whitelist requieren PR a esta spec con justificación explícita.
- Añadir un tag o atributo nuevo → actualizar este documento + agregar al menos un fixture positivo (`__fixtures__/valid-<feature>.md`) y uno negativo si introduce nuevo vector.
- La política es **deny por defecto**: si no está listado en `ALLOWED_*`, no se permite.
