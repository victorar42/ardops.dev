# Copilot Instructions — ardops.dev

Este es un sitio estático spec-driven. Antes de generar o modificar código:

1. Leé TODAS las specs en /docs/ — son la fuente de verdad
2. Si una request contradice una spec, señalalo y NO procedas sin
   confirmación explícita
3. Cero dependencias JS externas sin justificación documentada
4. Cero inline scripts ni inline styles (salvo CSS crítico declarado)
5. Todos los assets self-hosted
6. Accesibilidad WCAG 2.1 AA es no-negociable
7. Validá CSP compliance en cada cambio
8. Imágenes siempre con alt text descriptivo
9. Headings semánticamente correctos (un solo H1, jerarquía sin saltos)
10. Si agregás un componente nuevo, documentalo en
    docs/03-design-system.md

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
