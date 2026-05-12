# Backlog 03 — `/uses/` page (stack & herramientas)

> **Estado**: backlog · **Prioridad**: P1
> **Esfuerzo estimado**: S (~medio día) · **ROI networking**: **muy alto**

---

## Por qué

Las páginas `/uses/` son un género establecido en la comunidad dev (ver
[uses.tech](https://uses.tech)). Atraen tráfico orgánico de búsquedas long-tail
("terraform devops setup 2026", "ide para kubernetes", "macbook devops 2026"),
y refuerzan tu autoridad técnica sin requerir mantenimiento frecuente
(update cada 6-12 meses).

Para tu objetivo (networking como DevSecOps), es una de las páginas con
mejor ratio esfuerzo/visibilidad:

- SEO orgánico recurrente.
- Conversación natural en LinkedIn / Twitter / charlas ("ah, vi tu /uses/").
- Bajo costo cognitivo: lista, no narrativa.

## Objetivo

Página estática `/uses/index.html` con el stack actual: hardware, OS,
editor, terminal, herramientas DevOps/security, librerías favoritas,
servicios SaaS, y opcionalmente "abandoned" (qué dejaste de usar y por qué).

## Alcance funcional (FRs)

- **FR-01** — Ruta `/uses/` (archivo `uses/index.html`).
- **FR-02** — Estructura por secciones con `<h2>` semánticos:
  - Hardware
  - Sistema operativo y shell
  - Editor / IDE
  - Terminal y CLI
  - Lenguajes y runtimes
  - DevOps & infra
  - Security & compliance
  - Cloud & servicios
  - Productividad y notas
  - Hobbies / off-topic (opcional)
- **FR-03** — Cada item es `<dl>` con `<dt>` (nombre) y `<dd>`
  (justificación corta de 1-2 líneas). El "por qué" es lo que hace la
  página memorable, no el "qué".
- **FR-04** — Sin links a productos como afiliados ni patrocinios. Cero
  enlaces externos con `rel="sponsored"`. Si hay un link, es informativo y
  lleva `rel="noopener noreferrer"` cuando aplica.
- **FR-05** — Banner sutil al final: "última actualización: YYYY-MM" como
  `<time datetime="YYYY-MM-DD">`. Recordatorio honesto de frescura.
- **FR-06** — Aparece en el nav global (depende de Backlog 01 — shared nav).
- **FR-07** — JSON-LD `WebPage` + `Person` (referenciando al autor).
- **FR-08** — `<link rel="canonical">`, OG tags, Twitter card, sitemap entry.
- **FR-09** — `<meta name="description">` orientado a SEO long-tail
  (e.g. "Stack DevSecOps 2026: hardware, herramientas, CLIs y servicios
  que uso día a día como ingeniero en Costa Rica").

## Alcance técnico

- Página estática a mano (no requiere build script propio porque el
  contenido cambia 1-2 veces al año).
- Reutiliza `scripts/lib/layout.js` (Backlog 01) para nav/footer.
- CSS: usa componentes existentes (`.section`, `.section-label`,
  `.section-title`, `.section-lead`). Posible nuevo componente `.uses-list`
  con `<dl>` estilizado.
- Sin nuevas deps.

## Gates / tests

- `npm run html-validate` (debe pasar).
- `node tests/a11y.js` (debe pasar — agregar URL al array).
- `bash tests/no-placeholders.sh` (debe pasar).
- Lighthouse: Perf ≥ 95, A11y = 100, BP ≥ 95, SEO ≥ 95.

## Out of scope

- Sistema CMS para gestionar la lista.
- Imágenes de cada herramienta (suma peso, baja accesibilidad).
- Comparativas o reviews ("X vs Y") — ese es contenido de blog, no /uses/.
- Componentes interactivos (ratings, votos, etc.).

## Edge cases

- Si una herramienta cambia (ej: cambio de editor), update se hace en commit
  único con título "uses: editor cambió de A a B".
- Sección "abandoned" es opcional pero da credibilidad (mostrar
  cambios de opinión).

## Criterios de aceptación

- AC-01: Existe `/uses/index.html` que renderiza correctamente.
- AC-02: Aparece en sitemap.xml y en nav global.
- AC-03: Pasa todos los gates de CI sin warnings.
- AC-04: Lighthouse SEO ≥ 95.
- AC-05: La sección "última actualización" muestra fecha real.

## Constitución relevante

- I (intencionalidad), VI (a11y), VII (semantic), VIII (design tokens),
  IX (validation).

## Notas para `/specify`

> "Página /uses/ con secciones (hardware, OS, editor, terminal, lenguajes,
> DevOps, security, cloud, productividad). Cada item es `<dl>` con
> justificación. JSON-LD WebPage+Person. Sin afiliados ni imágenes. Banner
> de última actualización. Reutiliza shared nav (depende de Backlog 01)."
