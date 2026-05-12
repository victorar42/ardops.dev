# Phase 1 — Data Model: `/uses/` page

**Feature**: 010-uses-page
**Date**: 2026-05-12

> Sitio estático sin DB. Las "entidades" aquí son **editoriales**: estructuras
> que existen en `uses/index.html` como contrato semántico. No hay schema
> ejecutable; las gates HTML/a11y/CSP/sitemap validan su forma.

---

## UsesPage

La página `/uses/` completa.

| Atributo | Tipo | Origen | Notas |
|---|---|---|---|
| `title` | string | `<title>` | "Uses — ardops.dev" |
| `description` | string (120-200 chars) | `<meta name="description">` | Long-tail DevSecOps. |
| `canonical` | URL absoluta | `<link rel="canonical">` | `https://ardops.dev/uses/` |
| `lastUpdated` | ISO date + texto humano | `<time datetime>` + texto | Banner al final. |
| `sections` | `Section[]` (1..N) | `<main> > section` | Orden definido en FR-002. |
| `author` | `Person` (1) | JSON-LD `WebPage.author` (`@id` ref) | Reutiliza la identidad global. |

**Validaciones invariantes** (enforz por gates existentes):

- `title`, `description`, `canonical` y OG tags presentes (Lighthouse SEO).
- `lastUpdated` no es placeholder (`tests/no-placeholders.sh`).
- CSP idéntica a `talks/index.html` (`tests/csp-no-unsafe-inline.sh`).
- nav + footer = los renderizados por `scripts/lib/layout.js`
  (`tests/nav-consistency.sh`).
- `canonical` ∈ `sitemap.xml` (`tests/sitemap-drift.sh`).
- WCAG 2.1 AA (`node tests/a11y.js`).

---

## Section

Agrupador semántico dentro de `<main>`. Hay 9 obligatorias + 2 opcionales,
en este orden:

| # | `title` | `slug` (id) | Obligatoria |
|---|---|---|---|
| 1 | Hardware | `hardware` | sí |
| 2 | Sistema operativo y shell | `os-shell` | sí |
| 3 | Editor / IDE | `editor` | sí |
| 4 | Terminal y CLI | `terminal-cli` | sí |
| 5 | Lenguajes y runtimes | `lenguajes` | sí |
| 6 | DevOps & infra | `devops` | sí |
| 7 | Security & compliance | `security` | sí |
| 8 | Cloud & servicios | `cloud` | sí |
| 9 | Productividad y notas | `productividad` | sí |
| 10 | Hobbies / off-topic | `hobbies` | no |
| 11 | Abandoned | `abandoned` | no |

**Forma esperada**:

```html
<section class="section" id="hardware" aria-labelledby="hardware-heading">
  <h2 id="hardware-heading" class="section-title">Hardware</h2>
  <dl class="uses-list">
    <dt>MacBook Pro M-series</dt>
    <dd>14", 32 GB RAM. Por la combo battery / silencio / Asahi opcional.</dd>
    <!-- … más items … -->
  </dl>
</section>
```

**Reglas**:

- `<h2>` único por sección, sin saltos de jerarquía (h1 → h2 directo).
- 1..N `StackItem` por sección (no se permite `<dl>` vacío).
- `aria-labelledby` referencia el `id` del `<h2>` (consistente con
  `talks/index.html`).

---

## StackItem

Par término–definición.

| Atributo | Tipo | Forma HTML | Reglas |
|---|---|---|---|
| `name` | string (1-80 chars) | `<dt>` | Texto plano o `<a>` interno (sin externals). |
| `rationale` | string (1-2 oraciones, ≤ ~240 chars) | `<dd>` | Por qué se usa, no qué es. |
| `link` | URL externa (opcional) | `<dd>` con `<a rel="noopener noreferrer">` | Sin `rel="sponsored"`, sin `target="_blank"` salvo justificación. |

**Validaciones invariantes**:

- `<dt>` nunca vacío.
- `<dd>` nunca vacío.
- Cada `<dl>` tiene al menos 1 par `<dt>`/`<dd>`.
- Si hay link externo: `tests/external-links.sh` lo valida.
- Cero `rel="sponsored"`, cero `affiliate`, cero `amzn.to` (SC-004 grep).

---

## Person

El autor. **Reutilizado** del JSON-LD existente de `index.html` para evitar
drift. Forma esperada (referencia, no canon nuevo):

```json
{
  "@type": "Person",
  "@id": "https://ardops.dev/#person",
  "name": "Victor Josue Ardón Rojas",
  "url": "https://ardops.dev/",
  "jobTitle": "DevSecOps Engineer"
}
```

El `WebPage` de `/uses/` lo referencia por `@id`:

```json
{ "@type": "WebPage", "author": { "@id": "https://ardops.dev/#person" } }
```

> Si la forma exacta del `Person` en `index.html` difiere de la de arriba al
> implementar, **se copia tal cual** la del `index.html` para mantener
> consistencia. Esta tabla es ilustrativa.

---

## Estado / transiciones

`UsesPage` no tiene estados ni transiciones (no es un workflow). El único
"cambio de estado" relevante es **edición editorial**: se actualiza
`lastUpdated` y 1..N `StackItem`. Eso queda en git como un commit.
