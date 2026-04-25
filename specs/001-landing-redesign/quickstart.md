# Quickstart — Landing v1

**Feature**: `001-landing-redesign` · **Branch**: `001-landing-redesign`

## Prereqs
- Node 20+ (solo para correr CI tools localmente; el sitio no requiere Node).
- Un servidor estático cualquiera (`npx serve`, `python3 -m http.server`, VS Code Live Server).
- Navegador con DevTools.

## Servir local

```bash
cd /path/to/ardops.dev
npx serve -l 8080 .
# o
python3 -m http.server 8080
```

Abrir `http://localhost:8080/` (home), `/blog/` y `/talks/` para verificar.

## Validar gates antes de PR

```bash
# 1. HTML válido
npx html-validate index.html blog/index.html talks/index.html 404.html

# 2. Accesibilidad (WCAG 2.1 AA)
npx pa11y-ci --config tests/pa11y.config.js

# 3. Links rotos
npx lychee --config tests/links.config.json '*.html' 'blog/**/*.html' 'talks/**/*.html'

# 4. Lighthouse (mobile + desktop)
npx @lhci/cli@latest autorun --config=tests/lighthouserc.json
```

Todos deben pasar antes de mergear (ver [contracts/](./contracts/)).

## Verificación manual rápida

1. **Comparación visual**: abrir `index.html` y `legacy/index.html` lado a lado en dos ventanas → deben verse iguales en hero, talk card, pipeline, about, blog placeholder, contact, footer.
2. **Teclado**: cargar la home, presionar `Tab` desde el inicio → primer foco visible debe ser el "Skip to main content"; recorrer todos los enlaces hasta el footer sin trampas.
3. **Reduced motion**: DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce" → animaciones de hero y blink del cursor desaparecen.
4. **Network third-party**: DevTools → Network → recargar con cache deshabilitado → filtrar por dominio: 0 requests fuera de `ardops.dev` (o `localhost`).
5. **Inline ban**: `rg 'style="|onclick=' index.html blog/ talks/ 404.html` debe devolver 0 matches.
6. **OG preview**: pegar `https://ardops.dev/` en `https://www.opengraph.xyz/` → preview correcto.
7. **Schema.org**: pegar el HTML en `https://validator.schema.org/` → sin errores.

## Estructura del PR

```
PR title:  feat(landing): redesign home (spec 001-landing-redesign)

Spec ID:   001-landing-redesign
Constitución: I, II, III, IV, V, VI, VII, VIII (con desviación documentada), IX, X
Gates:
  [x] html-validate
  [x] pa11y (WCAG 2.1 AA)
  [x] lychee (links)
  [x] Lighthouse Performance ≥95 (mobile + desktop)
  [x] Lighthouse Accessibility = 100
  [x] Lighthouse Best Practices ≥95
  [x] Lighthouse SEO ≥95
  [x] LCP <2.5s, CLS <0.1, TBT <200ms
  [x] 0 requests a terceros
  [x] CSP estricta vía meta
  [x] Sin style="" / onclick=""
```
