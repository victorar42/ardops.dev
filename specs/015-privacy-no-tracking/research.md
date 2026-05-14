# Research — Privacy policy + no-tracking enforcement (spec 015)

Decisiones de Phase 0. Cada ítem responde una pregunta abierta del plan.

---

## R-1 — Carga de JS en `/privacy/`

**Decisión**: `/privacy/` no carga `assets/js/main.js`. La página es 100 %
HTML + CSS estático.

**Rationale**: la página solo declara texto. `main.js` se encarga de
enhancements (terminal cursor, fade-up reveal) que pueden activarse vía
CSS-only fallback. Cargarlo aumentaría bytes y latencia para una página
ocasional. Cero JS también facilita probar el gate `no-cookies.sh` con
exit 0 sin caso especial.

**Alternativas evaluadas**:

- Cargar `main.js` para mantener el `data-year` dinámico. Rechazada: el
  resto del sitio ya usa año hardcodeado en `renderFooter()` (spec 008
  D-010), así que `<span data-year>2026</span>` se reemplaza con texto
  literal y nada degrada.
- Cargar solo CSS animaciones. No agrega valor a una página estática.

---

## R-2 — Formato de patrones en `tracker-domains.txt`

**Decisión**: archivo de texto plano, **un patrón Extended Regex (ERE) por
línea**. Líneas vacías y líneas que comienzan con `#` se ignoran. Los
caracteres ERE especiales (`(`, `)`, `.`, `/`) se escriben literalmente; el
script los pasa a `grep -nE` sin transformación.

Ejemplo:

```text
# Google
googletagmanager\.com
google-analytics\.com
gtag\(
ga\.js
analytics\.js
# Hotjar
hotjar\.com
```

**Rationale**: `grep -E` está disponible en macOS y ubuntu sin instalar
nada. Los `\.` evitan que `.` matchee cualquier carácter. `gtag\(` permite
detectar llamadas inline. Comentarios y líneas vacías mejoran la
mantenibilidad sin agregar parser propio.

**Alternativas evaluadas**:

- Coincidencia literal (`grep -F`). Rechazada: no permite anclajes (e.g.
  evitar matchear dentro de otra cadena) si se necesitan después.
- Lista YAML / JSON. Rechazada: agrega un parser, viola "cero deps".
- Inline en el shell script. Rechazada: requiere editar bash para agregar
  un dominio (peor DX).

---

## R-3 — Scope del barrido (qué incluye y excluye cada gate)

**Decisión**: ambos gates barren desde la raíz del repo. Incluyen
archivos servidos en producción; excluyen workspace y `tests/`.

**Incluir** (extensiones por gate):

| Gate | Extensiones |
|---|---|
| `no-trackers.sh` | `.html`, `.css`, `.js` |
| `no-cookies.sh` | `.js` |

**Excluir** (idéntico para ambos):

- `.git/`
- `node_modules/`
- `.specify/`
- `specs/`
- `docs/`
- `backlog/`
- `.reference/`
- `tests/`
- `legacy/`
- `scripts/`
- `.github/` (workflows, no se sirven al navegador)

**Rationale**: el sitio servido está en la raíz + `assets/` + carpetas de
sección. Cualquier match en `legacy/`, `.reference/` o specs es ruido (no
se publica). `scripts/` queda excluido porque son builders Node que
generan los HTMLs servidos: si un builder emite tracker, lo veremos en el
HTML resultado.

**Alternativas evaluadas**:

- Barrer también `scripts/`. Rechazada: produciría falsos positivos al
  documentar dominios prohibidos en los propios builders.
- Una `.gitattributes` con marcadores. Rechazada: overkill para 10
  exclusiones.

---

## R-4 — Mensaje de error y exit code

**Decisión**: alineado con los gates de spec 014:

- **exit 0**: sin violaciones; gate imprime `✓ no-trackers gate (N files
  scanned, M patterns)` (o equivalente para no-cookies).
- **exit 1**: una o más violaciones; gate imprime cada match en formato
  `path:line:matched-pattern` y al final `✗ no-trackers gate: K
  violation(s)`.
- **exit 2**: error de I/O (lista no existe, repo no legible).

**Rationale**: matchea convención existente (`tests/byte-budgets.sh`,
`tests/img-attrs.sh`, `tests/no-third-party-fonts.sh`). CI distingue
fácilmente fail-real de fail-environmental.

---

## R-5 — Bump constitucional y numeración del nuevo principio

**Decisión**: nuevo principio se publica como **XII — Privacy by
Default**. Los principios I–XI existentes **no se renumeran**. Bump de
versión constitucional **MINOR**: v1.2.0 → **v1.3.0**.

**Rationale**: el backlog dice "agregar principio X" como nomenclatura
genérica; la constitución vigente ya consume X (Documentación versionada)
y XI (Hosting y dominio fijos). Renumerar rompería todas las referencias
existentes en specs anteriores (009, 010, 014, etc.). Agregar como XII es
aditivo (MINOR según SemVer constitucional: nuevo principio no
contradictorio).

**Texto canónico** (≤ 120 palabras, integrado en constitution.md):

> **XII. Privacy by Default**
>
> Cero trackers, cero cookies, cero third-party scripts. El sitio no
> recopila, almacena ni transmite datos personales más allá de los logs
> de acceso que GitHub Pages procesa como hosting. Cualquier excepción
> (analytics auto-hospedados, embeds de video, etc.) requiere:
> (a) spec dedicada con justificación, (b) actualización simultánea de
> `/privacy/`, (c) deshabilitar el gate `no-trackers.sh` con la
> justificación versionada. Los gates `tests/no-trackers.sh` y
> `tests/no-cookies.sh` automatizan la enforcement.

**Sync-impact-report** (a anexar en el bloque HTML al final de
`constitution.md`):

```html
<!--
Sync Impact Report (2026-05-14, v1.2.0 → v1.3.0):
- New Principle XII (Privacy by Default) added.
  - Codifies the de-facto no-tracking, no-cookies, no-third-party policy
    that has been an implicit invariant since project inception.
  - Introduces two CI gates: tests/no-trackers.sh and tests/no-cookies.sh.
  - Exception process: every deviation requires a dedicated spec + update
    to /privacy/.
- Driven by spec 015 (Privacy policy + no-tracking enforcement).
- No renumbering of Principles I–XI; addition is purely additive.
-->
```

**Alternativas evaluadas**:

- Bump MAJOR (v2.0.0). Rechazada: no se rompe ningún principio
  existente; SemVer constitucional reserva MAJOR para cambios
  contradictorios o eliminaciones.
- Renumerar como X y bumpear el resto a XI/XII. Rechazada: cascada de
  edits en specs ya cerradas; alto costo, cero beneficio.

---

## R-6 — Footer global hoy

**Decisión**: existe un emisor único `renderFooter()` en
`scripts/lib/layout.js` (línea 94-99) que ya generan
`scripts/build-blog.js` y `scripts/build-interviews.js`. Sin embargo, los
HTMLs servidos hardcodean su propio footer (idéntico al de `renderFooter`).

**HTMLs que duplican el footer hoy**:

- `index.html`
- `404.html`
- `blog/index.html`
- `blog/pipeline-seguridad-spec-driven.html` (emitido por build-blog)
- `interviews/index.html` (emitido por build-interviews)
- `interviews/victor-ardon.html` (emitido por build-interviews)
- `interviews/valid-minimal.html` (fixture, emitido)
- `interviews/xss-attempt.html` (fixture, emitido)
- `now/index.html`
- `talks/index.html`
- `speaking/index.html`
- `uses/index.html`

**Estrategia**:

1. Cambiar `renderFooter()` en `scripts/lib/layout.js` agregando un enlace
   `<a href="/privacy/">Privacidad</a>` dentro de `<p class="footer-links">`
   junto a `/now/`. Esto cubre automáticamente blog + interviews al
   re-build.
2. Para los HTMLs hardcodeados, agregar el mismo `<a>` dentro del bloque
   `<!-- footer:start --> … <!-- footer:end -->` ya marcado.
3. Verificar con un gate ligero opcional (futura spec): `nav-consistency`
   ya cubre nav, pero no footer. Esta spec no agrega gate de footer
   (out of scope explícito); confiamos en revisión manual y en que
   nuevos HTMLs se generen via builders.

**Rationale**: minimiza riesgo de drift y respeta Principio X
(documentación versionada).

---

## R-7 — Falsos positivos conocidos

**Decisión**: lista mínima y conservadora. `tracker-domains.txt` contiene
**solo** los dominios listados en FR-06 del backlog y nada más.

**Casos a evitar como falsos positivos**:

- `fonts.googleapis.com`: no aparece (el sitio es self-hosted, Principio
  V). Si alguien la introduce, debería fallar en gate
  `no-third-party-fonts.sh` (spec 014), no en este.
- `github.com`: enlace legítimo desde `/privacy/` al perfil/repo. **No**
  está en la lista, no produce falso positivo.
- `web.dev/articles/cls`: aparece en `tests/lighthouserc*.json` (Lighthouse
  comments) — pero el path `tests/` está excluido del barrido. Cero
  riesgo.
- `mailto:` y `tel:`: no producen match porque no contienen ningún
  patrón.
- HTML comments con `<!-- ... -->`: el gate matchea el contenido textual
  igual que el navegador lo recibiría. Si un comentario menciona
  `googletagmanager.com`, debe limpiarse — es ruido peligroso.

**Edge case explícito**: el archivo `tests/tracker-domains.txt` **mismo**
contiene los patrones literalmente. Como `tests/` está excluido del
barrido, no se auto-detecta. Verificado en R-3.

---

## Resumen

| Pregunta | Respuesta corta |
|---|---|
| R-1 | `/privacy/` no carga JS. |
| R-2 | Lista ERE, un patrón por línea, `#` comentarios. |
| R-3 | Barre `.html/.css/.js` (trackers) y `.js` (cookies) en raíz + `assets/` + secciones; excluye workspace y `tests/`. |
| R-4 | Exit 0/1/2 + `path:line:pattern`, alineado a spec 014. |
| R-5 | Principio XII, bump MINOR v1.3.0, sin renumerar I–XI. |
| R-6 | Editar `renderFooter()` + footers hardcodeados con `<a href="/privacy/">`. |
| R-7 | Lista conservadora; cero falsos positivos esperados. |

Sin NEEDS CLARIFICATION pendientes. Lista para Phase 1.
