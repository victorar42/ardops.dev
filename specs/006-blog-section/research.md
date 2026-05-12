# Phase 0 — Research: Sección Blog

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

Cada decisión incluye **Decision / Rationale / Alternatives considered**. Cero `NEEDS CLARIFICATION` restantes; todas las áreas grises del spec quedan resueltas aquí.

---

## R-001 — Reuso de toolchain de spec 003 (interviews) vs. nuevo

- **Decision**: reusar **íntegramente** las dependencias `marked@^12`, `dompurify@^3`, `jsdom@^24`, `gray-matter@^4` ya instaladas como `devDependencies` por spec 003. Cero `npm install` adicional.
- **Rationale**: constitución IV (cero deps JS sin justificación). El stack ya está auditado, en uso, con fixtures negativos para XSS y patrones validados (`build-interviews.js`). Reusarlo reduce surface-area de seguridad y duplicación. Verificado en `package.json` actual del repo.
- **Alternatives considered**:
  - *Generador estático completo (Eleventy/Astro/Hugo)*: rechazado por las mismas razones que en R-001 de spec 003 — overkill para ≤50 posts y rompe constitución IV.
  - *Reemplazar `marked` por `markdown-it`*: aporta extensibilidad que aquí no necesitamos y duplicaría parsers Markdown en el repo.

## R-002 — Configuración de `marked` + estrategia de HTML inline en posts

- **Decision**: configurar `marked` igual que en `build-interviews.js` (`gfm: true, breaks: false, headerIds: true, mangle: false, pedantic: false`) **PERO sin** override que escape el HTML inline. El HTML inline (necesario para stat cards) **se preserva** en la salida de `marked` y la sanitización pasa íntegramente a la capa DOMPurify (R-003), que aplica el whitelist normativo.
- **Rationale**: en interviews, el cuerpo es prosa pura — el HTML inline se escapa preventivamente. En blog, el primer post **necesita** insertar el bloque inline `<div class="post-stats"><div class="stat-card">…</div>…</div>` por requisito FR-031. Mover toda la decisión de qué HTML pasa al sanitizador (DOMPurify) consolida la política en un solo lugar (whitelist en `contracts/sanitizer-whitelist.md`) y evita lógica dispersa.
- **Alternatives considered**:
  - *Custom directive Markdown tipo `:::stats … :::`* o shortcodes: añade complejidad sintáctica no estándar; el autor tendría que recordar una DSL; difícil de validar; no aporta sobre HTML inline + sanitizador. Rechazado.
  - *Componente reusable referenciado por slug en frontmatter (`stats: pipeline-summary`)*: spec.md (Assumptions) lo declara explícitamente fuera de alcance v1 — "cualquier post futuro que necesite stat cards copia el HTML inline". Postpuesto a spec posterior si el patrón se repite ≥3 veces.

## R-003 — Whitelist DOMPurify: shared con interviews vs. independiente

- **Decision**: **whitelist independiente** para blog, definido en `contracts/sanitizer-whitelist.md`. Se construye como **superset** del whitelist de interviews:
  - `ALLOWED_TAGS` interviews + `['div','span','img']`
  - `ALLOWED_ATTR` interviews + `['data-*']` (controlado: solo `data-stat`, `data-stage` son significativos; los demás se permiten pero no se usan) + `['src','alt','width','height','loading','decoding']` (para `<img>`)
  - `ALLOWED_URI_REGEXP` se mantiene estricto: `^(https?:|mailto:|\/|#)` (igual interviews; bloquea `javascript:`, `data:`, `vbscript:`, etc.)
  - `FORBID_TAGS`: `['script','iframe','object','embed','form','input','button','style','link','meta','base']` (fail-safe explícito).
  - `FORBID_ATTR`: `['style','onerror','onload','onclick','onmouseover','onfocus','onmouseout','onkeydown','onkeyup','onkeypress','autofocus','formaction']` + cualquier `on*=` por la regex `^on/i` (DOMPurify la aplica por defecto cuando se omite).
- **Rationale**: el blog necesita `<div>` y `<span>` con `class` para las stat cards (estructura nativa del componente reusada de `#about`). `<img>` se permite para que el autor pueda insertar imágenes en futuros posts (no requerido v1, pero sin costo). Mantener `style` PROHIBIDO preserva CSP estricta + constitución (sin inline styles); las clases del design system son la única vía de aspecto. Compartir el whitelist como base evita drift entre features mientras los overrides locales documentan qué cambió y por qué.
- **Alternatives considered**:
  - *Mismo whitelist exacto de interviews*: insuficiente (no permite `div`/`span`); rompe FR-031.
  - *Whitelist sin `class`*: imposible reusar tokens del design system; obligaría a inline styles, violando CSP. Rechazado.
  - *Permitir `style` con limpieza por regex*: clase de complejidad innecesaria; DOMPurify nativamente puede sanear styles, pero introduce vector de XSS-via-CSS. Rechazado.
  - *Helper TS/JS compartido `lib/sanitizer-config.js` consumido por ambos scripts*: tentador para DRY, pero fuerza coupling entre dos features que pueden divergir; preferimos duplicación controlada documentada en contratos. Rechazado para v1; aceptable refactor en spec futura si surge un tercer consumidor.

## R-004 — Cálculo de reading time

- **Decision**:
  ```js
  const plainText = bodyMarkdown
    .replace(/```[\s\S]*?```/g, ' ')   // excluir code blocks
    .replace(/<[^>]+>/g, ' ')           // excluir HTML inline (stat cards no son lectura)
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' '); // excluir referencias de imágenes
  const words = plainText.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 200)); // minutos, 200 wpm
  ```
- **Rationale**: 200 wpm (no 220 como interviews) por dos motivos: (a) los posts del blog son técnicos densos con narrativa en primera persona, lectura algo más lenta que entrevista conversacional; (b) consistencia con la heurística más común en plataformas de blog (Medium ≈ 200, Dev.to ≈ 200). El método de cálculo excluye code blocks, HTML inline y referencias a imágenes para no inflar el conteo. Mínimo 1 min para posts ultra-cortos.
- **Alternatives considered**:
  - *Reusar 220 wpm de interviews*: aceptable pero menos preciso para texto de blog. Rechazado por margen marginal.
  - *Configurable por post (override en frontmatter)*: añade campo opcional sin valor real; el cálculo automático es suficientemente bueno. Rechazado.
  - *Paquete `reading-time`*: añade dep que no aporta sobre 4 líneas inlineadas. Rechazado.

## R-005 — Convención de URLs y filenames

- **Decision**:
  - Filename: `content/blog/YYYY-MM-<slug>.md` (ej. `2026-05-pipeline-seguridad-spec-driven.md`).
  - El frontmatter `slug` MUST coincidir con el sufijo después de `YYYY-MM-`. Build falla si no coincide (defensa contra renombres parciales).
  - URL final: `/blog/<slug>.html` (no `/blog/<slug>/`). GitHub Pages no rewrite a clean URLs sin redirects; mantenemos la misma convención que `/interviews/<slug>.html` (spec 003).
  - El frontmatter exige `slug` explícito (a diferencia de interviews donde se deriva del filename). Esto permite renombrar el archivo (ej. corregir typo en fecha) sin alterar la URL pública.
- **Rationale**: URLs estables y predecibles (constitución IX, mantenibilidad). El prefijo de fecha en filename ordena el directorio cronológicamente para el autor sin mezclarse con la URL. La spec.md menciona `/blog/<slug>/` en algunos pasajes pero el plan resuelve a `/blog/<slug>.html` por la limitación documentada de GitHub Pages — esta decisión queda explícita aquí. Cualquier link externo escrito como `/blog/<slug>` se sirve por GitHub Pages (intenta `<slug>.html` y `<slug>/index.html`); la salida canónica es `.html`.
- **Alternatives considered**:
  - *URL `/blog/<slug>/index.html`*: duplica directorios, dificulta el listado en `blog/`. Rechazado.
  - *Slug derivado del filename (sin frontmatter)*: rompe la posibilidad de renombre seguro. Rechazado.
  - *Slug derivado del título*: cambios menores de título romperían URLs en producción. Rechazado.

## R-006 — Modo `--check` doble (landing + `blog/index.html`)

- **Decision**: `node scripts/build-blog.js --check` ejecuta el build completo en memoria y verifica **dos** comparaciones byte-a-byte:
  1. El bloque entre `<!-- blog:start -->` y `<!-- blog:end -->` en `index.html` actual MUST coincidir con el regenerado.
  2. El archivo `blog/index.html` actual MUST coincidir byte-a-byte con el regenerado.
  3. Cada `blog/<slug>.html` actual MUST coincidir con el regenerado para los posts publicados.
  Cualquier divergencia → exit 1 con un diff acotado en stderr identificando el archivo afectado.
- **Rationale**: la fuente de verdad es `content/blog/`. Si el autor olvida correr el build localmente y commitea solo el `.md`, los HTML quedan desincronizados; la gate los detecta. Es el mismo principio que `pipeline-build-check` (spec 005) extendido a 3 superficies (landing + index + N posts).
- **Alternatives considered**:
  - *Solo verificar landing y `blog/index.html`*: dejaría drift posible en posts individuales. Rechazado.
  - *Re-generar y commitear automáticamente en CI*: requiere PAT y permisos de write; complica permisos sin aportar sobre la comparación. Rechazado.

## R-007 — Modo `--check-only-validation` (para fixtures negativos)

- **Decision**: añadir flag `--check-only-validation` (o `--validate-only`) que ejecuta **solo** la fase de parsing + validación de frontmatter + sanitización dry-run, sin emitir HTML ni comparar. Acepta `--input <path>` para apuntar a un fichero individual (necesario para que `tests/blog-schema.sh` itere fixtures uno por uno). Cualquier error de validación → exit ≠ 0 con mensaje accionable indicando archivo y problema.
- **Rationale**: separa la validación del side-effect de escritura, mismo patrón que spec 005 (`--check-only-validation` ya documentado en `tests/pipeline-schema.sh`). Permite fixtures granulares (un fichero inválido por defecto, no un mix).
- **Alternatives considered**:
  - *Reusar `--check`*: confunde semántica (drift vs. inválido) y no permite testear fixtures aislados. Rechazado.
  - *Implementar validador separado en bash*: duplica lógica de schema, fuente de drift entre validador y emisor. Rechazado.

## R-008 — Estilos: nuevo archivo `assets/css/blog.css` vs. extender `components.css`

- **Decision**: extender `assets/css/components.css` con un bloque `/* === Blog === */` que añade clases `.post-card`, `.post-list`, `.post-meta`, `.post-tags`, `.post-tag`, `.post-stats`. NO se crea un nuevo archivo CSS. Las clases `.stat-card`, `.stat-value`, `.stat-label` ya existen en `components.css` (usadas por `#about`); el patrón inline `.post-stats > .stat-card` reusa estas clases sin duplicarlas.
- **Rationale**: `components.css` ya alberga `.stat-card` y secciones similares (cards, badges); coherencia. Crear `blog.css` añade un request más en la cascada (peso marginal, pero rompe el patrón actual de un único `components.css`). Reusar `.stat-card` exacto garantiza identidad visual entre `#about` y stat cards inline en post (FR-031). El cambio CSS estimado es ≤2 KB pre-gzip.
- **Alternatives considered**:
  - *Nuevo `assets/css/blog.css`*: aceptable pero rompe convención del repo y añade `<link>` extra. Rechazado.
  - *Inline `<style>` en cada post HTML*: viola constitución (sin inline styles). Rechazado de plano.
  - *Crear `.stat-card--blog` modificador*: innecesario, las stats inline son visualmente idénticas a las de `#about`. Rechazado.

## R-009 — Foto de `#about`: formato, peso, alt y carga

- **Decision**:
  - Archivo: `assets/img/josue-256.webp`. Tamaño nativo 256×256 px, ~15–25 KB.
  - HTML: `<img src="assets/img/josue-256.webp" alt="Retrato de Victor Josue Ardón Rojas" width="256" height="256" loading="lazy" decoding="async" class="about-portrait">`.
  - Estilo: `border-radius: 50%` vía CSS class `.about-portrait`.
- **Rationale**: webp da mejor compresión que jpg/png para retratos a este tamaño (~30% menos peso). Atributos `width`/`height` previenen CLS (constitución VII). `loading="lazy"` acepta que la imagen no es LCP (el LCP del landing es el hero, sección anterior). Alt descriptivo no vacío cumple FR-020 y constitución VI. CSS `border-radius: 50%` evita pre-mascarar la imagen (sigue siendo cuadrada en disco, simplifica reemplazos futuros).
- **Alternatives considered**:
  - *Avif*: ~10% adicional de compresión, soporte universal pero más lento de codificar y herramienta más nicho. Rechazado para v1; aceptable como spec posterior si justifica perf.
  - *Imagen circular pre-mascarada (PNG con transparencia)*: peor compresión que webp + máscara CSS. Rechazado.
  - *SVG con `<image>` embed*: añade overhead. Rechazado.
  - *Carga `eager` con `fetchpriority="high"`*: la foto está fuera del fold inicial en mobile (sección `#about` viene tras hero); `eager` no aporta y compite por bandwidth con el hero. Rechazado.

## R-010 — Comportamiento ante posts con fecha futura

- **Decision**: un post con `date` en el futuro (relativo al momento del build) **se trata como `published: false`**, es decir: no aparece en landing, no aparece en `/blog/`, no se emite página individual. El build NO falla; emite un warning a stdout (`[warn] <file>: future date 2026-12-01, treating as draft`).
- **Rationale**: comportamiento determinista y útil — el autor puede pre-cargar borradores con fecha objetivo y olvidarlos hasta que esa fecha llegue (al rebuild post-fecha aparecen automáticamente). Un fail haría imposible cargar drafts adelantados; un publicar inmediato ignora la intención del campo.
- **Alternatives considered**:
  - *Publicar inmediatamente ignorando la fecha*: rompe la utilidad del campo como "fecha de publicación".
  - *Hacer fallar el build*: hostil para el flujo del autor.
  - *Requerir flag explícito `draft: true`*: añade un segundo campo de estado redundante con `published`. Rechazado.

## R-011 — Manejo del estado vacío

- **Decision**:
  - Landing `#blog` con cero posts publicados: render del `<section>` con `<p class="post-empty">Aún no hay posts publicados — pronto.</p>` dentro y SIN el link "Ver todos" (no apunta a nada útil).
  - `/blog/index.html` con cero posts publicados: render del listado con `<p class="post-empty">Aún no hay posts publicados. Volvé pronto.</p>` y sin `<ul>`.
- **Rationale**: cumple FR-008 y SC-007. Voz cálida alineada con spec 004 (personal-bio-rewrite). No se omite la sección entera para preservar el ancla `#blog` y la entrada del nav (visitantes que ya bookmarkearon o llegan por enlace directo no encuentran 404).
- **Alternatives considered**:
  - *Ocultar la sección si vacía*: rompe FR-001 y deja huérfano el link del nav. Rechazado.

## R-012 — Política de regeneración + commit

- **Decision**: el autor corre `node scripts/build-blog.js` localmente al editar `content/blog/`. El comando regenera **todos** los HTML afectados (`index.html` entre markers, `blog/index.html`, todos `blog/<slug>.html` para posts publicados) y elimina cualquier `blog/<slug>.html` huérfano (cuyo .md ya no existe o tiene `published: false`). El autor commitea **todos** los archivos cambiados juntos. La gate `blog-build-check` en CI valida la sincronía.
- **Rationale**: idempotencia + auditabilidad. Cada PR muestra explícitamente qué HTML cambió, no hay magia. Mismo patrón validado por spec 005.
- **Alternatives considered**:
  - *No borrar HTML huérfano automáticamente*: requeriría limpieza manual y deja basura. Rechazado.
  - *Generar a `dist/` y servir desde ahí*: incompatible con la convención actual del repo (todo se sirve de la raíz). Rechazado.

## R-013 — Seed inicial (SC-008)

- **Decision**: al merge inicial existe `content/blog/2026-05-pipeline-seguridad-spec-driven.md` con la narrativa del primer post (autor: Victor), `published: true`, fecha actual, las 7 etapas mencionadas como decisiones de diseño en primera persona (Spectral, Semgrep, Gitleaks, npm audit, OWASP ZAP, Custom Action de compliance, CodeQL/GHAS), y las 4 stat cards técnicas embebidas inline en la sección de beneficios usando el patrón `<div class="post-stats"><div class="stat-card"><p class="stat-value">7</p><p class="stat-label">Etapas</p></div>…</div>`.
- **Rationale**: cumple SC-008 sin contenido inventado; el material existe en `index.html` actual (sección `#security-pipeline`) y solo se reescribe en primera persona. Demuestra el render de stat cards inline (FR-013, FR-031) y valida el whitelist de R-003 contra contenido real.
- **Alternatives considered**:
  - *Mergear sin posts y crearlos en spec posterior*: falla SC-008. Rechazado.
  - *Empezar con un post lorem-ipsum*: viola constitución (no placeholders, spec 004). Rechazado.

## R-014 — Nav superior: actualización del enlace "Blog"

- **Decision**: el nav superior en **todas** las páginas del sitio (`index.html`, `blog/index.html`, `blog/<slug>.html`, `interviews/index.html`, `interviews/<slug>.html`, `404.html`, `talks/index.html`, `legacy/index.html`) MUST tener una entrada visible "Blog" con `href="/blog/"`. Si actualmente apunta a `#blog` o a `#security-pipeline`, se corrige al merge. La entrada en el nav del landing también puede dejarse como `#blog` solo si la página actual es el landing (anchor scroll); la decisión simple y consistente es: **siempre `/blog/`** desde cualquier página, incluido el landing (un click en "Blog" desde el landing navega a `/blog/`, no a `#blog`).
- **Rationale**: cumple FR-018 y SC-010. Comportamiento consistente entre páginas (no depende de en cuál estás). El usuario que quiere ver el listado completo siempre llega ahí; el que solo quiere los 3 más recientes hace scroll dentro del landing.
- **Alternatives considered**:
  - *Nav contextual: `#blog` en landing, `/blog/` en otras páginas*: incoherente, exige JS o templating condicional. Rechazado.
  - *Mantener nav como está y solo agregar "Blog"*: el nav ya tiene una entrada blog; aquí se confirma que apunta a `/blog/` (no a `#blog`). Verificable por inspección.

## R-015 — Conjunto de etiquetas/atributos para `<a>` en posts

- **Decision**: `<a>` en cuerpo de posts se sanitiza con `ALLOWED_ATTR: ['href','title','id','class','rel','target']`. Después de DOMPurify, un post-procesador del script:
  - Asegura `rel="noopener"` (y agrega `noreferrer` si `target="_blank"`) para todo `<a target="_blank">`.
  - Detecta `<a>` cuyo `href` empiece con `https?://` (externos) y forza `target="_blank" rel="noopener noreferrer"`.
  - `<a>` con `href` empezando por `/`, `#` o relativo se mantienen sin `target`.
- **Rationale**: defensa estándar contra reverse-tabnabbing; coincide con la práctica de interviews. El post-procesador es trivial (2-3 líneas con un `each` sobre nodos `<a>` del DOM resultante).
- **Alternatives considered**:
  - *Confiar en que el autor recuerde escribir `rel="noopener"`*: frágil. Rechazado.

## R-016 — Tags como metadato no enlazable (vs. páginas por tag)

- **Decision**: los tags se renderizan como `<span class="post-tag">` (no `<a>`). No hay páginas `/blog/tag/<slug>/`. Coherente con spec.md (Assumptions: "los tags son metadato visual no enlazable").
- **Rationale**: simplicidad en v1. Páginas por tag exigen N páginas adicionales emitidas por el script + sitemap actualizado + decisión de cómo mostrar listado por tag. Postpuesto a spec posterior si el catálogo crece y el autor lo justifica con datos de uso.
- **Alternatives considered**:
  - *Tags enlazables a búsqueda en `/blog/?tag=foo`*: requiere JS de runtime para filtrar, viola constitución VII y el patrón estático del blog (a diferencia de interviews donde la búsqueda ya está justificada). Rechazado.

---

**Resultado**: las 16 decisiones están tomadas. Cero `NEEDS CLARIFICATION` pendientes. El plan puede pasar a Phase 1 sin bloqueos.
