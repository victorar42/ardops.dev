# Quickstart — Privacy policy + no-tracking enforcement (spec 015)

## Verificar la página local

```bash
cd /Users/josue/Desktop/Personal/ardops.dev
python3 -m http.server 8000
# abrir http://localhost:8000/privacy/
```

Comprobá:

- 5 secciones visibles, una `<h1>`, `<time datetime>` con la fecha real.
- Enlaces externos a GitHub se abren en nueva pestaña con
  `rel="noopener noreferrer"`.
- Footer incluye enlace a `/privacy/` (auto-current cuando estás en
  esa página, si aplica).

## Correr los gates nuevos

```bash
# Anti-tracker
bash tests/no-trackers.sh
# Esperado: ✓ no-trackers gate (N files scanned, M patterns)
# Exit 0

# Anti-cookies
bash tests/no-cookies.sh
# Esperado: ✓ no-cookies gate (N files scanned)
# Exit 0
```

## Forzar un fallo (para ver el reporte)

```bash
# 1) Inyectar un tracker
echo '<script src="https://www.googletagmanager.com/gtag/js?id=FAKE"></script>' >> 404.html
bash tests/no-trackers.sh
# 404.html:<line>:<...>googletagmanager.com<...>
# ✗ no-trackers gate: 1 violation(s) across 1 file(s)
# Exit 1
git checkout -- 404.html

# 2) Inyectar document.cookie
echo 'document.cookie = "x=y";' >> assets/js/main.js
bash tests/no-cookies.sh
# assets/js/main.js:<line>:document.cookie
# ✗ no-cookies gate: 1 violation(s) across 1 file(s)
# Exit 1
git checkout -- assets/js/main.js
```

## Agregar un patrón nuevo

1. Editar `tests/tracker-domains.txt`. Una línea por patrón ERE.
   Caracteres especiales (`.`, `(`, etc.) escapados con `\`.
2. Comentarios con `#` y líneas vacías para mantenibilidad.
3. Correr `bash tests/no-trackers.sh` para verificar que no hay
   coincidencias actuales (o limpiarlas).
4. Commit del cambio en un PR.

## Excepción legítima (proceso oficial)

No existe flag de bypass. Si necesitás introducir analytics
auto-hospedado u otro third-party:

1. Abrir spec dedicada (siguiente número en `specs/`).
2. Spec debe justificar la excepción, listar alternativas evaluadas e
   incluir una sección "Privacy impact".
3. Actualizar `/privacy/` (sección 1) para reflejar la excepción.
4. Deshabilitar o ajustar `tests/no-trackers.sh` según el caso (vía
   patch en la misma spec, con commit message que cite la spec).
5. Bump constitucional si la excepción amplía la regla del Principio
   XII.

## Lighthouse

- La página `/privacy/` debe pasar los thresholds del spec 014:
  - Performance ≥ 0.95 (mobile).
  - CLS ≤ 0.1.
  - LCP ≤ 3000 ms (mobile) / 2500 ms (desktop).
- Las URLs se agregan a `tests/lighthouserc.json` y
  `tests/lighthouserc.mobile.json`.

## Resumen de comandos del paquete

```bash
npm run check:no-trackers   # bash tests/no-trackers.sh
npm run check:no-cookies    # bash tests/no-cookies.sh
npm run check:distribution  # incluye los anteriores + spec 014 gates
```
