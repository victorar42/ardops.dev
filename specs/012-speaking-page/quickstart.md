# Quickstart — Speaking Page (spec 012)

Cómo construir, validar localmente y verificar en producción la
nueva página `/speaking/`.

## Pre-requisitos

- Node 20 LTS (igual que el resto del repo).
- macOS o Linux (gates bash + `sips` opcional para validar dimensiones
  de imagen).
- `npm ci` ya corrido al menos una vez (sin nuevas deps).

## 1. Build local

```bash
npm run build
```

Esto ejecuta el pipeline existente:

- `scripts/build-blog.js`
- `scripts/build-interviews.js`
- `scripts/build-layout.js` (inyecta nav/footer/head-meta en TODAS las
  páginas registradas en `PAGES`, incluida la nueva
  `speaking/index.html`).

Verificar que el HTML quedó con nav y footer:

```bash
grep -c '<!-- nav:start -->' speaking/index.html  # 1
grep -c '<!-- footer:start -->' speaking/index.html  # 1
```

## 2. Servir localmente

```bash
python3 -m http.server 4173
```

Abrir <http://localhost:4173/speaking/> y verificar visualmente:

- Tres bios visibles, cada una con su botón "Copiar bio".
- Headshot inline carga (lazy) y el link "Descargar headshot HD"
  funciona.
- "Temas que doy" lista 4-8 entries.
- "Idiomas y formatos" muestra los tres bloques.
- CTA "Invitame a tu evento" abre el cliente de correo del SO.
- "Eventos pasados destacados" lista 3-5 entries con link a `/talks/`.

## 3. Suite de gates local

```bash
npm run html-validate \
 && bash tests/csp-no-unsafe-inline.sh \
 && bash tests/external-links.sh \
 && bash tests/no-placeholders.sh \
 && bash tests/nav-consistency.sh \
 && bash tests/sitemap-drift.sh \
 && bash tests/seo-meta.sh \
 && bash tests/jsonld-validate.sh \
 && bash tests/headshot-size.sh \
 && node tests/a11y.js
```

Esperado: todas verde.

`headshot-size.sh` debe imprimir algo como:

```
✓ headshot-size gate: assets/img/speaking/headshot.jpg (218421 bytes, 1500x1500)
```

## 4. Validación manual de bios y mailto

### 4.1 Copiar bio

1. Click en "Copiar bio" de la bio media.
2. Pegar en un editor de texto.
3. Confirmar: texto idéntico al visible (whitespace colapsado
   permitido), sin etiquetas HTML.

Repetir para corta y larga.

### 4.2 Fallback sin JS

1. DevTools → Settings → Debugger → Disable JavaScript.
2. Recargar `/speaking/`.
3. Click en `<summary>` de cada bio: el `<details>` se expande.
4. Seleccionar el texto manualmente: la copia funciona vía OS.

### 4.3 Headshot download

1. Click en "Descargar headshot HD".
2. Confirmar nombre de archivo: `ardon-headshot.jpg`.
3. Confirmar dimensiones del archivo descargado: ≥ 1200×1200 px.
4. Confirmar peso: ≤ 250 KB.

### 4.4 CTA mailto

1. Configurar Gmail web como handler de `mailto:` en el browser.
2. Click "Invitame a tu evento".
3. Confirmar:
   - Para: `contacto@ardops.dev`.
   - Asunto: empieza con `Invitación a speaking:`.
   - Cuerpo: contiene las 8 etiquetas (Evento, Fecha, Audiencia,
     Duración, Tema propuesto, Modalidad (presencial/remoto),
     Compensación, Contexto adicional) en líneas separadas.
4. Repetir el test con Apple Mail como handler.

### 4.5 A11y manual

- Navegar la página completa solo con teclado: Tab → focus visible
  → Enter activa botones / sigue links.
- VoiceOver (macOS): Cmd+F5, navegar con Ctrl+Opt+→. Verificar que
  cada bio se anuncia como "details, contraído/expandido", y que el
  feedback "Copiado ✓" se anuncia tras copiar.

## 5. Smoke test post-deploy

Después del push a `main` y deploy de GitHub Pages (1-2 min):

```bash
# 1) HTTP 200 en la nueva ruta
curl -sI https://ardops.dev/speaking/ | head -1

# 2) Headshot existe y peso correcto
curl -sI https://ardops.dev/assets/img/speaking/headshot.jpg \
  | grep -iE 'content-(length|type)'

# 3) JSON-LD presente y referencia al Person canónico
curl -s https://ardops.dev/speaking/ \
  | grep -c '"@id":"https://ardops.dev/#person"'   # debe ser 1

# 4) Aparece en sitemap
curl -s https://ardops.dev/sitemap.xml | grep -c '/speaking/'  # ≥ 1

# 5) Está enlazado desde la nav global
curl -s https://ardops.dev/ | grep -c 'href="/speaking/"'  # ≥ 1
```

## 6. Validadores externos

- **Schema.org validator**:
  <https://validator.schema.org/#url=https%3A%2F%2Fardops.dev%2Fspeaking%2F>
  → debe detectar `Person` sin errores.
- **Lighthouse SEO**: ≥ 95 (target SC-003).
- **Lighthouse Performance**: ≥ 95 (target SC-002).
- **Lighthouse Accessibility**: 100 (target SC-002).

## 7. Rollback

Si algo falla en producción:

```bash
git revert <commit-de-speaking>
git push
```

GitHub Pages re-despliega en 1-2 min. Como la página es completamente
self-contained y solo añade rutas/assets nuevas (no modifica HTML
existente fuera del nav/footer compartido), el revert no rompe nada
upstream.
