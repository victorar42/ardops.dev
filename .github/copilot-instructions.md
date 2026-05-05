# Instrucciones para GitHub Copilot — ardops.dev

## Contexto del proyecto
ardops.dev es el sitio profesional de Victor Josue Ardón Rojas, DevOps
Engineer. El sitio se desarrolla bajo **Spec-Driven Development** usando
GitHub Spec Kit. Es un sitio estático desplegado en GitHub Pages con
dominio personalizado.

## Reglas de oro

1. **Leé la constitución antes de proponer cualquier cambio:**
   `.specify/memory/constitution.md`

2. **Leé la referencia visual siempre que generes HTML/CSS:**
   `.reference/v1-design/index.html`
   La paleta, tipografías y animaciones de ese archivo son la fuente
   de verdad estética. NO inventes colores, NO cambies fonts.

3. **Respetá el flujo Spec Kit:**
   - Para una nueva feature/sección → `/specify`
   - Para diseñar la implementación → `/plan`
   - Para descomponer en tareas → `/tasks`
   - Para implementar → `/implement`
   No escribas código fuera de este flujo salvo correcciones triviales.

4. **Antes de implementar, leé:**
   - `.specify/memory/constitution.md`
   - La spec activa en `specs/[feature]/spec.md`
   - El plan en `specs/[feature]/plan.md`
   - Las tasks en `specs/[feature]/tasks.md`

5. **Si te pido algo que viola la constitución, deteneme.**
   No asumas, no "encontrés un workaround". Decímelo y esperá decisión.

6. **Convenciones técnicas:**
   - HTML semántico (header, nav, main, section, article, footer)
   - CSS con variables (`var(--accent)`, no `#22d3ee` hardcodeado)
   - Mobile-first
   - Sin frameworks JS salvo justificación en spec
   - Sin inline JS, sin inline styles (excepto el CSS crítico declarado)
   - Imágenes con alt obligatorio, lazy loading donde aplique
   - Headings semánticamente correctos (un H1, sin saltos de jerarquía)

7. **Cuando generés un PR description, incluí:**
   - Spec ID que cumple
   - Sección de la constitución relevante
   - Checklist de gates aplicables (a11y, perf, security)

<!-- SPECKIT START -->
**Plan activo**: [`specs/005-pipeline-section/plan.md`](../specs/005-pipeline-section/plan.md)
<!-- SPECKIT END -->
