# Phase 1 — Data Model: Sección "Pipeline"

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Research**: [research.md](research.md)

Modelo conceptual y de validación del archivo `content/pipeline.json`. El schema JSON normativo está en [contracts/pipeline-schema.json](contracts/pipeline-schema.json); este documento explica las entidades en lenguaje de dominio.

---

## Entidad 1 — `PipelineDataFile`

Forma del archivo `content/pipeline.json` (única fuente de verdad).

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `$schema` | string (URI) | opcional | Apunta a `../specs/005-pipeline-section/contracts/pipeline-schema.json`. Habilita autocomplete en VS Code. Ignorado por el build script. |
| `items` | array de `PipelineItem` | sí | Lista plana de items. Puede estar vacía (`[]`). |

**Reglas globales**:
- Todos los `PipelineItem.id` dentro de `items` MUST ser únicos. Build falla con duplicados (R-003, FR-011).
- Encoding UTF-8, indentación 2 espacios (convención del repo). El build no impone formato beyond JSON parseable.

---

## Entidad 2 — `PipelineItem`

Un trabajo de contenido en preparación.

| Campo | Tipo | Obligatorio | Validación | Notas |
|---|---|---|---|---|
| `id` | string | sí | regex `^[a-z0-9-]{3,80}$`. Único en el archivo. | Slug-style. Inmutable: no debe cambiar entre revisiones (sería un breaking change para enlaces externos si llegásemos a usarlo). |
| `type` | enum | sí | uno de `interview`, `lab`, `talk`, `post`, `other`. | Catálogo cerrado (R-008). |
| `title` | string | sí | longitud 1..120 chars, no solo whitespace. | Visible al usuario. Permite tildes/ñ. |
| `stage` | enum | sí | uno de `coming-soon`, `review`, `in-progress`, `backlog`. | Catálogo cerrado, orden canónico (R-007). |
| `estimated` | string | opcional | longitud 0..40 chars; cuando presente, no solo whitespace. | Texto libre legible: "2026-Q3", "Mayo 2026", "Pronto". Si está ausente o vacío, no se renderiza la línea (FR-004 + edge case). |
| `description` | string | sí | longitud 10..280 chars. | 1–2 líneas. Sin HTML; el build escapa entidades. |
| `link` | string (URL) | opcional | Cuando presente, MUST hacer match con `^https:\/\/[\w.-]+(\/[\w./%#?&=+-]*)?$` **o** `^\/[\w./#?&=+-]*$` (R-009). | Permite teaser publicado (HTTPS absoluta) o ruta interna (relativa). Otros esquemas son rechazados. |

**Reglas adicionales**:
- Cualquier campo desconocido en el item hace fallar el build (modo estricto, sin pass-through silencioso).
- No se permiten campos `null` para los obligatorios; usar omisión para campos opcionales.

---

## Entidad 3 — `PipelineStage` (catálogo cerrado)

Cuatro estados con orden canónico y representación visual.

| Slug | Etiqueta visible (es) | Orden | Token de color | Símbolo no-cromático | Énfasis adicional |
|---|---|---|---|---|---|
| `coming-soon` | Pronto | 0 | `--accent` (cyan) | ✦ (estrella) | Borde acentuado, opcional pulse-glow |
| `review` | En revisión | 1 | `--green` | ◐ (semi-círculo) | Sin énfasis extra |
| `in-progress` | En progreso | 2 | `--accent` (alpha) o token existente cálido | ◆ (rombo) | Sin énfasis extra |
| `backlog` | Backlog | 3 | `--text-muted` | ○ (círculo vacío) | Tipografía atenuada |

**Reglas**:
- Solo `coming-soon` recibe énfasis visual extra (FR-007).
- Cualquier otro slug en el JSON hace fallar el build.
- El catálogo es inmutable salvo PR a esta spec.

---

## Entidad 4 — `PipelineType` (catálogo cerrado)

Cinco tipos de contenido con representación visual.

| Slug | Etiqueta visible (es) | Símbolo SVG inline | Notas semánticas |
|---|---|---|---|
| `interview` | Entrevista | burbuja de diálogo | Contenido conversacional. |
| `lab` | Laboratorio | bloque de terminal `>_` | Hands-on / código. |
| `talk` | Charla | micrófono | Presentación pública. |
| `post` | Artículo | documento de líneas | Texto largo. |
| `other` | Otro | rombo vacío | Categoría de escape para casos no clasificados. |

**Reglas**:
- Solo estos cinco tipos están permitidos en `PipelineItem.type`.
- Cada uno renderiza con su par (icono SVG inline en `currentColor` + texto).

---

## State transitions (`PipelineStage`)

El cambio de stage es **manual** (autor edita JSON). No hay transiciones automáticas. Las transiciones legítimas y esperadas:

```
                ┌─────────────┐
                │   backlog   │  (idea registrada)
                └──────┬──────┘
                       │ (autor empieza a trabajar)
                       ▼
                ┌──────────────┐
                │ in-progress  │
                └──────┬───────┘
                       │ (borrador listo, esperando revisión)
                       ▼
                ┌──────────────┐
                │   review     │
                └──────┬───────┘
                       │ (aprobado, listo a publicar)
                       ▼
                ┌──────────────┐
                │ coming-soon  │
                └──────┬───────┘
                       │ (publicación efectiva — fuera de scope spec 005)
                       ▼
              [removido del JSON]
```

**Transiciones legales adicionales**:
- Cualquier item puede regresar a un stage anterior (ej. `review → in-progress` si surgen revisiones mayores). El JSON es un snapshot del estado actual.
- Un item `coming-soon` que no se publica en plazo razonable debería retroceder a `review` o `in-progress` antes que envejecer mintiendo al visitante (R-014).

**Removal flow** (manual, documentado en quickstart):
- Cuando el contenido sale publicado, el autor remueve el item del JSON y rebuilds. La sección Pipeline deja de mostrarlo. La pieza pasa a vivir en su lugar definitivo (entrevistas/, blog/, talks/).

---

## Identifiers (I-XX)

| ID | Invariante | Origen |
|---|---|---|
| **I-1** | `pipeline.json` es la única fuente de items renderizados (cero hardcode en `index.html`) | FR-003, SC-002 |
| **I-2** | El catálogo de 4 stages y 5 types es cerrado | FR-010, R-007, R-008 |
| **I-3** | El orden visual primario es `coming-soon → review → in-progress → backlog` | FR-008 |
| **I-4** | El orden secundario dentro de cada stage es el orden de aparición en el JSON | R-004 |
| **I-5** | Todo item con `link` MUST validar como HTTPS absoluta o ruta interna `/...` | R-009 |
| **I-6** | El bloque renderizado en `index.html` vive entre `<!-- pipeline:start -->` y `<!-- pipeline:end -->` y es reemplazable de forma idempotente | R-002 |
| **I-7** | El ancla legacy `#blog` sigue funcionando sin tocar el nav externo | R-005, FR-012 |

---

**Resultado**: modelo de datos completo, sin ambigüedad. El [contracts/pipeline-schema.json](contracts/pipeline-schema.json) traduce este documento a JSON Schema Draft 7 normativo.
