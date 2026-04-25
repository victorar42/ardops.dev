# Security Specification

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
