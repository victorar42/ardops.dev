# Quickstart — Spec 007: Blog UX & Visual Polish

## Local smoke (post-implementación)

```sh
# 1. Regenerar HTML del blog
node scripts/build-blog.js

# 2. Verificar build determinista
node scripts/build-blog.js --check

# 3. Validar HTML
npm run html-validate

# 4. Servir el sitio
npx --yes serve -l 8080 .

# 5. Abrir
open http://localhost:8080/blog/
open http://localhost:8080/blog/pipeline-seguridad-spec-driven.html
```

## Manual QA

### Página de post

1. Abrir `/blog/pipeline-seguridad-spec-driven.html` en desktop (≥1024px).
   - Verificar: aside TOC sticky a la izquierda con enlaces a todos los `<h2>`.
   - Verificar: cuerpo con jerarquía clara, bloques de código con fondo y barra cyan, blockquotes con borde acento, stat cards renderizadas con el mismo estilo que en el landing.
   - Verificar: footer del post con tags, botón "← Volver a todos los posts" y aside de compartir con tres enlaces (Mail, LinkedIn, X).
2. Reducir viewport a 375px.
   - Verificar: aside TOC desaparece; `<details>` colapsable aparece arriba del cuerpo, cerrado por defecto.
   - Verificar: bloques `<pre>` scrollean horizontalmente sin romper viewport.
3. Activar `prefers-reduced-motion` en el sistema.
   - Verificar: hovers de la card no aplican `translateY`.
4. Click derecho sobre un link de compartir → "Copiar enlace".
   - Verificar: el `href` contiene título y URL URL-encodeados correctamente.

### Página índice

1. Abrir `/blog/` con al menos 3 posts (publicar fixtures temporales si hace falta).
2. Click en un chip de tag.
   - Verificar: solo se muestran los posts con ese tag; el chip se ve activo; el conteo en `<output>` se actualiza.
3. Tipear "pipeline" en la búsqueda.
   - Verificar: filtra en < 100ms; combina con el filtro de tag.
4. Buscar algo que no existe.
   - Verificar: aparece "No encontré nada con eso…" y botón "Limpiar filtros".
5. Click en "Limpiar filtros".
   - Verificar: chip "Todos" queda activo, search vacío, todas las tarjetas vuelven.
6. Desactivar JS en DevTools y recargar.
   - Verificar: todos los posts visibles; chips de tag siguen funcionando; caja de búsqueda oculta.

### A11y

```sh
(nohup npx --yes serve -l 8080 . > /tmp/serve.log 2>&1 &)
sleep 3
node tests/a11y.js
pkill -f "serve -l 8080"
```

Verificar: `✓ all N URLs pass WCAG 2.1 AA`.

### Lighthouse

```sh
npm run lhci
```

Verificar: Performance ≥ 95, Accessibility = 100, Best Practices ≥ 95, SEO ≥ 95 en `/blog/` y `/blog/<slug>.html`.

### Bundle size del JS

```sh
ls -la assets/js/blog-filter.js
wc -c assets/js/blog-filter.js
```

Verificar: < 4 KB.

## Negative gate

```sh
bash tests/blog-schema.sh
```

Esperado: todos los fixtures negativos siguen rechazados + nuevo fixture `cover-missing.md` rechazado por archivo de cover ausente.
