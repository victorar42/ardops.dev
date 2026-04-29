# Phase 0 — Research: Techno Week 8.0 Coming Soon

**Feature**: 002-techno-week-coming-soon  
**Date**: 2026-04-28

Este documento consolida las decisiones técnicas que resuelven los `NEEDS CLARIFICATION` y elecciones de diseño para implementar la spec [`spec.md`](spec.md) sin violar la constitución.

---

## R-001 — Mecanismo del flag de publicación

**Decision**: Bloque HTML delimitado por marcadores de comentario, intercambiado manualmente al liberar.

```html
<!-- TALK-STATE:teaser START -->
<article class="talk-card">
  ... contenido teaser sin URLs sensibles ...
</article>
<!-- TALK-STATE:teaser END -->
```

Tras la charla, el operador reemplaza la región delimitada (incluyendo los marcadores) por el contenido de `contracts/published-block.html`, sustituyendo los placeholders `{{SLIDES_URL}}`, `{{REPO_URL}}` por las URLs reales.

**Rationale**:
- **Constitución III (sitio estático)**: no requiere build server-side, no requiere JS en runtime. Es texto plano editado en commit time.
- **FR-005 / SC-002 (cero URLs sensibles)**: las URLs publicadas no existen en el HTML servido hasta el momento exacto de la edición; no quedan ocultas con CSS, `hidden`, `aria-hidden` o comentarios.
- **SC-003 (1 archivo, 1 cambio)**: una sola región delimitada por archivo. La operación de liberación es un swap atómico revisable en un diff de PR pequeño.
- **Trazabilidad**: el cambio queda en `git log` con autor y fecha, sin instrumentación adicional.

**Alternatives considered**:
1. **Atributo `data-talk-published="true|false"` con dos sub-árboles**: rechazado. Para alternar requeriría JS en runtime o ambos sub-árboles presentes en HTML — el sub-árbol "publicado" expondría las URLs antes de tiempo (viola FR-005).
2. **Variable JS global `TALK_PUBLISHED` evaluada en cliente**: rechazado. Requiere JS y, peor, las URLs deberían vivir en el bundle JS desde antes — equivalente al leakage anterior. Además contradice la preferencia de simplicidad de la constitución.
3. **Generador estático (Eleventy/Hugo) con front-matter**: rechazado. Introduce dependencia de build (constitución III, IV) y desproporcionado para 1 toggle.
4. **Bloques alternados por `<template>` ocultos**: rechazado. `<template>` no se renderiza pero las URLs quedan en el DOM serializado — viola FR-005.

**Consecuencia**: dos surfaces (`index.html`, `talks/index.html`) requieren el mismo swap; el runbook lista ambos pasos (ver `quickstart.md`). Esto se documenta como "1 archivo de código por surface, 2 surfaces" — alineado con SC-003 al medir el diff total del PR de liberación.

---

## R-002 — Idioma y texto del badge

**Decision**: Español. Texto visible: `"Próximamente"`. `aria-label` extendido en el contenedor: `"Contenido próximamente, disponible el 18 de mayo de 2026"`.

**Rationale**:
- Audiencia primaria del sitio y del evento es Costa Rica (resuelto en spec Assumptions).
- Coherencia con resto del sitio (todo el copy pre-existente en `index.html` y `talks/index.html` está en español, salvo términos técnicos como "DevSecOps").
- WCAG 3.1.1 (Language of Page): `<html lang="es">` ya está configurado; texto en inglés rompería coherencia.

**Alternatives considered**:
- **"Coming Soon" (inglés)**: rechazado por audiencia. Se mantendrá disponible como string alternativo en el snippet `contracts/teaser-block.html` comentado para referencia, no en el HTML servido.

---

## R-003 — Tratamiento del Hero CTA "Ver Repositorio"

**Hallazgo**: `index.html` línea ~152 contiene actualmente:

```html
<a class="btn btn-ghost" href="https://github.com/victorar42/techno-week" target="_blank" rel="noopener noreferrer">
  ... Ver Repositorio
</a>
```

Esta URL coincide con el repositorio demo de la charla — VIOLACIÓN directa de FR-005 / SC-002 en el estado actual.

**Decision**: Reemplazar el href del CTA secundario del hero por un anchor interno mientras el estado sea `teaser`. El nuevo CTA apunta a `#pipeline` con texto `"Ver el Pipeline"` (ya existe la sección y describe genéricamente el enfoque sin filtrar el repo demo).

**Rationale**:
- Mantiene la jerarquía visual del hero (dos CTAs, primario + ghost).
- Refuerza la narrativa pedagógica del sitio sin exponer el demo.
- Es revertible/avanzable en el mismo PR de liberación (re-añadir el `href` al repo cuando el flag pase a `published`).

**Alternatives considered**:
- **Eliminar el CTA secundario**: aceptable visualmente pero pierde balance del hero. Rechazado por estética.
- **Apuntar a `https://github.com/josuegit` (perfil personal)**: aceptable pero no aporta a la narrativa de la charla. Reservado como segunda opción si en revisión visual `#pipeline` no convence.

---

## R-004 — JSON-LD Event y SEO

**Hallazgo**: El bloque `<script type="application/ld+json">` Event en `index.html`:
- `name`: nombre completo de la charla — público, sin contenido sensible.
- `description`: párrafo de alto nivel — sin slides, sin código, sin spoilers operativos.
- `url`: `https://ardops.dev/#talk` — anchor interno, no es URL del repo demo.
- `eventStatus`: `EventScheduled` — correcto pre-evento.

**Decision**: No modificar el JSON-LD. El contenido actual es público y no expone material sensible. Verificación mecánica: el JSON-LD pasa el gate `forbidden-urls` (no contiene `victorar42/techno-week` ni patrones de slides).

**Alternatives considered**:
- **Marcar `eventStatus: EventPostponed` o `EventCancelled`**: rechazado, el evento sigue confirmado.
- **Eliminar el JSON-LD hasta liberación**: rechazado, perjudica SEO sin ganancia de seguridad (no había leak).

---

## R-005 — Countdown dinámico

**Decision**: Excluido del alcance.

**Rationale**:
- Spec Assumptions explícita.
- Constitución IV (cero JS de terceros, default vanilla) y VII (performance es feature) hacen el costo/beneficio desfavorable para una feature decorativa.
- Si se decidiera implementarlo después: spec separada, JS vanilla con `setInterval` y `Intl.RelativeTimeFormat` (ambos nativos), y un nuevo gate de performance para confirmar 0 regresión.

---

## R-006 — Higiene del historial Git

**Hallazgo verificable**: El repositorio es público; la URL `https://github.com/victorar42/techno-week` ya está en commits previos (presente en `index.html` y `talks/index.html` actualmente). No hay material adicional sensible (no se identificaron rutas a slides, PDFs ni capturas) en el repo público.

**Decision**: NO ejecutar `git filter-repo` ni reescritura de historia para esta feature. La URL del repo demo en sí no es secreta (es un repo de GitHub potencialmente público o privado del autor); lo que se controla en `ardops.dev` es no promocionarlo desde el sitio del autor antes del 18 de mayo. Eliminar la URL del HEAD es suficiente para cumplir FR-005.

**Acción operativa documentada**: el runbook (`quickstart.md`) incluye un paso de verificación previa al merge:

```bash
git --no-pager log -p HEAD..origin/main -- index.html talks/index.html | grep -iE 'techno-week|slides' || echo "OK: nada nuevo en historia"
```

Esto detecta si en el branch de feature alguien introdujo URLs sensibles que no estuvieran ya en `main`.

**Alternatives considered**:
- **`git filter-repo` para borrar URL**: rechazado. El repositorio del sitio es público; reescribir historia no impide que copias previas (forks, cachés de GitHub, archive.org) conserven la URL. Costo alto, beneficio nulo.

---

## R-007 — Gate de CI: `forbidden-urls`

**Decision**: Implementar un check de CI (script bash + `grep -E`) que falle el build si encuentra patrones prohibidos en archivos HTML servidos mientras el flag esté en `teaser`.

**Spec del gate** en [`contracts/forbidden-urls.md`](contracts/forbidden-urls.md).

**Rationale**:
- Cumple constitución IX (cada PR pasa todas las gates).
- Es la verificación mecánica de SC-002 (cero URLs sensibles).
- Costo trivial: ~5 líneas de bash, sin dependencias nuevas.

**Implementación sugerida** (detallada en `tasks.md` posteriormente, no en este plan):
- Archivo: `tests/forbidden-urls.sh` (a crear).
- Invocación desde el workflow de Pages existente o un nuevo job en CI.
- Skip mode cuando un archivo `RELEASE_FLAG` o variable de entorno indique `published` (para no fallar el PR de liberación).

**Alternatives considered**:
- **Pre-commit hook local**: complementario, pero no garantiza protección en CI. Rechazado como única defensa.
- **Lint HTML + regla custom**: sobrecomplica. El grep es directo y auditable.

---

## R-008 — Estilo visual del badge

**Decision**: Reutilizar `.talk-badge` existente. El texto cambia a `"Próximamente"` y se prepende el ícono actual (`★` reemplazado por glifo de reloj o mantener `★` con texto contextual). No se introduce nueva clase salvo que el equipo decida un toque distintivo `--coming` (variante con borde punteado o pulso suave usando la animación `pulse-glow` ya declarada en `motion.css`).

**Rationale**:
- Constitución II (identidad visual preservada): `.talk-badge` ya está validado en spec 001 con contraste WCAG.
- Tokens existentes (`--accent`, `--accent-dim`) suficientes.

**Alternatives considered**:
- **Nuevo badge con color rojo de "alerta"**: rechazado. No es alerta, es información expectativa. Usar accent (cyan) preserva la jerarquía visual.

---

## Resumen de NEEDS CLARIFICATION resueltos

| ID original (spec/input) | Resolución |
|---|---|
| Idioma del badge | Español ("Próximamente") — R-002 |
| Countdown sí/no | No (fuera de alcance) — R-005 |
| Mecanismo del flag | Bloque HTML con marcadores de comentario — R-001 |
| Tratamiento de URL en hero | Reemplazar por anchor interno — R-003 |
| Reescritura de historia git | No requerida — R-006 |

✅ Sin `NEEDS CLARIFICATION` pendientes para Phase 1.
