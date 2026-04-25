# Deployment Specification

## Hosting & dominio

- **Hosting**: GitHub Pages (sitio estático servido desde el repositorio público).
- **Dominio**: `ardops.dev`, registrado y administrado en **GoDaddy** (registrar + DNS).
- **Apex**: `https://ardops.dev` (servido).
- **Subdominio**: `https://www.ardops.dev` → 301 a apex (configurado por Pages cuando el `CNAME` apunta al apex).
- **HTTPS**: enforced por GitHub Pages (toggle "Enforce HTTPS" activado). Certificado emitido y rotado automáticamente por Let's Encrypt vía GitHub.
- **`CNAME`**: archivo en raíz del repo con valor `ardops.dev`. Es el mecanismo que GitHub Pages usa para conocer el dominio.

### DNS — GoDaddy

En el panel de GoDaddy (DNS Management de `ardops.dev`) deben existir estos records:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | `185.199.108.153` | 600 s |
| A | @ | `185.199.109.153` | 600 s |
| A | @ | `185.199.110.153` | 600 s |
| A | @ | `185.199.111.153` | 600 s |
| AAAA | @ | `2606:50c0:8000::153` | 600 s |
| AAAA | @ | `2606:50c0:8001::153` | 600 s |
| AAAA | @ | `2606:50c0:8002::153` | 600 s |
| AAAA | @ | `2606:50c0:8003::153` | 600 s |
| CNAME | www | `<usuario>.github.io.` | 600 s |

Los IPs son los publicados por GitHub Pages para apex domains; verificar la documentación oficial antes de tocar DNS. Cualquier record `A`/`AAAA` previo apuntando a "GoDaddy parking" o redirects propios debe eliminarse.

### Verificación de dominio (recomendado)

Activar "Verified domains" en GitHub: añade un `TXT` con valor provisto por GitHub bajo `_github-pages-challenge-<usuario>.ardops.dev`. Previene takeovers si el repo se borra/transfiere.

---

## Restricciones impuestas por GitHub Pages (afecta toda la implementación)

GitHub Pages **NO** permite:

- Headers HTTP custom (HSTS, Referrer-Policy, Permissions-Policy, COOP/COEP, X-Frame-Options, CSP via header). La política de seguridad debe expresarse vía `<meta http-equiv="Content-Security-Policy">` en cada HTML; los demás headers quedan como deuda técnica documentada.
- Reescritura/ruteo dinámico (no `_redirects`, no `_headers`, no edge functions).
- Server-side: ningún lenguaje server-side. Solo HTML/CSS/JS/assets estáticos.
- Tamaños superiores a los límites de Pages (1 GB sitio, 100 MB por archivo, recomendado < 100 GB tráfico/mes).

GitHub Pages **SÍ** provee:

- HTTPS automático en apex y `www`.
- HTTP/2.
- Caché CDN global (Fastly).
- Soporte para apex domain (la razón por la que usamos los `A`/`AAAA` arriba en lugar de un único CNAME).

Cualquier feature que requiera lo no soportado debe abrir una nueva spec proponiendo migración (Cloudflare Pages, Netlify, Vercel) con justificación de costo/beneficio.

---

## Estrategia de deploy

- Branch `main` = producción.
- Branches `00X-feature-*` se mergean a `main` vía PR squash.
- Cada PR pasa los workflows de gates antes de poder mergearse.
- El deploy a Pages se ejecuta automáticamente al mergear a `main`.

## Pipeline (GitHub Actions)

Workflows en `.github/workflows/`:

1. **`ci.yml`** (PR + push main): `html-validate`, `pa11y-ci` (WCAG 2.1 AA), `lychee` (links).
2. **`lighthouse.yml`** (PR): Lighthouse CI con assertions de [`specs/001-landing-redesign/contracts/lighthouse-budgets.md`](../specs/001-landing-redesign/contracts/lighthouse-budgets.md). Mobile + desktop.
3. **`pages-deploy.yml`** (push main + workflow_dispatch): `actions/configure-pages@v5` → `actions/upload-pages-artifact@v3` → `actions/deploy-pages@v4`. **Gated**: depende de que `ci` y `lighthouse` hayan pasado verde sobre el commit.

El artifact subido a Pages excluye `specs/`, `legacy/`, `docs/`, `tests/`, `.specify/`, `.github/`, `node_modules/`.

## Rollback

- Revert del commit en `main` (`git revert <sha> && git push`) → workflow de deploy se dispara y restaura el estado anterior.
- Tiempo objetivo de rollback: < 5 minutos (duración del workflow + invalidación CDN Fastly).

## Monitoreo

- Uptime: UptimeRobot (free tier) verificando `https://ardops.dev/`, `https://ardops.dev/blog/`, `https://ardops.dev/talks/` cada 5 min.
- Alerta a email si alguna URL responde != 200 por > 2 min.
- Lighthouse programado mensualmente vía `schedule:` en `lighthouse.yml` para detectar regresiones de Core Web Vitals.

## Smoke test post-deploy

Job opcional dentro de `pages-deploy.yml`:

- `curl -sI https://ardops.dev/ | grep "200"`
- `curl -sI https://ardops.dev/blog/ | grep "200"`
- `curl -sI https://ardops.dev/talks/ | grep "200"`
- `curl -s https://ardops.dev/ | grep -i 'content-security-policy'` (verifica meta CSP).

## Variables y secrets

- No se requieren secrets en runtime.
- En CI: ningún secret necesario para Pages (deploy usa OIDC vía `id-token`).
- GoDaddy NO expone API key en el repo. Cualquier cambio DNS es manual y se documenta en el commit message que motive el cambio (ej. rotación de IPs de Pages).

## Checklist de primer deploy

1. [ ] `CNAME` con valor `ardops.dev` commiteado en raíz.
2. [ ] Records DNS en GoDaddy según la tabla.
3. [ ] `Settings → Pages` del repo: source = "GitHub Actions".
4. [ ] `Settings → Pages → Custom domain` = `ardops.dev` y verificación TXT completada.
5. [ ] `Settings → Pages → Enforce HTTPS` activado.
6. [ ] Workflow `pages-deploy.yml` corre verde una vez sobre `main`.
7. [ ] `dig +short ardops.dev` devuelve los IPs `185.199.108-111.153`.
8. [ ] `curl -I https://ardops.dev/` devuelve `HTTP/2 200`.

---

## Pipeline de deploy v1 (implementado)

Tres workflows en `.github/workflows/`:

1. **`ci.yml`** — Trigger: PR + push a main.
   Jobs: `html-validate`, `a11y` (axe-core 4.x WCAG 2.1 AA),
   `lychee` (link-check). Falla bloquea merge.

2. **`lighthouse.yml`** — Trigger: PR + push a main.
   Matriz `[desktop, mobile]` corriendo `@lhci/cli` con thresholds del
   [contrato](../specs/001-landing-redesign/contracts/lighthouse-budgets.md).
   Falla bloquea merge.

3. **`pages-deploy.yml`** — Trigger: push a `main` + `workflow_dispatch`.
   Build empaqueta solo el HTML/CSS/JS público (excluye `specs/`,
   `docs/`, `tests/`, `.specify/`, `.reference/`, `legacy/`,
   `node_modules/`, `package*.json`, `.github/`). Deploy con
   `actions/deploy-pages@v4`. Permisos `pages: write`, `id-token: write`.

**Dominio personalizado**: GoDaddy DNS apuntando a GitHub Pages (registros
A/AAAA + CNAME `www`). `CNAME` en raíz del repo declara `ardops.dev`.
