# Research — Speaking Page (spec 012)

## R-1 · Patrón "Copiar bio" sin dependencias

**Decision**: módulo vanilla `assets/js/copy-bio.js` cargado con
`defer`. Registra un único listener `click` delegado en el `<main>`
que filtra por `event.target.closest('[data-copy-target]')`, lee el
texto plano del nodo referenciado por id, llama a
`navigator.clipboard.writeText(text)` y actualiza el elemento
`[data-copy-status]` con "Copiado ✓" durante 2 s. El bloque mismo
está envuelto en `<details><summary>` para que el contenido siempre
sea visible y seleccionable manualmente sin JS.

**Rationale**:
- `navigator.clipboard.writeText` es Web API nativa (soporte universal
  evergreen desde 2018), no requiere dep.
- Listener delegado = un solo `addEventListener`, ahorra LOC y
  facilita CSP `script-src 'self'` sin handlers inline.
- `<details>` nativo cubre el escenario "JS bloqueado" sin polyfill y
  cumple WCAG (constitución VI).
- `aria-live="polite"` en `[data-copy-status]` anuncia el cambio a
  lectores de pantalla sin robar foco.

**Alternativas evaluadas**:
- `document.execCommand('copy')`: deprecated, MDN lo desaconseja.
  Rechazado.
- Lib `clipboard.js` (~3 KB): viola constitución IV (cero deps sin
  justificación). Rechazado.
- Web Share API: solo soporta compartir, no copia silenciosa.
  Rechazado.
- Sin botón, solo `<details>`: pierde la fricción cero del caso
  principal (organizadora copia con un click). Rechazado.

## R-2 · Estrategia de imagen para el headshot

**Decision**: un único JPG progresivo HD en
`assets/img/speaking/headshot.jpg`, ≥ 1200×1200 px, ≤ 250 KB. Usado
tanto para el preview inline (`<img src loading="lazy" decoding="async">`
con `width="320" height="320"` declarados) como para la descarga
directa (`<a href download="ardon-headshot.jpg">`). Sin `<picture>`,
sin variantes responsive, sin LQIP.

**Rationale**:
- 250 KB para una sola imagen lazy-loaded está dentro del budget
  global de 350 KB; no compite por LCP porque está debajo del fold.
- Servir el mismo archivo evita un pipeline de optimización (sharp,
  squoosh) que añadiría build-time complexity para una sola foto.
- Dimensiones declaradas mantienen CLS = 0.
- JPG progresivo permite render parcial temprano si la conexión es
  lenta.

**Alternativas evaluadas**:
- `<picture>` con AVIF/WebP/JPG fallback: gana ~30 % de peso pero
  requiere generar 3 variantes; complejidad no justificada para 1
  imagen. Rechazado.
- LQIP (low-quality placeholder inline base64): añade ~3 KB inline al
  HTML y complica CSP (style-src). Rechazado.
- Sharp en build: dep de Node nuevo; viola IV salvo justificación
  fuerte que aquí no existe. Rechazado.

## R-3 · JSON-LD: nodo nuevo o referencia por @id

**Decision**: emitir un único bloque `<script type="application/ld+json">`
con `@type: Person` y `@id: "https://ardops.dev/#person"` apuntando al
nodo canónico declarado en home (entregado por spec 011). Sin
redefinir `name`, `url`, `sameAs`, `image`. Opcionalmente añadir
`mainEntityOfPage: "https://ardops.dev/speaking/"` para indicar que
esta página es la representación de press-kit del Person.

**Rationale**:
- Spec 011 ya estableció el `@id` canónico y la gate
  `tests/jsonld-validate.sh` lo registra como `GLOBAL_IDS`.
  Referenciar evita duplicación y mantiene la fuente de verdad única.
- Patrón ya validado en spec 011 para `interview.author`
  (`{ '@id': PERSON_ID }`). Reusar el patrón = menos cognitive load.
- Schema.org permite y recomienda esta práctica de "linked data" via
  `@id`.

**Alternativas evaluadas**:
- Repetir todas las propiedades del Person: rompe DRY, riesgo de
  drift. Rechazado.
- Añadir un `WebPage` además: noise para validadores, no añade
  rich-result. Rechazado.

## R-4 · Encoding del mailto

**Decision**: construir el `href` del CTA cumpliendo RFC 6068:

```
mailto:contacto@ardops.dev?subject=Invitaci%C3%B3n%20a%20speaking%3A%20%5Bevento%5D&body=Hola%20Victor%2C%0A%0AEvento%3A%20%0AFecha%3A%20%0AAudiencia%3A%20%0ADuraci%C3%B3n%3A%20%0ATema%20propuesto%3A%20%0AModalidad%20(presencial%2Fremoto)%3A%20%0ACompensaci%C3%B3n%3A%20%0AContexto%20adicional%3A%20%0A%0AGracias.
```

- `%20` para espacios.
- `%0A` para saltos de línea en `body`.
- `%3A` para `:`, `%2F` para `/`, `%2C` para `,`.
- Caracteres no-ASCII (`ó`, `ú`) → secuencias UTF-8 percent-encoded
  (`%C3%B3`, etc.).

**Rationale**: Gmail web, Outlook web y Apple Mail interpretan
correctamente RFC 6068. Verificación manual obligatoria al final del
implement (T-smoke).

**Alternativas evaluadas**:
- Usar `+` para espacios (estilo `application/x-www-form-urlencoded`):
  no es estándar de mailto y algunos clientes lo muestran como `+`
  literal. Rechazado.
- Generar el mailto via JS al click: rompe progresividad (sin JS, no
  funciona) y complica CSP. Rechazado.

## R-5 · Charlas destacadas: sync vs hardcoded

**Decision**: hardcodear 3-5 entries en HTML dentro de la sección
"Eventos pasados destacados", curadas manualmente. Cada entry es un
`<li>` con título, evento y año; opcionalmente un anchor a
`/talks/#talk-id` si esa charla tiene anchor estable.

**Rationale**:
- 3-5 ítems no justifican un generador (yagni).
- Curaduría editorial: no son "las más recientes", son "las más
  relevantes para un organizador externo". Un generador imitaría mal
  ese juicio.
- Cero coupling con `talks/index.html` → cambios en una página no
  rompen la otra.

**Alternativas evaluadas**:
- Generar desde el mismo data source que `/talks/`: añade un script
  builder y re-introduce coupling. Rechazado.
- Iframe a `/talks/`: third-party-ish, viola UX y constitución VIII
  (frame-ancestors). Rechazado.

## R-6 · Gate de tamaño del headshot

**Decision**: nuevo script bash `tests/headshot-size.sh` que:

1. Verifica que `assets/img/speaking/headshot.jpg` existe.
2. Verifica con `file` que es `JPEG image data`.
3. Verifica con `wc -c` que su tamaño es ≤ 256000 bytes (= 250 KB
   binarios con margen).
4. Verifica con `sips -g pixelWidth -g pixelHeight` (macOS) o
   `identify` (ImageMagick, opcional) que ancho ≥ 1200 y alto ≥ 1200.
   Si la herramienta no está disponible, hace skip con warning (no
   fail) — la verificación dura es el peso.

Output:
```
✓ headshot-size gate: assets/img/speaking/headshot.jpg (218421 bytes, 1500x1500)
```

**Rationale**:
- Cero deps nuevas: `wc`, `file`, `sips` son del SO.
- Cumple constitución VII (perf como feature) y IX (gate en CI).
- Ejecuta en < 100 ms.

**Alternativas evaluadas**:
- `sharp` en Node: viola IV. Rechazado.
- Confiar en revisión manual: rompe IX. Rechazado.

## R-7 · CSS scoped vs nuevo archivo

**Decision**: añadir bloque scoped `/* speaking page */` al final de
`assets/css/components.css`, con prefijo `.speaking-*` en todos los
selectores. Cero variables nuevas (todo via `var(--accent)`,
`var(--bg-secondary)`, etc., ya definidas en `tokens.css`).

**Rationale**:
- Mantiene la cantidad de archivos CSS estable (constitución VII:
  menos requests = menos round-trips, aunque GitHub Pages usa HTTP/2).
- Evita un archivo per-page que se vuelve drift de tokens.
- `.speaking-*` previene colisión con clases de otras páginas.

**Alternativas evaluadas**:
- `assets/css/speaking.css` como archivo separado: añade 1 request +
  drift. Rechazado.
- Inline `<style>` en `speaking/index.html`: viola constitución VIII
  (CSP `style-src 'self'` sin hash). Rechazado.

## R-8 · Alias de correo: contacto@ vs speaking@

**Decision**: usar `contacto@ardops.dev` (el alias canónico del sitio,
ya en footer y demás CTAs).

**Rationale**:
- Consistencia: una organizadora que ya tiene en mente el correo del
  sitio no se confunde.
- Cero infra nueva (no hay que crear un alias adicional en el
  proveedor de correo).
- Si el volumen de invitaciones crece y satura `contacto@`, se puede
  introducir `speaking@` con redirect en una spec futura sin romper
  nada (el patrón de la spec lo permite con un único cambio).

**Alternativas evaluadas**:
- `speaking@ardops.dev`: requiere alta de alias, cero ROI a esta
  escala. Rechazado por ahora; documentado como upgrade path.
