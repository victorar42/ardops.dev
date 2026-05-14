# Research — Spec 014 Performance & a11y thresholds

Decisiones cerradas durante Phase 0. Cada item resuelve una posible
`NEEDS CLARIFICATION` del Technical Context y fija el approach para
Phase 1.

---

## R-1 — Unidad de medida de los byte budgets

**Decisión**: usar KiB binario (1024 bytes) consistentemente.
- HTML each: ≤ 51200 bytes gzip (50 KiB).
- CSS sum: ≤ 30720 bytes gzip (30 KiB).
- JS sum: ≤ 51200 bytes gzip (50 KiB).
- IMG each: ≤ 204800 bytes raw (200 KiB).

**Rationale**: macOS Finder, Linux `ls -lh`, Lighthouse y la mayoría de
herramientas dev usan KiB binario por convención (aunque lo etiqueten
como "KB"). Mantiene consistencia con la herramienta `gzip -c -9 | wc -c`
que reporta bytes crudos. El backlog cita "50 KB" / "30 KB" / "200 KB"
de forma imprecisa; esta spec lo aterriza en bytes exactos.

**Alternativas evaluadas**:
- KB decimal (1000): rechazado porque introduce sorpresas con
  `ls -lh` (que muestra KiB).
- Mixto KB para gzip y KiB para raw: rechazado por inconsistencia.

---

## R-2 — Verificación del baseline actual

**Decisión**: el sitio actual pasa todos los budgets:

| Bucket | Actual | Budget | Margen |
|---|---:|---:|---:|
| HTML max (index.html gzip) | 6553 B | 51200 B | +44647 B (+87%) |
| CSS sum gzip | 9909 B | 30720 B | +20811 B (+68%) |
| JS sum gzip | 5327 B | 51200 B | +45873 B (+90%) |
| IMG max (speaking/headshot.jpg) | 201964 B | 204800 B | +2836 B (+1.4%) |
| IMG josue-256.webp | 14882 B | 204800 B | (cómodo) |

**Rationale**: medido con `gzip -c -9 | wc -c` el 2026-05-13. El
headshot tiene margen estrecho pero pasa. La gate `headshot-size`
existente (250 KB = 256000 bytes) sigue siendo más permisiva
intencionalmente porque exige adicionalmente JPEG + dimensiones
mínimas; ambas gates coexisten sin conflicto.

**Alternativas evaluadas**:
- Subir budget IMG a 256 KiB para alinear con headshot-size: rechazado,
  prefiero un budget global más estricto que excepción documentada en
  data-model para `headshot.jpg`.
- Excepcionar headshot.jpg vía variable env: rechazado, no hace falta,
  pasa el 200 KiB raw budget actual con 1.4 % de margen.

---

## R-3 — Cálculo de gzip determinístico

**Decisión**: usar `gzip -c -9 < FILE | wc -c` (POSIX puro, sin flags
GNU-only).

**Rationale**: `gzip -9` es el nivel máximo determinístico en GNU y
BSD gzip. `-c` envía a stdout sin tocar el archivo. `wc -c` cuenta
bytes. Funciona idéntico en macOS y Ubuntu CI runner. Los números
varían < 1 % entre versiones; el budget tiene > 60 % de margen en
todos los buckets HTML/CSS/JS así que la varianza es irrelevante.

**Alternativas evaluadas**:
- `brotli` para alinear con lo que sirve GitHub Pages: rechazado,
  Brotli no está garantizado en el runner por default y la diferencia
  con gzip-9 es < 10 % (documentado en spec Edge Cases).
- `zopfli` (better gzip): rechazado por no ser POSIX.
- Medir en bytes raw (sin gzip): rechazado porque sobreestima ~3x el
  peso real servido.

---

## R-4 — Parser de `<img>` (regex bash vs jsdom helper)

**Decisión**: helper Node CommonJS `tests/lib/parse-img.js` que usa
`jsdom` (devDep ya presente). El script bash `tests/img-attrs.sh` lo
invoca y consume el JSON resultante.

**Rationale**: parsear HTML con regex bash es frágil (multi-line tags,
atributos en cualquier orden, comillas simples vs dobles, entities).
`jsdom` ya está instalado para `tests/a11y.js` y `tests/check-feed.js`,
así que es deps-cost-free. Mantener el orquestador en bash conserva la
convención del repo y permite output legible humano.

**Alternativas evaluadas**:
- Regex bash puro: rechazado, frágil con HTML válido pero complejo.
- Reescribir `img-attrs` 100 % en Node como `scripts/check-img-attrs.js`:
  válido pero rompe la convención de gates simples bash;
  reconsiderable si jsdom queda pesado. Por consistencia con
  `tests/now-freshness.sh` y `tests/headshot-size.sh`, mantenemos
  shell-orquesta + Node-helper.
- Usar `cheerio`: rechazado, agrega dep nueva.

---

## R-5 — Detección de "primera imagen" del documento (LCP candidate)

**Decisión**: para cada documento HTML, la "primera `<img>`" es la
primera por orden de aparición en el DOM (orden source). El helper
`parse-img.js` enumera con un índice incremental y reporta `index === 0`
como LCP candidate.

**Reglas**:
- Si `index === 0`: NO debe tener `loading="lazy"`. Si lo tiene, debe
  llevar además `fetchpriority="high"`.
- Si `index >= 1`: DEBE tener `loading="lazy"`.
- Todas (incluyendo index 0): `alt`, `width`, `height`, `decoding="async"`.

**Rationale**: en una sola página puede haber más de una imagen pero el
LCP usualmente es la primera del DOM por encima del fold. No requerimos
inspección visual; la primera por orden source es heurística
aceptablemente segura.

**Alternativas evaluadas**:
- Marcar manualmente la LCP con `data-lcp="true"`: rechazado por
  fricción para autores; preferimos heurística automática.
- Detectar por viewport position con headless browser: rechazado,
  overkill y dependiente de viewport.
- Excepcionar cualquier imagen con `fetchpriority="high"`: aceptado
  como escape hatch documentado.

---

## R-6 — Exception list para imágenes grandes

**Decisión**: cero exceptions hard-coded. El sitio actual respeta el
budget global de 200 KiB. Si en el futuro alguna imagen lo excede de
forma justificada, se documenta en la spec correspondiente y se
agrega una variable de override por archivo (`IMG_BUDGET_EXCEPTIONS`)
en ese momento (YAGNI hoy).

**Rationale**: agregar el mecanismo de exception ahora es
sobre-ingeniería para un sitio con 4 imágenes. La gate `headshot-size`
ya tiene su propia política específica.

**Alternativas evaluadas**:
- Allowlist en `tests/byte-budgets.sh`: rechazada por YAGNI.
- Per-directory budgets (`assets/img/speaking/*` = 250 KiB): rechazada,
  prefiero homogeneidad hasta que aparezca un caso real.

---

## R-7 — URLs en Lighthouse + alineación desktop↔mobile

**Decisión**:
- Agregar `http://localhost/interviews/index.html` a ambas configs.
- Agregar el último post real del blog (cuando se construya el sitio
  con fixtures, será `http://localhost/blog/2026-04-pillars.html` o
  similar — el más reciente en `blog/`). Si la lista de posts cambia,
  se actualiza la config manualmente. Para evitar fragilidad en CI con
  un nombre que pueda cambiar, en esta primera iteración listo
  **explícitamente** el slug más reciente.
- Subir `categories:performance` mobile de 0.9 → 0.95 (FR-01 lo exige
  uniforme). LCP/TBT mobile permanecen permisivos (3000 ms / 300 ms)
  porque la spec no fija valores mobile y la realidad de redes mobile
  emulated permite slack.
- Mantener `404.html` en la lista (regresión protection trivial).

**Rationale**: la spec exige los 7 endpoints listados (home, blog,
último post, interviews, talks, speaking, now). Hoy faltan
interviews + último post. Mobile a 0.95 alinea con desktop sin tocar
CWV.

**Alternativas evaluadas**:
- Auto-descubrir URLs desde sitemap.xml en runtime: rechazada por ahora
  (mantener manual hasta que el sitio crezca lo justifique).
- Subir LCP mobile a 2500 ms para igualar desktop: rechazado, en mobile
  emulated Lighthouse es razonable dejar 3000 ms (alineado con la
  recomendación oficial de Google para "good" mobile LCP).

---

## R-8 — Policy de fonts en bash sin parser CSS completo

**Decisión**: `tests/no-third-party-fonts.sh` ejecuta 3 chequeos
independientes con `grep -rE` sobre archivos servidos:

1. **HTML**: `grep -rE "fonts\.(googleapis|gstatic)\.com" *.html **/*.html`
   → si encuentra match, falla.
2. **CSS @font-face src externos**: `awk` recorre cada `@font-face { ... }`
   bloque y dentro busca `src:` con URL absoluta cuyo dominio no sea el
   propio (`ardops.dev`) ni `assets/fonts/...` relativo. Si encuentra
   un `https://...` ajeno o un dominio distinto del propio, falla.
3. **Inventario de `assets/fonts/`**: `find assets/fonts/ -type f` que
   NO termine en `.woff2` y NO sea `LICENSE.md` → falla listando el
   archivo.
4. **`font-display: swap`**: para cada `@font-face` detectado por awk,
   verifica que el bloque contiene `font-display: swap;` (o
   `font-display:swap`). Si falta, falla con la ruta del CSS y la
   font-family afectada.

**Rationale**: regex+awk es suficiente porque los `@font-face` del repo
viven solo en `assets/css/base.css` (verificado), tienen una estructura
predecible, y la spec no requiere validación CSS exhaustiva (eso lo
hace el browser/Lighthouse). Sin parser CSS = cero deps.

**Alternativas evaluadas**:
- `postcss` AST: rechazado, dep nueva.
- Node helper con `css-tree`: rechazado, dep nueva.
- Solo regex (sin awk para bloques): rechazado, pierde el matching
  `font-display` por `@font-face`.

---

## Consolidated Tech Context (resolved)

Todos los items `NEEDS CLARIFICATION` resueltos:

| Item | Decisión |
|---|---|
| Unidad de bytes | KiB binario (R-1) |
| Cálculo gzip | `gzip -c -9 \| wc -c` (R-3) |
| Parser img | jsdom helper invocado desde bash (R-4) |
| LCP candidate | primera `<img>` por orden DOM (R-5) |
| Img exceptions | none hard-coded (R-6) |
| URLs Lighthouse | +interviews/, +último post; mobile perf 0.95 (R-7) |
| Fonts parser | grep+awk sobre `@font-face` (R-8) |
| Baseline actual | PASS en los 4 budgets (R-2) |

Listo para Phase 1.
