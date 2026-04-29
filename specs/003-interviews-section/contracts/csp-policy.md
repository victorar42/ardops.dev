# Contract — CSP Policy (normativo)

**Feature**: 003-interviews-section  
**Status**: Normative — debe coincidir exactamente con la CSP del resto del sitio.

---

## Política aplicable

Las páginas generadas (`/interviews/`, `/interviews/<slug>.html`) inyectan idéntica `<meta http-equiv="Content-Security-Policy">` que el resto del sitio:

```
default-src 'self';
script-src 'self';
style-src 'self';
font-src 'self';
img-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests
```

(Sin saltos de línea reales en producción; aquí formateado para legibilidad.)

## Justificación de cada directiva

| Directiva | Valor | Razón |
|---|---|---|
| `default-src` | `'self'` | Bloquea cualquier recurso externo no listado explícitamente. |
| `script-src` | `'self'` | Solo `assets/js/interviews.js` (mismo origen). Sin `unsafe-inline` ni `unsafe-eval`. |
| `style-src` | `'self'` | Solo hojas en `assets/css/`. Sin `<style>` inline ni `style="..."` en HTML emitido. |
| `font-src` | `'self'` | Fonts self-hosted en `assets/fonts/` (constitución V). |
| `img-src` | `'self' data:` | Imágenes en `_site/interviews/images/` y placeholder OG. `data:` se mantiene por consistencia con resto del sitio (avatares fallback se emiten como `<svg>` markup, no como `data:` URL). |
| `connect-src` | `'self'` | Permite `fetch('/interviews/index.json')`. |
| `frame-ancestors` | `'none'` | Anti-clickjacking. |
| `base-uri` | `'self'` | Evita inyección de `<base href>`. |
| `form-action` | `'self'` | No hay forms en estas páginas, defensa preventiva. |
| `upgrade-insecure-requests` | — | Auto-upgrade `http://` a `https://`. |

## Cumplimiento

### Reglas que el generador DEBE respetar

1. **Cero `<script>` inline** salvo el bloque JSON-LD (`type="application/ld+json"` no es ejecutable y por tanto no aplica `script-src`).
2. **Cero handlers inline** (`onclick`, `onerror`, `onload`, etc.) en el HTML emitido.
3. **Cero `<style>` inline** ni `style="..."` en atributos.
4. **Cero `javascript:` URLs**. DOMPurify debe filtrarlos del MD.
5. **Recursos externos cero**. `marked` no genera links externos automáticamente, y los autores referencian sus propios recursos.

### Configuración de DOMPurify alineada con CSP

```js
DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['h2','h3','h4','p','ul','ol','li','strong','em','code','pre','blockquote','a','br','hr'],
  ALLOWED_ATTR: ['href','title','id','class','lang'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#)/i,  // bloquea javascript:, data: en hrefs
  FORBID_TAGS: ['script','style','iframe','object','embed','form','input','button'],
  FORBID_ATTR: ['onerror','onload','onclick','onmouseover','onfocus','onblur','onchange','onsubmit','style']
});
```

## Verificación

- **Manual**: abrir DevTools → Network → confirmar que toda request es same-origin.
- **Automatizada (existente)**: `tests/a11y.js` ejecuta axe-core que verifica usabilidad pero NO CSP. La CSP en sí se valida con un grep en CI:

```bash
grep -q 'http-equiv="Content-Security-Policy"' _site/interviews/index.html || exit 1
grep -q "script-src 'self'" _site/interviews/index.html || exit 1
```

- **Regresión XSS**: `tests/interviews-xss.sh` verifica que `<script>`, `javascript:`, `onerror` no aparezcan en el HTML generado a partir de la fixture maliciosa.

## No-regresión

Cualquier PR que introduzca CDN externo, `unsafe-inline`, o relajación de la CSP en estas páginas debe documentarlo en una nueva spec y obtener aprobación. La constitución V/VIII lo exige.
