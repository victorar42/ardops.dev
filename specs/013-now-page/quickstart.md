# Quickstart — `/now/` page (spec 013)

**Feature**: spec 013 · **Audience**: implementor + futuro yo
actualizando la página cada 4-6 semanas.

## TL;DR para validar la implementación

```bash
# Desde repo root
npm run build            # incluye build-layout (inyecta nav/footer/head-meta)
npm run html-validate
bash tests/csp-no-unsafe-inline.sh
bash tests/external-links.sh
bash tests/no-placeholders.sh
bash tests/nav-consistency.sh
bash tests/sitemap-drift.sh
bash tests/seo-meta.sh
bash tests/jsonld-validate.sh
bash tests/now-freshness.sh
node tests/a11y.js
```

Todos deben terminar con exit 0.

## Cómo actualizar `/now/` cada mes (≤ 15 minutos)

1. Editar `now/index.html`:
   - Cambiar el `<time datetime="YYYY-MM-DD">` (banner) a la fecha
     de hoy (UTC).
   - Cambiar el texto humano del banner ("12 de mayo de 2026") para
     que coincida.
   - Revisar/editar bullets dentro de cada `<section>`. Máximo 5
     por sección.
   - Omitir secciones opcionales (`hablando`, `vida`) si no hay
     contenido real.
2. Actualizar `dateModified` en el bloque JSON-LD para que coincida
   con el `<time>`.
3. Actualizar `sitemap.xml`: cambiar el `<lastmod>` del entry de
   `/now/`.
4. Correr `bash tests/now-freshness.sh` localmente. Debe pasar.
5. Commit:
   ```bash
   git add now/index.html sitemap.xml
   git commit -m "chore(now): update YYYY-MM-DD"
   git push
   ```

## Cómo probar el gate de freshness localmente

```bash
# Caso feliz
bash tests/now-freshness.sh
# → ✓ now-freshness gate: actualizada hace 0 días (2026-05-13)

# Forzar fallo "stale"
NOW_FRESHNESS_MAX_DAYS=0 bash tests/now-freshness.sh; echo "exit=$?"
# → exit=5

# Archivo sin <time>
echo "<html><body></body></html>" > /tmp/now-empty.html
NOW_PAGE=/tmp/now-empty.html bash tests/now-freshness.sh; echo "exit=$?"
# → exit=2

# Fecha futura
printf '<time datetime="2099-12-31"></time>' > /tmp/now-future.html
NOW_PAGE=/tmp/now-future.html bash tests/now-freshness.sh; echo "exit=$?"
# → exit=4
```

## Verificar a11y en local

```bash
# Levantar servidor estático en puerto 8080
python3 -m http.server 8080 &
SERVER_PID=$!

# Correr a11y suite
node tests/a11y.js
# Esperado: ✓ 10/10 URLs PASS (9 previas + /now/)

# Limpiar
kill $SERVER_PID
```

## Verificar Lighthouse en local

```bash
npx lighthouse http://localhost:8080/now/ \
  --preset=desktop \
  --only-categories=performance,accessibility,best-practices,seo
```

Targets:

- Performance ≥ 95
- Accessibility = 100
- Best-Practices ≥ 95
- SEO = 100

## Archivos que se tocan

Ver el árbol completo en [`plan.md`](./plan.md#source-code-repository-root).
Resumen:

- **Nuevo**: `now/index.html`, `tests/now-freshness.sh`
- **Modificados**: `scripts/lib/layout.js`, `scripts/build-layout.js`,
  5x `scripts/check-*.js`, `index.html`, `sitemap.xml`,
  `package.json`, `tests/no-placeholders.sh`, `tests/a11y.js`,
  `tests/pa11y.config.js`, `tests/lighthouserc*.json`,
  `.github/workflows/ci.yml`.

## Rollback

```bash
git revert <commit-sha>
```

La página es completamente aislada (sin DB, sin deps). Revert es
idempotente. La única consideración: los `scripts/check-*.js`
seguirán esperando `now/index.html` si el revert deja a medias
los `STATIC_PAGES`. Revert el commit completo, no parcial.
