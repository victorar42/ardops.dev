# Constitución del Proyecto ardops.dev

Estos principios son **inmutables y no-negociables**. Toda spec, plan,
tarea o implementación debe respetarlos. Si alguna request los
contradice, el agente debe señalarlo y detenerse.

## I. Spec-Driven obligatorio
Ninguna línea de código se escribe sin una spec aprobada en `specs/`.
El orden es: `/specify` → `/plan` → `/tasks` → `/implement`. Saltarse
fases es violación constitucional.

## II. Identidad visual preservada
La referencia visual está en `.reference/v1-design/index.html`. Toda
implementación debe respetar:
- Paleta exacta (variables CSS `--bg-primary`, `--accent`, `--green`, etc.)
- Tipografías: JetBrains Mono (mono) + Outfit (body)
- Estética terminal/code-first con grain overlay
- Animaciones existentes (fade-up, pulse-glow, terminal cursor)
Cualquier desviación debe documentarse y justificarse en la spec.

## III. Sitio 100% estático
No hay backend, no hay build server-side, no hay base de datos.
HTML + CSS + JS vanilla o un generador estático justificado en plan.

## IV. Cero dependencias JS de terceros sin justificación
Si una feature requiere una lib externa, debe documentarse en la spec
con: justificación, alternativas evaluadas, peso, integridad (SRI),
licencia. Default: vanilla.

## V. Fonts y assets self-hosted
Cero llamadas a CDNs externos en runtime (incluido Google Fonts).
Todo asset se sirve desde el propio dominio.

## VI. Accesibilidad WCAG 2.1 AA
No-negociable. Lighthouse Accessibility = 100. Contraste mínimo 4.5:1.
Navegación 100% por teclado. Sin esto, la spec no se aprueba.

## VII. Performance es feature
Lighthouse Performance ≥ 95. LCP < 2.5s, CLS < 0.1, INP < 200ms.
Cualquier feature que degrade estos números debe rediseñarse.

## VIII. Seguridad por defecto
- CSP estricto (sin 'unsafe-eval', mínimo 'unsafe-inline')
- HTTPS forzado
- Cero secrets en repo
- Cero tracking de terceros
- SRI en todo recurso externo (si se justifica)

## IX. Cada PR pasa todas las gates
Lint, validación de specs, security scan, a11y, performance, link check.
Si una gate falla, el PR no se mergea. Sin excepciones.

## X. Documentación versionada
Todo archivo en `specs/`, `docs/` y `.specify/` se commitea.
Las decisiones viven en git, no en Slack ni en la cabeza de nadie.

---

**Owner:** Victor Josue Ardón Rojas
**Última revisión constitucional:** [fecha]
**Versión:** 1.0.0

Modificar esta constitución requiere PR con justificación explícita y
bump de versión semántico.
