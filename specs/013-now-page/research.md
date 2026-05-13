# Phase 0 — Research

**Feature**: `/now/` page (spec 013) · **Date**: 2026-05-13

Decisiones cerradas antes de Phase 1. Cada entrada usa el formato
canónico: **Decision / Rationale / Alternatives considered**.

---

## R-1 — Cantidad y orden de secciones canónicas

**Decision**: Orden canónico fijo en la página: **Trabajo →
Aprendiendo → Leyendo → Hablando → Vida**. Mínimo 3 (las tres
primeras), opcionales las dos últimas. La omisión es válida: la
sección simplemente no aparece, sin placeholder.

**Rationale**: el orden refleja prioridad descendente para el
visitante objetivo (organizador / recruiter / lector recurrente):
qué construye > qué aprende > qué consume > dónde lo verás >
contexto humano. Mantener el orden estable evita "spot-the-difference"
entre updates mensuales y simplifica el gate `no-placeholders`.

**Alternatives considered**:
- Orden libre por mes: rompe expectativa del lector recurrente.
- 5 secciones obligatorias: induce relleno los meses flojos →
  contradice principio I (intencionalidad).
- Solo Trabajo + Aprendiendo: muy escueto, no diferencia de
  un `<h2>` en home.

---

## R-2 — Formato del banner de fecha

**Decision**: Banner cerca del tope con texto visible
"Última actualización: <fecha humana en español>" donde la fecha
está envuelta en `<time datetime="YYYY-MM-DD">…</time>`. La fecha
humana se escribe a mano en español neutro
(ej. "12 de mayo de 2026"). El `datetime` ISO 8601 es la fuente de
verdad para máquinas (JSON-LD `dateModified`, gate freshness).

**Rationale**: cumple FR-02 y FR-07. `<time datetime>` es HTML
semántico estándar (constitución VII) y permite parsing
determinístico por el gate bash. El texto humano evita que un
visitante tenga que mentalizar el ISO. UTC implícito (sin offset)
es suficiente para una página actualizada semanalmente.

**Alternatives considered**:
- `<meta name="updated">`: no es estándar y no es visible.
- Sólo ISO visible: feo, hostil al lector no técnico.
- `data-*` custom: no estándar, no aporta semántica.

---

## R-3 — Forma del JSON-LD

**Decision**: bloque único `<script type="application/ld+json">`
con `@graph` o entidad simple:

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://ardops.dev/now/#webpage",
  "url": "https://ardops.dev/now/",
  "name": "Now — qué estoy haciendo este mes",
  "description": "…",
  "inLanguage": "es",
  "dateModified": "2026-05-13",
  "isPartOf": { "@id": "https://ardops.dev/#website" },
  "about": { "@id": "https://ardops.dev/#person" }
}
```

`dateModified` MUST coincidir con el `datetime` del banner.

**Rationale**: aprovecha los `@id` canónicos consolidados por
spec 011 (`WebSite` y `Person`). `WebPage` es el tipo correcto
(no `Article` porque no hay autor de publicación ni `headline`).
`dateModified` cierra el loop SEO y permite a buscadores marcar
frescura.

**Alternatives considered**:
- `Article`: implica `headline`, `datePublished`, `author` →
  semántica errada para "página de estado".
- `ProfilePage`: cercano, pero apunta a Person; nuestra página
  trata sobre actividad temporal, no sobre la persona como entidad.
- Omitir JSON-LD: rompe FR-07 y degrada consistencia con resto del sitio.

---

## R-4 — Ubicación del link desde la home

**Decision**: el enlace primario al `/now/` vive en el **footer
global** (renderizado por `scripts/lib/layout.js`), por lo tanto
aparece en TODAS las páginas del sitio, no solo en home. El
"link sutil" mencionado en FR-05 se materializa como una línea
corta tipo "¿Querés saber en qué ando ahora mismo? Mirá `/now/`."
ubicada al final del bloque de bio en la home (cerca del cierre,
antes del footer), no como CTA visualmente protagonista.

**Rationale**: footer global = un solo cambio en
`scripts/lib/layout.js` afecta todas las páginas → cumple FR-05
sin tocar 11 archivos. El link en home queda discreto, no compite
con el CTA principal (constitución II, principio I).

**Alternatives considered**:
- Agregar /now/ al NAV principal: contradice FR-05
  ("aparece en footer no en nav") y satura la barra (ya tiene 8
  ítems después de spec 012).
- Link sólo en home: invisible en el resto del sitio; complica
  el "discovery" desde `/blog/` o `/talks/`.
- Botón grande en hero: contradice "link sutil" + roba foco al CTA.

---

## R-5 — Estrategia del gate de freshness

**Decision**: `tests/now-freshness.sh`, Bash POSIX,
`set -euo pipefail`. Pasos:

1. Resolver `NOW_PAGE` (default `now/index.html`).
2. Extraer el primer `<time datetime="YYYY-MM-DD"` con `grep -Eo`
   o `sed -E`. Si no hay match → exit 2 con mensaje
   "no se encontró `<time datetime>` parseable".
3. Validar formato `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`. Si falla → exit 3.
4. Convertir a epoch UTC con `date -u -j -f "%Y-%m-%d" "$DATE" "+%s"`
   (macOS BSD) o `date -u -d "$DATE" "+%s"` (GNU). Detectar OS y
   elegir variante.
5. Calcular `days = (now_epoch - date_epoch) / 86400`.
6. Si `days < 0` (fecha futura) → exit 4 con mensaje "fecha
   futura: YYYY-MM-DD".
7. Si `days > NOW_FRESHNESS_MAX_DAYS` (default 90) → exit 5
   con mensaje "now-freshness: /now/ no se actualiza desde
   YYYY-MM-DD (N días). Actualizá now/index.html…".
8. Sino → exit 0 con `✓ now-freshness gate: actualizada hace N días (YYYY-MM-DD)`.

**Rationale**: zero deps (solo bash + `date`), determinístico,
soporta override por env var (`NOW_PAGE`, `NOW_FRESHNESS_MAX_DAYS`)
para fixtures de testing. Detección OS necesaria porque dev local
es macOS (BSD `date`) y CI es Ubuntu (GNU `date`).

**Alternatives considered**:
- Node script: introduce ejecutar `node` para algo que `date` resuelve;
  más LOC.
- Python: deps OS-level, contradice patrón del repo (todos los gates
  son bash + node existentes).
- Umbral 60 días: muy agresivo, dispara falsos positivos en
  vacaciones / sprints largos.
- Umbral 120 días: pierde el punto (sustento de actividad).

---

## R-6 — Política de CSS

**Decision**: reutilizar las clases utilitarias y de layout ya
existentes (`.section`, `.lead`, `.list-clean`, `.muted`, etc.).
Si después de un primer pase visual queda algo específico
(p.ej. el aspecto del banner de fecha), agregar un bloque scoped
en `assets/css/components.css` con prefijo `.now-*` (p.ej.
`.now-banner`, `.now-section`). Cero variables nuevas en
`tokens.css`.

**Rationale**: constitución II (identidad visual preservada) y
principio I (no over-engineering). La página es básicamente texto
con listas — el sistema de design tokens ya cubre 95% del look.

**Alternatives considered**:
- CSS dedicado en `assets/css/now.css`: archivo nuevo para
  ~30 LOC = over-engineering.
- Inline styles: rompe CSP (constitución VIII).
- Crear utilidad `.timestamp` global: tentador, pero solo se usa acá.

---

## R-7 — Política de enlaces externos en bullets

**Decision**: cualquier `<a>` con `href` que apunte fuera de
`ardops.dev` (libros en Amazon, papers en arXiv, podcasts, etc.)
DEBE llevar `target="_blank"` + `rel="noopener noreferrer"`,
verificable por `tests/external-links.sh` ya cableado. El texto del
enlace debe ser descriptivo (no "click aquí" — constitución VI).

**Rationale**: constitución VIII (anti-tabnabbing). Patrón uniforme
en todo el sitio. El gate ya lo enforcea para las páginas en
`STATIC_PAGES`; basta con agregar `now/index.html`.

**Alternatives considered**:
- Sin `target="_blank"`: navegación dentro de la misma pestaña.
  Aceptable conceptualmente, pero rompe consistencia con el resto
  del sitio (otras páginas abren externos en nueva pestaña).

---

## R-8 — Footer link consolidado

**Decision**: agregar el link `/now/` dentro de la función de footer
en `scripts/lib/layout.js`. La función `renderFooter()` ya emite la
columna de "Sitio" o equivalente; se inserta el `<li><a href="/now/">Now</a></li>`
en el grupo adecuado. La regeneración de páginas se hace via
`node scripts/build-layout.js && node scripts/build-blog.js &&
node scripts/build-interviews.js --include-fixtures --out interviews/`.

**Rationale**: una sola edición → 11+ páginas actualizadas. Es el
patrón ya validado por specs 008, 010, 011 y 012.

**Alternatives considered**:
- Edición manual del footer de cada página: 11 cambios redundantes
  → drift garantizado.
- Generar el link sólo en algunas páginas: rompe principio de footer
  global consistente.

---

## Resumen

8 decisiones cerradas. Cero `NEEDS CLARIFICATION` restantes.
Phase 1 puede comenzar sin bloqueos.
