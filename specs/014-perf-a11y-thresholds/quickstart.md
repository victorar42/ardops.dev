# Quickstart — Spec 014 Performance & a11y thresholds

## Correr todos los gates locales

```bash
# 1. Build artefactos
node scripts/build-blog.js
node scripts/build-interviews.js --include-fixtures --out interviews/
node scripts/build-layout.js

# 2. Gates nuevos
bash tests/byte-budgets.sh
bash tests/img-attrs.sh
bash tests/no-third-party-fonts.sh

# 3. Lighthouse (desktop + mobile)
npx --yes @lhci/cli@latest autorun --config=tests/lighthouserc.json
npx --yes @lhci/cli@latest autorun --config=tests/lighthouserc.mobile.json
```

## Vía `npm`

```bash
npm run check:byte-budgets
npm run check:img-attrs
npm run check:fonts
npm run check:lighthouse           # existente, ahora con thresholds elevados
npm run check:lighthouse:mobile    # existente, ahora con thresholds elevados

# Suite encadenada (incluye los nuevos)
npm run check:distribution
```

## Forzar fallo (validación de los gates)

```bash
# byte-budgets: forzar overflow
BB_HTML_MAX=1000 bash tests/byte-budgets.sh   # debe exit 1

# img-attrs: editar manualmente un HTML quitando width/height en cualquier <img>
# y correr bash tests/img-attrs.sh

# no-third-party-fonts: agregar temporalmente un <link> a fonts.googleapis.com
# en cualquier HTML y correr bash tests/no-third-party-fonts.sh
```

## Outputs esperados

| Gate | Output éxito (sitio actual) |
|---|---|
| `byte-budgets` | `✓ byte-budgets gate` con 4 buckets dentro de límite |
| `img-attrs` | `✓ img-attrs gate (N pages inspected, M <img> total)` |
| `no-third-party-fonts` | `✓ no-third-party-fonts gate` |
| `lighthouse` (desktop) | `Done running Lighthouse!` + 8 URLs verdes |
| `lighthouse:mobile` | `Done running Lighthouse!` + 8 URLs verdes |

## Troubleshooting

- **byte-budgets falla por gzip diferente entre macOS/Linux**: aceptar
  diferencia ≤ 1 % (constante de versión); el sitio actual tiene 60 %+
  de margen.
- **img-attrs falla porque `jsdom` no encuentra módulo**: correr
  `npm ci` primero. `jsdom` es devDep, no opcional.
- **lighthouse mobile falla con performance 0.94**: regresión real;
  inspeccionar audit `unused-javascript` o `render-blocking-resources`.
  Si la regresión es legítima por un experimento de UI, abrir spec
  para ajustar threshold; no bajar 0.95 sin proceso.
- **no-third-party-fonts falla por `<link rel="preconnect">` legítimo**:
  no debería ocurrir. El sitio NO necesita preconnect a externos por
  diseño (constitución V).

## CI

Cada gate corre como job independiente en
`.github/workflows/ci.yml`:

- `byte-budgets` — runner ubuntu-latest, sin npm ci (POSIX puro).
- `img-attrs` — runner ubuntu-latest, requiere `npm ci` (jsdom).
- `fonts-policy` — runner ubuntu-latest, sin npm ci.
- `lighthouse` — existente, sin cambios estructurales.

Wall-time agregado proyectado: < 30 s adicional (SC-008).
