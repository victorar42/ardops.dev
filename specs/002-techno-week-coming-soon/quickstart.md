# Quickstart: Techno Week 8.0 — Coming Soon

**Feature**: 002-techno-week-coming-soon  
**Audience**: implementador (en `/speckit.implement`) y operador (Josue) el día de la charla.

Este documento contiene dos runbooks:

1. [Implementación inicial](#1-implementacion-inicial-pre-evento) — para llevar el sitio al estado `teaser`.
2. [Liberación post-charla](#2-liberacion-post-charla-2026-05-18) — para pasar a estado `published`.

Y una verificación rápida [smoke test](#3-smoke-test).

---

## 1. Implementación inicial (pre-evento)

### Pre-requisitos
- Branch `002-techno-week-coming-soon` checked out.
- Spec, plan, data-model y contratos leídos.
- Constitución leída.

### Pasos

#### 1.1 Editar `index.html` — bloque hero

Reemplazar el CTA secundario del hero (apunta hoy a `https://github.com/victorar42/techno-week`) por un anchor interno:

```diff
-          <a class="btn btn-ghost" href="https://github.com/victorar42/techno-week" target="_blank" rel="noopener noreferrer">
-            <svg ... GitHub icon ... />
-            Ver Repositorio
-          </a>
+          <a class="btn btn-ghost" href="#pipeline">
+            <svg ... pipeline icon (reusar el de talk-resources) ... />
+            Ver el Pipeline
+          </a>
```

#### 1.2 Editar `index.html` — sección `#talk`

Reemplazar todo el `<article class="talk-card"> ... </article>` actual por el bloque marcado en [`contracts/teaser-block.html`](contracts/teaser-block.html) variante con `h3.talk-title` (la primera del archivo).

Asegurarse de que **los marcadores `<!-- TALK-STATE:teaser START/END -->` queden en el HTML servido**: son parte del contrato y usados por el gate `forbidden-urls`.

#### 1.3 Editar `talks/index.html`

Misma operación: reemplazar el `<article class="talk-card">` actual por la variante con `h2.talk-title` del mismo `contracts/teaser-block.html` (segunda en el archivo).

Importante: la línea 76 de `talks/index.html` tiene `<a class="resource-link" href="https://github.com/victorar42/techno-week">` — se elimina como parte del swap.

#### 1.4 Editar `assets/css/components.css`

Agregar (al final de la sección `Talk card`, junto a `.talk-badge`) la variante `--coming` y los estilos para los nuevos elementos `.talk-meta` y `.talk-cta-info`:

```css
.talk-badge--coming {
  /* Hereda .talk-badge; opcionalmente acentuar con borde punteado o pulso suave */
  border: 1px dashed var(--accent);
  background: var(--accent-dim);
}

@media (prefers-reduced-motion: no-preference) {
  .talk-badge--coming {
    animation: pulse-glow 3s var(--ease-out) infinite alternate;
  }
}

.talk-meta {
  list-style: none;
  padding: 0;
  margin: 0 0 1.25rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.talk-meta-key {
  color: var(--text-muted);
  margin-right: 0.35rem;
}

.talk-cta-info {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px dashed var(--border);
}
```

Validar contraste (ver `contracts/a11y-badge.md`).

#### 1.5 Crear `tests/forbidden-urls.sh`

Implementar el script de referencia de [`contracts/forbidden-urls.md`](contracts/forbidden-urls.md). Hacerlo ejecutable (`chmod +x`).

Integrarlo al workflow de CI (job nuevo o paso adicional al job de Pages). Detalle del job se decide en `tasks.md`.

#### 1.6 Actualizar `README.md`

Agregar una sección visible (TOC + cuerpo) titulada **"Liberación post-charla — Techno Week 8.0"** con el contenido del runbook §2 de este documento (resumido). Esto cumple [SC-007](spec.md) y FR-010.

#### 1.7 Actualizar `.github/copilot-instructions.md`

Cambiar el bloque entre `<!-- SPECKIT START -->` y `<!-- SPECKIT END -->` para apuntar al plan activo:

```diff
 <!-- SPECKIT START -->
-**Plan activo**: [`specs/001-landing-redesign/plan.md`](../specs/001-landing-redesign/plan.md)
+**Plan activo**: [`specs/002-techno-week-coming-soon/plan.md`](../specs/002-techno-week-coming-soon/plan.md)
 <!-- SPECKIT END -->
```

#### 1.8 Verificar gates locales

```bash
# Gate forbidden-urls
bash tests/forbidden-urls.sh

# Lighthouse y a11y (si existe el script ya configurado)
npm run lh   # o el comando equivalente del proyecto
npx pa11y --config tests/pa11y.config.js http://localhost:8080/

# Smoke responsive: abrir DevTools, simular 320px y 380px viewports
```

#### 1.9 Commit y PR

Mensaje sugerido: `feat(talk): teaser state for Techno Week 8.0 (spec 002)`.

Descripción del PR debe incluir:
- Spec ID: 002
- Sección de constitución relevante: VIII (seguridad), VI (a11y), XI (hosting).
- Checklist de gates aplicables.

---

## 2. Liberación post-charla (2026-05-18)

> Tiempo estimado total: **~10 minutos** + verificación.

### Pre-requisitos
- URLs reales de los materiales en mano: repo público, slides hospedados (URL pública o PDF self-hosted en `assets/`), opcionalmente recursos extra.
- Branch nueva: `git switch -c release/talk-published`.

### Paso 2.1 — Reemplazar el bloque en `index.html`

1. Abrir `index.html`.
2. Localizar el bloque entre `<!-- TALK-STATE:teaser START -->` y `<!-- TALK-STATE:teaser END -->` dentro de `<section id="talk">`.
3. Eliminar ese bloque completo (incluyendo los marcadores).
4. Pegar el contenido de `specs/002-techno-week-coming-soon/contracts/published-block.html` en su lugar.
5. Sustituir los placeholders:
   - `{{REPO_URL}}` → URL real del repo.
   - `{{SLIDES_URL}}` → URL real de slides.
   - `{{EXTRA_RESOURCES}}` → eliminar o reemplazar por bloques `<a class="resource-link">` adicionales.
6. Si algún recurso no estará disponible, **eliminar el `<a>` correspondiente entero** (no dejar `href=""` ni `href="#"`).

### Paso 2.2 — Reemplazar el bloque en `talks/index.html`

Mismo procedimiento que 2.1. Confirmar que el heading siga siendo `<h2 class="talk-title">` (no `<h3>`).

### Paso 2.3 — Restaurar el CTA del hero

```diff
-          <a class="btn btn-ghost" href="#pipeline">
-            <svg ... pipeline icon ... />
-            Ver el Pipeline
-          </a>
+          <a class="btn btn-ghost" href="https://github.com/victorar42/techno-week" target="_blank" rel="noopener noreferrer">
+            <svg ... GitHub icon ... />
+            Ver Repositorio
+          </a>
```

(O dejar el CTA apuntando a `#pipeline` si ese es el comportamiento deseado post-charla — decisión del operador.)

### Paso 2.4 — Verificar gates

```bash
bash tests/forbidden-urls.sh   # debe retornar "OK: estado published. forbidden-urls gate en modo skip."
```

### Paso 2.5 — Commit y push

Mensaje sugerido: `feat(talk): publish Techno Week 8.0 materials`.

PR descripción: spec 002 sección "Liberación post-charla". Mergear a `main` cuando los materiales estén listos.

### Paso 2.6 (opcional) — Higiene del historial

El sitio es público. La URL del repo demo ya estuvo en historia. **No** reescribir historia para esta liberación: no aporta seguridad y rompe forks/clones. Si en el futuro se publica accidentalmente material verdaderamente sensible (e.g. claves, PII), evaluar `git filter-repo` con un PR a la constitución.

---

## 3. Smoke test

Tras implementar §1, verificar manualmente:

- [ ] **AC-1**: cargar `https://ardops.dev/` (o `python3 -m http.server` en local). Sección `#talk` muestra el badge `Próximamente · 18 mayo 2026`.
- [ ] **AC-2**: la fecha "18 de mayo de 2026" es legible en el bloque `.talk-meta`.
- [ ] **AC-3**: `Ctrl+F` en el código fuente del HTML servido (`view-source:`) buscando `victorar42`, `slides`, `.pdf`, `.pptx` no encuentra coincidencias en `<section id="talk">` ni en el hero.
- [ ] **AC-4**: DevTools → Elements → expandir el árbol del hero y de `#talk` no revela `<a href>` ocultos a recursos del evento.
- [ ] **AC-5**: viewport 320px y 380px → el badge no rompe el layout, no genera scroll horizontal.
- [ ] **AC-6**: `README.md` contiene la sección "Liberación post-charla — Techno Week 8.0".
- [ ] **A11Y**: VoiceOver lee el badge con su `aria-label` completo.
- [ ] **Lighthouse**: Accessibility = 100, Performance ≥ 95, CLS ≤ 0.1.

Si todos los items pasan: la feature está lista para PR.
