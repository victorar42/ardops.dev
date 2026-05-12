# Backlog 06 — `/now/` page (qué estoy haciendo este mes)

> **Estado**: backlog · **Prioridad**: P2
> **Esfuerzo estimado**: XS (~2-3 horas) · **ROI networking**: medio (sustento de actividad)

---

## Por qué

Las páginas `/now/` son convención del [movimiento nownownow](https://nownownow.com)
iniciado por Derek Sivers. Una página, actualizada cada 4-6 semanas, que
responde "qué estoy haciendo ahora mismo profesionalmente y como hobby".

Beneficio para tu objetivo:

- **Sustento de actividad** entre posts de blog (publicar 1 post/mes es OK,
  pero un /now/ actualizado da sensación de presencia continua).
- Bajo costo cognitivo: bullet points, no narrativa larga.
- Genera conversación: "vi que estás aprendiendo X" → networking real.
- Honestidad técnica: muestra trabajos en progreso, no solo logros.

## Objetivo

Página estática `/now/index.html` con secciones temáticas, fácil de
actualizar (ideal: un commit cada 4-6 semanas).

## Alcance funcional (FRs)

- **FR-01** — Ruta `/now/` (archivo `now/index.html`).
- **FR-02** — Banner superior: "Última actualización: YYYY-MM-DD" como
  `<time datetime="...">`. **Imposible no actualizar** sin que se note.
- **FR-03** — Secciones sugeridas (decidir en spec):
  - **Trabajo** — qué estoy construyendo / en qué proyecto estoy.
  - **Aprendiendo** — temas técnicos que estoy explorando.
  - **Leyendo** — libros / papers / artículos relevantes.
  - **Hablando** — próximas charlas / podcasts.
  - **Vida** — opcional, 1-2 líneas, no oversharing.
- **FR-04** — Cada sección es lista corta (max 5 items por sección).
- **FR-05** — Aparece en nav global (depende de backlog 01) **o** como
  link en footer. Recomendación: footer (low-noise) + link sutil desde home.
- **FR-06** — Link a [nownownow.com/about](https://nownownow.com/about)
  al pie con `rel="noopener noreferrer"` para credit del movimiento.
- **FR-07** — JSON-LD `WebPage` con `dateModified`.
- **FR-08** — RSS optional `/now/feed.xml` con un solo item por update
  (diferido — ver backlog 04).

## Alcance técnico

- HTML a mano. No requiere build script.
- Reutiliza shared layout (Backlog 01).
- Sin nuevas deps.

## Gates / tests

- `npm run html-validate`.
- `node tests/a11y.js` (agregar URL).
- `bash tests/no-placeholders.sh`.
- **Nuevo gate sugerido `tests/now-freshness.sh`**: parsea `<time
  datetime="">` del banner, falla si tiene > 90 días de antigüedad
  (fuerza la disciplina de mantenimiento). Opcional pero útil.

## Out of scope

- CMS para gestionar updates.
- Histórico de versiones (lo que importa es "ahora", no "antes").
- Comentarios o reacciones.
- Newsletter de updates de /now/.

## Edge cases

- Si te olvidás de actualizar, el gate de freshness falla en CI cuando
  hagas otro commit. Es una feature, no un bug.
- Sección "Vida" debe tener boundary claro: nada personal-personal.

## Criterios de aceptación

- AC-01: Existe `/now/index.html`.
- AC-02: Tiene banner "Última actualización" con fecha real.
- AC-03: Tiene al menos 3 secciones con contenido real (no Lorem).
- AC-04: Aparece en sitemap.xml.
- AC-05: Pasa todos los gates de CI.
- AC-06 (opcional): Gate de freshness pasa porque la fecha es < 90 días.

## Constitución relevante

- I (intencionalidad), III (zero deps), VI (a11y), VII (semantic).

## Notas para `/specify`

> "Página /now/ estilo nownownow.com con banner de última actualización
> (datetime), secciones cortas (Trabajo, Aprendiendo, Leyendo, Hablando,
> Vida), bullets máx 5 por sección. Credit a nownownow al pie. Link en
> footer (no nav principal) + link sutil en home. Opcionalmente gate de
> freshness 90 días."
