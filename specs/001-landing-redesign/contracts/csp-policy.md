# CSP Contract

**Applies to**: every HTML page served from `ardops.dev/`.

## Required policy (vía `<meta http-equiv="Content-Security-Policy">`)

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

## Assertions

- A1. `default-src` debe ser exactamente `'self'`.
- A2. NO debe aparecer `'unsafe-eval'` en ninguna directiva.
- A3. NO debe aparecer `'unsafe-inline'` en `script-src` ni en `style-src`.
- A4. `data:` se permite SOLO en `img-src`.
- A5. `connect-src` excluye dominios de terceros (no analytics).
- A6. `base-uri 'self'` presente.

## Verification

- Manual: `curl -s https://ardops.dev/ | grep -i 'content-security-policy'` debe devolver la política completa.
- Automated: parser en CI (`tests/csp.test.js` opcional v2) que lee `<meta>` de cada página y valida A1-A6.
- External: [csp-evaluator.withgoogle.com](https://csp-evaluator.withgoogle.com/) sin warnings de severidad alta.

## Known gap (documented)

GitHub Pages no permite headers HTTP custom. Por tanto NO podemos enviar:

- `Strict-Transport-Security`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Embedder-Policy`
- CSP via header (en lugar de meta) → habilitaría `frame-ancestors` y `report-to`.

Tracked en `docs/05-security-spec.md` y en Complexity Tracking del plan. Migración a Cloudflare Pages se evaluará en spec posterior.
