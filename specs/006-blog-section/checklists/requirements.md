# Specification Quality Checklist: Sección "Blog" en landing + página /blog/ refactorizada

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-05-11
**Feature**: [spec.md](../spec.md)

## Content Quality

- [X] No implementation details (languages, frameworks, APIs)
- [X] Focused on user value and business needs
- [X] Written for non-technical stakeholders
- [X] All mandatory sections completed

## Requirement Completeness

- [X] No [NEEDS CLARIFICATION] markers remain
- [X] Requirements are testable and unambiguous
- [X] Success criteria are measurable
- [X] Success criteria are technology-agnostic (no implementation details)
- [X] All acceptance scenarios are defined
- [X] Edge cases are identified
- [X] Scope is clearly bounded
- [X] Dependencies and assumptions identified

## Feature Readiness

- [X] All functional requirements have clear acceptance criteria
- [X] User scenarios cover primary flows
- [X] Feature meets measurable outcomes defined in Success Criteria
- [X] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckit.clarify` or `/speckit.plan`.
- La spec reusa patrones ya consolidados: marker-block + build-time render (spec 005 pipeline) y markdown sanitizado + páginas individuales + frontmatter + fixtures negativos (spec 003 interviews). No invoca implementación específica más allá de exigir el patrón equivalente.
- Algunos detalles deliberadamente diferidos al `/speckit.plan` (no son ambigüedad, son decisiones de implementación):
  - Whitelist exacto de etiquetas y atributos HTML permitidos por el sanitizador para HTML inline dentro de posts (parte del whitelist de spec 003 + lo necesario para las 4 stat cards).
  - Comportamiento ante fecha futura: publicar inmediatamente vs. tratar como `published: false` hasta esa fecha.
  - Constante de palabras-por-minuto para cálculo de tiempo de lectura.
  - URL final de los posts individuales: `/blog/<slug>/` con `index.html` interno vs. `/blog/<slug>.html`.
  - Cota concreta de longitud para `summary`.
  - Ruta exacta y nombre de archivo de la foto en `assets/img/`, y su alt text final.
  - Si la regeneración de `/blog/index.html` se hace por marker block o por reemplazo completo del archivo.
- SC-001 (15 s explicación) es validable principalmente manual; complementa a SC-004 (axe automatizado) y SC-009 (gate CI).
- Brief explícito del autor lista 7 herramientas/etapas actuales del pipeline DevSecOps que el primer post debe mencionar todas como narrativa: Spectral, Semgrep, Gitleaks, npm audit, OWASP ZAP, Custom Action de compliance, CodeQL/GHAS.
