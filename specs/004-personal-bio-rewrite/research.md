# Phase 0 — Research: Reescritura de Bio Personal

**Feature**: 004-personal-bio-rewrite
**Date**: 2026-04-28
**Status**: Resolved (no `[NEEDS CLARIFICATION]` markers)

Este documento consolida las decisiones que sustentan el plan. Cada decisión sigue el formato **Decisión / Racional / Alternativas evaluadas**.

---

## R-001 — Voz narrativa: primera persona cálida-técnica

- **Decisión**: el copy se escribe en primera persona del singular ("Soy …", "Me dedico a …", "Trabajo en …"), tono cálido sin perder rigor técnico.
- **Racional**: el brief y la spec lo exigen. Investigaciones de UX writing (Nielsen Norman Group, MailChimp Voice Guide) muestran que la primera persona aumenta la percepción de cercanía y reduce el tiempo de procesamiento del mensaje en sitios personales.
- **Alternativas evaluadas**:
  - *Tercera persona* ("Victor es un DevOps Engineer …"): rechazada — produce el mismo efecto CV/LinkedIn que motivó la spec.
  - *Plural editorial* ("Construimos pipelines …"): rechazada — el sitio es claramente personal, el "nosotros" suena pretencioso.
  - *Sin pronombres* (estilo telegráfico): rechazada — pierde calidez, gana rigidez.

---

## R-002 — Gate `tests/no-placeholders.sh`: opcional pero recomendado

- **Decisión**: implementar un gate bash trivial (`grep` recursivo limitado a archivos servidos) que verifica ausencia de `[Tu Nombre]`, `TODO`, `FIXME`, `XXX`. Se añade al CI como job paralelo. Si en una iteración futura genera falsos positivos costosos, se puede degradar a opcional sin coste estructural.
- **Racional**: la auditoría manual de US2 es one-shot; un gate la convierte en garantía perpetua a coste cercano a cero (< 1 s en CI). Encaja con principio constitucional IX (cada PR pasa todas las gates).
- **Alternativas evaluadas**:
  - *Sin gate (auditoría manual)*: rechazada — la siguiente vez que se introduzca un placeholder, se descubrirá tarde.
  - *Gate en `forbidden-urls.sh`*: rechazada — ese script tiene contrato distinto (URLs prohibidas pre-Techno-Week 8.0); mezclar contratos confunde.
  - *Pre-commit hook*: rechazada — el repo no exige hooks locales y no todos los colaboradores los tendrían instalados.

---

## R-003 — Patrones de placeholder a buscar

- **Decisión**: la regex extendida del gate cubre cuatro patrones:
  1. `\[Tu Nombre\]` (literal histórico)
  2. `\bTODO\b`
  3. `\bFIXME\b`
  4. `\bXXX\b`
- **Racional**: son los patrones explícitos del brief. Patrones genéricos `\[[A-Z][^\]]*\]` se consideraron, pero generan ruido (links Markdown, JSON-LD, atributos `[role=…]` en CSS extraído, etc.). El alcance acotado a archivos servidos (R-004) ya minimiza el riesgo de falsos negativos.
- **Alternativas evaluadas**:
  - *Patrón genérico `\[[^\]]+\]`*: rechazado — falso positivo seguro en bloques `<script type="application/ld+json">` y meta tags con `[og:image]`.
  - *Patrón con boundary `\bTODO:\b`*: rechazado — pierde TODOs sueltos.

---

## R-004 — Archivos auditados por el gate

- **Decisión**: el gate barre exclusivamente:
  - `index.html`, `404.html`
  - `blog/index.html`, `talks/index.html`, `interviews/index.html` (cuando existe tras build)
  - `interviews/*.html` (cuando existen tras build)
  - `sitemap.xml`, `robots.txt`
  - `public/favicon/*.webmanifest`
- **Racional**: solo archivos servidos al visitante. Archivos de proyecto (`docs/`, `specs/`, `tests/`, `scripts/`, `.specify/`, `assets/css|js`, `content/`, `legacy/`, `package.json`, `README.md`) están explícitamente excluidos porque pueden contener `TODO` legítimos en código fuente y notas técnicas.
- **Alternativas evaluadas**:
  - *Barrer todo el repo*: rechazado — falsos positivos en `legacy/` y `docs/`; coste de mantenimiento del exclude-list crece.
  - *Solo `*.html`*: rechazado — ignora `sitemap.xml` y `robots.txt`, archivos servidos donde un placeholder también sería visible para crawlers.

---

## R-005 — Longitud del hero copy

- **Decisión**: target 60 palabras ± 10% (rango operativo 54–66; hard limit FR-003: 40–90).
- **Racional**: a 220 ppm (R-007 spec 003), 60 palabras se leen en ~16 s — encaja en el "10–20 s para decidir si quedarse". Lecturas en mobile (380 px, ~28–34 chars/línea con Outfit) producen 6–7 líneas, sin presionar el fold.
- **Alternativas evaluadas**:
  - *Más corto (≤ 40)*: rechazado — el brief pide rol + sector + dato humano + motivación; debajo de 40 palabras se sacrifica claridad.
  - *Más largo (≥ 90)*: rechazado — replica el problema de longitud del copy actual.

---

## R-006 — Mención humana: combinar familia + fútbol

- **Decisión**: una sola oración corta integra ambos datos. Ejemplo de plantilla (no normativo): "Fuera del trabajo soy papá de tres — dos chicos y una chica — y si hay fútbol de por medio, mejor."
- **Racional**: dos oraciones separadas dispersan la conexión emocional; una sola permite la transición rápida de vuelta al rol profesional. Mantiene FR-007 (no nombres ni edades).
- **Alternativas evaluadas**:
  - *Solo familia*: rechazada — el brief pide ambos.
  - *Solo fútbol*: rechazada — la familia es el dato humano de mayor peso.
  - *Lista bullet*: rechazada — choca con el tono cálido y con FR-004 ("en prosa, no como bullets").

---

## R-007 — Firma corta

- **Decisión**: nombre legal completo "Victor Josue Ardón Rojas" aparece **una sola vez** como `<h1>` del hero. Referencias subsecuentes en el copy usan "Victor" o "Victor Ardón".
- **Racional**: el brief lo confirma explícitamente. Repetir el nombre legal completo más de una vez resulta robótico.
- **Alternativas evaluadas**:
  - *Repetir "Victor Ardón Rojas" en about*: rechazada — redundante.
  - *Usar solo "Josue"*: rechazada — el brief eligió "Victor Ardón" como firma.

---

## R-008 — Encoding del nombre

- **Decisión**: usar Unicode `ó` (U+00F3) directo en UTF-8. Verificado en estado actual de `index.html` (línea 148).
- **Racional**: encoding declarado en `<meta charset="UTF-8">`. `&oacute;` es legacy; rompe búsquedas regex y screen readers en algunos navegadores antiguos.
- **Alternativas evaluadas**:
  - *Entidad HTML `&oacute;`*: rechazada — no aporta nada y reduce legibilidad del fuente.

---

## R-009 — Meta descriptions

- **Decisión**: actualizar `<meta name="description">` y `<meta property="og:description">` con un texto ≤ 160 chars en primera persona que mantenga las keywords críticas (DevSecOps, banca, Costa Rica).
- **Racional**: search engines y previews sociales muestran este string al primer impacto. Si la home cambia de tono pero los snippets siguen siendo CV-style, los clicks llegan con expectativa equivocada.
- **Alternativas evaluadas**:
  - *No tocar metas*: rechazada — desfasa la voz pública.
  - *Generar dos versiones (description vs og)*: rechazada — sobre-ingeniería; un único string sirve a ambos canales.

---

## R-010 — JSON-LD `Person` schema

- **Decisión**: si `index.html` contiene `<script type="application/ld+json">` con un objeto `Person` o `WebSite`/`author`, alinear los campos `name` y `description` con la nueva voz. Si no contiene tal bloque, no se añade en esta spec.
- **Racional**: schema.org consumido por Google Knowledge Graph y rich snippets. Inconsistencia entre HTML visible y structured data daña SEO.
- **Alternativas evaluadas**:
  - *Añadir bloque `Person` aunque no exista*: rechazada — fuera de alcance; spec separada si se decide priorizar.

---

## R-011 — `p.about-stack` (chip técnico)

- **Decisión**: mantener la línea decorativa con tecnologías ("GitHub Actions · DevSecOps · OpenAPI · OWASP · IaC · Kubernetes · CI/CD") **después** de la prosa cálida del about. Funciona como firma técnica visual, no como bio.
- **Racional**: el brief prohíbe enumeraciones en la **bio** (FR-003), pero la chip técnica es un componente visual distinto, semánticamente complementario. Los tokens `·` se renderizan como puntos centrados (no como bullets) y refuerzan la identidad terminal/code-first (constitución II).
- **Alternativas evaluadas**:
  - *Eliminar la chip*: rechazada — pierde un elemento de identidad visual valorado.
  - *Mover la chip al hero*: rechazada — duplica info visual cerca del `h1`.

---

## R-012 — Tono regional

- **Decisión**: máximo **un** giro coloquial tico en todo el copy del home (ejemplo de plantilla: "del tico", "pura vida" — no se aprueba contenido específico aquí; queda a discreción del autor en el contract).
- **Racional**: la calidez tica es un diferenciador real para visitantes locales. Sobre-usarla aliena a hispanohablantes de otras regiones (Spain, Mexico, Argentina, US bilingual).
- **Alternativas evaluadas**:
  - *Cero modismos*: rechazada — pierde la oportunidad de diferenciación.
  - *Modismos en cada párrafo*: rechazada — convierte el sitio en parodia regional.

---

## R-013 — Coherencia con 404

- **Decisión**: revisar el copy de `404.html` durante la implementación. Si rompe la voz nueva (por ejemplo, mensaje genérico tipo "Page Not Found" o "Error 404 — La página no existe"), ajustarlo. Si ya es coherente, dejarlo.
- **Racional**: 404 forma parte del recorrido del visitante; un mensaje despersonalizado tras un hero cálido es disonante.
- **Alternativas evaluadas**:
  - *Spec separada*: rechazada — el ajuste es trivial si se necesita; integrarlo en US3 mantiene el PR atómico.

---

## R-014 — Integración del gate en CI

- **Decisión**: añadir un job dedicado `no-placeholders` en `.github/workflows/ci.yml`. Ejecuta `bash tests/no-placeholders.sh` directamente sobre el árbol del repo en `actions/checkout@v4`. No depende del job de build de interviews (no necesita el HTML generado para detectar placeholders en archivos fuente; los `interviews/*.html` se ignoran porque están gitignored y no aparecen en el checkout).
- **Racional**: paralelo y barato (< 1 s). Falla rápido si alguien introduce un placeholder. Independencia operativa (no requiere setup-node ni npm).
- **Alternativas evaluadas**:
  - *Inyectar el grep dentro del job `html-validate`*: rechazada — acopla dos contratos (validación sintáctica vs higiene de contenido) y oculta el modo de fallo.
  - *Ejecutar tras el build de interviews*: rechazada — añade dependencia innecesaria; los placeholders en `interviews/*.html` (si surgieran) son un problema separado del generador, no de esta spec.

---

## Resumen ejecutivo

| Decisión | Síntesis |
|---|---|
| Tono | Primera persona, cálida-técnica, 60 palabras ±10% en hero |
| Datos humanos | Familia (3 hijos, 2 chicos + 1 chica) + fútbol, en una oración |
| Nombre | "Victor Josue Ardón Rojas" en `h1`; "Victor Ardón" / "Victor" en prosa |
| Metas | `description` y `og:description` reescritos ≤ 160 chars |
| Gate | `tests/no-placeholders.sh` + job CI dedicado |
| Patrones | `[Tu Nombre]`, `TODO`, `FIXME`, `XXX` en archivos servidos |
| Layout | Sin cambios estructurales; reuso de CSS existente |
| Constitución | Sin violaciones (verificado en plan.md) |
