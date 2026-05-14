# Backlog 08 — Privacy policy + no-tracking enforcement

> **Estado**: ✅ completado en spec [015-privacy-no-tracking](../specs/015-privacy-no-tracking/spec.md) · **Prioridad original**: P3
> **Esfuerzo estimado**: XS (~1-2 horas) · **ROI networking**: bajo (coherencia de marca)

---

## Por qué

El sitio **de facto no usa analytics, cookies, ni tracking**. Esto es una
decisión consciente alineada con tu marca DevSecOps. Pero **no está
documentada explícitamente** en ninguna parte, y **no hay un gate que
prevenga regresiones** (ej: alguien copia un snippet de GA por error).

Esta spec hace explícito lo implícito y lo blinda.

## Objetivo

1. Página `/privacy/` corta (200-300 palabras) que declara la política
   de no-tracking.
2. Gate de CI que falla si aparecen dominios de trackers conocidos en
   cualquier HTML/CSS/JS servido.

## Alcance funcional (FRs)

### Página /privacy/

- **FR-01** — Ruta `/privacy/` (archivo `privacy/index.html`).
- **FR-02** — Contenido (en español, ~250 palabras):
  - Sección 1 — "Qué este sitio NO hace": no cookies, no analytics, no
    fingerprinting, no third-party scripts, no tracking pixels, no
    newsletters embebidas, no comentarios.
  - Sección 2 — "Qué pasa con mis logs": el sitio está hospedado en
    GitHub Pages, los logs de acceso son manejados por GitHub bajo su
    propia política. Link a la política de GitHub.
  - Sección 3 — "Qué información recibo si me escribís a mailto":
    solo lo que vos escribás. No retención más allá de lo necesario.
  - Sección 4 — "Cambios a esta política": commit history del repo es la
    fuente de verdad. Link al archivo en GitHub.
  - Sección 5 — "Contacto" si tenés dudas: email.
- **FR-03** — Last modified: `<time datetime="">` con fecha del último
  cambio relevante.
- **FR-04** — Link en footer global (no en nav principal).
- **FR-05** — Pero no es necesaria para cumplir GDPR/CCPA (no procesamos
  datos personales), sí es buena práctica de transparencia.

### Gate anti-tracker

- **FR-06** — `tests/no-trackers.sh`: grep recursivo en HTML servido,
  CSS y JS, falla si encuentra cualquiera de:
  ```
  googletagmanager.com  google-analytics.com  gtag(  ga.js  analytics.js
  hotjar.com            mouseflow.com         fullstory.com
  segment.com           segment.io            mixpanel.com    amplitude.com
  plausible.io          fathom.com            simpleanalytics.com
  cloudflareinsights.com  matomo.org           piwik.pro
  facebook.net/en_US/fbevents.js               connect.facebook.net
  twitter.com/i/adsct  static.ads-twitter.com
  linkedin.com/li.lms-analytics                snap.licdn.com
  doubleclick.net      pinimg.com/ct           tiktok.com/i18n/pixel
  ```
  Lista mantenible en `tests/tracker-domains.txt`.

- **FR-07** — `tests/no-cookies.sh`: grep que falla si encuentra
  `document.cookie` en cualquier JS servido (excluyendo `node_modules/`
  y `tests/`).

- **FR-08** — Constitución actualizada con principio explícito:
  "**X. Privacy by Default** — Cero trackers, cero cookies, cero
  third-party scripts. Cualquier excepción requiere actualización de
  /privacy/ + spec dedicada con justificación."

## Alcance técnico

- HTML estático para `/privacy/`.
- Reutiliza shared layout (Backlog 01).
- Dos scripts bash nuevos en `tests/`.
- Update a `.specify/memory/constitution.md`.

## Gates / tests

- `bash tests/no-trackers.sh`.
- `bash tests/no-cookies.sh`.
- `npm run html-validate`.
- `node tests/a11y.js` (agregar URL).

## Out of scope

- Banner de cookies (no hay cookies → no hay banner — y eso es la feature).
- DNT (Do Not Track) header parsing — no hay JS de tracking que respetar.
- Analytics opt-in / opt-out (no hay analytics).
- Política en inglés (diferida; el sitio es es-CR primario).

## Edge cases

- Si en algún momento se decide agregar analytics (ej: Plausible
  self-hosted): debe ser con spec dedicada, actualización de /privacy/,
  y deshabilitar el gate `no-trackers.sh` con justificación.
- El gate debe correr sobre **archivos servidos**, no sobre `node_modules/`
  ni `.specify/`.

## Criterios de aceptación

- AC-01: Existe `/privacy/index.html` con texto real (no Lorem).
- AC-02: Footer global incluye link a `/privacy/`.
- AC-03: `bash tests/no-trackers.sh` pasa con 0 violaciones.
- AC-04: `bash tests/no-cookies.sh` pasa con 0 violaciones.
- AC-05: PR que agrega un snippet de GA falla CI.
- AC-06: Constitución actualizada con principio X.

## Constitución relevante

- IV (Security by Default), **X (nuevo: Privacy by Default)**.

## Notas para `/specify`

> "Página /privacy/ corta declarando no-tracking, no-cookies, hosting en
> GH Pages. Link en footer. Gates `no-trackers.sh` y `no-cookies.sh` para
> bloquear regresiones. Agregar principio X 'Privacy by Default' a la
> constitución. Sin banner de cookies (intencional)."
