# Contract: CSP invariants

**Feature**: 016-syntax-highlighting

La integración de Shiki **no debe** alterar la política de seguridad
de contenido del sitio. Este contrato lista las invariantes y los
mecanismos de enforcement.

---

## Invariantes

### I1 — CSP meta sin cambios

El header CSP emitido en cada post DEBE permanecer:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self';
               img-src 'self' data:;
               font-src 'self';
               connect-src 'self';
               base-uri 'self';
               form-action 'none';
               frame-ancestors 'none';
               object-src 'none'">
```

- Cero `'unsafe-inline'` en `style-src`.
- Cero `'unsafe-eval'`.
- Cero hashes `'sha256-...'` nuevos.
- Cero relajaciones de origen.

**Verificación**: gate existente `tests/csp-no-unsafe-inline.sh`.

### I2 — Cero atributos `style=""` inline en HTML servido

```bash
grep -rE '\sstyle="' blog/ | wc -l   # → 0
grep -rE '\sstyle="' index.html      # → 0
```

**Verificación**: nuevo gate `tests/no-inline-styles-blog.sh`.

### I3 — DOMPurify `FORBID_ATTR` invariante

`scripts/build-blog.js` mantiene `style` dentro de `FORBID_ATTR`. Si
alguna vez se elimina, defensa en profundidad cae.

**Verificación**: gate `tests/dompurify-config.sh` (puede ser un grep
simple sobre `build-blog.js`).

### I4 — Cero externals nuevos

- `<link rel="stylesheet">` solo apunta a `/assets/css/*.css`
  (self-hosted).
- Cero `<script src="https://...">`.
- Cero `<img src="https://...">` introducidos por esta feature.

**Verificación**: `tests/no-externals.sh` (existente) + `tests/no-third-party-fonts.sh`.

### I5 — Cero JS runtime nuevo

`package.json.dependencies` NO gana entradas en esta feature. Solo
`devDependencies` puede ganar `shiki`.

**Verificación**: gate manual revisado en code review + AC-06 del
backlog.

---

## Mecanismo de defensa en profundidad

```text
Shiki output (puede tener style="color: var(--X)")
   │  transform: style → class
   ▼
HTML con clases .tok-* (cero style=)
   │  DOMPurify con FORBID_ATTR=['style', ...]
   ▼
HTML final (cero style= garantizado por dos capas)
   │  CI gate: tests/no-inline-styles-blog.sh
   ▼
deploy GitHub Pages
   │  CSP meta enforced por navegador
   ▼
si por algún error queda un style= → navegador lo bloquea por CSP
```

**Tres capas**:
1. Transform en build (proactivo).
2. DOMPurify (reactivo, capa de saneamiento).
3. CSP del navegador (último recurso, mata el render).

---

## DOMPurify whitelist: cambios requeridos

**Tags**: ninguno nuevo. `span`, `pre`, `code` ya están en
`ALLOWED_TAGS`.

**Atributos**: ninguno nuevo. `class` ya está en `ALLOWED_ATTR`.

**Classes**: DOMPurify no filtra por nombre de clase (acepta cualquier
`class="..."`). Las clases `tok-*`, `line`, `shiki` pasan sin cambios.

**Si en el futuro** se restringe DOMPurify para validar nombres de
clase (mejora opcional), las clases permitidas serían exactamente:
- `shiki`, `line`, `tok-keyword`, `tok-string`, `tok-comment`,
  `tok-function`, `tok-number`, `tok-operator`, `tok-variable`,
  `tok-type`, `tok-constant`, `tok-property`, `tok-punctuation`,
  `tok-tag`, `tok-attribute`, `tok-regex`, `tok-deleted`,
  `tok-inserted`, `language-{X}` (para los 21 X en la allowlist).
