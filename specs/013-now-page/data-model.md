# Phase 1 — Data Model

**Feature**: `/now/` page (spec 013) · **Date**: 2026-05-13

Modelo conceptual del documento `/now/`. No hay storage persistente
ni schema relacional — son entidades semánticas que describen el
HTML servido y los reportes del gate.

---

## Page

Documento HTML servido en `/now/`. Una sola instancia.

| Campo | Tipo | Origen | Notas |
|-------|------|--------|-------|
| `url` | string | hardcoded | `https://ardops.dev/now/` |
| `lang` | string | `<html lang>` | `es` |
| `title` | string | `<title>` | "Now — qué estoy haciendo este mes · ardops.dev" |
| `description` | string | `<meta name="description">` | 50-160 chars, neutral, en español |
| `canonical` | string | `<link rel="canonical">` | mismo que `url` |
| `dateModified` | ISO date | banner `<time datetime>` + JSON-LD | YYYY-MM-DD, UTC implícito |
| `sectionsCount` | int | conteo de `<section data-now-section>` | 3-5 |
| `bulletsTotal` | int | suma de `<li>` dentro de secciones | 3-25 (3 sec × 1 + 5 sec × 5) |
| `hasJsonLd` | bool | presencia de `<script type="application/ld+json">` | siempre `true` |
| `hasNownownowCredit` | bool | presencia de `<a href*="nownownow">` | siempre `true` |

### Reglas de validación

- `dateModified` MUST coincidir entre el `datetime` del banner y el
  `dateModified` del JSON-LD.
- `sectionsCount ∈ [3, 5]`.
- Cada sección MUST tener `<h2>` y exactamente una `<ul>` o `<ol>`.

---

## Section

Bloque temático con un encabezado y una lista corta. Cero o
múltiples instancias por página.

| Campo | Tipo | Notas |
|-------|------|-------|
| `slug` | string | canónico: `trabajo` \| `aprendiendo` \| `leyendo` \| `hablando` \| `vida` |
| `heading` | string | localizado en español: "Trabajo", "Aprendiendo", "Leyendo", "Hablando", "Vida" |
| `items` | Item[] | 1-5 entradas |
| `position` | int | orden canónico fijo (1..5) |

### Reglas

- `items.length ∈ [1, 5]`.
- `slug` único por página.
- Orden de aparición = orden canónico (R-1).
- Si el autor no tiene contenido para una sección opcional
  (Hablando, Vida) → la sección se omite por completo, no se deja vacía.

---

## Item

Bullet individual dentro de una sección.

| Campo | Tipo | Notas |
|-------|------|-------|
| `text` | string | ≤ 200 chars recomendado, neutral, en español |
| `href` | string? | opcional. Si externo: requiere `rel="noopener noreferrer"` y `target="_blank"` (R-7) |
| `linkLabel` | string? | si `href` está presente, texto del `<a>` (puede ser parte del `text`) |

### Reglas

- Si `href` empieza con `http://` o `https://` y no incluye
  `ardops.dev` → `rel="noopener noreferrer"` obligatorio.
- Si `href` apunta a `/…` interna → `target="_blank"` opcional, sin
  `rel` obligatorio.
- Sin `placeholder` strings (`Lorem`, `TODO`, `[…]`) — validado por
  `tests/no-placeholders.sh`.

---

## FreshnessReport

Salida del gate `tests/now-freshness.sh`. Función pura de la página
y la fecha actual UTC.

| Campo | Tipo | Notas |
|-------|------|-------|
| `datetime` | ISO date \| null | extraído del primer `<time datetime>` del documento |
| `days` | int \| null | (now_utc - datetime) / 86400; null si datetime es null |
| `status` | enum | `ok` \| `missing-time` \| `bad-format` \| `future-date` \| `stale` |
| `threshold` | int | default 90, override por `NOW_FRESHNESS_MAX_DAYS` |
| `message` | string | mensaje legible para CI logs |
| `exitCode` | int | 0 si `ok`; 2..5 según status |

### Transiciones de estado

```
read file
  ├── no <time datetime>           → status=missing-time, exit=2
  ├── <time> mal formado            → status=bad-format,   exit=3
  ├── datetime > today_utc          → status=future-date,  exit=4
  ├── days > threshold              → status=stale,        exit=5
  └── else                          → status=ok,           exit=0
```

---

## Entidades referenciadas (no propias)

- **`WebSite`** (`@id="https://ardops.dev/#website"`) — definida en
  spec 011. La página `/now/` referencia este `@id` desde
  `isPartOf`.
- **`Person`** (`@id="https://ardops.dev/#person"`) — definida en
  spec 011. La página `/now/` la referencia desde `about`
  (la página trata sobre la actividad de Victor).
- **`SiteFooter`** (renderizado por `scripts/lib/layout.js`) —
  hospeda el link a `/now/`. No es una entidad de schema.org.

---

## Diagrama conceptual

```
┌─────────────────────────────────────┐
│ Page (/now/)                        │
│   url, lang, title, description     │
│   dateModified (= banner = JSON-LD) │
├─────────────────────────────────────┤
│   sections: Section[3..5]           │
│     ├─ Trabajo (req)                │
│     ├─ Aprendiendo (req)            │
│     ├─ Leyendo (req)                │
│     ├─ Hablando (opt)               │
│     └─ Vida (opt)                   │
│                                     │
│   Section                           │
│     slug, heading, position         │
│     items: Item[1..5]               │
│                                     │
│   Item                              │
│     text, href?, linkLabel?         │
└─────────────────────────────────────┘
            │
            ▼
   tests/now-freshness.sh
            │
            ▼
   FreshnessReport { status, days, exitCode }
```
