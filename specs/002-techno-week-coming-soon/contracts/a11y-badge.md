# Contract: Accesibilidad del badge "Próximamente"

**Feature**: 002-techno-week-coming-soon  
**Date**: 2026-04-28  
**Aplica a**: el elemento `.talk-badge.talk-badge--coming` en estado `teaser`.

Este contrato define los requisitos de accesibilidad del badge para garantizar **WCAG 2.1 AA** y mantener Lighthouse Accessibility = 100 (constitución VI).

---

## Estructura semántica requerida

```html
<p class="talk-badge talk-badge--coming"
   role="status"
   aria-label="Contenido próximamente, disponible el 18 de mayo de 2026">
  <span aria-hidden="true">★</span>
  Próximamente · 18 mayo 2026
</p>
```

| Atributo | Valor | Justificación |
|---|---|---|
| `role="status"` | sí | Anuncia cambios no urgentes a tecnologías asistivas. Apropiado para "estado del contenido". Alternativa rechazada: `role="alert"` (urgente, no aplica). |
| `aria-label` | texto completo y fechado | Sustituye al texto visual + glifo decorativo, comunicando estado **y** fecha en una sola lectura. WCAG 1.1.1 (Non-text Content). |
| `aria-hidden="true"` en el `<span>` del glifo | sí | El `★` es decorativo. Evita lecturas redundantes ("estrella, próximamente..."). |

---

## Contraste

Tokens involucrados (ver `assets/css/tokens.css`):

- Texto del badge: `var(--accent)` = `#22d3ee`.
- Fondo del badge: `var(--accent-dim)` = `rgba(34, 211, 238, 0.15)` sobre `var(--bg-card)` = `#1a2235`.
- Color compuesto del fondo (alpha sobre `--bg-card`): aprox `#22323e`.

**Cálculo aproximado** del ratio `#22d3ee` sobre `#22323e`:
- Luminancia `#22d3ee` ≈ 0.586
- Luminancia `#22323e` ≈ 0.029
- Ratio ≈ (0.586 + 0.05) / (0.029 + 0.05) ≈ **8.05:1** ✅ (≥ 4.5:1 requerido para texto normal AA; ≥ 7:1 para AAA).

**Verificación obligatoria** durante implementación (con la herramienta de DevTools del navegador o `pa11y`):
- Texto del badge sobre fondo: ≥ 4.5:1 (AA texto normal) — **Must**.
- Si se opta por texto pequeño (< 14pt regular o < 18pt bold no aplica aquí; el badge es 0.75rem ≈ 12px regular): ratio mínimo igualmente 4.5:1.

Si el cálculo final en CI/devtools no alcanza 4.5:1 con los tokens elegidos, ajustar la opacidad de `--accent-dim` o el color del texto reaprovechando tokens existentes (no crear nuevos colores hardcoded; constitución II).

---

## Foco y navegación por teclado

- El badge es **no-interactivo** (no es enlace ni botón). Por tanto **no recibe foco** por tab. Esto es deliberado: no hay acción asociada.
- Si en el futuro se decide hacerlo clickeable (e.g. para abrir un modal con la fecha), debe convertirse en `<button>` con foco visible (`:focus-visible` ya existe en `assets/css/base.css` línea 103 para `.resource-link`).
- El bloque hermano `<p class="talk-cta-info">` también es texto plano no-focusable, alineado con FR-006 (CTA informativa, no enlace).

---

## Reduced motion

- Si se aplica una animación al badge (e.g. pulso suave usando `pulse-glow` de `motion.css`), debe respetarse `prefers-reduced-motion`:
  - O bien envolverla en `@media (prefers-reduced-motion: no-preference) { ... }`.
  - O bien neutralizarla con `@media (prefers-reduced-motion: reduce) { .talk-badge--coming { animation: none; } }`.
- WCAG 2.3.3 (Animations from Interactions, AAA pero recomendado).

---

## Localización (`lang`)

- El sitio declara `<html lang="es">` en ambos surfaces. El texto del badge está en español, coherente con la página.
- Si en el futuro se internacionaliza, el `aria-label` debe traducirse junto con el texto visual.

---

## Reading order

El badge aparece **antes** del título de la charla (`.talk-title`). Razón:
- Comunica primero el "estado" (próximamente) y luego el "qué" (título), lo cual reduce confusión para quien escanea por encima.
- El lector de pantalla leerá: `[role=status: "Contenido próximamente, disponible el 18 de mayo de 2026"]` → `<h3>Seguridad como Código...</h3>` → resto.

---

## Pruebas de aceptación

- AC-A11Y-1: `pa11y` con la config existente (`tests/pa11y.config.js`) sobre `index.html` y `talks/index.html` retorna 0 issues.
- AC-A11Y-2: Lighthouse Accessibility de `index.html` y `talks/index.html` = **100**.
- AC-A11Y-3: VoiceOver (macOS) anuncia "Contenido próximamente, disponible el 18 de mayo de 2026" al llegar al landmark de la sección Talk.
- AC-A11Y-4: Navegación por teclado no detiene el foco en el badge ni en el texto `.talk-cta-info`.
- AC-A11Y-5: Contraste verificado con DevTools / Stark / `pa11y` ≥ 4.5:1.
