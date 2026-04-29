# Implementation Plan: Techno Week 8.0 — Estado "Coming Soon"

**Branch**: `002-techno-week-coming-soon` | **Date**: 2026-04-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from [`specs/002-techno-week-coming-soon/spec.md`](spec.md)

## Summary

Convertir la sección Techno Week 8.0 del landing (`index.html` `#talk`) y la página `talks/index.html` a un estado "teaser" hasta el 18 de mayo de 2026: badge "Próximamente" visible, fecha y descripción de alto nivel, y cero enlaces a slides, repositorio demo o materiales descargables (incluso ocultos). El estado se controla mediante un único bloque HTML delimitado por marcadores; tras la charla, el operador reemplaza ese bloque por el bloque "publicado" (cuyo template vive en `contracts/published-block.html`, fuera de los archivos servidos). No se introducen dependencias JS ni runtime evaluation: todo se mantiene estático puro, conforme a la constitución.

## Technical Context

**Language/Version**: HTML5, CSS3 (custom properties), JavaScript ES2020 sin dependencias. Sin cambios de versión respecto al baseline.  
**Primary Dependencies**: Ninguna nueva. Mantiene fonts self-hosted (JetBrains Mono, Outfit) y el sistema de tokens CSS existente (`assets/css/tokens.css`).  
**Storage**: N/A (sitio 100% estático).  
**Testing**: Validación manual por checklist + smoke automatizado (grep contra patrones prohibidos en HTML build) ejecutado en CI. Lighthouse CI existente (`tests/lighthouserc*.json`) y `pa11y` (`tests/pa11y.config.js`) cubren a11y/perf budgets.  
**Target Platform**: Navegadores modernos (Chrome/Edge/Firefox/Safari últimos 2 años) sobre GitHub Pages + dominio `ardops.dev`. Mobile-first desde 320px.  
**Project Type**: Sitio web estático single-repo (HTML + CSS + JS vanilla). No aplica división backend/frontend.  
**Performance Goals**: Mantener Lighthouse Performance ≥ 95, LCP < 2.5s, CLS < 0.1, INP < 200ms (constitución VII). El cambio es texto + clase CSS; impacto esperado: ninguno.  
**Constraints**:
- Cero llamadas externas en runtime (constitución V).
- Cero JS de terceros (constitución IV).
- CSP estricto vía `<meta http-equiv>` (constitución VIII; GitHub Pages no permite headers custom — constitución XI).
- HTML servido NO debe contener URLs hacia slides/repo demo/materiales del evento, ni siquiera ocultos (FR-005, SC-002).  
**Scale/Scope**: 2 archivos HTML afectados (`index.html`, `talks/index.html`), 1 archivo CSS (`assets/css/components.css` para variante de badge si es necesaria), 1 actualización al `README.md` con runbook de liberación. ~30–60 líneas modificadas en total.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Evidencia / Justificación |
|-----------|--------|---------------------------|
| I. Spec-Driven obligatorio | PASS | Spec aprobada en `specs/002-techno-week-coming-soon/spec.md`. Plan creado por `/speckit.plan`. |
| II. Identidad visual preservada | PASS | Reutiliza `.talk-badge`, `.resource-link.is-coming` y tokens existentes (`--accent`, `--accent-dim`, `--text-muted`). Sin nuevas fuentes ni paleta. Variante opcional `.talk-badge--coming` declarada con tokens existentes. |
| III. Sitio 100% estático | PASS | El "flag" se implementa como bloque HTML delimitado por comentarios marcadores; sin runtime JS, sin build server-side, sin lectura de fecha en cliente. |
| IV. Cero dependencias JS de terceros | PASS | No se agregan dependencias. No se introduce countdown (FR-011, Assumption explícita en spec). |
| V. Fonts y assets self-hosted | PASS | Sin nuevos assets externos. |
| VI. Accesibilidad WCAG 2.1 AA | PASS (verificable) | Badge con `aria-label` descriptivo; contraste calculado contra `--accent` sobre `--accent-dim`/`--bg-card` (ya validado para `.talk-badge` en spec 001). Plan exige `pa11y` y Lighthouse a11y = 100 en gate. |
| VII. Performance es feature | PASS | Cambios son texto + 1 clase CSS opcional. Sin imágenes, sin JS, sin reflow. CLS sin riesgo. |
| VIII. Seguridad por defecto | PASS (refuerza la postura) | La feature ELIMINA URLs sensibles del HTML servido (cumple FR-005, SC-002). CSP existente intacto. Sin `unsafe-eval`, sin inline scripts nuevos. |
| IX. Cada PR pasa todas las gates | PASS (verificable en CI) | Lint HTML, link-check (`tests/links.config.toml`), Lighthouse, `pa11y`, y nuevo gate `forbidden-urls` documentado en `contracts/forbidden-urls.md`. |
| X. Documentación versionada | PASS | Toda la feature vive en `specs/002-techno-week-coming-soon/`. README incluye runbook de liberación. |
| XI. Hosting y dominio fijos | PASS | Sin cambios de hosting o dominio. Sin headers HTTP custom requeridos. |

**Resultado**: ✅ Sin violaciones. Procede a Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-techno-week-coming-soon/
├── plan.md                            # Este archivo
├── spec.md                            # Especificación funcional
├── research.md                        # Phase 0: decisiones técnicas
├── data-model.md                      # Phase 1: modelo de estado del flag
├── quickstart.md                      # Phase 1: runbook implementación + liberación
├── contracts/
│   ├── teaser-block.html              # Snippet HTML pre-evento (referencia)
│   ├── published-block.html           # Snippet HTML post-evento (template, NO servido)
│   ├── forbidden-urls.md              # Lista de patrones prohibidos en HTML servido
│   └── a11y-badge.md                  # Contrato a11y del badge "Próximamente"
└── checklists/
    └── requirements.md                # Validación de calidad (creada en /specify)
```

### Source Code (repository root)

```text
ardops.dev/
├── index.html                         # ← editar bloque #talk (sección "Talk")
│                                       # ← editar hero CTA "Ver Repositorio" (eliminar URL del repo demo)
├── talks/
│   └── index.html                     # ← editar bloque .talk-card y eliminar URL del repo demo
├── assets/
│   └── css/
│       └── components.css             # ← (opcional) variante .talk-badge--coming si se requiere distintivo visual
├── README.md                          # ← agregar sección "Liberación post-charla (Techno Week 8.0)"
├── tests/                             # sin cambios estructurales; gates existentes cubren la feature
└── specs/002-techno-week-coming-soon/ # documentación de la feature
```

**Structure Decision**: Single-project static site (constitución III). No se introduce nueva carpeta de build ni de infra. Los archivos modificados son exclusivamente HTML/CSS/Markdown del baseline existente.

## Phase 0: Research — Decisiones técnicas clave

Ver [research.md](research.md). Resumen ejecutivo:

1. **Mecanismo del flag**: bloque HTML delimitado por marcadores de comentario (`<!-- TALK-STATE:teaser START --> ... <!-- TALK-STATE:teaser END -->`). Liberación = reemplazo atómico del bloque por el contenido de `contracts/published-block.html`.
2. **Idioma del badge**: español, "Próximamente" (resuelto en `spec.md` Assumptions).
3. **Hero CTA**: el botón secundario `.btn-ghost` "Ver Repositorio" del hero apunta hoy a `https://github.com/victorar42/techno-week` — VIOLACIÓN actual de FR-005. Se reemplaza por un CTA interno (`#pipeline`, "Ver el Pipeline") sin URL externa hasta liberación.
4. **JSON-LD Event**: el campo `url` ya apunta a un anchor interno (`https://ardops.dev/#talk`); permanece sin cambios. El `description` describe la charla a alto nivel sin filtrar contenido sensible — se mantiene.
5. **Sin countdown**: confirmado fuera de alcance.
6. **Higiene de historial git**: documentada como responsabilidad operativa en el runbook (`quickstart.md`); no se ejecuta en este PR.
7. **Gate `forbidden-urls`**: nuevo check de CI documentado en `contracts/forbidden-urls.md`.

## Phase 1: Design & Contracts

Ver [data-model.md](data-model.md), [quickstart.md](quickstart.md), [contracts/](contracts/).

**Entidades**:
- `TalkPublicationState`: enum implícito `{teaser, published}`. Representado físicamente por cuál de los dos bloques delimitados está presente en el HTML servido. Default repo: `teaser` hasta el 2026-05-18.

**Contratos**:
- `contracts/teaser-block.html` — bloque HTML exacto para `index.html` y variante para `talks/index.html` durante estado `teaser`. Reusa `.talk-badge`, `.resource-link.is-coming`, `.talk-card`. Sin `<a href>` a recursos externos del evento.
- `contracts/published-block.html` — snippet plantilla con placeholders (`{{SLIDES_URL}}`, `{{REPO_URL}}`) para liberación. NO se commitea con URLs reales hasta el día del evento.
- `contracts/forbidden-urls.md` — gate de CI con lista de patrones que NO deben aparecer en archivos servidos mientras el estado sea `teaser`.
- `contracts/a11y-badge.md` — requisitos accesibles del badge "Próximamente" (contraste, `aria-label`, foco, role).

**Agent context update**: actualizar el bloque `<!-- SPECKIT START --> ... <!-- SPECKIT END -->` de `.github/copilot-instructions.md` para apuntar al nuevo plan activo.

### Re-evaluación Constitution Check post-design

Tras Phase 1, no aparecen nuevas violaciones. La decisión de "dos bloques alternativos con marcadores" mantiene la simplicidad estática y elimina por completo la posibilidad de leakage en runtime. El gate `forbidden-urls` refuerza las constituciones VIII y IX. ✅ PASS.

## Complexity Tracking

> Sin violaciones constitucionales. No aplica.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| —         | —          | —                                   |
