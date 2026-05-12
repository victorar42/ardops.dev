# Backlog 05 — `/speaking/` page (kit de prensa para invitaciones)

> **Estado**: backlog · **Prioridad**: P2
> **Esfuerzo estimado**: S (~medio día) · **ROI networking**: alto

---

## Por qué

Hoy si alguien quiere invitarte a hablar en un evento, no tiene una página
clara con bio, foto en HD, temas que das, ni un kit descargable. La
fricción mata oportunidades. Esta página convierte tráfico de LinkedIn /
charlas en invitaciones reales.

`/talks/` ya existe como **listado de charlas pasadas/futuras**. `/speaking/`
es complementaria: **"invitame a tu evento"**, no "qué he dado".

## Objetivo

Página estática `/speaking/index.html` con bio en tres formatos, foto
descargable, temas que ofrecés, y un mailto template estructurado para
que el organizador inicie conversación con contexto.

## Alcance funcional (FRs)

- **FR-01** — Ruta `/speaking/` (archivo `speaking/index.html`).
- **FR-02** — Tres bios en `<section>` separadas:
  - **Bio corta** (~30 palabras, 1 párrafo, ideal para intro de panel).
  - **Bio media** (~80 palabras, 2 párrafos, para programa de evento).
  - **Bio larga** (~200 palabras, 3-4 párrafos, para press kit).
  - Cada una con `<button>`-style "Copiar" usando `navigator.clipboard.writeText`
    en JS módulo separado **opcional** (degrada a `<details>` con texto si
    JS está bloqueado).
- **FR-03** — Foto:
  - Headshot HD descargable (1200x1200 mínimo, formato JPG progresivo).
  - Servida en `assets/img/speaking/headshot.jpg` (existente o nueva).
  - `<a href="..." download>Descargar headshot HD (1.2 MB)</a>`.
  - Variantes opcionales: cuadrada, horizontal, B&N.
- **FR-04** — Sección "Temas que doy":
  - Lista de 4-8 temas como `<article>`s con título + descripción 1-2
    líneas + audiencia objetivo + duración aproximada.
  - Ej: "DevSecOps en pipelines GitHub Actions" · "audiencia: ingenieros
    junior/mid" · "45 min + 15 min Q&A".
- **FR-05** — Sección "Idiomas y formatos":
  - Idiomas: español (nativo), inglés (profesional).
  - Formatos: keynote, workshop, panel, podcast, AMA.
  - Modalidad: presencial Costa Rica / remoto LATAM.
- **FR-06** — CTA principal: mailto con subject y body prellenados:
  ```
  mailto:contacto@ardops.dev?subject=Invitación%20a%20speaking%3A%20[evento]
    &body=Hola%20Victor%2C%0A%0AEvento%3A%20%0AFecha%3A%20%0AAudiencia%3A%20
    %0ADuración%3A%20%0ATema%20propuesto%3A%20%0AModalidad%3A%20presencial%2Fremoto
    %0ACompensación%3A%20%0A%0AContexto%20adicional%3A%20%0A%0AGracias.
  ```
- **FR-07** — Sección "Eventos pasados destacados" (opcional, máximo 3-5):
  enlace a `/talks/` para la lista completa.
- **FR-08** — JSON-LD `Person` (puede heredarse del home — backlog 04).
- **FR-09** — Aparece en nav global (depende de backlog 01) o como link
  desde `/talks/` (decidir en spec; recomiendo nav).

## Alcance técnico

- Página estática a mano.
- Imagen del headshot debe optimizarse (TinyJPG o `sharp` en build, fuera
  de scope para esta spec — el archivo se commitea ya optimizado).
- CSS: reutiliza componentes existentes.
- "Copiar bio" como JS módulo opcional `assets/js/copy-bio.js` (~30 LOC),
  cargado con `defer`. Sin él, el `<details>` muestra el texto.

## Gates / tests

- `npm run html-validate`.
- `node tests/a11y.js` (agregar URL).
- `bash tests/no-placeholders.sh`.
- `bash tests/external-links.sh` (de Backlog 02): el mailto no aplica pero
  cualquier link externo (LinkedIn) sí.

## Out of scope

- Formulario nativo (requiere backend o servicio externo, viola CSP).
- Calendario embebido (Calendly, Cal.com — third-party).
- Video reel embebido (third-party iframe).
- Sistema de tracking de invitaciones recibidas.

## Edge cases

- Si JS está bloqueado, "Copiar bio" no funciona pero el texto sigue
  visible y seleccionable manualmente (a11y win).
- Headshot pesado: comprimir a < 200 KB JPG progresivo. Versión "preview"
  con `loading="lazy"`.

## Criterios de aceptación

- AC-01: Existe `/speaking/index.html` y aparece en sitemap.
- AC-02: Las tres bios están presentes con texto real (no Lorem).
- AC-03: El mailto template funciona en cliente de correo (Gmail, Apple Mail).
- AC-04: Headshot descarga correctamente con `download` attr.
- AC-05: Lighthouse Perf ≥ 95 a pesar de la imagen (gracias a optimización).
- AC-06: Pasa axe-core y html-validate.

## Constitución relevante

- I (intencionalidad — networking explícito), III (zero runtime deps),
  VI (a11y), VII (semantic), VIII (tokens).

## Notas para `/specify`

> "Página /speaking/ con tres bios (corta/media/larga), foto HD descargable,
> lista de temas con duración y audiencia, idiomas y formatos, mailto
> template estructurado. Diferenciada de /talks/ (que es histórico). JSON-LD
> Person. Sin formularios ni third-party (calendly, etc). Copiar bio como
> JS opcional con fallback de details."
