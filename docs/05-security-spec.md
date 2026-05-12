# Security Specification

> **Status (post spec 009 — 2026-05-11)**: GitHub Pages does NOT support
> custom HTTP headers. The site's security posture is implemented
> entirely via `<meta>` tags and build-time gates. The HTTP-header-only
> directives listed below (`Strict-Transport-Security`,
> `X-Content-Type-Options`, `Permissions-Policy`, `X-Frame-Options`)
> are **out-of-scope permanente** while the site stays on GitHub Pages
> (constitución XI). Migrating off GitHub Pages — or fronting it with
> Cloudflare — is a separate spec, not a workaround.

## Canonical CSP (post spec 009 — emitted on every served page)

```
default-src 'self';
script-src 'self';
style-src 'self';
font-src 'self';
img-src 'self' data:;
connect-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

- **No `'unsafe-inline'`** anywhere (validated by
  [`tests/csp-no-unsafe-inline.sh`](../tests/csp-no-unsafe-inline.sh)).
- **No `'unsafe-eval'`** anywhere.
- Hashes (`'sha256-...'`) are permitted in `script-src` / `style-src`
  only when justified by a dedicated spec.

## Active security gates

| Gate | What it enforces | Spec |
|---|---|---|
| `tests/csp-no-unsafe-inline.sh` | CSP forbids `'unsafe-inline'`/`'unsafe-eval'`; required directives present | 009 |
| `tests/external-links.sh` | Every external `<a target="_blank">` has `rel="noopener noreferrer"` | 009 |
| `tests/sitemap-drift.sh` | Sitemap ↔ canonical bidirectional drift | 009 |
| `tests/nav-consistency.sh` | Single source of truth for nav/footer | 008 |
| `tests/blog-schema.sh` | Blog frontmatter schema + XSS sanitization | 006 |
| `tests/interviews-xss.sh` | Interviews XSS sanitization | 003 |
| `tests/forbidden-urls.sh` | No staged URLs | 002 |

## Adding an exception (CSP, external dependency, etc.)

Exceptions to constitución IV / VIII (cero externals, no
`'unsafe-inline'`) require a **dedicated spec** that documents:
1. Justification & alternatives evaluated.
2. SRI hash for any external resource.
3. Migration plan if the exception is temporary.
4. Update to this document and to any affected gates.

No unilateral exceptions in PRs.

## Out-of-scope HTTP headers (permanent — GitHub Pages limitation)

The following directives can ONLY be served as HTTP headers and are
NOT supported by GitHub Pages. They are documented here as known
limitations, not as TODO items:

| Header | Notes |
|---|---|
| `Strict-Transport-Security` | GH Pages serves HSTS automatically with `max-age=31536000`; not customizable. |
| `X-Content-Type-Options: nosniff` | Sent automatically by GH Pages. Not configurable, but present. |
| `Permissions-Policy` | Cannot be emitted via `<meta>`. **Not enforceable on GH Pages.** |
| `X-Frame-Options: DENY` | Superseded by CSP `frame-ancestors 'none'` (which IS enforced via `<meta>`). |
| `Cross-Origin-*-Policy` | HTTP-header only; not applicable. |
| `Referrer-Policy` (header) | Replaced with `<meta name="referrer" content="strict-origin-when-cross-origin">` on every page (spec 009). |

Adding these would require fronting GH Pages with Cloudflare or
migrating hosting — both require constitutional PRs (constitución XI).

---

## Legacy notes (pre spec 009)

The sections below are kept for historical reference. The canonical CSP
above supersedes any prior CSP draft.

## Headers HTTP requeridos
- `Content-Security-Policy`: definir política estricta
  - default-src 'self'
  - script-src 'self' (sin inline, sin eval)
  - style-src 'self' 'unsafe-inline' (revisar si se puede eliminar)
  - img-src 'self' data: https:
  - font-src 'self'
  - connect-src 'self' https://api.github.com
  - frame-ancestors 'none'
- `Strict-Transport-Security`: max-age=31536000; includeSubDomains; preload
- `X-Content-Type-Options`: nosniff
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Permissions-Policy`: camera=(), microphone=(), geolocation=()
- `X-Frame-Options`: DENY

Nota: GitHub Pages no permite headers custom directamente. Opciones:
1. Cloudflare delante (recomendado) — Workers o Transform Rules
2. Meta tags equivalentes donde sea posible (CSP via meta tag)

## Política de dependencias
- Cero dependencias JS externas en runtime salvo justificación explícita
  documentada
- Si se usan: integrity hash (SRI) obligatorio
- Fonts self-hosted, NO desde Google Fonts CDN
- Cero scripts de tracking de terceros (Google Analytics, etc.)
  - Si se necesita analytics, usar Plausible o Umami self-hosted

## Formularios de contacto
- NO procesar formularios en cliente sin backend
- Opciones aceptables: Formspree, Netlify Forms, Cloudflare Worker propio
- Captcha obligatorio (hCaptcha o Cloudflare Turnstile)
- Rate limiting a nivel del servicio externo

## Secrets y datos sensibles
- Repositorio público a futuro: CERO secrets, tokens, emails personales,
  números telefónicos en el código
- Email de contacto: usar dirección dedicada (contact@ardops.dev)
- Nunca commitear archivos .env ni keys

## Vulnerabilidades conocidas a prevenir
- XSS: sin innerHTML con contenido dinámico, sin eval()
- Clickjacking: X-Frame-Options DENY + frame-ancestors 'none'
- MIME sniffing: X-Content-Type-Options nosniff
- Mixed content: 100% HTTPS, sin recursos http://
- Subdomain takeover: revisar CNAMEs huérfanos periódicamente

## Escaneo automático en CI
- Secret scanning (GitHub Advanced Security)
- Dependabot
- HTML validator
- Lighthouse CI con score mínimo de seguridad
- Mozilla Observatory check (objetivo: A+)
---

## Implementación v1 (001-landing-redesign)

**CSP aplicada (vía `<meta http-equiv>`)**:

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

Sin `'unsafe-inline'`, sin `'unsafe-eval'`, sin CDNs.

**Otras medidas aplicadas**:

- Todos los `target="_blank"` llevan `rel="noopener noreferrer"`.
- Sin inline `style=""` ni `onclick=`.
- Self-hosted: fonts (`assets/fonts/*.woff2`), favicons, OG image.

**Gap conocido — GitHub Pages**: Pages no permite headers HTTP custom
(HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options,
X-Frame-Options, COOP/COEP/CORP). Mitigación: la mayoría de las
protecciones están cubiertas por la meta CSP (`frame-ancestors 'none'`,
`upgrade-insecure-requests`). HSTS lo emite automáticamente Pages al
servir HTTPS para dominios `*.github.io`; en dominio custom (`ardops.dev`)
HSTS dependerá del navegador y de la lista preload (no controlable
desde el sitio).
