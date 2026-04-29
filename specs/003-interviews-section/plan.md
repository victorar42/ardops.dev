# Implementation Plan: Sección de Entrevistas (Blog estático navegable)

**Branch**: `003-interviews-section` | **Date**: 2026-04-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from [`specs/003-interviews-section/spec.md`](spec.md)

## Summary

Generar en build time, dentro del workflow de GitHub Pages existente, un set de páginas HTML estáticas para la sección `/interviews/`: un índice con búsqueda y filtrado client-side y una página individual por entrevista. Las entrevistas se escriben en Markdown con frontmatter YAML bajo `content/interviews/`. El generador (`scripts/build-interviews.js`, Node + librerías build-only) parsea, valida, sanitiza, calcula `readingTime`, y emite HTML usando template strings de JS y un `index.json` para alimentar el buscador. El bundle runtime es 100 % vanilla JS y respeta la CSP estricta del sitio. No se commitean artefactos generados; todo vive en el job de Pages.

## Technical Context

**Language/Version**:
- Build: Node.js 20 LTS (ya configurado en `.github/workflows/ci.yml`).
- Runtime servido: HTML5 + CSS3 (custom properties) + JavaScript ES2020 vanilla.

**Primary Dependencies**:
- Build-time, **dev-only** (npm `devDependencies`, nunca cargadas en runtime):
  - `gray-matter` — parser de frontmatter YAML (estándar de facto, mantenido, sin transitive runtime deps en navegador).
  - `marked` — parser de Markdown → HTML, con opción `gfm: true` y custom renderer; configurado para escapar HTML inline (`mangle: false`, sanitización post-render).
  - `dompurify` + `jsdom` — sanitización del HTML resultante en build time. JSDOM proporciona el `window` que requiere DOMPurify en Node; ambos se ejecutan exclusivamente en CI.
- Runtime: **ninguna**. Se mantiene Principio IV de la constitución. La búsqueda y filtrado se implementan con `Array.prototype.filter`, `String.prototype.includes` y `Set` de la API estándar.

**Storage**: filesystem.
- Fuente: `content/interviews/*.md`.
- Imágenes opcionales: `content/interviews/images/<slug>.{jpg,webp,png}`.
- Output (no commitable): generado en `_site/interviews/` durante el step de build de Pages.

**Testing**:
- **Build validation**: `node scripts/build-interviews.js --strict` falla si encuentra frontmatter inválido (cumple FR-009, SC-003).
- **Smoke fixtures**: directorio `content/interviews/__fixtures__/` (excluido del deploy mediante el rsync de `pages-deploy.yml`) con MDs válidos e inválidos para CI.
- **A11y**: el runner existente `tests/a11y.js` se extiende para incluir las nuevas URLs (`/interviews/` y al menos una individual).
- **HTML validate**: `npx html-validate` se aplica también a archivos generados en `_site/interviews/*.html` durante el job CI.
- **XSS regression**: una entrevista de fixture con `<script>alert(1)</script>` en el cuerpo NO debe producir el `<script>` en el HTML emitido (cumple SC-012). Se ejecuta como un grep en el HTML generado.
- **Tamaño JSON**: check de tamaño de `_site/interviews/index.json` ≤ 100KB con la fixture de 20 entradas (cumple SC-006).

**Target Platform**: navegadores modernos (Chrome/Edge/Firefox/Safari últimos 2 años) sobre GitHub Pages + dominio `ardops.dev`. Mobile-first desde 320px.

**Project Type**: sitio web estático single-repo con paso de generación en CI. No aplica división backend/frontend.

**Performance Goals**:
- LCP < 2.5s, CLS ≤ 0.1, INP ≤ 200ms (constitución VII).
- Búsqueda en vivo < 100ms percibidos sobre 20 entrevistas (SC-004).
- `index.json` ≤ 100KB con 20 entrevistas (FR-023, SC-006).

**Constraints**:
- CSP estricta vía `<meta http-equiv>` igual al resto del sitio: `default-src 'self'; script-src 'self'; style-src 'self'; ...`. Sin `unsafe-inline` en scripts. Handlers desde archivo externo (`assets/js/interviews.js`).
- Cero CDNs externos en runtime (constitución V, FR-021/FR-022).
- No commitear artefactos generados (FR-025; alineado con `pages-deploy.yml`).
- Slugs estables: derivados del nombre de archivo según convención `YYYY-MM-<slug>.md` → URL `/interviews/<slug>.html`.

**Scale/Scope**:
- Backlog inicial: 7 entrevistas confirmadas (lista en spec).
- Diseño dimensionado para 0–50 entrevistas; con 20+ se reevalúa paginación. Bajo 20 entrevistas no se introducen optimizaciones prematuras.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Evidencia / Justificación |
|-----------|--------|---------------------------|
| I. Spec-Driven obligatorio | PASS | Spec aprobada en `specs/003-interviews-section/spec.md`. Plan creado por `/speckit.plan`. |
| II. Identidad visual preservada | PASS | Las páginas generadas reusan tokens existentes en `assets/css/tokens.css` y patrones de `components.css`. Una hoja nueva `assets/css/interviews.css` (módulo dedicado) introduce solo selectores de la nueva sección, sin tocar el sistema de tokens. |
| III. Sitio 100% estático | PASS | Generación en build time dentro del workflow de Pages. No hay backend ni runtime server-side. |
| IV. Cero dependencias JS de terceros sin justificación | PASS (con justificación) | Runtime: 0 deps. Build-time: `gray-matter`, `marked`, `dompurify`, `jsdom` documentadas en research.md con justificación, alternativas evaluadas y licencias. NO se sirven al cliente. |
| V. Fonts y assets self-hosted | PASS | Imágenes de entrevistados bajo `content/interviews/images/`. Sin llamadas a CDNs externos. |
| VI. Accesibilidad WCAG 2.1 AA | PASS (verificable) | FR-017/FR-018, SC-008/SC-011. Buscador con `aria-live="polite"`, navegación por teclado, foco visible. Plan extiende `tests/a11y.js` para cubrir las nuevas URLs. |
| VII. Performance es feature | PASS (verificable) | LCP/CLS/INP medidos en Lighthouse CI; budget de `index.json` ≤ 100KB; sin imágenes pesadas en LCP de la lista. Variant pre-calculada en build time. |
| VIII. Seguridad por defecto | PASS (refuerza) | CSP estricta heredada (FR-010 + sanitización con DOMPurify en build). Cero scripts inline. SC-012 verifica defensa contra XSS desde Markdown malicioso. |
| IX. Cada PR pasa todas las gates | PASS | Plan extiende `ci.yml` con jobs: `build-interviews` (validación + emit), `interviews-size` (check de 100KB), `interviews-xss-fixture`, y la suite a11y/lighthouse existente cubre las nuevas URLs. |
| X. Documentación versionada | PASS | Toda la feature vive en `specs/003-interviews-section/`. Convención de frontmatter en `content/interviews/README.md`. |
| XI. Hosting y dominio fijos | PASS | Generación dentro del job `build` de `pages-deploy.yml`. Sin headers HTTP custom; CSP vía meta. Sin servicios externos pagos ni secretos nuevos. |

**Resultado pre-design**: ✅ Sin violaciones. Procede a Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/003-interviews-section/
├── plan.md                            # Este archivo
├── spec.md                            # Especificación funcional
├── research.md                        # Phase 0: decisiones técnicas
├── data-model.md                      # Phase 1: esquema frontmatter + JSON
├── quickstart.md                      # Phase 1: guía dev + autor
├── contracts/
│   ├── frontmatter-schema.md          # Esquema YAML normativo
│   ├── index-json-schema.md           # Esquema del index.json
│   ├── interview-html-template.md     # Estructura HTML normativa de la página individual
│   ├── index-html-template.md         # Estructura HTML normativa del listado
│   ├── csp-policy.md                  # Política CSP aplicable a las nuevas páginas
│   └── a11y-checklist.md              # Checklist accesible específico
└── checklists/
    └── requirements.md                # Validación de calidad (creada en /specify)
```

### Source Code (repository root)

```text
ardops.dev/
├── content/
│   └── interviews/
│       ├── README.md                  # ← convención de autoría (creado por feature)
│       ├── 2026-05-jose-alvarez-pernix.md     # ← contenido (creado en backlog editorial)
│       ├── 2026-05-luis-corrales-huli.md      # ← idem
│       ├── ...
│       ├── images/                    # ← fotos circulares de entrevistados (opcional)
│       │   └── jose-alvarez-pernix.webp
│       └── __fixtures__/              # ← MDs sintéticos para CI (válidos, inválidos, XSS)
│           ├── valid-minimal.md
│           ├── invalid-missing-title.md
│           └── xss-attempt.md
├── scripts/
│   └── build-interviews.js            # ← generador (creado por feature)
├── assets/
│   ├── css/
│   │   └── interviews.css             # ← estilos dedicados (creado por feature)
│   └── js/
│       └── interviews.js              # ← buscador/filtros runtime (vanilla, creado por feature)
├── interviews/                        # ← directorio fuente sólo con assets estáticos
│   └── (vacío en repo; el HTML se genera en CI hacia _site/interviews/)
├── tests/
│   ├── a11y.js                        # ← extender URLs auditadas
│   ├── interviews-size.sh             # ← gate de tamaño del index.json (creado)
│   └── interviews-xss.sh              # ← gate de no-script en HTML emitido (creado)
├── .github/
│   └── workflows/
│       ├── ci.yml                     # ← agregar jobs: build-interviews, interviews-size, interviews-xss
│       └── pages-deploy.yml           # ← integrar paso `node scripts/build-interviews.js` antes del rsync
├── package.json                       # ← agregar devDependencies: gray-matter, marked, dompurify, jsdom
└── specs/003-interviews-section/      # ← documentación de la feature
```

**Structure Decision**: single-project static site con un directorio de contenido (`content/`) y un script de build que se ejecuta en CI. No se introduce monorepo, no se externaliza el contenido a un CMS, no se usa generador de sitio completo (Eleventy/Hugo/Jekyll). El contenido y el script viven en el mismo repo, alineado con constitución III y la simplicidad del proyecto.

## Phase 0: Research — Decisiones técnicas clave

Ver [research.md](research.md). Resumen ejecutivo:

1. **Generador**: script Node propio (`scripts/build-interviews.js`), no generador de sitio completo. Tamaño del problema (≤ 50 entrevistas) y constitución IV/III favorecen una solución mínima.
2. **Parser de Markdown**: `marked` con `mangle: false` y `headerIds: true`, sin permitir HTML inline. Sanitización post-render con DOMPurify.
3. **Parser de YAML**: `gray-matter` (incluye `js-yaml`).
4. **Sanitizador**: `dompurify` + `jsdom` en build time. Mantiene whitelist conservadora (sin `<script>`, `<iframe>`, `on*` handlers, `javascript:` URLs).
5. **Slugs**: derivados del nombre de archivo, validados contra `[a-z0-9-]+`, prefijo de fecha `YYYY-MM-` opcional pero recomendado.
6. **Templating**: template strings de JS dentro del script de build. Cero dependencias adicionales.
7. **Reading time**: `Math.max(1, Math.ceil(words / 220))`.
8. **Búsqueda client-side**: `Array.filter` + normalización Unicode (`String.prototype.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`) para insensibilidad a tildes.
9. **`index.json`**: campos cortos, sin contenido completo. Estructura validada en `contracts/index-json-schema.md`.
10. **Integración con Pages**: paso adicional en `pages-deploy.yml` *antes* del rsync, generando `_site/interviews/` directamente en el directorio servido.
11. **Imágenes**: servidas tal cual, en formatos WebP o JPG; sin pipeline de optimización en esta spec. Fallback con iniciales SVG inline cuando `image` no está presente.
12. **CSP**: heredada del resto del sitio. Las nuevas páginas inyectan la misma `<meta http-equiv="Content-Security-Policy">` para garantizar consistencia.
13. **Navegación principal**: agregar entrada "Entrevistas" a `nav-links` en `index.html`, `talks/index.html`, `blog/index.html`. La página `/interviews/` también incluye el mismo header del sitio.
14. **Test de XSS**: fixture en `content/interviews/__fixtures__/xss-attempt.md` con cuerpo malicioso, validada en CI mediante un grep que confirma ausencia de `<script>` en el HTML generado para esa entrada.

## Phase 1: Design & Contracts

Ver [data-model.md](data-model.md), [quickstart.md](quickstart.md), [contracts/](contracts/).

**Entidades modeladas formalmente**:
- `Interview`: archivo MD + frontmatter validado, expone slug, title, interviewee, date, tags[], summary, published, readingTime (derivado), bodyHtml (derivado, sanitizado).
- `Interviewee`: name, role, company, image (opcional), linkedin (opcional).
- `Tag`: string normalizado a minúsculas, formato `[a-z0-9-]+`.
- `InterviewIndex`: array JSON con metadata mínima (sin bodyHtml).

**Contratos generados**:
- `contracts/frontmatter-schema.md` — esquema YAML normativo, formato de fecha, lista de campos requeridos vs opcionales, reglas de validación, mensajes de error esperados.
- `contracts/index-json-schema.md` — estructura del JSON, ejemplo, presupuesto de tamaño, campos prohibidos (no incluir HTML completo del cuerpo).
- `contracts/interview-html-template.md` — DOM canónico de la página individual: head (CSP, meta tags, OG), header del sitio, article con metadata + body sanitizado, footer del sitio, link de regreso.
- `contracts/index-html-template.md` — DOM canónico del listado: header, controles (search input + tag chips + clear), `<ul role="list">` con items que tienen estructura accesible, contador de resultados con `aria-live`.
- `contracts/csp-policy.md` — política CSP normativa, idéntica a la del resto del sitio; documenta por qué el script `interviews.js` cumple `script-src 'self'`.
- `contracts/a11y-checklist.md` — landmarks, headings (h1 único por página individual), atajos de teclado del buscador, foco visible, `aria-live`, alt text.

**Agent context update**: actualizar el bloque `<!-- SPECKIT START --> ... <!-- SPECKIT END -->` de `.github/copilot-instructions.md` para apuntar al plan activo `specs/003-interviews-section/plan.md`.

### Re-evaluación Constitution Check post-design

Tras Phase 1, no aparecen nuevas violaciones:

- Las dependencias build-time están encapsuladas en `devDependencies`. El bundle servido contiene únicamente HTML, CSS y un `interviews.js` vanilla. ✅ Principio IV.
- La integración en `pages-deploy.yml` mantiene el patrón existente de "construir → empaquetar → desplegar" sin introducir secretos ni servicios externos. ✅ Principio XI.
- La sanitización en dos capas (parser sin HTML inline + DOMPurify con whitelist) es defensa en profundidad. ✅ Principio VIII.
- La carpeta `interviews/` en el repo permanece esencialmente vacía: el HTML servido vive solo en `_site/`, sin commit. ✅ FR-025.

✅ PASS post-design.

## Complexity Tracking

> Justificación de las únicas dependencias nuevas — todas build-time, ninguna runtime.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `gray-matter` (build-only) | Parsear frontmatter YAML del MD; estándar maduro | Reescribir parser YAML manualmente: alta superficie de bugs, riesgo de inyección si la implementación falla; `gray-matter` es la opción auditada y minimalista |
| `marked` (build-only) | Convertir Markdown a HTML | Reescribir parser MD: complejo (commonmark, GFM tables, listas anidadas, énfasis); riesgo de no cubrir casos comunes y degradar autoría |
| `dompurify` + `jsdom` (build-only) | Sanitizar HTML emitido contra XSS aun viniendo de autores de confianza (defensa en profundidad) | Sanitizar con regex propias: rechazado universalmente como antipatrón de seguridad; los regex no entienden HTML parsing |

Las cuatro dependencias se ejecutan exclusivamente en CI (Node.js 20). El bundle servido no las contiene. No se introducen `dependencies` runtime: solo `devDependencies`. La constitución IV exige justificación en el plan; queda registrada aquí.
