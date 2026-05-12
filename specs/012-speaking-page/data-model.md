# Data Model — Speaking Page (spec 012)

> No hay base de datos. Todas las "entidades" son **contenido editorial
> embebido en HTML**. Este documento define **estructura, nombres y
> cardinalidades** para que `/tasks` e `/implement` no improvisen.

## Entidades

### 1. Bio

Texto plano en tres longitudes. Cada instancia se renderiza como un
`<section class="speaking-bio">` con `<details>` interno.

| Campo | Tipo | Cardinalidad | Notas |
|-------|------|--------------|-------|
| `id` | string | required | `bio-short`, `bio-medium`, `bio-long` |
| `label` | string | required | "Bio corta", "Bio media", "Bio larga" |
| `wordTarget` | int | required | 30 / 80 / 200 (±15 %) |
| `paragraphCount` | int | required | 1 / 2 / 3-4 |
| `body` | string (texto plano) | required | Sin HTML; saltos de párrafo como `\n\n` para que el JS de copia los preserve |

**Cardinalidad total**: exactamente **3** instancias (short, medium,
long). Un loop de validación en `/implement` (T-validate) verifica
que existan los tres ids.

**Validación**:
- `wordCount(body)` está dentro de `wordTarget ± 15 %`.
- `paragraphCount` coincide con `body.split('\n\n').length`.
- `body` no contiene `<` ni `>`.

### 2. SpeakingTopic

Tema que Victor ofrece dar. Renderizado como `<article class="speaking-topic">`
dentro de `<section class="speaking-topics">`.

| Campo | Tipo | Cardinalidad | Notas |
|-------|------|--------------|-------|
| `title` | string | required | ≤ 80 chars |
| `description` | string | required | 1-2 líneas, ≤ 240 chars |
| `audience` | string | required | "ingenieros junior/mid", "líderes técnicos", etc. |
| `duration` | string | required | "45 min + 15 min Q&A", "workshop 3 h", etc. |

**Cardinalidad total**: entre **4 y 8** instancias.

### 3. HighlightedTalk

Charla pasada destacada. Renderizada como `<li>` dentro de una `<ol>`
en `<section class="speaking-highlights">`.

| Campo | Tipo | Cardinalidad | Notas |
|-------|------|--------------|-------|
| `title` | string | required | título de la charla |
| `event` | string | required | nombre del evento |
| `year` | int | required | año (formato ISO 4-dígitos) |
| `talkAnchor` | string \| null | optional | `/talks/#talk-id` si hay anchor estable; si no, omite el link |

**Cardinalidad total**: entre **3 y 5** instancias.

**Regla**: además, una entrada extra fija "Ver historial completo" →
`/talks/` aparece al final como link separado (no es una
HighlightedTalk, es un CTA puente).

### 4. HeadshotAsset

Archivo binario y su metadato.

| Campo | Tipo | Cardinalidad | Notas |
|-------|------|--------------|-------|
| `path` | string | required | `/assets/img/speaking/headshot.jpg` |
| `width` | int | required | ≥ 1200 px |
| `height` | int | required | ≥ 1200 px |
| `bytes` | int | required | ≤ 256000 (= 250 KB binarios) |
| `format` | string | required | `image/jpeg` (JPG progresivo) |
| `downloadFilename` | string | required | `ardon-headshot.jpg` |
| `previewWidth` | int | required | dimensión declarada en `<img width>` (ej: 320) |
| `previewHeight` | int | required | dimensión declarada en `<img height>` (ej: 320) |
| `alt` | string | required | descriptivo (≥ 30 chars), no genérico |

**Cardinalidad total**: exactamente **1** instancia.

**Validación**: gate `tests/headshot-size.sh` verifica `bytes ≤
256000`, formato JPEG, dimensiones reales ≥ 1200×1200.

### 5. MailtoTemplate

Configuración del CTA principal.

| Campo | Tipo | Cardinalidad | Notas |
|-------|------|--------------|-------|
| `to` | string | required | `contacto@ardops.dev` |
| `subjectPrefix` | string | required | `Invitación a speaking: ` (con espacio final + `[evento]` placeholder) |
| `bodyFields` | string[] | required | Lista ordenada de **8** etiquetas: Evento, Fecha, Audiencia, Duración, Tema propuesto, Modalidad (presencial/remoto), Compensación, Contexto adicional |
| `bodyOpening` | string | required | "Hola Victor," |
| `bodyClosing` | string | required | "Gracias." |

**Cardinalidad total**: exactamente **1** instancia (el botón único de
CTA principal).

**Validación**: el `href` rendereado, después de URL-decode, contiene
las 8 labels exactas en orden.

### 6. JsonLdReference

Referencia al `Person` canónico declarado en home.

| Campo | Valor fijo | Notas |
|-------|------------|-------|
| `@context` | `https://schema.org` | required |
| `@type` | `Person` | required |
| `@id` | `https://ardops.dev/#person` | DEBE coincidir exactamente con el Person canónico de home (constante `PERSON_ID` en `scripts/lib/jsonld.js`). |
| `mainEntityOfPage` | `https://ardops.dev/speaking/` | opcional, recomendado |

**Cardinalidad**: exactamente **1** bloque `<script type="application/ld+json">`
en `<head>`.

**Validación**: gate `tests/jsonld-validate.sh` (al añadir
`speaking/index.html` a `STATIC_PAGES`) verifica `@id` resuelve a
`PERSON_ID` ya registrado en `GLOBAL_IDS`.

## Relaciones

- `Bio` × 3 — `SpeakingTopic` × 4..8 — `HighlightedTalk` × 3..5:
  todas independientes, sin foreign keys. Cada una se edita en su
  propia sección del HTML.
- `HeadshotAsset` se referencia desde dos puntos del HTML: el `<img
  src>` del preview y el `<a href download>` de la descarga.
- `MailtoTemplate` se materializa en un único `<a class="cta">` y
  además su `to` se imprime como texto visible junto al CTA
  (FR-010).
- `JsonLdReference` es huérfana: solo apunta al `@id` global; no se
  enlaza con las demás entidades de la página.

## Estado y transiciones

Estático. No hay transiciones de estado runtime. Las únicas
"transiciones" son editoriales (commit a `main` rotando texto, foto
o lista de temas/charlas).

## Mapping a HTML (resumen)

| Entidad | DOM target |
|---------|-----------|
| Bio (×3) | `<section id="bios"> <details class="speaking-bio" data-bio-id="…">` |
| SpeakingTopic (×4..8) | `<section id="topics"> <article class="speaking-topic">` |
| HighlightedTalk (×3..5) | `<section id="highlights"> <ol> <li>` |
| HeadshotAsset | `<figure class="speaking-headshot"> <img> + <a download>` |
| MailtoTemplate | `<a class="cta speaking-cta" href="mailto:…">` + `<p>` con la dirección visible |
| JsonLdReference | `<head> <script type="application/ld+json">` |
