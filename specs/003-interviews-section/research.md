# Phase 0 — Research: Sección de Entrevistas

**Feature**: 003-interviews-section  
**Date**: 2026-04-28

Documento que consolida las decisiones técnicas que resuelven dudas implícitas de la spec [`spec.md`](spec.md) y justifica las elecciones del plan frente a la constitución.

---

## R-001 — Generador propio vs generador estático completo

**Decision**: script Node propio (`scripts/build-interviews.js`), sin generador de sitio completo.

**Rationale**:
- Constitución III/IV: el sitio es estático y minimalista. Eleventy/Hugo/Jekyll introducen un sistema completo de templates, layouts, plugins, configuración propia, runtime de build pesado y curva de aprendizaje, para resolver un problema de tamaño pequeño (≤ 50 entrevistas).
- El alcance es predecible: 1 página índice + N páginas individuales con la misma plantilla. Un script de ~200 líneas resuelve esto con visibilidad total.
- Mantenibilidad: un único punto de cambio cuando evolucione el formato (ej. agregar `og:image` específico, paginación). Sin abstracciones intermedias.

**Alternatives considered**:
1. **Eleventy (`@11ty/eleventy`)**: rechazado. ~500+ deps transitivas, layouts y collections que sobran, integración con CSP requiere config extra. Para 1 colección, overkill.
2. **Hugo**: rechazado. Binario Go, otro toolchain en CI, sintaxis de templates propia. Innecesario.
3. **Jekyll**: rechazado. Ruby toolchain, Liquid templating, peor mantenibilidad en este repo Node-first.
4. **Astro**: rechazado. Diseñado para sites con islands de UI; aquí el HTML es 100 % estático, sus features son innecesarias.

---

## R-002 — Parser de Markdown

**Decision**: `marked` con configuración:
```js
marked.setOptions({
  gfm: true,           // GitHub-flavored: tablas, fenced code, autolinks
  breaks: false,       // saltos requieren doble newline (estándar)
  headerIds: true,     // genera ids semánticos para anchors
  mangle: false,       // no obfusca emails (no aporta seguridad real)
  pedantic: false,
});
// HTML inline NO está permitido: configurar renderer.html() para escapar el contenido.
```

**Rationale**:
- Maduro, con releases recientes, ampliamente auditado.
- Tamaño razonable (~50 KB unpacked); ejecuta solo en build, no impacta runtime.
- Soporte GFM cubre casos típicos (listas, énfasis, links, code blocks). Las entrevistas son texto + listas + código ocasional.

**Alternatives considered**:
1. **`markdown-it`**: aceptable, ligeramente más extensible vía plugins. Rechazado por preferencia de simplicidad: `marked` ofrece API directa para deshabilitar HTML inline.
2. **`unified` + `remark` + `rehype`**: pipeline funcional muy potente, pero introduce 5+ paquetes para una conversión simple. Sobrecomplica.
3. **`@picocss/markdown` o similares ligeros**: rechazados. Soporte GFM incompleto, bus factor alto.

**Configuración de seguridad**:
- Override del renderer `html()` para que devuelva string vacío o el contenido escapado: cualquier bloque HTML en el MD es ignorado.
- DOMPurify post-render como segunda capa (R-004).

---

## R-003 — Parser de YAML / Frontmatter

**Decision**: `gray-matter` (que internamente usa `js-yaml`).

**Rationale**:
- Standard de facto en el ecosistema. API simple: `matter(fileContent)` devuelve `{ data, content }`.
- `js-yaml` aplica `safeLoad` por defecto en versiones modernas, evitando deserialización insegura.
- Manejo idiomático de fechas (devuelve `Date` o string ISO; el script las normaliza).

**Alternatives considered**:
1. **Implementación manual**: rechazado. YAML es no-trivial; reimplementarlo es introducir bugs y posible inyección.
2. **`front-matter` (paquete homónimo)**: rechazado. `gray-matter` tiene mejor mantenimiento y comunidad.

---

## R-004 — Sanitización del HTML emitido

**Decision**: `dompurify` ejecutado en Node con `jsdom` proporcionando el `window`. Whitelist conservadora explícita:

```js
const ALLOWED_TAGS = ['h2','h3','h4','p','ul','ol','li','strong','em','code','pre','blockquote','a','br','hr'];
const ALLOWED_ATTR = ['href','title','id','class','lang'];
const ALLOWED_SCHEMES = ['http','https','mailto'];
```

**Rationale**:
- Capa adicional de defensa frente a Markdown malicioso aunque el autor sea de confianza (defensa en profundidad).
- DOMPurify es el sanitizador estándar; ampliamente auditado, con soporte de jsdom documentado.
- Build-time only; no agrega peso al runtime.

**Alternatives considered**:
1. **Regex propias**: rechazado. Antipatrón documentado: regex no parsean HTML; trivial bypassearlo.
2. **`sanitize-html`**: alternativa válida, similar superficie. `dompurify` elegido por familiaridad y por tener más casos de prueba contra payloads conocidos.
3. **Confiar solo en marked + escape manual**: rechazado. Aunque `marked` no permita HTML inline, atributos `href="javascript:..."` o `data:` URIs en links siguen siendo posibles sin sanitizador. DOMPurify cubre esto.

**Verificación**: SC-012 — fixture `content/interviews/__fixtures__/xss-attempt.md` con `<script>alert(1)</script>`, links `javascript:` y atributos `onerror`. Tras build, el HTML emitido NO contiene `<script>`, ni `javascript:`, ni `onerror`.

---

## R-005 — Slugs y URLs estables

**Decision**:
- Convención de nombre de archivo: `YYYY-MM-<slug>.md` (ej. `2026-05-jose-alvarez-pernix.md`).
- Slug efectivo (URL): el sufijo después de `YYYY-MM-`, validado contra `^[a-z0-9-]+$`, longitud 1–80.
- URL final: `/interviews/<slug>.html`.
- Si el archivo no respeta el prefijo de fecha, el slug es el basename completo del archivo (sin `.md`), validado igualmente.
- El frontmatter NO permite override del slug en esta versión (mantiene URLs estables atadas al filename).

**Rationale**:
- URLs predecibles, indexables, compartibles.
- Cambiar el contenido no rompe URLs (el filename es la identidad).
- Si en el futuro se necesita renombrar y mantener URL: PR específica que mueva el archivo y agregue una redirección estática (fuera de alcance).

**Alternatives considered**:
1. **Slug derivado del título**: rechazado. Cambios menores en el título romperían URLs en producción.
2. **UUID o hash**: rechazado. URLs ilegibles, mal SEO.

---

## R-006 — Templating

**Decision**: template strings de JavaScript dentro del script de build.

**Rationale**:
- Cero dependencias adicionales.
- API nativa, sin curva de aprendizaje.
- Lo suficientemente potente para 2 plantillas estables (índice + individual) con escapado controlado.

**Alternatives considered**:
1. **Handlebars**: maduro pero introduce paquete y compilación de templates. Innecesario para este alcance.
2. **EJS**: similar. Permite ejecución arbitraria por defecto, requiere cuidado adicional. Innecesario.
3. **JSX server-side (preact-render-to-string)**: rechazado, sobreingeniería.

**Riesgo de XSS por interpolación**: cada inserción de variable se escapa explícitamente con una función `escapeHtml(value)` propia (4 líneas, sin dependencias). Esta función se aplica a todos los valores que provienen del frontmatter (`title`, `interviewee.name`, etc.). El cuerpo HTML de la entrevista ya está sanitizado por DOMPurify (R-004) y se inyecta tal cual.

---

## R-007 — Reading time

**Decision**:

```js
const words = bodyMarkdown
  .replace(/```[\s\S]*?```/g, '')   // excluir bloques de código
  .split(/\s+/)
  .filter(Boolean).length;
const readingTime = Math.max(1, Math.ceil(words / 220)); // minutos
```

**Rationale**:
- 220 wpm es el promedio común para texto técnico (rango 200–250); aceptable como estimador.
- Excluir code blocks evita inflar el tiempo cuando hay snippets largos no leídos como prosa.
- Mínimo de 1 minuto para entrevistas cortas.

**Alternatives considered**:
1. **`reading-time` package**: paquete válido pero introduce dependencia adicional. La regla simple es trivial de inlinear.

---

## R-008 — Búsqueda y filtrado client-side

**Decision**:
- `fetch('/interviews/index.json')` al cargar la página, una sola vez.
- Función de match: normaliza string (NFD → strip diacritics → lowercase) y aplica `.includes()` sobre la concatenación de campos buscables (`title`, `interviewee.name`, `company`, `summary`, `tags.join(' ')`).
- Filtro de tags: `Set` de tags activos, item pasa si todos sus tags incluyen al menos uno del Set (modo OR entre tags). Combinado con búsqueda como AND.
- Render: re-construye `<ul>` desde el filtrado en cada cambio. Para 50 ítems el costo es despreciable.
- `aria-live="polite"` en el contador de resultados; se actualiza en cada filtrado.
- Debounce de 80ms en el input para evitar trabajo innecesario (cumple SC-004).

**Rationale**:
- 0 dependencias runtime (constitución IV).
- Lunr.js, FlexSearch y similares son innecesarios para ≤ 50 ítems y agregan ≥ 30 KB minified.
- API DOM estándar; testeable con axe-core.

**Alternatives considered**:
1. **Lunr.js**: rechazado. Peso (~28 KB), índice serializado en JSON ~3x del original. Para nuestro tamaño no aporta.
2. **FlexSearch**: similar; tampoco aporta.
3. **No búsqueda, solo filtros**: rechazado por US3 explícita.

---

## R-009 — Estructura del `index.json`

**Decision**: JSON con array `interviews`, cada entry minimalista. Esquema completo en `contracts/index-json-schema.md`. Sin contenido del cuerpo.

```json
{
  "version": 1,
  "generated": "2026-04-28T00:00:00Z",
  "interviews": [
    {
      "slug": "jose-alvarez-pernix",
      "title": "Conversación con José Álvarez",
      "interviewee": { "name": "José Álvarez", "role": "CTO", "company": "Pernix", "image": "images/jose-alvarez-pernix.webp" },
      "date": "2026-05-15",
      "tags": ["liderazgo", "cto", "arquitectura", "scaling"],
      "summary": "...",
      "readingTime": 5
    }
  ]
}
```

**Tamaño estimado**: ~400–500 bytes por entry → ~10 KB con 20 entrevistas. Holgado bajo el límite de 100 KB. Si una entrada agrega muchos tags o summary largo, sigue sumando linealmente.

**Verificación de presupuesto**: gate `tests/interviews-size.sh` falla si el tamaño excede 100 KB.

---

## R-010 — Integración con `pages-deploy.yml`

**Decision**: agregar un step `Generate interviews` en el job `build` *antes* del `Stage site` actual, con efecto sobre el árbol de trabajo. El rsync existente captura los archivos generados sin necesidad de reescribirlo.

```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with: { node-version: "20", cache: npm }

- run: npm ci || npm install --no-audit --no-fund

- name: Generate interviews
  run: node scripts/build-interviews.js --strict --out interviews/
```

El script emite los HTML directamente en `interviews/` del checkout (que está vacío en el repo). El `rsync` existente copia `interviews/` a `_site/interviews/` automáticamente porque no está en la lista de exclude.

**Rationale**:
- Cambio mínimo al pipeline existente; reuso del rsync.
- No commitear `interviews/*.html` requiere agregar `interviews/*.html` y `interviews/index.html` y `interviews/index.json` al `.gitignore`. Patrón documentado.
- `--strict` hace fallar el job si hay frontmatter inválido (FR-009).

**Alternatives considered**:
1. **Generar a `_site/interviews/` directamente**: aceptable pero contradice el flujo (`_site` se crea por el rsync). Rechazado por consistencia.
2. **Job separado con artifact**: rechazado, complica el deploy.

---

## R-011 — Imágenes de entrevistados

**Decision**:
- Carpeta `content/interviews/images/<slug>.{webp,jpg,png}`.
- Frontmatter `interviewee.image` opcional, ruta relativa (ej. `images/jose-alvarez-pernix.webp`).
- En el HTML servido, se sirve desde `/interviews/images/<slug>.webp`.
- Fallback cuando `image` es null/ausente: avatar SVG inline con iniciales del entrevistado, generado en build time con dos iniciales sobre el color `--accent-dim` y borde redondeado.
- Tamaño recomendado en README: 256x256 px, WebP preferido. Optimización del pipeline queda fuera de alcance (autor responsable de subir imágenes razonables).
- Atributo `alt` obligatorio: `Foto de <interviewee.name>`.

**Rationale**:
- Self-hosted (constitución V).
- Fallback evita romper el render si se publica antes de tener foto.
- Tamaño 256x256 es suficiente para visualización circular hasta ~120px sin loss visible.

**Alternatives considered**:
1. **Pipeline de optimización en CI** (sharp, imagemin): rechazado, fuera de alcance de spec 003. Spec futura si se necesita.
2. **Avatares de Gravatar/UI Avatars**: rechazado, viola constitución V.

---

## R-012 — CSP de las nuevas páginas

**Decision**: las páginas generadas inyectan exactamente la misma `<meta http-equiv="Content-Security-Policy">` que `index.html`:

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

`script-src 'self'` requiere que `assets/js/interviews.js` sea archivo externo, sin `<script>` inline en las páginas. `connect-src 'self'` permite el `fetch('/interviews/index.json')`.

**Rationale**:
- Consistencia con el resto del sitio.
- `data:` en `img-src` solo necesario si el avatar fallback es SVG inlineado como `data:image/svg+xml;...`. **Decisión refinada**: el SVG fallback se emite como markup `<svg>...</svg>` directamente en el HTML, NO como `data:` URL en `<img>`. Esto permite endurecer la CSP en una iteración futura eliminando `data:` de `img-src` para las páginas de entrevistas (fuera de alcance de esta spec).

---

## R-013 — Navegación principal

**Decision**: agregar `<li><a href="/interviews/">Entrevistas</a></li>` al `<ul class="nav-links">` en `index.html`, `talks/index.html`, `blog/index.html`. Insertar entre "Charla" y "About" (orden lógico: presente → archivo).

La página `/interviews/index.html` (y las individuales) reusan el mismo `<header class="site-header">` con `<nav class="site-nav">` y la misma estructura de `nav-links`, manteniendo el item "Entrevistas" marcado como `aria-current="page"` en el índice.

**Rationale**:
- Discoverability (US2).
- Consistencia: el menú ya existe; solo se agrega un item.

---

## R-014 — Test de XSS por fixture

**Decision**: archivo `content/interviews/__fixtures__/xss-attempt.md` con frontmatter sintético y cuerpo:

```markdown
<script>alert(1)</script>

[link](javascript:alert(1))

<a href="javascript:alert(1)">click</a>

<img src=x onerror="alert(1)">
```

El script `build-interviews.js` procesa la fixture en modo `--strict --include-fixtures` solo durante CI. Tras build, `tests/interviews-xss.sh` ejecuta:

```bash
grep -niE 'alert\(1\)|javascript:|onerror=|<script' _site/interviews/<xss-fixture-slug>.html && exit 1 || exit 0
```

Si encuentra cualquier patrón → **fail**. Si no → **pass**. El gate se ejecuta en `ci.yml`.

**Rationale**:
- Verificación mecánica de SC-012.
- Defensa en profundidad: marked + DOMPurify deben ambos remover los payloads.

---

## Resumen de NEEDS CLARIFICATION resueltos

| Tema (input/spec) | Resolución |
|---|---|
| Imagen del entrevistado | Sí, opcional, self-hosted, fallback con iniciales SVG — R-011 |
| Reading time auto-calculado | Sí, `Math.ceil(words / 220)` excluyendo code blocks — R-007 |
| Sistema de templating | JS template strings, sin dependencias — R-006 |
| Generador de sitio | Script Node propio, sin Eleventy/Hugo — R-001 |
| Slugs | Desde nombre de archivo, validados — R-005 |

✅ Sin `NEEDS CLARIFICATION` pendientes. Phase 1 puede arrancar.
