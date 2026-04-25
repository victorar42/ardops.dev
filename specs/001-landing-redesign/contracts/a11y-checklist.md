# Accessibility Contract (WCAG 2.1 AA)

**Applies to**: cada página HTML servida.

## Structural

- A1. Exactamente un `<h1>` por página.
- A2. Jerarquía de headings sin saltos (`h1 → h2 → h3`).
- A3. Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>` presentes.
- A4. Skip link como primer elemento focusable: `<a class="skip-link" href="#main">Saltar al contenido</a>`.
- A5. Atributo `lang="es"` en `<html>`.

## Interactivity

- B1. Todos los enlaces y botones recorribles con `Tab` / `Shift+Tab`.
- B2. Foco visible en cualquier elemento interactivo (outline custom con contraste ≥ 3:1).
- B3. Sin trampa de foco (incluido el menú nav).
- B4. `target="_blank"` siempre con `rel="noopener noreferrer"`.

## Semantics

- C1. SVGs decorativos ⇒ `aria-hidden="true"` y sin `<title>`.
- C2. SVGs significantes (icono dentro de enlace sin texto) ⇒ `aria-label` en el enlace contenedor.
- C3. Imágenes (cuando existan) con `alt` no vacío salvo decoración (`alt=""`).
- C4. Recursos "Próximamente" no son `<a>` activos: usar `<span aria-disabled="true">` con texto explícito.

## Color & contrast

- D1. Texto normal ≥ 4.5:1 contra su fondo.
- D2. Texto grande (≥ 24 px o ≥ 19 px bold) ≥ 3:1.
- D3. Estados de foco ≥ 3:1 contra el fondo.
- D4. Información NO transmitida solo por color (ej. estado "Próximamente" tiene texto).

## Motion

- E1. `@media (prefers-reduced-motion: reduce)` desactiva: `fade-up`, `pulse-glow`, blink del terminal cursor, transformaciones hover.
- E2. Sin auto-play de animaciones que se repitan más de 5 segundos sin control.

## Verification

- Automated: `pa11y-ci` con runner `axe`, estándar `WCAG2AA`. Cero violaciones serious/critical.
- Automated: Lighthouse Accessibility = 100.
- Manual: navegar la home solo con teclado y verificar A1-D4.
- Manual: VoiceOver (macOS) o NVDA recorre nav, hero, talk, pipeline, about, contact, footer y anuncia destinos correctamente.
