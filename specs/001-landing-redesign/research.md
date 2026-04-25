# Phase 0 — Research

**Feature**: Landing Page Redesign (v1) · `001-landing-redesign`
**Date**: 2026-04-24

Toda decisión aquí cierra una `NEEDS CLARIFICATION` técnica del plan. Las decisiones de identidad visual NO se investigan: están fijadas por la constitución (principio II) y la referencia.

---

## R-01 · Origen de las fuentes self-hosted

**Decision**: Descargar `woff2` de **JetBrains Mono** (`400`, `700`) desde el repo oficial `JetBrains/JetBrainsMono` (release tag `v2.304+`, archivo `JetBrainsMono-Regular.woff2` y `JetBrainsMono-Bold.woff2`) y de **Outfit** (`400`, `600`, `700`) desde `Outfitio/Outfit` (releases) o vía `google-webfonts-helper` (`gwfh.mranftl.com`). Ambas familias quedan bajo `assets/fonts/` con su `OFL.txt` consolidado en `assets/fonts/LICENSE.md`.

**Rationale**:
- Constitución V exige cero CDN externo en runtime → bajamos los archivos al repo.
- Solo `woff2` (compatibilidad ≥ 95% según caniuse, suficiente para target evergreen).
- Subset `latin` cubre español sin acentos exóticos; reduce peso ~70% vs full.
- Pesos exactos limitados a los usados por la referencia: JetBrains Mono 400/700; Outfit 400/600/700 (la referencia usaba 300-700, pero 300 y 500 no aparecen en estilos finales tras auditoría).

**Alternatives considered**:
- Servir desde Google Fonts CDN: rechazado, viola constitución V.
- Variable fonts (`JetBrainsMono[wght].woff2`, `Outfit[wght].woff2`): rechazado para v1 por sobrepeso (~150 KB cada uno) cuando solo necesitamos 2-3 pesos discretos. Reevaluable cuando se agreguen más pesos.
- Self-hostear todos los pesos 100-900: rechazado, viola principio VII (performance).

**Verifiable**: `assets/fonts/` contiene exactamente 5 `woff2` + 1 `LICENSE.md`; ningún `<link>` apunta a `fonts.googleapis.com` o `fonts.gstatic.com`.

---

## R-02 · CSP en GitHub Pages

**Decision**: Aplicar Content Security Policy vía `<meta http-equiv="Content-Security-Policy">` en cada `<head>` con la siguiente política base:

```
default-src 'self';
script-src 'self';
style-src 'self';
font-src 'self';
img-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests
```

Sin `'unsafe-inline'` ni `'unsafe-eval'`. `data:` permitido solo en `img-src` para SVGs inline pequeños (grain overlay).

**Rationale**:
- GitHub Pages no permite headers HTTP arbitrarios (documentado por GitHub). La meta tag es el único vector controlable.
- `frame-ancestors` y `Strict-Transport-Security` no se pueden setear via meta (ignored by spec); se documentan como deuda en `docs/05-security-spec.md`.
- `base-uri 'self'` previene base-tag injection.

**Alternatives considered**:
- Migrar a Cloudflare Pages para headers via `_headers`: aporta HSTS, Permissions-Policy, COOP, etc. Rechazado para v1 por scope; queda como ítem para futura spec.
- Permitir `'unsafe-inline'` para CSS crítico: rechazado, contradice principio VIII.

**Verifiable**: `curl -s https://ardops.dev/ | grep "http-equiv=\"Content-Security-Policy\""` devuelve la política completa; CSP Evaluator (csp-evaluator.withgoogle.com) sin warnings críticos.

---

## R-03 · Estrategia de carga de fonts

**Decision**:
- `@font-face` con `font-display: swap`.
- `<link rel="preload" as="font" type="font/woff2" crossorigin>` solo para 2 pesos críticos: `outfit-400.woff2` (body) y `jetbrains-mono-400.woff2` (mono); el resto carga lazy on demand.
- `unicode-range` apuntando al subset latin estándar.

**Rationale**: Minimiza FOUT severo en LCP element (hero name) sin penalizar peso inicial. Preload de 2 archivos (~50-60 KB combinados) es aceptable dentro del budget.

**Alternatives considered**:
- Preload de los 5 pesos: rechazado, sumaría ~120-150 KB al critical path.
- `font-display: optional`: degrada a system fonts si la conexión es lenta; rechazado porque la identidad visual de la constitución exige que las fonts aparezcan.

**Verifiable**: Lighthouse "Preload key requests" sin advertencias para fonts; LCP < 2.5s en mobile throttled.

---

## R-04 · Lighthouse CI thresholds

**Decision**: `tests/lighthouserc.json` con assertions:

| Categoría | Min |
|---|---|
| Performance | 95 |
| Accessibility | 100 |
| Best Practices | 95 |
| SEO | 95 |
| LCP | < 2500 ms |
| CLS | < 0.1 |
| TBT | < 200 ms |
| Total Byte Weight | < 500 KB |

Run en `mobile` y `desktop` (dos invocaciones). Falla bloquea el merge.

**Rationale**: Materializa principios VI y VII. TBT < 200 ms es proxy local de INP < 200 ms (LHCI no mide INP en lab).

**Alternatives considered**:
- `warn` en lugar de `error`: rechazado, principio IX exige fail.
- Solo mobile: rechazado, desktop también es target legítimo.

**Verifiable**: Workflow `lighthouse.yml` falla cuando alguna métrica baja; reporte HTML adjunto al run.

---

## R-05 · Multi-página sin SSG: estrategia de header/footer compartido

**Decision**: **Duplicar HTML** del header (`<header><nav>`) y footer en cada página (home, blog, talks, 404) en v1. No introducir un sistema de templating ni JS de inyección.

**Rationale**:
- Solo hay 1 página real (home) y 2 placeholders mínimos en v1 — el riesgo de divergencia es bajo.
- Inyección por JS produce flicker (FOUC del nav) y degrada accessibility cuando JS falla.
- SSG (Eleventy/Astro) es scope explícitamente excluido del v1.
- Cuando el blog tenga ≥ 5 posts, una nueva spec evaluará SSG.

**Alternatives considered**:
- Web Components (`<site-nav>`, `<site-footer>`): añade ~1-2 KB JS, no resuelve el flicker, complica CSP.
- Includes via SSG: out of scope.

**Verifiable**: cada página `*.html` contiene su propio `<header>` y `<footer>` literal; un test estructural en CI puede comparar diffs si la duplicación se vuelve problema.

---

## R-06 · Deploy a GitHub Pages

**Decision**: Usar workflow `pages-deploy.yml` con `actions/configure-pages@v5` + `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`. Trigger en push a `main` y `workflow_dispatch`. **Gated**: deploy depende de éxito de `ci.yml` y `lighthouse.yml` (vía `needs:` o como job dependiente en el mismo workflow).

**Rationale**:
- Permite bloquear deploy si los gates fallan (principio IX).
- "Deploy from branch" (alternativa) no soporta gates de CI.
- Artifact = repo root excluyendo `specs/`, `legacy/`, `docs/`, `tests/`, `.specify/`, `.github/`.

**Alternatives considered**:
- Branch `gh-pages`: legacy, requiere mantener el branch.
- "Deploy from branch": rechazado, no permite gates condicionales.

**Verifiable**: PR con LHCI failing no produce deploy; un push a `main` con todo verde sí.

---

## R-07 · OG image y favicons

**Decision**:
- OG: `public/og/og-default.png` 1200×630, fondo `--bg-primary`, texto "ardops.dev — DevOps Engineer / Security as Code", generado a mano (Figma/Inkscape) y commiteado.
- Favicons: set generado con [realfavicongenerator.net](https://realfavicongenerator.net) o equivalente offline → `public/favicon/{favicon.ico, favicon-16.png, favicon-32.png, apple-touch-icon.png, site.webmanifest}`.

**Rationale**: PNG estático es portable, cacheable, sin riesgos de compatibilidad. SVG OG no es soportado por todas las plataformas (LinkedIn falla).

**Alternatives considered**:
- Generación dinámica server-side: imposible (sitio estático).
- HTML→PNG en CI: posible pero overkill para una imagen que cambia raramente.

**Verifiable**: Validators (`opengraph.xyz`, LinkedIn Post Inspector) muestran preview correcto.

---

## R-08 · JSON-LD para SEO

**Decision**: Incluir un único `<script type="application/ld+json">` en `index.html` con un grafo `@context: https://schema.org` que contiene:
- `Person` (Victor) con `name`, `url`, `jobTitle`, `sameAs` (GitHub, LinkedIn).
- `Event` (Techno Week 8.0) con `name`, `startDate`, `location` (BCR), `performer` → ref al Person, `url` (anchor `#talk`).

**Rationale**: Cubre FR-026; un grafo único es más limpio que múltiples scripts.

**Alternatives considered**:
- Microdata inline: más verboso, peor mantenimiento.
- `WebSite` + `Organization`: redundante, `Person` es la entidad principal.

**Verifiable**: Schema.org Validator (`validator.schema.org`) sin errores; Google Rich Results Test acepta el `Person`.

---

## R-09 · Tests CLI dev-only

**Decision**: Pinear versiones en `package.json` (devDependencies) aunque el sitio no use Node en runtime:
- `@lhci/cli@^0.14`
- `pa11y-ci@^3`
- `html-validate@^9`
- `lychee` se invoca via action `lycheeverse/lychee-action@v2` (binario, sin npm).

`npm ci` solo se ejecuta en workflows; el repo publica únicamente HTML/CSS/JS/fonts/imgs.

**Rationale**: Reproducibilidad de CI. `package.json` no agrega peso al sitio servido.

**Verifiable**: `package.json` y `package-lock.json` existen; `actions/setup-node@v4` con `cache: 'npm'` en workflows.

---

## R-10 · Confirmaciones pendientes (no bloquean Phase 1)

Confirmaciones de contenido recibidas (2026-04-24):

- LinkedIn: `https://www.linkedin.com/in/victorar42/` ✅
- Email: `josuevjar@gmail.com` ✅
- Repositorio de la charla: `https://github.com/victorar42/techno-week` ✅
- Fecha de la charla: 2026-05-18 (18 de mayo de 2026) ✅
- GitHub profile (handle): `https://github.com/victorar42` (derivado del owner del repo confirmado).

Único pendiente no bloqueante:

- Imagen OG visual definitiva: placeholder commiteado en v1, reemplazo opcional antes del release.

---

## R-11 · DNS y dominio en GoDaddy

**Decision**: Mantener el dominio `ardops.dev` registrado en **GoDaddy** y delegar DNS al mismo GoDaddy. Apuntar el apex con 4 records `A` y 4 `AAAA` a los IPs de GitHub Pages (`185.199.108-111.153` / `2606:50c0:8000-8003::153`) y `www` con `CNAME` a `<usuario>.github.io.`. Activar "Enforce HTTPS" y verificación de dominio (`TXT _github-pages-challenge-…`) en GitHub.

**Rationale**:
- El usuario tiene el dominio en GoDaddy y prefiere no migrar el registrar.
- GitHub Pages requiere apex via `A`/`AAAA` (los `CNAME` flattening no son universales en GoDaddy).
- "Enforce HTTPS" cubre la ausencia de HSTS-preload (ver R-02 para limitación de headers).

**Alternatives considered**:
- Migrar DNS a Cloudflare manteniendo el registrar en GoDaddy: aporta CNAME flattening, headers via `_headers`, mejor caché. Rechazado para v1 — mantiene el sistema simple y reduce piezas; queda como ítem para futura spec si se necesitan los headers HTTP custom.
- Cambiar registrar a Cloudflare/Namecheap: rechazado, fuera de scope técnico.

**Implications for this feature**:
- CSP via `<meta>` se mantiene como única opción para principio VIII (parcial).
- Sin HSTS, sin Referrer-Policy, sin Permissions-Policy: documentado como deuda en `docs/09-deployment-spec.md` y en Complexity Tracking del plan.
- DNS propagation puede tomar hasta 24 h tras el primer setup; planificar el primer deploy con margen.

**Verifiable**: `dig +short ardops.dev` → 4 IPs `185.199.108-111.153`; `curl -I https://ardops.dev/` → `HTTP/2 200`; checklist de primer deploy en `docs/09-deployment-spec.md`.
