---
title: "Cómo construí mi pipeline de seguridad spec-driven"
date: 2026-05-11
slug: pipeline-seguridad-spec-driven
summary: "El proceso (en primera persona) detrás del pipeline DevSecOps que ejecuta 7 análisis automáticos sobre cada PR a este sitio, sin licencias y en menos de 5 minutos."
tags:
  - devsecops
  - github-actions
  - spec-driven
  - seguridad
published: true
---

Cuando empecé a diseñar este sitio quería que cumpliera una regla simple: que ninguna versión llegara a producción sin pasar por las mismas validaciones que pediría en un banco. La diferencia es que aquí soy yo el revisor, el dueño del repo y el operador del pipeline. Ese contexto me dejó probar una idea que llevaba meses dándome vueltas: tratar las políticas de seguridad como **specs versionadas**, no como una wiki que nadie consulta.

Este post es la bitácora de cómo lo armé, qué decisiones tomé en cada etapa y qué aprendí en el camino.

## Por qué empecé por las specs

En banca pasa algo muy concreto: la política existe (en un PDF, en un Confluence, en un correo) pero el código no la conoce. Cuando un equipo abre un PR, la "validación de seguridad" depende de que alguien recuerde el checklist y de que el revisor tenga tiempo. Esa fricción la llevamos años pagando.

Mi apuesta fue invertir el flujo: la spec OpenAPI es la fuente de verdad, y desde ahí derivamos todo lo demás. Si la API expone un endpoint sensible, eso se declara en la spec. Si la spec dice "este endpoint requiere autenticación", el pipeline lo verifica. No hay un humano traduciendo política a código — la política **es** código.

## Las 7 etapas, en orden de qué descarté primero

El pipeline corre como un workflow de GitHub Actions y ejecuta 7 análisis en paralelo donde se puede, secuencial donde hay dependencia. El criterio para escoger cada herramienta fue triple: que tuviera licencia abierta, que pudiera correrse en menos de un minuto cada una, y que el output fuera leíble por un humano sin formación previa en seguridad.

**1. Spec Lint con Spectral.** Antes de mirar código, miramos la spec. Spectral evalúa reglas custom sobre el OpenAPI — desde "todos los endpoints deben declarar `security`" hasta validaciones de naming bancario. Descarté StoplightStudio porque ataba el flujo a una UI; quería que las reglas vivieran en el repo como YAML.

**2. SAST con Semgrep.** Reglas declarativas, comunidad activa, falsos positivos manejables. Probé CodeQL antes pero como motor primario era demasiado lento; lo dejé para la etapa final, donde el costo se justifica.

**3. Secret Detection con Gitleaks.** Detecta API keys y credenciales filtradas en el código y en el historial. Lo elegí sobre TruffleHog por velocidad y por la facilidad para agregar patrones custom (formatos de tokens internos de bancos, por ejemplo).

**4. Dependency Scan con npm audit.** En este sitio las dependencias son devDependencies (build-time only), así que el riesgo real es bajo, pero el gate sigue ahí. Es la línea base; si el día de mañana sumo una dependencia runtime, el control ya está cableado.

**5. DAST con OWASP ZAP.** Etapa que más me costó decidir. ZAP es robusto pero pesado. Lo activo solo cuando hay cambios en la spec o en handlers de API. Para un sitio estático como este es menos crítico, pero la plantilla queda lista para proyectos donde sí hay backend.

**6. Compliance con una Custom Action.** Esta es la pieza que pega todo. Toma los resultados de las 5 etapas anteriores y los compara contra las reglas declaradas en la spec. Genera un comentario en el PR con un resumen leíble: qué pasó, qué falló, por qué falló. Sin esto, los desarrolladores tendrían que abrir 5 reportes distintos.

**7. Semantic Analysis con CodeQL (GHAS).** El cierre. Análisis de flujo de datos que detecta vulnerabilidades que las herramientas anteriores miran de a una. Aquí sí vale el costo en tiempo porque encuentra cosas que las reglas estáticas no ven.

## Los números (medibles, no aspiracionales)

Estos números son los que mido cada vez que corre el pipeline. No son metas — son lo que el pipeline efectivamente entrega hoy:

<div class="post-stats">
  <div class="stat-card">
    <p class="stat-value">7</p>
    <p class="stat-label">Etapas automáticas</p>
  </div>
  <div class="stat-card">
    <p class="stat-value">$0</p>
    <p class="stat-label">Costo de licencias</p>
  </div>
  <div class="stat-card">
    <p class="stat-value">100%</p>
    <p class="stat-label">Cobertura de la spec</p>
  </div>
  <div class="stat-card">
    <p class="stat-value">&lt;5 min</p>
    <p class="stat-label">Build time</p>
  </div>
</div>

Cero costo de licencias no es marketing: las 7 herramientas son open source o vienen con la suscripción de GitHub que ya pagaba. Cobertura del 100% sobre la spec significa que toda regla declarada se valida en CI; si una regla no se puede validar, no se acepta en la spec.

## Lo que aprendí (y lo que sigue)

Lo más útil que descubrí en el camino fue que **el output importa tanto como la detección**. Un pipeline que encuentra 30 hallazgos pero los reporta como un JSON de 4000 líneas no sirve. Por eso la etapa 6 (Compliance) terminó siendo la más invertida en tiempo de desarrollo: convertir resultados crudos en un comentario de PR que un humano puede leer en 30 segundos.

Lo que sigue en mi backlog:

- Empaquetar la Custom Action en un repo público para que sea reutilizable en bancos.
- Agregar reglas Spectral específicas para regulación bancaria centroamericana.
- Documentar el patrón completo en una charla — spoiler: lo voy a presentar en Techno Week 8.0 el 18 de mayo.

Si trabajás en banca o en plataformas reguladas y querés conversar sobre esto, escribime. Las decisiones de diseño que tomé acá no son las únicas posibles, y me interesa contrastarlas con lo que están haciendo otros equipos en LATAM.
