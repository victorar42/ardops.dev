# Phase 1 — Data Model

**Feature**: Landing Page Redesign (v1) · `001-landing-redesign`
**Date**: 2026-04-24

Sin base de datos. Las "entidades" son contenido estructurado embebido en HTML semántico + JSON-LD. Esta sección formaliza los campos para que el implementador (y futuros generadores) sepan qué piezas son obligatorias y de dónde provienen.

---

## Profile

Representa al sujeto del sitio. Una sola instancia.

| Field | Type | Required | Source / Notes |
|---|---|---|---|
| `name` | string | sí | "Victor Josue Ardón Rojas" — `<h1>` del hero. |
| `shortName` | string | sí | "ardops" — usado en logo y `og:site_name`. |
| `role` | string | sí | "DevOps Engineer". |
| `tagline` | string | sí | "Security as Code". Aparece junto al rol y en footer. |
| `bioLong` | string (multi-párrafo) | sí | Hero `.hero-desc`. |
| `bioShort` | string ≤ 160 chars | sí | `meta description`, `og:description`, `twitter:description`. |
| `country` | string | sí | "Costa Rica" — footer + JSON-LD. |
| `language` | string (BCP 47) | sí | "es" → `<html lang>`, `og:locale=es_CR`. |
| `socials` | array<ContactChannel> | sí | Mínimo: GitHub, LinkedIn, email. |
| `siteUrl` | URL | sí | `https://ardops.dev/` — canonical, `og:url`. |
| `ogImage` | URL | sí | `https://ardops.dev/public/og/og-default.png`. |

Validación:
- `bioShort.length ≤ 160` (truncate guard).
- `socials` debe contener al menos un canal con `type: "email"`.

---

## Talk

Charla destacada. Una instancia visible en v1 (Techno Week 8.0). Estructura preparada para una colección futura en `/talks/`.

| Field | Type | Required | Source / Notes |
|---|---|---|---|
| `title` | string | sí | "Seguridad como Código: DevSecOps Spec-Driven sobre GitHub para Banca". |
| `event` | string | sí | "Techno Week 8.0". |
| `organization` | string | sí | "Banco de Costa Rica". |
| `date` | ISO 8601 (YYYY-MM-DD) | sí | `2026-05-18`. |
| `dateLabel` | string | sí | "18 MAYO 2026" — visible en `.talk-badge`. |
| `description` | string | sí | `.talk-desc`. |
| `resources` | array<TalkResource> | sí, length ≥ 4 | Repositorio, Pipeline, Slides, Guía. |
| `featured` | boolean | sí | `true` para la charla destacada. |

### TalkResource

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | sí | "Repositorio", "Slides", etc. |
| `url` | URL \| null | no | `null` ⇒ estado "Próximamente". |
| `status` | enum (`published`, `coming_soon`) | sí | Derivable de `url`. |
| `iconKey` | string | sí | Identificador del SVG (`github`, `shield`, `slides`, `doc`). |

Validación:
- Si `status = published`, `url` debe ser absoluta y https.
- Si `status = coming_soon`, el render usa `<span aria-disabled="true">` y NO un `<a>` activo.

---

## PipelineStage

Una instancia por etapa. Exactamente 7 instancias en v1, en este orden:

| order | name | tool | description (≤ 90 chars) |
|---|---|---|---|
| 1 | Spec Lint | Spectral | "Valida reglas de seguridad bancarias en la OpenAPI spec" |
| 2 | SAST | Semgrep | "Análisis estático: patrones de código peligrosos" |
| 3 | Secret Detection | Gitleaks | "Detecta API keys y passwords en el código" |
| 4 | Dependency Scan | npm audit | "Vulnerabilidades conocidas en dependencias" |
| 5 | DAST | OWASP ZAP | "Pruebas dinámicas: ataca la API usando la spec" |
| 6 | Compliance | Custom Action | "Reporte automático en cada Pull Request" |
| 7 | Semantic Analysis | CodeQL (GHAS) | "Análisis de flujo de datos con GitHub Advanced Security" |

Validación:
- `order` único en [1..7].
- Renderizado dentro de `<section id="pipeline">` como grid de `.pipeline-step`.

---

## Stat

Estadística del bloque "Sobre mí". Exactamente 4 instancias:

| value | label |
|---|---|
| `7` | "Etapas del Pipeline" |
| `0` | "Costo de licencias" |
| `100%` | "Cobertura de la spec" |
| `<5m` | "Tiempo del pipeline" |

Validación:
- `value.length ≤ 6` (cabe visualmente).
- `label.length ≤ 30`.

---

## ContactChannel

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | enum (`github`, `linkedin`, `email`, `other`) | sí | Determina icono e `aria-label`. |
| `label` | string | sí | Texto visible (ej. "GitHub", "josuevjar@gmail.com"). |
| `href` | URL \| `mailto:` | sí | `mailto:` para email; https para los demás. |
| `external` | boolean | sí | `true` ⇒ `target="_blank" rel="noopener noreferrer"`. |
| `iconKey` | string | sí | Identificador SVG. |

Instancias mínimas en v1: 3 (`github`, `linkedin`, `email`).

---

## DesignTokens

Fuente única de verdad visual. Materializada en `assets/css/tokens.css`. Inmutables salvo PR que actualice la constitución.

### Color

| Token | Value |
|---|---|
| `--bg-primary` | `#0a0e17` |
| `--bg-secondary` | `#111827` |
| `--bg-card` | `#1a2235` |
| `--bg-card-hover` | `#1f2a40` |
| `--text-primary` | `#e2e8f0` |
| `--text-secondary` | `#94a3b8` |
| `--text-muted` | `#64748b` |
| `--accent` | `#22d3ee` |
| `--accent-dim` | `rgba(34, 211, 238, 0.15)` |
| `--accent-glow` | `rgba(34, 211, 238, 0.3)` |
| `--green` | `#4ade80` |
| `--green-dim` | `rgba(74, 222, 128, 0.15)` |
| `--red` | `#f87171` |
| `--orange` | `#fb923c` |
| `--border` | `rgba(148, 163, 184, 0.1)` |

### Typography

| Token | Value |
|---|---|
| `--font-mono` | `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace` |
| `--font-body` | `'Outfit', system-ui, -apple-system, Segoe UI, sans-serif` |

### Layout

| Token | Value |
|---|---|
| `--max-content` | `1000px` |
| `--max-hero` | `800px` |
| `--radius-sm` | `6px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |

### Motion

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--dur-short` | `0.3s` |
| `--dur-medium` | `0.6s` |
| `--dur-long` | `0.8s` |

Validación: cualquier color/font hardcodeado en el resto de hojas o en HTML es violación de FR-009/FR-010.

---

## SEO meta (derivado de Profile + Talk)

| Element | Value source |
|---|---|
| `<title>` | `${Profile.shortName}.dev — ${Profile.role}` (≤ 60 chars). |
| `meta description` | `Profile.bioShort`. |
| `link rel=canonical` | `Profile.siteUrl`. |
| `meta theme-color` | `var(--bg-primary)` → `#0a0e17`. |
| `og:title` | igual a `<title>`. |
| `og:description` | `Profile.bioShort`. |
| `og:type` | `"website"`. |
| `og:url` | `Profile.siteUrl`. |
| `og:image` | `Profile.ogImage`. |
| `og:locale` | `"es_CR"`. |
| `og:site_name` | `Profile.shortName + ".dev"`. |
| `twitter:card` | `"summary_large_image"`. |
| `twitter:title/description/image` | espejo de `og:*`. |

---

## JSON-LD (`@context: https://schema.org`)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://ardops.dev/#person",
      "name": "Victor Josue Ardón Rojas",
      "alternateName": "ardops",
      "url": "https://ardops.dev/",
      "jobTitle": "DevOps Engineer",
      "sameAs": [
        "https://github.com/victorar42",
        "https://www.linkedin.com/in/victorar42/"
      ]
    },
    {
      "@type": "Event",
      "name": "Techno Week 8.0 — Seguridad como Código: DevSecOps Spec-Driven sobre GitHub para Banca",
      "startDate": "2026-05-18",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": "Banco de Costa Rica",
        "address": { "@type": "PostalAddress", "addressCountry": "CR" }
      },
      "performer": { "@id": "https://ardops.dev/#person" },
      "url": "https://ardops.dev/#talk"
    }
  ]
}
```

Validación: `validator.schema.org` sin errores.
