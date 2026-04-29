# Phase 1 — Data Model: Estado de publicación de la charla

**Feature**: 002-techno-week-coming-soon  
**Date**: 2026-04-28

Aunque el sitio es 100% estático y no hay base de datos, esta spec introduce un *estado* lógico del contenido que se materializa en el árbol HTML servido. Documentarlo formalmente facilita el runbook, los tests y el PR de liberación.

---

## Entidad: `TalkPublicationState`

Estado lógico de la sección Techno Week 8.0.

| Atributo | Tipo | Valores | Descripción |
|---|---|---|---|
| `state` | enum | `teaser`, `published` | Modo actual de la sección. Default repo: `teaser`. |
| `eventDate` | ISO date | `2026-05-18` | Fecha objetivo de publicación; aparece en el copy del badge. |
| `surfaces` | lista | `["index.html#talk", "talks/index.html .talk-card"]` | Archivos HTML donde la sección está duplicada y debe permanecer sincronizada. |

### Reglas de validación

- `state ∈ {teaser, published}` — sin estados intermedios.
- Mientras `state == teaser`:
  - El HTML servido NO contiene URLs hacia recursos sensibles del evento (ver `contracts/forbidden-urls.md`).
  - El badge "Próximamente" debe estar presente en cada surface listada.
  - La fecha `eventDate` aparece textualmente en al menos un elemento visible de cada surface.
- Mientras `state == published`:
  - El badge "Próximamente" NO debe aparecer en ninguna surface.
  - Las URLs de slides y repo demo, si están provistas, son `<a href>` reales, externas, con `rel="noopener noreferrer"` y `target="_blank"`.
  - Si una URL está vacía o sin definir, el `<a>` correspondiente NO se renderiza (degrada silenciosamente, sin enlaces vacíos).

### Transición de estado

```
[teaser] ──(operador edita HTML según runbook)──▶ [published]
[published] ──(no se contempla revertir; ver Plan de rollback en spec)──▶ [teaser]
```

La transición es manual, atómica por surface (un swap de bloque delimitado), revisable como diff de PR.

### Representación física

| Estado | Marcadores presentes en HTML servido | Bloque "publicado" en repo |
|---|---|---|
| `teaser` | `<!-- TALK-STATE:teaser START -->` ... `<!-- TALK-STATE:teaser END -->` | Solo en `specs/002-techno-week-coming-soon/contracts/published-block.html` (no servido) |
| `published` | `<!-- TALK-STATE:published START -->` ... `<!-- TALK-STATE:published END -->` | Inline en `index.html` y `talks/index.html` |

---

## Entidad: `TaserBlock` (vista teaser)

Composición del bloque renderizado en estado `teaser`. No es un objeto de datos sino un contrato de contenido para el HTML.

| Campo | Origen | Notas |
|---|---|---|
| `talkTitle` | hardcoded copy | "Seguridad como Código: DevSecOps Spec-Driven sobre GitHub para Banca" |
| `eventName` | hardcoded copy | "Techno Week 8.0 — Banco de Costa Rica" |
| `eventDate` | hardcoded copy | "18 de mayo de 2026" |
| `audience` | hardcoded copy | "Sector financiero / banca CR" |
| `format` | hardcoded copy | "Presencial · 60 min" |
| `description` | hardcoded copy | 2–4 líneas de alto nivel, sin spoilers |
| `comingSoonBadgeText` | hardcoded copy | "Próximamente" |
| `comingSoonAriaLabel` | hardcoded copy | "Contenido próximamente, disponible el 18 de mayo de 2026" |
| `informationalCta` | hardcoded copy | "El material se publicará el 18 de mayo de 2026." (texto plano, no `<a>`) |

Ver el HTML exacto en [`contracts/teaser-block.html`](contracts/teaser-block.html).

---

## Entidad: `PublishedBlock` (vista publicada)

Composición del bloque renderizado en estado `published`. Plantilla con placeholders.

| Campo | Origen | Placeholder |
|---|---|---|
| `talkTitle` | igual al teaser | — |
| `eventName` | igual al teaser | — |
| `eventDate` | igual al teaser | — |
| `description` | puede actualizarse post-charla con resumen final | — |
| `slidesUrl` | provisto por operador en liberación | `{{SLIDES_URL}}` |
| `repoUrl` | provisto por operador en liberación | `{{REPO_URL}}` |
| `extraResources` | opcional | `{{EXTRA_RESOURCES}}` (lista o vacío) |

Ver la plantilla en [`contracts/published-block.html`](contracts/published-block.html).

---

## Invariantes de seguridad

1. **Invariante I-1**: Mientras exista al menos un marcador `<!-- TALK-STATE:teaser ... -->` en `index.html` o `talks/index.html`, ningún archivo HTML servido puede contener los patrones listados en `contracts/forbidden-urls.md`.
2. **Invariante I-2**: Los snippets dentro de `specs/002-techno-week-coming-soon/contracts/` NO deben servirse en GitHub Pages. (El path `specs/` no se publica en el sitio de Pages porque no está enlazado y `.specify/` está documentado como contenido de repositorio, no de sitio. Verificable inspeccionando el output de Pages.)
3. **Invariante I-3**: La transición `teaser → published` debe quedar registrada en un commit con mensaje convencional (ej. `feat(talk): publish Techno Week 8.0 materials`) para auditoría.
